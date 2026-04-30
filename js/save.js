const LS_PREFIX='mpt_';
const LS={
  get:(k)=>{try{return localStorage.getItem(LS_PREFIX+k);}catch(e){return null;}},
  set:(k,v)=>{try{localStorage.setItem(LS_PREFIX+k,v);return true;}catch(e){return false;}},
  del:(k)=>{try{localStorage.removeItem(LS_PREFIX+k);}catch(e){}}
};
// Migración one-shot v40→v41: claves sin prefijo → mpt_*
(function migrateLS_v41(){
  try{
    if(localStorage.getItem(LS_PREFIX+'migrated_v41'))return;
    const legacy=['trail_unlocked'];
    for(let i=0;i<10;i++)legacy.push('trail_save_slot_'+i);
    legacy.forEach(k=>{
      const v=localStorage.getItem(k);
      if(v!==null){
        const nk=k.replace(/^trail_/,'');
        try{localStorage.setItem(LS_PREFIX+nk,v);localStorage.removeItem(k);}catch(e){}
      }
    });
    localStorage.setItem(LS_PREFIX+'migrated_v41','1');
  }catch(e){}
})();
const GAME_BUILD=61; // incrementar con cada versión del juego
const SAVE_KEY='save_slot_';
const SAVE_VERSION='TRAIL_SAVE_V2';
const NUM_SLOTS=5;

// Devuelve una copia de G sin las claves transitorias (prefijo _)
// Evita serializar timers, cachés de HTML, borradores de UI, etc.
function serializableState(){
  const clean={};
  for(const k in G){
    if(!k.startsWith('_')) clean[k]=G[k];
  }
  return JSON.parse(JSON.stringify(clean));
}

// Fusiona un save con freshState() para añadir campos nuevos que no existían
// cuando se creó el save. Garantiza que cargar una partida vieja no deja
// propiedades undefined que revienten el render.
function migrateState(saved){
  const base=freshState();
  const merged={...base,...saved};
  // Merge profundo en las estructuras anidadas críticas
  if(saved.runner){
    merged.runner={...base.runner,...saved.runner};
    merged.runner.stats={...base.runner.stats,...(saved.runner.stats||{})};
  }
  merged.sponsors={...base.sponsors,...(saved.sponsors||{})};
  merged.spending={...base.spending,...(saved.spending||{})};
  merged.workByQuarter={...base.workByQuarter,...(saved.workByQuarter||{})};
  merged.vacByQuarter={...base.vacByQuarter,...(saved.vacByQuarter||{})};
  merged.openQuarters={...base.openQuarters,...(saved.openQuarters||{})};
  merged.fameActionsThisSeason={...(saved.fameActionsThisSeason||{})};
  merged.personalBests={...(saved.personalBests||{})};
  merged.careerRaceHistory={...(saved.careerRaceHistory||{})};
  merged.circuitPoints={...(saved.circuitPoints||{})};
  merged.rivalRetirements={...(saved.rivalRetirements||{})};
  merged.midRaceEventTriggered={...(saved.midRaceEventTriggered||{})};
  // Asegurar arrays
  ['selectedRaces','raceResults','careerHistory','rivals','liveClass','lastRaceGains',
   'injuryHistory','monthlyEvents','sponsorPenalties','joinedCircuits','circuitCompleted',
   'seasonDiary','aidSelected','paceLog','rivalChildren','lifePendingAthletes',
   'coachSelectedRaces','coachRaceResults','coachAthleteHistory','coachDecisionLog',
   'coachEventLog','coachRoster','coachSponsors','unlockedAchievements',
   'utCalendar','utResults','utCrewActivo','backyardHistory','mdsHistorialEtapas',
   'clubLegadoAthletes','clubMilestones','ownBrandEvents','cnVetHistory','cnRaceResults','cnSelectedRaces']
    .forEach(k=>{if(!Array.isArray(merged[k]))merged[k]=Array.isArray(base[k])?[...base[k]]:[];});
  merged.utMochila={...(saved.utMochila||{})};
  merged.utSponsors={...(saved.utSponsors||{})};
  merged.utCurrentRaceState=(saved.utCurrentRaceState||null);
  merged.utCareerLegacy=(saved.utCareerLegacy||null);
  // Deep-merge de objetos anidados adicionales
  if(saved.dog)          merged.dog={...base.dog,...saved.dog};
  if(saved.club)         merged.club={...base.club,...saved.club};
  if(saved.clubModeData) merged.clubModeData={...base.clubModeData,...saved.clubModeData};
  if(saved.ownBrand)     merged.ownBrand={...base.ownBrand,...saved.ownBrand};
  if(saved.cnRaceState)  merged.cnRaceState={...base.cnRaceState,...saved.cnRaceState};
  if(saved.coachAthlete) merged.coachAthlete={...base.coachAthlete,...saved.coachAthlete};
  if(saved.lifeAthlete)  merged.lifeAthlete={...base.lifeAthlete,...saved.lifeAthlete};
  if(saved.legadoData)   merged.legadoData={...base.legadoData,...saved.legadoData};
  if(saved.trainingMomentum) merged.trainingMomentum={...base.trainingMomentum,...saved.trainingMomentum};
  if(saved.trainingBlock)merged.trainingBlock={...base.trainingBlock,...saved.trainingBlock};
  return merged;
}

