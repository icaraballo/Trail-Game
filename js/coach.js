function updateEmotionalState(){
  const trust=G.coachTrust||60;
  const load=G.coachBodyLoad||0;
  const results=G.coachRaceResults||[];
  const log=G.coachDecisionLog||[];
  const prev=G.coachEmotionalState||'fresco';

  // Decisiones positivas en log
  const posDecisions=log.filter(d=>d.positive).length;
  const negDecisions=log.filter(d=>!d.positive).length;

  // Racha reciente (últimas 2 carreras)
  const recent=results.slice(-2);
  const recentBad=recent.filter(r=>r.dnf||r.pos>15).length;
  const recentGood=recent.filter(r=>!r.dnf&&r.pos<=5).length;

  let next=prev;

  if(prev==='quemado'){
    // Puede recuperarse si trust sube y hay decisiones positivas
    if(trust>=60&&posDecisions>=2)next='recuperado';
  } else if(prev==='recuperado'){
    if(recentGood>=1&&trust>=65)next='confiado';
    else if(load>85||negDecisions>posDecisions)next='dudoso';
  } else if(prev==='confiado'){
    if(recentBad>=2||trust<40)next='dudoso';
    else if(load>90)next='quemado';
  } else if(prev==='dudoso'){
    if(trust>=70&&recentGood>=1)next='confiado';
    else if(trust<30||load>85)next='quemado';
    else if(posDecisions>=3&&trust>=50)next='fresco';
  } else { // fresco
    if(recentGood>=1&&trust>=65)next='confiado';
    else if(recentBad>=2||trust<35)next='dudoso';
    else if(load>90)next='quemado';
  }

  if(next!==prev){
    G.coachEmotionalState=next;
    const es=EMOTIONAL_STATES[next];
    showToast(`${es.emoji} ${G.coachAthlete?.name?.split(' ')[0]||'Atleta'}: estado → ${es.label}`,'#555');
  }
}
// ── Estilos de entrenador (E10) ─────────────────────────────────────────────
function updateCoachTrait(){
  if(!G.coachDecisionLog)return;
  const log=G.coachDecisionLog;
  const hist=G.coachAthleteHistory||[];
  for(const t of TRAINER_TRAITS){
    try{if(t.condition(log,hist)){G.coachTrait=t.id;return;}}catch(e){}
  }
}
// type: string id único | label: texto legible | positive: bool
function logCoachDecision(type, label, positive){
  if(!G.coachDecisionLog)G.coachDecisionLog=[];
  // No duplicar el mismo tipo en la misma temporada
  const alreadyThisSeason=G.coachDecisionLog.some(d=>d.type===type&&d.season===G.coachSeason);
  if(alreadyThisSeason)return;
  G.coachDecisionLog.push({type,label,positive,season:G.coachSeason});
  // Mantener máximo 12 entradas totales (histórico multi-temporada)
  if(G.coachDecisionLog.length>12)G.coachDecisionLog.shift();
}
function clubLevelByRep(){
  const rep=(G.clubModeData&&G.clubModeData.reputacion)||0;
  const lvls=[...CLUB_LEVELS].reverse();
  return lvls.find(l=>rep>=l.repReq)||CLUB_LEVELS[0];
}

function simClubRace(runner,race,clubData){
  const d=clubData||G.clubModeData||{};
  const s=runner.stats;
  let base=(s.resistencia*0.35+s.velocidad*0.2+s.subida*0.25+s.bajada*0.2);

  // Bonus por especialidad vs terreno
  if(runner.spec==='montanero')base+=race.dist>30?4:2;
  if(runner.spec==='fondista') base+=race.dist>40?5:0;
  if(runner.spec==='tecnico')  base+=race.dist<25?3:0;

  // C8 Rol
  const role=CLUB_ROLES[runner.role||'normal']||CLUB_ROLES.normal;
  base+=role.perfBonus||0;
  if(role.specBonus&&runner.spec===d.specialty)base+=6;

  // C9 Filosofía: bonus si especialidad coincide
  const fil=d.filosofia?CLUB_FILOSOFIAS[d.filosofia]:null;
  if(fil&&fil.specBonus&&runner.spec===fil.specBonus)base+=5;
  if(fil&&fil.raceBonus&&fil.raceBonus.includes(race.tier))base+=3;

  // C6 Cohesión: ±5% rendimiento
  const cohMod=((d.cohesion||50)-50)/500; // -0.1 a +0.1
  base*=(1+cohMod);

  // C11 Staff: entrenador da bonus
  if(d.staff&&d.staff.entrenador)base+=3;

  // C15 Infraestructura: gimnasio mejora base
  if(d.instalaciones&&d.instalaciones.gimnasio)base+=2;

  const rng=(Math.random()*16)-8;
  const perf=Math.max(10,Math.min(98,base+rng));
  const rivals={local:18,regional:35,nacional:70,elite:110}[race.tier||'local']||25;
  const pos=Math.max(1,Math.round((1-perf/100)*rivals*0.85)+1+Math.floor(Math.random()*3));
  const prize=pos===1?race.prize:pos===2?Math.round(race.prize*0.6):pos===3?Math.round(race.prize*0.4):0;

  // C11 Staff fisio reduce DNF
  const dnfChance=base<30?0.12:0;
  const injReduction=(d.staff&&d.staff.fisio?CLUB_STAFF_TYPES.fisio.injuryReduction:0)
    +(fil&&fil.injuryReduction?fil.injuryReduction:0);
  const isDnf=dnfChance>0&&Math.random()<(dnfChance*(1-injReduction));

  return{pos:isDnf?99:pos, perf:Math.round(perf), prize:isDnf?0:prize, rivals, dnf:isDnf};
}

function initClubModeData(name,specialty,filosofia){
  const fil=filosofia||'montanero';
  const startRunners=CLUB_RUNNER_POOL.filter(r=>r.spec===specialty||specialty==='mixto').slice(0,3);
  const fill=startRunners.length<3?CLUB_RUNNER_POOL.filter(r=>!startRunners.includes(r)).slice(0,3-startRunners.length):[];
  const plantilla=[...startRunners,...fill].map(r=>({...r,stats:{...r.stats},currentSalary:r.salary,role:'normal'}));
  // Asignar capitán al primero por defecto
  if(plantilla.length>0)plantilla[0].role='capitan';
  return{
    name, specialty, filosofia:fil,
    socios:8, reputacion:10, presupuesto:800, temporada:1,
    cohesion:50,                    // C6 moral grupal
    plantilla,
    calAssignments:{},              // C5+C10: {raceId:[runnerId,...]}
    seasonResults:[], pendingEvent:null,
    historial:[],
    instalaciones:{gimnasio:false,clinica:false,residencia:false,marketingHQ:false}, // C15
    staff:{},                       // C11: {fisio:true, entrenador:true, ...}
    clubSponsors:[],                // C13
    cantera:[],                     // C12
    seasonObjective:null,           // C18
    seasonObjectiveMet:null,
    rivalClubs:[                    // C14
      {name:'Club Montaña Oria',    rep:20,socios:15,level:'local'},
      {name:'Pirineos Trail Team',  rep:45,socios:55,level:'regional'},
      {name:'Euskadi Trail Elite',  rep:75,socios:120,level:'nacional'},
    ],
    monthlyFocus:null,              // C16 decisión mensual activa
    seasonSimulated:false,
  };
}

function clubMonthlyWage(){
  const d=G.clubModeData;if(!d)return 0;
  return d.plantilla.reduce((s,r)=>s+(r.currentSalary||r.salary),0);
}
window.doClubMonthlyFocus=(focus)=>{
  const d=G.clubModeData;if(!d)return;
  d.monthlyFocus=focus;
  const msgs={resultados:'🏆 Foco en resultados — rendimiento +5% esta temporada',
    marketing:'📣 Campaña de marketing activa',formacion:'🌱 Plan de formación de cantera',
    ahorro:'💰 Control de costes activado'};
  showToast(msgs[focus]||'Foco mensual establecido','#8e44ad');
  autoSave();render();
};

function generateClubObjective(){
  const d=G.clubModeData;if(!d)return;
  const socios=d.socios||8;
  const temporada=d.temporada||1;
  // Filtrar objetivos apropiados según estado del club
  const eligible=CLUB_OBJECTIVES.filter(o=>{
    if(o.id==='socios_80'&&socios<40)return false;
    if(o.id==='socios_30'&&socios>=30)return false;
    if(o.id==='subir_nivel'&&socios>200)return false;
    return true;
  });
  const chosen=eligible[Math.floor(Math.random()*eligible.length)];
  d.seasonObjective=chosen;
  d.seasonObjectiveMet=null;
}

function generateClubEvent(){
  const d=G.clubModeData;if(!d)return;
  if(d.pendingEvent)return;
  const coh=d.cohesion||50;
  const rep=d.reputacion||0;
  const presup=d.presupuesto||0;
  const pool=CLUB_EVENTS.filter(e=>{
    if(e.id==='cle3'&&d.plantilla.length>=6)return false;
    if(e.id==='cle8'&&d.plantilla.length<=2)return false;
    // C3: filtros condicionales
    if(e.minCohesion!==undefined&&coh<e.minCohesion)return false;
    if(e.maxCohesion!==undefined&&coh>e.maxCohesion)return false;
    if(e.minRep!==undefined&&rep<e.minRep)return false;
    if(e.maxRep!==undefined&&rep>e.maxRep)return false;
    if(e.maxPresupuesto!==undefined&&presup>e.maxPresupuesto)return false;
    return true;
  });
  if(!pool.length)return;
  if(Math.random()<0.65)d.pendingEvent=pool[Math.floor(Math.random()*pool.length)];
}
// ══════════════════════════════════════
//  MULTI-ATLETA — GESTIÓN DE SLOTS
// ══════════════════════════════════════
function coachSlotKeys(){
  return['coachAthlete','coachSeason','coachTrust','coachEarnings','coachSelectedRaces',
    'coachRaceIdx','coachRaceResults','coachBodyLoad','coachRaceData','coachRaceAnimIdx',
    'coachRaceAidPaused','coachLastTraining','coachNemesis','coachPendingEvent',
    'coachLastDialogue','coachDayCondition','coachRaceEventPending','coachEventLog',
    'coachGels','coachGelsUsed','coachRadioUsed','coachAidExtras','coachPreRaceBlock',
    'coachSeasonObjective','coachInjury','coachSponsors','coachSponsorPool',
    'coachRadioWindowOpen','coachTrainingSelected','coachPool','_coachSlotNotifs',
    'coachEmotionalState','coachDecisionLog','coachTrainerStyle','coachTrait'];
}

function saveCoachSlot(){
  const idx=G.coachActiveIdx||0;
  if(!G.coachRoster)G.coachRoster=[];
  const slot={};
  coachSlotKeys().forEach(k=>{slot[k]=G[k];});
  G.coachRoster[idx]=slot;
}

function loadCoachSlot(idx){
  if(!G.coachRoster||!G.coachRoster[idx])return;
  const slot=G.coachRoster[idx];
  G.coachActiveIdx=idx;
  coachSlotKeys().forEach(k=>{if(k in slot)G[k]=slot[k];});
}

window.switchCoachSlot=idx=>{
  if(idx===(G.coachActiveIdx||0)){G.screen='coachHome';G.activeTab='game';render();return;}
  saveCoachSlot();
  loadCoachSlot(idx);
  G.screen='coachHome';G.activeTab='game';render();
};

function coachSlotUnlocked(idx){
  if(idx===0)return true;
  if(idx===1)return(G.coachReputation||0)>=40;
  if(idx===2)return(G.coachReputation||0)>=70;
  return false;
}

function coachSlotNotifCount(idx){
  saveCoachSlot();
  const slot=G.coachRoster[idx];
  if(!slot||!slot.coachAthlete)return 0;
  let n=0;
  if((slot._coachSlotNotifs||[]).filter(x=>!x.read).length)n+=(slot._coachSlotNotifs||[]).filter(x=>!x.read).length;
  if(slot.coachPendingEvent&&!slot.coachPendingEvent.resolved)n++;
  return n;
}

function addCoachNotif(text,type='info'){
  if(!G._coachSlotNotifs)G._coachSlotNotifs=[];
  G._coachSlotNotifs.push({text,type,read:false,ts:Date.now()});
}