// Valida y sanea un estado. Clampa numéricos, limita strings, asegura shape mínimo.
// No muta el input — devuelve una copia saneada o null si es inválido.
function sanitizeState(raw){
  if(!raw||typeof raw!=='object')return null;
  if(!raw.runner||typeof raw.runner!=='object')return null;
  if(!raw.runner.stats||typeof raw.runner.stats!=='object')return null;
  if(typeof raw.runner.name!=='string')return null;
  if(typeof raw.year!=='number'||!Number.isFinite(raw.year))return null;
  if(typeof raw.money!=='number'||!Number.isFinite(raw.money))return null;
  const s=JSON.parse(JSON.stringify(raw));
  const clampI=(v,lo,hi,def)=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):def;};
  s.runner.name=String(s.runner.name||'').slice(0,30);
  s.runName=String(s.runName||'').slice(0,40);
  s.year=clampI(s.year,1,50,1);
  s.money=clampI(s.money,0,9999999,0);
  s.runner.age=clampI(s.runner.age,14,80,25);
  s.runner.energy=clampI(s.runner.energy,0,100,100);
  s.runner.hydration=clampI(s.runner.hydration,0,100,100);
  s.runner.legs=clampI(s.runner.legs,0,100,100);
  ['resistencia','velocidad','subida','bajada','nutricion','mental'].forEach(k=>{
    s.runner.stats[k]=clampI(s.runner.stats[k],0,100,50);
  });
  s.ranking=clampI(s.ranking,1,999,999);
  s.specRanking=clampI(s.specRanking,1,999,999);
  s.bodyLoad=clampI(s.bodyLoad,0,100,0);
  s.currentRaceIdx=clampI(s.currentRaceIdx,0,50,0);
  s.followers=clampI(s.followers,0,99999999,0);
  s.coachReputation=clampI(s.coachReputation,0,100,0);
  s.coachTrust=clampI(s.coachTrust,0,100,60);
  return s;
}

function saveToSlot(slot){
  try{
    const state=serializableState();
    state._build=GAME_BUILD;
    const data={v:SAVE_VERSION,ts:Date.now(),state};
    LS.set(SAVE_KEY+slot, JSON.stringify(data));
    return true;
  }catch(e){return false;}
}

function loadFromSlot(slot){
  try{
    const raw=LS.get(SAVE_KEY+slot);
    if(!raw)return null;
    const data=JSON.parse(raw);
    if(!data||!data.state)return null;
    const safe=sanitizeState(data.state);
    if(!safe)return null;
    data.state=migrateState(safe);
    return data;
  }catch(e){return null;}
}

function deleteSlot(slot){
  LS.del(SAVE_KEY+slot);
}

function getAllSlots(){
  const slots=[];
  for(let i=0;i<NUM_SLOTS;i++){
    const data=loadFromSlot(i);
    slots.push({slot:i, data});
  }
  return slots;
}

function exportSlotToClipboard(slot){
  const data=loadFromSlot(slot);
  if(!data){alert('Ranura vacía.');return;}
  // TextEncoder + base64 estándar (evita escape/unescape deprecados)
  const bytes=new TextEncoder().encode(JSON.stringify(data.state));
  let bin='';for(let i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);
  const txt=SAVE_VERSION+'::'+btoa(bin);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>{
      alert('✓ Partida copiada al portapapeles. Pégala donde quieras para guardarla.');
    }).catch(()=>fallbackCopy(txt));
  } else fallbackCopy(txt);
}

function fallbackCopy(txt){
  const ta=document.createElement('textarea');
  ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.focus();ta.select();
  try{document.execCommand('copy');alert('✓ Partida copiada al portapapeles.');}
  catch(e){alert('No se pudo copiar automáticamente. Selecciona el texto manualmente.');}
  document.body.removeChild(ta);
}

function importFromText(txt, slot){
  try{
    const clean=txt.trim();
    if(!clean.startsWith(SAVE_VERSION+'::'))throw new Error('Formato no reconocido');
    const b64=clean.slice(SAVE_VERSION.length+2);
    const bin=atob(b64);
    const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    const json=new TextDecoder().decode(bytes);
    const raw=JSON.parse(json);
    const safe=sanitizeState(raw);
    if(!safe)throw new Error('Estado inválido');
    const state=migrateState(safe);
    const data={v:SAVE_VERSION,ts:Date.now(),state};
    LS.set(SAVE_KEY+slot, JSON.stringify(data));
    return true;
  }catch(e){return false;}
}

function autoSave(){
  if(G._saveSlot==null)return;
  if(G.gameMode==='coach'){saveCoachSlot();return;}
  try{saveToSlot(G._saveSlot);}catch(e){}
}

function slotLabel(data){
  if(!data)return null;
  const s=data.state;
  const name=esc(s.runner?.name||'Corredor');
  const runName=esc(s.runName||'');
  const year=s.year||1;
  const ranking=s.ranking<900?'#'+s.ranking:'—';
  const specRanking=s.specRanking&&s.specRanking<900?'#'+s.specRanking:'—';
  const specLabel=SPEC_LABEL;
  const spec=specLabel[s.runner?.specialty]||'—';
  const mode={facil:'🟢 Fácil',medio:'🟡 Medio',dificil:'🔴 Difícil',hardcore:'💀 Hardcore',expres:'⚡ Exprés'}[s.gameMode||'medio'];
  const totalKm=s.totalCareerKm||0;
  const date=new Date(data.ts).toLocaleDateString('es-ES',{day:'2-digit',month:'short'});
  // Fase del arco narrativo
  const phase=s.carreraVida?{
    runner:  '🏃 Corredor',
    overlap: '🏃 · 📋 Solapamiento',
    coach:   '📋 Entrenador',
    club:    '🏕 Club',
  }[s.lifecyclePhase||'runner']:null;
  return {name,runName,year,ranking,specRanking,spec,mode,totalKm,date,phase};
}