function markNotifsRead(){
  (G._coachSlotNotifs||[]).forEach(n=>n.read=true);
}
function renderClubSetup(){
  const el=document.getElementById('main');
  const currentClub=G.club||CLUBS[0];
  const rep=G.clubReputation||0;
  const repInfo=clubRepLabel();
  const companion=G.clubCompanion;
  const fromBetween=G._clubFromBetween||false;

  el.innerHTML=`
    <h2>Elige tu club</h2>
    <p class="sub">El club define tu entorno de entrenamiento y red de apoyo.</p>

    ${currentClub.id!=='none'?`
    <div class="card" style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Club actual — ${currentClub.name}</div>
      ${companion?`<div style="font-size:13px;color:#555;margin-bottom:8px">Tu compañero: <strong>${companion}</strong></div>`:''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:12px;color:#888">Reputación</span>
        <span style="font-size:13px;font-weight:700;color:${repInfo.color}">${repInfo.text}</span>
      </div>
      <div class="load-bar-track"><div class="bar-fill" style="width:${rep}%;background:${rep>=60?'#c07a10':rep>=30?'#4a90d9':'#bbb'}"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#bbb;margin-top:3px">
        <span>0</span><span style="color:#4a8a2a">75 → Copa de Clubes</span><span>100</span>
      </div>
      ${rep>=75?`<div style="font-size:12px;color:#4a8a2a;margin-top:6px">✓ Reputación suficiente para la Copa de Clubes</div>`:''}
    </div>`:''}

    <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Opciones disponibles</div>
    ${CLUBS.filter(c=>c.id==='none'||(c.minYear||1)<=G.year).map(c=>{
      const isActive=currentClub.id===c.id;
      const monthCost=c.cost;
      const annualCost=monthCost*12;
      const bonuses=Object.entries(c.statBonus).map(([k,v])=>`+${v} ${k.charAt(0).toUpperCase()+k.slice(1)}`).join(', ');
      const perks=[];
      if(c.hasFisio)perks.push('Fisio incluido');
      if(c.hasEntrenador)perks.push('Entrenador incluido');
      return `<div class="work-card ${isActive?'':''}${isActive?'border: 2px solid #4a90d9;':''}" style="margin-bottom:10px;${isActive?'border:2px solid #4a90d9;':''}" onclick="${isActive?'':'selectClub(\''+c.id+'\')'}">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="card-title">${c.name}</span>
            ${isActive?`<span style="font-size:11px;background:#e8eef8;color:#2d4fa0;border-radius:4px;padding:1px 6px;font-weight:600">Actual</span>`:''}
          </div>
          <div class="card-sub">${c.desc}</div>
          ${bonuses?`<div style="font-size:12px;color:#4a8a2a;margin-top:4px">${bonuses}</div>`:''}
          ${perks.length?`<div style="font-size:12px;color:#4a90d9;margin-top:2px">${perks.join(' · ')}</div>`:''}
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:12px">
          ${monthCost>0?`<div style="font-size:14px;font-weight:700;color:#c0392b">-€${monthCost}/mes</div>
          <div style="font-size:11px;color:#aaa">€${annualCost}/año</div>`
          :`<div style="font-size:13px;font-weight:600;color:#888">Gratis</div>`}
        </div>
      </div>`;
    }).join('')}

    <div style="margin-top:4px">
      <button class="main" onclick="${fromBetween?`G._clubFromBetween=false;G.screen='betweenManage'`:`G.screen='seasonStart'`};render()">← Volver</button>
    </div>`;
}

window.selectClub=id=>{
  const club=CLUBS.find(c=>c.id===id);
  if(!club)return;
  if((club.minYear||1)>G.year){showToast('Disponible a partir del año '+club.minYear,'#c07a10');return;}
  const prev=G.club||CLUBS[0];
  if(prev.id!=='none'&&prev.id!==id&&id!=='none'){
    G.clubReputation=Math.max(0,(G.clubReputation||0)-20);
  } else if(id==='none'){
    G.clubReputation=0;
  }
  G.club=club;
  G.clubCompanion=assignClubCompanion(club);
  const msg=id==='none'?'Sin club — independiente':
    G.clubCompanion?`Te unes a ${club.name}. Tu compañero: ${G.clubCompanion}`:`Te unes a ${club.name}`;
  showToast(msg,'#4a8a2a');
  render();
};
function renderCoachSelect(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const fb=document.getElementById('fin-bar');if(fb)fb.style.display='none';
  const pool=G.coachPool||[];
  el.innerHTML=`
    <div style="text-align:center;padding:16px 0 18px">
      <div style="font-size:32px;margin-bottom:8px">📋</div>
      <h2 style="margin-bottom:4px">Elige tu atleta</h2>
      <p class="sub">${G._coachUnlockedHint?'Tu nombre como corredor te abre puertas. Elige a quién quieres entrenar.':'Te presentan a tres corredores. Solo puedes entrenar a uno.'}</p>
    </div>
    ${G._coachUnlockedHint?`<div class="note" style="margin-bottom:14px;background:#EEEDFE;border-color:#AFA9EC;color:#3C3489">Con tu historial como atleta, uno de los candidatos es de un nivel que normalmente no llegaría a ti tan pronto.</div>`:''}
    ${pool.map(a=>{
      const pl=PERSONALITY_LABEL[a.personality];
      return`<div class="coach-card" onclick="doCoachSelect('${a.id}')">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <div style="width:44px;height:44px;border-radius:50%;background:#f0ede8;border:2px solid #e0dfd8;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${a.flag}</div>
          <div style="flex:1">
            <div style="font-size:15px;font-weight:700">${a.name}</div>
            <div style="font-size:12px;color:#888">${a.age} años · ${SPEC_LABEL[a.spec]||a.spec}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:11px;color:#aaa">Honorarios</div>
            <div style="font-size:14px;font-weight:700">€${a.monthlyFee}/mes</div>
          </div>
        </div>
        <div class="hint" style="margin-bottom:10px;font-style:italic">"${a.bio}"</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="background:${pl.color}22;color:${pl.color};font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px">${pl.emoji} ${pl.label}</span>
          <span style="font-size:12px;color:#888;max-width:180px;text-align:right">${pl.desc}</span>
        </div>
        ${Object.entries(a.baseStats).map(([k,v])=>`
          <div class="bar-row" style="margin-bottom:3px">
            <div class="bar-label">${k.charAt(0).toUpperCase()+k.slice(1)}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${v}%;background:#4a90d9"></div></div>
            <div class="bar-pct">${v}</div>
          </div>`).join('')}
      </div>`;
    }).join('')}
    <button class="main" style="opacity:0.5;margin-top:4px" onclick="G.screen='modeSelect';render()">← Volver</button>`;
}

window.doCoachSelect=id=>{
  const a=(G.coachPool||[]).find(x=>x.id===id);
  if(!a)return;
  G.coachAthlete={...a,currentStats:{...a.baseStats}};
  G.coachTrust=60;G.coachSeason=1;G.coachEarnings=0;
  G.coachSelectedRaces=[];G.coachRaceIdx=0;G.coachRaceResults=[];
  G.coachBodyLoad=0;G.coachLastTraining=null;G.coachRaceData=null;
  G.coachRaceAnimIdx=0;G.coachRaceAidPaused=false;
  G.coachNemesis=null;G.coachPendingEvent=null;G.coachLastDialogue=null;
  G.coachDayCondition=null;G.coachRaceEventPending=null;G.coachEventLog=[];
  G.coachGels=3;G.coachGelsUsed=0;G.coachRadioUsed={};G.coachAidExtras={};G.coachPreRaceBlock=null;
  G.coachSeasonObjective=null;G.coachInjury=null;G.coachSponsors=[];G.coachSponsorPool=null;G.coachRadioWindowOpen=false;
  G._coachSlotNotifs=[];
  G.coachEmotionalState='fresco';G.coachDecisionLog=G.coachDecisionLog||[];
  generateCoachSeasonObjective();
  generateCoachSponsorPool();
  saveCoachSlot();
  if(!G.coachTrainerStyle){G.screen='coachStyleSelect';render();return;}
  G.screen='coachHub';G.activeTab='game';
  autoSave();render();
};

function renderCoachStyleSelect(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const fb=document.getElementById('fin-bar');if(fb)fb.style.display='none';
  const sel=G._pendingTrainerStyle||null;
  el.innerHTML=`
    <div style="text-align:center;padding:16px 0 18px">
      <div style="font-size:32px;margin-bottom:8px">🎯</div>
      <h2 style="margin-bottom:4px">¿Cómo entrenas?</h2>
      <p class="sub">Tu estilo define cómo interactúas con el atleta.<br>No se puede cambiar una vez elegido.</p>
    </div>
    ${Object.entries(TRAINER_STYLES).map(([id,s])=>{
      const isSel=sel===id;
      return`<div class="train-card${isSel?' sel':''}" style="${isSel?'border-color:'+s.color+';background:'+s.color+'11;':''};margin-bottom:10px;cursor:pointer" onclick="G._pendingTrainerStyle='${id}';render()">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="font-size:22px">${s.emoji}</span>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:${isSel?s.color:'#1a1a1a'}">${s.label}</div>
            <div style="font-size:12px;color:#888">${s.desc}</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;font-size:11px;color:#aaa;flex-wrap:wrap">
          <span>${s.trustMod>=0?'+':''}${s.trustMod} confianza/carrera</span>
          <span>${s.bodyLoadMod>=0?'+':''}${s.bodyLoadMod} carga</span>
          <span>${s.perfMod>=0?'+':''}${s.perfMod}% rendimiento</span>
          ${s.trainingBonus?`<span style="color:#2d7a2d">↑ ${s.trainingBonus}</span>`:''}
          ${s.trainingPenalty?`<span style="color:#c0392b">↓ ${s.trainingPenalty}</span>`:''}
        </div>
      </div>`;
    }).join('')}
    <button class="main" style="margin-top:10px;background:#1a1a1a;color:#fff;border-color:#1a1a1a;${!sel?'opacity:0.4;pointer-events:none':''}" onclick="doConfirmTrainerStyle()">Confirmar estilo →</button>
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="G._pendingTrainerStyle=null;G.screen='coachSelect';render()">← Volver</button>`;
}

window.doConfirmTrainerStyle=()=>{
  if(!G._pendingTrainerStyle)return;
  G.coachTrainerStyle=G._pendingTrainerStyle;
  G._pendingTrainerStyle=null;
  showToast(`Estilo: ${TRAINER_STYLES[G.coachTrainerStyle].emoji} ${TRAINER_STYLES[G.coachTrainerStyle].label}`,'#1a1a1a');
  G.screen='coachHub';G.activeTab='game';
  autoSave();render();
};


function renderCoachHome(){
  const el=document.getElementById('main');
  const a=G.coachAthlete;
  if(!a){G.screen='coachSelect';render();return;}
  const pl=PERSONALITY_LABEL[a.personality];
  const racesSelected=(G.coachSelectedRaces||[]).length>0;
  const allDone=racesSelected&&G.coachRaceIdx>=(G.coachSelectedRaces||[]).length;
  const nextRace=racesSelected?(G.coachSelectedRaces||[])[G.coachRaceIdx]:null;
  const trustColor=G.coachTrust>=60?'#2d7a2d':G.coachTrust>=30?'#c07a10':'#c0392b';
  const trustLabel=G.coachTrust>=80?'Excelente':G.coachTrust>=60?'Buena':G.coachTrust>=30?'Tensa':'Crítica';
  const results=G.coachRaceResults||[];
  markNotifsRead();

  // Build slot tabs
  const roster=G.coachRoster||[];
  const activeIdx=G.coachActiveIdx||0;
  const filledSlots=roster.filter(s=>s&&s.coachAthlete).length;
  const slot1Unlocked=coachSlotUnlocked(1);
  const slot2Unlocked=coachSlotUnlocked(2);
  const tabsHtml=`
    <div class="slot-tabs" style="margin-bottom:14px">
      ${roster.map((s,i)=>{
        if(!s||!s.coachAthlete)return'';
        const notifs=coachSlotNotifCount(i);
        const isActive=i===activeIdx;
        return`<button class="slot-tab ${isActive?'active':''}" onclick="switchCoachSlot(${i})">
          ${s.coachAthlete.flag} ${esc(s.coachAthlete.name.split(' ')[0])}
          ${notifs>0&&!isActive?`<span class="notif-dot"></span>`:''}
        </button>`;
      }).join('')}
      ${filledSlots<2&&slot1Unlocked?`<button class="slot-tab" onclick="addCoachSlot()" style="border-style:dashed;color:#4a90d9">+ Atleta</button>`:''}
      ${filledSlots===2&&slot2Unlocked?`<button class="slot-tab" onclick="addCoachSlot()" style="border-style:dashed;color:#4a90d9">+ Atleta</button>`:''}
    </div>`;

  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <button onclick="G.screen='coachHub';render()" style="background:none;border:1px solid #e0dfd8;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;color:#888">← Hub</button>
      <div style="font-size:12px;color:#aaa">Rep. entrenador: <strong>${G.coachReputation||0}/100</strong></div>
    </div>
    ${(()=>{
      const styleHtml=G.coachTrainerStyle?`<span style="background:${TRAINER_STYLES[G.coachTrainerStyle].color}22;color:${TRAINER_STYLES[G.coachTrainerStyle].color};font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px">${TRAINER_STYLES[G.coachTrainerStyle].emoji} ${TRAINER_STYLES[G.coachTrainerStyle].label}</span>`:'';
      const trait=G.coachTrait?TRAINER_TRAITS.find(t=>t.id===G.coachTrait):null;
      const traitHtml=trait?`<span style="background:${trait.color}22;color:${trait.color};font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px" title="${trait.desc}">${trait.emoji} ${trait.label}</span>`:'';
      if(!styleHtml&&!traitHtml)return'';
      return`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${styleHtml}${traitHtml}</div>`;
    })()}
    ${filledSlots>1?tabsHtml:''}
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="width:48px;height:48px;border-radius:50%;background:#f0ede8;border:2px solid #e0dfd8;display:flex;align-items:center;justify-content:center;font-size:24px">${a.flag}</div>
      <div style="flex:1">
        <div style="font-size:17px;font-weight:700">${esc(a.name)}</div>
        <div style="font-size:12px;color:#888">Temporada ${G.coachSeason} · ${SPEC_LABEL[a.spec]||a.spec}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <span style="background:${pl.color}22;color:${pl.color};font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px">${pl.emoji} ${pl.label}</span>
        ${(()=>{const es=EMOTIONAL_STATES[G.coachEmotionalState||'fresco'];return`<span style="background:${es.color}22;color:${es.color};font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px" title="${es.desc}">${es.emoji} ${es.label}</span>`;})()}
      </div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div class="sec-title-sm" style="margin-bottom:0">Confianza del atleta</div>
        <div style="font-size:13px;font-weight:700;color:${trustColor}">${G.coachTrust}/100 · ${trustLabel}</div>
      </div>
      <div style="height:8px;background:#e5e4de;border-radius:4px;overflow:hidden">
        <div style="width:${G.coachTrust}%;height:100%;background:${trustColor};border-radius:4px;transition:width .4s"></div>
      </div>
      ${G.coachTrust<30?`<div class="danger" style="margin-top:8px;margin-bottom:0;font-size:12px">⚠️ Confianza crítica. Si no mejoras los resultados, el atleta puede marcharse.</div>`:''}
    </div>

    ${G.coachInjury&&G.coachInjury.racesLeft>0?`
    <div class="card" style="margin-bottom:12px;border-color:#f5b8b8;border-width:1.5px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-size:16px">🩹</span>
        <div style="font-size:13px;font-weight:700;color:#c0392b">${G.coachInjury.label}</div>
        <span style="font-size:11px;background:#fef0f0;color:#c0392b;padding:1px 6px;border-radius:3px;margin-left:auto">${G.coachInjury.racesLeft} carrera${G.coachInjury.racesLeft!==1?'s':''} de baja</span>
      </div>
      <div style="font-size:12px;color:#888">${G.coachInjury.desc}</div>
    </div>`:''}

    ${G.coachSeasonObjective?`
    <div class="card" style="margin-bottom:12px;border-color:${G.coachSeasonObjective.met?'#4a8a2a':'#e0dfd8'}">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">${G.coachSeasonObjective.met?'✅':'🎯'}</span>
        <div style="flex:1">
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">Objetivo de ${esc(a.name)}</div>
          <div style="font-size:13px;font-weight:600">${G.coachSeasonObjective.label}</div>
          <div style="font-size:12px;color:#aaa;font-style:italic;margin-top:2px">${G.coachSeasonObjective.desc}</div>
        </div>
      </div>
    </div>`:''}

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Estado de la temporada</div>
      <div style="font-size:13px;color:#555">
        ${!racesSelected?'📅 Aún no has planificado el calendario de esta temporada.'
          :allDone?`✅ Temporada completa — ${results.filter(r=>!r.dnf).length} carreras finalizadas.`
          :`🏃 ${G.coachRaceIdx}/${(G.coachSelectedRaces||[]).length} carreras. Próxima: <strong>${esc(nextRace?.name||'—')}</strong>`}
      </div>
      ${G.coachBodyLoad>70?`<div class="warn" style="margin-top:8px;margin-bottom:0;font-size:12px">Carga corporal del atleta: ${Math.round(G.coachBodyLoad)}% — considera un bloque de recuperación.</div>`:''}
    </div>
    ${allDone?`
      <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="G.screen='coachSeasonEnd';render()">Ver balance de temporada →</button>
    `:!racesSelected?`
      <button class="main" onclick="G.screen='coachCalendar';G.activeTab='calendar';render()">📅 Planificar carreras de la temporada</button>
      ${(G.coachSponsorPool||[]).length>0&&(G.coachSponsors||[]).length<2?`<button class="main" style="margin-top:6px;border-color:#c07a10;color:#c07a10" onclick="G.screen='coachSponsors';render()">🤝 Negociar sponsors del atleta (${(G.coachSponsorPool||[]).length} oferta${(G.coachSponsorPool||[]).length!==1?'s':''})</button>`:''}
    `:`
      <button class="main" onclick="G.screen='coachTraining';render()">💪 Proponer bloque de entrenamiento</button>
      ${G.coachInjury&&G.coachInjury.racesLeft>0
        ?`<div class="warn" style="margin-top:8px;font-size:12px">🩹 ${esc(a.name)} está lesionado — no puede correr ${G.coachInjury.racesLeft} carrera${G.coachInjury.racesLeft!==1?'s':''} más. Se saltará la próxima.</div>
           <button class="main" style="margin-top:6px;opacity:0.5" disabled>🏁 Carrera bloqueada por lesión</button>`
        :`<button class="main" style="margin-top:6px" onclick="doCoachStartRace()">🏁 Ir a la carrera — ${esc(nextRace?.name||'siguiente')}</button>`}
    `}
    ${G.coachPendingEvent?`
    <div class="card" style="margin-top:12px;border-color:#c07a10;border-width:1.5px;cursor:pointer" onclick="G.screen='coachEvent';render()">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:24px">${G.coachPendingEvent.icon||'📋'}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:#c07a10">${G.coachPendingEvent.title}</div>
          <div style="font-size:12px;color:#888">${esc(a.name)} quiere hablar contigo</div>
        </div>
        <div style="font-size:18px;color:#c07a10">→</div>
      </div>
    </div>`:''}
    ${G.coachNemesis&&G.coachNemesis.wins>=2?`
    <div class="hint" style="margin-top:10px">🎯 <strong>${esc(G.coachNemesis.name)}</strong> lleva ${G.coachNemesis.wins} carreras superando a ${esc(a.name)}. Está en la cabeza del atleta.</div>`:''}
    <div class="card" style="margin-top:14px">
      <div class="sec-title-sm">Economía de la temporada</div>
      <div style="font-size:13px;color:#555">Honorarios: <strong>€${a.monthlyFee||250}/mes</strong></div>
      <div style="font-size:12px;color:#888;margin-top:4px">Acumulado: <strong class="plus">+€${G.coachEarnings||0}</strong></div>
    </div>
    ${results.length>0?`
    <div class="card" style="margin-top:10px">
      <div class="sec-title-sm">Resultados esta temporada</div>
      ${results.map((r,i)=>`
        <div class="history-row">
          <span style="font-size:13px">${esc((G.coachSelectedRaces||[])[i]?.name||r.raceName||'Carrera '+(i+1))}</span>
          <span style="font-weight:700;font-size:13px;color:${r.dnf?'#c0392b':r.pos<=3?'#c07a10':'#1a1a1a'}">${r.dnf?'DNF':'#'+r.pos}</span>
        </div>`).join('')}
    </div>`:''}`;
}

function renderCoachTraining(){
  const el=document.getElementById('main');
  const a=G.coachAthlete;
  const pl=PERSONALITY_LABEL[a.personality];
  const nextRace=(G.coachSelectedRaces||[])[G.coachRaceIdx];
  const nextQ=nextRace?.quarter||1;

  // Recommended block based on race profile
  function recommendBlock(race){
    if(!race)return null;
    const segs=race.segs||[];
    const climbKm=segs.filter(s=>s.type==='climb').reduce((s,x)=>s+x.km,0);
    const descKm=segs.filter(s=>s.type==='descent').reduce((s,x)=>s+x.km,0);
    const ratio=climbKm/Math.max(1,race.km);
    if(ratio>0.35)return'subida';
    if(descKm/race.km>0.3)return'tecnico';
    if(race.km>=40)return'volumen';
    return'velocidad';
  }
  const recKey=recommendBlock(nextRace);
  const recLabel={volumen:'Volumen alto',velocidad:'Trabajo de velocidad',tecnico:'Descenso técnico',subida:'Subida específica'}[recKey]||'';

  // Quarter races summary
  const qRaces=(G.coachSelectedRaces||[]).filter(r=>r.quarter===nextQ);
  const MONTH_NAMES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  el.innerHTML=`
    <h2>Proponer entrenamiento</h2>
    <p class="sub"><strong>${esc(a.name)}</strong> · T${G.coachSeason}</p>

    ${nextRace?`
    <div class="card" style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">
        Q${nextQ} — carreras del trimestre
      </div>
      ${qRaces.map(r=>{
        const isNext=r.id===nextRace.id;
        const tC=TIER_COLOR_RACE[r.tier]||'#888';
        return`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f0ede8">
          <div>
            <span style="font-size:13px;font-weight:${isNext?700:400}">${isNext?'→ ':''}${esc(r.name)}</span>
            ${isNext?`<span style="font-size:11px;background:#f0f6ff;color:#4a90d9;padding:1px 6px;border-radius:3px;margin-left:6px">Próxima</span>`:''}
            <div style="font-size:12px;color:#aaa">${MONTH_NAMES[(r.month||1)-1]} · ${r.type} · ${r.km}km · ${r.desnivel}</div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${tC};flex-shrink:0;margin-left:8px">${TIER_LABEL_RACE[r.tier]||r.tier}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="card" style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Perfil — ${esc(nextRace.name)}</div>
      <div id="coach-train-prof-wrap">${profSvg(nextRace,-1,'preview',0)}</div>
      <div id="coach-train-prof-info" data-sel="-1" style="min-height:16px">${profSegInfo(nextRace,null,'preview',0)}</div>
      <div style="display:flex;gap:8px;font-size:11px;color:#aaa;margin-top:6px;flex-wrap:wrap">
        <span><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#EAF3DE;border:1px solid #639922;margin-right:2px;vertical-align:middle"></span>Subida</span>
        <span><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#FCEBEB;border:1px solid #E24B4A;margin-right:2px;vertical-align:middle"></span>Bajada</span>
        <span><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#F1EFE8;border:1px solid #888;margin-right:2px;vertical-align:middle"></span>Llano</span>
      </div>
    </div>
    ${recLabel?`<div class="note" style="margin-bottom:12px;font-size:13px">💡 Para este perfil se recomienda: <strong>${recLabel}</strong></div>`:''}
    `:''}

    <div class="hint" style="margin-bottom:10px">${pl.emoji} <strong>${pl.label}:</strong> ${pl.desc}</div>

    ${(()=>{
      // Warn about reduced effectiveness based on context
      const ev=G.coachPendingEvent;
      const load=G.coachBodyLoad||0;
      const pers=a.personality;
      const warnings=[];
      if(ev){
        if(ev.id==='family_stress')warnings.push({type:'warn',msg:`📞 ${esc(a.name)} tiene un problema familiar pendiente. Probablemente entrene con la cabeza en otro lado — efectividad reducida.`});
        if(ev.id==='overtraining_signal')warnings.push({type:'danger',msg:`😴 ${esc(a.name)} muestra señales de sobrecarga. Cualquier bloque intenso podría agravar la situación.`});
        if(ev.id==='doubt_crisis')warnings.push({type:'warn',msg:`💭 ${esc(a.name)} está atravesando una crisis de confianza. Su rendimiento en entreno será impredecible.`});
        if(ev.id==='injury_scare')warnings.push({type:'warn',msg:`🩹 Hay una molestia física activa. Bloques de volumen o velocidad aumentan el riesgo.`});
      }
      if(pers==='quemado'&&load>60)warnings.push({type:'warn',msg:`⚫ Con la carga acumulada y el estado mental del atleta, existe riesgo real de que no aparezca al entrenamiento.`});
      if(pers==='motivado'&&(G.coachRaceResults||[]).slice(-1)[0]?.dnf)warnings.push({type:'warn',msg:`🟡 Viene de un abandono. Puede entrenarse demasiado duro para compensar — vigila la carga.`});
      if(load>80)warnings.push({type:'danger',msg:`🔴 Carga corporal ${Math.round(load)}% — solo considera Recuperación activa o Descarga.`});
      return warnings.map(w=>`<div class="${w.type}" style="margin-bottom:8px;font-size:12px">${w.msg}</div>`).join('');
    })()}

    <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Elige bloque</div>
    ${TRAINING_BLOCKS.map(b=>{
      const isRec=b.name===recLabel;
      const isSel=G.coachTrainingSelected===b.id;
      return`<div class="train-card${isSel?' sel':''}" style="${isSel?'border-color:#1a1a1a;background:#f5f4f0;':isRec?'border-color:#4a90d9;':''}"
        onclick="G.coachTrainingSelected='${b.id}';render()">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="card-title">${b.name}
            ${isRec?` <span style="font-size:11px;background:#4a90d9;color:#fff;padding:1px 6px;border-radius:3px;margin-left:4px">Recomendado</span>`:''}
            ${isSel?` <span style="font-size:11px;background:#1a1a1a;color:#fff;padding:1px 6px;border-radius:3px;margin-left:4px">Seleccionado</span>`:''}
          </div>
        </div>
        <div class="card-sub">${b.desc}</div>
        <div style="font-size:12px;margin-top:5px">
          ${Object.entries(b.effects).filter(([,v])=>v!==0).map(([k,v])=>`<span style="color:${v>0?'#2d7a2d':'#c0392b'};margin-right:8px">${v>0?'+':''}${v} ${k.charAt(0).toUpperCase()+k.slice(1)}</span>`).join('')}
        </div>
      </div>`;
    }).join('')}
    ${G.coachTrainingSelected
      ?`<button class="main" style="margin-top:10px;background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doCoachTraining(G.coachTrainingSelected)">
          Confirmar — ${TRAINING_BLOCKS.find(b=>b.id===G.coachTrainingSelected)?.name||''} →
        </button>`
      :`<div class="hint" style="margin-top:8px;text-align:center">Toca un bloque para seleccionarlo</div>`}
    <button class="main" style="opacity:0.5;margin-top:6px" onclick="G.coachTrainingSelected=null;G.screen='coachHome';render()">← Volver sin entrenar</button>`;

  // Attach profile tap handlers after render
  if(nextRace){
    setTimeout(()=>{
      const svg=document.getElementById(`prof-${nextRace.id}`);
      if(!svg)return;
      svg.querySelectorAll('rect[data-seg]').forEach(r=>{
        const h=()=>{
          const si=parseInt(r.dataset.seg);
          const info=document.getElementById('coach-train-prof-info');
          const wrap=document.getElementById('coach-train-prof-wrap');
          if(!info||!wrap)return;
          const cur=info.dataset.sel;
          const next=cur==si?-1:si;
          info.dataset.sel=next;
          info.innerHTML=profSegInfo(nextRace,next>=0?next:null,'preview',0);
          wrap.innerHTML=profSvg(nextRace,next>=0?next:-1,'preview',0);
          // re-attach
          renderCoachTraining._reattach&&renderCoachTraining._reattach();
        };
        r.addEventListener('click',h);r.addEventListener('touchend',e=>{e.preventDefault();h();});
      });
    },0);
  }
}

window.doCoachTraining=blockId=>{
  const a=G.coachAthlete;
  const block=TRAINING_BLOCKS.find(b=>b.id===blockId);
  if(!block)return;
  let actualBlockId=blockId,reactionMsg='',trustDelta=0,effMult=1.0;
  switch(a.personality){
    case'rebelde':
      if(Math.random()<0.30){
        actualBlockId=['volumen','velocidad'].find(b=>b!==blockId)||blockId;
        reactionMsg=`"Esto me lo sé de sobra, necesito algo más exigente." Cambia el plan sin avisarte.`;
        trustDelta=-1;effMult=1.1;
      } else {reactionMsg=`Acepta el plan con cierta reluctancia. Esta vez te hace caso.`;trustDelta=+1;}
      break;
    case'motivado':{
      const lr=(G.coachRaceResults||[]).slice(-1)[0];
      if(lr&&lr.pos<=5&&!lr.dnf){reactionMsg=`Viene eufórico del resultado y entrena con una intensidad brutal.`;effMult=1.25;trustDelta=+2;}
      else{reactionMsg=`Se esfuerza más de la cuenta. Llega al límite antes de terminar la sesión.`;effMult=0.85;trustDelta=+1;}
      break;}
    case'obediente':
      reactionMsg=`Ejecuta el plan exactamente como se lo has dado. Ni más, ni menos.`;effMult=1.0;trustDelta=+1;break;
    case'quemado':
      if(Math.random()<0.25){reactionMsg=`Hoy no aparece al entrenamiento. Necesita espacio, dice.`;effMult=0;trustDelta=-2;}
      else{reactionMsg=`Entrena, pero con la mente en otro lado. Rendimiento por debajo de lo esperado.`;effMult=0.65;trustDelta=+1;}
      break;
  }
  const usedBlock=TRAINING_BLOCKS.find(b=>b.id===actualBlockId)||block;
  if(effMult>0){
    Object.entries(usedBlock.effects).forEach(([k,v])=>{
      if(a.currentStats[k]!==undefined)
        a.currentStats[k]=Math.max(10,Math.min(100,a.currentStats[k]+Math.round(v*effMult)));
    });
  }
  const loadD={volumen:15,velocidad:12,tecnico:10,recuperacion:-10,taper:-15,cruzado:4};
  G.coachBodyLoad=Math.max(0,Math.min(100,(G.coachBodyLoad||0)+(loadD[actualBlockId]||8)));
  G.coachTrust=Math.max(0,Math.min(100,(G.coachTrust||60)+trustDelta));
  G.coachLastTraining={blockId:actualBlockId,blockName:usedBlock.name,effMult,reactionMsg,trustDelta};
  G.coachTrainingSelected=null;
  G.screen='coachTrainingReaction';render();
};

function renderCoachTrainingReaction(){
  const el=document.getElementById('main');
  const lt=G.coachLastTraining;
  const a=G.coachAthlete;
  if(!lt){G.screen='coachHome';render();return;}
  el.innerHTML=`
    <h2>Reacción del atleta</h2>
    <p class="sub">${esc(a.name)}</p>
    <div class="card" style="margin-bottom:14px">
      <div style="font-size:14px;color:#555;line-height:1.65;font-style:italic">"${lt.reactionMsg}"</div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="sec-title-sm">Resultado</div>
      ${lt.effMult>0
        ?`<div style="font-size:13px;color:#555">Bloque: <strong>${lt.blockName}</strong> · Efectividad: <strong>${Math.round(lt.effMult*100)}%</strong></div>`
        :`<div style="font-size:13px;color:#c0392b">No completó el entrenamiento. Sin mejora de stats.</div>`}
      <div style="margin-top:8px;font-size:13px;color:${lt.trustDelta>=0?'#2d7a2d':'#c0392b'}">
        Confianza: ${lt.trustDelta>=0?'+':''}${lt.trustDelta} → ${G.coachTrust}/100
      </div>
    </div>
    ${G.coachBodyLoad>70?`<div class="warn">Carga corporal: ${Math.round(G.coachBodyLoad)}%. Alto riesgo si se añade más volumen.</div>`:''}
    <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="G.screen='coachHome';render()">Continuar →</button>`;
}

function renderCoachCalendar(){
  const el=document.getElementById('main');
  const a=G.coachAthlete;
  if(!a){G.screen='coachSelect';render();return;}
  const selIds=(G.coachSelectedRaces||[]).map(r=>r.id);
  const maxRaces=4;
  const available=RACES_DB.filter(r=>{
    if(G.coachSeason===1&&r.tier==='elite')return false;
    if(G.coachSeason<=1&&(r.reqRanking||999)<25)return false;
    return true;
  });
  el.innerHTML=`
    <h2>Calendario del atleta</h2>
    <p class="sub">${esc(a.name)} · Temporada ${G.coachSeason} · Máx. ${maxRaces} carreras</p>
    ${selIds.length>=maxRaces?`<div class="note" style="margin-bottom:12px">Calendario completo — ${maxRaces}/${maxRaces} seleccionadas.</div>`:''}
    ${QUARTERS.map(q=>{
      const qRaces=available.filter(r=>r.quarter===q.n);
      if(!qRaces.length)return'';
      return`<div style="margin-bottom:12px">
        <div class="sec-title">${q.label} — ${q.months}</div>
        ${qRaces.map(r=>{
          const isSel=selIds.includes(r.id);
          const isFull=selIds.length>=maxRaces&&!isSel;
          const tC=TIER_COLOR_RACE[r.tier]||'#888';
          const tL=TIER_LABEL_RACE[r.tier]||r.tier;
          return`<div class="cal-race ${isSel?'sel':'avail'}" style="${isFull?'opacity:0.45;cursor:default':''}"
            onclick="${!isFull||isSel?`doCoachToggleRace('${r.id}')`:''}" >
            <div>
              <div class="cal-race-name">${r.name}</div>
              <div class="cal-race-meta">${r.monthName} · ${r.type} · €${r.cost} inscripción · Premio €${r.prize}</div>
            </div>
            <span style="font-size:12px;font-weight:700;color:${tC}">${isSel?'✓ ':''} ${tL}</span>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}
    ${selIds.length>0
      ?`<button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doCoachConfirmCalendar()">Confirmar (${selIds.length} carreras) →</button>`
      :`<div class="hint">Selecciona al menos 1 carrera para continuar.</div>`}
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="G.screen='coachHome';G.activeTab='game';render()">← Volver</button>`;
}
window.doCoachToggleRace=id=>{
  const race=RACES_DB.find(r=>r.id===id);if(!race)return;
  if(!G.coachSelectedRaces)G.coachSelectedRaces=[];
  const idx=G.coachSelectedRaces.findIndex(r=>r.id===id);
  if(idx>=0)G.coachSelectedRaces.splice(idx,1);
  else if(G.coachSelectedRaces.length<4)G.coachSelectedRaces.push(race);
  render();
};
window.doCoachConfirmCalendar=()=>{
  if(!(G.coachSelectedRaces||[]).length)return;
  G.coachSelectedRaces.sort((a,b)=>a.month-b.month);
  G.screen='coachHome';G.activeTab='game';render();
};

window.doCoachStartRace=()=>{
  const race=(G.coachSelectedRaces||[])[G.coachRaceIdx];
  if(!race)return;
  G.coachGels=3;G.coachGelsUsed=0;
  G.coachRadioUsed={};G.coachAidExtras={};G.coachPreRaceBlock=null;
  G.screen='coachPreRace';render();
};

function renderCoachPreRace(){
  const el=document.getElementById('main');
  const race=(G.coachSelectedRaces||[])[G.coachRaceIdx];
  if(!race){G.screen='coachHome';render();return;}
  const a=G.coachAthlete;
  const gels=G.coachGels||3;
  const dc=G.coachDayCondition||(COACH_DAY_CONDITIONS[Math.floor(Math.random()*COACH_DAY_CONDITIONS.length)]);
  if(!G.coachDayCondition){
    // Estado emocional modifica los mods del día de carrera
    const es=G.coachEmotionalState||'fresco';
    let modDc={...dc};
    if(es==='confiado'){modDc.energyMod=(modDc.energyMod||0)+4;modDc.legsMod=(modDc.legsMod||0)+3;modDc.text=modDc.text+' (Estado confiado: +ligero extra)';}
    else if(es==='quemado'){modDc.energyMod=(modDc.energyMod||0)-6;modDc.legsMod=(modDc.legsMod||0)-5;modDc.text='Se le ve apagado en el calentamiento. Llevas demasiadas semanas apretando.';}
    else if(es==='recuperado'){modDc.energyMod=(modDc.energyMod||0)+3;modDc.text=modDc.text+' (Recuperado: vuelve con ganas)';}
    else if(es==='dudoso'){modDc.energyMod=(modDc.energyMod||0)-2;modDc.text='Cara seria en el warming up. Algo le ronda la cabeza.';}
    G.coachDayCondition=modDc;
  }
  const MONTH_NAMES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  el.innerHTML=`
    <h2>Pre-carrera</h2>
    <p class="sub">${esc(race.name)} · ${MONTH_NAMES[(race.month||1)-1]} · T${G.coachSeason}</p>

    <div class="card" style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Perfil de la carrera</div>
      <div id="coach-pre-prof-wrap">${profSvg(race,-1,'preview',0)}</div>
      <div id="coach-pre-prof-info" data-sel="-1" style="min-height:16px">${profSegInfo(race,null,'preview',0)}</div>
      <div style="display:flex;gap:8px;font-size:11px;color:#aaa;margin-top:6px;flex-wrap:wrap">
        <span><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#EAF3DE;border:1px solid #639922;margin-right:2px;vertical-align:middle"></span>Subida</span>
        <span><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#FCEBEB;border:1px solid #E24B4A;margin-right:2px;vertical-align:middle"></span>Bajada</span>
        <span><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#F1EFE8;border:1px solid #888;margin-right:2px;vertical-align:middle"></span>Llano</span>
        <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#378ADD;margin-right:2px;vertical-align:middle"></span>Avituallamiento</span>
      </div>
    </div>
    ${(()=>{
      // Rival hijo en esta carrera
      const children=G.rivalChildren||[];
      if(!children.length)return '';
      const child=children[Math.floor(Math.random()*children.length)];
      return `<div class="note" style="margin-bottom:12px;background:#FAEEDA;border-color:#FAC775">
        <div style="font-size:12px;font-weight:600;color:#854F0B;margin-bottom:2px">🎯 ${esc(child.name)} corre hoy</div>
        <div style="font-size:12px;color:#633806">Hijo de ${esc(child.parentName)} — te ganó ${child.parentWins} vece${child.parentWins!==1?'s':''} en tu época. Ahora corre él.</div>
      </div>`;
    })()}

    <div class="card" style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Condición del día</div>
      <div style="font-size:13px;color:#555">🌅 ${dc.text}</div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Geles</div>
      <div style="font-size:13px;color:#555;margin-bottom:10px">Cuántos geles lleva ${esc(a.name)} al bolsillo. Cada gel da +12% energía en avituallamiento.</div>
      <div style="display:flex;align-items:center;gap:16px">
        <button onclick="G.coachGels=Math.max(0,G.coachGels-1);render()" style="width:36px;height:36px;border-radius:8px;border:1px solid #ddd;background:#fff;font-size:18px;cursor:pointer">−</button>
        <div style="font-size:20px;font-weight:700;min-width:40px;text-align:center">${gels} 🍬</div>
        <button onclick="G.coachGels=Math.min(6,G.coachGels+1);render()" style="width:36px;height:36px;border-radius:8px;border:1px solid #ddd;background:#fff;font-size:18px;cursor:pointer">+</button>
        <div style="font-size:12px;color:#888">Coste: €${gels*2}</div>
      </div>
      ${race.km>=40?`<div class="hint" style="margin-top:8px;margin-bottom:0;font-size:12px">Para una ${race.km}km se recomiendan al menos 4 geles.</div>`:''}
    </div>

    <div class="card" style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Ajuste de último momento</div>
      <div style="font-size:13px;color:#555;margin-bottom:10px">¿Quieres ajustar algo antes de salir?</div>
      ${[{id:'taper_race',label:'Descarga final',desc:'Sesión ligera hoy — el atleta llega más fresco (+5% energía)',energyBonus:5},
         {id:'mental_talk',label:'Charla motivacional',desc:'10 minutos de activación mental (+8 confianza)',trustBonus:8},
         {id:'nothing',label:'Nada — está listo',desc:'Confías en el trabajo hecho'}
      ].map((opt,i)=>{
        const isSel=(G.coachPreRaceBlock||'nothing')===opt.id;
        return`<div class="train-card${isSel?' sel':''}" style="${isSel?'border-color:#4a90d9;':''};margin-bottom:6px" onclick="G.coachPreRaceBlock='${opt.id}';render()">
          <div style="font-weight:600;font-size:13px">${opt.label}</div>
          <div style="font-size:12px;color:#888">${opt.desc}</div>
        </div>`;
      }).join('')}
    </div>

    <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doCoachLaunchRace()">🏁 Salida — ${esc(race.name)} →</button>
    <button class="main" style="margin-top:6px;border-color:#4a90d9;color:#4a90d9" onclick="doCoachDelegateRace()">📡 Delegar — ${esc(a.name)} corre solo</button>
    <div style="font-size:12px;color:#aaa;text-align:center;margin-top:4px">Te avisaré cuando acabe con el resultado</div>
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="G.coachDayCondition=null;G.screen='coachHome';render()">← Volver al hub</button>`;

  // Attach profile touch handlers
  setTimeout(()=>{
    const svg=document.getElementById(`prof-${race.id}`);
    if(!svg)return;
    svg.querySelectorAll('rect[data-seg]').forEach(r=>{
      const h=()=>{
        const si=parseInt(r.dataset.seg);
        const info=document.getElementById('coach-pre-prof-info');
        const wrap=document.getElementById('coach-pre-prof-wrap');
        if(!info||!wrap)return;
        const cur=info.dataset.sel;const next=cur==si?-1:si;
        info.dataset.sel=next;
        info.innerHTML=profSegInfo(race,next>=0?next:null,'preview',0);
        wrap.innerHTML=profSvg(race,next>=0?next:-1,'preview',0);
        setTimeout(()=>{const s2=document.getElementById(`prof-${race.id}`);if(s2)s2.querySelectorAll('rect[data-seg]').forEach(r2=>{r2.addEventListener('click',h);r2.addEventListener('touchend',e=>{e.preventDefault();h();});});},0);
      };
      r.addEventListener('click',h);r.addEventListener('touchend',e=>{e.preventDefault();h();});
    });
  },0);
}

window.doCoachLaunchRace=()=>{
  const race=(G.coachSelectedRaces||[])[G.coachRaceIdx];
  if(!race)return;
  // Apply pre-race choices
  const preBlock=G.coachPreRaceBlock||'nothing';
  let energyBonus=0;
  if(preBlock==='taper_race'){energyBonus=5;G._taperUsedThisRace=true;logCoachDecision('taper_used','Aplicaste taper antes de la carrera objetivo',true);}
  if(preBlock==='mental_talk'){G.coachTrust=Math.min(100,(G.coachTrust||60)+8);logCoachDecision('mental_talk','Conversación de motivación pre-carrera',true);}
  G.coachRaceData=coachBuildRaceData(race,energyBonus);
  G.coachRaceAnimIdx=0;G.coachRaceAidPaused=false;G.coachRaceEventPending=null;
  G.coachGelsUsed=0;G.coachRadioUsed={};G.coachAidExtras={};
  G.screen='coachRace';render();
  startCoachRaceAnim();
};

function coachBuildRaceData(race, extraEnergyBonus=0){
  const a=G.coachAthlete;const st=a.currentStats;

  // Day condition already set in renderCoachPreRace
  const dc=G.coachDayCondition||COACH_DAY_CONDITIONS[0];

  let energy=Math.max(0,Math.min(110,100+(dc.energyMod||0)+extraEnergyBonus));
  let legs=Math.max(0,Math.min(110,100+(dc.legsMod||0)));
  let hydration=Math.max(0,Math.min(100,100+(dc.hydMod||0)));
  const overload=(G.coachBodyLoad||0)>70?0.06:0;
  energy-=overload*100;legs-=overload*80;
  // Aplicar perfMod del estilo del entrenador al tiempo base de carrera
  const stylePerfMod=G.coachTrainerStyle?((TRAINER_STYLES[G.coachTrainerStyle]?.perfMod||0)/100):0;
  const segs=[];let totalTime=0;let aidCount=0;

  // Pick one mid-race event to inject (Tanda 2)
  const midEvt=COACH_MID_RACE_EVENTS[Math.floor(Math.random()*COACH_MID_RACE_EVENTS.length)];
  const midSegTarget=Math.floor(race.segs.length*0.45);

  for(let i=0;i<race.segs.length;i++){
    const s=race.segs[i];
    const ef=s.type==='climb'?1.4:s.type==='descent'?0.8:1.0;
    energy=Math.max(0,energy-6*s.km*ef);
    legs=Math.max(0,legs-4*s.km*ef);
    hydration=Math.max(0,hydration-3*s.km);
    let bt=s.base;
    if(s.type==='climb')   bt*=Math.max(0.76,1.0-(st.subida-50)*0.004);
    if(s.type==='descent') bt*=Math.max(0.76,1.0-(st.bajada-50)*0.004);
    if(s.type==='flat')    bt*=Math.max(0.76,1.0-(st.velocidad-50)*0.003);
    bt*=Math.max(0.80,1.0-(st.resistencia-50)*RESISTANCE_SCALE_PER_KM*s.km);
    if(energy<30)bt*=1.12;if(legs<25)bt*=1.15;
    bt*=(0.97+Math.random()*0.06);
    bt*=(1-stylePerfMod); // estilo del entrenador mejora/empeora el tiempo
    totalTime+=bt;
    if(s.aid)aidCount++;
    const np=COACH_NARRATIVES[s.type]||COACH_NARRATIVES.flat;
    // Inject mid-race event on target segment (not on aid station)
    const isMidEvt=i===midSegTarget&&!s.aid;
    segs.push({idx:i,name:s.name,type:s.type,km:s.km,
      isAid:!!s.aid,aidNum:s.aid?aidCount:null,
      isMidEvent:isMidEvt,midEvent:isMidEvt?midEvt:null,
      energy:Math.max(0,Math.round(energy)),legs:Math.max(0,Math.round(legs)),
      hydration:Math.max(0,Math.round(hydration)),
      narrative:np[Math.floor(Math.random()*np.length)],cumTime:totalTime});
  }
  const n=18+G.coachSeason*3;
  // Generate rival times with names for live classification
  const rivalNames=[
    'Oriol Puig','Laia Bonell','Xavi Gómez','Sara Mateu','Iker Zubiaurre','Claire Dubois',
    'Pau Ferrer','Marta Soler','Jordi Vidal','Ana Roca','Mikel Etxebarria','Elena Camps',
    'David Muñoz','Neus Planell','Tomàs Mas','Carla Vidal','Raúl Pérez','Sílvia Bové',
    'Marc Pou','Laura Gil',
  ];
  const rivals=[];
  for(let i=0;i<n;i++){
    const rt=totalTime*(0.84+Math.random()*0.32);
    rivals.push({name:rivalNames[i%rivalNames.length],time:rt});
  }
  rivals.sort((a,b)=>a.time-b.time);
  // Find athlete position among rivals
  let pos=1;
  for(const rv of rivals){if(rv.time<totalTime)pos++;}
  pos=Math.min(pos,n+1);
  // Attach nearest rivals to each aid segment for display
  segs.forEach(seg=>{
    if(seg.isAid){
      // Estimate position at this point proportionally
      const progress=seg.cumTime/totalTime;
      const estTime=totalTime*progress;
      const nearRivals=rivals.map(rv=>({name:rv.name,time:rv.time*progress}))
        .sort((a,b)=>a.time-b.time);
      const myRank=nearRivals.filter(r=>r.time<estTime).length+1;
      const above=nearRivals.filter(r=>r.time<estTime).slice(-2);
      const below=nearRivals.filter(r=>r.time>=estTime).slice(0,2);
      seg.aidRivals={myRank,above,below,myTime:estTime};
    }
  });
  return{race,segments:segs,totalTime,finalPos:pos,totalParticipants:n+1,rivals};
}
let _coachRaceTimer=null;
let _coachRadioPauseTimer=null;
let _coachRadioPauseVal=0;  // countdown 0–35 (×100ms = 3.5s)
function clearCoachRadioPause(){
  if(_coachRadioPauseTimer){clearInterval(_coachRadioPauseTimer);_coachRadioPauseTimer=null;}
  _coachRadioPauseVal=0;
}

function startRadioPause(onDone){
  clearCoachRadioPause();
  _coachRadioPauseVal=35; // 35 × 100ms = 3.5s
  G.coachRadioWindowOpen=true;
  // Update the countdown bar every 100ms
  _coachRadioPauseTimer=setInterval(()=>{
    _coachRadioPauseVal--;
    const bar=document.getElementById('coach-radio-bar');
    const secs=document.getElementById('coach-radio-secs');
    if(bar)bar.style.width=(_coachRadioPauseVal/35*100)+'%';
    if(secs)secs.textContent=Math.ceil(_coachRadioPauseVal/10);
    if(_coachRadioPauseVal<=0){
      clearCoachRadioPause();
      G.coachRadioWindowOpen=false;
      onDone();
    }
  },100);
}

function startCoachRaceAnim(){
  clearCoachRaceTimer();
  clearCoachRadioPause();
  G.coachRadioWindowOpen=false;
  _coachRaceTimer=setInterval(()=>{
    if(G.coachRaceAidPaused||G.coachRaceEventPending||G.coachRadioWindowOpen)return;
    const data=G.coachRaceData;
    if(!data){clearCoachRaceTimer();return;}
    if(G.coachRaceAnimIdx>=data.segments.length){clearCoachRaceTimer();render();return;}
    const seg=data.segments[G.coachRaceAnimIdx];
    G.coachRaceAnimIdx++;
    // Pause for mid-race event
    if(seg.isMidEvent&&seg.midEvent){
      G.coachRaceEventPending=seg.midEvent;clearCoachRaceTimer();render();return;
    }
    // Pause for aid station
    if(seg.isAid&&G.coachRaceAnimIdx<data.segments.length){
      G.coachRaceAidPaused=true;clearCoachRaceTimer();render();return;
    }
    render();
    // Open 3.5s radio window (not on last seg, not on aid)
    if(G.coachRaceAnimIdx<data.segments.length&&!seg.isAid){
      startRadioPause(()=>{render();});
    }
  },1500);
}
function clearCoachRaceTimer(){
  if(_coachRaceTimer){clearInterval(_coachRaceTimer);_coachRaceTimer=null;}
}

window.doCoachSkipRace=()=>{
  const data=G.coachRaceData;if(!data)return;
  clearCoachRaceTimer();
  clearCoachRadioPause();
  // Avanzar todos los segmentos de golpe
  G.coachRaceAnimIdx=data.segments.length;
  G.coachRaceAidPaused=false;
  G.coachRaceEventPending=null;
  G.coachRadioWindowOpen=false;
  render();
};

function renderCoachRace(){
  const el=document.getElementById('main');
  const data=G.coachRaceData;
  if(!data){G.screen='coachHome';render();return;}
  const race=data.race;
  const shown=data.segments.slice(0,G.coachRaceAnimIdx);
  const isDone=G.coachRaceAnimIdx>=data.segments.length&&!G.coachRaceAidPaused&&!G.coachRaceEventPending;
  const aidSeg=G.coachRaceAidPaused?data.segments[G.coachRaceAnimIdx-1]:null;
  const midEvt=G.coachRaceEventPending;
  const currentSeg=!isDone&&!G.coachRaceAidPaused&&!midEvt&&G.coachRaceAnimIdx>0?data.segments[G.coachRaceAnimIdx-1]:null;
  const COL={climb:'#639922',descent:'#E24B4A',flat:'#888780'};
  const ICO={climb:'▲',descent:'▼',flat:'▶'};
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const fb=document.getElementById('fin-bar');if(fb)fb.style.display='none';
  const kmDone=shown.reduce((s,x)=>s+x.km,0);
  const pct=Math.round(G.coachRaceAnimIdx/data.segments.length*100);
  const rival=G.coachAthlete?.rivalName||'el rival';
  const aName=G.coachAthlete?.name||'el atleta';
  const dc=G.coachDayCondition;
  const gelsLeft=(G.coachGels||3)-(G.coachGelsUsed||0);
  const lastSeg=shown[shown.length-1];

  // Radio: show only when the 3.5s window is open
  const showRadio=G.coachRadioWindowOpen&&!G.coachRaceAidPaused&&!midEvt&&!isDone;
  const radioUsedHere=G.coachRadioUsed[G.coachRaceAnimIdx-1];
  const highTrust=G.coachTrust>=70;

  el.innerHTML=`
    ${dc&&G.coachRaceAnimIdx<=1?`<div class="hint" style="margin-bottom:10px;font-size:12px">🌅 ${dc.text}</div>`:''}
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="flex:1">
        <div style="font-size:15px;font-weight:700">${esc(race.name)}</div>
        <div style="font-size:12px;color:#888">${race.type} · ${race.km}km · ${race.desnivel}</div>
      </div>
      <div style="font-size:12px;background:#f5f4f0;padding:4px 10px;border-radius:6px;flex-shrink:0">${Math.round(kmDone)}/${race.km}km</div>
    </div>
    <div style="height:5px;background:#e5e4de;border-radius:3px;margin-bottom:6px;overflow:hidden">
      <div style="width:${pct}%;height:100%;background:#4a90d9;border-radius:3px;transition:width .4s"></div>
    </div>
    ${!isDone?`<div style="text-align:right;margin-bottom:10px">
      <button onclick="doCoachSkipRace()" style="background:none;border:1px solid #e0dfd8;border-radius:6px;padding:3px 10px;font-size:11px;color:#aaa;cursor:pointer">⏭ Saltar al resultado</button>
    </div>`:''}

    ${shown.length===0?`<div style="text-align:center;padding:30px 0;color:#aaa;font-size:14px">⏳ Preparando salida...</div>`:''}
    <div id="coach-race-feed">
    ${shown.map((seg,i)=>{
      const isLast=i===shown.length-1;
      const bg=seg.isAid?'#fef9ec':isLast&&!isDone?'#f0f6ff':'#fafaf8';
      const brd=seg.isAid?'#e8c97a':isLast&&!isDone?'#4a90d9':'#e0dfd8';
      const usedRadio=G.coachRadioUsed[i];
      return`<div class="narrative-item ${seg.isAid?'aid-stop':''}" style="background:${bg};border-color:${brd}">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-size:12px;font-weight:600;color:${COL[seg.type]}">${ICO[seg.type]} ${esc(seg.name)}</span>
          ${seg.isAid?`<span style="font-size:12px;font-weight:600;color:#c07a10">🔵 Avituallamiento</span>`:''}
        </div>
        <div style="font-size:13px;color:#555">${seg.narrative}</div>
        ${usedRadio?`<div style="font-size:11px;color:#4a90d9;margin-top:3px">📻 ${usedRadio}</div>`:''}
        ${isLast&&!isDone?`<div style="margin-top:5px;display:flex;gap:12px;font-size:12px;color:#888">
          <span>⚡ ${seg.energy}%</span><span>🦵 ${seg.legs}%</span><span>💧 ${seg.hydration}%</span>
          ${gelsLeft>0?`<span>🍬 ×${gelsLeft}</span>`:''}
        </div>`:''}
      </div>`;
    }).join('')}
    </div>

    ${showRadio&&!radioUsedHere?`
    <div style="margin-top:10px;background:#f0f6ff;border:0.5px solid #4a90d9;border-radius:10px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:12px;font-weight:700;color:#4a90d9">📻 Radio</div>
        <div style="font-size:11px;color:#aaa">Se cierra solo en <span id="coach-radio-secs">${Math.ceil(_coachRadioPauseVal/10)}</span>s</div>
      </div>
      <div style="height:3px;background:#dde8f8;border-radius:2px;overflow:hidden;margin-bottom:10px">
        <div id="coach-radio-bar" style="height:100%;background:#4a90d9;border-radius:2px;width:${(_coachRadioPauseVal/35*100).toFixed(0)}%;transition:width .1s linear"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        ${COACH_RADIO_MESSAGES.map((m,mi)=>{
          const disabled=m.id==='attack'&&lastSeg?.energy<20;
          const canAlone=m.id==='silent'&&highTrust;
          return`<button onclick="doCoachRadio(${mi})" style="padding:8px;border-radius:6px;border:0.5px solid ${canAlone?'#4a8a2a':'#ddd'};background:${canAlone?'#f2faf0':'#fff'};font-size:12px;text-align:left;cursor:pointer;opacity:${disabled?0.4:1}" ${disabled?'disabled':''}>
            <div style="font-weight:600">${m.label}</div>
            <div style="color:#aaa;font-size:11px">${m.desc}</div>
          </button>`;
        }).join('')}
      </div>
    </div>`:''}

    ${showRadio&&radioUsedHere?`
    <div style="margin-top:8px;background:#f8f7f3;border:0.5px solid #e0dfd8;border-radius:8px;padding:8px 12px">
      <span style="font-size:12px;color:#4a90d9">📻 ${radioUsedHere}</span>
    </div>`:''}

    ${midEvt&&!isDone?`
    <div class="card" style="border-color:#c07a10;border-width:1.5px;margin-top:10px">
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">${midEvt.icon||'⚡'} ${esc(midEvt.title)}</div>
      <div style="font-size:13px;color:#555;margin-bottom:12px;font-style:italic">"${(midEvt.desc||'').replace(/\{\{name\}\}/g,esc(aName)).replace(/\{\{rival\}\}/g,esc(rival))}"</div>
      ${midEvt.choices.map((c,ci)=>`
        <button class="main" style="margin-top:${ci===0?'0':'6px'}" onclick="doCoachMidRaceEvent(${ci})">${c.text}</button>
      `).join('')}
    </div>`:''}

    ${aidSeg&&!midEvt?`
    <div class="card" style="border-color:#4a90d9;margin-top:10px">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px">📍 Avituallamiento ${aidSeg.aidNum||''} — ¿Qué hace ${esc(aName)}?</div>
      <div style="display:flex;gap:12px;font-size:12px;color:#888;margin-bottom:10px">
        <span>⚡ ${aidSeg.energy}%</span><span>🦵 ${aidSeg.legs}%</span><span>💧 ${aidSeg.hydration}%</span><span>🍬 ×${gelsLeft}</span>
      </div>
      ${aidSeg.energy<30||aidSeg.legs<25?`<div class="warn" style="margin-bottom:10px;font-size:12px">⚠️ El atleta llega muy cargado. Continuar tiene riesgo real.</div>`:''}
      ${(G.coachNemesis&&G.coachNemesis.wins>=2)?`<div class="hint" style="margin-bottom:10px;font-size:12px">🎯 ${esc(G.coachNemesis.name)} está por delante. Puede que estés a tiempo.</div>`:''}

      ${aidSeg.aidRivals?`
      <div style="background:#f5f4f0;border-radius:8px;padding:8px 12px;margin-bottom:10px">
        <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">Clasificación en este punto</div>
        ${aidSeg.aidRivals.above.map(r=>`
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;padding:2px 0">
            <span>#${aidSeg.aidRivals.myRank-(aidSeg.aidRivals.above.indexOf(r)+1)} ${esc(r.name)}</span>
            <span style="color:#c0392b">−${fmt(aidSeg.aidRivals.myTime-r.time)}</span>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#1a1a1a;padding:3px 0;background:#fff;border-radius:4px;padding:4px 8px;margin:3px -8px">
          <span>#${aidSeg.aidRivals.myRank} ${esc(aName)}</span>
          <span>← aquí</span>
        </div>
        ${aidSeg.aidRivals.below.map(r=>`
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;padding:2px 0">
            <span>#${aidSeg.aidRivals.myRank+(aidSeg.aidRivals.below.indexOf(r)+1)} ${esc(r.name)}</span>
            <span style="color:#2d7a2d">+${fmt(r.time-aidSeg.aidRivals.myTime)}</span>
          </div>`).join('')}
      </div>`:''}

      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">Ritmo</div>
      <button class="main" style="margin-top:0" onclick="doCoachAidAdvice('mantener')">Continúa como vas</button>
      <button class="main" style="margin-top:6px" onclick="doCoachAidAdvice('bajar')">Baja el ritmo — ahorra para el final</button>
      ${aidSeg.energy<30||aidSeg.legs<25?`<button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b" onclick="doCoachAidAdvice('abandonar')">Abandona — conserva el cuerpo</button>`:''}

      ${gelsLeft>0&&!G.coachAidExtras[aidSeg.aidNum||0]?`
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-top:12px;margin-bottom:6px">Nutrición</div>
      <button class="main" style="margin-top:0;border-color:#c07a10;color:#c07a10" onclick="doCoachGiveGel(${aidSeg.aidNum||0})">
        🍬 Dar gel (${gelsLeft} disponibles) — +12% energía
      </button>`:''}

      ${race.km>=35&&!G.coachAidExtras['socks_'+( aidSeg.aidNum||0)]?`
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-top:12px;margin-bottom:6px">Cuidado del pie</div>
      <button class="main" style="margin-top:0" onclick="doCoachSocksChange(${aidSeg.aidNum||0})">
        🧦 Cambio de calcetines (+90s pero previene pérdida de piernas en km finales)
      </button>`:''}

      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-top:12px;margin-bottom:6px">Información táctica</div>
      <button class="main" style="margin-top:0" onclick="doCoachTacticInfo(${aidSeg.aidNum||0})">
        📊 Decirle su posición y diferencia con el siguiente
      </button>
    </div>`:''}

    ${isDone?`
      ${G.coachLastDialogue?`
        <div class="card" style="background:#fafaf8;border-color:#c07a10;margin-bottom:12px">
          <div style="font-size:12px;color:#c07a10;font-weight:600;margin-bottom:4px">${esc(aName)} · post-carrera</div>
          <div style="font-size:14px;color:#333;font-style:italic">${esc(G.coachLastDialogue)}</div>
        </div>`:''}
      <div class="card" style="background:#f0faf0;border-color:#4a8a2a;text-align:center;padding:20px;margin-bottom:0">
        <div style="font-size:32px;margin-bottom:6px">${data.finalPos<=3?'🏆':data.finalPos<=10?'🎯':'🏃'}</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:4px">${data.finalPos<=3?`Podio — #${data.finalPos}`:`Posición #${data.finalPos}`}</div>
        <div style="font-size:13px;color:#888">${data.totalParticipants} participantes · ${fmt(data.totalTime)}</div>
      </div>
      <button class="main" style="margin-top:12px;background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doCoachRaceFinish()">Registrar resultado →</button>`:''}`;

  setTimeout(()=>{
    const feed=document.getElementById('coach-race-feed');
    if(feed){const items=feed.querySelectorAll('.narrative-item');if(items.length)items[items.length-1].scrollIntoView({behavior:'smooth',block:'nearest'});}
  },50);
}

window.doCoachAidAdvice=advice=>{
  const data=G.coachRaceData;
  const aidSeg=data.segments[G.coachRaceAnimIdx-1];
  let trustDelta=0;
  if(advice==='abandonar'){
    const rightCall=aidSeg.energy<30||aidSeg.legs<25;
    trustDelta=rightCall?+3:-5;
    G.coachRaceResults.push({pos:999,dnf:true,prize:0,coachCut:0,raceName:data.race.name});
    G.coachTrust=Math.max(0,Math.min(100,G.coachTrust+trustDelta));
    G.coachBodyLoad=Math.max(0,G.coachBodyLoad-8);
    G.coachRaceIdx++;
    showToast('DNF — el atleta abandona','#c0392b');
    clearCoachRaceTimer();clearCoachRadioPause();G.coachRadioWindowOpen=false;
    G.screen='coachHome';render();return;
  }
  if(advice==='mantener')trustDelta=aidSeg.energy>50?+1:-1;
  if(advice==='bajar')   trustDelta=aidSeg.energy<45?+2:0;
  G.coachTrust=Math.max(0,Math.min(100,G.coachTrust+trustDelta));
  G.coachRaceAidPaused=false;
  startCoachRaceAnim();render();
};

window.doCoachRadio=msgIdx=>{
  const msg=COACH_RADIO_MESSAGES[msgIdx];if(!msg)return;
  const segIdx=G.coachRaceAnimIdx-1;
  G.coachRadioUsed[segIdx]=msg.label;
  // Close the radio window immediately and continue
  clearCoachRadioPause();
  G.coachRadioWindowOpen=false;
  // Apply effects to race data
  const data=G.coachRaceData;if(!data)return;
  if(msg.timeMod)data.totalTime+=msg.timeMod;
  if(msg.energyCost&&data.segments[segIdx])
    data.segments[segIdx].energy=Math.max(0,(data.segments[segIdx].energy||60)-msg.energyCost);
  if(msg.energySave&&data.segments[segIdx])
    data.segments[segIdx].energy=Math.min(100,(data.segments[segIdx].energy||60)+(msg.energySave||0));
  if(msg.trustBoost)G.coachTrust=Math.min(100,(G.coachTrust||60)+(msg.trustBoost||0));
  // Rebelde ignores sometimes
  if(G.coachAthlete?.personality==='rebelde'&&Math.random()<0.3){
    showToast(`${G.coachAthlete.name} ignora la indicación`,'#c0392b');
    G.coachRadioUsed[segIdx]='(ignorado)';
  } else {
    showToast(msg.id==='silent'?'Sin radio':msg.label,'#4a90d9');
  }
  render();
};

window.doCoachGiveGel=aidNum=>{
  if((G.coachGelsUsed||0)>=(G.coachGels||3))return;
  G.coachGelsUsed=(G.coachGelsUsed||0)+1;
  if(!G.coachAidExtras)G.coachAidExtras={};
  G.coachAidExtras[aidNum]=true;
  // Boost energy in remaining segs
  const data=G.coachRaceData;if(!data)return;
  const aidSegIdx=G.coachRaceAnimIdx-1;
  for(let i=aidSegIdx;i<data.segments.length;i++){
    data.segments[i].energy=Math.min(100,(data.segments[i].energy||60)+12);
  }
  data.totalTime-=15; // small time benefit from better energy
  showToast('🍬 Gel dado — +12% energía','#c07a10');
  render();
};

window.doCoachSocksChange=aidNum=>{
  if(!G.coachAidExtras)G.coachAidExtras={};
  G.coachAidExtras['socks_'+aidNum]=true;
  const data=G.coachRaceData;if(!data)return;
  data.totalTime+=90; // costs 90s
  // Protect legs in last 40% of race
  const startIdx=Math.floor(data.segments.length*0.6);
  for(let i=startIdx;i<data.segments.length;i++){
    data.segments[i].legs=Math.min(100,(data.segments[i].legs||40)+8);
  }
  showToast('🧦 Calcetines cambiados (+90s pero km finales mejor)','#888');
  render();
};

window.doCoachTacticInfo=aidNum=>{
  if(!G.coachAidExtras)G.coachAidExtras={};
  G.coachAidExtras['tactic_'+aidNum]=true;
  const data=G.coachRaceData;if(!data)return;
  const pos=data.finalPos;
  const gap=Math.floor(Math.random()*180+30);
  const highTrust=G.coachTrust>=70;
  let msg='';
  if(pos<=5){
    msg=`"Vas ${pos}º. El siguiente está a ${gap}s. Puedes alcanzarle."`;
    if(highTrust){data.totalTime-=20;G.coachTrust=Math.min(100,G.coachTrust+1);}
    else{data.totalTime-=8;}
  } else {
    msg=`"Llevas ${pos}º. El de delante está a ${gap}s. Gestiona y cierra posiciones."`;
    if(G.coachAthlete?.personality==='motivado'){
      G.coachTrust=Math.min(100,G.coachTrust+2);data.totalTime-=15;
    }
  }
  showToast('📊 Información dada','#4a90d9');
  // store message to show in feed
  const seg=data.segments[G.coachRaceAnimIdx-1];
  if(seg)seg.tacticMsg=msg;
  render();
};

window.doCoachRaceFinish=()=>{
  const data=G.coachRaceData;if(!data)return;
  const race=data.race;const pos=data.finalPos;
  const pct2=PRIZE_TABLE[pos-1]||0;
  const prize=pos<=8?Math.round(race.prize*pct2):0;
  const coachCut=Math.round(prize*0.20);
  const mFee=G.coachAthlete.monthlyFee||250;
  const trustD=pos<=3?+10:pos<=10?+5:pos<=20?+1:-3;
  const repG=pos<=3?8:pos<=10?3:pos<=20?1:0;

  // Generate post-race dialogue (E1: cruzado con trust)
  const pers=G.coachAthlete.personality;
  const dlgPool=COACH_POST_RACE_DIALOGUES[pers]||{};
  const cat=pos<=3?'great':pos<=10?'good':'bad';
  const trustNow=G.coachTrust||60;
  const trustKey=trustNow>=75?'highTrust':trustNow<=30?'lowTrust':null;
  const trustPool=trustKey&&dlgPool[trustKey]&&dlgPool[trustKey][cat];
  const basePool=dlgPool[cat]||dlgPool.bad||['"..."'];
  const pool=(trustPool&&trustPool.length&&Math.random()<0.6)?trustPool:basePool;
  G.coachLastDialogue=pool[Math.floor(Math.random()*pool.length)];

  // Nemesis tracking (Tanda 1) — rival who beats athlete most
  const rival=G.coachAthlete.rivalName||'un rival';
  if(pos>5){
    if(!G.coachNemesis)G.coachNemesis={name:rival,wins:1};
    else G.coachNemesis.wins=(G.coachNemesis.wins||0)+1;
  }

  G.coachRaceResults.push({pos,dnf:false,prize,coachCut,raceName:race.name,tier:race.tier||'local'});
  G.coachEarnings=(G.coachEarnings||0)+coachCut+mFee;
  // Sponsor income
  (G.coachSponsors||[]).forEach(sp=>{
    const monthly=Math.round((sp.salary||0)*(sp.coachCut||0.15)/12);
    G.coachEarnings=(G.coachEarnings||0)+monthly;
  });
  G.coachTrust=Math.max(0,Math.min(100,G.coachTrust+trustD));
  // Aplicar modificador de confianza del estilo del entrenador
  if(G.coachTrainerStyle){
    const st=TRAINER_STYLES[G.coachTrainerStyle];
    G.coachTrust=Math.max(0,Math.min(100,G.coachTrust+(st.trustMod||0)));
  }
  G.coachReputation=Math.min(100,(G.coachReputation||0)+repG);
  G.coachBodyLoad=bodyLoadAfterRace(race.km);
  // Aplicar bodyLoadMod del estilo
  if(G.coachTrainerStyle){
    const st=TRAINER_STYLES[G.coachTrainerStyle];
    G.coachBodyLoad=Math.max(0,Math.min(100,G.coachBodyLoad+(st.bodyLoadMod||0)));
  }

  // Injury check based on bodyLoad
  if(!G.coachInjury){
    const load=G.coachBodyLoad;
    const candidates=COACH_INJURY_TYPES.filter(t=>load>=t.causeLoad);
    if(candidates.length&&Math.random()<(load-65)/100){
      const inj=candidates[Math.floor(Math.random()*candidates.length)];
      G.coachInjury={...inj,racesLeft:inj.racesOut};
      // Apply stat penalties
      Object.entries(inj.statPenalty||{}).forEach(([k,v])=>{
        if(G.coachAthlete.currentStats[k]!==undefined)
          G.coachAthlete.currentStats[k]=Math.max(10,G.coachAthlete.currentStats[k]+v);
      });
      G.coachTrust=Math.max(0,G.coachTrust-4); // coach pushed too hard
      logCoachDecision('forced_injury','Forzaste al atleta hasta la lesión',false);
      showToast(`⚠️ ${inj.label} — ${inj.racesOut} carrera${inj.racesOut>1?'s':''} de baja`,'#c0392b');
    }
  } else {
    // Recover: each race ticks down
    G.coachInjury.racesLeft=Math.max(0,(G.coachInjury.racesLeft||1)-1);
    if(G.coachInjury.racesLeft===0)G.coachInjury=null;
  }

  G.coachRaceIdx++;G.coachRaceData=null;
  G.coachRaceEventPending=null;G.coachDayCondition=null;

  const isDnf=pos>=99;
  // Registrar decisión positiva si hubo podio
  if(pos<=3&&!isDnf)logCoachDecision('podio_logrado','El atleta consiguió podio',true);
  if(isDnf)logCoachDecision('dnf_carrera','El atleta abandonó una carrera',false);

  // Actualizar estado emocional tras carrera
  updateEmotionalState();
  updateCoachTrait();

  // Generate a between-race event for next coachHome visit (Tanda 1)
  generateCoachBetweenEvent();

  // Guardar datos de la carrera acabada para usarlos en postRace
  G._lastRaceResult={pos,isDnf:false,raceName:race.name,prize,coachCut,dialogue:G.coachLastDialogue};
  autoSave();
  G.screen='coachPostRace';render();
};

// ══════════════════════════════════════
//  POST-CARRERA UNIFICADA (E16)
// ══════════════════════════════════════
function renderCoachPostRace(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const a=G.coachAthlete;if(!a){G.screen='coachHome';render();return;}
  const r=G._lastRaceResult||{pos:0,raceName:'Carrera',prize:0,coachCut:0};
  const es=EMOTIONAL_STATES[G.coachEmotionalState||'fresco'];
  const isAllDone=(G.coachRaceIdx>=(G.coachSelectedRaces||[]).length);
  const nextRace=!isAllDone?(G.coachSelectedRaces||[])[G.coachRaceIdx]:null;

  // Reacción del atleta según estilo del entrenador
  const style=G.coachTrainerStyle?TRAINER_STYLES[G.coachTrainerStyle]:null;
  const styleReaction=style?(r.pos<=5?style.reactionGood:style.reactionBad):null;

  // Propuesta de bloque de entrenamiento para después
  const suggestedBlock=G.coachBodyLoad>70?'Recuperación activa — la carga está alta'
    :r.pos<=3?'Mantén el ritmo — estás en buena forma'
    :r.pos>15?'Bloque de resistencia — hay margen de mejora'
    :'Entrenamiento técnico — afina los puntos débiles';
  const taperWasUsed=G._taperUsedThisRace||false;
  G._taperUsedThisRace=false; // reset para próxima carrera

  el.innerHTML=`
    <div style="text-align:center;padding:16px 0 14px">
      <div style="font-size:40px;margin-bottom:8px">${r.pos===1?'🥇':r.pos<=3?'🏆':r.pos<=10?'🎯':'📋'}</div>
      <h2 style="margin-bottom:2px">#${r.pos} — ${esc(r.raceName)}</h2>
      <p class="sub">${a.name} · Temporada ${G.coachSeason}</p>
    </div>

    ${G.coachLastDialogue?`
    <div class="card" style="margin-bottom:12px;border-left:3px solid ${es.color}">
      <div style="font-size:12px;color:#aaa;margin-bottom:4px">${a.name} dice:</div>
      <div style="font-size:14px;color:#333;font-style:italic">"${esc(G.coachLastDialogue)}"</div>
      <div style="font-size:11px;color:#aaa;margin-top:6px">${es.emoji} Estado: <strong style="color:${es.color}">${es.label}</strong></div>
    </div>`:''}

    ${styleReaction?`
    <div class="hint" style="margin-bottom:12px">
      <div style="font-size:11px;color:#aaa;margin-bottom:2px">Reacción a tu estilo ${TRAINER_STYLES[G.coachTrainerStyle].emoji}:</div>
      <div style="font-size:13px;color:#555;font-style:italic">${esc(styleReaction)}</div>
    </div>`:''}

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Balance de la carrera</div>
      <div class="fin-row"><span>Posición</span><span style="font-weight:700;color:${r.pos<=3?'#c07a10':'#1a1a1a'}">#${r.pos}</span></div>
      ${r.prize>0?`<div class="fin-row"><span>Premio</span><span class="plus">+€${r.prize}</span></div>`:''}
      ${r.coachCut>0?`<div class="fin-row"><span>Tu comisión (20%)</span><span class="plus">+€${r.coachCut}</span></div>`:''}
      <div class="fin-row"><span>Confianza del atleta</span><span style="font-weight:700;color:${G.coachTrust>=60?'#2d7a2d':G.coachTrust>=30?'#c07a10':'#c0392b'}">${G.coachTrust}/100</span></div>
      <div class="fin-row"><span>Carga corporal</span><span style="color:${G.coachBodyLoad>70?'#c0392b':G.coachBodyLoad>50?'#c07a10':'#2d7a2d'}">${Math.round(G.coachBodyLoad)}%</span></div>
    </div>

    ${G.coachPendingEvent?`
    <div class="card" style="margin-bottom:12px;border-color:#c07a10;border-width:1.5px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:22px">${G.coachPendingEvent.icon||'📋'}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:#c07a10">${G.coachPendingEvent.title}</div>
          <div style="font-size:12px;color:#888">Hay algo pendiente de resolver</div>
        </div>
      </div>
    </div>`:''}

    ${taperWasUsed?`
    <div style="background:#f2faf0;border:1px solid #b8ddb8;border-radius:10px;padding:11px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">⚡</span>
      <div>
        <div style="font-size:13px;font-weight:700;color:#2d7a2d">Descarga previa aplicada</div>
        <div style="font-size:12px;color:#555;margin-top:2px">El taper de esta semana aportó +5% de energía/piernas al inicio. ${r.pos<=5?'Los datos confirman que llegaste más fresco.':'Aunque el resultado no fue el esperado, el cuerpo estaba a punto.'}</div>
      </div>
    </div>`:''}

    <div class="card" style="margin-bottom:14px">
      <div class="sec-title-sm">Siguiente paso</div>
      <div style="font-size:13px;color:#555;margin-bottom:8px">💡 ${suggestedBlock}</div>
      ${nextRace?`<div style="font-size:12px;color:#888">Próxima carrera: <strong>${esc(nextRace.name)}</strong></div>`:'<div style="font-size:12px;color:#2d7a2d">✅ Temporada completada — puedes ver el balance.</div>'}
    </div>

    ${isAllDone
      ?`<button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="G.screen='coachSeasonEnd';render()">Ver balance de temporada →</button>`
      :`<button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="G._lastRaceResult=null;G.screen='coachHome';render()">Continuar →</button>`
    }`;
}

function renderCoachSeasonEnd(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const a=G.coachAthlete;
  const results=G.coachRaceResults||[];
  const wins=results.filter(r=>r.pos===1&&!r.dnf).length;
  const podiums=results.filter(r=>r.pos<=3&&!r.dnf).length;
  const dnfs=results.filter(r=>r.dnf).length;
  const totalCut=results.reduce((s,r)=>s+(r.coachCut||0),0);
  const mFees=(a.monthlyFee||250)*12;
  const sponsorIncome=(G.coachSponsors||[]).reduce((s,sp)=>s+Math.round((sp.salary||0)*(sp.coachCut||0.15)),0);
  const total=totalCut+mFees+sponsorIncome;
  const bestPos=results.filter(r=>!r.dnf).reduce((best,r)=>Math.min(best,r.pos),999);

  const obj=G.coachSeasonObjective;
  let objMet=false,objTrustDelta=0;
  if(obj){
    try{objMet=obj.checkAll?obj.checkAll(results):results.some(r=>obj.check(r,results));}catch(e){objMet=false;}
    G.coachSeasonObjective={...obj,met:objMet};
    objTrustDelta=objMet?(obj.reward||8):(obj.penalty||-5);
    G.coachTrust=Math.max(0,Math.min(100,G.coachTrust+objTrustDelta));
  }

  const sponsorResults=(G.coachSponsors||[]).map(sp=>{
    let met=false;
    if(sp.objKey==='finish2')met=results.filter(r=>!r.dnf).length>=2;
    else if(sp.objKey==='finish3')met=results.filter(r=>!r.dnf).length>=3;
    else if(sp.objKey==='top15')met=results.some(r=>r.pos<=15&&!r.dnf);
    else if(sp.objKey==='top10')met=results.some(r=>r.pos<=10&&!r.dnf);
    else if(sp.objKey==='top5')met=results.some(r=>r.pos<=5&&!r.dnf);
    else if(sp.objKey==='podio')met=results.some(r=>r.pos<=3&&!r.dnf);
    return{...sp,met};
  });

  const completedSeasons=((G.coachAthleteHistory||[]).filter(h=>h.completed).length)+(G.coachSeason-1);
  const clubUnlock=completedSeasons>=2;
  const trust=G.coachTrust||0;
  const log=G.coachDecisionLog||[];
  const posDecisions=log.filter(d=>d.positive).length;
  const negDecisions=log.filter(d=>!d.positive).length;
  const es=EMOTIONAL_STATES[G.coachEmotionalState||'fresco'];
  const thisSeasonLog=log.filter(d=>d.season===G.coachSeason);

  const isEnthusiastic=trust>=70&&posDecisions>=2&&negDecisions===0;
  const isBreakup=trust<40;

  const endingConfig=isEnthusiastic?{
    headerEmoji:'🏆',
    headerBg:'linear-gradient(135deg,#f2faf0,#e8f4e8)',
    headerBorder:'#2d7a2d',
    titleColor:'#2d7a2d',
    titleText:'Temporada extraordinaria',
    subtitleText:`Una relación que crece. ${esc(a.name)} confía en ti completamente.`,
    athleteQuote:wins>=2
      ?`"Esto lo hemos construido juntos. No me imagino trabajando con otro entrenador."`
      :podiums>=1
      ?`"Cada decisión que tomaste este año tenía sentido. Gracias por creer en mí."`
      :`"No han sido los resultados que queríamos, pero el proceso ha sido de los mejores de mi carrera."`,
    quoteBorder:'#2d7a2d',
    narrativeFn:()=>{
      if(wins>=2)return`Temporada brillante. ${esc(a.name)} llegó al podio ${wins} veces y el trabajo conjunto se nota.`;
      if(wins===1)return`Una victoria y la confianza por las nubes. La progresión es real y el atleta lo sabe.`;
      if(podiums>=1)return`Sin victorias, pero la relación es el activo más valioso. Una base sólida para el año que viene.`;
      return`Los resultados no acompañaron, pero la confianza se ha construido. Eso vale más que cualquier posición.`;
    },
  }:isBreakup?{
    headerEmoji:negDecisions>=2?'💔':G.coachEmotionalState==='quemado'?'🩶':'😶',
    headerBg:'linear-gradient(135deg,#fff5f5,#fde8e8)',
    headerBorder:'#c0392b',
    titleColor:'#c0392b',
    titleText:'Temporada que termina mal',
    subtitleText:`${esc(a.name)} no seguirá. Hay que analizar qué falló.`,
    athleteQuote:negDecisions>=2
      ?`"Hubo decisiones que no entendí. Necesito un entrenador que confíe en mí de otra manera."`
      :G.coachEmotionalState==='quemado'
      ?`"Estoy agotado. No físicamente — por dentro. Necesito empezar de cero con alguien."`
      :`"No hemos conectado este año. No es culpa de nadie, pero necesito un cambio."`,
    quoteBorder:'#c0392b',
    narrativeFn:()=>{
      if(negDecisions>=2)return`Las tensiones acumuladas fueron demasiado. ${esc(a.name)} recuerda decisiones que le pesaron.`;
      if(G.coachEmotionalState==='quemado')return`El desgaste emocional fue excesivo. La temporada terminó antes de terminar.`;
      if(dnfs>=2)return`Demasiados abandonos. La confianza se erosionó carrera a carrera.`;
      return`La confianza nunca llegó a construirse. Dos personas que no encontraron su ritmo juntos.`;
    },
  }:{
    headerEmoji:wins>=1?'🎯':podiums>=1?'📈':'📋',
    headerBg:'linear-gradient(135deg,#fefcf8,#f5f3ef)',
    headerBorder:'#e0dfd8',
    titleColor:'#1a1a1a',
    titleText:'Balance de temporada',
    subtitleText:`Temporada ${G.coachSeason} con ${esc(a.name)}`,
    athleteQuote:trust>=60
      ?`"Ha sido una temporada correcta. Creo que podemos hacer más el año que viene."`
      :`"No ha sido fácil. Seguimos, pero hay cosas que mejorar entre los dos."`,
    quoteBorder:'#e0dfd8',
    narrativeFn:()=>{
      if(wins>=1)return`Una victoria. La temporada tiene valor aunque no llegara a todo lo esperado.`;
      if(podiums>=1)return`Varios podios. La base es buena — queda margen para crecer.`;
      if(dnfs>=2)return`Demasiados abandonos. Hay que revisar la carga y el calendario.`;
      if(G.coachInjury)return`La lesión marcó la temporada. Lo que importa ahora es la recuperación completa.`;
      return`Una temporada discreta pero honesta. Hay base para construir algo mejor.`;
    },
  };

  el.innerHTML=`
    <div style="background:${endingConfig.headerBg};border:1.5px solid ${endingConfig.headerBorder};border-radius:14px;padding:20px 16px;margin-bottom:14px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">${endingConfig.headerEmoji}</div>
      <h2 style="color:${endingConfig.titleColor};margin-bottom:4px">${endingConfig.titleText}</h2>
      <p class="sub" style="margin-bottom:0">${endingConfig.subtitleText}</p>
    </div>

    <div class="card" style="margin-bottom:12px;border-left:3px solid ${endingConfig.quoteBorder}">
      <div style="font-size:12px;color:#aaa;margin-bottom:4px">${esc(a.name)} al final de temporada:</div>
      <div style="font-size:14px;color:#333;font-style:italic">${endingConfig.athleteQuote}</div>
      <div style="font-size:11px;color:#aaa;margin-top:6px">${es.emoji} Estado: <strong style="color:${es.color}">${es.label}</strong></div>
    </div>

    <div class="card" style="margin-bottom:12px;border-left:3px solid ${endingConfig.quoteBorder}">
      <div style="font-size:13px;color:#555;font-style:italic;margin-bottom:${thisSeasonLog.length?'10px':'0'}">"${endingConfig.narrativeFn()}"</div>
      ${thisSeasonLog.length?`
        <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">Tu huella esta temporada</div>
        ${thisSeasonLog.map(d=>`
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f5f4f0">
            <span style="font-size:13px">${d.positive?'✅':'⚠️'}</span>
            <span style="font-size:12px;color:#555">${esc(d.label)}</span>
          </div>`).join('')}`:''}
    </div>

    ${obj?`
    <div class="card" style="margin-bottom:12px;border-color:${objMet?'#4a8a2a':'#f5b8b8'};border-width:1.5px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">${objMet?'✅':'❌'}</span>
        <div style="flex:1">
          <div style="font-size:12px;color:#888;margin-bottom:2px">Objetivo de ${esc(a.name)}</div>
          <div style="font-size:13px;font-weight:600">${obj.label}</div>
          ${obj.fromHistory?`<div style="font-size:11px;color:#4a90d9;margin-top:2px">Basado en tu historial juntos</div>`:''}
        </div>
        <span style="font-size:13px;font-weight:700;color:${objTrustDelta>=0?'#2d7a2d':'#c0392b'}">${objTrustDelta>=0?'+':''}`+`${objTrustDelta} conf.</span>
      </div>
    </div>`:''}

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Resultados</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
        ${[['Carreras',results.filter(r=>!r.dnf).length],['Podios',podiums],['DNF',dnfs],['Mejor','#'+(bestPos<999?bestPos:'—')]].map(([l,v])=>`
          <div style="background:#f5f4f0;border-radius:8px;padding:8px">
            <div style="font-size:11px;color:#aaa">${l}</div>
            <div style="font-size:18px;font-weight:700">${v}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Economía</div>
      <div class="fin-row"><span>Honorarios (12 meses)</span><span class="plus">+€${mFees}</span></div>
      <div class="fin-row"><span>Bonus podios (20%)</span><span class="plus">+€${totalCut}</span></div>
      ${sponsorIncome>0?`<div class="fin-row"><span>Comisión sponsors</span><span class="plus">+€${sponsorIncome}</span></div>`:''}
      <div class="fin-row tot"><span>Total temporada</span><span class="plus">+€${total}</span></div>
      <div style="font-size:12px;color:#aaa;margin-top:6px">Reputación entrenador: ${G.coachReputation}/100</div>
    </div>

    ${sponsorResults.length>0?`
    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Sponsors</div>
      ${sponsorResults.map(sp=>`
        <div class="history-row">
          <div>
            <div style="font-size:13px;font-weight:500">${esc(sp.name)}</div>
            <div style="font-size:12px;color:#888">${sp.objective}</div>
          </div>
          <span style="font-size:12px;font-weight:700;color:${sp.met?'#2d7a2d':'#c0392b'}">${sp.met?'✓ Cumplido':'✗ No cumplido'}</span>
        </div>`).join('')}
    </div>`:''}

    <div class="card" style="margin-bottom:14px;border-color:${isEnthusiastic?'#2d7a2d':isBreakup?'#c0392b':'#e0dfd8'};border-width:${isEnthusiastic||isBreakup?'1.5px':'1px'}">
      <div class="sec-title-sm">Decisión del atleta</div>
      ${isEnthusiastic?`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0">
          <span style="font-size:22px">🤝</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:#2d7a2d">${esc(a.name)} quiere renovar con más ambición</div>
            <div style="font-size:12px;color:#555;margin-top:2px">Confía plenamente. Propone mejorar condiciones.</div>
          </div>
        </div>
        <button class="main" style="margin-top:8px;background:#2d7a2d;color:#fff;border-color:#2d7a2d" onclick="doCoachRenewEnthusiastic()">Renovar — condiciones mejoradas →</button>
        <button class="main" style="margin-top:6px;opacity:0.5" onclick="doCoachNewAthlete()">Buscar nuevo atleta en su lugar</button>`
      :isBreakup?`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0">
          <span style="font-size:22px">🚪</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:#c0392b">${esc(a.name)} no renueva</div>
            <div style="font-size:12px;color:#555;margin-top:2px">${negDecisions>=2?'Demasiadas decisiones que le perjudicaron.':G.coachEmotionalState==='quemado'?'Necesita un cambio de aire tras el desgaste.':'La confianza no llegó a construirse.'}</div>
          </div>
        </div>
        <button class="main" style="margin-top:8px;background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doCoachNewAthlete()">Buscar nuevo atleta →</button>`
      :`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0">
          <span style="font-size:22px">📋</span>
          <div>
            <div style="font-size:14px;font-weight:600">${esc(a.name)} ${trust>=60?'quiere renovar':'está dispuesto a renovar'}</div>
            <div style="font-size:12px;color:#888;margin-top:2px">Confianza: ${trust}/100 · ${trust>=60?'La relación funciona.':'No ha sido fácil, pero sigue.'}</div>
          </div>
        </div>
        <button class="main" style="margin-top:8px;background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doCoachNextSeason()">Renovar — Temporada ${G.coachSeason+1} →</button>
        <button class="main" style="margin-top:6px;opacity:0.5" onclick="doCoachNewAthlete()">Buscar nuevo atleta en su lugar</button>`}
    </div>

    ${clubUnlock?`<div class="note" style="margin-bottom:12px">🏕️ <strong>Modo Club disponible</strong> — ${completedSeasons} temporadas completadas como entrenador.</div>`:''}
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="saveCoachSlot();G.screen='coachHub';render()">← Volver al hub</button>
    <button class="main" style="margin-top:6px;opacity:0.4" onclick="G=freshState();render()">← Menú principal</button>`;
}

// Renovación entusiasta: el atleta propone mejoras de condiciones
window.doCoachRenewEnthusiastic=()=>{
  const a=G.coachAthlete;
  Object.keys(a.currentStats).forEach(k=>{
    a.currentStats[k]=Math.min(98,a.currentStats[k]+Math.floor(Math.random()*4)+2);
  });
  a.monthlyFee=Math.round((a.monthlyFee||250)*1.10);
  showToast(`🤝 Renovación entusiasta — honorarios +10%`,'#2d7a2d');
  doCoachNextSeason();
};

window.doCoachNextSeason=()=>{
  if(!G.coachAthleteHistory)G.coachAthleteHistory=[];
  G.coachAthleteHistory.push({name:G.coachAthlete.name,season:G.coachSeason,
    wins:(G.coachRaceResults||[]).filter(r=>r.pos===1&&!r.dnf).length,
    podiums:(G.coachRaceResults||[]).filter(r=>r.pos<=3&&!r.dnf).length,
    bestPos:(G.coachRaceResults||[]).filter(r=>!r.dnf).reduce((b,r)=>Math.min(b,r.pos),999),
    trust:G.coachTrust,completed:true,emotionalState:G.coachEmotionalState});
  G.coachSeason++;G.coachSelectedRaces=[];G.coachRaceIdx=0;
  G.coachRaceResults=[];G.coachLastTraining=null;
  G.coachBodyLoad=Math.max(0,(G.coachBodyLoad||0)-20);
  G.coachPendingEvent=null;G.coachLastDialogue=null;
  G.coachRaceEventPending=null;G.coachEventLog=[];
  G.coachGels=3;G.coachGelsUsed=0;G.coachRadioUsed={};G.coachAidExtras={};G.coachPreRaceBlock=null;
  G.coachSeasonObjective=null;G.coachInjury=null;G.coachSponsors=[];G.coachSponsorPool=null;G.coachRadioWindowOpen=false;
  if(G.coachEmotionalState==='quemado')G.coachEmotionalState='dudoso';
  else if(G.coachEmotionalState==='confiado'||G.coachEmotionalState==='recuperado')G.coachEmotionalState='fresco';
  generateCoachSeasonObjective();
  generateCoachSponsorPool();
  const a=G.coachAthlete;
  Object.keys(a.currentStats).forEach(k=>{
    a.currentStats[k]=Math.min(95,a.currentStats[k]+Math.floor(Math.random()*3));
  });
  G.screen='coachHome';G.activeTab='game';saveCoachSlot();autoSave();render();
};

window.doCoachNewAthlete=()=>{
  if(!G.coachAthleteHistory)G.coachAthleteHistory=[];
  G.coachAthleteHistory.push({name:G.coachAthlete.name,season:G.coachSeason,
    wins:(G.coachRaceResults||[]).filter(r=>r.pos===1&&!r.dnf).length,
    trust:G.coachTrust,completed:false});
  // Clear current slot
  G.coachAthlete=null;G.coachSeason=1;G.coachRaceResults=[];
  G._coachSlotNotifs=[];
  const coached=(G.coachAthleteHistory||[]).map(h=>h.name);
  const avail=COACH_ATHLETE_POOL.filter(a=>!coached.includes(a.name));
  const src=shuffle((avail.length>=3?avail:COACH_ATHLETE_POOL));
  G.coachPool=src.slice(0,3).map(a=>({...a,currentStats:{...a.baseStats}}));
  saveCoachSlot(); // save empty slot back
  G.screen='coachSelect';render();
};
function renderCoachHub(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  saveCoachSlot();
  const roster=G.coachRoster||[];
  const rep=G.coachReputation||0;
  // E2: detectar desbloqueo de slot y celebrar
  const prevRep=G._prevCoachRep||0;
  if(prevRep<40&&rep>=40&&!G._slot1Celebrated){
    G._slot1Celebrated=true;
    setTimeout(()=>showToast('🎉 ¡Slot 2 desbloqueado! Ya puedes entrenar a un segundo atleta','#c07a10'),400);
  }
  if(prevRep<70&&rep>=70&&!G._slot2Celebrated){
    G._slot2Celebrated=true;
    setTimeout(()=>showToast('🌟 ¡Slot 3 desbloqueado! Agencia de tres atletas','#c0392b'),400);
  }
  G._prevCoachRep=rep;
  const repTier=rep<20?{label:'Entrenador novato',color:'#aaa'}:rep<40?{label:'Entrenador regional',color:'#4a90d9'}:rep<60?{label:'Entrenador conocido',color:'#2d7a2d'}:rep<80?{label:'Entrenador nacional',color:'#c07a10'}:{label:'Entrenador élite 🌟',color:'#c0392b'};
  const filledSlots=roster.filter(s=>s&&s.coachAthlete).length;

  // Build slot cards
  const slotCards=[0,1,2].map(idx=>{
    const slot=roster[idx];
    const unlocked=coachSlotUnlocked(idx);
    const notifs=coachSlotNotifCount(idx);
    const hasAthlete=slot&&slot.coachAthlete;

    if(!unlocked){
      const reqRep=idx===1?40:70;
      return`<div class="coach-slot-card locked-slot">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:24px;opacity:0.4">🔒</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#aaa">Slot ${idx+1} bloqueado</div>
            <div style="font-size:12px;color:#bbb">Necesitas reputación ≥${reqRep} · Actual: ${rep}</div>
          </div>
        </div>
      </div>`;
    }
    if(!hasAthlete){
      return`<div class="coach-slot-card empty-slot" onclick="addCoachSlot(${idx})">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:24px">➕</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#4a90d9">Añadir atleta al slot ${idx+1}</div>
            <div style="font-size:12px;color:#aaa">Presenta tres candidatos y elige uno</div>
          </div>
        </div>
      </div>`;
    }
    const a=slot.coachAthlete;
    const trust=slot.coachTrust||60;
    const trustColor=trust>=60?'#2d7a2d':trust>=30?'#c07a10':'#c0392b';
    const season=slot.coachSeason||1;
    const raceIdx=slot.coachRaceIdx||0;
    const totalRaces=(slot.coachSelectedRaces||[]).length;
    const allDone=totalRaces>0&&raceIdx>=totalRaces;
    const nextRace=totalRaces>0?(slot.coachSelectedRaces||[])[raceIdx]:null;
    const pendingEvent=slot.coachPendingEvent&&!slot.coachPendingEvent.resolved;
    const injury=slot.coachInjury&&slot.coachInjury.racesLeft>0;
    const unreadNotifs=(slot._coachSlotNotifs||[]).filter(x=>!x.read);
    const isActive=(G.coachActiveIdx||0)===idx;

    // Status text
    let statusText='';
    if(allDone)statusText='✅ Temporada completa — ver balance';
    else if(totalRaces===0)statusText='📅 Sin calendario — planificar';
    else if(injury)statusText=`🩹 Lesionado — ${slot.coachInjury.racesLeft} carrera${slot.coachInjury.racesLeft!==1?'s':''} de baja`;
    else if(nextRace)statusText=`🏁 Próxima: ${nextRace.name}`;
    else statusText='🏃 En entrenamiento';

    return`<div class="coach-slot-card ${isActive?'active-slot':''}" onclick="switchCoachSlot(${idx})">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:44px;height:44px;border-radius:50%;background:#f0ede8;border:2px solid #e0dfd8;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${a.flag}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.name)}</div>
            ${notifs>0?`<span class="notif-dot ${pendingEvent||unreadNotifs.some(n=>n.type==='urgent')?'urgent':''}"></span>`:''}
            ${isActive?`<span style="font-size:10px;background:#e8eef8;color:#2d4fa0;padding:1px 5px;border-radius:3px;font-weight:700">ACTIVO</span>`:''}
          </div>
          <div style="font-size:12px;color:#888;margin-bottom:6px">T${season} · ${SPEC_LABEL[a.spec]||a.spec} · Confianza <span style="color:${trustColor};font-weight:600">${trust}/100</span></div>
          <div style="font-size:12px;color:#555">${statusText}</div>
          ${unreadNotifs.length>0?`
          <div style="margin-top:8px;background:#f0f6ff;border-radius:6px;padding:7px 10px;border:1px solid #b8d4f0">
            ${unreadNotifs.slice(0,2).map(n=>`<div style="font-size:12px;color:#4a90d9;margin-bottom:2px">${n.text}</div>`).join('')}
            ${unreadNotifs.length>2?`<div style="font-size:11px;color:#aaa">+${unreadNotifs.length-2} más</div>`:''}
          </div>`:''}
        </div>
      </div>
    </div>`;
  }).join('');

  const hist=G.coachAthleteHistory||[];
  const totalWins=hist.reduce((s,h)=>s+(h.wins||0),0);
  const totalAthletes=hist.length+filledSlots;

  el.innerHTML=`
    <div style="text-align:center;padding:14px 0 16px">
      <div style="font-size:30px;margin-bottom:6px">📋</div>
      <h2 style="margin-bottom:2px">Centro de Entrenamiento</h2>
      <div style="font-size:13px;color:${repTier.color};font-weight:600">${repTier.label}</div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-around;text-align:center">
        ${[['Reputación',`${rep}/100`],['Atletas',totalAthletes],['Victorias',totalWins]].map(([l,v])=>`
          <div>
            <div style="font-size:18px;font-weight:700">${v}</div>
            <div style="font-size:11px;color:#aaa">${l}</div>
          </div>`).join('')}
      </div>
      <div style="height:5px;background:#e5e4de;border-radius:3px;margin-top:10px;overflow:hidden">
        <div style="width:${rep}%;height:100%;background:${repTier.color};border-radius:3px;transition:width .4s"></div>
      </div>
      ${rep<40?`<div style="font-size:11px;color:#aaa;margin-top:4px;text-align:center">Reputación ≥40 para un 2º atleta · ≥70 para un 3º</div>`:''}
    </div>

    ${(G._slot1Celebrated&&rep>=40&&rep<70)||(G._slot2Celebrated&&rep>=70)?`
    <div style="background:linear-gradient(135deg,#fffbf0,#fff8e8);border:1.5px solid #c07a10;border-radius:12px;padding:14px 16px;margin-bottom:14px;text-align:center">
      <div style="font-size:28px;margin-bottom:4px">${rep>=70?'🌟':'🎉'}</div>
      <div style="font-size:14px;font-weight:700;color:#c07a10">${rep>=70?'¡Slot 3 desbloqueado!':'¡Slot 2 desbloqueado!'}</div>
      <div style="font-size:12px;color:#888;margin-top:3px">${rep>=70?'Puedes llevar hasta 3 atletas simultáneamente.':'Puedes añadir un segundo atleta a tu agencia.'}</div>
    </div>`:''}

    <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Mis atletas</div>
    ${slotCards}

    ${hist.length>0?`
    <div class="card" style="margin-top:10px">
      <div class="sec-title-sm">Historial de atletas</div>
      ${hist.slice(-4).reverse().map(h=>`
        <div class="history-row">
          <div>
            <div style="font-size:13px;font-weight:500">${esc(h.name)}</div>
            <div style="font-size:12px;color:#888">T${h.season} · ${h.wins||0} victorias · Confianza final ${h.trust}/100</div>
          </div>
          <span style="font-size:11px;background:${h.completed?'#f0faf0':'#fef0f0'};color:${h.completed?'#2d7a2d':'#c0392b'};padding:2px 6px;border-radius:4px;font-weight:600">${h.completed?'Renovó':'No renovó'}</span>
        </div>`).join('')}
    </div>`:''}

    <button class="main" style="margin-top:12px;opacity:0.5" onclick="G=freshState();render()">← Menú principal</button>`;
}

window.addCoachSlot=idx=>{
  // Determine which slot to fill: if idx given, use it; else find first empty unlocked slot
  let targetIdx=idx!==undefined?idx:-1;
  if(targetIdx===-1){
    for(let i=0;i<3;i++){
      if(coachSlotUnlocked(i)&&!(G.coachRoster&&G.coachRoster[i]&&G.coachRoster[i].coachAthlete)){
        targetIdx=i;break;
      }
    }
  }
  if(targetIdx===-1){showToast('No hay slots disponibles','#c07a10');return;}
  // Save current slot, switch to target, show select
  saveCoachSlot();
  G.coachActiveIdx=targetIdx;
  // Init empty state for this slot
  coachSlotKeys().forEach(k=>{
    const defaults={coachAthlete:null,coachSeason:1,coachTrust:60,coachEarnings:0,
      coachSelectedRaces:[],coachRaceIdx:0,coachRaceResults:[],coachBodyLoad:0,
      coachRaceData:null,coachRaceAnimIdx:0,coachRaceAidPaused:false,coachLastTraining:null,
      coachNemesis:null,coachPendingEvent:null,coachLastDialogue:null,coachDayCondition:null,
      coachRaceEventPending:null,coachEventLog:[],coachGels:3,coachGelsUsed:0,
      coachRadioUsed:{},coachAidExtras:{},coachPreRaceBlock:null,coachSeasonObjective:null,
      coachInjury:null,coachSponsors:[],coachSponsorPool:null,coachRadioWindowOpen:false,
      coachTrainingSelected:null,coachPool:null,_coachSlotNotifs:[],
      coachEmotionalState:'fresco',coachDecisionLog:[]};
    if(k in defaults)G[k]=defaults[k];
  });
  const coached=(G.coachAthleteHistory||[]).map(h=>h.name);
  // Also exclude athletes already in other slots
  const activeNames=(G.coachRoster||[]).filter((s,i)=>i!==targetIdx&&s&&s.coachAthlete).map(s=>s.coachAthlete.name);
  const avail=COACH_ATHLETE_POOL.filter(a=>!coached.includes(a.name)&&!activeNames.includes(a.name));
  const src=shuffle((avail.length>=3?avail:COACH_ATHLETE_POOL));
  G.coachPool=src.slice(0,3).map(a=>({...a,currentStats:{...a.baseStats}}));
  G.screen='coachSelect';render();
};

window.doCoachDelegateRace=()=>{
  const race=(G.coachSelectedRaces||[])[G.coachRaceIdx];
  if(!race)return;
  const a=G.coachAthlete;
  // Apply pre-race block
  let energyBonus=0,trustBonus=0;
  if(G.coachPreRaceBlock==='taper_race')energyBonus=5;
  if(G.coachPreRaceBlock==='mental_talk'){trustBonus=8;G.coachTrust=Math.min(100,G.coachTrust+trustBonus);}
  // Apply day condition
  const dc=G.coachDayCondition||{energyMod:0,legsMod:0};
  // Simulate race silently using existing logic
  const stats=a.currentStats||a.baseStats;
  const basePerf=(stats.resistencia||50)*0.35+(stats.subida||50)*0.25+(stats.bajada||50)*0.2+(stats.velocidad||50)*0.2;
  const condMod=(energyBonus/100)+(dc.energyMod/100)+(dc.legsMod/200);
  const loadPenalty=Math.max(0,(G.coachBodyLoad||0)-60)/200;
  const injPenalty=G.coachInjury&&G.coachInjury.racesLeft>0?0.15:0;
  const rng=(Math.random()*0.2)-0.1;
  const finalPerf=Math.max(10,Math.min(95,basePerf*(1+condMod-loadPenalty-injPenalty)+rng*10));
  const tier=race.tier||'local';
  const numRivals={local:20,regional:40,nacional:80,elite:120}[tier]||30;
  const pos=Math.max(1,Math.round((1-(finalPerf/100))*numRivals*0.8)+1+Math.floor(Math.random()*3));
  const prize=pos<=3?race.prize||0:0;
  const coachCut=Math.round(prize*0.2);
  const trustD=pos<=3?+6:pos<=10?+3:pos<=20?0:-3;
  const repG=pos<=3?4:pos<=10?2:0;
  // Post-race dialogue (E1: con variantes de trust)
  const pers=a.personality;
  const dlgPool=COACH_POST_RACE_DIALOGUES[pers]||{};
  const cat=pos<=3?'great':pos<=10?'good':'bad';
  const trustNow2=G.coachTrust||60;
  const tKey=trustNow2>=75?'highTrust':trustNow2<=30?'lowTrust':null;
  const tPool=tKey&&dlgPool[tKey]&&dlgPool[tKey][cat];
  const bPool=dlgPool[cat]||['"..."'];
  const pool=(tPool&&tPool.length&&Math.random()<0.6)?tPool:bPool;
  const dialogue=pool[Math.floor(Math.random()*pool.length)];
  // Store result
  G.coachRaceResults.push({pos,dnf:false,prize,coachCut,raceName:race.name,tier,delegated:true});
  G.coachEarnings=(G.coachEarnings||0)+coachCut+(a.monthlyFee||250);
  G.coachTrust=Math.max(0,Math.min(100,G.coachTrust+trustD));
  G.coachReputation=Math.min(100,(G.coachReputation||0)+repG);
  G.coachBodyLoad=Math.min(100,(G.coachBodyLoad||0)+race.km*0.3);
  G.coachRaceIdx++;
  G.coachRaceData=null;G.coachDayCondition=null;G.coachPreRaceBlock=null;
  // Add notification
  const icon=pos<=3?'🏆':pos<=10?'🎯':'📋';
  addCoachNotif(`${icon} ${race.name} — ${pos<=3?'¡Podio! ':''}#${pos} · ${dialogue}`,'race_result');
  generateCoachBetweenEvent();
  saveCoachSlot();autoSave();
  showToast(`📡 ${esc(a.name)} ha terminado — #${pos}`,'#4a90d9');
  G.screen='coachHub';render();
};

// ══════════════════════════════════════
//  MODO CLUB — PANTALLAS
function renderClubCreate(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const name=G._clubNameDraft||'';
  const spec=G._clubSpecDraft||'mixto';
  const fil=G._clubFilDraft||'montanero';
  const specs=[
    {id:'montanero', label:'🏔️ Montaña',   desc:'Mejor en subidas y ultras de montaña'},
    {id:'fondista',  label:'🏃 Fondo',      desc:'Resistencia larga. Ultras y maratones'},
    {id:'tecnico',   label:'⚡ Técnico',    desc:'Corredores rápidos en terrenos difíciles'},
    {id:'mixto',     label:'🌐 Mixto',      desc:'Sin especialidad — plantilla variada'},
  ];
  el.innerHTML=`
    <div style="text-align:center;padding:14px 0 16px">
      <div style="font-size:32px;margin-bottom:6px">🏕️</div>
      <h2>Crear tu club</h2>
      <p class="sub">${G._clubUnlockedHint?'Con tu experiencia como corredor y entrenador, el club ya nace con algo de credibilidad.':'Define el nombre, especialidad y filosofía del club.'}</p>
    </div>
    ${G._clubUnlockedHint?`<div class="note" style="margin-bottom:14px;background:#E1F5EE;border-color:#9FE1CB;color:#085041">Tu historial habla por ti. Empiezas con presupuesto un 15% mayor y reputación inicial de 13 en lugar de 10.</div>`:''}
    <label class="field-label">Nombre del club</label>
    <input id="club-name-inp" type="text" placeholder="Ej: Gorbea Trail Club, Txindoki Runners..." maxlength="32" value="${esc(name)}" oninput="G._clubNameDraft=this.value;"/>
    <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Especialidad de la plantilla</div>
    ${specs.map(s=>`
      <div class="work-card${spec===s.id?' sel':''}" onclick="G._clubSpecDraft='${s.id}';render()" style="margin-bottom:6px${spec===s.id?';border-color:#1a1a1a;background:#f5f4f0':''}">
        <div style="font-size:14px;font-weight:600">${s.label}</div>
        <div style="font-size:12px;color:#888">${s.desc}</div>
      </div>`).join('')}
    <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin:14px 0 10px">Filosofía del club (C9)</div>
    ${Object.entries(CLUB_FILOSOFIAS).map(([id,f])=>`
      <div class="work-card${fil===id?' sel':''}" onclick="G._clubFilDraft='${id}';render()" style="margin-bottom:6px${fil===id?`;border-color:${f.color};background:${f.color}11`:''};cursor:pointer">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">${f.emoji}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:${fil===id?f.color:'#1a1a1a'}">${f.label}</div>
            <div style="font-size:12px;color:#888">${f.desc}</div>
          </div>
        </div>
      </div>`).join('')}
    <div class="hint" style="margin-top:10px;margin-bottom:14px">Empiezas con 3 corredores, 8 socios, €800 de presupuesto y cohesión 50/100.</div>
    <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doClubCreate()">Fundar el club →</button>
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="G.screen='modeSelect';render()">← Volver</button>`;
}

window.doClubCreate=()=>{
  const nameEl=document.getElementById('club-name-inp');
  const name=(nameEl?nameEl.value:G._clubNameDraft||'').trim()||'Mi Club Trail';
  const spec=G._clubSpecDraft||'mixto';
  const fil=G._clubFilDraft||'montanero';
  G.clubModeData=initClubModeData(name,spec,fil);
  // Guiño narrativo si el modo está desbloqueado: presupuesto +15% y reputación inicial +3
  if(G._clubUnlockedHint){
    G.clubModeData.presupuesto=Math.round(G.clubModeData.presupuesto*1.15);
    G.clubModeData.reputacion=Math.min(100,(G.clubModeData.reputacion||10)+3);
    G._clubUnlockedHint=false;
  }
  G._clubNameDraft=null;G._clubSpecDraft=null;G._clubFilDraft=null;
  generateClubEvent();
  generateClubObjective();
  G.screen='clubHub';autoSave();render();
};

function renderClubHub(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const d=G.clubModeData;
  if(!d){G.screen='clubCreate';render();return;}
  const lvl=clubLevelByRep();
  const wages=clubMonthlyWage();
  const annualWages=wages*12;
  const fil=d.filosofia?CLUB_FILOSOFIAS[d.filosofia]:null;
  const staffCost=Object.keys(d.staff||{}).reduce((s,k)=>s+(CLUB_STAFF_TYPES[k]?CLUB_STAFF_TYPES[k].costMonth:0),0)*12;
  const sponsorIncome=(d.clubSponsors||[]).reduce((s,sp)=>s+(sp.monthlyIncome||0),0)*12;
  const annualIncome=Math.round(d.socios*25*12*(fil&&fil.socioBonus?fil.socioBonus:1));
  const annualNet=annualIncome+sponsorIncome-annualWages-staffCost;
  const assigned=Object.values(d.calAssignments||{}).filter(v=>v&&v.length>0).length;
  const allAssigned=d.plantilla.length>0&&assigned>0;
  const cohColor=d.cohesion>=70?'#2d7a2d':d.cohesion>=40?'#c07a10':'#c0392b';
  const obj=d.seasonObjective;

  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div style="font-size:32px">${lvl.icon}</div>
      <div style="flex:1">
        <div style="font-size:18px;font-weight:700">${esc(d.name)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
          <span class="club-level-badge" style="background:${lvl.color}22;color:${lvl.color}">${lvl.label}</span>
          ${fil?`<span style="background:${fil.color}22;color:${fil.color};font-size:11px;font-weight:600;padding:2px 7px;border-radius:4px">${fil.emoji} ${fil.label}</span>`:''}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#aaa">Temporada</div>
        <div style="font-size:18px;font-weight:700">${d.temporada}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:12px">
      ${[['👥',d.socios,'Socios'],['⭐',`${d.reputacion}`,'Rep.'],['💶',`€${d.presupuesto}`,'Presup.'],['🤝',`${d.cohesion}/100`,'Cohesión']].map(([ic,v,l])=>`
        <div style="background:#fff;border:1px solid #e0dfd8;border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:14px">${ic}</div>
          <div style="font-size:13px;font-weight:700">${v}</div>
          <div style="font-size:10px;color:#aaa">${l}</div>
        </div>`).join('')}
    </div>

    <div style="height:6px;background:#e5e4de;border-radius:3px;margin-bottom:12px;overflow:hidden">
      <div style="width:${d.cohesion}%;height:100%;background:${cohColor};border-radius:3px;transition:width .4s"></div>
    </div>

    ${obj?`
    <div class="card" style="margin-bottom:12px;border-color:${d.seasonObjectiveMet===true?'#4a8a2a':d.seasonObjectiveMet===false?'#f5b8b8':'#c07a10'};border-width:1.5px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">${d.seasonObjectiveMet===true?'✅':d.seasonObjectiveMet===false?'❌':'🎯'}</span>
        <div style="flex:1">
          <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.4px">Objetivo de temporada</div>
          <div style="font-size:13px;font-weight:600">${obj.label}</div>
          <div style="font-size:12px;color:#aaa;font-style:italic">${obj.desc}</div>
        </div>
      </div>
    </div>`:''}

    ${d.pendingEvent?`
    <div class="card" style="margin-bottom:12px;border-color:#c07a10;border-width:1.5px;cursor:pointer" onclick="G.screen='clubEvent';render()">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:22px">📣</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:#c07a10">Evento pendiente</div>
          <div style="font-size:12px;color:#555">${esc(d.pendingEvent.title)}</div>
        </div>
        <span style="color:#c07a10">→</span>
      </div>
    </div>`:''}

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Economía anual estimada</div>
      <div class="fin-row"><span>Cuotas de socios</span><span class="plus">+€${annualIncome}</span></div>
      ${sponsorIncome>0?`<div class="fin-row"><span>Sponsors del club</span><span class="plus">+€${sponsorIncome}</span></div>`:''}
      <div class="fin-row"><span>Salarios plantilla</span><span class="minus">−€${annualWages}</span></div>
      ${staffCost>0?`<div class="fin-row"><span>Staff técnico</span><span class="minus">−€${staffCost}</span></div>`:''}
      <div class="fin-row tot"><span>Balance neto</span><span class="${annualNet>=0?'plus':'minus'}">${annualNet>=0?'+':''}€${annualNet}</span></div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Estado de la temporada</div>
      <div style="font-size:13px;color:#555">
        ${d.seasonSimulated
          ?`✅ Temporada completada — ${(d.seasonResults||[]).length} participaciones`
          :allAssigned
            ?`🏁 ${assigned} carrera${assigned!==1?'s':''} con equipo asignado. Listo para simular.`
            :`📅 Asigna corredores a las carreras para empezar`}
      </div>
    </div>

    ${d.seasonSimulated
      ?`<button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="G.screen='clubSeasonEnd';render()">Ver balance de temporada →</button>`
      :`${!d.monthlyFocus&&!d.seasonSimulated?`
        <div class="card" style="margin-bottom:10px;border-color:#8e44ad;border-width:1.5px">
          <div class="sec-title-sm" style="color:#8e44ad">🗓️ Decisión mensual (C16)</div>
          <p style="font-size:12px;color:#555;margin-bottom:8px">¿En qué enfoca el club este mes?</p>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${[['resultados','🏆','Resultados','Entrenamiento intensivo — rendimiento +5% esta temporada'],['marketing','📣','Marketing','Campaña de visibilidad — +4 socios extra al cerrar temporada'],['formacion','🌱','Formación','Desarrollo de jóvenes — cantera crece un 20% más rápido'],['ahorro','💰','Gestión','Control de costes — ahorro de €200 en gastos de inscripción']].map(([id,emoji,label,desc])=>`
              <button class="main" style="text-align:left;padding:8px 12px" onclick="doClubMonthlyFocus('${id}')">
                <strong>${emoji} ${label}</strong><br><span style="font-size:11px;color:#888">${desc}</span>
              </button>`).join('')}
          </div>
        </div>`:''}
       <button class="main" ${!d.monthlyFocus?'style="opacity:0.5"':''} onclick="G.screen='clubCalendar';render()">📅 Asignar equipo a carreras${d.monthlyFocus?` — foco: ${d.monthlyFocus}`:''}</button>
       ${allAssigned?`<button class="main" style="margin-top:6px;background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doClubSimulateSeason()">🏁 Simular temporada →</button>`:''}`}
    <button class="main" style="margin-top:6px" onclick="G.screen='clubPlantilla';render()">👥 Plantilla (${d.plantilla.length}) ${d.cantera&&d.cantera.length>0?`· 🌱 Cantera (${d.cantera.length})`:''}</button>
    <button class="main" style="margin-top:6px" onclick="G.screen='clubStaff';render()">🧑‍⚕️ Staff técnico (${Object.keys(d.staff||{}).length} contratados)</button>
    <button class="main" style="margin-top:6px" onclick="G.screen='clubSponsors';render()">🤝 Sponsors del club (${(d.clubSponsors||[]).length})</button>
    <button class="main" style="margin-top:6px;opacity:0.6" onclick="G.screen='clubRivals';render()">⚔️ Clubes rivales</button>
    <button class="main" style="margin-top:6px;opacity:0.7" onclick="G.screen='clubMonthly';render()">📅 Decisión mensual del club</button>
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="G=freshState();render()">← Menú principal</button>`;
}



function renderClubPlantilla(){
  const el=document.getElementById('main');
  const d=G.clubModeData;if(!d){G.screen='clubHub';render();return;}
  const wages=clubMonthlyWage();
  const inIds=d.plantilla.map(r=>r.id);
  const cantIds=(d.cantera||[]).map(r=>r.id);
  const available=CLUB_RUNNER_POOL.filter(r=>!inIds.includes(r.id)&&!cantIds.includes(r.id));
  const youthAvail=CLUB_YOUTH_POOL.filter(r=>!inIds.includes(r.id)&&!cantIds.includes(r.id));
  const potColors={alto:'#2d7a2d',medio:'#c07a10',bajo:'#888'};
  const fil=d.filosofia?CLUB_FILOSOFIAS[d.filosofia]:null;
  const hasEntrenador=d.staff&&d.staff.entrenador;

  const runnerCard=(r,i,isCantera)=>{
    const pc=potColors[r.potential]||'#888';
    const role=CLUB_ROLES[r.role||'normal'];
    const growthBonus=hasEntrenador?CLUB_STAFF_TYPES.entrenador.growthBonus:1;
    const specMatch=fil&&r.spec===fil.specBonus;
    return`<div class="club-runner-card" style="${specMatch?'border-color:'+fil.color+';':''};margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:22px">${r.flag}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
            <div style="font-size:14px;font-weight:700">${esc(r.name)}</div>
            <span style="font-size:11px;color:${pc};background:${pc}18;padding:1px 5px;border-radius:3px;font-weight:600">${r.potential}</span>
            <span style="font-size:11px;background:${role.color}22;color:${role.color};padding:1px 6px;border-radius:3px;font-weight:600">${role.emoji} ${role.label}</span>
            ${isCantera?`<span style="font-size:10px;background:#e8f4e8;color:#2d7a2d;padding:1px 5px;border-radius:3px">🌱 Cantera</span>`:''}
          </div>
          <div style="font-size:12px;color:#888;margin-bottom:4px">${r.age} años · ${SPEC_LABEL[r.spec]||r.spec} · €${r.currentSalary||r.salary}/mes${hasEntrenador?' · ↑ +30% crecimiento':''}</div>
          <div>${['Res','Vel','Sub','Baj'].map((k,ki)=>{
            const keys=['resistencia','velocidad','subida','bajada'];
            return`<span class="club-stat-pill">${k} ${r.stats[keys[ki]]}</span>`;
          }).join('')}</div>
          <div style="font-size:11px;color:#aaa;margin-top:3px;font-style:italic">${esc(r.bio)}</div>
          ${(()=>{
            // C1: etiquetas dinámicas según historial acumulado
            const tags=[];
            if((r.seasonsInClub||0)>=3)tags.push({label:'Veterano 🏅',color:'#c07a10'});
            if((r.careerWins||0)>=2)tags.push({label:`${r.careerWins} victorias ⭐`,color:'#2d7a2d'});
            else if((r.careerPodiums||0)>=3)tags.push({label:`${r.careerPodiums} podios`,color:'#4a90d9'});
            if(r.age>=35)tags.push({label:'Última etapa',color:'#888'});
            if((r.careerDnfs||0)>=3)tags.push({label:'Propenso a DNF ⚠️',color:'#c0392b'});
            if(r.seasonsInClub===1&&(r.careerPodiums||0)>0)tags.push({label:'Promesa confirmada 🌱',color:'#2d7a2d'});
            if(!tags.length)return'';
            return`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${tags.map(t=>`<span style="font-size:10px;background:${t.color}18;color:${t.color};padding:1px 6px;border-radius:3px;font-weight:600">${t.label}</span>`).join('')}</div>`;
          })()}
          <div style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap">
            ${Object.entries(CLUB_ROLES).map(([rid,rl])=>`
              <button onclick="doClubSetRole(${isCantera?`'cantera'`:`'plantilla'`},${isCantera?cantIds.indexOf(r.id):i},'${rid}')" style="font-size:11px;padding:2px 7px;border-radius:4px;border:1px solid ${(r.role||'normal')===rid?rl.color:'#e0dfd8'};background:${(r.role||'normal')===rid?rl.color+'22':'#fff'};color:${(r.role||'normal')===rid?rl.color:'#888'};cursor:pointer">${rl.emoji}</button>`).join('')}
          </div>
        </div>
        ${d.plantilla.length>2&&!isCantera?`<button onclick="doClubRelease(${i})" style="border:1px solid #f5b8b8;border-radius:6px;padding:4px 8px;background:#fff;color:#c0392b;font-size:11px;cursor:pointer;flex-shrink:0">Liberar</button>`:''}
      </div>
    </div>`;
  };

  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h2 style="margin-bottom:0">Plantilla</h2>
      <button onclick="G.screen='clubHub';render()" style="background:none;border:1px solid #e0dfd8;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;color:#888">← Hub</button>
    </div>
    <div class="hint" style="margin-bottom:10px">€${wages}/mes · €${wages*12}/año · Presupuesto: €${d.presupuesto}</div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Infraestructura (C15)</div>
      ${[['gimnasio','🏋️','Gimnasio',500,'Todos los corredores +2 rendimiento'],['clinica','🏥','Clínica',800,'Reduce lesiones -30%'],['residencia','🏠','Residencia',1200,'Permite plantilla de hasta 8 corredores'],['marketingHQ','📣','Marketing HQ',600,'+5 socios automáticos al mes']].map(([id,emoji,label,cost,desc])=>{
        const owned=d.instalaciones&&d.instalaciones[id];
        return`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f4f0">
          <span style="font-size:16px">${emoji}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${label}</div>
            <div style="font-size:11px;color:#888">${desc}</div>
          </div>
          ${owned
            ?`<span style="font-size:11px;color:#2d7a2d;font-weight:600">✓ Activo</span>`
            :`<button onclick="doClubBuyInstalacion('${id}',${cost})" style="font-size:11px;padding:3px 8px;border-radius:5px;border:1px solid #ddd;background:#fff;cursor:pointer;flex-shrink:0">€${cost}</button>`}
        </div>`;
      }).join('')}
    </div>

    <div class="sec-title-sm" style="margin-bottom:8px">Plantilla principal (${d.plantilla.length})</div>
    ${d.plantilla.map((r,i)=>runnerCard(r,i,false)).join('')}

    ${(d.cantera||[]).length>0?`
    <div class="sec-title-sm" style="margin:12px 0 8px">Cantera (${d.cantera.length})</div>
    ${d.cantera.map((r,i)=>runnerCard(r,i,true)).join('')}`:''}

    ${available.length>0&&d.plantilla.length<(d.instalaciones&&d.instalaciones.residencia?8:6)?`
    <div class="sec-title-sm" style="margin:12px 0 8px">Fichar corredor</div>
    ${available.slice(0,4).map(r=>{
      const pc=potColors[r.potential]||'#888';
      const canAfford=d.presupuesto>=r.salary*3;
      return`<div class="club-runner-card" style="${!canAfford?'opacity:0.45':''};margin-bottom:6px" ${canAfford?`onclick="doClubSign('${r.id}')"`:''}><div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:20px">${r.flag}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:5px"><div style="font-size:13px;font-weight:700">${esc(r.name)}</div><span style="font-size:11px;color:${pc};background:${pc}18;padding:1px 5px;border-radius:3px">${r.potential}</span></div>
          <div style="font-size:12px;color:#888">${r.age}a · ${SPEC_LABEL[r.spec]||r.spec} · €${r.salary}/mes</div>
        </div>
        <div style="font-size:11px;color:${canAfford?'#4a8a2a':'#c0392b'};flex-shrink:0">${canAfford?'+ Fichar':'Sin fondos'}</div>
      </div></div>`;
    }).join('')}`:''

    }

    ${youthAvail.length>0?`
    <div class="sec-title-sm" style="margin:12px 0 8px">🌱 Cantera disponible</div>
    <p style="font-size:12px;color:#888;margin-bottom:8px">Jóvenes con potencial alto. Crecen un 50% más rápido pero rinden menos al inicio.</p>
    ${youthAvail.slice(0,3).map(r=>{
      const canAfford=d.presupuesto>=r.salary*2;
      return`<div class="club-runner-card" style="${!canAfford?'opacity:0.45':''};margin-bottom:6px" ${canAfford?`onclick="doClubSignYouth('${r.id}')"`:''}><div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:20px">${r.flag}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700">${esc(r.name)} <span style="font-size:11px;color:#2d7a2d">🌱 Joven</span></div>
          <div style="font-size:12px;color:#888">${r.age}a · ${SPEC_LABEL[r.spec]||r.spec} · €${r.salary}/mes</div>
          <div style="font-size:11px;color:#aaa;font-style:italic">${esc(r.bio)}</div>
        </div>
        <div style="font-size:11px;color:${canAfford?'#2d7a2d':'#c0392b'};flex-shrink:0">${canAfford?'+ Cantera':'Sin fondos'}</div>
      </div></div>`;
    }).join('')}`:''}`;
}

window.doClubSetRole=(pool,idx,role)=>{
  const d=G.clubModeData;if(!d)return;
  const arr=pool==='cantera'?d.cantera:d.plantilla;
  if(!arr||idx<0||idx>=arr.length)return;
  // Solo un capitán a la vez
  if(role==='capitan'){
    d.plantilla.forEach(r=>{if(r.role==='capitan')r.role='normal';});
    if(d.cantera)d.cantera.forEach(r=>{if(r.role==='capitan')r.role='normal';});
  }
  arr[idx].role=role;
  showToast(`${arr[idx].name.split(' ')[0]}: ${CLUB_ROLES[role].emoji} ${CLUB_ROLES[role].label}`,'#555');
  autoSave();render();
};

window.doClubBuyInstalacion=(id,cost)=>{
  const d=G.clubModeData;if(!d)return;
  if(d.presupuesto<cost){showToast('Presupuesto insuficiente','#c0392b');return;}
  d.instalaciones[id]=true;
  d.presupuesto-=cost;
  showToast(`✅ ${id} — instalación activa`,'#2d7a2d');
  autoSave();render();
};

window.doClubSign=id=>{
  const d=G.clubModeData;if(!d)return;
  const r=CLUB_RUNNER_POOL.find(x=>x.id===id);if(!r)return;
  const maxSize=d.instalaciones&&d.instalaciones.residencia?8:6;
  if(d.plantilla.length>=maxSize){showToast(`Plantilla completa — máx. ${maxSize}`,'#c07a10');return;}
  d.plantilla.push({...r,stats:{...r.stats},currentSalary:r.salary,role:'normal'});
  d.presupuesto-=r.salary*3;
  showToast(`${r.name} fichado — coste inicial €${r.salary*3}`,'#4a8a2a');
  autoSave();render();
};

window.doClubSignYouth=id=>{
  const d=G.clubModeData;if(!d)return;
  const r=CLUB_YOUTH_POOL.find(x=>x.id===id);if(!r)return;
  if(!d.cantera)d.cantera=[];
  if(d.cantera.length>=3){showToast('Cantera completa — máx. 3','#c07a10');return;}
  d.cantera.push({...r,stats:{...r.stats},currentSalary:r.salary,role:'promesa'});
  d.presupuesto-=r.salary*2;
  showToast(`🌱 ${r.name} a la cantera — €${r.salary*2}`,'#2d7a2d');
  autoSave();render();
};

window.doClubRelease=idx=>{
  const d=G.clubModeData;if(!d)return;
  if(d.plantilla.length<=2){showToast('Necesitas al menos 2 corredores','#c07a10');return;}
  const r=d.plantilla[idx];
  if(!confirm(`¿Liberar a ${r.name}?`))return;
  d.plantilla.splice(idx,1);
  Object.keys(d.calAssignments||{}).forEach(k=>{
    if(Array.isArray(d.calAssignments[k]))d.calAssignments[k]=d.calAssignments[k].filter(id=>id!==r.id);
  });
  showToast(`${r.name} liberado`,'#888');
  autoSave();render();
};
function renderClubCalendar(){
  const el=document.getElementById('main');
  const d=G.clubModeData;if(!d){G.screen='clubHub';render();return;}
  const assignments=d.calAssignments||{};
  const tierColors={local:'#888',regional:'#4a90d9',nacional:'#2d7a2d',elite:'#c0392b'};
  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h2 style="margin-bottom:0">Calendario</h2>
      <button onclick="G.screen='clubHub';render()" style="background:none;border:1px solid #e0dfd8;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;color:#888">← Hub</button>
    </div>
    <p class="sub">Asigna 1–4 corredores por carrera. Toca su nombre para añadir o quitar.</p>
    ${(()=>{
      const clubRep=d.reputacion||0;
      const clubSocios=d.socios||8;
      const unlocked=CLUB_RACES.filter(r=>(r.repReq||0)<=clubRep&&(r.sociosReq||0)<=clubSocios);
      const locked=CLUB_RACES.filter(r=>(r.repReq||0)>clubRep||(r.sociosReq||0)>clubSocios);
      return`
      ${unlocked.map(race=>{
        const assigned=assignments[race.id]||[];
        const tc=tierColors[race.tier]||'#888';
        return`<div class="club-race-row" style="margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:13px;font-weight:700">${esc(race.name)}</span>
                <span style="font-size:10px;background:${tc}18;color:${tc};padding:1px 5px;border-radius:3px;font-weight:600;text-transform:uppercase">${race.tier}</span>
              </div>
              <div style="font-size:12px;color:#888">${race.dist}km · ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][race.month-1]} · ${race.cost>0?`€${race.cost} inscripción`:'Gratuita'} · Premio €${race.prize}</div>
            </div>
            <span style="font-size:12px;color:${assigned.length>0?'#2d7a2d':'#aaa'}">${assigned.length}/4</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:5px">
            ${d.plantilla.concat(d.cantera||[]).map(r=>{
              const isSel=assigned.includes(r.id);
              const role=CLUB_ROLES[r.role||'normal'];
              return`<div onclick="doClubToggleAssign('${race.id}','${r.id}')" style="cursor:pointer;padding:4px 9px;border-radius:6px;font-size:12px;border:1px solid ${isSel?'#2d7a2d':'#e0dfd8'};background:${isSel?'#f2faf0':'#fafaf8'};color:${isSel?'#2d7a2d':'#555'}">${role.emoji} ${esc(r.name.split(' ')[0])}</div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
      ${locked.length>0?`
      <div style="margin-top:14px;margin-bottom:6px">
        <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">🔒 Carreras bloqueadas</div>
        ${locked.map(race=>{
          const tc=tierColors[race.tier]||'#888';
          const needRep=race.repReq>clubRep;
          const needSocios=race.sociosReq>clubSocios;
          return`<div style="opacity:0.5;padding:10px 12px;border:1px dashed #ddd;border-radius:8px;margin-bottom:6px">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:13px;font-weight:600">${esc(race.name)}</span>
              <span style="font-size:10px;background:${tc}18;color:${tc};padding:1px 5px;border-radius:3px;text-transform:uppercase">${race.tier}</span>
            </div>
            <div style="font-size:11px;color:#aaa;margin-top:3px">
              ${needRep?`Rep. ≥${race.repReq} (actual: ${clubRep}) `:''}${needSocios?`· Socios ≥${race.sociosReq} (actual: ${clubSocios})`:''}
            </div>
          </div>`;
        }).join('')}
      </div>`:''}`;
    })()}
    <button class="main" style="margin-top:10px;background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="G.screen='clubHub';render()">← Volver al hub</button>`;
}

window.doClubToggleAssign=(raceId,runnerId)=>{
  const d=G.clubModeData;if(!d)return;
  if(!d.calAssignments)d.calAssignments={};
  if(!d.calAssignments[raceId])d.calAssignments[raceId]=[];
  const arr=d.calAssignments[raceId];
  const idx=arr.indexOf(runnerId);
  if(idx>=0)arr.splice(idx,1);
  else if(arr.length<4)arr.push(runnerId);
  else{showToast('Máximo 4 corredores por carrera','#c07a10');return;}
  autoSave();render();
};

window.doClubSimulateSeason=()=>{
  const d=G.clubModeData;if(!d)return;
  const results=[];
  const clubRep=d.reputacion||0;
  const clubSocios=d.socios||8;
  CLUB_RACES.forEach(race=>{
    if((race.repReq||0)>clubRep||(race.sociosReq||0)>clubSocios)return; // C4: carrera bloqueada
    const runnerIds=d.calAssignments[race.id]||[];
    if(!runnerIds.length)return;
    const allRunners=[...d.plantilla,...(d.cantera||[])];
    // Coste de inscripción × número de corredores
    if(race.cost>0)d.presupuesto-=race.cost*runnerIds.length;
    runnerIds.forEach(rid=>{
      const runner=allRunners.find(r=>r.id===rid);
      if(!runner)return;
      const res=simClubRace(runner,race,d);
      if(!res.dnf)d.presupuesto+=res.prize;
      results.push({race,runner,pos:res.pos,perf:res.perf,prize:res.dnf?0:res.prize,rivals:res.rivals,dnf:res.dnf});
    });
  });
  // C16 Aplicar foco mensual
  if(d.monthlyFocus==='resultados')results.forEach(r=>{if(!r.dnf)r.pos=Math.max(1,r.pos-1);});
  if(d.monthlyFocus==='marketing')d.socios=Math.min(999,(d.socios||8)+4);
  if(d.monthlyFocus==='ahorro')d.presupuesto+=200;

  d.seasonResults=results;
  d.seasonSimulated=true;

  // Actualizar reputación
  const podiums=results.filter(r=>r.pos<=3&&!r.dnf).length;
  const top10=results.filter(r=>r.pos<=10&&!r.dnf).length;
  d.reputacion=Math.min(100,(d.reputacion||0)+podiums*8+top10*3+(results.length>0?2:0));

  // C6 Cohesión: sube con victorias, baja con DNFs
  const wins=results.filter(r=>r.pos===1).length;
  const dnfs=results.filter(r=>r.dnf).length;
  const capitan=d.plantilla.find(r=>r.role==='capitan');
  const capBonus=capitan?CLUB_ROLES.capitan.cohesionBonus:0;
  const fil=d.filosofia?CLUB_FILOSOFIAS[d.filosofia]:null;
  const filBonus=fil?fil.cohesionBonus:0;
  const staffPsi=d.staff&&d.staff.psicologo?CLUB_STAFF_TYPES.psicologo.cohesionBonus:0;
  d.cohesion=Math.max(0,Math.min(100,(d.cohesion||50)+wins*4-dnfs*6+capBonus+filBonus+staffPsi));

  // C11 Staff marketing suma socios
  if(d.staff&&d.staff.marketing)d.socios=Math.min(999,d.socios+CLUB_STAFF_TYPES.marketing.sociosPerMonth*12);

  // Comprobar objetivo de temporada C18
  if(d.seasonObjective){
    const obj=d.seasonObjective;
    const lvl=clubLevelByRep();
    try{d.seasonObjectiveMet=obj.check(d,lvl);}catch(e){d.seasonObjectiveMet=false;}
  }

  // Ingresos de sponsors de club
  (d.clubSponsors||[]).forEach(sp=>{d.presupuesto+=sp.monthlyIncome*12;});

  autoSave();
  G.screen='clubSimulate';
  G._clubSimIdx=0;
  render();
};

function renderClubSimulate(){
  const el=document.getElementById('main');
  const d=G.clubModeData;if(!d){G.screen='clubHub';render();return;}
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const results=d.seasonResults||[];
  const idx=G._clubSimIdx||0;
  const isDone=idx>=results.length;

  if(isDone){
    el.innerHTML=`
      <div style="text-align:center;padding:20px 0 16px">
        <div style="font-size:36px;margin-bottom:8px">🏕️</div>
        <h2>Temporada completa</h2>
        <p class="sub">Todos los resultados registrados</p>
      </div>
      <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="G.screen='clubSeasonEnd';render()">Ver balance de temporada →</button>`;
    return;
  }

  const r=results[idx];
  const posColor=r.pos===1?'#c07a10':r.pos<=3?'#2d7a2d':r.pos<=10?'#4a90d9':'#1a1a1a';
  const posIcon=r.pos===1?'🥇':r.pos===2?'🥈':r.pos===3?'🥉':r.pos<=10?'🎯':'🏃';

  el.innerHTML=`
    <div style="font-size:12px;color:#aaa;margin-bottom:12px;text-align:center">Resultado ${idx+1} de ${results.length}</div>
    <div style="height:3px;background:#e5e4de;border-radius:2px;overflow:hidden;margin-bottom:16px">
      <div style="width:${Math.round((idx/results.length)*100)}%;height:100%;background:#4a90d9;border-radius:2px"></div>
    </div>
    <div class="card" style="text-align:center;padding:24px 16px;margin-bottom:14px">
      <div style="font-size:40px;margin-bottom:8px">${posIcon}</div>
      <div style="font-size:24px;font-weight:700;color:${posColor};margin-bottom:4px">#${r.pos} de ${r.rivals}</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">${esc(r.runner.flag)} ${esc(r.runner.name)}</div>
      <div style="font-size:13px;color:#888">${esc(r.race.name)} · ${r.race.dist}km</div>
      ${r.prize>0?`<div style="font-size:13px;color:#2d7a2d;font-weight:600;margin-top:8px">+€${r.prize} premio</div>`:''}
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="sec-title-sm">Detalles</div>
      <div class="fin-row"><span>Carrera</span><span>${esc(r.race.name)}</span></div>
      <div class="fin-row"><span>Corredor</span><span>${esc(r.runner.name)}</span></div>
      <div class="fin-row"><span>Posición</span><span style="font-weight:700;color:${posColor}">#${r.pos} / ${r.rivals}</span></div>
      <div class="fin-row"><span>Rendimiento</span><span>${r.perf}/100</span></div>
      ${r.prize>0?`<div class="fin-row"><span>Premio</span><span class="plus">+€${r.prize}</span></div>`:''}
    </div>
    <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="G._clubSimIdx=${idx+1};render()">
      ${idx+1<results.length?'Siguiente resultado →':'Ver balance final →'}
    </button>`;
}

// ── STAFF TÉCNICO (C11) ────────────────────────────────────────────────────
function renderClubStaff(){
  const el=document.getElementById('main');
  const d=G.clubModeData;if(!d){G.screen='clubHub';render();return;}
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h2 style="margin-bottom:0">Staff Técnico</h2>
      <button onclick="G.screen='clubHub';render()" style="background:none;border:1px solid #e0dfd8;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;color:#888">← Hub</button>
    </div>
    <p class="sub">Contrata personal de apoyo. Cada miembro del staff tiene un coste mensual y mejora un aspecto del club.</p>
    ${Object.entries(CLUB_STAFF_TYPES).map(([id,s])=>{
      const hired=d.staff&&d.staff[id];
      return`<div class="card" style="margin-bottom:10px;${hired?'border-color:#2d7a2d;':''}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="font-size:22px">${s.emoji}</span>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700">${s.label}</div>
            <div style="font-size:12px;color:#888">${s.desc}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:13px;font-weight:700;color:#c07a10">€${s.costMonth}/mes</div>
            ${hired?`<div style="font-size:11px;color:#2d7a2d">✓ Contratado</div>`:''}
          </div>
        </div>
        ${hired
          ?`<button class="main" style="margin-top:4px;border-color:#c0392b;color:#c0392b;font-size:12px" onclick="doClubFireStaff('${id}')">Despedir</button>`
          :`<button class="main" style="margin-top:4px;font-size:12px" onclick="doClubHireStaff('${id}',${s.costMonth})">Contratar — €${s.costMonth}/mes</button>`}
      </div>`;
    }).join('')}`;
}
window.doClubHireStaff=(id,cost)=>{
  const d=G.clubModeData;if(!d)return;
  if(d.presupuesto<cost*3){showToast('Presupuesto insuficiente','#c0392b');return;}
  if(!d.staff)d.staff={};
  d.staff[id]=true;
  showToast(`${CLUB_STAFF_TYPES[id].emoji} ${CLUB_STAFF_TYPES[id].label} contratado`,'#2d7a2d');
  autoSave();render();
};
window.doClubFireStaff=(id)=>{
  const d=G.clubModeData;if(!d)return;
  if(d.staff)delete d.staff[id];
  showToast(`${CLUB_STAFF_TYPES[id].label} despedido`,'#888');
  autoSave();render();
};

// ── PATROCINIO DE CLUB (C13) ───────────────────────────────────────────────
function renderClubSponsors(){
  const el=document.getElementById('main');
  const d=G.clubModeData;if(!d){G.screen='clubHub';render();return;}
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const activeIds=(d.clubSponsors||[]).map(s=>s.id);
  const fil=d.filosofia?CLUB_FILOSOFIAS[d.filosofia]:null;
  // Más sponsors disponibles según filosofía comercial
  const available=CLUB_SPONSORS_POOL.filter(s=>
    d.reputacion>=(s.tier===2?40:0)&&
    (fil&&fil.sponsorBonus===s.cat?true:s.tier<=1||(d.clubSponsors||[]).length<2)
  );
  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h2 style="margin-bottom:0">Sponsors del Club</h2>
      <button onclick="G.screen='clubHub';render()" style="background:none;border:1px solid #e0dfd8;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;color:#888">← Hub</button>
    </div>
    <p class="sub">Los sponsors del club pagan mensualmente a cambio de objetivos de equipo.</p>
    ${(d.clubSponsors||[]).length>0?`
    <div class="sec-title-sm" style="margin-bottom:8px">Sponsors activos</div>
    ${(d.clubSponsors||[]).map(sp=>`
      <div class="card" style="margin-bottom:8px;border-color:#2d7a2d">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;font-weight:700">${esc(sp.name)}</div>
            <div style="font-size:12px;color:#888">${sp.objective}</div>
          </div>
          <span style="font-size:14px;font-weight:700;color:#2d7a2d">+€${sp.monthlyIncome}/mes</span>
        </div>
        <button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b;font-size:12px" onclick="doClubRemoveSponsor('${sp.id}')">Rescindir contrato</button>
      </div>`).join('')}`:''}
    <div class="sec-title-sm" style="margin-bottom:8px;margin-top:${(d.clubSponsors||[]).length?'14px':'0'}">Disponibles</div>
    ${available.filter(s=>!activeIds.includes(s.id)).map(sp=>`
      <div class="card" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-size:13px;font-weight:700">${esc(sp.name)}</div>
          <span style="font-size:14px;font-weight:700;color:#c07a10">+€${sp.monthlyIncome}/mes</span>
        </div>
        <div style="font-size:12px;color:#888;margin-bottom:6px">Objetivo: ${sp.objective}</div>
        <button class="main" style="font-size:12px" onclick="doClubAddSponsor('${sp.id}')">Firmar contrato</button>
      </div>`).join('')||'<div class="hint">Sin sponsors disponibles aún. Sube tu reputación para desbloquear más.</div>'}`;
}
window.doClubAddSponsor=(id)=>{
  const d=G.clubModeData;if(!d)return;
  const sp=CLUB_SPONSORS_POOL.find(s=>s.id===id);if(!sp)return;
  if(!d.clubSponsors)d.clubSponsors=[];
  d.clubSponsors.push({...sp});
  showToast(`🤝 ${sp.name} — contrato firmado`,'#2d7a2d');
  autoSave();render();
};
window.doClubRemoveSponsor=(id)=>{
  const d=G.clubModeData;if(!d)return;
  d.clubSponsors=(d.clubSponsors||[]).filter(s=>s.id!==id);
  showToast('Contrato rescindido','#888');
  autoSave();render();
};

// ── CLUBES RIVALES (C14) ───────────────────────────────────────────────────
function renderClubRivals(){
  const el=document.getElementById('main');
  const d=G.clubModeData;if(!d){G.screen='clubHub';render();return;}
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const lvl=clubLevelByRep();
  // Rivales crecen con el tiempo
  const rivals=(d.rivalClubs||[]).map(r=>({
    ...r,
    rep:Math.min(100,(r.rep||20)+(d.temporada||1)*3),
    socios:Math.min(500,(r.socios||10)+(d.temporada||1)*5),
  }));
  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h2 style="margin-bottom:0">Clubes Rivales</h2>
      <button onclick="G.screen='clubHub';render()" style="background:none;border:1px solid #e0dfd8;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;color:#888">← Hub</button>
    </div>
    <div class="card" style="margin-bottom:12px;border-color:#4a90d9">
      <div style="font-size:11px;color:#aaa;margin-bottom:4px">TU CLUB</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:14px;font-weight:700">${esc(d.name)}</div>
        <span style="font-size:12px;background:${lvl.color}22;color:${lvl.color};padding:2px 8px;border-radius:4px">${lvl.label}</span>
      </div>
      <div style="font-size:12px;color:#888;margin-top:4px">Rep: ${d.reputacion}/100 · Socios: ${d.socios} · Cohesión: ${d.cohesion}/100</div>
    </div>
    ${rivals.map(r=>{
      const isAhead=r.rep>d.reputacion;
      return`<div class="card" style="margin-bottom:8px;${isAhead?'border-color:#c07a10':''}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-size:13px;font-weight:700">${esc(r.name)}</div>
          <span style="font-size:11px;color:${isAhead?'#c07a10':'#2d7a2d'}">${isAhead?'▲ Por delante':'▼ Por detrás'}</span>
        </div>
        <div style="font-size:12px;color:#888">Rep: ${r.rep}/100 · Socios: ${r.socios} · Nivel: ${r.level}</div>
      </div>`;
    }).join('')}
    <div class="hint" style="margin-top:10px">Los rivales crecen cada temporada. Si un rival supera tu reputación puede intentar ficharte corredores.</div>`;
}

// ── DECISIONES MENSUALES COMPLETAS (C16) ──────────────────────────────────
function renderClubMonthly(){
  const el=document.getElementById('main');
  const d=G.clubModeData;if(!d){G.screen='clubHub';render();return;}
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const sel=G._monthlySelections||{};
  const decDefs=[
    {id:'training',label:'Foco de entrenamiento',icon:'💪',options:[
      {id:'intensivo',  emoji:'🔥',text:'Intensivo',   desc:'+3 stats a toda la plantilla'},
      {id:'conservador',emoji:'🛡',text:'Conservador', desc:'+4 cohesión grupal'},
      {id:'tecnico',    emoji:'⚡',text:'Técnico',     desc:'+5 stat especialidad + 2 cohesión'},
    ]},
    {id:'focus',label:'Foco del club',icon:'🎯',options:[
      {id:'resultados', emoji:'🏆',text:'Resultados',  desc:'+4 rendimiento en próxima simulación'},
      {id:'marketing',  emoji:'📣',text:'Marketing',   desc:'+4 socios, +3 reputación'},
      {id:'formacion',  emoji:'🌱',text:'Formación',   desc:'Cantera +2 stats extra'},
    ]},
    {id:'budget',label:'Gestión presupuesto',icon:'💶',options:[
      {id:'invertir',   emoji:'💶',text:'Invertir',    desc:'€200 → +2 cohesión +2 stats',    cost:200},
      {id:'ahorrar',    emoji:'🏦',text:'Ahorrar',     desc:'+€150 reserva'},
      {id:'evento',     emoji:'🎪',text:'Evento social',desc:'€100 → +6 cohesión +2 socios',   cost:100},
    ]},
  ];
  const allChosen=decDefs.every(d=>sel[d.id]);
  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h2 style="margin-bottom:0">Decisión mensual</h2>
      <button onclick="G.screen='clubHub';render()" style="background:none;border:1px solid #e0dfd8;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;color:#888">← Hub</button>
    </div>
    <p class="sub">Elige una opción en cada área y confirma. Los efectos se aplican inmediatamente.</p>
    ${decDefs.map(dec=>`
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">${dec.icon} ${dec.label}</div>
        ${dec.options.map(opt=>{
          const isSel=sel[dec.id]===opt.id;
          return`<div onclick="G._monthlySelections=Object.assign(G._monthlySelections||{},{'${dec.id}':'${opt.id}'});render()" style="cursor:pointer;padding:10px 12px;border-radius:8px;border:1px solid ${isSel?'#4a90d9':'#e0dfd8'};background:${isSel?'#f0f6ff':'#fafaf8'};margin-bottom:6px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">${opt.emoji}</span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:${isSel?'700':'500'};color:${isSel?'#4a90d9':'#1a1a1a'}">${opt.text}</div>
              <div style="font-size:12px;color:#888">${opt.desc}${opt.cost?` · −€${opt.cost}`:''}</div>
            </div>
            ${isSel?`<span style="font-size:16px;color:#4a90d9">✓</span>`:''}
          </div>`;
        }).join('')}
      </div>`).join('')}
    <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a${!allChosen?';opacity:0.4;pointer-events:none':''}" onclick="doClubApplyMonthlyFull()">Confirmar decisiones →</button>`;
}

window.doClubApplyMonthlyFull=()=>{
  const d=G.clubModeData;if(!d)return;
  const sel=G._monthlySelections||{};
  const effects={
    training:{
      intensivo:  (d)=>d.plantilla.forEach(r=>Object.keys(r.stats).forEach(k=>r.stats[k]=Math.min(95,(r.stats[k]||40)+3))),
      conservador:(d)=>{d.cohesion=Math.min(100,(d.cohesion||50)+4);},
      tecnico:    (d)=>{const fil=d.filosofia?CLUB_FILOSOFIAS[d.filosofia]:null;const key=fil?.statGrowthKey;if(key)d.plantilla.forEach(r=>{r.stats[key]=Math.min(95,(r.stats[key]||40)+5);});d.cohesion=Math.min(100,(d.cohesion||50)+2);},
    },
    focus:{
      resultados: (d)=>{d._monthlyFocusBonus=(d._monthlyFocusBonus||0)+4;},
      marketing:  (d)=>{d.socios=Math.min(999,(d.socios||8)+4);d.reputacion=Math.min(100,(d.reputacion||0)+3);},
      formacion:  (d)=>{(d.cantera||[]).forEach(r=>Object.keys(r.stats).forEach(k=>r.stats[k]=Math.min(90,(r.stats[k]||30)+2)));},
    },
    budget:{
      invertir:   (d,cost)=>{if(d.presupuesto<cost){showToast('Sin fondos','#c0392b');return false;}d.presupuesto-=cost;d.cohesion=Math.min(100,(d.cohesion||50)+2);d.plantilla.forEach(r=>Object.keys(r.stats).forEach(k=>r.stats[k]=Math.min(95,(r.stats[k]||40)+2)));},
      ahorrar:    (d)=>{d.presupuesto=(d.presupuesto||0)+150;},
      evento:     (d,cost)=>{if(d.presupuesto<cost){showToast('Sin fondos','#c0392b');return false;}d.presupuesto-=cost;d.cohesion=Math.min(100,(d.cohesion||50)+6);d.socios=Math.min(999,(d.socios||8)+2);},
    },
  };
  const costs={invertir:200,evento:100};
  let msgs=[];
  ['training','focus','budget'].forEach(area=>{
    const optId=sel[area];if(!optId)return;
    const fn=effects[area]?.[optId];if(!fn)return;
    const result=fn(d,costs[optId]||0);
    if(result!==false)msgs.push(optId);
  });
  G._monthlySelections={};
  showToast(`✅ Decisiones aplicadas`,'#2d7a2d');
  autoSave();G.screen='clubHub';render();
};

function renderClubSeasonEnd(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const d=G.clubModeData;if(!d){G.screen='clubHub';render();return;}
  const results=d.seasonResults||[];
  const podiums=results.filter(r=>r.pos<=3&&!r.dnf).length;
  const top10=results.filter(r=>r.pos<=10&&!r.dnf).length;
  const wins=results.filter(r=>r.pos===1&&!r.dnf).length;
  const dnfs=results.filter(r=>r.dnf).length;
  const totalPrize=results.reduce((s,r)=>s+(r.prize||0),0);
  const staffCost=Object.keys(d.staff||{}).reduce((s,k)=>s+(CLUB_STAFF_TYPES[k]?CLUB_STAFF_TYPES[k].costMonth*12:0),0);
  const sponsorIncome=(d.clubSponsors||[]).reduce((s,sp)=>s+(sp.monthlyIncome||0)*12,0);
  const fil=d.filosofia?CLUB_FILOSOFIAS[d.filosofia]:null;
  const wages=clubMonthlyWage()*12;
  const socioIncome=Math.round(d.socios*25*12*(fil&&fil.socioBonus?fil.socioBonus:1));
  const netBalance=socioIncome+totalPrize+sponsorIncome-wages-staffCost;
  const socioGain=Math.round(podiums*4+top10*1.5+(d.reputacion/20));
  const socioLoss=results.length===0?3:0;
  const newSocios=Math.max(3,d.socios+socioGain-socioLoss);

  // C18 — Resultado del objetivo
  const obj=d.seasonObjective;
  const objMet=d.seasonObjectiveMet===true;
  let objRepDelta=0,objSociosDelta=0,objCohesionDelta=0;
  if(obj){
    const r=objMet?obj.reward:obj.penalty;
    objRepDelta=r.rep||0;
    objSociosDelta=r.socios||0;
    objCohesionDelta=r.cohesion||0;
    d.reputacion=Math.max(0,Math.min(100,(d.reputacion||0)+objRepDelta));
    if(objCohesionDelta)d.cohesion=Math.max(0,Math.min(100,(d.cohesion||50)+objCohesionDelta));
  }

  // C17 — Narrativa de temporada
  const correvelacion=results.filter(r=>!r.dnf).sort((a,b)=>a.pos-b.pos)[0];
  const corrdecepcion=results.filter(r=>r.dnf).sort((a,b)=>b.pos-a.pos)[0];
  let narrative='';
  if(wins>=2) narrative=`Un año para recordar. ${esc(d.name)} firmó ${wins} victorias y se consolida como referencia del circuito.`;
  else if(wins===1) narrative=`Una victoria que cambia la narrativa del club. El trabajo empieza a dar frutos.`;
  else if(podiums>=3) narrative=`Sin victorias pero con constancia. Tres podios que demuestran que el nivel está ahí.`;
  else if(dnfs>=2) narrative=`Una temporada irregular. Los abandonos pesaron más que los buenos resultados.`;
  else if(d.cohesion>=70) narrative=`Resultados discretos, pero el vestuario nunca estuvo tan unido. La cohesión es el activo del año.`;
  else if(d.cohesion<35) narrative=`El grupo está fragmentado. Sin cohesión interna, los resultados difícilmente pueden mejorar.`;
  else narrative=`Una temporada de transición. Se siembra ahora para recoger en los próximos años.`;

  el.innerHTML=`
    <div style="background:linear-gradient(135deg,#fefcf8,#f5f3ef);border:1px solid #e0dfd8;border-radius:14px;padding:20px 16px;margin-bottom:14px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">${wins>0?'🏆':podiums>0?'🎯':d.cohesion>=70?'🤝':'📋'}</div>
      <h2 style="margin-bottom:4px">Temporada ${d.temporada} — ${esc(d.name)}</h2>
    </div>

    <div class="card" style="margin-bottom:12px;border-left:3px solid #4a90d9">
      <div style="font-size:13px;color:#555;font-style:italic;margin-bottom:8px">"${narrative}"</div>
      <div style="display:flex;gap:12px;font-size:12px;color:#888;flex-wrap:wrap">
        ${correvelacion?`<span>⭐ Revelación: <strong>${esc(correvelacion.runner.name.split(' ')[0])}</strong> (#${correvelacion.pos})</span>`:''}
        ${corrdecepcion?`<span>😞 Decepción: <strong>${esc(corrdecepcion.runner.name.split(' ')[0])}</strong> (DNF)</span>`:''}
        <span>🤝 Cohesión final: <strong>${d.cohesion}/100</strong></span>
      </div>
    </div>

    ${obj?`
    <div class="card" style="margin-bottom:12px;border-color:${objMet?'#4a8a2a':'#f5b8b8'};border-width:1.5px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">${objMet?'✅':'❌'}</span>
        <div style="flex:1">
          <div style="font-size:12px;color:#888">Objetivo de temporada</div>
          <div style="font-size:13px;font-weight:600">${obj.label}</div>
        </div>
        <div style="text-align:right;font-size:12px">
          ${objRepDelta?`<div style="color:${objRepDelta>0?'#2d7a2d':'#c0392b'};font-weight:700">${objRepDelta>0?'+':''}${objRepDelta} rep</div>`:''}
          ${objSociosDelta?`<div style="color:${objSociosDelta>0?'#2d7a2d':'#c0392b'};font-weight:700">${objSociosDelta>0?'+':''}${objSociosDelta} socios</div>`:''}
        </div>
      </div>
    </div>`:''}

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Resultados</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
        ${[['Carreras',results.length],['Victorias',wins],['Podios',podiums],['DNF',dnfs]].map(([l,v])=>`
          <div style="background:#f5f4f0;border-radius:8px;padding:8px">
            <div style="font-size:11px;color:#aaa">${l}</div>
            <div style="font-size:18px;font-weight:700">${v}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Economía</div>
      <div class="fin-row"><span>Cuotas de socios</span><span class="plus">+€${socioIncome}</span></div>
      <div class="fin-row"><span>Premios en carrera</span><span class="plus">+€${totalPrize}</span></div>
      ${sponsorIncome>0?`<div class="fin-row"><span>Sponsors del club</span><span class="plus">+€${sponsorIncome}</span></div>`:''}
      <div class="fin-row"><span>Salarios plantilla</span><span class="minus">−€${wages}</span></div>
      ${staffCost>0?`<div class="fin-row"><span>Staff técnico</span><span class="minus">−€${staffCost}</span></div>`:''}
      <div class="fin-row tot"><span>Balance neto</span><span class="${netBalance>=0?'plus':'minus'}">${netBalance>=0?'+':''}€${netBalance}</span></div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="sec-title-sm">Evolución del club</div>
      <div class="fin-row"><span>Socios</span><span>${d.socios} → <strong>${newSocios}</strong> ${socioGain>0?`<span class="plus">(+${socioGain})</span>`:''}</span></div>
      <div class="fin-row"><span>Reputación</span><span><strong>${d.reputacion}/100</strong>${objRepDelta?` <span class="${objRepDelta>0?'plus':'minus'}">${objRepDelta>0?'+':''}${objRepDelta}</span>`:''}</span></div>
      <div class="fin-row"><span>Presupuesto final</span><span><strong>€${d.presupuesto}</strong></span></div>
      <div class="fin-row"><span>Cohesión</span><span style="color:${d.cohesion>=70?'#2d7a2d':d.cohesion>=40?'#c07a10':'#c0392b'}"><strong>${d.cohesion}/100</strong></span></div>
    </div>

    <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="doClubNextSeason(${socioGain},${socioLoss},${netBalance})">Temporada ${d.temporada+1} →</button>
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="G=freshState();render()">← Menú principal</button>`;
}

window.doClubNextSeason=(socioGain,socioLoss,netBalance)=>{
  const d=G.clubModeData;if(!d)return;
  d.historial.push({
    temporada:d.temporada,socios:d.socios,
    reputacion:d.reputacion,presupuesto:d.presupuesto,
    cohesion:d.cohesion,
    wins:(d.seasonResults||[]).filter(r=>r.pos===1).length,
    podiums:(d.seasonResults||[]).filter(r=>r.pos<=3&&!r.dnf).length,
  });
  d.socios=Math.max(3,d.socios+socioGain-socioLoss);
  // Bonus socios por instalación marketingHQ
  if(d.instalaciones&&d.instalaciones.marketingHQ)d.socios=Math.min(999,d.socios+60);
  d.presupuesto=Math.max(0,d.presupuesto+netBalance);
  d.temporada++;
  d.calAssignments={};d.seasonResults=[];d.seasonSimulated=false;
  d.pendingEvent=null;d.seasonObjective=null;d.seasonObjectiveMet=null;

  // C7 — Progresión real según potencial, edad y staff
  const hasEntrenador=d.staff&&d.staff.entrenador;
  const fil=d.filosofia?CLUB_FILOSOFIAS[d.filosofia]:null;
  // C1: actualizar historial de corredor
  const seasonRes=d.seasonResults||[];
  const growAll=[...d.plantilla,...(d.cantera||[])];
  growAll.forEach(r=>{
    r.age=(r.age||20)+1;
    r.seasonsInClub=(r.seasonsInClub||0)+1;
    const rWins=seasonRes.filter(x=>x.runner&&x.runner.id===r.id&&x.pos===1&&!x.dnf).length;
    const rPodiums=seasonRes.filter(x=>x.runner&&x.runner.id===r.id&&x.pos<=3&&!x.dnf).length;
    const rDnfs=seasonRes.filter(x=>x.runner&&x.runner.id===r.id&&x.dnf).length;
    r.careerWins=(r.careerWins||0)+rWins;
    r.careerPodiums=(r.careerPodiums||0)+rPodiums;
    r.careerDnfs=(r.careerDnfs||0)+rDnfs;
    const isYouth=r.age<=22;
    const base=r.potential==='alto'?(isYouth?4:3):r.potential==='medio'?2:0;
    const isCantera=r.role==='promesa';
    const coef=(isCantera||isYouth)?CLUB_ROLES.promesa.growthBonus:1;
    const staffCoef=hasEntrenador?CLUB_STAFF_TYPES.entrenador.growthBonus:1;
    const cap=r.potential==='alto'?95:r.potential==='medio'?88:82;
    Object.keys(r.stats).forEach(k=>{
      let delta=Math.floor(Math.random()*(base+1))*coef*staffCoef;
      // Filosofía: extra en el stat clave
      if(fil&&k===fil.statGrowthKey)delta+=1;
      // Declive para veteranos (+35 años)
      if(r.age>35)delta-=Math.floor(Math.random()*2);
      r.stats[k]=Math.max(10,Math.min(cap,(r.stats[k]||40)+Math.round(delta)));
    });
    // Promover cantera a plantilla si son suficientemente buenos
    if(isCantera&&r.age>=22){
      const avgStat=Object.values(r.stats).reduce((s,v)=>s+v,0)/Object.values(r.stats).length;
      if(avgStat>=55){
        d.plantilla.push({...r,role:'normal'});
        d.cantera=d.cantera.filter(c=>c.id!==r.id);
        showToast(`🎓 ${r.name} sube a la plantilla principal`,'#2d7a2d');
      }
    }
  });

  // C14 — Rivales crecen y pueden generar eventos
  if(d.rivalClubs){
    d.rivalClubs.forEach(r=>{
      r.rep=Math.min(100,(r.rep||20)+Math.floor(Math.random()*5)+2);
      r.socios=Math.min(500,(r.socios||10)+Math.floor(Math.random()*8)+3);
    });
    // ¿Algún rival intenta llevarse a un corredor?
    const topRival=d.rivalClubs.find(r=>r.rep>d.reputacion+15);
    if(topRival&&d.plantilla.length>2&&Math.random()<0.3){
      const target=d.plantilla.find(r=>r.potential==='alto');
      if(target){
        d.pendingEvent={
          title:`${topRival.name} quiere ficharte a ${target.name}`,
          options:[
            {text:`Ofrecerle renovación (+€${Math.round(target.currentSalary*0.2)}/mes)`,repDelta:5,salaryIncrease:true,cost:target.currentSalary*0.2*12},
            {text:'Dejarle ir — el club no puede retenerle a cualquier precio',repDelta:-8,loseRunner:true},
          ]
        };
      }
    }
  }

  // C2: renegociación salarial — corredores con ≥1 temporada en el club
  if(!d.pendingEvent){
    const renegCandidates=d.plantilla.filter(r=>(r.seasonsInClub||0)>=1&&(r.careerPodiums||0)>0);
    const chosen=renegCandidates.length?renegCandidates[Math.floor(Math.random()*renegCandidates.length)]:null;
    if(chosen&&Math.random()<0.4){
      const increase=Math.round((chosen.currentSalary||chosen.salary)*0.2/10)*10;
      const risk=chosen.potential==='alto'?'alto':'medio';
      d.pendingEvent={
        title:`${chosen.name.split(' ')[0]} pide una revisión salarial`,
        body:`Lleva ${chosen.seasonsInClub} temporada${chosen.seasonsInClub>1?'s':''} en el club y ha conseguido ${chosen.careerPodiums} podio${chosen.careerPodiums>1?'s':''}. Pide +€${increase}/mes. Riesgo de marcharse: ${risk}.`,
        options:[
          {text:`Aceptar (+€${increase}/mes para ${chosen.name.split(' ')[0]})`,repDelta:3,cohesionDelta:4,salarySpecificIncrease:true,targetId:chosen.id,increaseAmount:increase},
          {text:'Negociar — solo la mitad (+€${Math.round(increase/2)}/mes)',repDelta:1,cohesionDelta:0,salarySpecificIncrease:true,targetId:chosen.id,increaseAmount:Math.round(increase/2)},
          {text:'Rechazar — el presupuesto no da para más',repDelta:-3,cohesionDelta:-6,loseRunnerById:chosen.id,loseChance:risk==='alto'?0.5:0.2},
        ]
      };
    }
  }
  if(!d.pendingEvent)generateClubEvent();
  generateClubObjective();
  G.screen='clubHub';autoSave();render();
};

function renderClubEvent(){
  const el=document.getElementById('main');
  const d=G.clubModeData;if(!d||!d.pendingEvent){G.screen='clubHub';render();return;}
  const ev=d.pendingEvent;
  el.innerHTML=`
    <div style="text-align:center;padding:14px 0 10px">
      <div style="font-size:28px;margin-bottom:6px">📣</div>
      <h2 style="margin-bottom:4px">Evento del club</h2>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div style="font-size:15px;font-weight:700;margin-bottom:10px">${esc(ev.title)}</div>
      ${ev.body?`<div style="font-size:13px;color:#666;margin-bottom:12px;line-height:1.55">${esc(ev.body)}</div>`:''}
      ${ev.options.map((opt,i)=>`
        <button class="main" style="margin-top:${i===0?'0':'8px'};text-align:left" onclick="doClubEvent(${i})">
          <div style="font-weight:500">${esc(opt.text)}</div>
          <div style="font-size:12px;color:#aaa;margin-top:2px">
            ${opt.repDelta>0?`+${opt.repDelta} rep `:opt.repDelta<0?`${opt.repDelta} rep `:''}
            ${opt.sociosDelta>0?`+${opt.sociosDelta} socios `:opt.sociosDelta<0?`${opt.sociosDelta} socios `:''}
            ${opt.cost?`−€${opt.cost} `:''}${opt.income?`+€${opt.income} `:''}
          </div>
        </button>`).join('')}
    </div>`;
}

window.doClubEvent=idx=>{
  const d=G.clubModeData;if(!d||!d.pendingEvent)return;
  const ev=d.pendingEvent;
  const opt=ev.options[idx];if(!opt)return;
  if(opt.repDelta)d.reputacion=Math.max(0,Math.min(100,(d.reputacion||0)+opt.repDelta));
  if(opt.sociosDelta)d.socios=Math.max(3,(d.socios||8)+opt.sociosDelta);
  if(opt.cohesionDelta)d.cohesion=Math.max(0,Math.min(100,(d.cohesion||50)+opt.cohesionDelta));
  if(opt.cost)d.presupuesto=Math.max(0,(d.presupuesto||0)-opt.cost);
  if(opt.income)d.presupuesto=Math.max(0,(d.presupuesto||0)+opt.income);
  if(opt.addRunner){
    const inIds=d.plantilla.map(r=>r.id);
    const avail=CLUB_RUNNER_POOL.filter(r=>!inIds.includes(r.id));
    if(avail.length&&d.plantilla.length<6){
      const newR={...avail[0],stats:{...avail[0].stats},currentSalary:avail[0].salary};
      d.plantilla.push(newR);
      showToast(`${newR.name} se une al club`,'#4a8a2a');
    }
  }
  if(opt.salaryIncrease&&d.plantilla.length>0){
    const leavingIdx=Math.floor(Math.random()*d.plantilla.length);
    d.plantilla[leavingIdx].currentSalary=(d.plantilla[leavingIdx].currentSalary||d.plantilla[leavingIdx].salary)+50;
  }
  if(opt.salarySpecificIncrease&&opt.targetId){
    const tr=d.plantilla.find(r=>r.id===opt.targetId);
    if(tr){tr.currentSalary=(tr.currentSalary||tr.salary)+(opt.increaseAmount||0);showToast(`${tr.name.split(' ')[0]}: +€${opt.increaseAmount}/mes`,'#2d7a2d');}
  }
  if(opt.loseRunner&&d.plantilla.length>2){
    const leavingIdx=Math.floor(Math.random()*d.plantilla.length);
    const leaving=d.plantilla.splice(leavingIdx,1)[0];
    showToast(`${leaving.name} se va al club rival`,'#c0392b');
  }
  if(opt.loseRunnerById&&d.plantilla.length>2){
    if(Math.random()<(opt.loseChance||0.3)){
      const idx=d.plantilla.findIndex(r=>r.id===opt.loseRunnerById);
      if(idx>=0){const leaving=d.plantilla.splice(idx,1)[0];showToast(`${leaving.name} se va — no aceptó la oferta`,'#c0392b');}
    }
  }
  let toastMsg=opt.repDelta>0?`+${opt.repDelta} reputación`:opt.repDelta<0?`${opt.repDelta} reputación`:'Decisión tomada';
  showToast(toastMsg,opt.repDelta>=0?'#4a8a2a':'#c0392b');
  d.pendingEvent=null;
  autoSave();G.screen='clubHub';render();
};

function renderCoachAthleteTab(){
  const el=document.getElementById('main');
  const a=G.coachAthlete;
  if(!a){el.innerHTML='<div class="hint" style="margin-top:20px">Sin atleta activo.</div>';return;}
  const pl=PERSONALITY_LABEL[a.personality];
  const trustColor=G.coachTrust>=60?'#2d7a2d':G.coachTrust>=30?'#c07a10':'#c0392b';
  const load=G.coachBodyLoad||0;
  const es=EMOTIONAL_STATES[G.coachEmotionalState||'fresco'];
  const decisionLog=(G.coachDecisionLog||[]).slice(-6); // últimas 6 decisiones
  el.innerHTML=`
    <div class="runner-header" style="margin-bottom:16px">
      <div class="runner-avatar">${a.flag}</div>
      <div>
        <div style="font-size:16px;font-weight:700">${esc(a.name)}</div>
        <div style="font-size:12px;color:#888">${a.age} años · ${SPEC_LABEL[a.spec]||a.spec}</div>
        <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
          <span style="background:${pl.color}22;color:${pl.color};font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px">${pl.emoji} ${pl.label}</span>
          <span style="background:${es.color}22;color:${es.color};font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px" title="${es.desc}">${es.emoji} ${es.label}</span>
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:4px;font-style:italic">${es.desc}</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div class="sec-title-sm" style="margin-bottom:0">Confianza</div>
        <span style="font-size:13px;font-weight:700;color:${trustColor}">${G.coachTrust}/100</span>
      </div>
      <div style="height:8px;background:#e5e4de;border-radius:4px;overflow:hidden">
        <div style="width:${G.coachTrust}%;height:100%;background:${trustColor};border-radius:4px;transition:width .4s"></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Perfil de rendimiento</div>
      ${(()=>{
        const stats=Object.entries(a.currentStats);
        const sorted=[...stats].sort((x,y)=>y[1]-x[1]);
        const top=sorted[0];const weak=sorted[sorted.length-1];
        // Tendencia: comparar con baseStats
        const improving=stats.filter(([k,v])=>v>(a.baseStats[k]||v)).length;
        const declining=stats.filter(([k,v])=>v<(a.baseStats[k]||v)).length;
        const trendLabel=improving>declining?'↗ Mejorando':declining>improving?'↘ Bajando':'→ Estable';
        const trendColor=improving>declining?'#2d7a2d':declining>improving?'#c0392b':'#888';
        // Alertas
        const alerts=[];
        if((G.coachBodyLoad||0)>75)alerts.push({icon:'🔥',text:'Carga alta — riesgo de lesión',color:'#c0392b'});
        if(G.coachTrust<35)alerts.push({icon:'⚠️',text:'Confianza crítica — revisa tu relación con el atleta',color:'#c07a10'});
        if(weak[1]<40)alerts.push({icon:'📉',text:`Punto débil: ${weak[0]} (${weak[1]}) — considera trabajarlo`,color:'#c07a10'});
        if(G.coachEmotionalState==='quemado')alerts.push({icon:'🩶',text:'Atleta quemado — prioriza recuperación emocional',color:'#888'});
        return`
          <div style="display:flex;gap:12px;margin-bottom:10px">
            <div style="flex:1;background:#f2faf0;border-radius:8px;padding:8px 10px;text-align:center">
              <div style="font-size:10px;color:#888;margin-bottom:2px">PUNTO FUERTE</div>
              <div style="font-size:13px;font-weight:700;color:#2d7a2d">${top[0].charAt(0).toUpperCase()+top[0].slice(1)}</div>
              <div style="font-size:12px;color:#2d7a2d">${top[1]}</div>
            </div>
            <div style="flex:1;background:#fff8f0;border-radius:8px;padding:8px 10px;text-align:center">
              <div style="font-size:10px;color:#888;margin-bottom:2px">PUNTO DÉBIL</div>
              <div style="font-size:13px;font-weight:700;color:#c07a10">${weak[0].charAt(0).toUpperCase()+weak[0].slice(1)}</div>
              <div style="font-size:12px;color:#c07a10">${weak[1]}</div>
            </div>
            <div style="flex:1;background:#f5f4f0;border-radius:8px;padding:8px 10px;text-align:center">
              <div style="font-size:10px;color:#888;margin-bottom:2px">TENDENCIA</div>
              <div style="font-size:13px;font-weight:700;color:${trendColor}">${trendLabel}</div>
            </div>
          </div>
          ${alerts.map(al=>`<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:${al.color};padding:4px 0;border-bottom:1px solid #f5f4f0">${al.icon} ${al.text}</div>`).join('')}`;
      })()}
    </div>
    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Stats actuales</div>
      ${Object.entries(a.currentStats).map(([k,v])=>`
        <div class="bar-row">
          <div class="bar-label">${k.charAt(0).toUpperCase()+k.slice(1)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${v}%;background:#4a90d9"></div></div>
          <div class="bar-pct">${v}</div>
        </div>`).join('')}
    </div>
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div class="sec-title-sm" style="margin-bottom:0">Carga corporal</div>
        <span style="font-size:12px;font-weight:600;color:${load>70?'#c0392b':load>50?'#c07a10':'#4a8a2a'}">${Math.round(load)}%</span>
      </div>
      <div style="height:8px;background:#e5e4de;border-radius:4px;overflow:hidden">
        <div style="width:${load}%;height:100%;background:${load>70?'#c0392b':load>50?'#c07a10':'#4a8a2a'};border-radius:4px;transition:width .4s"></div>
      </div>
      <div style="font-size:12px;color:#aaa;margin-top:6px">${load>70?'Alta — riesgo de lesión':load>50?'Moderada — ojo con el volumen':'En buena forma'}</div>
    </div>
    ${decisionLog.length>0?`
    <div class="card">
      <div class="sec-title-sm">Lo que recuerda de ti</div>
      ${decisionLog.map(d=>`
        <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f5f4f0">
          <span style="font-size:13px">${d.positive?'✅':'⚠️'}</span>
          <div>
            <div style="font-size:12px;color:#555">${esc(d.label)}</div>
            <div style="font-size:11px;color:#bbb">T${d.season}</div>
          </div>
        </div>`).join('')}
    </div>`:''}`;
}

function renderCoachRepTab(){
  const el=document.getElementById('main');
  const hist=G.coachAthleteHistory||[];
  const curResults=G.coachRaceResults||[];
  const curWins=curResults.filter(r=>r.pos===1&&!r.dnf).length;
  const curPodiums=curResults.filter(r=>r.pos<=3&&!r.dnf).length;
  const curBest=curResults.filter(r=>!r.dnf).reduce((b,r)=>Math.min(b,r.pos),999);
  const totalWins=hist.reduce((s,h)=>s+(h.wins||0),0)+curWins;
  const totalPodiums=hist.reduce((s,h)=>s+(h.podiums||0),0)+curPodiums;
  const totalAthletes=hist.length+(G.coachAthlete?1:0);
  const totalSeasons=hist.length+(G.coachSeason||1);
  const rep=G.coachReputation||0;
  const repTier=rep<20?{label:'Novato',color:'#aaa'}:rep<40?{label:'Regional',color:'#4a90d9'}:rep<60?{label:'Conocido',color:'#2d7a2d'}:rep<80?{label:'Nacional',color:'#c07a10'}:{label:'Élite 🌟',color:'#c0392b'};
  const repDesc=rep<20?'El circuito apenas te conoce.':rep<40?'Tienes nombre en las carreras regionales.':rep<60?'Los atletas preguntan por ti.':rep<80?'Coach de confianza en el circuito nacional.':'Los mejores atletas te buscan.';
  const a=G.coachAthlete;

  // Build per-season data for sparkline
  const allSeasons=[
    ...hist.map(h=>({name:h.name,season:h.season,wins:h.wins||0,podiums:h.podiums||0,trust:h.trust,completed:h.completed,bestPos:h.bestPos||999})),
    ...(a?[{name:a.name,season:G.coachSeason,wins:curWins,podiums:curPodiums,trust:G.coachTrust,completed:false,bestPos:curBest,current:true}]:[])
  ].sort((a,b)=>a.season-b.season);

  el.innerHTML=`
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:1">
          <div style="font-size:24px;font-weight:700;color:${repTier.color}">${rep}<span style="font-size:14px;color:#aaa">/100</span></div>
          <div style="font-size:12px;color:#888;margin-top:1px">Reputación · <strong style="color:${repTier.color}">${repTier.label}</strong></div>
        </div>
        <div style="font-size:28px">📋</div>
      </div>
      <div style="height:5px;background:#e5e4de;border-radius:3px;margin:8px 0;overflow:hidden">
        <div style="width:${rep}%;height:100%;background:${repTier.color};border-radius:3px;transition:width .5s"></div>
      </div>
      <div style="font-size:12px;color:#aaa">${repDesc}</div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Palmares acumulado</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">
        ${[['Atletas',totalAthletes],['Temporadas',totalSeasons],['Victorias',totalWins],['Podios',totalPodiums]].map(([l,v])=>`
          <div style="background:#f5f4f0;border-radius:8px;padding:8px 4px">
            <div style="font-size:11px;color:#aaa">${l}</div>
            <div style="font-size:18px;font-weight:700">${v}</div>
          </div>`).join('')}
      </div>
    </div>

    ${a?`
    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Temporada actual — ${esc(a.name)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px">T${G.coachSeason} · ${SPEC_LABEL[a.spec]||a.spec}</span>
        <span style="font-size:13px;font-weight:700;color:${G.coachTrust>=60?'#2d7a2d':G.coachTrust>=30?'#c07a10':'#c0392b'}">Confianza ${G.coachTrust}/100</span>
      </div>
      ${Object.entries(a.currentStats).map(([k,v])=>{
        const base=a.baseStats?.[k]||50;
        const diff=v-base;
        return`<div class="bar-row" style="margin-bottom:3px">
          <div class="bar-label" style="font-size:11px">${k.charAt(0).toUpperCase()+k.slice(1)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${v}%;background:#4a90d9"></div></div>
          <div class="bar-pct" style="font-size:11px;color:${diff>0?'#2d7a2d':diff<0?'#c0392b':'#aaa'}">${diff>0?'+':''}${diff||0}</div>
        </div>`;
      }).join('')}
    </div>`:''}

    ${allSeasons.length>0?`
    <div class="card">
      <div class="sec-title-sm">Historial de temporadas</div>
      ${allSeasons.map(s=>{
        const trustC=s.trust>=60?'#2d7a2d':s.trust>=30?'#c07a10':'#c0392b';
        const bestStr=s.bestPos<999?`Mejor #${s.bestPos}`:'—';
        return`<div style="padding:10px 0;border-bottom:1px solid #f0ede8">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <div>
              <span style="font-size:13px;font-weight:600">${esc(s.name)}</span>
              ${s.current?`<span style="font-size:11px;background:#f0f6ff;color:#4a90d9;padding:1px 5px;border-radius:3px;margin-left:5px">Actual</span>`:''}
            </div>
            <span style="font-size:11px;font-weight:600;color:${s.completed?'#2d7a2d':s.current?'#4a90d9':'#c0392b'}">${s.current?'En curso':s.completed?'Renovó':'Se fue'}</span>
          </div>
          <div style="display:flex;gap:12px;font-size:12px;color:#888;flex-wrap:wrap">
            <span>T${s.season}</span>
            <span>🏆 ${s.wins} vic.</span>
            <span>🎯 ${s.podiums} podios</span>
            <span>${bestStr}</span>
            <span style="color:${trustC}">Conf. ${s.trust}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`:`<div class="hint">Completa tu primera temporada para ver el historial.</div>`}`;
}

// ── Mid-race event resolution (Tanda 2) ──
window.doCoachMidRaceEvent=choiceIdx=>{
  const evt=G.coachRaceEventPending;if(!evt)return;
  const choice=evt.choices[choiceIdx];if(!choice)return;
  if(choice.trust)G.coachTrust=Math.max(0,Math.min(100,G.coachTrust+(choice.trust||0)));
  if(choice.reputation)G.coachReputation=Math.min(100,(G.coachReputation||0)+(choice.reputation||0));
  if(choice.dnf){
    G.coachRaceResults.push({pos:999,dnf:true,prize:0,coachCut:0,raceName:G.coachRaceData?.race?.name||''});
    G.coachRaceIdx++;G.coachRaceData=null;G.coachRaceEventPending=null;
    generateCoachBetweenEvent();
    showToast('DNF — el atleta abandona','#c0392b');
    G.screen='coachHome';render();return;
  }
  // Apply stat effects
  const data=G.coachRaceData;
  if(data&&choice.timeMod)data.totalTime+=(choice.timeMod||0);
  if(data&&choice.legBoost){
    const si=G.coachRaceAnimIdx-1;
    for(let i=si;i<data.segments.length;i++){
      data.segments[i].legs=Math.min(100,(data.segments[i].legs||40)+(choice.legBoost||0));
    }
  }
  if(data&&choice.energyCost){
    const si=G.coachRaceAnimIdx-1;
    for(let i=si;i<data.segments.length;i++){
      data.segments[i].energy=Math.max(0,(data.segments[i].energy||60)-(choice.energyCost||0));
    }
  }
  if(!G.coachEventLog)G.coachEventLog=[];
  G.coachEventLog.push({evtId:evt.id,choice:choice.text,trust:choice.trust||0});
  G.coachRaceEventPending=null;
  startCoachRaceAnim();render();
};

// ── Between-race event generator (Tanda 1) ──
function generateCoachBetweenEvent(){
  if(!G.coachAthlete)return;
  const already=(G.coachEventLog||[]).map(e=>e.evtId);
  const pool=COACH_BETWEEN_EVENTS.filter(e=>{
    const times=already.filter(id=>id===e.id).length;
    return Math.random()<(e.prob||0.10)&&times<2;
  });
  if(!pool.length)return;
  G.coachPendingEvent=pool[Math.floor(Math.random()*pool.length)];
}

// ── Render between-race event (Tanda 1) ──
function renderCoachEvent(){
  const el=document.getElementById('main');
  const ev=G.coachPendingEvent;
  if(!ev){G.screen='coachHome';render();return;}
  const a=G.coachAthlete;
  const rival=a?.rivalName||'el rival';
  const name=a?.name||'el atleta';
  const desc=(ev.desc||'').replace(/\{\{name\}\}/g,esc(name)).replace(/\{\{rival\}\}/g,esc(rival));
  el.innerHTML=`
    <div style="text-align:center;padding:12px 0 16px">
      <div style="font-size:32px;margin-bottom:8px">${ev.icon||'📋'}</div>
      <h2 style="margin-bottom:4px">${ev.title}</h2>
      <p class="sub">Entre carreras · ${esc(name)}</p>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div style="font-size:14px;color:#333;line-height:1.7;font-style:italic">"${desc}"</div>
    </div>
    ${ev.choices.map((c,ci)=>{
      const meta=[];
      if(c.trust)meta.push(`<span style="color:${c.trust>0?'#2d7a2d':'#c0392b'}">${c.trust>0?'+':''}${c.trust} confianza</span>`);
      if(c.bodyLoad)meta.push(`<span style="color:${c.bodyLoad<0?'#2d7a2d':'#c0392b'}">${c.bodyLoad>0?'+':''}${c.bodyLoad} carga</span>`);
      if(c.money)meta.push(`<span style="color:${c.money>0?'#2d7a2d':'#c0392b'}">${c.money>0?'+':''}€${Math.abs(c.money)}</span>`);
      if(c.reputation)meta.push(`<span style="color:#c07a10">+${c.reputation} reputación</span>`);
      return`<div class="card" style="margin-bottom:8px;cursor:pointer;transition:background .15s" onclick="doCoachEventChoice(${ci})" onmouseenter="this.style.background='#f8f7f3'" onmouseleave="this.style.background=''">
        <div style="font-size:14px;font-weight:500;margin-bottom:${meta.length?'5px':'0'}">${c.text}</div>
        ${meta.length?`<div style="font-size:12px;display:flex;gap:10px;flex-wrap:wrap">${meta.join('')}</div>`:''}
      </div>`;
    }).join('')}`;
}

window.doCoachEventChoice=choiceIdx=>{
  const ev=G.coachPendingEvent;if(!ev)return;
  const c=ev.choices[choiceIdx];if(!c)return;
  if(c.trust)G.coachTrust=Math.max(0,Math.min(100,G.coachTrust+(c.trust||0)));
  if(c.bodyLoad)G.coachBodyLoad=Math.max(0,Math.min(100,(G.coachBodyLoad||0)+(c.bodyLoad||0)));
  if(c.money)G.money=(G.money||0)+(c.money||0);
  if(c.reputation)G.coachReputation=Math.min(100,(G.coachReputation||0)+(c.reputation||0));
  // Registrar decisión si el evento la define
  if(c.decisionType)logCoachDecision(c.decisionType, c.text.replace(/"/g,'').slice(0,60), c.decisionPositive===true);
  const delta=c.trust||0;
  showToast(delta>0?`+${delta} confianza`:delta<0?`${delta} confianza`:'Evento resuelto',delta>0?'#2d7a2d':delta<0?'#c0392b':'#888');
  if(!G.coachEventLog)G.coachEventLog=[];
  G.coachEventLog.push({evtId:ev.id,choice:c.text,trust:c.trust||0});
  G.coachPendingEvent=null;
  updateEmotionalState();
  G.screen='coachHome';render();
};

// ── Generate season objective ──
function generateCoachSeasonObjective(){
  const a=G.coachAthlete;if(!a)return;
  const hist=G.coachAthleteHistory||[];
  const season=G.coachSeason||1;
  const lastSeason=hist[hist.length-1];
  const totalDnfs=(hist.reduce((s,h)=>{
    const r=h.raceResults||[];return s+r.filter(x=>x.dnf).length;},0));
  const prevBest=lastSeason?.bestPos||999;

  // Pool base por personalidad
  const basePool=COACH_SEASON_OBJECTIVES[a.personality]||COACH_SEASON_OBJECTIVES.obediente;

  // Pool extra basado en historial (solo temporada 2+)
  const historyPool=[];
  if(season>=2){
    if(lastSeason&&lastSeason.wins===0&&lastSeason.podiums===0){
      historyPool.push({id:'first_podio',label:'Consigue tu primer podio con este atleta',
        desc:`"El año pasado sin podios. Este año cambiamos eso."`,reward:+15,penalty:-8,
        checkAll:(all)=>(all||[]).some(r=>r.pos<=3&&!r.dnf)});
    }
    if(lastSeason&&(lastSeason.dnfs||0)>=2){
      historyPool.push({id:'no_dnf_season',label:'Temporada completa sin abandonos',
        desc:`"${a.name.split(' ')[0]} abandonó demasiado el año pasado. Esta vez llegamos al final."`,
        reward:+10,penalty:-6,
        checkAll:(all)=>(all||[]).every(r=>!r.dnf)});
    }
    if(prevBest<999&&prevBest>5){
      historyPool.push({id:'beat_pb',label:`Superar la mejor posición del año pasado (#${prevBest})`,
        desc:`"El año pasado, el mejor fue #${prevBest}. Este año hay que hacerlo mejor."`,
        reward:+12,penalty:-5,
        checkAll:(all)=>{const b=Math.min(...(all||[]).filter(x=>!x.dnf).map(x=>x.pos)||[999]);return b<prevBest;}});
    }
    if(lastSeason&&lastSeason.trust<50){
      historyPool.push({id:'rebuild_trust',label:'Reconstruir la relación — terminar con confianza ≥60',
        desc:`"La temporada pasada acabó tensa. Hay que reconstruir desde dentro."`,
        reward:+14,penalty:-4,
        checkAll:()=>G.coachTrust>=60});
    }
    if(season>=3&&a.personality==='perfeccionista'){
      historyPool.push({id:'zegama_time',label:`Clasificar para Zegama o carrera nacional`,
        desc:`"${a.name.split(' ')[0]} ya está listo para dar el salto. Es el momento."`,
        reward:+18,penalty:-10,
        checkAll:(all)=>(all||[]).some(r=>['nacional','elite'].includes(r.tier||'')&&!r.dnf&&r.pos<=15)});
    }
  }

  // Elegir: si hay historial relevante, 60% de probabilidad de usarlo
  const useHistory=historyPool.length>0&&Math.random()<0.6;
  const pool=useHistory?historyPool:basePool;
  const chosen=pool[Math.floor(Math.random()*pool.length)];

  G.coachSeasonObjective={
    id:chosen.id,label:chosen.label,desc:chosen.desc,
    reward:chosen.reward,penalty:chosen.penalty,met:false,
    fromHistory:useHistory,
    checkAll:(all)=>{
      if(chosen.checkAll)return chosen.checkAll(all);
      // fallback para objetivos base sin checkAll propio
      const id=chosen.id;
      if(id==='win_elite')   return(all||[]).some(r=>r.pos===1&&['elite','nacional'].includes(r.tier||''));
      if(id==='no_abandon')  return(all||[]).every(r=>!r.dnf);
      if(id==='podio_x2')    return(all||[]).filter(x=>x.pos<=3&&!x.dnf).length>=2;
      if(id==='top10_all')   return(all||[]).every(x=>x.dnf||x.pos<=10);
      if(id==='finish_all')  return(all||[]).filter(x=>!x.dnf).length>=(G.coachSelectedRaces||[]).length;
      if(id==='improve_pb')  {const prev=(G.coachAthleteHistory||[]).slice(-1)[0]?.bestPos||999;return(all||[]).some(x=>!x.dnf&&x.pos<prev);}
      if(id==='no_injury')   return!G.coachInjury||(G.coachInjury?.severity||0)<2;
      if(id==='two_races')   return(all||[]).filter(x=>!x.dnf).length>=2;
      return false;
    }
  };
}

// ── Generate sponsor pool for the season ──
function generateCoachSponsorPool(){
  const season=G.coachSeason||1;
  const tier=season<=1?1:2;
  const pool=shuffle([...COACH_SPONSORS_POOL].filter(s=>s.tier<=tier));
  G.coachSponsorPool=pool.slice(0,3);
}

// ── Sponsors screen ──
function renderCoachSponsors(){
  const el=document.getElementById('main');
  const a=G.coachAthlete;
  const pool=G.coachSponsorPool||[];
  const active=G.coachSponsors||[];
  const CAT_LABEL={zapatillas:'👟 Zapatillas',ropa:'👕 Ropa',nutricion:'🍬 Nutrición',tecnologia:'⌚ Tecnología'};
  el.innerHTML=`
    <h2>Sponsors del atleta</h2>
    <p class="sub">${esc(a?.name||'—')} · T${G.coachSeason} · Comisión ${Math.round((pool[0]?.coachCut||0.15)*100)}%</p>

    ${active.length>0?`
    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Activos esta temporada</div>
      ${active.map(sp=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0ede8">
          <div>
            <div style="font-size:13px;font-weight:600">${esc(sp.name)} <span style="font-size:11px;color:#888">${CAT_LABEL[sp.cat]||sp.cat}</span></div>
            <div style="font-size:12px;color:#aaa">${sp.objective}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:8px">
            <div style="font-size:13px;font-weight:700">€${sp.salary}/año</div>
            <div style="font-size:11px;color:#4a90d9">+€${Math.round(sp.salary*(sp.coachCut||0.15))} para ti</div>
          </div>
        </div>`).join('')}
    </div>`:''}

    ${pool.filter(sp=>!active.find(ac=>ac.id===sp.id)).length>0?`
    <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Ofertas disponibles</div>
    ${pool.filter(sp=>!active.find(ac=>ac.id===sp.id)).map(sp=>`
      <div class="card" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="font-size:14px;font-weight:600">${esc(sp.name)}</div>
            <div style="font-size:12px;color:#888">${CAT_LABEL[sp.cat]||sp.cat}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:8px">
            <div style="font-size:14px;font-weight:700">€${sp.salary}/año</div>
            <div style="font-size:11px;color:#4a90d9">+€${Math.round(sp.salary*(sp.coachCut||0.15))} comisión</div>
          </div>
        </div>
        <div style="font-size:12px;color:#555;margin-bottom:4px">📋 ${sp.objective}</div>
        <div style="font-size:12px;color:#888;margin-bottom:10px">🎁 ${sp.bonus}</div>
        ${active.length<2
          ?`<button class="main" style="margin-top:0" onclick="doCoachAcceptSponsor('${sp.id}')">Aceptar oferta →</button>`
          :`<div style="font-size:12px;color:#aaa;text-align:center;padding:6px">Máx. 2 sponsors activos</div>`}
      </div>`).join('')}
    `:`<div class="hint">No hay ofertas disponibles ahora mismo.</div>`}

    <button class="main" style="margin-top:8px;opacity:0.5" onclick="G.screen='coachHome';render()">← Volver</button>`;
}

window.doCoachAcceptSponsor=id=>{
  const sp=(G.coachSponsorPool||[]).find(s=>s.id===id);
  if(!sp||(G.coachSponsors||[]).find(s=>s.id===id))return;
  if(!G.coachSponsors)G.coachSponsors=[];
  G.coachSponsors.push({...sp});
  showToast(`🤝 ${sp.name} — contrato firmado`,'#2d7a2d');
  render();
};
