function checkAndUnlockAchievements(){
  if(!G.unlockedAchievements)G.unlockedAchievements=[];
  if(!G.achievementMeta)G.achievementMeta={};
  const newUnlocks=[];
  const diff=G.gameMode==='canicross'?'canicross':(G.gameMode||'medio');
  ACHIEVEMENTS.forEach(ach=>{
    if(!G.unlockedAchievements.includes(ach.id)&&ach.check()){
      G.unlockedAchievements.push(ach.id);
      G.achievementMeta[ach.id]={difficulty:diff,year:G.year||G.cnSeason||1};
      newUnlocks.push(ach);
    }
  });
  if(newUnlocks.length>0){
    let globalAchs={};
    try{globalAchs=JSON.parse(LS.get('globalAchs')||'{}');}catch(e){}
    newUnlocks.forEach(ach=>{
      if(!globalAchs[ach.id])globalAchs[ach.id]={difficulty:diff,year:G.year||G.cnSeason||1};
      showToast(`🏆 Logro: ${ach.label}`,'#c07a10');
    });
    LS.set('globalAchs',JSON.stringify(globalAchs));
  }
  return newUnlocks;
}
function renderAchievements(){
  const el=document.getElementById('main');
  if(!G._achF)G._achF={mode:'all',rarity:'all',status:'all'};
  const f=G._achF;
  let globalAchs={};
  try{globalAchs=JSON.parse(LS.get('globalAchs')||'{}');}catch(e){}
  const RARITY={easy:{c:'#4a8a2a',bg:'#eaf4ea',l:'Fácil'},medium:{c:'#4a90d9',bg:'#e8f0fb',l:'Medio'},hard:{c:'#c07a10',bg:'#fdf0e0',l:'Difícil'},legendary:{c:'#8b2252',bg:'#f8e8f2',l:'Legendario'}};
  const DIFF_LABEL={facil:'🟢 Fácil',medio:'🟡 Medio',dificil:'🔴 Difícil',hardcore:'💀 Hardcore',expres:'⚡ Exprés',canicross:'🐕 Canicross'};
  const rb=a=>{const r=RARITY[a.rarity]||{c:'#888',bg:'#eee',l:''};return`<span style="font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;background:${r.bg};color:${r.c}">${r.l}</span>`;};
  const totalUnlocked=Object.keys(globalAchs).length;
  let list=ACHIEVEMENTS.filter(a=>{
    if(f.mode==='normal'&&a.mode)return false;
    if(f.mode==='cn'&&a.mode!=='cn')return false;
    if(f.mode==='excl'&&!a.excl)return false;
    if(f.rarity!=='all'&&a.rarity!==f.rarity)return false;
    const isUnlocked=!!globalAchs[a.id];
    if(f.status==='unlocked'&&!isUnlocked)return false;
    if(f.status==='pending'&&isUnlocked)return false;
    return true;
  });
  const chip=(label,field,val)=>`<button onclick="G._achF.${field}='${val}';render()" style="font-size:11px;padding:4px 10px;border-radius:20px;border:1px solid ${f[field]===val?'#c07a10':'#ddd'};background:${f[field]===val?'#fdf0e0':'#fff'};color:${f[field]===val?'#c07a10':'#888'};cursor:pointer;font-weight:${f[field]===val?'700':'400'}">${label}</button>`;
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button class="secondary" onclick="G.screen=G._achPrev||'modeSelect';render()" style="font-size:13px;padding:6px 12px">← Volver</button>
      <div>
        <h2 style="margin:0;font-size:20px">🏅 Logros</h2>
        <div style="font-size:12px;color:#888">${totalUnlocked} de ${ACHIEVEMENTS.length} conseguidos</div>
      </div>
    </div>
    <div style="background:#fff;border:1px solid #e8e6e0;border-radius:10px;padding:12px 14px;margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Modo</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${chip('Todos','mode','all')}${chip('Normal','mode','normal')}${chip('Canicross','mode','cn')}${chip('Difícil+','mode','excl')}
      </div>
      <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Rareza</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${chip('Todos','rarity','all')}${chip('Fácil','rarity','easy')}${chip('Medio','rarity','medium')}${chip('Difícil','rarity','hard')}${chip('Legendario','rarity','legendary')}
      </div>
      <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Estado</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${chip('Todos','status','all')}${chip('Conseguidos','status','unlocked')}${chip('Pendientes','status','pending')}
      </div>
    </div>
    <div style="font-size:12px;color:#aaa;margin-bottom:8px">${list.length} logro${list.length!==1?'s':''} encontrado${list.length!==1?'s':''}</div>
    <div class="card" style="padding:0">
      ${list.length===0?`<div style="padding:24px;text-align:center;color:#aaa;font-size:13px">Sin logros con estos filtros</div>`:
      list.map((ach,i)=>{
        const meta=globalAchs[ach.id];
        const unlocked=!!meta;
        return`<div style="padding:10px 14px;${i<list.length-1?'border-bottom:1px solid #f0ede8;':''}display:flex;align-items:flex-start;gap:10px;${!unlocked?'opacity:0.55':''}">
          <span style="font-size:18px;margin-top:1px">${unlocked?'🏆':'🔒'}</span>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
              <span style="font-size:13px;font-weight:600;color:#1a1a1a">${esc(ach.label)}</span>
              ${rb(ach)}
              ${ach.excl?`<span style="font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;background:#f0e8f8;color:#6b3fa0">Exclusivo</span>`:''}
              ${meta?`<span style="font-size:10px;color:#aaa">· ${DIFF_LABEL[meta.difficulty]||meta.difficulty}</span>`:''}
            </div>
            <div style="font-size:12px;color:#888">${esc(ach.desc)}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}
function updateFinBar(){
  const bar=document.getElementById('fin-bar');
  if(!bar)return;
  const screens=['intro','workSetup'];
  bar.style.display=screens.includes(G.screen)?'none':'block';
  const net=monthlyNet();
  document.getElementById('fb-money').textContent='€'+(G.canicrossMode?G.cnMoney:G.money);
  const nb=document.getElementById('fb-net');
  nb.textContent=(net>=0?'+':'')+'€'+net+'/mes';
  nb.className='fin-val '+(net>0?'green':net<0?'red':'neutral');
  // Año + mes derivado de carrera actual o trimestre
  const curRace=G.selectedRaces&&G.selectedRaces[G.currentRaceIdx||0];
  const MONTH_SHORT=['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const monthStr=curRace?MONTH_SHORT[curRace.month||1]:
    (['','T1','T2','T3','T4'][G.currentQuarter||1]);
  document.getElementById('fb-year').textContent='A'+G.year+' · '+monthStr;
  document.getElementById('fb-rank').textContent=G.ranking<900?'#'+G.ranking:'—';
  const sr=document.getElementById('fb-specrank');
  if(sr)sr.textContent=G.specRanking<900?'#'+G.specRanking:'—';
}

// ══════════════════════════════════════
//  HELPERS GENERALES
// ══════════════════════════════════════
function fmt(s){s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return h>0?h+'h '+pad(m)+'m '+pad(ss)+'s':pad(m)+'m '+pad(ss)+'s';}
function pad(n){return String(n).padStart(2,'0');}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function rbar(v,col){const p=Math.max(0,Math.min(100,Math.round(v)));const c=p>50?col:p>25?'#d4920a':'#c0392b';return `<div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${c}"></div></div>`;}
function srow(label,val){const p=Math.max(0,Math.min(100,Math.round(val)));const c=p>=70?'#4a8a2a':p>=50?'#4a90d9':p>=35?'#c07a10':'#c0392b';return `<div class="bar-row"><span class="bar-label">${label}</span><div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${c}"></div></div><span class="bar-pct">${Math.round(val)}</span></div>`;}
function raceStats(){const r=G.runner;return `<div class="card">${[['Energía',r.energy,'#4a8a2a'],['Hidratación',r.hydration,'#4a90d9'],['Piernas',r.legs,'#c07a10']].map(([l,v,c])=>`<div class="bar-row"><span class="bar-label" style="color:${v<25?'#c0392b':'#666'}">${l}${v<25?' ⚠':''}</span>${rbar(v,c)}<span class="bar-pct" style="color:${v<25?'#c0392b':'#1a1a1a'}">${Math.round(v)}%</span></div>`).join('')}</div>`;}
function progBar(){const segs=curSegs();const done=segs.slice(0,G.seg).reduce((a,s)=>a+s.km,0);const total=segs.reduce((a,s)=>a+s.km,0);const pct=total>0?Math.round(done/total*100):0;return `<div class="prog-wrap"><div class="prog-meta"><span>${done}km hechos</span><span>${total-done}km restantes</span></div><div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div></div>`;}
function topBar(){const race=G.selectedRaces[G.currentRaceIdx];return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:12px;color:#999">${race?.name||''} · ${G.seg+1}/${curSegs().length}</span><span style="font-size:13px;font-weight:600">${fmt(G.time)}</span></div>`;}
function getEffStat(k){let b=0;Object.values(G.sponsors).forEach(sp=>{if(sp?.statBonus[k])b+=sp.statBonus[k];});if(G.club?.statBonus[k])b+=G.club.statBonus[k];if(G.spending.suplementos&&k==='nutricion')b+=3;return Math.min(100,G.runner.stats[k]+b);}
function hbar(val,max,col){const p=Math.round(val/max*100);return `<div class="bar-track" style="height:8px"><div class="bar-fill" style="width:${p}%;background:${col}"></div></div>`;}
function updateTabNav(){
  const nav=document.getElementById('tab-nav');
  if(!nav)return;
  const show=SCREENS_WITH_TABS.includes(G.screen);
  nav.style.display=show?'block':'none';
  const isExpres=G.gameMode==='expres';
  const isCoach=G.gameMode==='coach';
  const isCanicross=G.gameMode==='canicross';
  if(isExpres&&G.activeTab==='fame')G.activeTab='game';
  ['game','calendar','finances','runner','fame'].forEach(t=>{
    const btn=document.getElementById('tab-'+t);
    if(!btn)return;
    btn.className='tab-btn'+(G.activeTab===t?' active':'');
    if(t==='fame')btn.style.display=isExpres?'none':'';
    const iconEl=btn.querySelector('.tab-icon');
    const labelEl=btn.querySelector('.tab-label');
    if(isCanicross){
      btn.style.display='';
      if(t==='game'){if(iconEl)iconEl.textContent='🏃';if(labelEl)labelEl.textContent='Corredor';}
      if(t==='runner'){if(iconEl)iconEl.textContent='🐕';if(labelEl)labelEl.textContent='Perro';}
      if(t==='fame'){if(iconEl)iconEl.textContent='🎒';if(labelEl)labelEl.textContent='Equipo';}
      if(t==='calendar'&&labelEl)labelEl.textContent='Calendario';
      if(t==='finances'&&labelEl)labelEl.textContent='Finanzas';
    } else if(isCoach){
      if(t==='runner'&&labelEl)labelEl.textContent='Atleta';
      if(t==='fame'&&labelEl)labelEl.textContent='Reputación';
      if(t==='game'&&labelEl)labelEl.textContent='Temporada';
    } else {
      if(t==='runner'){if(iconEl)iconEl.textContent='👤';if(labelEl)labelEl.textContent='Corredor';}
      if(t==='fame'){if(iconEl)iconEl.textContent='⭐';if(labelEl)labelEl.textContent='Reputación';}
      if(t==='game'){if(iconEl)iconEl.textContent='🏃';if(labelEl)labelEl.textContent='Temporada';}
    }
  });
}

window.switchTab=t=>{
  G.activeTab=t;
  render();
};

// ══════════════════════════════════════
//  FEEDBACK VISUAL — TOAST
// ══════════════════════════════════════
function showToast(msg,color='#1a1a1a'){
  const t=document.getElementById('toast-notif');
  if(!t)return;
  t.textContent=msg;
  t.style.background=color;
  t.classList.remove('show');
  void t.offsetWidth; // reflow
  t.classList.add('show');
  clearTimeout(t._tmr);
  t._tmr=setTimeout(()=>t.classList.remove('show'),1800);
}

// ══════════════════════════════════════
//  RENDER PRINCIPAL
// ══════════════════════════════════════
// Fisher-Yates unbiased shuffle (replaces sort(()=>Math.random()-0.5))
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function render(){
  // Defensive timer cleanup — prevent orphaned intervals from previous screens
  if(G._xpTimerInterval){clearInterval(G._xpTimerInterval);G._xpTimerInterval=null;}
  if(typeof _coachRaceTimer!=='undefined'&&_coachRaceTimer&&G.screen!=='coachRace'){clearInterval(_coachRaceTimer);_coachRaceTimer=null;}
  updateFinBar();
  updateTabNav();
  // Clear any pending Express timer if we've left the mid-race event screen
  if(G.screen!=='midRaceEvent')clearExpressTimer();
  const el=document.getElementById('main');
  if(!el)return;
  // Canicross — tab routing propio
  if(G.gameMode==='canicross'&&SCREENS_WITH_TABS.includes(G.screen)){
    if(G.activeTab==='game'){renderCnCorredorTab();triggerFade(el);return;}
    if(G.activeTab==='runner'){renderCnPerroTab();triggerFade(el);return;}
    if(G.activeTab==='fame'){renderCnEquipoTab();triggerFade(el);return;}
    if(G.activeTab==='calendar'){renderCnCalendarioTab();triggerFade(el);return;}
    if(G.activeTab==='finances'){renderCnFinanzasTab();triggerFade(el);return;}
  }
  // Si estamos en una pestaña auxiliar
  if(G.activeTab==='calendar'&&SCREENS_WITH_TABS.includes(G.screen)){
    if(G.gameMode==='coach'){renderCoachCalendar();triggerFade(el);return;}
    renderCalendarTab();triggerFade(el);return;
  }
  if(G.activeTab==='finances'&&SCREENS_WITH_TABS.includes(G.screen)){renderFinancesTab();triggerFade(el);return;}
  if(G.activeTab==='runner'&&SCREENS_WITH_TABS.includes(G.screen)){
    if(G.gameMode==='coach'){renderCoachAthleteTab();triggerFade(el);return;}
    renderRunnerTab();triggerFade(el);return;
  }
  if(G.activeTab==='fame'&&SCREENS_WITH_TABS.includes(G.screen)){
    if(G.gameMode==='coach'){renderCoachRepTab();triggerFade(el);return;}
    renderFameTab();triggerFade(el);return;
  }
  // Flujo normal del juego
  ({
    intro:renderIntro,workSetup:renderWorkSetup,seasonStart:renderSeasonStart,
    modeSelect:renderModeSelect,saveScreen:renderSaveScreen,
    calendar:renderCalendar,sponsors:renderSponsors,training:renderTraining,
    preRace:renderPreRace,segment:renderSegment,aid:renderAid,
    betweenRace:renderBetweenRace,seasonBalance:renderSeasonBalance,
    midSeasonCalendar:renderMidSeasonCalendar,circuits:renderCircuits,
    betweenManage:renderBetweenManage,preRacePrep:renderPreRacePrep,
    clubSetup:renderClubSetup,
    midRaceEvent:renderMidRaceEvent,retirement:renderRetirement,
    startStrategy:renderStartStrategy,raceResult:renderRaceResult,
    expresSeasonStart:renderExpresSeasonStart,expresCalendar:renderExpresCalendar,
    expresSponsors:renderExpresSponsors,expresPrep:renderExpresPrep,
    expresPreRacePrep:renderExpresPreRacePrep,expresSeasonBalance:renderExpresSeasonBalance,
    coachSelect:renderCoachSelect,coachStyleSelect:renderCoachStyleSelect,coachHome:renderCoachHome,
    coachTraining:renderCoachTraining,coachCalendar:renderCoachCalendar,
    coachTrainingReaction:renderCoachTrainingReaction,
    coachRace:renderCoachRace,coachPostRace:renderCoachPostRace,coachSeasonEnd:renderCoachSeasonEnd,
    coachEvent:renderCoachEvent,coachPreRace:renderCoachPreRace,
    coachSponsors:renderCoachSponsors,coachHub:renderCoachHub,
    clubCreate:renderClubCreate,clubHub:renderClubHub,
    clubStaff:renderClubStaff,clubSponsors:renderClubSponsors,clubMonthly:renderClubMonthly,
    clubRivals:renderClubRivals,
    clubPlantilla:renderClubPlantilla,clubCalendar:renderClubCalendar,
    clubSimulate:renderClubSimulate,clubSeasonEnd:renderClubSeasonEnd,
    clubEvent:renderClubEvent,
    lifeAthleteOffer:renderLifeAthleteOffer,
    overlapHub:renderOverlapHub,
    lifeRetirement:renderLifeRetirement,
    clubOffer:renderClubOffer,
    ultratrailWelcome:renderUltratrailWelcome,
    ultratrailSeasonHub:renderUltratrailSeasonHub,
    ultratrailSeasonStart:renderUltratrailSeasonStart,
    ultratrailIntensitySelect:renderUltratrailIntensitySelect,
    ultratrailMochila:renderUltratrailMochila,
    ultratrailPreRace:renderUltratrailPreRace,
    ultratrailSegment:renderUltratrailSegment,
    ultratrailAid:renderUltratrailAid,
    ultratrailNight:renderUltratrailNight,
    ultratrailCutoffDNF:renderUltratrailCutoffDNF,
    ultratrailPostRace:renderUltratrailPostRace,
    ultratrailYearEnd:renderUltratrailYearEnd,
    ultratrailSeasonBalance:renderUltratrailSeasonBalance,
    ultratrailLegado:renderUltratrailLegado,
    backyardConfig:renderBackyardConfig,
    backyardLoop:renderBackyardLoop,
    backyardResult:renderBackyardResult,
    mdsPreparation:renderMDSPreparation,
    mdsDecision:renderMDSDecision,
    mdsBivouac:renderMDSBivouac,
    mdsFinal:renderMDSFinal,
    canicrossCreateDog:renderCnCreateDog,
    canicrossPreseason:renderCanicrossPreseason,
    canicrossTrainingSetup:renderCanicrossTrainingSetup,
    canicrossCalendarSetup:renderCanicrossCalendarSetup,
    canicrossHub:renderCnCorredorTab,
    canicrossPreRace:renderCanicrossPreRace,
    canicrossSegment:renderCanicrossSegment,
    canicrossPostRace:renderCanicrossPostRace,
    canicrossSeasonBalance:renderCnSeasonBalance,
    canicrossDogRetirement:renderCnDogRetirement,
    canicrossDogDeath:renderCnDogDeath,
    canicrossDisplasia:renderCnDisplasia,
    achievements:renderAchievements,
  }[G.screen]||renderIntro)();
  triggerFade(el);
}
function triggerFade(el){
  el.classList.remove('fade-in');
  void el.offsetWidth;
  el.classList.add('fade-in');
}

// ── CALENDAR TAB ───────────────────────
function renderCalendarTab(){
  const el=document.getElementById('main');
  const selIds=G.selectedRaces.map(r=>r.id);
  const specRaces=getSpecRaces();
  const qLabel={1:'Primer trimestre',2:'Segundo trimestre',3:'Tercer trimestre',4:'Cuarto trimestre'};
  // uses global QUARTERS
  const tierColor=TIER_COLOR_RACE;
  const tierLabel=TIER_LABEL_RACE;
  const canAccess=r=>r.zegamaSpecial?(G.ranking<=20||G.zegamaQual):((G.repInvitations||[]).find(i=>i.id===r.id)||(G.year===1?r.reqRanking===999:r.reqRanking>=G.ranking||r.reqRanking===999));

  // Calcula qué carreras dan puntos de circuito y cuántos
  function circuitBadge(raceId){
    for(const cid of G.joinedCircuits){
      const c=CIRCUITS_DB.find(x=>x.id===cid);
      if(c&&c.raceIds.includes(raceId)){
        const estPts=circuitPoints(3,15);
        return `<span style="font-size:12px;font-weight:600;padding:1px 5px;border-radius:3px;background:#c07a1022;color:#c07a10">Liga · ~${estPts}pts</span>`;
      }
    }
    return '';
  }

  function calRaceRow(r){
    const isSel=selIds.includes(r.id);
    const isLocked=!canAccess(r);
    const isInvited=!!(G.repInvitations||[]).find(i=>i.id===r.id);
    const cls=isSel?'sel':isLocked?'lock':'avail';
    const badge=circuitBadge(r.id);
    return `<div class="cal-race ${cls}">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:1px">
          <span class="cal-race-name">${r.name}</span>
          <span style="font-size:12px;font-weight:600;padding:1px 5px;border-radius:3px;background:${tierColor[r.tier]||'#888'}22;color:${tierColor[r.tier]||'#888'}">${tierLabel[r.tier]||''}</span>
          ${badge}
          ${r.spec?`<span style="font-size:12px;font-weight:600;padding:1px 5px;border-radius:3px;background:#4a8a2a22;color:#4a8a2a">★ ${r.spec}</span>`:''}
          ${isInvited?`<span style="font-size:12px;font-weight:600;padding:1px 5px;border-radius:3px;background:#2d7a2a22;color:#2d7a2a">📩 Invitación</span>`:''}
        </div>
        <div class="cal-race-meta">${r.monthName} · ${r.type} · ${r.desnivel}${isInvited?' · <span style="color:#2d7a2a">ranking no requerido</span>':''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        ${isSel?`<span style="font-size:12px;color:#4a8a2a;font-weight:600">✓</span>`:isLocked?`<span style="font-size:12px;color:#ccc">🔒</span>`:''}
        <div class="cal-dot" style="background:${isSel?'#4a8a2a':'#ddd'}"></div>
      </div>
    </div>`;
  }

  el.innerHTML=`
    <h2>Calendario ${G.year}</h2>
    <p class="sub">Tu temporada de un vistazo</p>
    ${G.joinedCircuits.length>0?`<div style="font-size:12px;color:#c07a10;background:#c07a1010;border-radius:8px;padding:8px 12px;margin-bottom:12px">
      🏆 Liga activa — las carreras marcadas con <strong>Liga · ~Xpts</strong> suman puntos al circuito
    </div>`:''}
    ${QUARTERS.map(q=>{
      const common=RACES_DB.filter(r=>r.quarter===q.n);
      const spec=specRaces.filter(r=>r.quarter===q.n);
      const allQ=[...common,...spec];
      const qSel=allQ.filter(r=>selIds.includes(r.id)).length;
      const hasLeague=allQ.some(r=>G.joinedCircuits.some(cid=>CIRCUITS_DB.find(c=>c.id===cid)?.raceIds.includes(r.id)));
      const isOpen=(G.openQuarters?.tab||[]).includes(q.n);
      return `
        <div class="quarter-wrap">
          <div class="quarter-toggle ${qSel>0?'has-sel':''}" onclick="toggleQTab(${q.n})">
            <span style="font-size:14px;font-weight:600;flex:1">${qLabel[q.n]}
              <span style="font-size:12px;font-weight:400;color:#aaa"> · ${q.months}</span>
            </span>
            ${hasLeague?`<span style="font-size:12px;color:#c07a10;margin-right:6px">🏆</span>`:''}
            ${qSel>0?`<span style="font-size:12px;color:#4a8a2a;font-weight:600;margin-right:6px">${qSel} ✓</span>`:''}
            <span style="font-size:12px;color:#aaa;display:inline-block;transform:${isOpen?'rotate(90deg)':''};transition:transform .2s">▶</span>
          </div>
          <div class="quarter-content ${isOpen?'open':''}" onclick="event.stopPropagation()">
            ${common.map(r=>calRaceRow(r)).join('')}
            ${spec.length>0?`
              <div style="font-size:12px;color:#4a8a2a;font-weight:600;padding:6px 2px 4px">★ Específicas de tu especialidad</div>
              ${spec.map(r=>calRaceRow(r)).join('')}
            `:''}
          </div>
        </div>`;}).join('')}
    ${G.trainingBlock?`<div class="card" style="margin-top:8px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Bloque de entrenamiento</div>
      <div class="card-title">${G.trainingBlock.name}</div>
      <div class="card-sub">${G.trainingBlock.desc}</div>
    </div>`:
    `<div style="font-size:13px;color:#aaa;text-align:center;padding:12px 0">Bloque de entrenamiento por elegir</div>`}`;
}

window.toggleQTab=q=>{
  if(!G.openQuarters)G.openQuarters={cal:[],mid:[],tab:[]};
  const arr=G.openQuarters.tab;
  const idx=arr.indexOf(q);
  if(idx>=0)arr.splice(idx,1);else arr.push(q);
  render();
};

// ── FINANCES TAB ───────────────────────
function renderFinancesTab(){
  const el=document.getElementById('main');
  const wo=WORK_OPTIONS.find(o=>o.pct===G.workPct)||WORK_OPTIONS[0];
  const workM=monthlyWorkIncome();
  const sponsorM=monthlySponsorIncome();
  const brandM=monthlyBrandIncome();
  const clubM=G.club?.cost||0;
  const netM=monthlyNet();
  const workA=workM*12;
  const sponsorA=sponsorAnnual();
  const brandA=brandM*12;
  const fixedA=FIXED_COSTS.total*12;
  const clubA=clubM*12;
  const netA=netM*12;
  const raceCosts=G.selectedRaces.reduce((a,r)=>a+r.cost,0);
  const staffCosts=(G.spending.fisio?200:0)+(G.spending.entrenador?250:0)+(G.spending.suplementos?100:0);
  const netAfterRaces=netA-raceCosts-staffCosts;
  const savingsEnd=Math.max(0,G.money+netAfterRaces);
  const savingsPct=Math.min(100,Math.round(savingsEnd/(G.money+Math.abs(netAfterRaces)+1)*100));

  // ── Sección Tienda Propia ──────────────
  const brandEligible=canLaunchBrand()&&G.gameMode!=='expres';
  const canHireEmployee=G.ownBrand&&!G.ownBrand.hasEmployee&&(G.year>=G.ownBrand.launched+2);
  let brandSection='';
  if(G.ownBrand){
    const yearsActive=G.year-G.ownBrand.launched;
    brandSection=`
    <div class="fin-section" style="border-color:#c07a10">
      <div class="fin-title" style="color:#c07a10">👟 Tu Marca — ${G.ownBrand.hasEmployee?'Consolidada':'Activa'}</div>
      ${G.ownBrand.hasEmployee
        ? `<div class="fin-row"><span>Ingresos brutos marca</span><span class="plus">+€1.300/mes</span></div>
           <div class="fin-row"><span>Coste empleado</span><span class="minus">-€700/mes</span></div>
           <div class="fin-row"><span>Neto marca</span><span class="plus">+€600/mes</span></div>
           <div style="font-size:12px;color:#4a8a2a;margin-top:8px">✓ Empleado contratado — sin coste de horas de entrenamiento</div>`
        : `<div class="fin-row"><span>Ingresos marca</span><span class="plus">+€300/mes</span></div>
           <div style="font-size:12px;color:#c07a10;margin-top:8px">⏱ Consume 6h/semana de tu tiempo de entrenamiento</div>
           ${canHireEmployee
             ? `<button class="main" style="margin-top:10px;border-color:#4a8a2a;color:#4a8a2a" onclick="doHireEmployee()">Contratar empleado — €700/mes · recuperas 6h entrenamiento</button>`
             : `<div style="font-size:12px;color:#aaa;margin-top:6px">Podrás contratar empleado a partir del año ${(G.ownBrand.launched+2)}</div>`
           }`
      }
      <div style="font-size:11px;color:#aaa;margin-top:6px">Marca lanzada en Año ${G.ownBrand.launched} · ${yearsActive} temporada${yearsActive!==1?'s':''} activa${yearsActive!==1?'s':''}</div>
    </div>`;
  } else if(brandEligible){
    brandSection=`
    <div class="fin-section" style="border-color:#e0dfd8;border-style:dashed">
      <div class="fin-title">👟 Tu Propia Marca</div>
      <div style="font-size:13px;color:#555;margin-bottom:10px">Desbloqueable ahora que tienes nombre en el circuito. Inversión inicial de €2.500 — genera €300/mes aunque consume 6h/semana de entrenamiento.</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px">A los 2 años puedes contratar un empleado (€700/mes) y recuperar las horas de entrenamiento. La marca seguirá generando sin esfuerzo.</div>
      ${G.money>=2500
        ? `<button class="main" style="border-color:#c07a10;color:#c07a10" onclick="doLaunchBrand()">Lanzar mi marca — −€2.500 · +€300/mes</button>`
        : `<button class="main" disabled>Lanzar mi marca (necesitas €${2500-G.money} más)</button>`
      }
    </div>`;
  }

  el.innerHTML=`
    <h2>Finanzas</h2>
    <p class="sub">Temporada ${G.year} · ${esc(G.runner.name||'Corredor')}</p>

    <div class="fin-section">
      <div class="fin-title">Mensual</div>
      ${workM>0?`<div class="fin-row"><span>Trabajo (${wo.label})</span><span class="plus">+€${workM}</span></div>`:''}
      ${sponsorM>0?`<div class="fin-row"><span>Patrocinios</span><span class="plus">+€${sponsorM}</span></div>`:''}
      ${brandM>0?`<div class="fin-row"><span>Tu marca 👟</span><span class="plus">+€${brandM}</span></div>`:''}
      <div class="fin-row"><span>Gastos fijos de vida</span><span class="minus">-€${FIXED_COSTS.total}</span></div>
      ${clubM>0?`<div class="fin-row"><span>Club (${G.club?.name})</span><span class="minus">-€${clubM}</span></div>`:''}
      <div class="fin-row tot"><span>Neto mensual</span><span class="${netM>=0?'plus':'minus'}">${netM>=0?'+':''}€${netM}</span></div>
    </div>

    <div class="fin-section">
      <div class="fin-title">Proyección anual</div>
      ${workA>0?`<div class="fin-row"><span>Ingresos trabajo</span><span class="plus">+€${workA}</span></div>`:''}
      ${sponsorA>0?`<div class="fin-row"><span>Ingresos patrocinios</span><span class="plus">+€${sponsorA}</span></div>`:''}
      ${brandA>0?`<div class="fin-row"><span>Tu marca (neto)</span><span class="plus">+€${brandA}</span></div>`:''}
      <div class="fin-row"><span>Gastos fijos (12 meses)</span><span class="minus">-€${fixedA}</span></div>
      ${clubA>0?`<div class="fin-row"><span>Club</span><span class="minus">-€${clubA}</span></div>`:''}
      ${raceCosts>0?`<div class="fin-row"><span>Inscripciones carreras</span><span class="minus">-€${raceCosts}</span></div>`:''}
      ${staffCosts>0?`<div class="fin-row"><span>Staff (fisio/entrenador/suplem.)</span><span class="minus">-€${staffCosts}</span></div>`:''}
      <div class="fin-row tot"><span>Resultado del año</span><span class="${netAfterRaces>=0?'plus':'minus'}">${netAfterRaces>=0?'+':''}€${netAfterRaces}</span></div>
    </div>

    <div class="fin-section">
      <div class="fin-title">Ahorros</div>
      <div class="fin-row"><span>Ahorros actuales</span><span style="font-weight:600">€${G.money}</span></div>
      <div class="fin-row"><span>Previsión fin de temporada</span><span style="font-weight:600;color:${savingsEnd>=G.money?'#2d7a2d':'#c0392b'}">€${Math.max(0,G.money+netAfterRaces)}</span></div>
      <div style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#aaa;margin-bottom:4px">
          <span>€0</span><span>Previsión: €${Math.max(0,G.money+netAfterRaces)}</span>
        </div>
        <div style="height:6px;background:#e5e4de;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${Math.min(100,Math.round(G.money/(G.money+Math.abs(netAfterRaces)+1)*100))}%;background:#4a90d9;border-radius:3px"></div>
        </div>
        <div style="height:6px;background:transparent;border-radius:3px;margin-top:2px;overflow:hidden">
          <div style="height:100%;width:${Math.min(100,savingsPct)}%;background:${netAfterRaces>=0?'#4a8a2a':'#c0392b'};border-radius:3px"></div>
        </div>
        <div style="font-size:12px;color:#aaa;margin-top:4px">
          <span style="color:#4a90d9">■</span> Actuales &nbsp;
          <span style="color:${netAfterRaces>=0?'#4a8a2a':'#c0392b'}">■</span> ${netAfterRaces>=0?'Proyectado':'Riesgo'}
        </div>
      </div>
    </div>

    ${brandSection}

    ${netAfterRaces<0?`<div class="warn">Atención: con la configuración actual perderás €${Math.abs(netAfterRaces)} esta temporada. Considera aumentar la jornada laboral o reducir gastos.</div>`:''}
    ${netAfterRaces>=0&&netM>=0?`<div class="note">Vas bien. La temporada cierra con superávit. Puedes valorar reducir jornada laboral para entrenar más.</div>`:''}`;
}

// ── RUNNER TAB ─────────────────────────
function renderRunnerTab(){
  const el=document.getElementById('main');
  const r=G.runner;
  const specLabel=SPEC_LABEL;
  const activeSponsorList=Object.entries(G.sponsors).filter(([,v])=>v);
  const totalRaces=G.careerHistory.length;
  const wins=G.careerHistory.filter(h=>h.pos===1).length;
  const podiums=G.careerHistory.filter(h=>h.pos<=3).length;
  el.innerHTML=`
    <div class="runner-header">
      <div class="runner-avatar">🏃</div>
      <div>
        <h2 style="margin-bottom:4px">${esc(r.name||'Corredor')}</h2>
        <div style="font-size:13px;color:#888;margin-bottom:6px">${specLabel[r.specialty]} · Año ${G.year}${r.age?' · '+r.age+' años':''}</div>
        <div>
          <span class="rank-badge rank-global">Global #${G.ranking<900?G.ranking:'—'}</span>
          <span class="rank-badge rank-spec">${specLabel[r.specialty]} #${G.specRanking<900?G.specRanking:'—'}</span>
        </div>
      </div>
    </div>
    ${(()=>{const ad=agingDeg();if(ad<=0)return '';const pct=Math.round(ad*100);if(pct>=32)return `<div class="danger">El cuerpo ya no responde como antes. Cada carrera cuesta más y los geles hacen menos efecto. El monte sigue siendo tuyo, pero en tus términos.</div>`;if(pct>=16)return `<div class="warn">Con ${r.age} años el cuerpo nota el paso del tiempo. Más cansancio, recuperación más lenta, rivales que se alejan un poco más.</div>`;return `<div class="hint">A los ${r.age} años el desgaste empieza a notarse. Nada grave aún, pero el cuerpo ya no es el mismo de hace unos años.</div>`;})()}

    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px">Carga corporal</span>
        <span style="font-size:14px;font-weight:700;color:${getBodyLoad()>=70?'#c0392b':getBodyLoad()>=50?'#c07a10':'#4a8a2a'}">${getBodyLoad()}%</span>
      </div>
      <div class="load-bar-track"><div class="bar-fill" style="width:${getBodyLoad()}%;background:${getBodyLoad()>=70?'#c0392b':getBodyLoad()>=50?'#c07a10':'#4a90d9'}"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#bbb;margin-top:4px">
        <span>0%</span><span style="color:#c07a10">70% riesgo</span><span style="color:#c0392b">100% lesión</span>
      </div>
      ${getBodyLoad()>=70?`<div style="font-size:12px;color:#c0392b;margin-top:6px">⚠ Cuerpo muy cargado — riesgo de lesión elevado</div>`:
        getBodyLoad()>=50?`<div style="font-size:12px;color:#c07a10;margin-top:6px">Carga moderada — vigila el volumen de entrenamiento</div>`:
        `<div style="font-size:12px;color:#4a8a2a;margin-top:6px">✓ Carga bajo control</div>`}
    </div>

    <div class="card">
      <div class="sec-title">Stats actuales</div>
      ${G.lastRaceGains&&G.lastRaceGains.length>0?`
        <div style="background:#eaf4ea;border-radius:var(--border-radius-md);padding:9px 12px;margin-bottom:12px">
          <div style="font-size:12px;font-weight:600;color:#3B6D11;margin-bottom:5px">Ganado en la última carrera</div>
          <div style="font-size:13px;color:#27500A">${G.lastRaceGains.map(({k,v})=>'+'+v+' '+k.charAt(0).toUpperCase()+k.slice(1)).join(' &nbsp;·&nbsp; ')}</div>
        </div>`:''}
      ${Object.entries(r.stats).map(([k,v])=>{
        const eff=getEffStat(k);
        const bonus=eff-v;
        const label=k.charAt(0).toUpperCase()+k.slice(1);
        return `<div class="bar-row">
          <span class="bar-label">${label}</span>
          <div class="bar-track" style="flex:1">
            <div class="bar-fill" style="width:${Math.min(100,eff)}%;background:${eff>=70?'#4a8a2a':eff>=50?'#4a90d9':eff>=35?'#c07a10':'#c0392b'}"></div>
          </div>
          <span class="bar-pct">${Math.round(v)}${bonus>0?'<span style="font-size:12px;color:#4a8a2a"> +'+Math.round(bonus)+'</span>':''}</span>
        </div>`;}).join('')}
      <div style="font-size:12px;color:#aaa;margin-top:8px">El número en verde es el bonus de sponsors y club activos.</div>
    </div>

    <div class="card">
      <div class="sec-title">Resumen de carrera</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
        <div><div style="font-size:22px;font-weight:700">${totalRaces}</div><div style="font-size:12px;color:#aaa">Carreras</div></div>
        <div><div style="font-size:22px;font-weight:700;color:#c07a10">${wins}</div><div style="font-size:12px;color:#aaa">Victorias</div></div>
        <div><div style="font-size:22px;font-weight:700;color:#4a8a2a">${podiums}</div><div style="font-size:12px;color:#aaa">Podios</div></div>
      </div>
    </div>

    ${G.yearObjective?`<div class="card">
      <div class="sec-title">Objetivo de temporada</div>
      ${(()=>{
        const obj=checkYearObjectiveMet();
        if(!obj)return '';
        const pct=Math.min(100,Math.round((obj.actual/obj.target)*100));
        const color=obj.met?'#4a8a2a':'#c07a10';
        return `<div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:13px;font-weight:600">${obj.label}</span>
            <span style="font-size:12px;color:#aaa">${obj.actual}/${obj.target}</span>
          </div>
          <div style="height:6px;background:#e5e4de;border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width .3s"></div>
          </div>
          ${obj.met?`<div style="font-size:12px;color:#4a8a2a;font-weight:600;margin-top:6px">✓ Cumplido · +€${obj.reward}</div>`:`<div style="font-size:12px;color:#c07a10;margin-top:6px">En progreso...</div>`}
        </div>`;
      })()}
    </div>`:''}

    ${G.careerHistory.length>0?`<div class="card">
      <div class="sec-title">Evolución ranking</div>
      ${renderRankingChart()}
    </div>`:''}

    <div class="card">
      <div class="sec-title">Proyección ahorros</div>
      ${renderSavingsChart()}
    </div>

    ${(()=>{
      const RARITY={easy:{c:'#4a8a2a',bg:'#eaf4ea',l:'Fácil'},medium:{c:'#4a90d9',bg:'#e8f0fb',l:'Medio'},hard:{c:'#c07a10',bg:'#fdf0e0',l:'Difícil'},legendary:{c:'#8b2252',bg:'#f8e8f2',l:'Legendario'}};
      const rb=a=>{const r=RARITY[a.rarity]||{c:'#888',bg:'#eee',l:''};return`<span style="font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;background:${r.bg};color:${r.c}">${r.l}</span>`;};
      const DIFF_LABEL={facil:'🟢',medio:'🟡',dificil:'🔴',hardcore:'💀',expres:'⚡',canicross:'🐕'};
      const meta=G.achievementMeta||{};
      const unlocked=G.unlockedAchievements||[];
      const normalAchs=ACHIEVEMENTS.filter(a=>!a.mode);
      const unlockedNormal=normalAchs.filter(a=>unlocked.includes(a.id));
      const pendingNormal=normalAchs.filter(a=>!unlocked.includes(a.id));
      const recent=unlockedNormal.slice(-3).reverse();
      return`
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${recent.length>0?'10px':'0'}">
        <div class="sec-title" style="margin-bottom:0">Logros (${unlockedNormal.length}/${normalAchs.length})</div>
        <button class="secondary" style="font-size:11px;padding:3px 10px" onclick="G.screen='achievements';render()">Ver todos →</button>
      </div>
      ${recent.map(ach=>`<div style="padding:7px 0;border-bottom:1px solid #f0ede8;display:flex;align-items:center;gap:8px">
        <span style="font-size:15px">🏆</span>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:1px"><span style="font-size:13px;font-weight:600">${esc(ach.label)}</span>${rb(ach)}${meta[ach.id]?`<span style="font-size:11px;color:#aaa">${DIFF_LABEL[meta[ach.id].difficulty]||''}</span>`:''}</div>
          <div style="font-size:12px;color:#888">${esc(ach.desc)}</div>
        </div>
      </div>`).join('')}
      ${pendingNormal.length>0?`<div style="padding:7px 0;opacity:0.5;display:flex;align-items:center;gap:8px">
        <span style="font-size:15px;opacity:0.4">🔒</span>
        <div style="font-size:12px;color:#aaa">Siguiente: <strong>${esc(pendingNormal[0].label)}</strong> — ${esc(pendingNormal[0].desc)}</div>
      </div>`:''}
    </div>`;
    })()}

    ${activeSponsorList.length>0?`<div class="card">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Contratos activos</div>
      ${activeSponsorList.map(([cat,sp])=>{
        const met=checkSponsorObjective(sp);
        const penalty=Math.round(sp.salary*(sp.penaltyPct||0.15));
        const tierColor=TIER_COLOR_SPONSOR;
        const tierLabel=TIER_LABEL_SPONSOR;
        return `<div style="padding:10px 0;border-bottom:1px solid #f0ede8">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                <span style="font-weight:600;font-size:14px">${sp.name}</span>
                <span style="font-size:12px;font-weight:600;padding:1px 6px;border-radius:4px;background:${tierColor[sp.tier]||'#888'}22;color:${tierColor[sp.tier]||'#888'}">${tierLabel[sp.tier]||''}</span>
              </div>
              <div style="font-size:12px;color:#888">${sp.bonus}</div>
            </div>
            <div class="right-col">
              <div style="font-size:13px;font-weight:600;color:#2d7a2d">+€${sp.salary}/año</div>
              <div style="font-size:12px;color:#aaa">${sp.duration} temp. restante${sp.duration!==1?'s':''}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:6px;background:${met?'#eaf4ea':'#fff8f0'}">
            <div style="flex:1">
              <div style="font-size:12px;font-weight:600;color:${met?'#2d5a2d':'#7a3a10'}">${met?'✓ Objetivo cumplido':'⚠ Objetivo pendiente'}</div>
              <div style="font-size:12px;color:${met?'#4a8a2a':'#888'};margin-top:1px">${sp.objective}</div>
            </div>
            ${!met?`<div style="font-size:12px;color:#c0392b;font-weight:600;flex-shrink:0;margin-left:8px;margin-right:8px">-€${penalty} si falla</div>`:''}
            <button class="secondary" style="font-size:11px;padding:3px 8px;flex-shrink:0;color:#c0392b;border-color:#c0392b;background:#fff8f0" onclick="breakSponsorContract('${cat}')">Romper</button>
          </div>
        </div>`;}).join('')}
    </div>`:''}

    ${G.sponsorPenalties&&G.sponsorPenalties.length>0?`<div class="card" style="border-color:#f5b8b8">
      <div style="font-size:12px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Penalizaciones pendientes</div>
      ${G.sponsorPenalties.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #fef0f0">
        <div style="font-size:13px;color:var(--color-text-primary)">${p.name}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;font-weight:600;color:#c0392b">-€${p.amount}</span>
          <button class="secondary" style="font-size:12px;padding:3px 10px" onclick="payPenalty('${p.id}')">Pagar</button>
        </div>
      </div>`).join('')}
    </div>`:''}

    ${G.club&&G.club.id!=='none'?(()=>{
      const rep=G.clubReputation||0;
      const repInfo=clubRepLabel();
      const companion=G.clubCompanion;
      const bonuses=Object.entries(G.club.statBonus).map(([k,v])=>`+${v} ${k.charAt(0).toUpperCase()+k.slice(1)}`).join(', ');
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px">Tu club</div>
          <span style="font-size:12px;color:#4a90d9;cursor:pointer" onclick="G._clubFromBetween=false;G.screen='clubSetup';render()">Cambiar →</span>
        </div>
        <div class="card-title">${G.club.name}</div>
        <div class="card-sub">${G.club.desc}</div>
        ${bonuses?`<div style="font-size:12px;color:#4a8a2a;margin-top:4px">${bonuses}</div>`:''}
        ${companion?`<div style="font-size:12px;color:#888;margin-top:4px">Compañero: <strong>${companion}</strong></div>`:''}
        <div style="margin-top:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:12px;color:#888">Reputación en el club</span>
            <span style="font-size:13px;font-weight:700;color:${repInfo.color}">${repInfo.text}</span>
          </div>
          <div class="load-bar-track"><div class="bar-fill" style="width:${rep}%;background:${rep>=60?'#c07a10':rep>=30?'#4a90d9':'#bbb'}"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#bbb;margin-top:3px">
            <span>0</span><span style="color:#4a8a2a">75 → Copa Clubes 🏆</span><span>100</span>
          </div>
        </div>
      </div>`;
    })():`<div class="card" style="text-align:center;padding:16px">
      <div style="font-size:13px;color:#aaa;margin-bottom:8px">Sin club — corriendo como independiente</div>
      <span style="font-size:13px;color:#4a90d9;cursor:pointer" onclick="G._clubFromBetween=false;G.screen='clubSetup';render()">Unirse a un club →</span>
    </div>`}

    ${G.careerHistory.length>0?`<div class="card">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Historial de carreras</div>
      ${G.careerHistory.slice().reverse().slice(0,10).map(h=>`<div class="history-row">
        <div>
          <div style="font-weight:500">${h.name}</div>
          <div style="font-size:12px;color:#aaa;margin-top:1px">Año ${h.year} · ${fmt(h.time)}</div>
          ${h.catPos&&h.catTotal>1?`<div style="margin-top:3px"><span style="font-size:11px;background:#e8eef8;color:#2d4fa0;border-radius:4px;padding:1px 6px;font-weight:600">${h.catName} ${h.catPos}º</span></div>`:''}
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:700;color:${h.pos===1?'#c07a10':h.pos<=3?'#4a8a2a':'#888'}">${h.pos}º</div>
          ${h.prize>0?`<div style="font-size:12px;color:#2d7a2d">+€${h.prize}</div>`:''}
        </div>
      </div>`).join('')}
    </div>`:`<div style="text-align:center;font-size:13px;color:#aaa;padding:20px 0">Sin carreras completadas todavía.</div>`}
    ${(G.seasonDiary||[]).length>0?`<div class="card" style="margin-top:4px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">📓 Diario del corredor</div>
      ${G.seasonDiary.slice().reverse().slice(0,5).map(e=>`<div style="padding:9px 0;border-bottom:1px solid #f0ede8">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:12px;font-weight:600;color:#888">Año ${e.year} · ${e.age} años</span>
          <span style="font-size:12px;color:#c07a10;font-weight:600">${e.highlight}</span>
        </div>
        <div style="font-size:13px;color:#555;line-height:1.6">${esc(e.text||'')}</div>
      </div>`).join('')}
    </div>`:''}`;
}

// ── INTRO ──────────────────────────────
// ── MODE SELECT ────────────────────────
// ══════════════════════════════════════
//  SISTEMA DE GUARDADO
// ══════════════════════════════════════

// ── SAVE SCREEN ────────────────────────
function renderSaveScreen(){
  const el=document.getElementById('main');
  const slots=getAllSlots();
  const autoData=loadFromSlot('auto');
  el.innerHTML=`
    <h1>Juego Trail</h1>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:11px;font-weight:700;color:#aaa;letter-spacing:.5px">v${GAME_BUILD}</span></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <p class="sub" style="margin-bottom:0;flex:1">Partidas guardadas</p>
      <button onclick="G._achPrev='saveScreen';G.screen='achievements';render()" style="display:flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid #ddd;border-radius:20px;background:#fff;font-size:12px;font-weight:600;color:#888;cursor:pointer;transition:background .15s" onmouseenter="this.style.background='#f5f4f0'" onmouseleave="this.style.background='#fff'">🏅 Logros</button>
      <button onclick="showTutorial()" style="display:flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid #ddd;border-radius:20px;background:#fff;font-size:12px;font-weight:600;color:#888;cursor:pointer;transition:background .15s" onmouseenter="this.style.background='#f5f4f0'" onmouseleave="this.style.background='#fff'">📖 Tutorial</button>
    </div>

    ${slots.map(({slot,data})=>{
      const lbl=slotLabel(data);
      if(!lbl) return `<div class="save-slot empty">
        <div class="flex-between-center">
          <div>
            <div class="save-slot-name" style="color:#aaa">Ranura ${slot+1} — vacía</div>
          </div>
          <button class="save-btn primary" onclick="startNewInSlot(${slot})">Nueva partida</button>
        </div>
      </div>`;
      return `<div class="save-slot">
        <div class="flex-between">
          <div class="save-slot-info">
            <div class="save-slot-name">${lbl.runName?`"${esc(lbl.runName)}"`:lbl.name}</div>
            <div class="save-slot-meta">${lbl.runName?esc(lbl.name)+' · ':''}Año ${lbl.year} · Global ${lbl.ranking} · ${lbl.spec} ${lbl.specRanking}</div>
            <div class="save-slot-meta" style="margin-top:2px">${lbl.mode}${lbl.phase?` · <span style="color:#534AB7;font-weight:500">${lbl.phase}</span>`:''}${lbl.totalKm?' · '+lbl.totalKm+'km':''} · ${lbl.date}</div>
          </div>
        </div>
        <div class="save-btns">
          <button class="save-btn primary" onclick="loadSlot(${slot})">Cargar</button>
          <button class="save-btn" onclick="saveCurrentToSlot(${slot})">Sobreescribir</button>
          <button class="save-btn" onclick="exportSlotToClipboard(${slot})">Exportar</button>
          <button class="save-btn danger" onclick="confirmDeleteSlot(${slot})">Borrar</button>
        </div>
      </div>`;
    }).join('')}

    <div style="border-top:1px solid #e8e6e0;margin-top:16px;padding-top:16px">
      <div style="font-size:13px;font-weight:600;color:#888;margin-bottom:8px">Importar partida</div>
      <div style="font-size:12px;color:#aaa;margin-bottom:8px">Pega aquí el texto exportado y elige en qué ranura guardarla</div>
      <div style="font-size:11px;color:#b8a88a;background:#fdf8f2;
  border:1px solid #e8dfc8;border-radius:6px;padding:8px 10px;
  margin-bottom:10px">
        💡 <strong>Consejo:</strong> Para que las partidas persistan
    entre actualizaciones, guarda el archivo siempre como
    <code style="background:#f0e8d8;padding:1px 4px;
    border-radius:3px">juego_trail.html</code> (sin número de
    versión). El navegador vincula los guardados al nombre
    del archivo.
      </div>
      <textarea class="import-area" id="import-txt" placeholder="Pega aquí el texto TRAIL_SAVE_V2::..."></textarea>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        ${slots.map(({slot})=>`<button class="save-btn" onclick="doImport(${slot})">→ Ranura ${slot+1}</button>`).join('')}
      </div>
    </div>

    <button class="main" style="margin-top:20px" onclick="G.screen='modeSelect';render()">← Volver</button>`;
}

window.loadSlot=slot=>{
  try{
    const data=loadFromSlot(slot);
    if(!data||!data.state){alert('Ranura vacía o no se pudo leer.');return;}
    const savedBuild=data.state._build||0;
    Object.assign(G,freshState(),data.state);
    G._saveSlot=slot;
    if(G.carreraVida&&G.lifecyclePhase==='overlap'&&G.lifeAthlete){
      G.screen='overlapHub';
    }
    render();
    if(savedBuild>0&&savedBuild<GAME_BUILD){
      setTimeout(()=>showToast(`Partida de v${savedBuild} actualizada a v${GAME_BUILD} ✓`,'#4a90d9'),300);
    } else if(savedBuild===0){
      setTimeout(()=>showToast('Partida antigua cargada — datos actualizados automáticamente ✓','#4a90d9'),300);
    }
  }catch(err){
    console.error('[loadSlot] Error al cargar ranura',slot,err);
    alert('Error inesperado al cargar la partida. Prueba a importar desde texto.');
  }
};
window.saveCurrentToSlot=slot=>{
  if(RACE_SCREENS.includes(G.screen)){alert('No puedes guardar durante una carrera. Termina o abandona primero.');return;}
  if(G.screen==='modeSelect'||G.screen==='saveScreen'){alert('Inicia una partida primero.');return;}
  if(saveToSlot(slot)){
    alert(`✓ Partida guardada en ranura ${slot+1}.`);render();
  }else alert('Error al guardar.');
};
window.startNewInSlot=slot=>{
  Object.assign(G,freshState());
  G._saveSlot=slot;
  G.screen='modeSelect';
  render();
};
window.confirmDeleteSlot=slot=>{
  if(confirm(`¿Borrar la partida de la ranura ${slot+1}? Esta acción no se puede deshacer.`)){
    deleteSlot(slot);render();
  }
};
window.doImport=(slot)=>{
  const txt=document.getElementById('import-txt')?.value||'';
  if(!txt.trim()){alert('Pega primero el texto de la partida.');return;}
  if(importFromText(txt,slot)){
    alert(`✓ Partida importada en ranura ${slot+1}.`);
    document.getElementById('import-txt').value='';
    render();
  } else alert('Texto no válido. Asegúrate de copiar el texto completo.');
};

// ══════════════════════════════════════════════════════════════════
//  EXPRESS MODE SCREENS
// ══════════════════════════════════════════════════════════════════

function renderExpresSeasonStart(){
  const el=document.getElementById('main');
  const showObjectives=G.year===1&&!G.yearObjective;
  el.innerHTML=`
    <div style="background:#fef9ec;border:1.5px solid #f0d98a;border-radius:14px;padding:14px 16px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px;font-weight:700;color:#8a4a00">⚡ CARRERA EXPRÉS</span>
        <span style="font-size:13px;font-weight:700;color:#c07a10">Temporada ${G.year}/3</span>
      </div>
      <div style="display:flex;gap:4px;margin-top:6px">
        ${[1,2,3].map(y=>`<div style="flex:1;height:5px;border-radius:3px;background:${G.year>y?'#c07a10':G.year===y?'#f0d98a':'#e0dfd8'}"></div>`).join('')}
      </div>
    </div>
    <h2>${esc(G.runner.name||'Corredor')}</h2>
    <p class="sub">${G.runner.specialty} · ${G.runner.age||25} años · ${G.ranking<900?'Ranking #'+G.ranking:'Sin ranking'}</p>
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat"><div class="stat-label">Ahorros</div><div class="stat-val">€${G.money}</div></div>
      <div class="stat"><div class="stat-label">Carga corporal</div><div class="stat-val" style="color:${getBodyLoad()>=70?'#c0392b':getBodyLoad()>=50?'#c07a10':'#2d7a2d'}">${getBodyLoad()}%</div></div>
      <div class="stat"><div class="stat-label">Carreras</div><div class="stat-val">${G.raceResults?.length||0} hechas</div></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="sec-title-sm">Stats del corredor</div>
      ${Object.entries(G.runner.stats).map(([k,v])=>srow(k.charAt(0).toUpperCase()+k.slice(1),v)).join('')}
    </div>
    ${showObjectives?`
    <div style="font-size:13px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Objetivo de temporada</div>
    ${SEASON_OBJECTIVES.map(obj=>`<div class="work-card" style="margin-bottom:8px" onclick="selectYearObjective('${obj.id}')">
      <div style="flex:1"><div class="card-title">${obj.label}</div><div class="card-sub">${obj.desc}</div></div>
      <div style="font-size:12px;color:#4a8a2a;font-weight:600;margin-left:10px">+€${obj.reward}</div>
    </div>`).join('')}
    `:G.yearObjective?`<div class="note">🎯 Objetivo: ${SEASON_OBJECTIVES.find(o=>o.id===G.yearObjective)?.label||'—'}</div>`:''}
    <button class="main" onclick="G.screen='expresCalendar';render()">Elegir carreras →</button>`;
}

function renderExpresCalendar(){
  const el=document.getElementById('main');
  const selIds=G.selectedRaces.map(r=>r.id);
  const canAccess=r=>r.zegamaSpecial?(G.ranking<=20||G.zegamaQual):(r.reqRanking>=G.ranking||r.reqRanking===999);
  const allRaces=[...RACES_DB,...getSpecRaces()];
  const tierColor=TIER_COLOR_RACE;
  const MAX=5;

  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <h2>Elige 5 carreras</h2>
      <span style="font-size:13px;font-weight:700;color:${selIds.length>=MAX?'#2d7a2d':'#c07a10'}">${selIds.length}/${MAX}</span>
    </div>
    <p class="sub">Temporada ${G.year}/3 · elige 5 carreras · sin coste de inscripción</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      ${allRaces.map(r=>{
        const sel=selIds.includes(r.id);
        const locked=!canAccess(r);
        const full=!sel&&selIds.length>=MAX;
        const zegamaBadge=r.zegamaSpecial&&!locked&&G.zegamaQual?'<div style="font-size:10px;color:#4a8a2a;margin-top:2px">✓ Clasificado por tiempo</div>':r.zegamaSpecial&&!locked&&G.ranking<=20?'<div style="font-size:10px;color:#c07a10;margin-top:2px">✓ Invitación por ranking</div>':'';

        return `<div style="background:#fff;border:1.5px solid ${sel?'#4a8a2a':locked?'#eee':'#e0dfd8'};border-radius:10px;padding:10px 12px;cursor:${locked||full?'default':'pointer'};opacity:${locked||(!sel&&full)?0.45:1};transition:background .15s" onclick="${locked||full?'':'window.toggleExpresRace(\''+r.id+'\')'}" >
          <div style="font-size:13px;font-weight:600;margin-bottom:3px;line-height:1.3">${sel?'✓ ':''}<span style="color:${tierColor[r.tier]||'#888'}">${r.name}</span></div>
          <div style="font-size:12px;color:#888">${r.km}km · ${r.type}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px">${r.monthName}</div>
          ${locked?(r.zegamaSpecial?`<div style="font-size:11px;color:#c07a10;margin-top:3px">🏔️ Invitación — Top 20 o clasificado por tiempo</div>`:`<div style="font-size:11px;color:#ccc;margin-top:3px">🔒 Ranking #${r.reqRanking}</div>`):''}
        </div>`;
      }).join('')}
    </div>
    <button class="main" onclick="G.screen='expresSponsors';render()" ${selIds.length<MAX?'disabled':''}>Continuar →</button>
    <button class="main" style="margin-top:6px" onclick="G.screen='expresSeasonStart';render()">← Volver</button>`;
}

window.toggleExpresRace=id=>{
  const all=[...RACES_DB,...getSpecRaces()];
  const race=all.find(r=>r.id===id);if(!race)return;
  const idx=G.selectedRaces.findIndex(r=>r.id===id);
  if(idx>=0){G.selectedRaces.splice(idx,1);}
  else if(G.selectedRaces.length<5){G.selectedRaces.push({...race});}
  render();
};

function renderExpresSponsors(){
  const el=document.getElementById('main');
  if(!G._expressSponsorPool){G._expressSponsorPool=getExpressSponsors();}
  const pool=G._expressSponsorPool;
  const curSponsors=Object.values(G.sponsors).filter(Boolean);

  el.innerHTML=`
    <h2>Patrocinador de temporada</h2>
    <p class="sub">Temporada ${G.year}/3 · elige uno o sigue sin patrocinador</p>
    ${curSponsors.length>0?`<div class="note">Ya tienes patrocinador activo — puedes cambiarlo o continuar.</div>`:''}
    <div style="display:grid;gap:10px;margin-bottom:14px">
      ${pool.map(sp=>{
        const isCur=Object.values(G.sponsors).some(s=>s?.id===sp.id);
        return `<div class="sponsor-card ${isCur?'active':''}" onclick="selectExpressSponsor('${sp.id}','${sp.cat}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700;margin-bottom:2px">${sp.name}${isCur?' ✓':''}</div>
              <div style="font-size:12px;color:#888;margin-bottom:6px">${sp.bonus}</div>
              <div style="font-size:12px;color:#4a8a2a">+${Object.entries(sp.statBonus).map(([k,v])=>v+' '+k.charAt(0).toUpperCase()+k.slice(1)).join(', ')}</div>
              <div style="font-size:12px;color:#555;margin-top:3px">🎯 ${sp.objective}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:12px">
              <div style="font-size:16px;font-weight:700;color:#2d7a2d">+€${sp.salary}</div>
              <div style="font-size:11px;color:#aaa">/año</div>
            </div>
          </div>
        </div>`;
      }).join('')}
      <div class="sponsor-card" onclick="G._expressSponsorPool=null;G.screen='expresPrep';render()" style="text-align:center;color:#888">
        <div style="font-size:14px">Sin patrocinador esta temporada</div>
      </div>
    </div>`;
}

window.selectExpressSponsor=(spId,cat)=>{
  const sp=SPONSORS_DB.find(s=>s.id===spId);if(!sp)return;
  // Remove any existing sponsor in same cat
  G.sponsors[cat]=null;
  G.sponsors[cat]={...sp,duration:1};
  // Apply stat bonus
  Object.entries(sp.statBonus).forEach(([k,v])=>{G.runner.stats[k]=Math.min(100,(G.runner.stats[k]||50)+v);});
  G._expressSponsorPool=null;
  G.screen='expresPrep';render();
};

function renderExpresPrep(){
  const el=document.getElementById('main');
  const nextRace=G.selectedRaces[G.currentRaceIdx];
  const load=getBodyLoad();
  const hint=bodyLoadHint();
  const racesLeft=G.selectedRaces.length-G.currentRaceIdx;

  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <h2>Preparación</h2>
      <span style="font-size:12px;color:#aaa">${racesLeft} carrera${racesLeft!==1?'s':''} restante${racesLeft!==1?'s':''}</span>
    </div>
    <p class="sub">${nextRace?'Próxima: <strong>'+nextRace.name+'</strong> · '+nextRace.km+'km':'Última carrera de la temporada'}</p>
    ${hint?`<div class="${hint.type}">${hint.msg}</div>`:''}
    <div style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:4px">
        <span>Carga corporal</span><span style="font-weight:600;color:${load>=70?'#c0392b':load>=50?'#c07a10':'#2d7a2d'}">${load}%</span>
      </div>
      ${hbar(load,100,load>=70?'#c0392b':load>=50?'#c07a10':'#4a90d9')}
    </div>
    <div style="font-size:12px;color:#888;margin:14px 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">¿Cómo preparas la carrera?</div>
    <div style="display:grid;gap:8px;margin-bottom:16px">
      <div class="work-card" onclick="doExpresPrep('train')">
        <div style="font-size:24px;margin-bottom:4px">🏃</div>
        <div class="card-title">Entrenamiento intenso</div>
        <div class="card-sub">Subes el bloque al máximo. El cuerpo lo nota pero llegas más fuerte.</div>
        <div style="display:flex;gap:12px;font-size:12px;margin-top:6px">
          <span style="color:#4a8a2a">+6 stat principal</span>
          <span style="color:#c0392b">Carga +${load>=70?'12 ⚠':'12'}</span>
        </div>
      </div>
      <div class="work-card" onclick="doExpresPrep('rest')">
        <div style="font-size:24px;margin-bottom:4px">🛌</div>
        <div class="card-title">Descanso activo</div>
        <div class="card-sub">Rodaje suave, estiramientos, recuperación completa.</div>
        <div style="display:flex;gap:12px;font-size:12px;margin-top:6px">
          <span style="color:#4a8a2a">+3 Mental · Carga -14</span>
        </div>
      </div>
      <div class="work-card" onclick="doExpresPrep('focus')">
        <div style="font-size:24px;margin-bottom:4px">🎯</div>
        <div class="card-title">Foco mental</div>
        <div class="card-sub">Visualización de ruta, trabajo táctico, análisis de rivales.</div>
        <div style="display:flex;gap:12px;font-size:12px;margin-top:6px">
          <span style="color:#4a8a2a">+5 Mental · Carga -4</span>
        </div>
      </div>
    </div>`;
}

window.doExpresPrep=choice=>{
  const stat=G.runner.stats;
  const spec=G.runner.specialty;
  if(choice==='train'){
    // Boost main specialty stat
    const mainStat={fondista:'resistencia',montanero:'subida',tecnico:'bajada',todoterreno:'resistencia'}[spec]||'resistencia';
    stat[mainStat]=Math.min(100,(stat[mainStat]||50)+6);
    G.bodyLoad=Math.min(100,(G.bodyLoad||0)+12);
    showToast('🏃 Entrenado — +6 '+mainStat.charAt(0).toUpperCase()+mainStat.slice(1),'#4a90d9');
  } else if(choice==='rest'){
    stat.mental=Math.min(100,(stat.mental||50)+3);
    G.bodyLoad=Math.max(0,(G.bodyLoad||0)-14);
    showToast('🛌 Descansado — +3 Mental · Carga -14','#2d7a2d');
  } else {
    stat.mental=Math.min(100,(stat.mental||50)+5);
    G.bodyLoad=Math.max(0,(G.bodyLoad||0)-4);
    showToast('🎯 Foco mental — +5 Mental · Carga -4','#4a8a2a');
  }
  // Go to simplified pre-race prep
  G.preRaceNutrition='pasta';G.dropbagItems=[];G.dropbagUsed=[];G.dropbagShown=false;
  G._raceInitialized=false;G._warmupApplied=false;G._recoveryUsed=false;
  G.redZoneStreak=0;G.redZoneMax=0;
  G.dayConditionGenerated=false;G.dayCondition=null;G.raceDayCondition=null;
  G.gelsCarried=0;G.gelsUsed=0;G.warmedUp=false;G.startStrategy=null;
  G.screen='expresPreRacePrep';render();
};

function renderExpresPreRacePrep(){
  const el=document.getElementById('main');
  const race=G.selectedRaces[G.currentRaceIdx];
  if(!race){G.screen='preRace';render();return;}
  const altPenalty=getAltitudePenalty(race);
  const sel=G.preRaceNutrition||'pasta';

  el.innerHTML=`
    <div style="font-size:12px;font-weight:700;color:#c07a10;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">⚡ EXPRÉS · Carrera ${G.currentRaceIdx+1}/${G.selectedRaces.length}</div>
    <h2>${race.name}</h2>
    <p class="sub">${race.km}km · ${race.type} · ${race.monthName}</p>
    ${altPenalty>0?`<div class="warn">⚠ Alta altitud — irás un ${Math.round(altPenalty*100)}% más lento en subidas sin preparación específica.</div>`:''}
    ${G.injuryType?`<div class="danger">⚠ Llegas con ${INJURY_TYPES[G.injuryType]?.label||'lesión'}. Energía y piernas reducidas.</div>`:''}
    <div class="section-label">Cena previa</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      ${PRE_RACE_NUTRITION.slice(0,2).map(n=>{
        const isSel=sel===n.id;
        const cost=getNutritionCost(n.id);
        return `<div style="background:#fff;border:1.5px solid ${isSel?'#4a8a2a':'#e0dfd8'};border-radius:10px;padding:12px;cursor:pointer;transition:background .15s" onclick="G.preRaceNutrition='${n.id}';render()">
          <div style="font-size:13px;font-weight:600;margin-bottom:3px">${isSel?'✓ ':''} ${n.label}</div>
          <div style="font-size:12px;color:#888">${n.desc}</div>
          <div style="font-size:12px;color:${n.energyBonus>0?'#4a8a2a':'#c07a10'};margin-top:4px">${n.energyBonus>0?'+'+n.energyBonus+' energía':n.energyBonus+' energía'}${cost>0?' · -€'+cost:''}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="section-label">Estrategia de salida</div>
    <div style="display:grid;gap:8px;margin-bottom:16px">
      ${[
        {id:'conservador',label:'Conservador 🐢',desc:'Primeros tramos lentos, últimos con reservas',energyMod:5,legsMod:3,timeMod:1.06},
        {id:'equilibrado',label:'Equilibrado ⚖',desc:'Ritmo constante desde el principio',energyMod:0,legsMod:0,timeMod:1.0},
        {id:'a_tope',label:'A tope 🔥',desc:'Máxima velocidad desde el km 1 — riesgo real',energyMod:-8,legsMod:-6,timeMod:0.94},
      ].map(s=>{
        const isSel=(G.startStrategy||'equilibrado')===s.id;
        return `<div style="background:#fff;border:1.5px solid ${isSel?'#4a8a2a':'#e0dfd8'};border-radius:10px;padding:10px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="G.startStrategy='${s.id}';render()">
          <div><div style="font-size:13px;font-weight:600">${isSel?'✓ ':''} ${s.label}</div><div style="font-size:12px;color:#888">${s.desc}</div></div>
        </div>`;
      }).join('')}
    </div>
    <button class="main" onclick="G.screen='preRace';render()">Salir a correr →</button>`;
}

function renderExpresSeasonBalance(){
  const el=document.getElementById('main');
  const sponsorIncome=sponsorAnnual();
  const raceIncome=G.raceResults.reduce((a,r)=>a+r.prize,0);
  const yearNet=sponsorIncome+raceIncome;

  el.innerHTML=`
    <div style="background:#fef9ec;border:1.5px solid #f0d98a;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:13px;font-weight:700;color:#8a4a00">⚡ Temporada ${G.year}/3 completada</span>
      ${G.year>=3?'<span style="font-size:12px;color:#c07a10;font-weight:600">Última temporada 🏁</span>':''}
    </div>
    <h2>Balance de temporada</h2>
    <p class="sub">${esc(G.runner.name||'Corredor')} · Ranking #${G.ranking<900?G.ranking:'—'}</p>
    <div style="margin-bottom:16px">
      ${G.raceResults.length===0?'<p style="font-size:13px;color:#aaa">Sin carreras completadas.</p>':
        G.raceResults.map(r=>{
          if(r.injured)return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0ede8;font-size:14px">
            <div><span style="color:#c0392b;margin-right:8px">❌</span>${r.name}</div>
            <span style="font-size:12px;color:#c0392b">Baja por lesión</span></div>`;
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0ede8;font-size:14px">
            <div><span style="font-weight:700;color:${r.pos===1?'#c07a10':r.pos<=3?'#4a8a2a':'#888'};margin-right:8px">${r.pos}º</span>${r.name}</div>
            <span style="font-size:13px;color:#2d7a2d">+€${r.prize}</span></div>`;
        }).join('')}
    </div>
    <div class="card" style="margin-bottom:14px">
      <table class="eco-table">
        ${sponsorIncome>0?`<tr><td>Patrocinios</td><td class="right plus">+€${sponsorIncome}</td></tr>`:''}
        ${raceIncome>0?`<tr><td>Premios de carrera</td><td class="right plus">+€${raceIncome}</td></tr>`:''}
        ${(G.sponsorPenalties||[]).filter(p=>p.year===G.year).reduce((a,p)=>a+p.amount,0)>0?`<tr><td>Penalizaciones sponsor</td><td class="right minus">-€${G.sponsorPenalties.filter(p=>p.year===G.year).reduce((a,p)=>a+p.amount,0)}</td></tr>`:''}
        <tr><td>Resultado del año</td><td class="right ${yearNet>=0?'plus':'minus'}">${yearNet>=0?'+':''}€${yearNet}</td></tr>
      </table>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="sec-title-sm">Stats finales</div>
      ${Object.entries(G.runner.stats).map(([k,v])=>srow(k.charAt(0).toUpperCase()+k.slice(1),v)).join('')}
    </div>
    <button class="main" onclick="doNextYear(${yearNet})">${G.year>=3?'Ver resumen de carrera →':'Temporada '+(G.year+1)+' →'}</button>
    ${G.year>=2?`<button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b" onclick="doRetire()">Retiro anticipado — ver resumen</button>`:''}`;
}

function renderModeSelect(){
  const el=document.getElementById('main');
  const modeColors={
    facil:    {bg:'#f2faf0', border:'#8cc88c', tick:'#2d7a2d',  iconBg:'#e0f2e0'},
    medio:    {bg:'#fef9ec', border:'#e8c97a', tick:'#c07a10',  iconBg:'#fef3d0'},
    dificil:  {bg:'#fff0ee', border:'#e8a0a0', tick:'#c0392b',  iconBg:'#fde0de'},
    hardcore: {bg:'#eeece8', border:'#aaaaaa', tick:'#555555',  iconBg:'#e4e2dc'},
  };
  const modes=[
    {id:'facil',    icon:'🟢', label:'Fácil',    desc:'Rivales accesibles · sin penalizaciones duras · para descubrir el juego'},
    {id:'medio',    icon:'🟡', label:'Medio',    desc:'Lesiones frecuentes · economía ajustada · el modo base actual'},
    {id:'dificil',  icon:'🔴', label:'Difícil',  desc:'Errores tienen consecuencias · sponsors exigentes · élite inalcanzable'},
    {id:'hardcore', icon:'💀', label:'Hardcore', desc:'Material importa · fractura = temporada perdida · sin red de seguridad'},
  ];
  const otherModes=[
    {id:'expres',        icon:'⚡',  label:'Carrera Exprés',  desc:'3 temporadas · sin jornada laboral · ganancias ×1.5', available:true,  lockable:false},
    {id:'infinite_prog', icon:'📈',  label:'Modo infinito',   desc:'Dificultad progresiva · sin techo · próximamente',   available:false, lockable:false},
    {id:'ultratrail',    icon:'🏔️',  label:'Modo Ultratrail', desc:'80K mínimo · mochila · cutoffs reales · Backyard · MdS · UTMB', available:true,  lockable:false},
    {id:'coach',         icon:'📋',  label:'Entrenador',      desc:'Lleva un atleta ajeno · honorarios + bonus',          available:true,  lockable:true},
    {id:'club',          icon:'🏕️', label:'Club',            desc:'Gestiona un club · plantilla · presupuesto',          available:true,  lockable:true},
    {id:'canicross',     icon:'🐕',  label:'Canicross',       desc:'Corres con tu perro · vínculo · carreras reales españolas', available:true, lockable:false},
  ];
  // Leer desbloqueos del localStorage
  let unlocked={coach:false,club:false};
  try{Object.assign(unlocked,JSON.parse(LS.get('unlocked')||'{}'));}catch(e){}

  const sel=G.gameMode||'medio';
  el.innerHTML=`
    <h1>Monte Perdido Trail</h1>
    <p class="sub">Elige tu modo de juego</p>

    <div class="carrera-group" style="${modeColors[sel]?`border-color:${modeColors[sel].border};`:''}">
      <div class="carrera-group-header" onclick="toggleModeGroup()" style="${modeColors[sel]?`background:${modeColors[sel].bg};`:''}">
        <div style="width:36px;height:36px;border-radius:8px;background:${modeColors[sel]?modeColors[sel].iconBg:'#EAF3DE'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">🏃</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:600;color:var(--color-text-primary)">Modo carrera</div>
          <div style="font-size:12px;color:var(--color-text-secondary)">${modeColors[sel]?`<span style="font-weight:600;color:${modeColors[sel].tick}">${modes.find(m=>m.id===sel)?.label||''}</span> · `:''}Gestión completa · 4 niveles de dificultad</div>
        </div>
        <span id="modegroup-arrow" style="font-size:12px;color:${modeColors[sel]?modeColors[sel].tick:'var(--color-text-tertiary)'};transition:transform .2s;display:inline-block">▶</span>
      </div>
      <div class="carrera-group-content" id="modegroup-content">
        ${modes.map(m=>{
          const isSel=sel===m.id;
          const mc=modeColors[m.id]||{};
          const cardStyle=isSel?`background:${mc.bg};border:1.5px solid ${mc.border};`:'';
          const iconStyle=isSel?`background:${mc.iconBg};border:0.5px solid ${mc.border};`:'background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);';
          return `
          <div class="diff-card" style="${cardStyle}" onclick="selectMode('${m.id}')">
            <div style="width:30px;height:30px;border-radius:6px;${iconStyle}display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${m.icon}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:${isSel?'600':'400'};color:var(--color-text-primary)">${m.label}</div>
              <div style="font-size:12px;color:var(--color-text-secondary)">${m.desc}</div>
            </div>
            ${isSel?`<span style="font-size:14px;font-weight:700;color:${mc.tick}">✓</span>`:''}
          </div>`;}).join('')}
      </div>
    </div>

    <div style="font-size:12px;font-weight:500;color:var(--color-text-tertiary);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;margin-top:16px">Otros modos</div>
    <div class="carrera-group" style="margin-top:0">
      ${otherModes.map(m=>{
        // Próximamente
        if(!m.available){
          return `<div class="carrera-group-header" style="opacity:0.42;cursor:default">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--color-background-secondary);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${m.icon}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:500;color:var(--color-text-primary)">${m.label}</div>
              <div style="font-size:12px;color:var(--color-text-secondary)">${m.desc}</div>
            </div>
            <span style="font-size:12px;color:var(--color-text-tertiary)">Próx.</span>
          </div>`;
        }
        // Lockable y bloqueado
        if(m.lockable&&!unlocked[m.id]){
          return `<div class="carrera-group-header" style="opacity:0.55;cursor:default">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--color-background-secondary);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${m.icon}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:500;color:var(--color-text-primary)">${m.label} 🔒</div>
              <div style="font-size:12px;color:var(--color-text-secondary)">Sigue el arco narrativo en modo carrera para desbloquear</div>
            </div>
          </div>`;
        }
        // Lockable y desbloqueado — dos botones
        if(m.lockable&&unlocked[m.id]){
          return `<div style="padding:12px 14px;border-bottom:1px solid var(--color-border-tertiary)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <div style="width:36px;height:36px;border-radius:8px;background:#EEEDFE;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${m.icon}</div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:600;color:#3C3489">${m.label} <span style="font-size:11px;background:#EEEDFE;color:#534AB7;padding:1px 6px;border-radius:4px;font-weight:500">Desbloqueado</span></div>
                <div style="font-size:12px;color:var(--color-text-secondary)">${m.desc}</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <button class="main" style="margin-top:0;font-size:13px;padding:9px 8px;border-color:#534AB7;color:#3C3489" onclick="selectAndConfirm('${m.id}','continuar')">Continuar historia</button>
              <button class="main" style="margin-top:0;font-size:13px;padding:9px 8px" onclick="selectAndConfirm('${m.id}','nuevo')">Nuevo desde cero</button>
            </div>
          </div>`;
        }
        // Normal (expres / ultratrail)
        const isSel=sel===m.id;
        const clickAct=m.id==='ultratrail'
          ?`G.gameMode='ultratrail';G.screen='ultratrailWelcome';render()`
          :`selectMode('${m.id}')`;
        return `<div class="carrera-group-header" onclick="${clickAct}" style="${isSel?'background:#fef9ec;border-bottom:1px solid #e8e6e0':''}">
          <div style="width:36px;height:36px;border-radius:8px;background:${isSel?'#fef9ec':'var(--color-background-secondary)'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${m.icon}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:${isSel?'600':'500'};color:${isSel?'#c07a10':'var(--color-text-primary)'}">${m.label}</div>
            <div style="font-size:12px;color:var(--color-text-secondary)">${m.desc}</div>
          </div>
          <span style="font-size:12px;color:#c07a10;font-weight:600">${isSel?'✓':''}</span>
        </div>`;
      }).join('')}
    </div>

    <button class="secondary" style="margin-top:12px;width:100%;text-align:center" onclick="G.screen='achievements';render()">🏅 Ver todos los logros</button>
    <button class="main" style="margin-top:16px" onclick="confirmMode()">Continuar →</button>
    <button class="main" style="margin-top:6px;opacity:0.6" onclick="G.screen='saveScreen';render()">← Volver a partidas guardadas</button>`;
}

window.toggleModeGroup=()=>{
  const c=document.getElementById('modegroup-content');
  const a=document.getElementById('modegroup-arrow');
  if(c){const open=c.classList.toggle('open');if(a)a.style.transform=open?'rotate(90deg)':'';}
};
window.selectMode=id=>{G.gameMode=id;render();};
window.selectAndConfirm=(id,path)=>{
  G.gameMode=id;
  if(path==='continuar'){
    if(id==='coach'){
      G.coachReputation=G.coachReputation||0;
      if((G.coachRoster||[]).some(s=>s&&s.coachAthlete)){G.screen='coachHub';render();return;}
      G._coachUnlockedHint=true;
      G.coachActiveIdx=0;if(!G.coachRoster)G.coachRoster=[];
      const sh=shuffle(COACH_ATHLETE_POOL);
      const bon=LIFE_ATHLETE_POOL.filter(a=>a.potential==='talento_oculto'||a.potential==='prometedor');
      let pl=sh.slice(0,3).map(a=>({...a,currentStats:{...a.baseStats}}));
      if(bon.length){const pk=bon[Math.floor(Math.random()*bon.length)];pl=[...pl,{...pk,currentStats:{...pk.baseStats},monthlyFee:200}];}
      G.coachPool=pl;G.screen='coachSelect';render();return;
    }
    if(id==='club'){
      if(G.clubModeData){G.screen='clubHub';render();return;}
      G._clubUnlockedHint=true;G.screen='clubCreate';render();return;
    }
  }
  if(path==='nuevo'){
    if(id==='coach'){
      G.coachReputation=5;G._coachUnlockedHint=true;
      G.coachActiveIdx=0;G.coachRoster=[];G.coachAthlete=null;
      const sh=shuffle(COACH_ATHLETE_POOL);
      const bon=LIFE_ATHLETE_POOL.filter(a=>a.potential==='talento_oculto'||a.potential==='prometedor');
      let pl=sh.slice(0,3).map(a=>({...a,currentStats:{...a.baseStats}}));
      if(bon.length){const pk=bon[Math.floor(Math.random()*bon.length)];pl=[...pl,{...pk,currentStats:{...pk.baseStats},monthlyFee:200}];}
      G.coachPool=pl;G.screen='coachSelect';render();return;
    }
    if(id==='club'){
      G.clubModeData=null;G._clubUnlockedHint=true;
      G.screen='clubCreate';render();return;
    }
  }
};
window.confirmMode=()=>{
  if(G.gameMode==='ultratrail'){G.screen='ultratrailWelcome';render();return;}
  if(G.gameMode==='canicross'){G.screen='intro';render();return;}
  if(G.gameMode==='club'){
    // Guiño narrativo si el modo está desbloqueado vía arco narrativo
    let unlocked={};try{unlocked=JSON.parse(LS.get('unlocked')||'{}');}catch(e){}
    if(unlocked.club&&!G.carreraVida){
      G._clubUnlockedHint=true; // flag para mostrar texto en clubCreate
    }
    if(G.clubModeData){G.screen='clubHub';render();return;}
    G.screen='clubCreate';render();return;
  }
  if(G.gameMode==='coach'){
    G.coachReputation=G.coachReputation||0;
    // Guiño narrativo si el modo está desbloqueado vía arco narrativo
    let unlocked={};try{unlocked=JSON.parse(LS.get('unlocked')||'{}');}catch(e){}
    if(unlocked.coach&&!G.carreraVida){
      G.coachReputation=Math.max(G.coachReputation,5);
      G._coachUnlockedHint=true; // flag para mostrar el texto en coachSelect
    }
    // If roster already has athletes, go to hub
    if((G.coachRoster||[]).some(s=>s&&s.coachAthlete)){
      G.screen='coachHub';render();return;
    }
    // First time — init pool and go to athlete selection for slot 0
    G.coachActiveIdx=0;
    if(!G.coachRoster)G.coachRoster=[];
    const shuffled=shuffle(COACH_ATHLETE_POOL);
    // Pool extra si viene del arco: un atleta de LIFE_ATHLETE_POOL con buen potencial
    let pool=shuffled.slice(0,3).map(a=>({...a,currentStats:{...a.baseStats}}));
    if(unlocked.coach&&!G.carreraVida){
      const bonus=LIFE_ATHLETE_POOL.filter(a=>a.potential==='talento_oculto'||a.potential==='prometedor');
      if(bonus.length){
        const pick=bonus[Math.floor(Math.random()*bonus.length)];
        pool=[...pool,{...pick,currentStats:{...pick.baseStats},monthlyFee:pick.monthlyFee||200}];
      }
    }
    G.coachPool=pool;
    G.screen='coachSelect';render();return;
  }
  // Modos de carrera normal — el arco narrativo corredor→entrenador→club está siempre activo
  if(['facil','medio','dificil','hardcore'].includes(G.gameMode)){
    G.carreraVida=true;
    G.lifecyclePhase=G.lifecyclePhase||'runner';
  }
  G.screen='intro';render();
};

function renderIntro(){
  // Preservar focus de inputs (#runname/#rname) tras re-render por cambio edad/especialidad
  const _prevFocusId=document.activeElement&&document.activeElement.id;
  const _prevSelStart=document.activeElement&&document.activeElement.selectionStart;
  const _prevSelEnd=document.activeElement&&document.activeElement.selectionEnd;
  // Persistir valores actuales del DOM en G antes de redibujar
  const _rn=document.getElementById('runname');if(_rn)G.runName=_rn.value;
  const _nm=document.getElementById('rname');if(_nm&&G.runner)G.runner.name=_nm.value;
  const el=document.getElementById('main');
  const r=G.runner;
  el.innerHTML=`
    <h1>Juego Trail</h1>
    <p class="sub">Crea tu corredor y empieza tu carrera deportiva</p>
    <div style="display:inline-block;font-size:11px;font-weight:700;color:#aaa;letter-spacing:.5px;margin-bottom:8px">v56</div>
    ${G.gameMode==='expres'?`<div class="warn" style="margin-bottom:14px">⚡ <strong>Carrera Exprés</strong> — 3 temporadas · sin gestión de jornada · ganancias de entrenamiento ×1.5</div>`:''}
    <label class="field-label">Nombre de la partida</label>
    <input id="runname" type="text" placeholder="Ej: Temporada del reto, Sin trabajo año 1..." value="${esc(G.runName||'')}" maxlength="30" style="margin-bottom:14px"/>
    <label class="field-label">Tu nombre</label>
    <input id="rname" type="text" placeholder="Nombre del corredor" value="${esc(r.name)}" maxlength="22"/>
    <label class="field-label">Edad inicial</label>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px">
      ${[18,22,25,28,30,35].map(a=>`<div onclick="G.runner.age=${a};G.runner.stats=applyAgeToStats({...SPEC_STATS[G.runner.specialty]},${a});render()" style="padding:7px 14px;border-radius:8px;border:1px solid ${(r.age||25)===a?'#1a1a1a':'#ddd'};background:${(r.age||25)===a?'#f0ede8':'#fff'};cursor:pointer;font-size:14px;font-weight:${(r.age||25)===a?'600':'400'}">${a}</div>`).join('')}
    </div>
    <label class="field-label">Especialidad</label>
    <div class="grid2" style="margin-bottom:20px">
      ${[['fondista','Fondista','Fondo y llano rápido'],['montanero','Montañero','Subidas y altitud'],['tecnico','Técnico','Descensos difíciles'],['todoterreno','Todoterreno','Equilibrado en todo']].map(([id,l,d])=>`
        <div class="spec ${r.specialty===id?'sel':''}" onclick="selSpec('${id}')">
          <div class="spec-label">${l}</div>
          <div class="spec-desc">${d}</div>
        </div>`).join('')}
    </div>
    <div class="card" style="margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
        <div class="sec-title-sm" style="margin-bottom:0">Stats iniciales</div>
        ${(r.age||25)!==25?`<div style="font-size:11px;color:#888">vs. base edad 25</div>`:''}
      </div>
      ${(()=>{
        const _adj=applyAgeToStats(SPEC_STATS[r.specialty],r.age||25);
        const _base=SPEC_STATS[r.specialty];
        return Object.entries(_adj).map(([k,v])=>{
          const d=v-_base[k];
          const dHtml=d>0?`<span style="color:#4a8a2a;font-size:11px;font-weight:700;margin-left:3px">+${d}</span>`:d<0?`<span style="color:#c0392b;font-size:11px;font-weight:700;margin-left:3px">${d}</span>`:'';
          return `<div class="bar-row"><span class="bar-label">${k.charAt(0).toUpperCase()+k.slice(1)}${dHtml}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${v}%;background:${v>=62?'#4a8a2a':v>=45?'#4a90d9':'#c07a10'}"></div></div><span class="bar-pct">${v}</span></div>`;
        }).join('');
      })()}
    </div>
    ${G.gameMode==='canicross'?`<div class="note" style="margin-bottom:12px">🐕 <strong>Modo Canicross</strong> — A continuación crearás tu perro y eliges raza.</div>`:''}
    <button class="main" onclick="${G.gameMode==='canicross'?'doStartCanicross':'doStart'}()">Empezar →</button>`;
  setTimeout(()=>{
    const i=document.getElementById('rname');
    if(i)i.oninput=e=>G.runner.name=e.target.value;
    const rn=document.getElementById('runname');
    if(rn)rn.oninput=e=>G.runName=e.target.value;
    // Restaurar focus tras re-render
    if(_prevFocusId){
      const tgt=document.getElementById(_prevFocusId);
      if(tgt){
        tgt.focus();
        if(_prevSelStart!=null&&tgt.setSelectionRange){
          try{tgt.setSelectionRange(_prevSelStart,_prevSelEnd);}catch(e){}
        }
      }
    }
  },0);
}

// ── WORK SETUP (TRIMESTRAL) ────────────
function renderWorkSetup(){
  const el=document.getElementById('main');
  const q=G.currentQuarter||1;
  const qLabel={1:'Q1 — Ene/Feb/Mar',2:'Q2 — Abr/May/Jun',3:'Q3 — Jul/Ago/Sep',4:'Q4 — Oct/Nov/Dic'};
  const sponsorM=monthlySponsorIncome();
  const canQuit=sponsorM>=FIXED_COSTS.total;
  const curPct=G.workByQuarter[q];
  const qRaces=G.selectedRaces.filter(r=>r.quarter===q);
  const vacQ=G.vacByQuarter?.[q]||0;
  const vacLeft=vacDaysLeft();
  const vacBonus=vacTrainingHBonus(q);
  const wo=WORK_OPTIONS.find(o=>o.pct===curPct)||WORK_OPTIONS[0];
  const totalTrainingH=wo.trainingH+vacBonus;

  if(G.year===1&&q===1&&!G._workTipSeen){G._workTipSeen=true;}
  el.innerHTML=`
    <h2>Jornada laboral</h2>
    <p class="sub">${qLabel[q]} · ${esc(G.runner.name||'Corredor')}${G.carreraVida?` · <span style="font-size:11px;padding:1px 7px;border-radius:4px;background:#E6F1FB;color:#185FA5;font-weight:600">🏔 Carrera de Vida · Año ${G.year} · ${{runner:'Corredor',overlap:'Solapamiento',coach:'Entrenador',club:'Club'}[G.lifecyclePhase||'runner']}</span>`:''}</p>
    ${G.year===1&&q===1?`<div class="note" style="border-left-color:#c07a10">💡 <strong>Las horas que no dediques a trabajar van a entrenar — y las que no uses entrenando, a reputación.</strong> Atleta puro, mediático o equilibrado: tú eliges cada trimestre.</div>`:''}
    ${qRaces.length>0?`<div class="note">Este trimestre tienes ${qRaces.length} carrera${qRaces.length>1?'s':''}: ${qRaces.map(r=>r.name).join(', ')}. Valora bajar jornada o usar vacaciones.</div>`:''}
    ${G.workChangePenalties?.[q]?`<div class="warn">⚠ Cambio brusco de jornada${G.workChangePenalties[q]?.amount>0?' — pierdes €'+G.workChangePenalties[q].amount:''} · eficiencia entrenamiento ${Math.round((G.workChangePenalties[q]?.trainingEff||1)*100)}% este trimestre.</div>`:''}
    <div class="card" style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:8px">Gastos fijos mensuales</div>
      <table class="eco-table">
        <tr><td>Alquiler + comida + transporte</td><td class="right minus">-€${FIXED_COSTS.total}/mes</td></tr>
      </table>
    </div>
    <div class="section-label">¿Cuánto trabajas este trimestre?</div>
    ${WORK_OPTIONS.map(wo2=>{
      const net=wo2.income+sponsorM-FIXED_COSTS.total-(G.club?.cost||0);
      const eff=Math.round(trainingEffFromH(wo2.trainingH+vacBonus)*100);
      const isLocked=wo2.pct===0&&!canQuit;
      const sel=curPct===wo2.pct;
      return `<div class="work-card ${sel?'sel':''} ${isLocked?'locked-work':''}" onclick="${isLocked?'':'setWorkQ('+q+','+wo2.pct+')'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div class="card-title">${wo2.label}</div>
            <div class="card-sub">${wo2.desc}</div>
          </div>
          ${isLocked?`<span style="font-size:12px;color:#c0392b;flex-shrink:0;margin-left:8px">Necesitas €${FIXED_COSTS.total+(G.club?.cost||0)}/mes en sponsors (tienes €${sponsorM})</span>`:''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:12px">
          <div><div style="color:#aaa;margin-bottom:2px">Trabajo</div>
            <div style="font-weight:600;color:${wo2.income>0?'#2d7a2d':'#aaa'}">${wo2.income>0?'+€'+wo2.income:'-'}/mes</div></div>
          <div><div style="color:#aaa;margin-bottom:2px">Neto</div>
            <div style="font-weight:600;color:${net>=0?'#2d7a2d':'#c0392b'}">${net>=0?'+':''}€${net}/mes</div></div>
          <div><div style="color:#aaa;margin-bottom:2px">Entreno base</div>
            <div style="font-weight:600;color:#4a90d9">${wo2.trainingH}h/sem</div></div>
        </div>
        <div style="margin-top:8px">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#aaa;margin-bottom:3px">
            <span>Eficiencia</span><span>${eff}%</span>
          </div>
          ${hbar(eff,100,'#4a90d9')}
        </div>
      </div>`;}).join('')}

    <div class="card" style="margin-top:8px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="card-title">Vacaciones este trimestre</div>
        <div style="font-size:12px;color:#888">${vacDaysUsed()} / ${G.vacDaysTotal||15} días usados este año</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <button class="secondary" onclick="setVacQ(${q},${Math.max(0,vacQ-1)})" ${vacQ<=0?'disabled':''} style="padding:6px 12px;font-size:16px">−</button>
        <div style="flex:1;text-align:center">
          <div style="font-size:24px;font-weight:700;color:#c07a10">${vacQ}</div>
          <div style="font-size:12px;color:#aaa">días este trimestre</div>
        </div>
        <button class="secondary" onclick="setVacQ(${q},${Math.min(vacLeft+vacQ,vacQ+1)})" ${vacLeft<=0?'disabled':''} style="padding:6px 12px;font-size:16px">+</button>
      </div>
      ${vacQ>0?`<div class="note" style="margin-bottom:0">
        +${vacBonus}h/sem de entrenamiento extra este trimestre
        · Entreno total: <strong>${totalTrainingH}h/sem</strong>
        · ${vacLeft} días restantes en el año
      </div>`:
      `<div style="font-size:12px;color:#aaa">Cada día de vacaciones añade 1.5h/sem de entrenamiento extra este trimestre. Te quedan ${vacLeft} días este año.</div>`}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
      <button class="main" onclick="G.screen='seasonStart';render()">← Volver</button>
      <button class="main" onclick="G.screen='calendar';render()">Confirmar →</button>
    </div>
    ${[2,3,4].includes(q)?`<div style="margin-top:12px">
      <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Otros trimestres</div>
      ${[1,2,3,4].filter(n=>n!==q).map(n=>{
        const wo2=WORK_OPTIONS.find(o=>o.pct===G.workByQuarter[n]);
        const vac2=G.vacByQuarter?.[n]||0;
        return `<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:0.5px solid var(--color-border-tertiary)">
          <span style="color:var(--color-text-secondary)">${{1:'Q1',2:'Q2',3:'Q3',4:'Q4'}[n]}</span>
          <span style="cursor:pointer;color:#4a90d9" onclick="G.currentQuarter=${n};render()">
            ${wo2?.label||'—'} · ${wo2?.trainingH||5}h/sem${vac2>0?' + '+vac2+'d vac':''} ✎
          </span>
        </div>`;}).join('')}
    </div>`:''}`;
}

window.setVacQ=(q,days)=>{
  if(!G.vacByQuarter)G.vacByQuarter={1:0,2:0,3:0,4:0};
  const max=(G.vacDaysTotal||15)-vacDaysUsed()+(G.vacByQuarter[q]||0);
  G.vacByQuarter[q]=Math.max(0,Math.min(max,days));
  render();
};

// ── SEASON START ───────────────────────
function renderSeasonStart(){
  const el=document.getElementById('main');
  const wo=WORK_OPTIONS.find(o=>o.pct===G.workPct);
  const net=monthlyNet();
  const showObjectives=G.year===1&&!G.yearObjective; // Solo mostrar en primer año, una sola vez
  
  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px">
      <h2>Temporada ${G.year}</h2>
      <span style="font-size:12px;color:#999;padding-top:5px">${G.ranking<900?'Ranking #'+G.ranking:'Sin ranking'}</span>
    </div>
    <p class="sub">${esc(G.runner.name||'Corredor')} · ${G.runner.specialty} · ${G.runner.age?G.runner.age+' años · ':''}<span style="font-size:12px;padding:1px 7px;border-radius:4px;background:${{facil:'#EAF3DE',medio:'#FAEEDA',dificil:'#FCEBEB',hardcore:'#F1EFE8',expres:'#fef9ec'}[G.gameMode||'medio']};color:${{facil:'#27500A',medio:'#633806',dificil:'#791F1F',hardcore:'#444441',expres:'#8a4a00'}[G.gameMode||'medio']}">${{facil:'Fácil',medio:'Medio',dificil:'Difícil',hardcore:'Hardcore',expres:'⚡ Exprés'}[G.gameMode||'medio']}</span>${G.gameMode==='expres'?` <span style="font-size:12px;color:#c07a10;font-weight:600">Año ${G.year}/3</span>`:''}${G.carreraVida?` <span style="font-size:11px;padding:1px 7px;border-radius:4px;background:#EEEDFE;color:#534AB7;font-weight:600">${{runner:'🏃 Corredor',overlap:'🏃 · 📋 Overlap',coach:'📋 Entrenador',club:'🏕 Club'}[G.lifecyclePhase||'runner']}</span>`:''}</p>
    
    ${showObjectives?`
    <div style="background:#f5f4f0;border:1.5px solid #1a1a1a;border-radius:12px;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Elige tu objetivo de temporada</div>
      ${SEASON_OBJECTIVES.map(obj=>`<div class="work-card" style="margin-bottom:8px" onclick="selectYearObjective('${obj.id}')">
        <div style="flex:1">
          <div class="card-title">${obj.label}</div>
          <div class="card-sub">${obj.desc}</div>
        </div>
        <div style="font-size:12px;color:#4a8a2a;font-weight:600;flex-shrink:0;margin-left:10px">+€${obj.reward}</div>
      </div>`).join('')}
    </div>
    `:''}
    
    ${G.yearObjective?`<div class="note">Objetivo: ${SEASON_OBJECTIVES.find(o=>o.id===G.yearObjective)?.label||'—'}</div>`:''}
    
    <div class="stat-grid">
      <div class="stat"><div class="stat-label">Ahorros</div><div class="stat-val">€${G.money}</div></div>
      <div class="stat"><div class="stat-label">Neto mensual</div><div class="stat-val" style="color:${net>=0?'#2d7a2d':'#c0392b'}">${net>=0?'+':''}€${net}</div></div>
      <div class="stat"><div class="stat-label">Entreno</div><div class="stat-val">${wo?.trainingH||5}h/sem</div></div>
    </div>
    ${G.workPct===100?`<div class="warn">Jornada completa — solo ${wo?.trainingH}h/sem de entrenamiento. Los bloques solo serán un ${Math.round(effForWork()*100)}% efectivos.</div>`:
      G.workPct===0?`<div class="note">Profesional — entrenamiento completo. Asegúrate de que los ingresos cubran gastos.</div>`:
      `<div class="note">${wo?.label} — ${wo?.trainingH}h/sem de entrenamiento. Eficiencia de bloque: ${Math.round(effForWork()*100)}%.</div>`}
    <div class="card" style="margin-bottom:14px">
      <div class="sec-title-sm">Plan de jornada laboral por trimestre</div>
      ${[1,2,3,4].map(q=>{
        const wo2=WORK_OPTIONS.find(o=>o.pct===G.workByQuarter[q]);
        const qRaces=G.selectedRaces.filter(r=>r.quarter===q);
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:0.5px solid var(--color-border-tertiary)">
          <div>
            <span style="font-size:13px;font-weight:600">${{1:'Q1',2:'Q2',3:'Q3',4:'Q4'}[q]}</span>
            <span style="font-size:12px;color:var(--color-text-secondary);margin-left:8px">${wo2?.label||'—'}</span>
            ${qRaces.length>0?`<span style="font-size:12px;color:#4a8a2a;margin-left:6px">${qRaces.length} carrera${qRaces.length>1?'s':''}</span>`:''}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:12px;color:#4a90d9">${wo2?.trainingH||5}h/sem</span>
            <span style="font-size:12px;cursor:pointer;color:#aaa" onclick="G.currentQuarter=${q};G.screen='workSetup';render()">✎</span>
          </div>
        </div>`;}).join('')}
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="sec-title-sm">Tus stats actuales</div>
      ${Object.entries(G.runner.stats).map(([k,v])=>srow(k.charAt(0).toUpperCase()+k.slice(1),v)).join('')}
    </div>
    <button class="main" onclick="G.currentQuarter=1;G.screen='workSetup';render()">Planificar jornada laboral →</button>
    <button class="main" onclick="G.screen='clubSetup';render()" style="margin-top:6px">${G.club&&G.club.id!=='none'?'🏃 Club: '+G.club.name+' →':'🏃 Unirse a un club →'}</button>
    <button class="main" onclick="G.screen='circuits';render()" style="margin-top:6px">Unirse a circuitos / ligas →</button>
    <button class="main" onclick="G.screen='calendar';render()" style="margin-top:6px">Planificar calendario →</button>`;
}

// ── CALENDAR ───────────────────────────
function renderCalendar(){
  const el=document.getElementById('main');
  const canAccess=r=>r.zegamaSpecial?(G.ranking<=20||G.zegamaQual):(r.reqRanking>=G.ranking||r.reqRanking===999);
  const selIds=G.selectedRaces.map(r=>r.id);
  const spent=G.selectedRaces.reduce((a,r)=>a+r.cost,0);
  const budget=G.money;
  const pct=Math.min(100,Math.round(spent/Math.max(1,budget)*100));
  const tierColor=TIER_COLOR_RACE;
  const tierLabel=TIER_LABEL_RACE;
  const specRaces=getSpecRaces();
  const specLabel=SPEC_LABEL;
  const specColor={fondista:'#4a90d9',montanero:'#4a8a2a',tecnico:'#c07a10',todoterreno:'#888'};
  const myColor=specColor[G.runner.specialty]||'#888';
  const myLabel=specLabel[G.runner.specialty]||'';

  function raceCard(r,isSpec){
    const sel=selIds.includes(r.id);
    const locked=!canAccess(r);
    const noMoney=!sel&&(spent+r.cost>budget);
    const inCirc=isInCircuit(r.id);
    const circPts=inCirc?circuitPoints(3,15):0;
    return `<div class="race-card ${sel?'sel':locked?'locked':''}" ${!locked&&!(noMoney&&!sel)?'onclick="toggleRace(\''+r.id+'\')"':''}>
      <div class="flex-between">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:2px">
            <span class="card-title">${esc(r.name)}</span>
            <span style="font-size:12px;font-weight:600;padding:1px 6px;border-radius:4px;background:${tierColor[r.tier]||'#888'}22;color:${tierColor[r.tier]||'#888'}">${tierLabel[r.tier]||''}</span>
            ${isSpec?`<span style="font-size:12px;font-weight:600;padding:1px 6px;border-radius:4px;background:${myColor}22;color:${myColor}">${myLabel}</span>`:''}
            ${inCirc?`<span style="font-size:12px;font-weight:600;padding:1px 5px;border-radius:4px;background:#c07a1022;color:#c07a10">Liga · ~${circPts}pts</span>`:''}
          </div>
          <div style="font-size:12px;color:#888">${r.monthName} · ${r.type} · ${r.desnivel}</div>
          ${locked?(r.zegamaSpecial?`<div style="font-size:12px;color:#c07a10;margin-top:2px">🏔️ Invitación Top 20 o clasificación por tiempo (corte 4h20)</div>`:`<div style="font-size:12px;color:#ccc;margin-top:2px">🔒 Ranking #${r.reqRanking} requerido</div>`):''}
          ${noMoney&&!sel?`<div class="text-warn">Sin presupuesto</div>`:''}
          ${isSpec?`<div style="font-size:12px;color:${myColor};margin-top:2px">+15% rendimiento para ${myLabel}</div>`:''}
        </div>
        <div class="right-col">
          <div style="font-size:13px;font-weight:600;color:#4a8a2a">€${r.prize}</div>
          <div style="font-size:12px;color:#aaa">€${r.cost} inscr.</div>
          ${sel?`<div style="font-size:12px;color:#4a8a2a;font-weight:600;margin-top:2px">✓</div>`:''}
        </div>
      </div>
    </div>`;
  }

  el.innerHTML=`
    <h2>Calendario anual</h2>
    <p class="sub">Comunes + específicas de ${myLabel} · €${spent} de €${budget} gastados</p>
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:4px">
        <span>Presupuesto de inscripciones <button class="tip-btn" onclick="showTip('Barra de presupuesto','Esta barra muestra qué porcentaje de tus ahorros llevas gastado en inscripciones de carrera. No es la carga corporal — eso lo puedes ver en la pestaña Corredor.<br><br>Si llega al 85% se vuelve roja: ojo con dejar reservas para imprevistos.')">ⓘ</button></span>
        <span style="font-weight:600;color:${pct>85?'#c0392b':pct>50?'#c07a10':'#888'}">${pct}% (€${spent} / €${budget})</span>
      </div>
      <div style="height:4px;background:#e8e6e0;border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${pct>85?'#c0392b':'#4a90d9'};border-radius:2px;transition:width .3s"></div>
      </div>
    </div>
    ${G.joinedCircuits.length>0?`<div class="note" style="margin-bottom:12px">
      <span style="font-weight:600">Circuito${G.joinedCircuits.length>1?'s':''} activo${G.joinedCircuits.length>1?'s':''}:</span>
      ${G.joinedCircuits.map(cid=>CIRCUITS_DB.find(c=>c.id===cid)?.name||cid).join(', ')}
      — las carreras de liga están marcadas con <span style="color:#c07a10;font-weight:600">Liga</span>
    </div>`:
    `<div onclick="G.screen='circuits';render()" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fff;border:1.5px dashed #e0dfd8;border-radius:10px;cursor:pointer;margin-bottom:12px">
      <div>
        <div class="card-title">🏆 Ligas y circuitos</div>
        <div class="card-sub">Únete para ganar puntos y premios extra este año</div>
      </div>
      <span style="color:#aaa;font-size:14px">→</span>
    </div>`}
    ${QUARTERS.map(q=>{
      const common=RACES_DB.filter(r=>r.quarter===q.n);
      const spec=specRaces.filter(r=>r.quarter===q.n);
      const qSel=[...common,...spec].filter(r=>selIds.includes(r.id)).length;
      const qLabel={1:'Primer trimestre',2:'Segundo trimestre',3:'Tercer trimestre',4:'Cuarto trimestre'};
      const isOpen=(G.openQuarters?.cal||[]).includes(q.n);
      return `
        <div class="quarter-wrap">
          <div class="quarter-toggle ${qSel>0?'has-sel':''}" onclick="toggleQ(${q.n})">
            <span style="font-size:14px;font-weight:600;flex:1">${qLabel[q.n]} <span style="font-size:12px;font-weight:400;color:#aaa">· ${q.months}</span></span>
            ${qSel>0?`<span style="font-size:12px;color:#4a8a2a;font-weight:600">${qSel} ✓</span>`:''}
            <span style="font-size:12px;color:#aaa;display:inline-block;transform:${isOpen?'rotate(90deg)':''};transition:transform .2s">▶</span>
          </div>
          <div class="quarter-content ${isOpen?'open':''}" onclick="event.stopPropagation()">
            ${common.map(r=>raceCard(r,false)).join('')}
            ${spec.length>0?`
              <div class="spec-toggle" id="spec-toggle-${q.n}" onclick="event.stopPropagation();toggleSpecQ(${q.n})">
                <span style="color:${myColor}">★</span>
                <span style="flex:1">Carreras específicas — ${myLabel} (${spec.length})</span>
                <span class="spec-arrow" id="spec-arrow-${q.n}">▶</span>
              </div>
              <div class="spec-races" id="spec-races-${q.n}">
                ${spec.map(r=>raceCard(r,true)).join('')}
              </div>`:''}
          </div>
        </div>`;}).join('')}
    <div style="font-size:13px;color:#888;margin:8px 0 12px">
      ${G.selectedRaces.length===0?'Sin carreras — puedes continuar igualmente.':G.selectedRaces.length+' carrera'+(G.selectedRaces.length>1?'s':'')+' seleccionada'+(G.selectedRaces.length>1?'s':'')+'.'}
    </div>
    <div class="grid-2">
      <button class="main" onclick="G.screen='seasonStart';render()">← Volver</button>
      <button class="main" onclick="G.screen='sponsors';render()">Patrocinios →</button>
    </div>`;
}

window.toggleQ=q=>{
  if(!G.openQuarters)G.openQuarters={cal:[],mid:[],tab:[]};
  const arr=G.openQuarters.cal;
  const idx=arr.indexOf(q);
  if(idx>=0)arr.splice(idx,1);else arr.push(q);
  render();
};
window.toggleSpecQ=q=>{
  const panel=document.getElementById('spec-races-'+q);
  const arrow=document.getElementById('spec-arrow-'+q);
  if(panel){panel.classList.toggle('open');if(arrow)arrow.classList.toggle('open');}
};

// ── SPONSORS ───────────────────────────
function renderSponsors(){
  const el=document.getElementById('main');
  const cats=['zapatillas','ropa','nutricion','tecnologia'];
  const catLabel={zapatillas:'Zapatillas',ropa:'Ropa',nutricion:'Nutrición',tecnologia:'Tecnología GPS'};
  const tierLabel=TIER_LABEL_SPONSOR;
  const tierColor=TIER_COLOR_SPONSOR;

  // Filter sponsors available this year and ranking
  const avail=SPONSORS_DB.filter(s=>{
    if(s.reqYear&&G.year<s.reqYear)return false;
    if(s.reqRanking&&G.ranking>s.reqRanking)return false;
    return true;
  });
  const locked=SPONSORS_DB.filter(s=>!avail.includes(s));

  el.innerHTML=`
    <h2>Patrocinios <button class="tip-btn" onclick="showTip('Patrocinios','Cada sponsor tiene un <strong>objetivo</strong> que cumplir al final del contrato (victorias, ranking, carreras completadas). Si no lo cumples pagas una <strong>penalización</strong> del porcentaje indicado sobre tu salario anual.<br><br>Romper el contrato antes de tiempo cuesta el <strong>40% del valor restante</strong>. Los contratos de varios años pagan más pero el compromiso es mayor.')">ⓘ</button></h2>
    <p class="sub">Año ${G.year} · Ingresos actuales: <strong style="color:#2d7a2d">+€${sponsorAnnual()}/año</strong></p>

    ${G.sponsorPenalties&&G.sponsorPenalties.length>0?`
    <div class="danger" style="margin-bottom:14px">
      <div style="font-weight:600;margin-bottom:6px">Penalizaciones por incumplimiento</div>
      ${G.sponsorPenalties.map(p=>`<div style="font-size:13px;display:flex;justify-content:space-between;margin-bottom:4px">
        <span>${p.name}</span>
        <span style="font-weight:600">-€${p.amount} <button class="secondary" style="font-size:12px;padding:2px 8px;margin-left:8px" onclick="payPenalty('${p.id}')">Pagar</button></span>
      </div>`).join('')}
    </div>`:''}

    ${cats.map(cat=>{
      const offers=avail.filter(s=>s.cat===cat);
      const cur=G.sponsors[cat];
      const lockedOffers=locked.filter(s=>s.cat===cat).slice(0,2);
      const objMet=cur?checkSponsorObjective(cur):null;

      return `<div style="margin-bottom:20px">
        <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">${catLabel[cat]}</div>

        ${cur?`<div style="padding:10px 12px;background:#f0f6ff;border-radius:8px;border:1px solid #4a90d9;margin-bottom:10px;font-size:12px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
                <span style="font-weight:700;color:#4a90d9">${esc(cur.name)}</span>
                <span style="font-size:11px;padding:1px 5px;border-radius:4px;background:${tierColor[cur.tier]||'#888'}22;color:${tierColor[cur.tier]||'#888'}">${tierLabel[cur.tier]||'?'}</span>
                <span style="color:${objMet?'#4a8a2a':'#c0392b'};font-weight:600;font-size:11px">${objMet?'✓ Objetivo cumplido':'⚠ Pendiente'}</span>
              </div>
              <div style="color:#888">Obj: ${cur.objective} · <strong>${cur.duration}</strong> temp. restante${cur.duration!==1?'s':''}</div>
              ${!objMet?`<div style="color:#c0392b;margin-top:2px">Penalización si no cumples: €${Math.round(cur.salary*cur.penaltyPct)}</div>`:''}
              ${followersSponsorMult()>1?`<div style="font-size:12px;color:#4a90d9;margin-top:2px">📱 +${Math.round((followersSponsorMult()-1)*100)}% por reputación</div>`:''}
            </div>
            <button class="secondary" onclick="breakSponsorContract('${cat}')" style="font-size:11px;padding:5px 9px;flex-shrink:0;color:#c0392b;border-color:#c0392b;background:#fff8f0;text-align:center;line-height:1.3">Romper<br><span style="font-size:10px">-€${Math.round(cur.salary*cur.duration*0.4)}</span></button>
          </div>
        </div>
        ${offers.filter(sp=>sp.id!==cur.id).length>0?`<div style="font-size:12px;color:#aaa;font-style:italic;margin-bottom:6px">Otras ofertas (rompe el contrato para cambiar):</div>
        ${offers.filter(sp=>sp.id!==cur.id).map(sp=>`<div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:10px 14px;margin-bottom:6px;opacity:0.5">
          <div class="flex-between-center">
            <div>
              <span style="font-size:13px;font-weight:600;color:#aaa">${sp.name}</span>
              <span style="font-size:11px;font-weight:600;padding:1px 5px;border-radius:4px;background:${tierColor[sp.tier]}22;color:${tierColor[sp.tier]};margin-left:5px">${tierLabel[sp.tier]}</span>
              ${sp.tier>cur.tier?`<span style="font-size:11px;color:#c07a10;font-weight:700;margin-left:4px">⬆ Upgrade</span>`:''}
            </div>
            <span style="font-size:13px;font-weight:600;color:#aaa">+€${sp.salary}/año</span>
          </div>
        </div>`).join('')}`:''}`:''
        }
        ${!cur?offers.map(sp=>{
          const isPending=G._pendingSponsors?.[cat]?.id===sp.id;
          return `<div class="sponsor-card ${isPending?'sel-aid':''}" onclick="selectSponsor('${cat}','${sp.id}')" style="${isPending?'border:2px solid #4a90d9;background:#f0f6ff;':''}">
            <div class="flex-between">
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                  <span class="card-title">${sp.name}</span>
                  <span style="font-size:12px;font-weight:600;padding:1px 6px;border-radius:4px;background:${tierColor[sp.tier]}22;color:${tierColor[sp.tier]}">${tierLabel[sp.tier]}</span>
                  ${isPending?`<span style="font-size:11px;font-weight:700;color:#4a90d9">● Seleccionado</span>`:''}
                </div>
                <div style="font-size:12px;color:#888">${sp.bonus}</div>
                <div style="font-size:12px;color:#aaa;margin-top:2px">Obj: ${sp.objective}</div>
                ${sp.duration>1?`<div style="font-size:12px;color:#4a90d9;margin-top:1px">Contrato ${sp.duration} temporadas</div>`:''}
              </div>
              <div class="right-col">
                <div style="font-size:14px;font-weight:600;color:#2d7a2d">+€${sp.salary}</div>
                <div style="font-size:12px;color:#aaa">/año</div>
                <div class="text-warn">Penaliz. ${Math.round(sp.penaltyPct*100)}%</div>
              </div>
            </div>
          </div>`;}).join(''):''}

        ${lockedOffers.length>0?`
          <div style="margin-top:6px">
            ${lockedOffers.slice(0,1).map(sp=>`<div style="padding:8px 12px;background:#fafafa;border-radius:8px;border:0.5px dashed #ddd;font-size:12px;color:#bbb;display:flex;justify-content:space-between">
              <span>🔒 ${sp.name} · ${tierLabel[sp.tier]}</span>
              <span>${sp.reqYear?`Año ${sp.reqYear}`:''} ${sp.reqRanking?`· Ranking #${sp.reqRanking}`:''}</span>
            </div>`).join('')}
          </div>`:''}

        ${offers.length===0&&lockedOffers.length===0?`<div style="font-size:13px;color:#ccc;padding:6px 0">Sin ofertas esta temporada.</div>`:''}
      </div>`;}).join('')}
    ${Object.keys(G._pendingSponsors||{}).length>0?`
    <div class="warn" style="margin-bottom:10px">
      <strong>Tienes selecciones sin confirmar.</strong> Haz clic en un sponsor seleccionado para quitarlo, o confirma para firmar los contratos.
    </div>
    <button class="main" onclick="confirmSponsors()" style="background:#2d7a2d;border-color:#2d7a2d;color:#fff;margin-bottom:8px">✓ Confirmar patrocinios seleccionados</button>`:''}
    <button class="main" onclick="G._pendingSponsors={};G.screen='training';render()">Bloque de entrenamiento →</button>`;
}

window.payPenalty=id=>{
  if(!G.sponsorPenalties)return;
  const idx=G.sponsorPenalties.findIndex(p=>p.id===id);
  if(idx<0)return;
  const p=G.sponsorPenalties[idx];
  G.money=Math.max(0,G.money-p.amount);
  G.sponsorPenalties.splice(idx,1);
  render();
};

// ── TRAINING ───────────────────────────
function renderTraining(){
  const el=document.getElementById('main');
  const nextRace=G.selectedRaces[0];
  const wo=curWorkOpt();
  const hint=bodyLoadHint();
  const load=getBodyLoad();
  const curMonth=nextRace?nextRace.month:(new Date().getMonth()+1);
  const se=getSeasonEffects(curMonth);
  const seEffPct=Math.round(effForWork()*(1+se.trainingMod)*100);
  el.innerHTML=`
    <h2>Bloque de entrenamiento</h2>
    <p class="sub">Efectividad: <strong>${seEffPct}%</strong> · ${wo?.trainingH||5}h/sem · ${se.label}</p>
    ${G.zeroedOutThisRace&&G.postRaceConsequence?`<div class="danger">⚠ Secuelas de la última carrera — <strong>${G.postRaceConsequence.label}</strong>. ${G.postRaceConsequence.id==='descanso_forzado'?'Esta semana no puedes entrenar.':G.postRaceConsequence.id==='sobrecarga'?'Entrenamiento de piernas al 80% este año.':'Recuperación en curso.'}</div>`:''}
    ${hint?`<div class="${hint.type}">${hint.msg}</div>`:''}
    ${se.trainingMod!==0?`<div class="hint">${se.note}</div>`:''}
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:4px">
        <span>Carga corporal acumulada <button class="tip-btn" onclick="showTip('Carga corporal','Refleja el desgaste acumulado de entrenar. Por encima del <strong>70%</strong> empieza la bajada de rendimiento. Al <strong>100%</strong> aparece una lesión.<br><br>La degradación es exponencial: cuanta más carga tienes, más difícil bajarla. Se reduce parcialmente entre temporadas, pero nunca vuelve a cero sola. Nunca vayas a tope todo el rato.')">ⓘ</button></span>
        <span style="color:${load>=70?'#c0392b':load>=50?'#c07a10':'#888'}">${load}%</span>
      </div>
      <div class="load-bar-track"><div class="bar-fill" style="width:${load}%;background:${load>=70?'#c0392b':load>=50?'#c07a10':'#4a90d9'}"></div></div>
    </div>
    <div style="margin-bottom:12px">
      <button class="secondary" id="btn-nr" onclick="toggleNR()">Ver próxima carrera ↓</button>
    </div>
    <div id="nr-panel" style="display:none;margin-bottom:12px">
      ${nextRace?racePreviewCard(nextRace,'preview',0):'<p style="font-size:13px;color:#aaa">Sin carrera seleccionada.</p>'}
    </div>
    ${nextRace?`<script>attachProfHandlers(${JSON.stringify(nextRace)},'${nextRace.id}preview','preview',0);<\/script>`:''}
    <div style="margin-bottom:16px">
      ${TRAINING_BLOCKS.map(b=>{
        const sel=G.trainingBlock&&G.trainingBlock.id===b.id;
        const eff=effForWork()*(1+se.trainingMod);
        const loadAfter=Math.round(bodyLoadAfterTraining(b.id));
        const loadCol=loadAfter>=70?'#c0392b':loadAfter>=50?'#c07a10':'#888';
        // Taper: contextual hint
        const hasFutureRace=nextRace!==null&&nextRace!==undefined;
        const taperHint=b.taperBlock&&hasFutureRace?`<div class="text-ok">✓ Tienes carrera próxima — buen momento. +6 Energía y Piernas al salir.</div>`:
                        b.taperBlock&&!hasFutureRace?`<div style="font-size:12px;color:#aaa;margin-top:4px">Sin carrera próxima — poco beneficio ahora.</div>`:'';
        // Momentum warning
        const mom=G.trainingMomentum;
        const momWarn=mom&&mom.blockId===b.id&&mom.count>=2?
          `<div style="font-size:12px;color:#c07a10;margin-top:4px">⚠ ${mom.count}º trimestre seguido — riesgo de estancamiento o revelación.</div>`:'';
        // Flavor text when selected
        const flavor=sel&&b.flavor&&b.flavor.length?
          `<div style="font-size:12px;color:#555;font-style:italic;margin-top:5px;padding:5px 8px;background:#f5f4f0;border-radius:5px">"${b.flavor[0]}"</div>`:'';
        const effs=b.taperBlock?
          `<span style="font-size:12px;color:#4a8a2a">+2 Mental · Carga −18%</span>`:
          Object.entries(b.effects).filter(([,v])=>v!==0).map(([k,v])=>{
            const r=Math.round(v*eff);const col=r>0?'#4a8a2a':'#c0392b';
            return `<span style="font-size:12px;color:${col}">${k.charAt(0).toUpperCase()+k.slice(1)} ${r>0?'+':''}${r}</span>`;
          }).join(' <span style="color:#ddd">·</span> ');
        const bkH=b.hours||8;const bkRepH=Math.max(0,(wo?.trainingH||5)+vacTrainingHBonus(G.currentQuarter||1)-bkH);
        return `<div class="train-card ${sel?'sel':''}" onclick="selectTraining('${b.id}')">
          <div class="flex-between">
            <div style="flex:1">
              <div class="card-title">${b.name} <span style="font-size:11px;color:#888;font-weight:400">· ${bkH}h/sem · quedan ${bkRepH}h reputación</span></div>
              <div style="font-size:12px;color:#888;margin:2px 0 6px">${b.desc} ${b.detail}</div>
              <div class="flex-between-center">
                <div>${effs}</div>
                <span style="font-size:12px;color:${loadCol};flex-shrink:0;margin-left:8px">carga → ${loadAfter}%</span>
              </div>
              ${taperHint}${momWarn}${flavor}
            </div>
            ${sel?`<span style="color:#4a90d9;font-size:16px;margin-left:10px">✓</span>`:''}
          </div>
        </div>`;}).join('')}
    </div>
    ${G.trainingEvent?`<div class="hint" style="margin-bottom:12px">${G.trainingEvent.icon} <strong>Evento de entrenamiento:</strong> ${G.trainingEvent.title} — ${G.trainingEvent.desc}</div>`:''}
    ${G.carreraVida&&G.lifecyclePhase==='overlap'&&G.lifeAthlete?renderAthleteHoursBlock():''}
    <button class="main" onclick="doStartRaces()" ${!G.trainingBlock?'disabled':''}>¡Empezar temporada! →</button>`;
}

// ── Bloque de horas al atleta (fase overlap) ──────────────────────────────────
function renderAthleteHoursBlock(){
  const a=G.lifeAthlete;
  if(!a)return '';
  const first=esc(a.name.split(' ')[0]);
  const h=G.lifeAthleteHours||0;
  const effPct=Math.round(lifeAthleteEffMult(h)*100);
  const opts=[0,2,5,10];
  return `
    <div style="border-top:1px solid #e8e6e0;margin:16px 0 14px;padding-top:14px">
      <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:8px">Horas para ${first} esta semana</div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        ${opts.map(v=>{
          const sel=h===v;
          return `<div onclick="setAthleteHours(${v})" style="flex:1;text-align:center;padding:8px 4px;border-radius:8px;border:1.5px solid ${sel?'#534AB7':'#e0dfd8'};background:${sel?'#EEEDFE':'#fff'};cursor:pointer;font-size:13px;font-weight:${sel?'600':'400'};color:${sel?'#534AB7':'#555'};transition:all .15s">${v}h</div>`;
        }).join('')}
      </div>
      ${h>0?`<div style="font-size:12px;color:#c07a10">–${h}h para ti · +${h}h para ${first} · tu entrenamiento al <strong>${effPct}%</strong></div>`
           :`<div style="font-size:12px;color:#aaa">Sin horas asignadas — entrenas al 100%</div>`}
    </div>`;
}
function lifeAthleteEffMult(h){
  // 0h=100%, 2h=90%, 5h=75%, 10h=60%
  if(h<=0)return 1.0;
  if(h<=2)return 0.90;
  if(h<=5)return 0.75;
  return 0.60;
}
window.setAthleteHours=h=>{
  const prev=G.lifeAthleteHours||0;
  G.lifeAthleteHours=h;
  const first=G.lifeAthlete?esc(G.lifeAthlete.name.split(' ')[0]):'el atleta';
  if(h>0)showToast(`–${h}h para ti · +${h}h para ${first}`,'#c07a10');
  else showToast('Entrenas al 100% — sin horas para el atleta','#4a90d9');
  // Re-render solo el bloque de horas para no perder scroll
  const block=document.querySelector('[data-athlete-hours]');
  if(block)block.outerHTML=renderAthleteHoursBlock();
  else render();
};
// ── PRE-RACE PREP (Tanda 7) ────────────
function renderPreRacePrep(){
  const el=document.getElementById('main');
  const race=G.selectedRaces[G.currentRaceIdx];
  if(!race){G.screen='preRace';render();return;}
  const isUltra=race.km>=40;
  const rep=getReputationBonus(race.id);
  const abandon=getAbandonPenalty();
  const altPenalty=getAltitudePenalty(race);
  const sel=G.preRaceNutrition||'pasta';
  const bag=G.dropbagItems||[];

  el.innerHTML=`
    <h2>Preparación previa</h2>
    <p class="sub">${race.name} · ${race.type}</p>

    ${rep?`<div class="note"><strong>${rep.label}</strong> — +${rep.statBonus.mental} Mental esta carrera${rep.sponsorBonus?' · Sponsors lo valoran':''}</div>`:''}
    ${abandon?`<div class="warn">⚠ ${abandon.label} — los sponsors reducen sus ofertas (×${abandon.sponsorMult})</div>`:''}
    ${altPenalty>0?`<div class="warn">⚠ Carrera de alta altitud — sin entrenamiento específico irás un ${Math.round(altPenalty*100)}% más lento en subidas. Club de Alta Montaña o entrenador lo reducen.</div>`:''}
    ${G.injuryType?`<div class="injury-card">
      <div class="injury-type" style="font-size:14px">${INJURY_TYPES[G.injuryType]?.label||'Lesión'} — llegas tocado <button class="tip-btn" onclick="showTip('Tipos de lesión','<strong>Tendinitis</strong> — corres pero con stats reducidos.<br><strong>Rotura muscular</strong> — 2 carreras bloqueadas (1 con fisio).<br><strong>Fractura de estrés</strong> — 4 carreras bloqueadas (2 con fisio).<br><br>El <strong>fisioterapeuta</strong> reduce el bloqueo a la mitad. Sin él, una fractura puede destrozarte media temporada. La carga corporal alta es la principal causa.')">ⓘ</button></div>
      <div style="font-size:12px;color:#555;margin-top:4px">
        Energía inicial: <strong>${INJURY_TYPES[G.injuryType]?.nextRaceStats?.energy||80}%</strong> ·
        Piernas: <strong>${INJURY_TYPES[G.injuryType]?.nextRaceStats?.legs||70}%</strong> ·
        Hidratación: <strong>${INJURY_TYPES[G.injuryType]?.nextRaceStats?.hydration||80}%</strong>
      </div>
      ${hasFisio()?`<div class="text-ok">El fisio reduce el impacto.</div>`:'<div style="font-size:12px;color:#c0392b;margin-top:4px">Sin fisio el impacto es máximo. Considera ir conservador.</div>'}
    </div>`:''}

    <div class="section-label">Nutrición la noche antes <button class="tip-btn" onclick="showTip('Nutrición pre-carrera','Lo que comes la noche antes afecta tu <strong>energía inicial</strong> en carrera. Las opciones básicas están siempre disponibles. Las avanzadas (ayuno glucémico, protocolo pro) se desbloquean con años de experiencia.<br><br>Algunas opciones tienen <strong>coste económico</strong>. Si tienes una lesión activa, la energía inicial parte ya penalizada independientemente de la nutrición.')">ⓘ</button></div>
    ${PRE_RACE_NUTRITION.map(n=>{
      const avail=isNutritionAvailable(n);
      const cost=getNutritionCost(n.id);
      const isSel=sel===n.id;
      return `<div class="work-card ${isSel?'sel':''} ${!avail.ok?'locked-work':''}" onclick="${avail.ok?'setPreNutrition(\''+n.id+'\')':''}">
        <div class="flex-between">
          <div style="flex:1">
            <div class="card-title">${n.label}</div>
            <div class="card-sub">${n.desc}</div>
            ${!avail.ok?`<div style="font-size:12px;color:#aaa;margin-top:2px">🔒 ${avail.reason}</div>`:''}
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:10px;font-size:12px">
            ${n.energyBonus>0?`<div style="color:#4a8a2a">+${n.energyBonus} energía</div>`:
              n.energyBonus<0?`<div style="color:#c07a10">${n.energyBonus} energía</div>`:
              `<div style="color:#aaa">sin bonus</div>`}
            ${cost>0?`<div style="color:#c0392b;margin-top:2px">€${cost}</div>`:''}
          </div>
        </div>
      </div>`;}).join('')}

    ${isUltra?`
    <div class="section-label">Dropbag (máx. 2 items) <button class="tip-btn" onclick="showTip('Dropbag','Disponible en ultras de 40km+. Dejas hasta <strong>2 items</strong> en el avituallamiento central antes de salir.<br><br>Puedes usarlos <strong>una sola vez</strong> al pasar por ese avituallamiento en carrera. Elige según tus puntos débiles: energía, hidratación o recuperación de piernas.<br><br>Si no ves la opción de usar la dropbag en el avituallamiento, es que todavía no has llegado al punto donde la dejaste.')">ⓘ</button></div>
    <div style="font-size:12px;color:#888;margin-bottom:10px">Deja una bolsa en el avituallamiento central con material extra</div>
    ${DROPBAG_OPTIONS.map(d=>{
      const isSel=bag.includes(d.id);
      const maxed=!isSel&&bag.length>=2;
      return `<div class="dropbag-item ${isSel?'sel-bag':''} ${maxed?'disabled':''}" onclick="${maxed?'':'toggleDropbag(\''+d.id+'\')'}">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${d.label}${isSel?' ✓':''}</div>
          <div style="font-size:12px;color:#888">${d.desc}</div>
        </div>
      </div>`;}).join('')}`:''}

    <div class="section-label">🧃 Geles en el bolsillo <button class="tip-btn" onclick="showTip('Geles en carrera','Lleva geles en el bolsillo para usarlos en cualquier tramo, sin esperar al avituallamiento.<br><br>Cada gel da <strong>+18 energía</strong> (o +22 con sponsor nutrición) y cuesta <strong>€2</strong>. Máximo 5 geles.<br><br>En carreras cortas (−20km) llevar muchos no tiene sentido. Para ultras, pueden ser decisivos en el último tercio.')">ⓘ</button></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;padding:10px 14px;background:#fff;border:1px solid #e0dfd8;border-radius:10px">
      <button class="secondary" onclick="G.gelsCarried=Math.max(0,(G.gelsCarried||0)-1);render()" style="padding:6px 14px;font-size:16px" ${!(G.gelsCarried>0)?'disabled':''}>−</button>
      <div style="flex:1;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#4a8a2a">${G.gelsCarried||0}</div>
        <div style="font-size:12px;color:#aaa">geles · €${(G.gelsCarried||0)*2} · +${(G.gelsCarried||0)*18} energía potencial</div>
      </div>
      <button class="secondary" onclick="G.gelsCarried=Math.min(5,(G.gelsCarried||0)+1);render()" style="padding:6px 14px;font-size:16px" ${G.gelsCarried>=5?'disabled':''}>+</button>
    </div>
    ${(G.gelsCarried||0)>0?`<div class="note" style="margin-bottom:12px">Llevas ${G.gelsCarried} gel${G.gelsCarried>1?'es':''} (€${G.gelsCarried*2}). Úsalos en cualquier tramo pulsando el botón que aparecerá en carrera.</div>`:''}

    <div class="section-label">🏃 Calentamiento <button class="tip-btn" onclick="showTip('Calentamiento','20 minutos de calentamiento antes de la salida.<br><br><strong>Coste:</strong> −5 Energía inicial.<br><strong>Beneficio:</strong> +4 Velocidad y +3 Subida durante toda la carrera.<br><br>Vale la pena en carreras cortas (−25km) donde la velocidad importa desde el primer tramo. Para ultras, el coste de energía no compensa.')">ⓘ</button></div>
    <div class="work-card ${G.warmedUp?'sel':''}" onclick="G.warmedUp=!G.warmedUp;render()" style="${G.warmedUp?'border-color:#4a8a2a;background:#f2faf0;':''}">
      <div class="flex-between-center">
        <div>
          <div class="card-title">Calentar 20 minutos</div>
          <div class="card-sub">−5 energía · +4 Velocidad · +3 Subida durante la carrera</div>
          ${race.km>25?`<div style="font-size:12px;color:#c07a10;margin-top:2px">En ultras el coste de energía puede no compensar</div>`:`<div style="font-size:12px;color:#4a8a2a;margin-top:2px">Para esta distancia es una buena decisión</div>`}
        </div>
        <span style="font-size:18px;color:${G.warmedUp?'#4a8a2a':'#ddd'}">${G.warmedUp?'✓':'○'}</span>
      </div>
    </div>

    <button class="main" style="margin-top:12px" onclick="G.screen='preRace';render()">Confirmar y ver briefing →</button>`;
}
window.setPreNutrition=id=>{G.preRaceNutrition=id;render();};
window.toggleDropbag=id=>{
  if(!G.dropbagItems)G.dropbagItems=[];
  const idx=G.dropbagItems.indexOf(id);
  if(idx>=0)G.dropbagItems.splice(idx,1);
  else if(G.dropbagItems.length<2)G.dropbagItems.push(id);
  render();
};

// ══════════════════════════════════════
//  CONDICIÓN DEL DÍA DE CARRERA
// ══════════════════════════════════════
function renderMidSeasonCalendar(){
  const el=document.getElementById('main');
  const doneNames=G.raceResults.map(r=>r.name);
  const selIds=G.selectedRaces.map(r=>r.id);
  const spent=G.selectedRaces.reduce((a,r)=>a+r.cost,0);
  const canAccess=r=>r.zegamaSpecial?(G.ranking<=20||G.zegamaQual):(r.reqRanking>=G.ranking||r.reqRanking===999);
  const tierColor=TIER_COLOR_RACE;
  const tierLabel=TIER_LABEL_RACE;
  const qLabel={1:'Primer trimestre',2:'Segundo trimestre',3:'Tercer trimestre',4:'Cuarto trimestre'};
  // uses global QUARTERS

  function raceRow(r){
    const isDone=doneNames.includes(r.name);
    const isSel=selIds.includes(r.id);
    const locked=!canAccess(r);
    const noMoney=!isSel&&(spent+r.cost>G.money);
    if(isDone){
      return `<div class="race-card" style="opacity:0.45;cursor:default">
        <div class="flex-between-center">
          <div><div style="font-size:14px;font-weight:600;color:#888">${r.name}</div>
          <div style="font-size:12px;color:#bbb">${r.monthName} · ya corrida</div></div>
          <span style="font-size:12px;color:#4a8a2a;font-weight:600">✓ hecha</span>
        </div>
      </div>`;
    }
    return `<div class="race-card ${isSel?'sel':locked?'locked':''}" onclick="${locked?'':'toggleRaceMid(\''+r.id+'\')'}">
      <div class="flex-between">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:2px">
            <span class="card-title">${esc(r.name)}</span>
            <span style="font-size:12px;font-weight:600;padding:1px 5px;border-radius:3px;background:${tierColor[r.tier]||'#888'}22;color:${tierColor[r.tier]||'#888'}">${tierLabel[r.tier]||''}</span>
          </div>
          <div style="font-size:12px;color:#888">${r.monthName} · ${r.type} · ${r.desnivel}</div>
          ${locked?(r.zegamaSpecial?`<div style="font-size:12px;color:#c07a10;margin-top:2px">🏔️ Invitación Top 20 o clasificación por tiempo (corte 4h20)</div>`:`<div style="font-size:12px;color:#ccc;margin-top:2px">🔒 Ranking #${r.reqRanking} requerido</div>`):''}
          ${noMoney&&!isSel?`<div class="text-warn">Sin presupuesto</div>`:''}
        </div>
        <div class="right-col">
          <div style="font-size:13px;font-weight:600;color:#4a8a2a">€${r.prize}</div>
          <div style="font-size:12px;color:#aaa">€${r.cost} inscr.</div>
          ${isSel?`<div style="font-size:12px;color:#4a8a2a;font-weight:600;margin-top:2px">✓</div>`:''}
        </div>
      </div>
    </div>`;
  }

  el.innerHTML=`
    <h2>Modificar calendario</h2>
    <p class="sub">Las carreras ya corridas no se pueden cambiar</p>
    ${QUARTERS.map(q=>{
      const races=RACES_DB.filter(r=>r.quarter===q.n);
      const specRaces=getSpecRaces().filter(r=>r.quarter===q.n);
      const allQ=[...races,...specRaces];
      const qSel=allQ.filter(r=>selIds.includes(r.id)).length;
      const qDone=allQ.filter(r=>doneNames.includes(r.name)).length;
      const isOpen=(G.openQuarters?.mid||[]).includes(q.n);
      return `
        <div class="quarter-wrap">
          <div class="quarter-toggle ${qSel>0?'has-sel':''}" onclick="toggleQMid(${q.n})">
            <span style="font-size:14px;font-weight:600;flex:1">${qLabel[q.n]}
              <span style="font-size:12px;font-weight:400;color:#aaa"> · ${q.months}</span>
            </span>
            ${qDone>0?`<span style="font-size:12px;color:#4a8a2a;margin-right:6px">${qDone} ✓ hecha${qDone>1?'s':''}</span>`:''}
            ${qSel>qDone?`<span style="font-size:12px;color:#4a90d9;margin-right:6px">${qSel-qDone} pendiente${qSel-qDone>1?'s':''}</span>`:''}
            <span style="font-size:12px;color:#aaa;display:inline-block;transform:${isOpen?'rotate(90deg)':''};transition:transform .2s">▶</span>
          </div>
          <div class="quarter-content ${isOpen?'open':''}" onclick="event.stopPropagation()">
            ${races.map(r=>raceRow(r)).join('')}
            ${specRaces.length>0?`
              <div style="font-size:12px;color:#4a8a2a;font-weight:600;padding:6px 2px 4px">★ Específicas de tu especialidad</div>
              ${specRaces.map(r=>raceRow(r)).join('')}
            `:''}
          </div>
        </div>`;}).join('')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
      <button class="main" onclick="G.screen='betweenManage';render()" style="margin-top:0">← Volver</button>
      <button class="main" onclick="afterRace()" style="margin-top:0">Confirmar →</button>
    </div>`;
}

window.toggleQMid=q=>{
  if(!G.openQuarters)G.openQuarters={cal:[],mid:[],tab:[]};
  const arr=G.openQuarters.mid;
  const idx=arr.indexOf(q);
  if(idx>=0)arr.splice(idx,1);else arr.push(q);
  render();
};

window.toggleRaceMid=id=>{
  const race=RACES_DB.find(r=>r.id===id);if(!race)return;
  const idx=G.selectedRaces.findIndex(r=>r.id===id);
  if(idx>=0&&idx>=G.currentRaceIdx){
    G.selectedRaces.splice(idx,1);
  } else if(idx<0){
    const spent=G.selectedRaces.reduce((a,r)=>a+r.cost,0);
    if(spent+race.cost>G.money){alert('Sin presupuesto para esta inscripción.');return;}
    // Insertar en la posición correcta según mes
    const insertAt=G.selectedRaces.findIndex((r,i)=>i>=G.currentRaceIdx&&r.month>race.month);
    if(insertAt===-1)G.selectedRaces.push(race);
    else G.selectedRaces.splice(insertAt,0,race);
  }
  render();
};

// ── CIRCUITS ───────────────────────────
function renderCircuits(){
  const el=document.getElementById('main');
  el.innerHTML=`
    <h2>Circuitos y ligas</h2>
    <p class="sub">Únete a un circuito para ganar puntos extra y premios al final del año</p>
    ${CIRCUITS_DB.map(c=>{
      const joined=G.joinedCircuits.includes(c.id);
      const locked=c.reqRanking&&G.ranking>c.reqRanking;
      const pts=G.circuitPoints[c.id]||0;
      const raceNames=c.raceIds.map(id=>{
        const r=[...RACES_DB,...getSpecRaces()].find(x=>x.id===id);
        return r?r.name:id;
      });
      return `<div class="circuit-card ${joined?'joined':''}" onclick="${locked?'':'toggleCircuit(\''+c.id+'\')'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div style="flex:1">
            <div style="font-size:15px;font-weight:600;color:${c.color}">${c.name}</div>
            <div class="card-sub">${c.desc}</div>
          </div>
          ${joined?`<span style="font-size:12px;color:#c07a10;font-weight:600;flex-shrink:0;margin-left:10px">✓ Unido</span>`:''}
          ${locked?`<span style="font-size:12px;color:#ccc;flex-shrink:0;margin-left:10px">🔒</span>`:''}
        </div>
        <div style="font-size:12px;color:#aaa;margin-bottom:8px">Carreras: ${raceNames.join(' · ')}</div>
        <div style="font-size:12px;color:#4a8a2a;margin-bottom:6px">Premio: ${c.prize}</div>
        ${joined?`<div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px">
          <span style="color:#888">Puntos acumulados</span>
          <span style="font-weight:600;color:#c07a10">${pts} / ${c.pointsForPrize}</span>
        </div>
        <div style="height:4px;background:#e8e6e0;border-radius:2px;margin-top:4px;overflow:hidden">
          <div style="height:100%;width:${Math.min(100,Math.round(pts/c.pointsForPrize*100))}%;background:#c07a10;border-radius:2px"></div>
        </div>`:''}
      </div>`;}).join('')}
    <button class="main" style="margin-top:8px" onclick="G.screen='seasonStart';render()">← Volver</button>`;
}
window.toggleCircuit=id=>{
  const idx=G.joinedCircuits.indexOf(id);
  if(idx>=0)G.joinedCircuits.splice(idx,1);
  else G.joinedCircuits.push(id);
  render();
};

// ── FAME TAB ───────────────────────────
function renderFameTab(){
  const el=document.getElementById('main');
  const f=G.followers||0;
  const level=fameLevel();
  const nextLevel=FAME_THRESHOLDS.find(t=>t.followers>f);
  const availH=availableFameHours();
  const hasRecentRace=G.raceResults.length>0;
  const hasSponsor=Object.values(G.sponsors).some(Boolean);
  el.innerHTML=`
    <h2>Reputación</h2>
    <p class="sub">${esc(G.runner.name||'Corredor')} · ${f.toLocaleString()} seguidores</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div class="fame-stat">
        <div style="font-size:12px;color:#aaa;margin-bottom:4px">Seguidores</div>
        <div style="font-size:18px;font-weight:700;color:#c07a10">${f>=1000?(f/1000).toFixed(1)+'K':f}</div>
        <div class="followers-bar"><div class="followers-fill" style="width:${nextLevel?Math.min(100,Math.round(f/nextLevel.followers*100)):100}%"></div></div>
      </div>
      <div class="fame-stat">
        <div style="font-size:12px;color:#aaa;margin-bottom:4px">Nivel</div>
        <div style="font-size:13px;font-weight:700">${level?level.label:'Desconocido'}</div>
        <div style="font-size:12px;color:#aaa;margin-top:3px">${level?level.benefit:nextLevel?'→ '+nextLevel.followers.toLocaleString()+' seg':''}</div>
      </div>
    </div>
    ${nextLevel?`<div style="font-size:12px;color:#888;margin-bottom:14px">Próximo nivel: <strong>${nextLevel.label}</strong> a ${(nextLevel.followers-f).toLocaleString()} seguidores</div>`:''}
    ${(()=>{const wo=curWorkOpt();const blockH=G.trainingBlockHours||8;const totalH=(wo?.trainingH||5)+vacTrainingHBonus(G.currentQuarter||1);const repH=Math.max(0,totalH-blockH);return `<div style="display:flex;justify-content:space-between;font-size:13px;color:#888;margin-bottom:4px">
      <span>Horas disponibles</span>
      <span style="font-weight:600;color:${availH<=2?'#c0392b':availH<=5?'#c07a10':'#1a1a1a'}">${availH}h</span>
    </div>
    <div style="font-size:12px;color:#aaa;margin-bottom:8px">${totalH}h trabajo − ${blockH}h bloque = ${repH}h reputación · usadas: ${G.fameHoursUsed||0}h</div>`;})()}
    ${availH<=2?`<div class="warn">Pocas horas disponibles — más actividad en redes reducirá tu tiempo de entrenamiento.</div>`:''}
    ${(G.repInvitations||[]).length>0?`<div class="card" style="margin-bottom:14px;border-color:#2d7a2d">
      <div style="font-size:13px;font-weight:700;color:#2d7a2d;margin-bottom:8px">📩 Invitaciones disponibles esta temporada</div>
      ${G.repInvitations.map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:0.5px solid #e8e6e0">
        <div>
          <div style="font-size:13px;font-weight:600">${esc(r.name)}</div>
          <div style="font-size:12px;color:#888">${r.tier} · ${r.monthName||''}</div>
        </div>
        <button class="secondary" onclick="addRepInvitation('${r.id}')" style="font-size:12px;padding:4px 10px">Añadir →</button>
      </div>`).join('')}
    </div>`:''}
    <div class="section-label">Acciones disponibles</div>
    ${FAME_ACTIONS.map(a=>{
      const done=G.fameActionsThisSeason[a.id]||0;
      const onCooldown=done>=a.cooldown;
      const noHours=availH<a.hours;
      const noSponsor=a.reqSponsor&&!hasSponsor;
      const noRace=a.reqLastRace&&!hasRecentRace;
      const disabled=onCooldown||noHours||noSponsor||noRace;
      let reason='';
      if(onCooldown)reason='Límite de esta temporada alcanzado';
      else if(noSponsor)reason='Necesitas un sponsor activo';
      else if(noRace)reason='Necesitas haber corrido una carrera primero';
      else if(noHours)reason='Sin horas disponibles';
      return `<div class="fame-action ${disabled?'fame-disabled':''}" onclick="${disabled?'':'doFameAction(\''+a.id+'\')'}">
        <div class="flex-between">
          <div style="flex:1">
            <div class="card-title">${a.icon} ${a.label}</div>
            <div class="card-sub">${a.desc}</div>
            ${reason?`<div class="text-warn">${reason}</div>`:''}
          </div>
          <div class="right-col">
            <div style="font-size:12px;color:#888">-${a.hours}h</div>
            <div style="font-size:12px;color:#c07a10;font-weight:600">+${a.followers} seg.</div>
            ${a.income?`<div style="font-size:12px;color:#4a8a2a">+€${a.income}</div>`:''}
            <div style="font-size:12px;color:#ccc">${done}/${a.cooldown} usado</div>
          </div>
        </div>
      </div>`;}).join('')}`;
}
window.doFameAction=id=>{
  const a=FAME_ACTIONS.find(x=>x.id===id);if(!a)return;
  const availH=availableFameHours();
  if(availH<a.hours){alert('Sin horas disponibles.');return;}
  G.fameHoursUsed=(G.fameHoursUsed||0)+a.hours;
  G.followers=(G.followers||0)+a.followers;
  G.fameActionsThisSeason[id]=(G.fameActionsThisSeason[id]||0)+1;
  if(a.income)G.money+=a.income;
  if(a.statBonus)Object.entries(a.statBonus).forEach(([k,v])=>{G.runner.stats[k]=Math.min(100,(G.runner.stats[k]||0)+v);});
  showToast('+'+a.followers+' seguidores 📱','#4a90d9');
  checkFollowerThresholds();
  render();
};
window.addRepInvitation=id=>{
  const inv=(G.repInvitations||[]).find(r=>r.id===id);
  if(!inv)return;
  if(!G.selectedRaces.find(r=>r.id===id))G.selectedRaces.push(inv);
  G.repInvitations=(G.repInvitations||[]).filter(r=>r.id!==id);
  showToast('📩 '+inv.name+' añadida al calendario','#2d7a2d');
  render();
};
// ── BETWEEN RACE MANAGEMENT ────────────
// ── CLUB SETUP ─────────────────────────
function renderBetweenManage(){
  const el=document.getElementById('main');
  const load=getBodyLoad();
  const nextRace=G.selectedRaces[G.currentRaceIdx];
  const hasFisioContract=G.spending.fisio||G.club?.hasFisio;
  const FISIO_OPTIONS=[
    {id:'session',label:'Sesión de fisio',cost:40,loadRedux:15,desc:'Una sesión rápida. Baja la carga y reduces riesgo de lesión.'},
    {id:'massage',label:'Masaje deportivo',cost:25,loadRedux:8,desc:'Menos intenso pero más barato. Buena recuperación muscular.'},
    {id:'rest',label:'Descanso activo',cost:0,loadRedux:5,desc:'Sin coste. Movilidad suave y stretching.'},
  ];
  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px">
      <h2>Entre carreras</h2>
      <span style="font-size:12px;color:#999;padding-top:5px">${G.currentRaceIdx}/${G.selectedRaces.length} corridas</span>
    </div>
    <p class="sub">${nextRace?'Próxima: '+nextRace.name:'Fin de temporada'}</p>
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:4px">
        <span>Carga corporal</span>
        <span style="color:${load>=70?'#c0392b':load>=50?'#c07a10':'#888'}">${load}%</span>
      </div>
      <div class="load-bar-track"><div class="bar-fill" style="width:${load}%;background:${load>=70?'#c0392b':load>=50?'#c07a10':'#4a90d9'}"></div></div>
      ${load>=70?`<div style="font-size:12px;color:#c0392b;margin-top:4px">Carga alta — considera recuperar antes de la próxima.</div>`:
        load>=50?`<div style="font-size:12px;color:#c07a10;margin-top:4px">Carga moderada. Una sesión te vendrá bien.</div>`:''}
    </div>
    <div class="section-label">Recuperación${G._recoveryUsed?' <span style="font-size:12px;color:#aaa;font-weight:400">(1 acción usada)</span>':''}</div>
    ${FISIO_OPTIONS.map(o=>{
      const cantAfford=o.cost>0&&o.cost>G.money;
      const alreadyUsed=!!G._recoveryUsed;
      const disabled=cantAfford||alreadyUsed;
      let reason='';
      if(alreadyUsed)reason='Ya has usado una acción de recuperación';
      else if(cantAfford)reason='Sin presupuesto';
      return `<div class="work-card ${disabled?'locked-work':''}" onclick="${disabled?'':'doRecovery(\''+o.id+'\')'}">
        <div class="flex-between">
          <div style="flex:1">
            <div class="card-title">${o.label}</div>
            <div class="card-sub">${o.desc}</div>
            ${reason?`<div class="text-warn">${reason}</div>`:''}
          </div>
          <div class="right-col">
            ${o.cost>0?`<div style="font-size:13px;font-weight:600;color:#c0392b">-€${o.cost}</div>`:`<div style="font-size:13px;font-weight:600;color:#888">Gratis</div>`}
            <div style="font-size:12px;color:#4a8a2a">carga -${o.loadRedux}%</div>
          </div>
        </div>
      </div>`;}).join('')}
    ${hasFisioContract?`<div class="note">Fisio contratado — ya estás cubierto. Las sesiones puntuales son extra.</div>`:''}
    <div class="divider"></div>
    <div class="section-label">Otras opciones</div>
    <div class="work-card" onclick="G.screen='midSeasonCalendar';render()" style="margin-bottom:14px">
      <div class="card-title">📅 Modificar calendario pendiente</div>
      <div class="card-sub">Añade o quita carreras que aún no has corrido</div>
    </div>
    <div class="work-card" onclick="G._clubFromBetween=true;G.screen='clubSetup';render()" style="margin-bottom:14px">
      <div class="card-title">🏃 ${G.club&&G.club.id!=='none'?'Club: '+G.club.name:'Unirse a un club'}</div>
      <div class="card-sub">${G.club&&G.club.id!=='none'?'Ver reputación o cambiar de club':'Sin club actualmente — explorar opciones'}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${G._raceResultHTML?`<button class="main" onclick="G.screen='raceResult';render()" style="margin-top:0;background:#f5f4f0;color:#1a1a1a;border-color:#ccc">← Ver resumen</button>`:'<div></div>'}
      <button class="main" onclick="afterRace()" style="margin-top:0">Siguiente carrera →</button>
    </div>`;
}
window.doRecovery=id=>{
  if(G._recoveryUsed){showToast('Ya has usado una acción de recuperación','#c07a10');return;}
  const opts={session:{cost:40,loadRedux:15},massage:{cost:25,loadRedux:8},rest:{cost:0,loadRedux:5}};
  const o=opts[id];if(!o)return;
  if(o.cost>G.money){alert('Sin presupuesto.');return;}
  G.money-=o.cost;
  G.bodyLoad=Math.max(0,G.bodyLoad-o.loadRedux);
  G._recoveryUsed=true;
  showToast(`Carga -${o.loadRedux}%${o.cost>0?' · -€'+o.cost:''}`,'#4a8a2a');
  render();
};
function renderBetweenRace(){
  const el=document.getElementById('main');const ev=G.pendingEvent;
  if(!ev){goNextRace();return;}
  el.innerHTML=`
    <div style="font-size:12px;font-weight:600;color:#aaa;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Entre carreras</div>
    <h2>${ev.title}</h2>
    <p style="font-size:14px;color:#555;margin:6px 0 20px;line-height:1.65">${ev.desc}</p>
    <div style="display:grid;gap:8px">
      ${ev.choices.map((c,i)=>`<div class="pace" onclick="handleEv('${ev.id}',${i})"><div class="pace-label" style="font-size:14px;margin-bottom:0">${c.text}</div></div>`).join('')}
    </div>`;
}

// ── SEASON BALANCE ─────────────────────
function renderSeasonBalance(){
  const el=document.getElementById('main');
  const annualWork=monthlyWorkIncome()*12;
  const annualSponsor=sponsorAnnual();
  const annualFixed=FIXED_COSTS.total*12;
  const annualClub=(G.club?.cost||0)*12;
  const raceIncome=G.raceResults.reduce((a,r)=>a+r.prize,0);
  const raceCosts=G.selectedRaces.reduce((a,r)=>a+r.cost,0);
  const yearNet=annualWork+annualSponsor+raceIncome-annualFixed-annualClub-raceCosts-
    (G.spending.fisio?200:0)-(G.spending.entrenador?250:0)-(G.spending.suplementos?100:0);
  el.innerHTML=`
    <h2>Balance Temporada ${G.year}</h2>
    <p class="sub">${esc(G.runner.name)} · Año ${G.year} completado</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:#f5f4f0;border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Km temporada</div>
        <div style="font-size:20px;font-weight:700;color:#4a90d9">${G.seasonKm||0} km</div>
      </div>
      <div style="background:#f5f4f0;border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Km carrera total</div>
        <div style="font-size:20px;font-weight:700;color:#4a8a2a">${G.totalCareerKm||0} km</div>
      </div>
    </div>
    ${G.joinedCircuits.length>0?`<div style="margin-bottom:14px">
      <div class="section-label">Circuitos</div>
      ${G.joinedCircuits.map(cid=>{
        const c=CIRCUITS_DB.find(x=>x.id===cid);if(!c)return '';
        const pts=G.circuitPoints[cid]||0;
        const completed=G.circuitCompleted.includes(cid)||pts>=c.pointsForPrize;
        return `<div class="card">
          <div style="font-size:14px;font-weight:600;color:${c.color}">${c.name}</div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:6px">
            <span style="color:#888">Puntos acumulados</span>
            <span style="font-weight:600;color:${completed?'#4a8a2a':'#c07a10'}">${pts} / ${c.pointsForPrize}</span>
          </div>
          ${completed?`<div class="note" style="margin-top:8px;margin-bottom:0">🏆 Circuito completado — Premio: +€${c.reward.money}</div>`:
            `<div style="font-size:12px;color:#aaa;margin-top:6px">Faltan ${c.pointsForPrize-pts} puntos para el premio</div>`}
        </div>`;}).join('')}
    </div>`:''}

    <div class="section-label">Carreras</div>
    ${G.raceResults.length===0?'<p style="font-size:13px;color:#aaa;margin-bottom:14px">Sin carreras completadas.</p>':
      `<div style="margin-bottom:14px">${G.raceResults.map(r=>{
        if(r.injured) return `<div style="padding:9px 0;border-bottom:1px solid #eee">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:14px">
            <div><span style="font-size:13px;color:#c0392b;margin-right:8px;font-weight:600">❌</span>${r.name}</div>
            <span style="font-size:12px;color:#c0392b;font-weight:600">No participó</span>
          </div>
          <div style="font-size:12px;color:#c0392b;margin-top:3px">${r.injuryLabel||'Lesión'} — baja forzada · €0 premio</div>
        </div>`;
        return `<div style="padding:9px 0;border-bottom:1px solid #eee">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:14px">
            <div>
              <span style="font-size:13px;color:${r.pos===1?'#c07a10':r.pos<=3?'#4a8a2a':'#888'};margin-right:8px;font-weight:600">${r.pos}º</span>
              ${r.name}
            </div>
            <span style="font-size:13px;color:#888">${fmt(r.time)} · <span style="color:#2d7a2d">+€${r.prize}</span></span>
          </div>
          ${r.catPos&&r.catTotal>1?`<div style="margin-top:4px"><span style="font-size:12px;background:#e8eef8;color:#2d4fa0;border-radius:4px;padding:1px 7px;font-weight:600">${r.catName} ${r.catPos}º / ${r.catTotal}</span></div>`:''}
          ${r.injuryType?`<div style="font-size:12px;color:#c0392b;margin-top:4px">
            ⚠ ${r.injuryLabel||r.injuryType}${r.kmAtInjury?' (km '+r.kmAtInjury+')':''} · stats: ${Object.entries(INJURY_TYPES[r.injuryType]?.statPenalty||{}).map(([k,v])=>v+' '+k).join(', ')}
          </div>`:''}
        </div>`;}).join('')}</div>`}

    <div class="section-label">Cuenta anual</div>
    <div class="card" style="margin-bottom:16px">
      <table class="eco-table">
        ${annualWork>0?`<tr><td>Trabajo (${G.workPct}%)</td><td class="right plus">+€${annualWork}</td></tr>`:''}
        ${annualSponsor>0?`<tr><td>Patrocinios</td><td class="right plus">+€${annualSponsor}</td></tr>`:''}
        ${raceIncome>0?`<tr><td>Premios de carrera</td><td class="right plus">+€${raceIncome}</td></tr>`:''}
        <tr><td>Gastos fijos de vida</td><td class="right minus">-€${annualFixed}</td></tr>
        ${annualClub>0?`<tr><td>Club (${G.club?.name})</td><td class="right minus">-€${annualClub}</td></tr>`:''}
        ${raceCosts>0?`<tr><td>Inscripciones y viajes</td><td class="right minus">-€${raceCosts}</td></tr>`:''}
        ${G.spending.fisio?`<tr><td>Fisioterapeuta</td><td class="right minus">-€200</td></tr>`:''}
        ${G.spending.entrenador?`<tr><td>Entrenador</td><td class="right minus">-€250</td></tr>`:''}
        ${G.spending.suplementos?`<tr><td>Suplementos</td><td class="right minus">-€100</td></tr>`:''}
        ${Object.values(G.workChangePenalties||{}).reduce((a,v)=>a+(v?.amount||v||0),0)>0?`<tr><td>Penalización cambios jornada</td><td class="right minus">-€${Object.values(G.workChangePenalties||{}).reduce((a,v)=>a+(v?.amount||v||0),0)}</td></tr>`:''}        <tr><td class="total">Resultado del año</td><td class="right total ${yearNet>=0?'plus':'minus'}">${yearNet>=0?'+':''}€${yearNet}</td></tr>
      </table>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="sec-title-sm">Stats tras entrenamiento</div>
      ${Object.entries(G.runner.stats).map(([k,v])=>srow(k.charAt(0).toUpperCase()+k.slice(1),v)).join('')}
    </div>

    <div class="section-label">¿En qué inviertes para la próxima temporada?</div>
    <p style="font-size:13px;color:#aaa;margin-bottom:10px">Ahorros actuales: €${Math.max(0,G.money+yearNet)}</p>
    ${[['fisio','Fisioterapeuta','Reduce riesgo de lesión. Recuperación más rápida.',200],['entrenador','Entrenador personal','Bloques de entrenamiento +20% efectivos.',250],['suplementos','Suplementos y nutrición','Avituallamientos más eficaces. +3 Nutrición.',100]].map(([id,l,d,cost])=>`
      <div class="aid-row ${G.spending[id]?'sel-aid':''}" onclick="toggleSpend('${id}',${cost},${yearNet})">
        <div><div class="aid-name">${l}${G.spending[id]?` <span style="font-size:12px;color:#4a90d9;font-weight:400">· contratado</span>`:''}</div><div class="aid-effect">${d}</div></div>
        <span class="aid-time" style="font-size:13px;font-weight:600">€${cost}</span>
      </div>`).join('')}

    <button class="main" style="margin-top:14px" onclick="doNextYear(${yearNet})">${G.gameMode==='expres'&&G.year>=3?'Ver resumen final →':`Temporada ${G.year+1} →`}</button>
    ${(G.runner.age||25)>=42&&G.gameMode!=='expres'?`<button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b" onclick="doRetire()">Retirarse — ver resumen de carrera</button>`:''}
    ${G.carreraVida&&G.lifecyclePhase==='overlap'&&(G.runner.age||25)<42?`<button class="main" style="margin-top:6px;border-color:#534AB7;color:#3C3489" onclick="doRetire()">Dejar la competición — pasar a entrenador</button>`:''}
    ${G.gameMode==='expres'&&G.year>=2?`<button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b" onclick="doRetire()">Retiro anticipado — ver resumen</button>`:''}
    ${G.monthlyEvents&&G.monthlyEvents.length>0&&!G.monthlyEvents[0].resolved?`
    <div style="margin-top:18px;border-top:1px solid var(--color-border-tertiary);padding-top:16px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Evento del mes</div>
      <p style="font-size:14px;font-weight:600;margin-bottom:14px">${G.monthlyEvents[0].title}</p>
      <div style="display:grid;gap:8px">
        ${G.monthlyEvents[0].options.map((o,i)=>`<div class="pace" onclick="resolveMonthlyEvent(0,${i})">
          <div class="pace-label" style="font-size:13px;margin-bottom:2px">${o.text}</div>
          <div class="pace-desc">${o.value>0?`+€${o.value}`:o.value<0?`-€${Math.abs(o.value)}`:''} ${o.statBonus?'· '+Object.entries(o.statBonus).map(([k,v])=>'+'+v+' '+k).join(' '):''}${o.loadRedux?'· carga -'+o.loadRedux+'%':''}</div>
        </div>`).join('')}
      </div>
    </div>`:''}`;
}

// ══════════════════════════════════════
//  ACCIONES
// ══════════════════════════════════════
window.selSpec=id=>{G.runner.specialty=id;G.runner.stats=applyAgeToStats({...SPEC_STATS[id]},G.runner.age||25);render();};
window.setWorkQ=(q,pct)=>{
  const wo=WORK_OPTIONS.find(o=>o.pct===pct);if(!wo)return;
  if(!G.workByQuarter)G.workByQuarter={1:100,2:100,3:100,4:100};
  const prevPct=G.workByQuarter[q];
  const prevWo=WORK_OPTIONS.find(o=>o.pct===prevPct);
  const diff=Math.abs(pct-prevPct);
  // Penalización por cambio brusco (>20% diferencia, no es el primer trimestre)
  if(prevWo&&diff>=40&&q>1){
    // Pierde 1 mes de ingresos por romper el acuerdo laboral
    const penalty=Math.round((prevWo.income||0)*1.0);
    if(!G.workChangePenalties)G.workChangePenalties={};
    G.workChangePenalties[q]={amount:penalty,trainingEff:0.65};
  } else if(prevWo&&diff>=20&&q>1){
    // Cambio moderado — pierde 2 semanas de eficiencia
    if(!G.workChangePenalties)G.workChangePenalties={};
    G.workChangePenalties[q]={amount:0,trainingEff:0.80};
  } else {
    if(G.workChangePenalties)delete G.workChangePenalties[q];
  }
  G.workByQuarter[q]=pct;
  G.workPct=G.workByQuarter[G.currentQuarter||1];
  G.trainingHoursPerWeek=wo.trainingH;
  render();
};
window.doStart=()=>{
  if(!(G.runner.name||'').trim())G.runner.name='Corredor';
  G.runner.stats=applyAgeToStats({...SPEC_STATS[G.runner.specialty]},G.runner.age||25);
  G.money=modeCfg().startMoney;
  G.activeTab='game';
  if(G.gameMode==='expres'){
    // Exprés: sin jornada laboral, va al flujo exprés
    G.workPct=60;G.trainingHoursPerWeek=16;
    G.workByQuarter={1:60,2:60,3:60,4:60};
    G._expressSponsorPool=null;
    G.screen='expresSeasonStart';
  } else {
    G.screen='workSetup';
  }
  render();
};
window.toggleRace=id=>{
  const allRaces=[...RACES_DB,...getSpecRaces()];
  const race=allRaces.find(r=>r.id===id);if(!race)return;
  const idx=G.selectedRaces.findIndex(r=>r.id===id);
  if(idx>=0){G.selectedRaces.splice(idx,1);}
  else{
    const spent=G.selectedRaces.reduce((a,r)=>a+r.cost,0);
    if(spent+race.cost>G.money){alert('Sin presupuesto para esta carrera.');return;}
    G.selectedRaces.push(race);
    G.selectedRaces.sort((a,b)=>a.month-b.month);
  }render();
};
window.selectYearObjective=(objId)=>{
  G.yearObjective=objId;
  showToast(`Objetivo elegido: ${SEASON_OBJECTIVES.find(o=>o.id===objId)?.label||''}`, '#4a90d9');
  autoSave();
  render();
};

function renderRankingChart(){
  const hist=getRankingHistory();
  const maxRank=Math.max(...hist.map(h=>h.ranking),100);
  const minRank=Math.min(...hist.map(h=>h.ranking),1);
  const w=320,h=140,padL=38,padR=10,padT=16,padB=26;
  const graphW=w-padL-padR,graphH=h-padT-padB;
  const tx=(i)=>padL+(i/(hist.length-1||1))*graphW;
  const ty=(r)=>padT+((r-minRank)/(maxRank-minRank||1))*graphH;
  const points=hist.map((d,i)=>`${tx(i).toFixed(1)},${ty(d.ranking).toFixed(1)}`).join(' ');
  // Y axis ticks
  const yTicks=[maxRank,Math.round((maxRank+minRank)/2),minRank];
  const yTicksHtml=yTicks.map(v=>`<text x="${padL-4}" y="${(ty(v)+4).toFixed(1)}" text-anchor="end" font-size="10" fill="#666">#${v}</text>`).join('');
  // X axis labels (first and last race)
  const xTicksHtml=`
    <text x="${padL}" y="${h-6}" text-anchor="middle" font-size="10" fill="#888">${hist[0].race}</text>
    <text x="${tx(hist.length-1).toFixed(1)}" y="${h-6}" text-anchor="middle" font-size="10" fill="#888">${hist[hist.length-1].race}</text>`;
  // Dot on last point
  const lastX=tx(hist.length-1),lastY=ty(hist[hist.length-1].ranking);
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;border-radius:8px;background:#f9f9f7">
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+graphH}" stroke="#e0dfd8" stroke-width="0.5"/>
    <line x1="${padL}" y1="${padT+graphH}" x2="${padL+graphW}" y2="${padT+graphH}" stroke="#e0dfd8" stroke-width="0.5"/>
    ${yTicksHtml}
    ${xTicksHtml}
    <polyline points="${points}" fill="none" stroke="#4a90d9" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.5" fill="#4a90d9"/>
    <text x="${padL}" y="${padT-3}" font-size="11" fill="#555" font-weight="600">Evolución ranking</text>
  </svg>`;
}

function renderSavingsChart(){
  const proj=getSavingsProjection();
  const maxMoney=Math.max(...proj.map(p=>p.money),1000);
  const minMoney=Math.max(0,Math.min(...proj.map(p=>p.money)));
  const color=proj[proj.length-1].money>G.money?'#4a8a2a':'#c0392b';
  const w=320,h=140,padL=52,padR=10,padT=16,padB=26;
  const graphW=w-padL-padR,graphH=h-padT-padB;
  const tx=(i)=>padL+(i/(proj.length-1||1))*graphW;
  const ty=(v)=>padT+graphH-((v-minMoney)/(maxMoney-minMoney||1))*graphH;
  const points=proj.map((d,i)=>`${tx(i).toFixed(1)},${ty(d.money).toFixed(1)}`).join(' ');
  // Y axis ticks
  const yMid=Math.round((maxMoney+minMoney)/2);
  const yTicksHtml=[maxMoney,yMid,minMoney].map(v=>`<text x="${padL-4}" y="${(ty(v)+4).toFixed(1)}" text-anchor="end" font-size="10" fill="#666">€${v>=1000?(v/1000).toFixed(1)+'k':v}</text>`).join('');
  // X ticks: hoy y mes 12
  const xTicksHtml=`
    <text x="${padL}" y="${h-6}" text-anchor="middle" font-size="10" fill="#888">Hoy</text>
    <text x="${tx(proj.length-1).toFixed(1)}" y="${h-6}" text-anchor="middle" font-size="10" fill="#888">+12m</text>`;
  const lastX=tx(proj.length-1),lastY=ty(proj[proj.length-1].money);
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;border-radius:8px;background:#f9f9f7">
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+graphH}" stroke="#e0dfd8" stroke-width="0.5"/>
    <line x1="${padL}" y1="${padT+graphH}" x2="${padL+graphW}" y2="${padT+graphH}" stroke="#e0dfd8" stroke-width="0.5"/>
    ${yTicksHtml}
    ${xTicksHtml}
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.5" fill="${color}"/>
    <text x="${padL}" y="${padT-3}" font-size="11" fill="#555" font-weight="600">Proyección ahorros</text>
  </svg>`;
}
window.selectSponsor=(cat,spId)=>{
  const sp=SPONSORS_DB.find(s=>s.id===spId);
  if(!sp)return;
  const cur=G.sponsors[cat];
  if(cur){
    if(cur.id===spId){showToast('Ya es tu sponsor activo — rompe el contrato para cambiarlo','#4a90d9');return;}
    showToast(`Primero rompe el contrato con ${cur.name}`,'#c07a10');return;
  }
  if(!G._pendingSponsors)G._pendingSponsors={};
  // Toggle: si ya está pendiente lo deselecciona, si no lo selecciona
  if(G._pendingSponsors[cat]?.id===spId){
    delete G._pendingSponsors[cat];
  } else {
    G._pendingSponsors[cat]={...sp};
  }
  render();
};
window.confirmSponsors=()=>{
  if(!G._pendingSponsors)return;
  let count=0;
  Object.entries(G._pendingSponsors).forEach(([cat,sp])=>{
    if(!G.sponsors[cat]){
      G.sponsors[cat]=Object.assign({},sp);
      count++;
    }
  });
  G._pendingSponsors={};
  if(count>0)showToast(`✓ ${count} patrocinio${count>1?'s':''} confirmado${count>1?'s':''}`,'#2d7a2d');
  autoSave();render();
};
window.breakSponsorContract=(cat)=>{
  const sp=G.sponsors[cat];
  if(!sp)return;
  const totalValue=sp.salary*sp.duration;
  const penaltyAmount=Math.round(totalValue*0.4);
  // Mostrar confirmación
  const overlay=document.createElement('div');
  overlay.id='break-confirm-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1400;display:flex;align-items:flex-end;justify-content:center;padding-bottom:0';
  overlay.innerHTML=`
    <div style="background:#fff;border-radius:16px 16px 0 0;padding:24px 20px 36px;width:100%;max-width:560px;animation:slideUp 200ms ease-out both">
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">¿Romper contrato con ${sp.name}?</div>
      <div style="font-size:13px;color:#555;line-height:1.65;margin-bottom:16px">
        Duración restante: <strong>${sp.duration} temporada${sp.duration!==1?'s':''}</strong><br>
        Valor total restante: <strong>€${totalValue}</strong><br>
        Penalización (40%): <strong style="color:#c0392b">−€${penaltyAmount}</strong>
      </div>
      <div class="danger" style="margin-bottom:16px;font-size:13px">Una vez roto, perderás el bono <strong>${sp.bonus}</strong> y el objetivo de sponsor quedará sin cumplir este año.</div>
      <div class="grid-2">
        <button class="main" style="margin-top:0;border-color:#c0392b;color:#c0392b" onclick="confirmBreakSponsor('${cat}')">Romper — €${penaltyAmount}</button>
        <button class="main" style="margin-top:0" onclick="document.getElementById('break-confirm-overlay').remove()">Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
};
window.confirmBreakSponsor=(cat)=>{
  const sp=G.sponsors[cat];
  if(!sp)return;
  document.getElementById('break-confirm-overlay')?.remove();
  const totalValue=sp.salary*sp.duration;
  const penaltyAmount=Math.round(totalValue*0.4);
  G.money=Math.max(0,G.money-penaltyAmount);
  const spName=sp.name;
  G.sponsors[cat]=null;
  showToast(`Roto contrato con ${spName} · -€${penaltyAmount}`, '#c0392b');
  autoSave();
  render();
};
window.selectTraining=id=>{
  G.trainingBlock=TRAINING_BLOCKS.find(b=>b.id===id);
  G.trainingBlockHours=G.trainingBlock?.hours||8;
  if(G.trainingBlock){
    const nextRace=G.selectedRaces[0];
    const curMonth=nextRace?nextRace.month:(new Date().getMonth()+1);
    const se=getSeasonEffects(curMonth);
    const eff=effForWork()*(1+se.trainingMod);
    const b=G.trainingBlock;

    // ── Momentum tracking ──────────────────────────────────────────
    if(!G.trainingMomentum||G.trainingMomentum.blockId!==id){
      G.trainingMomentum={blockId:id,count:1};
    } else {
      G.trainingMomentum.count++;
    }

    // ── Taper flag ─────────────────────────────────────────────────
    if(b.taperBlock) G.taperBonus=true;
    else G.taperBonus=false;

    // ── Evento de entrenamiento (1 de cada ~4 veces) ───────────────
    G.trainingEvent=getTrainingEvent(id);

    // ── Toast: flavor text si existe, sino deltas ──────────────────
    if(b.flavor&&b.flavor.length){
      const txt=b.flavor[Math.floor(Math.random()*b.flavor.length)];
      showToast('"'+txt+'"','#555');
    } else {
      const parts=Object.entries(b.effects)
        .filter(([,v])=>v!==0)
        .map(([k,v])=>{const r=Math.round(v*eff);const label=k.charAt(0).toUpperCase()+k.slice(1);return r>0?`+${r} ${label}`:(r<0?`${r} ${label}`:'');}).filter(Boolean);
      if(parts.length) showToast('✓ '+parts.join(' · '),parts.some(p=>p.startsWith('+'))?'#2d7a2d':'#c07a10');
    }
  }
  autoSave();render();
};
window.toggleNR=()=>{const p=document.getElementById('nr-panel'),b=document.getElementById('btn-nr');if(p){const v=p.style.display!=='none';p.style.display=v?'none':'block';if(b)b.textContent=v?'Ver próxima carrera ↓':'Ocultar ↑';}};
window.doStartRaces=()=>{
  if(!G.trainingBlock)return;
  G.raceResults=[];G.currentRaceIdx=0;
  G.preRaceNutrition='pasta';G.dropbagItems=[];G.dropbagUsed=[];G.dropbagShown=false;G.redZoneStreak=0;G.redZoneMax=0;
  G._raceInitialized=false;G._warmupApplied=false;G._recoveryUsed=false;
  if(G.selectedRaces.length===0){
    applyTraining();
    G.screen='seasonBalance';
  } else {
    G.screen='preRacePrep';
  }
  render();
};

// ── Calcula costes y multiplicador de tiempo para un ritmo ──
// 5b: Mejora marginal decreciente por encima del techo suave según modo
function statCapMult(currentVal){
  const softCap={facil:85,medio:75,dificil:82,hardcore:82,expres:75}[G.gameMode||'medio']||75;
  if(currentVal<softCap)return 1.0;
  return Math.max(0.05,1.0-(currentVal-softCap)*0.09);
}
function applyTraining(){
  if(!G.trainingBlock)return;
  const nextRace=G.selectedRaces[0];
  const curMonth=nextRace?nextRace.month:(new Date().getMonth()+1);
  const se=getSeasonEffects(curMonth);
  let eff=effForWork()*(1+se.trainingMod)*(modeCfg().trainingMult||1.0)*(1-agingDeg()*0.6);

  // Penalización brutal si llegaste a cero sin abandonar en carrera anterior
  if(G.zeroedOutThisRace){eff=eff*0.5;G.zeroedOutThisRace=false;}

  // Aplicar evento de entrenamiento si existe
  const tev=G.trainingEvent;
  if(tev){
    if(tev.effMult) eff=eff*tev.effMult;
    if(tev.statBonus) Object.entries(tev.statBonus).forEach(([k,v])=>{G.runner.stats[k]=Math.max(10,Math.min(100,(G.runner.stats[k]||50)+v));});
    if(tev.loadMod) G.bodyLoad=Math.max(0,Math.min(100,(G.bodyLoad||0)+(tev.loadMod||0)));
    // Toast del evento de entrenamiento (después de un pequeño delay para no solaparse)
    const col=tev.type==='good'?'#2d7a2d':'#c07a10';
    setTimeout(()=>showToast(tev.icon+' '+tev.title,col),400);
    G.trainingEvent=null;
  }

  // Taper: no sube stats pero sí aplica la carga reducida y activa el bono
  if(G.trainingBlock.taperBlock){
    G.runner.stats.mental=Math.max(10,Math.min(100,Math.round(G.runner.stats.mental+2*eff)));
    G.bodyLoad=bodyLoadAfterTraining(G.trainingBlock.id);
  } else if(G.trainingBlock.crossBlock){
    // Entrenamiento cruzado: efectos normales pero carga mínima; acelera recuperación de lesión
    const crossMult=G.injuryType?1.3:1.0;
    Object.entries(G.trainingBlock.effects).forEach(([k,v])=>{
      const capM=statCapMult(G.runner.stats[k]);
      G.runner.stats[k]=Math.max(10,Math.min(100,Math.round(G.runner.stats[k]+v*eff*crossMult*capM)));
    });
    G.bodyLoad=bodyLoadAfterTraining(G.trainingBlock.id);
    if(G.injuryType&&G.injuryRacesLeft>0){G.injuryRacesLeft=Math.max(0,G.injuryRacesLeft-1);}
  } else {
    Object.entries(G.trainingBlock.effects).forEach(([k,v])=>{
      const capM=statCapMult(G.runner.stats[k]);
      G.runner.stats[k]=Math.max(10,Math.min(100,Math.round(G.runner.stats[k]+v*eff*capM)));
    });
    G.bodyLoad=bodyLoadAfterTraining(G.trainingBlock.id);
  }
  G.trainingEff=1.0;
  generateMonthlyEvents();
}

window.toggleSpend=(id,cost,yearNet)=>{
  const projMoney=G.money+yearNet;
  if(G.spending[id]){G.spending[id]=false;G.money+=cost;}
  else{
    const alreadySpent=Object.entries(G.spending).filter(([k,v])=>v&&k!==id).reduce((a,[k])=>a+({'fisio':200,'entrenador':250,'suplementos':100}[k]||0),0);
    if(cost>projMoney-alreadySpent){alert('No tienes suficiente dinero para esto.');return;}
    G.spending[id]=true;G.money-=cost;
  }render();
};

window.resolveMonthlyEvent=(evIdx,optIdx)=>{
  const ev=G.monthlyEvents[evIdx];if(!ev)return;
  const opt=ev.options[optIdx];
  G.money=Math.max(0,G.money+opt.value);
  if(opt.statBonus)Object.entries(opt.statBonus).forEach(([k,v])=>{G.runner.stats[k]=Math.min(100,(G.runner.stats[k]||0)+v);});
  if(opt.loadRedux)G.bodyLoad=Math.max(0,G.bodyLoad-opt.loadRedux);
  if(opt.loadAdd)G.bodyLoad=Math.min(100,G.bodyLoad+(opt.loadAdd||0));
  // 2a: Gestión del ascenso laboral
  if(ev._isPromotion){
    if(!G.workPromotionsUsed)G.workPromotionsUsed=[];
    G.workPromotionsUsed.push(ev._promotionPct);
    if(opt.effect==='work_promotion_accept'){
      G.workBonus=(G.workBonus||0)+20;
      G.trainingHPenalty=(G.trainingHPenalty||0)+2;
      showToast('Ascenso aceptado — +€20/mes · −2h/sem de entrenamiento','#c07a10');
    }
  }
  if(opt.clubRepDelta)changeClubRep(opt.clubRepDelta);
  if(opt.addChampionship&&G.selectedRaces.length<12){
    const cr={...EXCLUSIVE_CLUB_RACE,id:'copa_clubes_'+G.year};
    if(!G.selectedRaces.find(r=>r.id===cr.id))G.selectedRaces.push(cr);
  }
  ev.resolved=true;
  // Toast feedback
  const parts=[];
  if(opt.value>0)parts.push(`+€${opt.value}`);
  if(opt.value<0)parts.push(`€${opt.value}`);
  if(opt.statBonus){
    Object.entries(opt.statBonus).forEach(([k,v])=>{
      const label=k.charAt(0).toUpperCase()+k.slice(1);
      parts.push(v>0?`+${v} ${label}`:`${v} ${label}`);
    });
  }
  if(opt.loadRedux)parts.push(`Carga -${opt.loadRedux}`);
  if(opt.loadAdd)parts.push(`Carga +${opt.loadAdd}`);
  if(opt.clubRepDelta)parts.push(opt.clubRepDelta>0?`Rep +${opt.clubRepDelta}`:`Rep ${opt.clubRepDelta}`);
  if(parts.length)showToast(parts.join(' · '), opt.value<0||opt.loadAdd||(opt.clubRepDelta&&opt.clubRepDelta<0)?'#c07a10':'#2d7a2d');
  render();
};
// ══════════════════════════════════════
//  TIENDA PROPIA
// ══════════════════════════════════════
window.doLaunchBrand=()=>{
  if(G.money<2500){showToast('Necesitas €2.500 para lanzar tu marca','#c0392b');return;}
  if(!confirm('¿Lanzar tu propia marca de ropa trail?\n\nCosta €2.500 de inversión inicial.\nGenerará €300/mes pero consumirá 6h/semana de entrenamiento.\n\nA los 2 años podrás contratar un empleado para recuperar esas horas.'))return;
  G.money-=2500;
  G.ownBrand={launched:G.year,hasEmployee:false,employeeYear:null};
  showToast('¡Marca lanzada! 👟 +€300/mes · −6h entrenamiento/semana','#c07a10');
  autoSave();render();
};
window.doHireEmployee=()=>{
  if(!G.ownBrand||G.ownBrand.hasEmployee)return;
  if(!confirm('¿Contratar empleado para tu marca?\n\nCoste: €700/mes (se deduce de los ingresos de la marca).\nBeneficio: recuperas 6h/semana de entrenamiento.\nIngresos netos de la marca: €600/mes.'))return;
  G.ownBrand.hasEmployee=true;
  G.ownBrand.employeeYear=G.year;
  showToast('Empleado contratado 👟 — ingresos netos €600/mes · sin coste de horas','#4a8a2a');
  autoSave();render();
};

window.doNextYear=yearNet=>{
  checkAndUnlockAchievements();
  generateDiaryEntry(yearNet);
  // 2a: Actualizar contador de temporadas en la misma jornada laboral
  const _curPct=G.workPct;
  if(!G.workSeasonCount)G.workSeasonCount={pct:_curPct,seasons:0};
  if(G.workSeasonCount.pct!==_curPct){G.workSeasonCount={pct:_curPct,seasons:1};}
  else G.workSeasonCount.seasons++;

  if(!G.sponsorPenalties)G.sponsorPenalties=[];
  Object.keys(G.sponsors).forEach(cat=>{
    const sp=G.sponsors[cat];if(!sp)return;
    const met=checkSponsorObjective(sp);
    if(!met){const penalty=Math.round(sp.salary*(sp.penaltyPct||0.15));G.sponsorPenalties.push({id:sp.id+'_'+G.year,name:sp.name,amount:penalty,cat});}
    sp.duration=(sp.duration||1)-1;if(sp.duration<=0)G.sponsors[cat]=null;
  });
  // Otorgar premios de circuitos completados (antes en render, ahora aquí)
  G.joinedCircuits.forEach(cid=>{
    const c=CIRCUITS_DB.find(x=>x.id===cid);if(!c)return;
    const pts=G.circuitPoints[cid]||0;
    if(pts>=c.pointsForPrize&&!G.circuitCompleted.includes(cid)){
      G.circuitCompleted.push(cid);
      G.money+=c.reward.money;
    }
  });
  G.money=Math.max(0,G.money+yearNet);

  // Ingresos anuales de marca (ya están en yearNet a través de monthlyNet, pero el empleado se paga aparte)
  // El coste del empleado ya está descontado en monthlyBrandIncome() = 600 neto

  // Envejecer
  // ── Decaimiento de reputación al fin de temporada ──
  const _finishedRaces=(G.raceResults||[]).filter(r=>!r.injured).length;
  const _fameActCount=Object.values(G.fameActionsThisSeason||{}).reduce((a,v)=>a+v,0);
  if(_finishedRaces===0)applyRepDecay('no_races');
  else if(_fameActCount===0)applyRepDecay('season_inactive');
  if((G.injuryRacesLeft||0)>=4)applyRepDecay('injury_long');

  G.runner.age=(G.runner.age||25)+1;
  applyAgingPenalties();

  G.year++;

  // Fin de modo Exprés (3 temporadas)
  if(G.gameMode==='expres'&&G.year>3){G.screen='retirement';render();return;}

  if(G.year>=3&&G.ranking<200&&monthlyNet()>=0)G.workPct=Math.min(G.workPct,80);
  // Traspasar clasificación Zegama
  G.zegamaQual=G.zegamaQualNext;G.zegamaQualNext=false;
  G.selectedRaces=[];G.trainingBlock=null;G.raceResults=[];G.currentRaceIdx=0;G.trainingEff=1.0;
  G.activeTab='game';G.liveClass=[];G.lastRaceGains=[];
  G.workByQuarter={1:G.workPct,2:G.workPct,3:G.workPct,4:G.workPct};
  G.currentQuarter=1;G.fameActionsThisSeason={};G.fameHoursUsed=0;
  // Calcular invitaciones por reputación para la nueva temporada (tras resetear selectedRaces)
  calcRepInvitations();
  G.circuitPoints={};G.circuitCompleted=[];G.vacByQuarter={1:0,2:0,3:0,4:0};
  G.seasonKm=0;
  G.fatBurning=false;
  G.trainingMomentum=null;G.taperBonus=false;
  G.dayConditionGenerated=false;G.dayCondition=null;G.raceDayCondition=null;
  G.gelsCarried=0;G.gelsUsed=0;G.warmedUp=false;G.startStrategy=null;
  // Arco narrativo — actualizar atleta y resetear horas
  if(G.carreraVida&&G.lifeAthlete&&G.lifecyclePhase==='overlap'){
    const h=G.lifeAthleteHours||0;
    if(h>0){
      // Subir stats del atleta proporcional a horas
      const gain=h>=10?3:h>=5?2:1;
      const stats=G.lifeAthlete.currentStats||{...G.lifeAthlete.baseStats};
      const keys=Object.keys(stats);
      const picks=shuffle(keys).slice(0,gain);
      picks.forEach(k=>{stats[k]=Math.min(100,(stats[k]||50)+1);});
      G.lifeAthlete.currentStats=stats;
      // Línea en diario
      const first=G.lifeAthlete.name.split(' ')[0];
      G.seasonDiary=G.seasonDiary||[];
      G.seasonDiary.push(`Año ${G.year-1} · ${first}: ${h}h dedicadas. ${gain===3?'Progresa bien.':gain===2?'Va mejorando.':'Poco tiempo, pero algo es algo.'}`);
    }
    G.lifeAthleteHours=0; // reset para la siguiente temporada
  }
  G.screen=G.gameMode==='expres'?'expresSeasonStart':'workSetup';
  G._expressSponsorPool=null;
  // Arco narrativo — comprobar oferta de atleta (solo carrera normal, fase runner)
  if(G.carreraVida&&G.lifecyclePhase==='runner'&&G.gameMode!=='expres'){
    const offer=checkFirstAthleteOffer();
    if(offer){G.pendingLifeAthleteOffer=offer;G.screen='lifeAthleteOffer';}
  }
  // Arco narrativo — fase entrenador: retiros de rivales y nuevos atletas
  if(G.carreraVida&&G.lifecyclePhase==='coach'){
    checkRivalRetirements();
    checkLifeExtraAthlete();
    if(G.screen==='lifeAthleteOffer'){}// checkLifeExtraAthlete puede haber cambiado screen
    // Oferta del club (solo si no se ha cambiado ya la pantalla)
    if(G.screen!=='lifeAthleteOffer')checkClubOffer();
  }
  autoSave();render();
};

// ══════════════════════════════════════
//  CARRERA DE VIDA — CV-2: OFERTA DEL ATLETA
// ══════════════════════════════════════
function checkFirstAthleteOffer(){
  if(G.lifeAthlete)return null; // ya tiene atleta
  const yr=G.year; // ya incrementado
  // Umbrales por dificultad: [primeraOferta, probPorAño, garantizado]
  const cfg={
    facil:   {first:12, prob:0.30, sure:15},
    medio:   {first:10, prob:0.30, sure:13},
    dificil: {first:7,  prob:0.40, sure:10},
    hardcore:{first:5,  prob:0.50, sure:8},
  }[G.gameMode||'medio']||{first:10,prob:0.30,sure:13};
  if(yr < cfg.first) return null;
  const prob = yr >= cfg.sure ? 1.00 : cfg.prob;
  if(Math.random()>prob)return null;

  // Elegir atleta que no haya sido rechazado antes
  const rejectedIds=(G.lifePendingAthletes||[]).map(a=>a.id);
  const available=LIFE_ATHLETE_POOL.filter(a=>!rejectedIds.includes(a.id));
  if(!available.length)return null;
  const pick=available[Math.floor(Math.random()*available.length)];
  return {...pick, currentStats:{...pick.baseStats}};
}

function renderLifeAthleteOffer(){
  const el=document.getElementById('main');
  if(!el)return;
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const a=G.pendingLifeAthleteOffer;
  if(!a){G.screen='workSetup';render();return;}

  const isUrgent=false; // filosofía: el juego informa, el jugador decide — sin presión
  const potData=LIFE_POTENTIAL_LABEL[a.potential]||{label:a.potential,color:'#888',desc:''};
  const persData=PERSONALITY_LABEL[a.personality]||{label:a.personality,color:'#888',emoji:'⚫',desc:''};
  const specLabel={fondista:'Fondista',montanero:'Montañero',tecnico:'Técnico',todoterreno:'Todoterreno'}[a.spec]||a.spec;

  const introTexts={
    txus: `Después de la carrera, un chico con zapatillas viejas y calcetines de lana te espera en la zona de meta. Te ha visto correr. No sabe muy bien cómo pedirte lo que quiere pedirte.`,
    noa:  `La encuentras en la salida recogiendo dorsal para una carrera en la que no tienes nada que hacer. Te reconoce, se pone roja. Lleva semanas queriendo hablar contigo.`,
    kepa: `Un amigo en común te manda un vídeo: alguien subiendo un puerto en bici a un ritmo que no tiene sentido. Al día siguiente ese alguien te escribe por Instagram.`,
    celia:`Te la presentan en una charla de prevención de lesiones donde tú eras el ponente. Al terminar espera a que todo el mundo se vaya y te hace tres preguntas muy precisas.`,
    unai: `Su madre te llama. No él. Su madre. Te dice que su hijo necesita a alguien que entienda lo que pasó hace tres años. Tú no sabes lo que pasó.`,
    mireia:`Aparece en el entrenamiento de tu club local con una zapatilla de pista en cada pie. Dice que le han dicho que aquí entrenan corredores de monte.`,
  };
  const intro=introTexts[a.id]||`Alguien busca un entrenador. Alguien que sepa lo que es correr de verdad.`;

  el.innerHTML=`
    <div style="font-size:11px;font-weight:600;color:#aaa;letter-spacing:.5px;text-transform:uppercase;margin-bottom:16px">Año ${G.year} · Un momento inesperado</div>
    ${isUrgent?`<div class="warn" style="margin-bottom:16px">⚠ Llevas tiempo rechazando a gente. Este puede ser distinto.</div>`:''}
    <div class="card" style="margin-bottom:16px;border-left:3px solid #e0dfd8;padding-left:18px">
      <p style="font-size:15px;line-height:1.7;color:#1a1a1a;font-style:italic">"${intro}"</p>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;gap:14px">
        <div style="width:48px;height:48px;border-radius:50%;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${a.flag}</div>
        <div style="flex:1">
          <div style="font-size:17px;font-weight:700;margin-bottom:2px">${esc(a.name)}</div>
          <div style="font-size:13px;color:#888;margin-bottom:8px">${a.age} años · ${specLabel}</div>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:10px">${esc(a.bio)}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span style="font-size:12px;padding:2px 10px;border-radius:20px;background:#f5f4f0;color:${potData.color};font-weight:600">${potData.label}</span>
            <span style="font-size:12px;padding:2px 10px;border-radius:20px;background:#f5f4f0;color:#555">${persData.emoji} ${persData.label}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px;background:#fafaf8">
      <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:10px">Stats iniciales</div>
      ${['resistencia','velocidad','subida','bajada','nutricion','mental'].map(s=>`
        <div class="bar-row">
          <div class="bar-label">${s.charAt(0).toUpperCase()+s.slice(1)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${a.baseStats[s]}%;background:${a.baseStats[s]>=60?'#4a8a2a':a.baseStats[s]>=45?'#c07a10':'#c0392b'}"></div></div>
          <div class="bar-pct">${a.baseStats[s]}</div>
        </div>`).join('')}
    </div>

    <div style="font-size:13px;color:#888;margin-bottom:16px;line-height:1.6">
      Aceptar implica dedicar horas a esta persona durante tus propias temporadas. No es gratis. Pero puede que merezca la pena.
    </div>

    <button class="main" style="border-color:#4a8a2a;color:#2d5a1a" onclick="acceptLifeAthlete()">Acepto — quiero trabajar con ${esc(a.name.split(' ')[0])} →</button>
    ${(()=>{
      const limitYear={facil:15,medio:13,dificil:10,hardcore:8}[G.gameMode||'medio']||13;
      const forced=G.year>=limitYear;
      return forced
        ? `<div class="warn" style="margin-top:10px">El cuerpo te lo pide. Ha llegado el momento de pasar el testigo.</div>`
        : `<button class="main" style="margin-top:8px;opacity:0.65" onclick="rejectLifeAthlete()">Ahora no — puede que aparezca alguien más adelante</button>`;
    })()}`;
}

window.acceptLifeAthlete=()=>{
  const a=G.pendingLifeAthleteOffer;
  if(!a)return;
  G.lifeAthlete={...a};
  G.lifecyclePhase='overlap';
  G.pendingLifeAthleteOffer=null;
  G.coachReputation=(G.coachReputation||0)+10;
  showToast(`${a.name.split(' ')[0]} confía en ti. Empieza el solapamiento.`,'#4a8a2a');
  G.screen='workSetup';
  autoSave();render();
};

window.rejectLifeAthlete=()=>{
  const a=G.pendingLifeAthleteOffer;
  if(!a)return;
  if(!G.lifePendingAthletes)G.lifePendingAthletes=[];
  G.lifePendingAthletes.push({...a});
  G.lifeAthleteOfferCount=(G.lifeAthleteOfferCount||0)+1;
  G.pendingLifeAthleteOffer=null;
  showToast('Sigues con tus carreras. Quizás llegue alguien más adelante.','#888');
  G.screen='workSetup';
  autoSave();render();
};
function renderOverlapHub(){
  const el=document.getElementById('main');
  if(!el)return;
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const a=G.lifeAthlete;
  const runnerName=esc(G.runner?.name||'Corredor');
  const athleteName=a?esc(a.name):'tu atleta';
  const athleteFirst=a?esc(a.name.split(' ')[0]):'el atleta';
  el.innerHTML=`
    <div style="font-size:11px;font-weight:600;color:#aaa;letter-spacing:.5px;text-transform:uppercase;margin-bottom:20px">Año ${G.year} · Solapamiento</div>
    <h2 style="margin-bottom:6px">¿Qué haces hoy?</h2>
    <p class="sub" style="margin-bottom:24px">Puedes seguir con tu carrera o gestionar a ${athleteFirst}. Tú decides.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
      <div onclick="G.screen='workSetup';render()" style="background:#fff;border:1.5px solid #e0dfd8;border-radius:12px;padding:20px 16px;cursor:pointer;transition:background .15s" onmouseenter="this.style.background='#f8f7f3'" onmouseleave="this.style.background='#fff'">
        <div style="font-size:28px;margin-bottom:10px">🏃</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:4px">Seguir corriendo</div>
        <div style="font-size:12px;color:#888;line-height:1.5">Temporada ${G.year} · ${esc(G.runner?.specialty||'')}<br>${G.selectedRaces?.length?G.selectedRaces.length+' carrera'+(G.selectedRaces.length!==1?'s':'')+' en calendario':'Sin carreras aún'}</div>
      </div>
      <div onclick="goToCoachFromOverlap()" style="background:#fff;border:1.5px solid #e0dfd8;border-radius:12px;padding:20px 16px;cursor:pointer;transition:background .15s" onmouseenter="this.style.background='#f8f7f3'" onmouseleave="this.style.background='#fff'">
        <div style="font-size:28px;margin-bottom:10px">📋</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:4px">Entrenador</div>
        <div style="font-size:12px;color:#888;line-height:1.5">${athleteName}<br>${a?`${a.age} años · ${esc(a.spec)}`:'Pendiente de asignar'}</div>
      </div>
    </div>

    ${G.lifeAthleteHours>0?`<div class="note" style="font-size:13px">Esta temporada llevas <strong>${G.lifeAthleteHours}h</strong> dedicadas a ${athleteFirst}.</div>`:`<div class="hint" style="font-size:13px">Aún no has dedicado horas a ${athleteFirst} esta temporada. Puedes hacerlo desde el bloque de entrenamiento.</div>`}`;
}

window.goToCoachFromOverlap=()=>{
  if(!G.lifeAthlete){showToast('Sin atleta asignado todavía','#c0392b');return;}
  if(!G.coachAthlete)G.coachAthlete={...G.lifeAthlete};
  if(!Array.isArray(G.coachRoster))G.coachRoster=[];
  if(!Array.isArray(G.coachSelectedRaces))G.coachSelectedRaces=[];
  if(!Array.isArray(G.coachRaceResults))G.coachRaceResults=[];
  if(G.coachRaceIdx==null)G.coachRaceIdx=0;
  if(G.coachSeason==null)G.coachSeason=1;
  G.screen='coachHome';render();
};

function generateDiaryEntry(yearNet){
  const racesRun=G.raceResults.filter(r=>!r.injured&&r.pos>0).length;
  const wins=G.raceResults.filter(r=>r.pos===1).length;
  const best=G.raceResults.filter(r=>!r.injured&&r.pos>0).sort((a,b)=>a.pos-b.pos)[0];
  const injuries=(G.injuryHistory||[]).filter(i=>i.year===G.year);
  const sentences=[];

  if(G.year===1)sentences.push(`Primera temporada completa.`);
  else if(wins>1)sentences.push(`Una temporada brillante: ${wins} victorias.`);
  else if(wins===1)sentences.push(`Una temporada para recordar.`);
  else if(racesRun===0)sentences.push(`Un año difícil, sin poder competir.`);
  else sentences.push(`${racesRun} carrera${racesRun!==1?'s':''} disputada${racesRun!==1?'s':''}.`);

  if(best){
    if(best.pos===1)sentences.push(`Victoria en ${best.name}.`);
    else if(best.pos<=3)sentences.push(`Podio en ${best.name} (${best.pos}º).`);
    else if(best.pos<=10)sentences.push(`Top 10 en ${best.name} (${best.pos}º).`);
    else sentences.push(`${best.name}, ${best.pos}º puesto.`);
  }

  if(injuries.length>0)sentences.push(`La ${injuries[0].label.toLowerCase()} en ${injuries[0].race} fue el golpe más duro.`);
  else if(racesRun>0)sentences.push(`Temporada sin lesiones graves.`);

  if(yearNet>500)sentences.push(`Balance positivo: +€${yearNet}.`);
  else if(yearNet<-300)sentences.push(`Año duro en lo económico: €${yearNet}.`);

  const ad=agingDeg();
  if(ad>=0.16)sentences.push(`A los ${G.runner.age} años el cuerpo ya avisa — hay que escucharlo.`);
  else if(ad>0)sentences.push(`Con ${G.runner.age} años el monte se gana igual, pero cuesta un poco más.`);

  if(!G.seasonDiary)G.seasonDiary=[];
  G.seasonDiary.push({
    year:G.year, age:(G.runner.age||25),
    text:sentences.join(' '),
    highlight:best?`${best.pos}º · ${best.name}`:(racesRun===0?'Sin carreras':`${racesRun} carrera${racesRun!==1?'s':''}`),
    yearNet, races:racesRun, wins, injuries:injuries.length
  });
}

// ══════════════════════════════════════
//  SISTEMA DE EDAD Y RETIRADA
// ══════════════════════════════════════
function applyAgingPenalties(){
  const age=G.runner.age||25;
  if(age<42)return;
  const degradStats=['resistencia','velocidad','subida','bajada'];
  const pick=()=>degradStats[Math.floor(Math.random()*degradStats.length)];
  const count=age>=46?2:1;
  // Multiplicador post-límite: el cuerpo se degrada más rápido tras el año límite
  let mult=1;
  if(G.carreraVida&&G.lifecyclePhase==='overlap'){
    const limitYear={facil:15,medio:13,dificil:10,hardcore:8}[G.gameMode||'medio']||13;
    const seasonsOver=G.year-limitYear;
    if(seasonsOver>=5)mult=4.0;
    else if(seasonsOver>=3)mult=2.5;
    else if(seasonsOver>=1)mult=1.5;
  }
  const totalHits=Math.round(count*mult);
  for(let i=0;i<totalHits;i++){
    const k=pick();
    G.runner.stats[k]=Math.max(10,(G.runner.stats[k]||50)-1);
  }
  // Aviso pasivo si la degradación ya es notable
  if(mult>=2.5){
    const msgs=['Las bajadas ya no salen solas.','El cuerpo tarda más en recuperar.','Necesitas el doble de tiempo para recuperarte.','Las piernas ya no responden igual.'];
    showToast(msgs[Math.floor(Math.random()*msgs.length)],'#c07a10');
  }
}

// Factor de degradación por edad: 0.0 a ~0.50 (4% por año desde los 42)
function agingDeg(){
  const age=G.runner.age||25;
  return Math.max(0,Math.min(0.50,(age-42)*0.04));
}

// Categorías de edad estándar en trail running español
function getAgeCategory(age){
  if(age<23) return {id:'sub23',   label:'Sub-23'};
  if(age<40) return {id:'senior',  label:'Sénior'};
  if(age<50) return {id:'master_a',label:'Máster A (M40)'};
  if(age<60) return {id:'master_b',label:'Máster B (M50)'};
  return      {id:'master_c',      label:'Máster C (M60+)'};
}

window.doRetire=()=>{
  if(G.carreraVida&&(G.lifecyclePhase==='runner'||G.lifecyclePhase==='overlap')){
    G.screen='lifeRetirement';render();return;
  }
  G.screen='retirement';render();
};

function checkClubOffer(){
  if(!G.carreraVida||G.lifecyclePhase!=='coach')return;
  if(G._clubOfferSeen)return;
  if((G.coachReputation||0)<60)return;
  if((G.coachSeason||1)<3)return;
  if(G._clubOfferDelay&&(G.coachSeason||1)<G._clubOfferDelay)return;
  G.screen='clubOffer';
}

function renderClubOffer(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const fb=document.getElementById('fin-bar');if(fb)fb.style.display='none';
  const isReturn=(G._clubOfferDelay>0); // segunda vez que aparece
  const cost=Math.round((G.money||0)*0.6);
  const athlete=G.coachAthlete;
  const athleteName=athlete?esc(athlete.name.split(' ')[0]):'tu atleta';

  const introText=isReturn
    ? `La oferta vuelve. Siguen creyendo en ti. La inversión inicial no ha cambiado — si acaso, la oportunidad es más clara que antes.`
    : `Suena el teléfono un martes por la mañana. Al otro lado, alguien que gestiona un club de trail en el Pirineo. Llevan tiempo siguiendo tu trabajo con ${athleteName}. Quieren que lo lleves al siguiente nivel. Quieren que lo lleves tú.`;

  const coachSeasons=G.coachSeason||1;
  const rosterCount=(G.coachRoster||[]).filter(s=>s&&s.coachAthlete).length;

  el.innerHTML=`
    <div style="font-size:11px;font-weight:600;color:#aaa;letter-spacing:.5px;text-transform:uppercase;margin-bottom:20px">Temporada ${coachSeasons} como entrenador · Una llamada inesperada</div>

    <div class="card" style="margin-bottom:16px;border-left:3px solid #1D9E75;padding-left:18px">
      <p style="font-size:15px;line-height:1.7;color:#1a1a1a;font-style:italic">"${introText}"</p>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">La propuesta</div>
      <div class="fin-row"><span>Inversión inicial (60% de tus ahorros)</span><span class="minus">-€${cost.toLocaleString('es-ES')}</span></div>
      <div class="fin-row"><span>Tus ahorros actuales</span><span>€${(G.money||0).toLocaleString('es-ES')}</span></div>
      <div class="fin-row"><span>Después de la inversión</span><span style="font-weight:600">€${Math.max(0,(G.money||0)-cost).toLocaleString('es-ES')}</span></div>
      <div class="fin-row" style="border-top:1px solid #e0dfd8;margin-top:6px;padding-top:10px"><span>Reputación como entrenador</span><span style="color:#2d7a2d;font-weight:600">${G.coachReputation||0}/100</span></div>
      ${rosterCount>1?`<div class="fin-row"><span>Atletas en cartera</span><span>${rosterCount}</span></div>`:''}
    </div>

    <div class="card" style="margin-bottom:16px;background:#E1F5EE;border-color:#9FE1CB">
      <div style="font-size:13px;color:#085041;line-height:1.6">
        <strong>Lo que ganas:</strong> acceso a instalaciones, plantilla de corredores ya formada, sponsors de club y competición por equipos.<br>
        <strong>Lo que dejas:</strong> la gestión uno a uno. El club es otra escala.
      </div>
    </div>

    <button class="main" style="border-color:#1D9E75;color:#085041" onclick="confirmClubOffer()">Acepto — monto el club →</button>
    <button class="main" style="margin-top:8px;opacity:0.65" onclick="rejectClubOffer()">Ahora no — sigo solo con mis atletas</button>`;
}

window.confirmClubOffer=()=>{
  const cost=Math.round((G.money||0)*0.6);
  G.money=Math.max(0,(G.money||0)-cost);
  G.lifecyclePhase='club';
  G._clubOfferSeen=true;
  // Inicializar clubModeData con el atleta actual ya dentro
  const athlete=G.coachAthlete;
  const spec=athlete?.spec||'mixto';
  const clubName=`Club Trail ${G.runner?.name?.split(' ').slice(-1)[0]||'Monte Perdido'}`;
  G.clubModeData=initClubModeData(clubName,spec,'montanero');
  // El atleta actual pasa a la plantilla del club
  if(athlete){
    const clubRunner={
      id:athlete.id||'life_athlete',
      name:athlete.name, flag:athlete.flag||'🇪🇸', spec:athlete.spec||'fondista',
      stats:{...((athlete.currentStats||athlete.baseStats)||{})},
      salary:athlete.monthlyFee||200, currentSalary:athlete.monthlyFee||200, role:'capitan',
    };
    G.clubModeData.plantilla.unshift(clubRunner);
  }
  generateClubEvent();
  generateClubObjective();
  // Desbloquear modo club en localStorage
  try{
    let ul={};try{ul=JSON.parse(LS.get('unlocked')||'{}');}catch(_e){}
    ul.club=true;
    LS.set('unlocked',JSON.stringify(ul));
  }catch(e){}
  showToast('El club nace. Una nueva etapa empieza.','#1D9E75');
  G.screen='clubHub';
  autoSave();render();
};

window.rejectClubOffer=()=>{
  G._clubOfferDelay=(G.coachSeason||1)+2;
  showToast('Les dices que no de momento. Volverán a llamar.','#888');
  G.screen='coachHome';
  autoSave();render();
};

function checkRivalRetirements(){
  if(!G.carreraVida||G.lifecyclePhase!=='coach')return;
  if(!G.rivalRetirements)G.rivalRetirements={};
  if(!G.rivalChildren)G.rivalChildren=[];
  const retiredIds=Object.keys(G.rivalRetirements);
  RIVALS_POOL.forEach(r=>{
    if(retiredIds.includes(r.name))return;
    // Rivales de nivel tier 1-2 con más años de carrera
    if(r.tier>2)return;
    if(Math.random()>0.25)return;
    // Se retira — crear un "hijo"
    const lastName=r.name.split(' ').slice(-1)[0];
    const childNames=['Alex','Iker','Jon','Mikel','Ander','Unai','Gorka','Aitor'];
    const childFirst=childNames[Math.floor(Math.random()*childNames.length)];
    const child={
      name:`${childFirst} ${lastName}`,
      flag:r.flag, spec:r.spec,
      parentName:r.name, parentWins:Math.floor(Math.random()*5)+1,
      baseStats:{
        resistencia:Math.round(50+Math.random()*20),
        velocidad:Math.round(45+Math.random()*20),
        subida:Math.round(48+Math.random()*22),
        bajada:Math.round(45+Math.random()*20),
        nutricion:Math.round(35+Math.random()*25),
        mental:Math.round(40+Math.random()*25),
      }
    };
    G.rivalRetirements[r.name]={season:G.coachSeason||1,child};
    G.rivalChildren.push(child);
    // Entrada en diario
    G.seasonDiary=G.seasonDiary||[];
    G.seasonDiary.push(`${r.name} se retira. Su ${childFirst} ya corre por los montes.`);
  });
}

function checkLifeExtraAthlete(){
  if(!G.carreraVida||G.lifecyclePhase!=='coach')return;
  if((G.coachSeason||1)%2!==0)return; // cada 2 temporadas
  if(Math.random()>0.40)return;
  const usedIds=[
    ...(G.coachAthleteHistory||[]).map(a=>a.id),
    G.coachAthlete?.id,
  ].filter(Boolean);
  const available=LIFE_EXTRA_ATHLETES.filter(a=>!usedIds.includes(a.id));
  if(!available.length)return;
  const pick=available[Math.floor(Math.random()*available.length)];
  G.pendingLifeAthleteOffer={...pick,currentStats:{...pick.baseStats}};
  G.screen='lifeAthleteOffer';
}

// ══════════════════════════════════════
//  CARRERA DE VIDA — CV-4: TRANSICIÓN AL RETIRO
function renderLifeRetirement(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const fb=document.getElementById('fin-bar');if(fb)fb.style.display='none';

  const totalRaces=G.careerHistory.length;
  const totalWins=G.careerHistory.filter(r=>r.pos===1).length;
  const totalPodiums=G.careerHistory.filter(r=>r.pos<=3).length;
  const totalPrize=G.careerHistory.reduce((a,r)=>a+(r.prize||0),0);
  const yearsActive=G.year-1;
  const age=G.runner.age||25;
  const name=esc(G.runner.name||'El corredor');
  const modeLabel={facil:'Fácil',medio:'Medio',dificil:'Difícil',hardcore:'Hardcore'}[G.gameMode||'medio'];

  let legacy='';
  if(totalWins>=10)legacy='Una carrera de élite. Tu nombre queda grabado en la historia del trail.';
  else if(totalWins>=5)legacy='Varios triunfos y una trayectoria que el circuito recordará.';
  else if(totalWins>=1)legacy='Al menos una victoria. Eso no te lo quita nadie.';
  else if(G.ranking<100)legacy='Llegaste a las puertas de la élite. Una carrera respetable.';
  else if(totalRaces>=15)legacy='Años de kilómetros y esfuerzo. El monte siempre te esperó.';
  else legacy='Cada carrera fue un paso adelante. El trail es así de personal.';

  const a=G.lifeAthlete;
  const athleteFirst=a?esc(a.name.split(' ')[0]):null;

  // Texto narrativo de transición según si tiene atleta o no
  const transitionText=a
    ? `El cuerpo ha dado todo lo que tenía. ${athleteFirst} sale en pocas semanas al Monte Perdido. Todavía tienes trabajo pendiente, pero de otro tipo.`
    : `El cuerpo ha dado todo lo que tenía. Hay gente joven ahí fuera que necesita a alguien que entienda lo que es correr de verdad. Alguien como tú.`;

  const btnText=a
    ? `Continuar como entrenador de ${athleteFirst} →`
    : `Buscar un atleta y continuar como entrenador →`;

  el.innerHTML=`
    <div style="text-align:center;padding:20px 0 10px">
      <div style="font-size:36px;margin-bottom:8px">🏔</div>
      <h1 style="font-size:22px;margin-bottom:4px">Fin de la carrera deportiva</h1>
      <p style="font-size:14px;color:#888">${name} · ${age} años · ${modeLabel}</p>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title">Trayectoria completa</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${[['Temporadas',yearsActive],['Ranking final','#'+G.ranking],['Carreras',totalRaces],['Victorias',totalWins],['Podios',totalPodiums],['Premios','€'+totalPrize]].map(([l,v])=>`
          <div style="background:#f5f4f0;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:12px;color:#aaa;margin-bottom:3px">${l}</div>
            <div style="font-size:17px;font-weight:700">${v}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="note" style="font-size:14px;line-height:1.75;margin-bottom:16px"><strong>Legado:</strong> ${legacy}</div>

    <div style="border-top:1px solid #e8e6e0;margin-bottom:20px;padding-top:20px">
      <div class="card" style="border-left:3px solid #534AB7;padding-left:18px;margin-bottom:16px">
        <p style="font-size:15px;line-height:1.7;color:#1a1a1a;font-style:italic">"${transitionText}"</p>
      </div>
      ${a?`
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:#EEEDFE;border-radius:10px;margin-bottom:16px">
          <div style="font-size:24px">${a.flag}</div>
          <div>
            <div style="font-size:14px;font-weight:600;color:#3C3489">${esc(a.name)}</div>
            <div style="font-size:12px;color:#534AB7">${a.age} años · ${a.spec} · ${LIFE_POTENTIAL_LABEL[a.potential]?.label||''}</div>
          </div>
        </div>`:''}
      <button class="main" style="border-color:#534AB7;color:#3C3489" onclick="confirmLifeCoachTransition()">
        ${btnText}
      </button>
      <button class="main" style="margin-top:8px;opacity:0.55" onclick="G=freshState();render()">Nueva partida desde cero</button>
    </div>`;
}

window.confirmLifeCoachTransition=()=>{
  // Si no tiene atleta, necesita elegir uno — mostrar la oferta
  if(!G.lifeAthlete){
    const available=LIFE_ATHLETE_POOL.filter(a=>
      !(G.lifePendingAthletes||[]).map(x=>x.id).includes(a.id)
    );
    const pick=available.length?available[Math.floor(Math.random()*available.length)]:LIFE_ATHLETE_POOL[0];
    G.pendingLifeAthleteOffer={...pick,currentStats:{...pick.baseStats}};
    G.screen='lifeAthleteOffer';render();return;
  }
  // Tiene atleta — transición directa a entrenador
  G.lifecyclePhase='coach';
  G.coachAthlete={...G.lifeAthlete};
  G.coachReputation=G.coachReputation||0;
  G.coachSeason=G.coachSeason||1;
  G.coachTrust=60;
  G.coachEmotionalState='fresco';
  G.coachBodyLoad=0;
  G.coachRaceResults=[];
  G.coachSelectedRaces=[];
  G.coachRaceIdx=0;
  // Desbloquear modo entrenador en localStorage
  try{
    let ul={};try{ul=JSON.parse(LS.get('unlocked')||'{}');}catch(_e){}
    ul.coach=true;
    LS.set('unlocked',JSON.stringify(ul));
  }catch(e){}
  showToast(`${G.lifeAthlete.name.split(' ')[0]} te espera. Empieza una nueva etapa.`,'#534AB7');
  G.screen='coachHome';
  autoSave();render();
};

function renderRetirement(){
  const el=document.getElementById('main');
  // hide persistent UI
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const fb=document.getElementById('fin-bar');if(fb)fb.style.display='none';

  const totalRaces=G.careerHistory.length;
  const totalWins=G.careerHistory.filter(r=>r.pos===1).length;
  const totalPodiums=G.careerHistory.filter(r=>r.pos<=3).length;
  const totalPrize=G.careerHistory.reduce((a,r)=>a+(r.prize||0),0);
  const yearsActive=G.year-1;
  const age=G.runner.age||25;
  const name=esc(G.runner.name||'El corredor');

  let legacy='';
  if(totalWins>=10)legacy='Una carrera de élite. Tu nombre queda grabado en la historia del trail.';
  else if(totalWins>=5)legacy='Varios triunfos y una trayectoria que el circuito recordará durante años.';
  else if(totalWins>=1)legacy='Al menos una victoria. Eso no te lo quita nadie.';
  else if(G.ranking<100)legacy='Llegaste a las puertas de la élite. Una carrera respetable y digna.';
  else if(totalRaces>=15)legacy='Años de kilómetros y esfuerzo. El monte siempre te esperó.';
  else legacy='Cada carrera fue un paso adelante. El trail es así de personal.';

  const modeLabel={facil:'Fácil',medio:'Medio',dificil:'Difícil',hardcore:'Hardcore',expres:'⚡ Exprés'}[G.gameMode||'medio'];

  el.innerHTML=`
    <div style="text-align:center;padding:20px 0 10px">
      <div style="font-size:36px;margin-bottom:8px">🏔</div>
      <h1 style="font-size:22px;margin-bottom:4px">Fin de carrera</h1>
      <p style="font-size:14px;color:#888">${name} · ${age} años · ${modeLabel}</p>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div class="sec-title">Trayectoria completa</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${[['Temporadas',yearsActive],['Ranking final','#'+G.ranking],['Carreras',totalRaces],['Victorias',totalWins],['Podios',totalPodiums],['Premios','€'+totalPrize]].map(([l,v])=>`
          <div style="background:#f5f4f0;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:12px;color:#aaa;margin-bottom:3px">${l}</div>
            <div style="font-size:17px;font-weight:700">${v}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="note" style="font-size:14px;line-height:1.75;margin-bottom:14px"><strong>Legado:</strong> ${legacy}</div>
    ${(G.seasonDiary||[]).length>0?`
    <div class="card" style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">📓 Diario</div>
      ${G.seasonDiary.slice(-5).reverse().map(e=>`<div style="padding:9px 0;border-bottom:1px solid #f0ede8">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-size:12px;font-weight:600;color:#888">Año ${e.year} · ${e.age} años</span>
          <span style="font-size:12px;color:#c07a10;font-weight:600">${e.highlight}</span>
        </div>
        <div style="font-size:13px;color:#555;line-height:1.6">${esc(e.text||'')}</div>
      </div>`).join('')}
    </div>`:''}
    <button class="main" onclick="G=freshState();render()">Nueva partida →</button>`;
}

// ══════════════════════════════════════
// ══════════════════════════════════════
window.showTip=(title,html)=>{
  document.getElementById('tip-title').textContent=title;
  document.getElementById('tip-body').innerHTML=html;
  document.getElementById('tip-overlay').style.display='flex';
};
window.closeTip=()=>{document.getElementById('tip-overlay').style.display='none';};

const TUTORIAL_CARDS=[
  {
    icon:'🔄',
    title:'El bucle del año',
    text:`<div style="text-align:left;line-height:2">
      <div style="font-size:13px;color:#888;margin-bottom:10px">Cada temporada repites este ciclo:</div>
      <div>📋 <strong>Planificar</strong> — elige carreras, sponsors y jornada laboral</div>
      <div>💪 <strong>Entrenar</strong> — un bloque antes de cada carrera</div>
      <div>🏃 <strong>Correr</strong> — da lo mejor en cada tramo</div>
      <div>📊 <strong>Balance</strong> — revisas cuentas y empiezas más fuerte</div>
    </div>`
  },
  {
    icon:'💪',
    title:'Entrenamiento y carga corporal',
    text:`Entrenar sube tus stats pero acumula <strong>Carga corporal</strong>. Por encima del 70% el rendimiento baja. Si llegas al 100% aparece una lesión. La carga se reduce parcialmente entre temporadas.
    <div style="margin-top:12px;padding:8px 12px;background:#fffbf0;border-left:3px solid #c07a10;border-radius:4px;font-size:13px;color:#8a5a00">
      💡 <strong>Tip:</strong> Nunca vayas a tope todo el rato — el cuerpo necesita recuperarse.
    </div>`
  },
  {
    icon:'🏃',
    title:'En carrera',
    text:`En cada tramo eliges un ritmo. Ir fuerte gasta <strong>Energía</strong> y <strong>Piernas</strong> más rápido. Usa los <strong>avituallamientos</strong> para recuperar.
    <div style="margin-top:12px;padding:8px 12px;background:#fff5f5;border-left:3px solid #c0392b;border-radius:4px;font-size:13px;color:#8a0000">
      ⚠️ Si Energía o Piernas llegan a <strong>0</strong> antes del final, el cuerpo decide por ti: el rendimiento cae en picado y los siguientes entrenos se resienten.
    </div>`
  },
  {
    icon:'💰',
    title:'Economía',
    text:'Tienes gastos fijos de <strong>€95/mes</strong>. El trabajo da ingresos pero recorta horas de entrenamiento. Los <strong>sponsors</strong> pagan si cumples sus objetivos — incumplirlos genera penalización económica y daña tu reputación.'
  },
  {
    icon:'🩹',
    title:'Lesiones',
    text:`La carga corporal alta aumenta el riesgo. Hay 3 tipos:
    <div style="text-align:left;margin-top:10px;line-height:2.1">
      <div>🟡 <strong>Tendinitis</strong> — corres, pero con stats reducidos</div>
      <div>🟠 <strong>Rotura muscular</strong> — 2 carreras bloqueadas</div>
      <div>🔴 <strong>Fractura</strong> — 4 carreras bloqueadas</div>
    </div>
    <div style="margin-top:10px;padding:8px 12px;background:#fffbf0;border-left:3px solid #c07a10;border-radius:4px;font-size:13px;color:#8a5a00">
      💡 Con <strong>fisioterapeuta</strong>, el tiempo de baja se reduce a la mitad.
    </div>`
  },
  {
    icon:'⭐',
    title:'La pestaña Reputación',
    text:`<div style="text-align:left;line-height:1.9">
      <div style="font-size:13px;color:#888;margin-bottom:10px">Tu presencia en redes te abre puertas:</div>
      <div>📱 Publica posts, da charlas o aparece en medios para ganar <strong>seguidores</strong></div>
      <div>🏆 Más seguidores = mejor salario de <strong>sponsors</strong> e invitaciones a carreras</div>
      <div>⏱ Cada acción cuesta <strong>horas</strong> que no dedicarás a entrenar — elige bien</div>
      <div>💸 Algunas acciones requieren <strong>sponsor activo</strong> para ejecutarse</div>
    </div>`
  },
  {
    icon:'⚖️',
    title:'Entrenamiento vs Reputación',
    text:`<div style="text-align:left;line-height:1.9">
      <div style="font-size:13px;color:#888;margin-bottom:10px">
        Cada trimestre tienes horas limitadas. Las que dedicas a entrenar no puedes dedicarlas a las redes — y viceversa.
      </div>
      <div>🏃 <strong>Atleta puro</strong> — entrena a tope, vive de resultados y sponsors deportivos</div>
      <div>📱 <strong>Atleta mediático</strong> — menos entreno, más presencia, mejores contratos comerciales</div>
      <div>⚖️ <strong>Equilibrado</strong> — tú decides cada trimestre según cómo va la temporada</div>
      <div style="margin-top:10px;font-size:12px;color:#aaa">No hay una estrategia correcta. Depende de tus objetivos del año.</div>
    </div>`
  }
];
let _tutPage=0;
window.showTutorial=()=>{_tutPage=0;_renderTutCard();document.getElementById('tut-overlay').style.display='flex';};
window.closeTutorial=()=>{document.getElementById('tut-overlay').style.display='none';};
window.tutNav=dir=>{_tutPage=Math.max(0,Math.min(TUTORIAL_CARDS.length-1,_tutPage+dir));_renderTutCard();};
function _renderTutCard(){
  const c=TUTORIAL_CARDS[_tutPage];
  const n=TUTORIAL_CARDS.length;
  const isLast=_tutPage===n-1;
  document.getElementById('tut-content').innerHTML=`
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:44px;margin-bottom:10px">${c.icon}</div>
      <div style="font-size:17px;font-weight:700;margin-bottom:10px">${c.title}</div>
      <div style="font-size:14px;color:#555;line-height:1.65">${c.text}</div>
    </div>
    <div style="display:flex;justify-content:center;gap:7px;margin-bottom:20px">
      ${TUTORIAL_CARDS.map((_,i)=>`<div style="width:7px;height:7px;border-radius:50%;background:${i===_tutPage?'#1a1a1a':'#ddd'};transition:background .2s"></div>`).join('')}
    </div>
    <div class="grid-2">
      <button class="main" style="margin-top:0;${_tutPage===0?'visibility:hidden':''}" onclick="tutNav(-1)">← Anterior</button>
      ${isLast
        ?`<button class="main" style="margin-top:0;background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="closeTutorial()">¡Empezar! →</button>`
        :`<button class="main" style="margin-top:0" onclick="tutNav(1)">Siguiente →</button>`
      }
    </div>
    <div style="text-align:center;margin-top:12px">
      <span style="font-size:12px;color:#bbb">${_tutPage+1} / ${n}</span>
    </div>`;
}

// ══════════════════════════════════════
//  FLUJO POST-CARRERA
// ══════════════════════════════════════
// Continuar desde pantalla de resultado: en modo normal va a gestión, en exprés avanza directamente
window.postRaceContinue=()=>{
  if(G.gameMode==='expres'){afterRace();return;}
  G._recoveryUsed=false; // reset para la gestión entre carreras
  G.screen='betweenManage';render();
};
// ══════════════════════════════════════
//  MODO ENTRENADOR — RENDER & LOGIC
// ══════════════════════════════════════
window.afterRace=()=>{
  G.currentRaceIdx++;
  const isExpres=G.gameMode==='expres';
  if(G.currentRaceIdx>=G.selectedRaces.length){applyTraining();G.screen=isExpres?'expresSeasonBalance':'seasonBalance';render();return;}
  // In Express, cap injury blocking at 1 race
  if(isExpres&&(G.injuryRacesLeft||0)>1)G.injuryRacesLeft=1;
  // Handle injury race blocking
  if((G.injuryRacesLeft||0)>0){
    G.injuryRacesLeft--;
    const race=G.selectedRaces[G.currentRaceIdx];
    const injData=INJURY_TYPES[G.injuryType]||{};
    const remaining=G.injuryRacesLeft;
    G.raceResults.push({name:race?.name||'',time:0,pos:0,prize:0,all:[],statGains:[],injured:true,injuryLabel:injData.label||'Lesión'});
    const el=document.getElementById('main');
    el.innerHTML=`
      <h2>Baja por lesión</h2>
      <p class="sub">${race?.name||'Próxima carrera'}</p>
      <div class="injury-card">
        <div class="injury-type">${injData.label||'Lesión'}</div>
        <div style="font-size:13px;color:#555;margin:6px 0">No puedes participar en esta carrera. Tu cuerpo necesita recuperarse.</div>
        ${hasFisio()?`<div class="text-ok">El fisio está acelerando tu recuperación.</div>`:''}
        ${remaining>0?`<div style="font-size:12px;color:#c0392b;margin-top:4px">Aún te quedan ${remaining} carrera${remaining>1?'s':''} de baja.</div>`:'<div class="text-ok">Podrás volver en la siguiente carrera, pero llegarás tocado.</div>'}
      </div>
      <div class="warn">Has perdido la inscripción (€${race?.cost||0}) y el posible premio de hasta €${race?.prize||0}.</div>
      <button class="main" style="margin-top:12px" onclick="skipInjuredRace()">Continuar →</button>`;
    G._raceResultHTML=el.innerHTML;
    G.screen='raceResult';
    updateFinBar();autoSave();
    return;
  }
  if(G.injuryType&&INJURY_TYPES[G.injuryType]?.canRace===false){
    applyInjuryToRaceStart();
    G.injuryType=null;G.injuryStatus=null;G.injuryRacesLeft=0;
  } else if(G.injuryType&&INJURY_TYPES[G.injuryType]?.canRace===true){
    applyInjuryToRaceStart();
  }
  G.preRaceNutrition='pasta';G.dropbagItems=[];G.dropbagUsed=[];G.dropbagShown=false;G.redZoneStreak=0;G.redZoneMax=0;
  G._raceInitialized=false;G._warmupApplied=false;G._recoveryUsed=false;
  if(isExpres){G.pendingEvent=null;G.screen='expresPrep';render();return;}
  const hasFisioVal=G.spending.fisio||G.club?.hasFisio;
  if(Math.random()<0.65){
    const ev={...BETWEEN_EVENTS[Math.floor(Math.random()*BETWEEN_EVENTS.length)]};
    if(ev.id==='injury'&&hasFisioVal){ev.desc='Sientes algo en la rodilla pero el fisio te trata a tiempo.';ev.choices=[{text:'Perfecto, a por la siguiente',effect:'nothing'}];}
    G.pendingEvent=ev;G.screen='betweenRace';
  }else{G.pendingEvent=null;G.screen='preRacePrep';}
  render();
};

window.skipInjuredRace=()=>{
  G.currentRaceIdx++;
  const isExpres=G.gameMode==='expres';
  if(G.currentRaceIdx>=G.selectedRaces.length){applyTraining();G.screen=isExpres?'expresSeasonBalance':'seasonBalance';render();return;}
  afterRace();
};

window.handleEv=(evId,choiceIdx)=>{
  const ev=G.pendingEvent;if(!ev)return goNextRace();
  const choice=ev.choices[choiceIdx];
  switch(choice.effect){
    case'skip':G.skipNext=true;break;case'legs_penalty':G.legsPenalty=true;break;
    case'train_emergency':G.trainingEff=Math.min(G.trainingEff,0.8);break;
    case'train_penalty':G.trainingEff=Math.min(G.trainingEff,0.65);break;
    case'special_train':G.money=Math.max(0,G.money-150);break;
    case'change_block':G.pendingEvent=null;G.screen='training';render();return;
    case'add_race':const extras=RACES_DB.filter(r=>!G.selectedRaces.find(s=>s.id===r.id));if(extras.length>0)G.selectedRaces.splice(G.currentRaceIdx,0,extras[0]);break;
    default:break;
  }
  G.pendingEvent=null;goNextRace();
};

// ══════════════════════════════════════════════════════════════════
//  MODO ULTRATRAIL — AUXILIARES
// ══════════════════════════════════════════════════════════════════
function utRaceStats(){
  const r=G.runner;
  const stats=[
    ['⚡ Energía',    r.energy,              '#4a8a2a'],
    ['💧 Hidratación', r.hydration,           '#4a90d9'],
    ['🦵 Piernas',    r.legs,                '#c07a10'],
    ['🔥 Combustible',(G.combustible||0),    '#e87820'],
    ['🦶 Pies',       (G.pies||0),           '#8B4513'],
  ];
  return `<div class="card">${stats.map(([l,v,c])=>`<div class="bar-row"><span class="bar-label" style="color:${v<25?'#c0392b':'#666'}">${l}${v<25?' ⚠':''}</span>${rbar(v,c)}<span class="bar-pct" style="color:${v<25?'#c0392b':'#1a1a1a'}">${Math.round(v)}%</span></div>`).join('')}</div>`;
}
function utStatLabel(statKey, value){
  const v=Math.round(value||0);
  if(statKey==='mental'){
    if(v>=65) return {text:'Fuerte',col:'#4a8a2a'};
    if(v>=35) return {text:'Justo', col:'#c07a10'};
    return {text:'En riesgo',col:'#c0392b'};
  }
  if(statKey==='resistencia'){
    if(v>=60) return {text:'Fuerte',col:'#4a8a2a'};
    if(v>=40) return {text:'Justo', col:'#c07a10'};
    return {text:'En riesgo',col:'#c0392b'};
  }
  if(statKey==='nutricion'){
    if(v>=55) return {text:'Fuerte',col:'#4a8a2a'};
    if(v>=30) return {text:'Justo', col:'#c07a10'};
    return {text:'En riesgo',col:'#c0392b'};
  }
  if(statKey==='bajada'){
    if(v>=55) return {text:'Fuerte',col:'#4a8a2a'};
    if(v>=35) return {text:'Justo', col:'#c07a10'};
    return {text:'En riesgo',col:'#c0392b'};
  }
  if(statKey==='velocidad'){
    if(v>=55) return {text:'Fuerte',col:'#4a8a2a'};
    if(v>=35) return {text:'Justo', col:'#c07a10'};
    return {text:'En riesgo',col:'#c0392b'};
  }
  if(v>=60) return {text:'Fuerte',col:'#4a8a2a'};
  if(v>=35) return {text:'Justo', col:'#c07a10'};
  return {text:'En riesgo',col:'#c0392b'};
}
function shouldPauseForEvent(eventId, stats){
  const s=stats||{};
  const mental=(s.mental||50);
  const always=['ut_intrusive','sock_adjust','lost','friends_cheer'];
  if(always.includes(eventId)) return true;
  if(eventId==='cold_3am') return mental<50;
  if(eventId==='hallucination') return true;
  return mental<40;
}
function utTopBar(){
  const race=(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  const segs=G._utCurrentSegs||race.segs||[];
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:12px;color:#999">${esc(race.name||'')} · seg ${(G.seg||0)+1}/${segs.length}</span><span style="font-size:13px;font-weight:600">${fmt(G.time||0)}</span></div>`;
}
function utProgBar(){
  const race=(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  const segs=G._utCurrentSegs||race.segs||[];
  const done=segs.slice(0,G.seg||0).reduce((a,s)=>a+(s.km||0),0);
  const total=segs.reduce((a,s)=>a+(s.km||0),0)||race.km||1;
  const pct=Math.round(done/total*100);
  return `<div class="prog-wrap"><div class="prog-meta"><span>${done}km</span><span>${total-done}km restantes</span></div><div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div></div>`;
}
function initUltratrailLongRace(race){
  const km=race.km||100;
  const d=parseInt((race.desnivel||'0m+').replace(/\D/g,''))||5000;
  const n=Math.min(12,Math.max(6,Math.round(km/40)));
  const types=['flat','climb','descent','flat','climb','descent','flat','climb','flat','descent','climb','flat'];
  const segs=[];let left=km;
  for(let i=0;i<n;i++){
    const last=(i===n-1);const k=last?Math.max(5,left):Math.round(km/n);left-=k;
    const t=types[i%types.length];
    const g=t==='climb'?Math.round(d/n*1.4):t==='descent'?-Math.round(d/n*1.4):0;
    segs.push({name:`Sector ${i+1}`,km:Math.max(5,k),type:t,gain:g,base:2000+((i*137)%900),aid:i>0&&i%3===2});
  }
  return segs;
}

// ══════════════════════════════════════════════════════════════════
//  MODO ULTRATRAIL — NARRATIVAS POR AÑO
// ══════════════════════════════════════════════════════════════════
const UT_YEAR_NARRATIVE={
  1:{title:'El primer año',text:'Aprendes que los cutoffs no son sugerencias. La montaña no negocia.',sub:'Objetivos: terminar una carrera de 80K · no abandonar por causas evitables'},
  2:{title:'El segundo año',text:'Ya sabes lo que duele. La pregunta es si puedes gestionarlo mejor.',sub:'Objetivos: mejorar tiempo · primer podio local'},
  3:{title:'Buscas tu índice',text:'Tres puntos ITRA. Eso es lo que necesitas para estar en la parrilla grande.',sub:'Objetivos: conseguir 3+ puntos ITRA · clasificar para una carrera élite'},
  4:{title:'La consagración',text:'Ya sabes lo que es una noche sola en la montaña. Ahora buscas saber quién eres en ella.',sub:'Objetivos: primera carrera élite completada · ranking top 100'},
  5:{title:'La madurez',text:'El ultra te ha cambiado. La pregunta ya no es si puedes terminar, sino para qué.',sub:'Objetivos: carrera emblemática completada · top 50 mundial'},
  6:{title:'La cima o el camino',text:'Hay corredores más jóvenes que empujan detrás. Tú sabes cosas que ellos aún no.',sub:'Objetivos: récord personal · carrera que te quede pendiente'},
  7:{title:'Uno más',text:'Un año más. Lo sabes. La cuestión es cómo termina esta historia.',sub:'Objetivos: objetivo soñado · dejar huella'},
  8:{title:'El último año',text:'Cada paso cuenta. No porque sea el último, sino porque has aprendido que siempre lo fue.',sub:'Objetivos: llegar a la meta · escribir el final que mereces'},
};

// ══════════════════════════════════════════════════════════════════
//  MODO ULTRATRAIL — PANTALLAS
// ══════════════════════════════════════════════════════════════════
function renderUltratrailWelcome(){
  const el=document.getElementById('main');
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      <h2 style="margin:0">🏔️ Modo Ultratrail</h2>
      <span style="font-size:11px;background:#4a8a2a;color:#fff;padding:2px 7px;border-radius:10px;font-weight:700">NUEVO</span>
    </div>
    <div class="card" style="background:#111f11;border-color:#2a4a2a;margin-bottom:14px">
      <p style="color:#7fbf7f;margin:0;font-size:14px;line-height:1.5">Llevas años corriendo trails. El ultratrail es otra cosa.<br>
      Aquí no se trata de posición — se trata de llegar. Las distancias empiezan en 80K. Las decisiones importan el doble. El cuerpo tiene memoria.</p>
    </div>
    <hr style="border:none;border-top:1px solid #e0dfd8;margin:0 0 14px 0">
    <div style="font-size:15px;font-weight:600;margin-bottom:10px">¿Tienes experiencia en trail?</div>
    <div class="work-card" style="margin-bottom:10px" onclick="G.utYear1Bonus=false;G.screen='createRunner';render()">
      <div style="font-size:15px;font-weight:700">Sí, vengo del trail</div>
      <div style="font-size:13px;color:#888;margin-top:3px">Empezamos con el historial limpio y sin ventaja adicional.</div>
    </div>
    <div class="work-card" onclick="G.utYear1Bonus=true;G.screen='createRunner';render()">
      <div style="font-size:15px;font-weight:700">Empiezo desde cero</div>
      <div style="font-size:13px;color:#888;margin-top:3px">El primer año es de aprendizaje. Bonus del 15% en el rendimiento del año 1.</div>
    </div>
    <button class="secondary" style="margin-top:14px" onclick="G.screen='modeSelect';render()">← Cambiar modo</button>`;
}

// ── HUB DE TEMPORADA (equivalente a betweenManage del modo normal) ──────────
function renderUltratrailSeasonHub(){
  const el=document.getElementById('main');
  const year=G.utYear||1;
  const tab=G.utActiveTab||'races';
  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div>
        <h2 style="margin-bottom:2px">🏔️ Temporada ${year}</h2>
        <div style="font-size:12px;color:#999">€${G.utMoney||0} · ${(G.utRanking||999)<900?'#'+(G.utRanking||999):'sin ranking'} · Res. ${G.runner.stats.resistencia||50}</div>
      </div>
      <button class="secondary" style="font-size:12px;padding:6px 10px" onclick="G.screen='ultratrailWelcome';render()">← Año</button>
    </div>
    <div style="display:flex;gap:0;margin-bottom:14px;border:1px solid #e0dfd8;border-radius:8px;overflow:hidden">
      ${[['races','📅 Carreras'],['training','💪 Entreno'],['finances','💰 Economía']].map(([id,label])=>`
        <button onclick="G.utActiveTab='${id}';renderUltratrailSeasonHub();" style="flex:1;padding:9px 4px;font-size:13px;font-weight:${tab===id?'700':'400'};background:${tab===id?'#1a1a1a':'#fff'};color:${tab===id?'#fff':'#555'};border:none;cursor:pointer">${label}</button>
      `).join('')}
    </div>
    ${tab==='races'?_utTabRaces(year):tab==='training'?_utTabTraining():_utTabFinances()}`;
}

// ── NUEVA PANTALLA DE INICIO DE TEMPORADA ────────────────────────
function renderUltratrailSeasonStart(){
  const el=document.getElementById('main');
  const year=G.utYear||1;
  const races=ULTRATRAIL_RACES[year]||[];
  if(!G._utSeasonSelected)G._utSeasonSelected=[];
  const sel=G._utSeasonSelected;
  const yearTitles={1:'Primera Ultra',2:'Confirmando el camino',3:'Las grandes ligas',
    4:'El desierto',5:'El gigante',6:'Tierras extremas',7:'El límite del mapa',8:'La Gran Travesía'};
  const objetivoSel=sel.find(i=>{const r=races[i];return r&&r.type==='objetivo'||r&&r.type==='objetivo_especial'||r&&r.type==='endgame';});
  const backtoback=sel.length>=2&&sel.slice().sort((a,b)=>races[a].month-races[b].month).some((i,j,arr)=>{
    if(j===0)return false;
    return Math.abs(races[i].month-races[arr[j-1]].month)<=1;
  });
  el.innerHTML=`
    <div style="margin-bottom:14px">
      <div style="display:flex;gap:4px;margin-bottom:6px">
        ${[1,2,3,4,5,6,7,8].map(y=>`<div style="flex:1;height:6px;border-radius:3px;background:${y===year?'#1a1a1a':y<year?'#4a8a2a':'#ddd'}"></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#999"><span>Año ${year}</span><span>${yearTitles[year]||'Temporada'}</span></div>
    </div>
    <h2 style="margin-bottom:4px">🏔️ ${esc(yearTitles[year]||'Temporada '+year)}</h2>
    <p class="sub">Selecciona tu calendario: máx. 1 objetivo + 2 preparatorias</p>
    ${backtoback?'<div class="warn" style="border-color:#c07a10;background:#fef8ec">⚠️ Back-to-back — el cuerpo lo recordará</div>':''}
    ${races.map((r,i)=>{
      const isSel=sel.includes(i);
      const isObj=r.type==='objetivo'||r.type==='objetivo_especial'||r.type==='endgame';
      const objAlready=objetivoSel!==undefined&&objetivoSel!==i&&isObj;
      const prepCount=sel.filter(j=>{const rj=races[j];return rj&&rj.type!=='objetivo'&&rj.type!=='objetivo_especial'&&rj.type!=='endgame';}).length;
      const prepFull=!isObj&&prepCount>=2&&!isSel;
      const blocked=objAlready||prepFull;
      return `<div class="card${isSel?' sel':''}" style="margin-bottom:8px;${blocked&&!isSel?'opacity:0.5;':''}" onclick="${blocked&&!isSel?'':isSel?`G._utSeasonSelected=G._utSeasonSelected.filter(x=>x!==${i});renderUltratrailSeasonStart()`:`G._utSeasonSelected=(G._utSeasonSelected||[]).concat([${i}]);renderUltratrailSeasonStart()`}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="font-weight:700;font-size:14px">${r.isMDS?'🏜️':r.isEndgame?'🏆':'🏔️'} ${esc(r.name)}</div>
          <div style="text-align:right;flex-shrink:0;margin-left:8px"><span style="font-size:12px;background:${isObj?'#fef3d0':'#f0faf0'};color:${isObj?'#c07a10':'#2d7a2d'};padding:1px 6px;border-radius:4px;font-weight:600">${isObj?'Objetivo':'Prep'}</span></div>
        </div>
        <div style="font-size:12px;color:#888;margin:3px 0">${r.monthName} · ${r.km}km · ${r.desnivel} · €${r.cost}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span style="font-size:11px;color:#666">${r.tier}</span>
          ${r.nocturna?'<span style="font-size:11px;color:#c07a10">🌙 Nocturna</span>':''}
          ${r.crew?'<span style="font-size:11px;color:#4a90d9">👥 Crew</span>':''}
          ${(r.cutoffs||[]).length?'<span style="font-size:11px;color:#888">⏱️ Cutoffs</span>':''}
          ${isSel?'<span style="font-size:11px;color:#4a8a2a;font-weight:700">✓ Seleccionada</span>':''}
        </div>
      </div>`;
    }).join('')}
    ${year>=2?`<div class="card work-card" onclick="G.screen='backyardConfig';render()" style="margin-top:4px;border-left:3px solid #c07a10">
      <div style="font-weight:700">🏕️ Backyard Ultra</div>
      <div style="font-size:12px;color:#888;margin-top:3px">Loops de ${BACKYARD_CONFIG.loopKm}km · cada hora · hasta que quede uno</div>
    </div>`:''}
    <button class="main" style="margin-top:14px" ${objetivoSel===undefined?'disabled':''} onclick="window.utConfirmSeason()">Comenzar temporada →</button>
    <button class="secondary" style="margin-top:8px" onclick="G.screen='ultratrailWelcome';render()">← Atrás</button>`;
  window.utConfirmSeason=function(){
    if(objetivoSel===undefined)return;
    G.utCalendar=sel.map(i=>races[i]).filter(Boolean);
    if(!G.utCalendar.find(r=>r.type==='objetivo'||r.type==='objetivo_especial'||r.type==='endgame'))return;
    G._utSeasonSelected=[];
    G.utCurrentRaceIdx=0;
    G.screen='ultratrailMochila';render();
  };
}

function _utTabRaces(year){
  const races=ULTRATRAIL_RACES[year]||[];
  if(!races.length)return'<div class="note">No hay carreras configuradas para este año.</div>';
  return races.map((r,i)=>{
    const done=(G.utResults||[]).find(res=>res.raceId===r.id&&res.year===year);
    const noFunds=(G.utMoney||0)<(r.cost||0);
    const locked=(r.unlockedYear||1)>year;
    const clickable=!done&&!noFunds&&!locked;
    const tierBadge=r.tier==='elite'?'<span style="font-size:11px;background:#fef3d0;color:#c07a10;padding:1px 6px;border-radius:4px;font-weight:600">⭐ Élite</span>':r.tier==='nacional'?'<span style="font-size:11px;background:#e8eef8;color:#2d4fa0;padding:1px 6px;border-radius:4px;font-weight:600">🔵 Nacional</span>':'<span style="font-size:11px;background:#f0faf0;color:#2d7a2d;padding:1px 6px;border-radius:4px;font-weight:600">🟢 Accesible</span>';
    return `<div class="card${clickable?' work-card':''}" style="${noFunds||locked?'opacity:0.55;':''}" ${clickable?`onclick="G.utCurrentRaceIdx=${i};G.screen='ultratrailIntensitySelect';render()"`:''}>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div style="font-weight:700;font-size:14px">${r.isMDS?'🏜️':'🏔️'} ${esc(r.name)}</div>
        <div style="text-align:right;flex-shrink:0;margin-left:8px"><span style="color:#4a8a2a;font-weight:700">€${r.prize}</span><div style="font-size:11px;color:#999">premio</div></div>
      </div>
      <div style="font-size:12px;color:#888;margin-bottom:4px">${r.monthName} · ${r.km}km · ${r.desnivel} · inscripción €${r.cost}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        ${tierBadge}
        ${r.nocturna&&!done?'<span style="font-size:11px;color:#c07a10">🌙 Nocturna</span>':''}
        ${r.cutoffs&&r.cutoffs.length?'<span style="font-size:11px;color:#888">⏱️ Cutoffs</span>':''}
        ${r.crew?'<span style="font-size:11px;color:#4a90d9">👥 Crew</span>':''}
      </div>
      ${done?`<div style="margin-top:6px;font-size:12px;color:${done.dnf?'#c0392b':'#2d7a2d'};font-weight:600">${done.dnf?'❌ DNF':'✅ Terminada'}${done.pos&&!done.dnf?' · P'+done.pos:''} · ${done.timeH}h</div>`:noFunds?`<div style="margin-top:6px;font-size:12px;color:#c0392b">Sin fondos (faltan €${(r.cost||0)-(G.utMoney||0)})</div>`:locked?`<div style="margin-top:6px;font-size:12px;color:#888">🔒 Disponible desde año ${r.unlockedYear}</div>`:''}
    </div>`;
  }).join('');
}

const UT_TRAINING_BLOCKS=[
  {id:'volumen',    name:'Volumen de base',      hours:14,icon:'🏔️', desc:'Tiradas largas y progresivas. La base de todo ultratrail.',
   effects:{resistencia:8,subida:2,ut_combustible:5}},
  {id:'especifico', name:'Específico ultra',     hours:12,icon:'🎒', desc:'Recce del terreno, noches, mochila cargada. Preparación real.',
   effects:{resistencia:4,subida:4,bajada:3,ut_pies:8}},
  {id:'velocidad',  name:'Trabajo de ritmo',     hours:10,icon:'⚡', desc:'Series y ritmo. Mejora los primeros tramos.',
   effects:{velocidad:7,resistencia:1}},
  {id:'tecnico',    name:'Descenso técnico',     hours:10,icon:'🏃', desc:'Terreno difícil y bajadas. Cuida los pies.',
   effects:{bajada:8,ut_pies:8}},
  {id:'recuperacion',name:'Recuperación activa', hours:6, icon:'🛌', desc:'Consolida lo aprendido, baja la carga corporal.',
   effects:{resistencia:3,mental:4,bodyLoad:-15}},
  {id:'taper',      name:'Descarga / Tapering',  hours:4, icon:'😴', desc:'Nada de volumen. El cuerpo se activa para la carrera objetivo.',
   effects:{bodyLoad:-20,ut_energy_bonus:10,ut_legs_bonus:8}},
];

function _utTabTraining(){
  const current=G.utTrainingBlock;
  return`
    <div class="sec-title-sm">Bloque de entrenamiento — Temporada ${G.utYear||1}</div>
    <div style="font-size:13px;color:#888;margin-bottom:12px">Elige un bloque para toda la temporada. Se aplica entre carreras.</div>
    ${current?`<div class="warn" style="background:#f0faf0;border-color:#8cc88c;color:#2d7a2d">✅ Bloque actual: <strong>${UT_TRAINING_BLOCKS.find(b=>b.id===current)?.name||current}</strong></div>`:''}
    ${UT_TRAINING_BLOCKS.map(b=>{
      const isSel=b.id===current;
      const efxText=Object.entries(b.effects).map(([k,v])=>{
        if(k==='bodyLoad')return`carga ${v>0?'+':''}${v}`;
        if(k.startsWith('ut_'))return``;
        return`${k} ${v>0?'+':''}${v}`;
      }).filter(Boolean).join(' · ');
      return`<div class="train-card${isSel?' sel':''}" onclick="window.utSelectTraining('${b.id}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="font-size:15px;font-weight:600">${b.icon} ${b.name}</div>
          <span style="font-size:12px;color:#888">${b.hours}h/sem</span>
        </div>
        <div style="font-size:12px;color:#888;margin-top:2px">${b.desc}</div>
        ${efxText?`<div style="font-size:12px;color:#4a8a2a;margin-top:4px">${efxText}</div>`:''}
        ${isSel?'<div style="font-size:12px;color:#4a90d9;margin-top:4px;font-weight:600">✓ Seleccionado</div>':''}
      </div>`;
    }).join('')}`;
}

window.utSelectTraining=function(id){
  const b=UT_TRAINING_BLOCKS.find(x=>x.id===id);
  if(!b)return;
  G.utTrainingBlock=id;
  G.utTrainingApplied=false;
  const efxParts=[];
  Object.entries(b.effects).forEach(([k,v])=>{
    if(k==='bodyLoad'){G.utBodyLoad=Math.max(0,Math.min(100,(G.utBodyLoad||0)+v));efxParts.push(`Carga ${v>0?'+':''}${v}`);}
    else if(k==='ut_combustible'){G.combustible=Math.min(100,(G.combustible||0)+v);efxParts.push(`+${v} combustible base`);}
    else if(k==='ut_pies'){G.pies=Math.min(100,(G.pies||0)+v);efxParts.push(`+${v} pies base`);}
    else if(k==='ut_energy_bonus'){G._utEnergyBonus=(G._utEnergyBonus||0)+v;}
    else if(k==='ut_legs_bonus'){G._utLegsBonus=(G._utLegsBonus||0)+v;}
    else if(G.runner.stats[k]!==undefined){G.runner.stats[k]=Math.max(10,Math.min(100,(G.runner.stats[k]||50)+v));efxParts.push(`${k} +${v}`);}
  });
  showToast('💪 '+b.name+(efxParts.length?' · '+efxParts.slice(0,2).join(' · '):''),'#4a8a2a');
  autoSave();
  renderUltratrailSeasonHub();
};

function _utTabFinances(){
  const results=G.utResults||[];
  const yearResults=results.filter(r=>r.year===(G.utYear||1));
  const prizesYear=yearResults.reduce((a,r)=>a+(r.prize||0),0);
  const costsYear=yearResults.reduce((a,r)=>{
    const race=(ULTRATRAIL_RACES[r.year]||[]).find(x=>x.id===r.raceId);
    return a+(race?.cost||0);
  },0);
  const fixedCost=G.utMonthlyExpenses||150;
  const sp=G.utSponsor;
  return`
    <div class="card" style="text-align:center;margin-bottom:12px">
      <div style="font-size:28px;font-weight:700;color:${(G.utMoney||0)>200?'#2d7a2d':'#c0392b'}">€${G.utMoney||0}</div>
      <div style="font-size:12px;color:#999">Saldo actual</div>
    </div>
    <div class="card">
      <div class="sec-title-sm">Temporada ${G.utYear||1}</div>
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid #f0ede8"><span style="color:#888">Premios ganados</span><span style="color:#2d7a2d;font-weight:600">+€${prizesYear}</span></div>
      ${sp?`<div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid #f0ede8"><span style="color:#888">Sponsor: ${esc(sp.name)}</span><span style="color:#2d7a2d;font-weight:600">+€${sp.monthly}/mes</span></div>`:'<div style="padding:5px 0;font-size:12px;color:#bbb;border-bottom:1px solid #f0ede8">Sin sponsor activo</div>'}
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid #f0ede8"><span style="color:#888">Inscripciones pagadas</span><span style="color:#c0392b">−€${costsYear}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0"><span style="color:#888">Material obligatorio</span><span style="color:#c0392b">−€${fixedCost}/año</span></div>
    </div>
    ${(G.utMoney||0)<200?'<div class="warn">⚠️ Saldo bajo — considera si puedes afrontar la próxima inscripción</div>':''}
    <div style="font-size:12px;color:#bbb;margin-top:8px;text-align:center">Los sponsors de ultratrail llegan a partir del año 3 con historial de finishes.</div>`;
}

// ── SELECTOR DE INTENSIDAD (nuevo) ──────────────────────────────
function renderUltratrailIntensitySelect(){
  const el=document.getElementById('main');
  const race=(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  const cur=G.utRaceIntensity||'normal';
  el.innerHTML=`
    <h2>¿Cómo quieres vivir esta carrera?</h2>
    <p class="sub">${esc(race.name||'')} · ${race.km||0}km · ${race.desnivel||''}</p>
    ${[
      {id:'expres', icon:'⚡', label:'Exprés', time:'~5 min', desc:'Solo los momentos que importan. El algoritmo gestiona lo neutro. 4–6 decisiones clave.', detail:'Recomendado para carreras de preparación o cuando quieres avanzar rápido.'},
      {id:'normal', icon:'🏃', label:'Normal', time:'~15 min', desc:'Puntos clave y eventos importantes. Tramos neutros en automático. 8–12 decisiones.', detail:'El modo base. Tienes control sobre lo que importa.'},
      {id:'inmersivo', icon:'🎒', label:'Inmersivo', time:'~30 min', desc:'Todos los tramos. Toda la narrativa. Control máximo. 20+ momentos.', detail:'Para las carreras que quieres vivir de verdad. Techo de rendimiento ligeramente mayor.'},
    ].map(m=>`
      <div class="train-card${cur===m.id?' sel':''}" onclick="G.utRaceIntensity='${m.id}';renderUltratrailIntensitySelect();" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:15px;font-weight:700">${m.icon} ${m.label}</div>
          <span style="font-size:12px;color:#888;background:#f5f4f0;padding:2px 8px;border-radius:10px">${m.time}</span>
        </div>
        <div style="font-size:13px;color:#555;margin-top:4px">${m.desc}</div>
        <div style="font-size:12px;color:#aaa;margin-top:2px">${m.detail}</div>
        ${cur===m.id?'<div style="font-size:12px;color:#4a90d9;margin-top:4px;font-weight:600">✓ Seleccionado</div>':''}
      </div>`).join('')}
    <button class="main" style="margin-top:4px" onclick="G.screen='ultratrailMochila';render()">Preparar mochila →</button>
    <button class="secondary" style="margin-top:8px" onclick="G.screen='ultratrailSeasonHub';render()">← Volver</button>`;
}

function renderUltratrailMochila(){
  const el=document.getElementById('main');
  const race=(G.utCalendar||[])[G.utCurrentRaceIdx]||(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  if(!G.utMochila)G.utMochila={};
  const BASE_PESO=800;
  let pesoOpcional=0;
  BACKYARD_ITEMS.forEach(it=>{pesoOpcional+=(G.utMochila[it.id]||0)*it.pesoG;});
  const pesoTotal=BASE_PESO+pesoOpcional;
  G.utMochilaPeso=pesoTotal;
  const gelItem=BACKYARD_ITEMS.find(it=>it.id==='gel');
  G.utGels=gelItem?(G.utMochila[gelItem.id]||0):0;
  const kg=(pesoTotal/1000).toFixed(1);
  const col=pesoTotal>5000?'#c0392b':pesoTotal>3000?'#d4920a':'#4a8a2a';
  const velPen=Math.max(0,(pesoTotal-800)/100*0.003);
  G._utVelocityPenalty=velPen;
  el.innerHTML=`
    <h2>🎒 Mochila</h2>
    <p class="sub">${esc(race.name||'')} · ${race.km||0}km</p>
    <div class="card" style="background:#f5f4f0">
      <div style="font-weight:600;margin-bottom:4px">Material obligatorio — 800g</div>
      <div style="font-size:12px;color:#888;display:flex;gap:10px;flex-wrap:wrap">
        <span>🧥 Chubasquero</span><span>🔦 Linterna</span><span>🏕️ Manta emergencia</span><span>🩺 Botiquín</span>
      </div>
      <div style="font-size:11px;color:#aaa;margin-top:4px">incluido por reglamento</div>
    </div>
    <div class="card" style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px">Peso total</span>
      <div style="text-align:right">
        <span style="font-weight:700;color:${col}">${kg}kg</span>
        <div style="font-size:12px;color:#888">−${(velPen*100).toFixed(1)}% velocidad</div>
      </div>
    </div>
    ${pesoTotal>5000?'<div class="warn" style="border-color:#c0392b">⚠️ Mochila muy pesada — penalización severa</div>':pesoTotal>3000?'<div class="warn">🟡 Mochila pesada — penalización de ritmo</div>':''}
    <div class="section-label">Material opcional</div>
    ${BACKYARD_ITEMS.filter(it=>!it.unlockedYear||it.unlockedYear<=(G.utYear||1)).map(it=>{
      const qty=G.utMochila[it.id]||0;
      return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center">
        <div style="flex:1"><span style="font-size:17px">${it.icon}</span> <span style="font-weight:600">${esc(it.label)}</span>${it.esEquipamiento?'<span style="font-size:11px;color:#888"> (equip.)</span>':''}<div style="font-size:12px;color:#999;margin-top:2px">${esc(it.desc)}</div>${it.advertencia?`<div style="font-size:11px;color:#c07a10">${esc(it.advertencia)}</div>`:''}<div style="font-size:11px;color:#666">${it.pesoG}g · max ${it.maxUnidades}</div></div>
        <div style="display:flex;align-items:center;gap:8px;margin-left:8px">
          <button class="secondary" style="padding:4px 10px;font-size:15px" onclick="if((G.utMochila['${it.id}']||0)>0){G.utMochila['${it.id}']--;renderUltratrailMochila();}">−</button>
          <span style="font-size:17px;font-weight:700;min-width:22px;text-align:center">${qty}</span>
          <button class="secondary" style="padding:4px 10px;font-size:15px" onclick="if((G.utMochila['${it.id}']||0)<${it.maxUnidades}){if(!G.utMochila)G.utMochila={};G.utMochila['${it.id}']=(G.utMochila['${it.id}']||0)+1;renderUltratrailMochila();}">+</button>
        </div>
      </div></div>`;
    }).join('')}
    <button class="main" style="margin-top:10px" onclick="(function(){G._utVelocityPenalty=Math.max(0,(G.utMochilaPeso-800)/100*0.003);G.screen='ultratrailPreRace';render();})()">Ir a la salida →</button>
    <button class="secondary" style="margin-top:8px" onclick="G.screen='ultratrailSeasonStart';render()">← Volver</button>`;
}

function renderUltratrailPreRace(){
  const el=document.getElementById('main');
  const race=(G.utCalendar||[])[G.utCurrentRaceIdx]||(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  if(race.isMDS){G.screen='mdsPreparation';render();return;}
  const segs=race.segs&&race.segs.length>0?race.segs:initUltratrailLongRace(race);
  const kg=((G.utMochilaPeso||0)/1000).toFixed(1);
  const velPen=((G._utVelocityPenalty||0)*100).toFixed(1);
  const crew=G.utCrew||[];
  const crewCost={nacional:80,internacional:200}[race.tier==='elite'?'internacional':'nacional'];
  const stMental=utStatLabel('mental',G.runner.stats.mental||50);
  const stRes=utStatLabel('resistencia',G.runner.stats.resistencia||50);
  const stNut=utStatLabel('nutricion',G.runner.stats.nutricion||50);
  const utRace={id:race.id||'ut_preview',segs,km:race.km||100};
  el.innerHTML=`
    <h2>🏁 ${esc(race.name||'')}</h2>
    <div class="card" style="background:#0f0f1f;border-color:#2a2a4a">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#aaa">Distancia</span><span style="font-weight:600">${race.km}km · ${race.desnivel||''}</span></div>
      ${race.nocturna?`<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#aaa">Tramo nocturno</span><span style="color:#c07a10;font-weight:600">🌙 km${race.nocturnaStart}–${race.nocturnaEnd}</span></div>`:''}
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#aaa">Mochila</span><span style="color:${(G.utMochilaPeso||0)>5000?'#c0392b':(G.utMochilaPeso||0)>3000?'#d4920a':'#4a8a2a'};font-weight:600">${kg}kg · −${velPen}% vel</span></div>
    </div>
    ${(race.cutoffs||[]).length?`<div class="section-label">Cutoffs</div><div class="card"><table style="width:100%;font-size:12px;border-collapse:collapse"><tr style="color:#999"><th style="text-align:left;padding:3px 0">CP</th><th style="text-align:right">Tiempo máx</th></tr>${race.cutoffs.map(co=>`<tr><td style="padding:3px 0;border-top:1px solid #f0ede8">${esc(co.cp)}</td><td style="text-align:right;font-weight:600;color:#c07a10">${co.maxH}h</td></tr>`).join('')}</table></div>`:''}
    <div class="section-label">Modo narrativa</div>
    ${[{id:'expres',icon:'⚡',label:'Exprés',t:'~5min'},{id:'normal',icon:'🏃',label:'Normal',t:'~15min'},{id:'inmersivo',icon:'🎒',label:'Inmersivo',t:'~30min'}].map(m=>{
      const sel=(G.utNarrativeIntensity||'normal')===m.id;
      return`<div class="card${sel?' sel':''}" style="margin-bottom:6px;cursor:pointer" onclick="G.utNarrativeIntensity='${m.id}';renderUltratrailPreRace()"><div style="display:flex;justify-content:space-between"><span style="font-weight:${sel?700:400}">${m.icon} ${m.label}</span><span style="font-size:12px;color:#888">${m.t}</span></div></div>`;
    }).join('')}
    <div class="section-label">Estado</div>
    <div class="card"><div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:#888">Mental</span><span style="font-weight:600;color:${stMental.col}">${stMental.text}</span></div><div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid #f0ede8"><span style="color:#888">Resistencia</span><span style="font-weight:600;color:${stRes.col}">${stRes.text}</span></div><div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid #f0ede8"><span style="color:#888">Nutrición</span><span style="font-weight:600;color:${stNut.col}">${stNut.text}</span></div></div>
    ${race.crew&&(G.utYear||1)>=2?`<div class="section-label">Equipo de apoyo (opcional)</div>
    ${crew.length===0?`<div class="card">
      <div style="font-size:13px;color:#888;margin-bottom:8px">El crew puede ayudarte en los CPs: ${(race.crewCPs||[]).join(', ')}</div>
      <div style="display:flex;gap:8px">
        <button class="secondary" onclick="window.utAddCrew('fisico')">+ Físico (€${crewCost})</button>
        <button class="secondary" onclick="window.utAddCrew('tecnico')">+ Técnico (€${crewCost})</button>
      </div>
    </div>`:crew.map((c,i)=>`<div class="card" style="display:flex;justify-content:space-between;align-items:center"><span>${c.rol==='fisico'?'💪':'🔧'} Crew ${c.rol} · €${crewCost}</span><button class="secondary" style="font-size:12px;padding:4px 10px" onclick="G.utCrew.splice(${i},1);G.utMoney=(G.utMoney||0)+${crewCost};renderUltratrailPreRace()">Quitar</button></div>`).join('')}`:''}
    <button class="main" style="margin-top:12px" onclick="window.initUltratrailRace()">🏔️ ¡A correr!</button>
    <button class="secondary" style="margin-top:8px" onclick="G.screen='ultratrailMochila';render()">← Mochila</button>`;
  window.utAddCrew=function(rol){
    const cost=crewCost;
    if((G.utMoney||0)<cost){showToast('Sin fondos para crew','#c0392b');return;}
    G.utCrew=G.utCrew||[];
    G.utCrew.push({rol});
    G.utMoney=Math.max(0,(G.utMoney||0)-cost);
    renderUltratrailPreRace();
  };
}

// ── SEGMENTO ULTRATRAIL ───────────────────────────────────────────
function renderUltratrailSegment(){
  const el=document.getElementById('main');
  const race=(G.utCalendar||[])[G.utCurrentRaceIdx]||(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  const segs=G._utCurrentSegs||race.segs||[];
  const segIdx=G.seg||0;
  const seg=segs[segIdx];
  if(!seg){_utFinishRace(race,false);return;}

  // Comprobar sección nocturna
  const kmDoneNow=segs.slice(0,segIdx).reduce((a,s)=>a+(s.km||0),0);
  if(race.nocturna){
    const inNoc=kmDoneNow>=(race.nocturnaStart||9999)&&kmDoneNow<=(race.nocturnaEnd||race.km);
    if(inNoc&&!G.utNocturnaActive){
      G.utNocturnaActive=true;
      if(!G.utNightEntered){G.utNightEntered=true;G.screen='ultratrailNight';render();return;}
    } else if(!inNoc&&G.utNocturnaActive){
      G.utNocturnaActive=false;
      document.body.style.background='';document.body.style.color='';
      G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+10);
      showToast('🌅 El amanecer. Llevas '+((G.time||0)/3600).toFixed(1)+'h corriendo','#c07a10');
    }
  }
  const isNoc=G.utNocturnaActive||false;
  if(isNoc){document.body.style.background='#0d1117';document.body.style.color='#e8e4d8';}
  else{document.body.style.background='';document.body.style.color='';}

  // Aplicar costes del tramo (solo una vez por tramo)
  if(!G._utSegApplied)G._utSegApplied={};
  if(!G._utSegApplied[segIdx]){
    G._utSegApplied[segIdx]=true;
    const combustCost=3*seg.km;
    const piesCost=(seg.type==='descent'?2:1)*seg.km;
    G.combustible=Math.max(0,(G.combustible||100)-combustCost);
    G.pies=Math.max(0,(G.pies||100)-piesCost);
    if((G.combustible||0)<20){
      G.runner.energy=Math.max(0,(G.runner.energy||100)-2*seg.km);
      G.runner.legs=Math.max(0,(G.runner.legs||100)-seg.km);
    }
    if((G.pies||0)<40&&seg.type==='descent'){
      G.runner.legs=Math.max(0,(G.runner.legs||100)-3);
    }
  }

  // Verificar cutoff
  const horasT=(G.time||0)/3600;
  if(race.cutoffs&&!G.utFueraConcurso){
    for(const co of race.cutoffs){
      const m=co.cp.match(/km(\d+)/i);
      const coKm=m?parseInt(m[1]):race.km;
      if(kmDoneNow>=coKm&&horasT>co.maxH){
        G.utDNFReason='cutoff';G._utDNFSaved=false;
        G.screen='ultratrailCutoffDNF';render();return;
      }
    }
  }

  // Panel cutoff más cercano
  let cutoffPanel='';
  if(race.cutoffs&&race.cutoffs.length){
    let nextCo=null;
    for(const co of race.cutoffs){
      const m=co.cp.match(/km(\d+)/i);
      const coKm=m?parseInt(m[1]):race.km;
      if(coKm>kmDoneNow){nextCo={...co,coKm};break;}
    }
    if(nextCo){
      const margenMin=(nextCo.maxH*60)-((G.time||0)/60);
      const margenH=Math.floor(margenMin/60);const margenM=Math.round(margenMin%60);
      if(margenMin>45)cutoffPanel=`<div style="background:#f0faf0;border:1px solid #8cc88c;border-radius:8px;padding:8px 12px;margin-bottom:8px;font-size:12px;color:#2d7a2d">⏱ Cutoff ${esc(nextCo.cp)}: <strong>${margenH}h ${margenM}m</strong> de margen</div>`;
      else if(margenMin>20)cutoffPanel=`<div style="background:#fef8ec;border:1px solid #c07a10;border-radius:8px;padding:8px 12px;margin-bottom:8px;font-size:12px;color:#c07a10">⚠ Cutoff próximo: <strong>${Math.round(margenMin)}min</strong></div>`;
      else if(margenMin>0)cutoffPanel=`<div class="danger" style="animation:pulse 1s infinite;margin-bottom:8px;font-size:12px">🚨 Cutoff crítico: <strong>${Math.round(margenMin)}min</strong> — máxima urgencia</div>`;
      else if(!G.utFueraConcurso){G.screen='ultratrailCutoffDNF';render();return;}
    }
  }

  const pesoMul=1+(G._utVelocityPenalty||0);
  if((G.pies||0)<40)el.style.setProperty('--speed-pen','1.05');

  // Evento nocturno
  const NIGHT_EVENTS=[
    {id:'n_stars',text:'🌟 Las estrellas sobre el camino. Solo el sonido de tus pasos.',auto:true,efecto:{mental:5}},
    {id:'n_cold',text:'🥶 El frío de las 3AM.',auto:false},
    {id:'n_rock',text:'👁 ¿Se ha movido esa roca?',auto:false,reqLowMental:true},
    {id:'n_runner',text:'🏃 Otro corredor te adelanta en silencio.',auto:true,efecto:{mental:-3}},
  ];
  if(!G._utNightEvDone)G._utNightEvDone={};
  let nightEventHtml='';
  if(isNoc&&Math.random()<0.15){
    const pool=NIGHT_EVENTS.filter(e=>!G._utNightEvDone[e.id]&&(!e.reqLowMental||(G.runner.stats.mental||50)<35));
    if(pool.length){
      const ev=pool[Math.floor(Math.random()*pool.length)];
      G._utNightEvDone[ev.id]=true;
      if(ev.auto){
        if(ev.efecto)Object.entries(ev.efecto).forEach(([k,v])=>{if(k==='mental')G.runner.stats.mental=Math.max(0,Math.min(100,(G.runner.stats.mental||50)+v));});
        nightEventHtml=`<div style="background:#0a0a1f;border:1px solid #2a2a4f;border-radius:8px;padding:8px 12px;color:#9090ff;font-size:13px;margin-bottom:8px;font-style:italic">${esc(ev.text)}</div>`;
      } else if(ev.id==='n_cold'){
        if((G.utMochila||{}).ropa_abrigo>0){
          nightEventHtml=`<div style="background:#0a0a1f;border:1px solid #2a2a4f;border-radius:8px;padding:8px 12px;color:#9090ff;font-size:13px;margin-bottom:8px">${esc(ev.text)} Tu ropa de abrigo te protege.</div>`;
        } else {
          G.runner.legs=Math.max(0,(G.runner.legs||100)-8);
          nightEventHtml=`<div class="warn" style="margin-bottom:8px">${esc(ev.text)} Sin ropa de abrigo. −8 piernas.</div>`;
        }
      }
    }
  }

  // Auto-resolve exprés
  const intensity=G.utNarrativeIntensity||'normal';
  if(intensity==='expres'&&!seg.aid&&(G.runner.energy||0)>20&&(G.combustible||0)>10&&(G.pies||0)>10){
    if(segIdx<segs.length-1){utDoPace('steady',true);return;}
  }

  const paceLog=G.utPaceLog||[];
  const alloutStreak=paceLog.slice(-3).filter(p=>p==='allout').length;
  const hardCount=paceLog.slice(-4).filter(p=>p==='allout'||p==='push').length;
  const utRace={id:race.id||'ut_seg',segs,km:race.km||100};
  const gelDisp=(G.utGels||0)-(G.utGelsUsed||0);

  el.innerHTML=`
    ${utTopBar()}${utProgBar()}
    ${cutoffPanel}
    ${nightEventHtml}
    ${isNoc?`<div style="background:#0a0a1f;border:1px solid #1e1e3e;border-radius:8px;padding:6px 12px;color:#9090ff;font-size:12px;margin-bottom:8px">🌙 Sección nocturna</div>`:''}
    ${utRaceStats()}
    ${(G.combustible||0)<20?'<div class="warn" style="border-color:#c0392b">⚠ Sin combustible — energía y piernas penalizadas</div>':''}
    ${(G.pies||0)<40?'<div class="warn">🦶 Ampollas — velocidad reducida en bajadas</div>':''}
    <div class="card" style="${isNoc?'background:#0a0a18;border-color:#1e1e3e;':''}margin-bottom:8px">
      <div id="prof-wrap-utseg">${profSvg(utRace,segIdx,'race',segIdx)}</div>
      <div id="prof-info-utseg" data-sel="${segIdx}" style="min-height:20px">${profSegInfo(utRace,segIdx,'race',segIdx)}</div>
    </div>
    <div class="section-label">Elige tu ritmo:</div>
    <div class="pace-grid">
      ${[['conservar','Conservar','Ahorra fuerzas','-4E/-3C',1.18],['steady','Ritmo fijo','Equilibrado','-9E/-7C',1.00],['push','Apretar','Rápido','-17E/-13C',0.90],['allout','A tope','Máximo','-27E/-20C',0.80]].map(([id,label,desc,cost,mult])=>{
        const mins=Math.round((seg.base||2000)*pesoMul*(seg.km||5)/60*mult);
        let warn='';
        if(id==='allout'&&alloutStreak>=2)warn=`⚠ Racha a tope — fatiga ×${alloutStreak>=3?2.2:1.6}`;
        else if((id==='allout'||id==='push')&&hardCount>=3)warn=`⚠ ${hardCount} tramos duros acumulados`;
        else if(id==='allout'&&seg.type==='descent'&&(G.pies||0)<40)warn='⚠ Pies bajos + bajada';
        return`<div class="pace" onclick="utDoPace('${id}')">
          <div class="pace-label">${label}</div><div class="pace-desc">${desc}</div>
          ${warn?`<div style="font-size:11px;color:#c0392b;margin-bottom:2px">${warn}</div>`:''}
          <div class="pace-meta"><span style="font-size:11px">${cost}</span><span>~${mins}min</span></div>
        </div>`;
      }).join('')}
    </div>
    ${gelDisp>0?`<div style="margin-top:8px;display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f2faf0;border:1px solid #b8ddb8;border-radius:8px"><span>🍬 ${gelDisp} gel${gelDisp>1?'es':''} disponible${gelDisp>1?'s':''} · +15 combustible</span><button class="secondary" style="padding:4px 12px" onclick="G.utGelsUsed=(G.utGelsUsed||0)+1;G.combustible=Math.min(100,(G.combustible||0)+15);G.time+=8;showToast('🍬 Gel · +15 combustible','#4a8a2a');renderUltratrailSegment()">Usar</button></div>`:''}
    ${(G.runner.energy||0)<15||(G.combustible||0)<5?`<div style="margin-top:10px;background:#fef0f0;border:1.5px solid #c0392b;border-radius:8px;padding:10px"><div style="font-size:12px;color:#c0392b;font-weight:600;margin-bottom:6px">⚠ Límite físico — el cuerpo no puede más</div><button class="abandon-btn" style="border-color:#c0392b;color:#c0392b;margin-top:0" onclick="if(confirm('¿Confirmas el abandono?')){G.utDNFReason='abandon';G._utDNFSaved=false;G.screen='ultratrailCutoffDNF';render();}">Abandonar</button></div>`:
    `<button class="abandon-btn" style="border-color:#ddd;color:#bbb;margin-top:8px;font-size:12px" onclick="if(confirm('¿Confirmas el abandono?')){G.utDNFReason='abandon';G._utDNFSaved=false;G.screen='ultratrailCutoffDNF';render();}">Abandonar carrera</button>`}`;
  attachProfHandlers(utRace,'utseg','race',segIdx);
}

function _utCutoffRisk(race,segs,segIdx){
  if(!race.cutoffs||!race.cutoffs.length)return null;
  const kmDone=segs.slice(0,segIdx+1).reduce((a,s)=>a+(s.km||0),0);
  const horasT=(G.time||0)/3600;
  for(const co of race.cutoffs){
    const m=co.cp.match(/km(\d+)/i);
    const coKm=m?parseInt(m[1]):race.km;
    if(kmDone>=coKm*0.7&&kmDone<coKm){
      const margen=co.maxH-horasT;
      if(margen<0.5)return`Cutoff ${esc(co.cp)} en ${margen.toFixed(1)}h — muy justo`;
    }
  }
  return null;
}

// ── AVITUALLAMIENTO ───────────────────────────────────────────────
function renderUltratrailAid(){
  const el=document.getElementById('main');
  const race=(G.utCalendar||[])[G.utCurrentRaceIdx]||(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  const segs=G._utCurrentSegs||race.segs||[];
  const segIdx=G.seg||0;
  const cpName=(segs[segIdx]||{}).name||'CP';
  const kmDone=segs.slice(0,segIdx).reduce((a,s)=>a+(s.km||0),0);
  G.combustible=100; // auto-reset al entrar en avituallamiento
  const items=BACKYARD_ITEMS.filter(it=>!it.esEquipamiento&&(!it.unlockedYear||it.unlockedYear<=(G.utYear||1))&&(G.utMochila||{})[it.id]>0);
  const crew=G.utCrew||[];
  const crewCPs=race.crewCPs||[];
  const isCrewCP=crewCPs.some(cp=>cp.toLowerCase().includes(cpName.toLowerCase())||cpName.toLowerCase().includes(cp.toLowerCase().split(' ')[0]));
  const hasCrew=crew.length>0&&isCrewCP;
  const vendas=(G.utMochila||{}).vendas||0;
  let vendaUsed=false;

  el.innerHTML=`
    ${utTopBar()}${utProgBar()}
    <div class="card" style="background:#0f1f0f;border-color:#1e3e1e;margin-bottom:10px">
      <div style="font-size:15px;font-weight:700;margin-bottom:2px">🍊 ${esc(cpName)}</div>
      <div style="color:#999;font-size:12px">km ${kmDone} de ${race.km||0} · Combustible repuesto</div>
    </div>
    ${utRaceStats()}
    <div class="section-label">¿Cuánto tiempo paras?</div>
    ${[
      {id:'rapida',  icon:'🚀', label:'Parada rápida',   time:'+2 min', e:0, h:10, c:0, p:5,  desc:'Coges agua y sales.'},
      {id:'completa',icon:'🍲', label:'Parada completa', time:'+6 min', e:10,h:30, c:0, p:20, desc:'Come, hidrata, descansa.'},
      {id:'sinparar', icon:'💨',label:'Sin parar',       time:'+0 min', e:0, h:8,  c:0, p:0,  desc:'Solo agua al paso.'},
    ].map(opt=>`
      <div class="aid-row" onclick="window.utResolveAid('${opt.id}')">
        <div style="flex:1">
          <div style="font-weight:600;font-size:14px">${opt.icon} ${opt.label}</div>
          <div style="font-size:12px;color:#888;margin-top:2px">${opt.desc}</div>
          <div style="font-size:12px;color:#4a8a2a;margin-top:2px">${opt.h?`+${opt.h} hidra`:''} ${opt.e?`+${opt.e} energía`:''} ${opt.p?`+${opt.p} pies`:''}</div>
        </div>
        <span style="font-size:12px;color:#c07a10;font-weight:600;margin-left:10px">${opt.time}</span>
      </div>`).join('')}
    <div class="section-label" style="margin-top:8px">Opciones extra</div>
    <div class="card" onclick="window.utCurePies()" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span>🩹 Curar pies (+20 pies, +3 min)</span><span style="font-size:12px;color:#888">Gel</span></div>
    ${vendas>0?`<div class="card" onclick="window.utCambiarCalcetines()" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span>🧦 Cambiar calcetines (+30 pies)</span><span style="font-size:12px;color:#888">Vendas ×${vendas}</span></div>`:''}
    ${items.length>0?`<div class="section-label" style="margin-top:8px">Mochila disponible</div>${items.map(it=>{const qty=(G.utMochila||{})[it.id]||0;return`<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><span style="font-size:15px">${it.icon}</span> <span style="font-weight:600">${esc(it.label)}</span> <span style="color:#999;font-size:12px">×${qty}</span></div><button class="secondary" onclick="window.utUseItem('${it.id}')">Usar</button></div>`;}).join('')}`:''}
    ${hasCrew?`<div style="background:#f0f8f0;border:1px solid #4a8a2a;border-radius:8px;padding:12px;margin-top:12px">
      <div style="font-weight:700;margin-bottom:8px">👥 Crew — ${esc(cpName)}</div>
      ${crew.map((c,i)=>`<div style="margin-bottom:8px;border-top:1px solid #c0e0c0;padding-top:8px">
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">${c.rol==='fisico'?'💪 Rol físico':'🔧 Rol técnico'}</div>
        ${c.rol==='fisico'?`
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="secondary" onclick="G.pies=Math.min(100,(G.pies||0)+30);showToast('💪 Calcetines del crew','#4a8a2a');renderUltratrailAid()">Calcetines frescos (+30 pies)</button>
            <button class="secondary" onclick="G.combustible=Math.min(100,(G.combustible||0)+20);G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+8);showToast('🍲 Comida casera','#4a8a2a');renderUltratrailAid()">Comida casera (+20 combust, +8 mental)</button>
            <button class="secondary" onclick="G.runner.legs=Math.min(100,(G.runner.legs||100)+12);showToast('🧊 Hielo cuádriceps','#4a90d9');renderUltratrailAid()">Hielo cuádriceps (+12 piernas)</button>
            ${(G.runner.stats.mental||50)<=20?`<button class="main" style="background:#4a8a2a;font-size:13px" onclick="G.utCrewSaved=true;showToast('💪 El crew te convence de seguir','#4a8a2a');window.utResolveAid('completa')">Te convencen de seguir ✓</button>`:''}
          </div>`:
          `<div style="display:flex;flex-direction:column;gap:6px">
            <button class="secondary" onclick="G.runner.legs=Math.min(100,(G.runner.legs||100)+15);showToast('💆 Masaje del crew','#4a8a2a');renderUltratrailAid()">Masaje (+15 piernas)</button>
            <button class="secondary" onclick="G._utVelocityPenalty=Math.max(0,(G._utVelocityPenalty||0)-0.002);showToast('🎒 Mochila reordenada','#4a8a2a');renderUltratrailAid()">Reordenar mochila (−200g)</button>
          </div>`}
      </div>`).join('')}
    </div>`:''}
    <button class="secondary" style="margin-top:10px;border-color:#c0392b;color:#c0392b" onclick="if(confirm('¿Abandonar?')){G.utDNFReason='abandon';G._utDNFSaved=false;G.screen='ultratrailCutoffDNF';render();}">🛑 Abandonar</button>`;

  window.utCurePies=function(){G.pies=Math.min(100,(G.pies||0)+20);G.time=(G.time||0)+180;showToast('🩹 Pies curados (+20)','#4a8a2a');renderUltratrailAid();};
  window.utCambiarCalcetines=function(){
    if((G.utMochila||{}).vendas<=0)return;
    G.utMochila.vendas--;G.pies=Math.min(100,(G.pies||0)+30);
    showToast('🧦 Calcetines cambiados (+30 pies)','#4a8a2a');renderUltratrailAid();
  };
  window.utResolveAid=function(choice){
    const opts={rapida:{timeCost:120,hydration:10,pies:5,energy:0},completa:{timeCost:360,hydration:30,pies:20,energy:10},sinparar:{timeCost:0,hydration:8,pies:0,energy:0}};
    const o=opts[choice]||opts.rapida;
    G.time=(G.time||0)+o.timeCost;
    G.runner.hydration=Math.min(100,(G.runner.hydration||0)+o.hydration);
    G.pies=Math.min(100,(G.pies||0)+o.pies);
    G.runner.energy=Math.min(100,(G.runner.energy||0)+o.energy);
    G.seg=(G.seg||0)+1;
    G._utSegApplied=G._utSegApplied||{};
    G.screen='ultratrailSegment';render();
  };
  window.utUseItem=function(id){
    const it=BACKYARD_ITEMS.find(i=>i.id===id);
    if(!it||(G.utMochila||{})[id]<=0)return;
    G.utMochila[id]--;
    Object.entries(it.efecto||{}).forEach(([k,v])=>{
      if(k==='combustible')G.combustible=Math.min(100,(G.combustible||0)+v);
      else if(k==='pies')G.pies=Math.min(100,(G.pies||0)+v);
      else if(k==='energia'||k==='energía')G.runner.energy=Math.min(100,(G.runner.energy||0)+v);
      else if(k==='piernas')G.runner.legs=Math.min(100,(G.runner.legs||0)+v);
      else if(k==='hidratacion'||k==='hidratación')G.runner.hydration=Math.min(100,(G.runner.hydration||0)+v);
    });
    showToast(it.icon+' '+it.label+' usado','#4a8a2a');
    renderUltratrailAid();
  };
}

// ── TRANSICIÓN NOCTURNA (nueva pantalla) ─────────────────────────
function renderUltratrailNight(){
  const el=document.getElementById('main');
  const horasT=((G.time||0)/3600).toFixed(1);
  el.innerHTML=`
    ${utTopBar()}${utProgBar()}
    <div class="card" style="background:#080818;border-color:#1e1e3e;margin-bottom:10px">
      <div style="font-size:20px;margin-bottom:8px">🌙</div>
      <div style="font-size:16px;font-weight:700;color:#9090ff;margin-bottom:6px">Entra la noche</div>
      <p style="color:#aaaacc;font-size:13px;margin:0">Llevas ${horasT}h en carrera. Las cumbres desaparecen en negro y el frontal recorta el mundo a tres metros. El cuerpo entra en otra lógica.</p>
    </div>
    ${utRaceStats()}
    <div class="section-label">¿Cómo gestionas la noche?</div>
    ${[
      {id:'conservar',icon:'🔦',label:'Ritmo nocturno conservador',
       desc:'Bajas el ritmo un 10% pero reduces el riesgo de desorientación y caída.',
       detail:'Penalización de tiempo, pero seguridad. Recomendado si los pies están bajos.'},
      {id:'mantener',icon:'⚡',label:'Mantén el ritmo, confía en el frontal',
       desc:'Has entrenado para esto. La técnica de noche es tuya si la usas bien.',
       detail:`Requiere Mental > 60. Tu mental actual: ${G.runner.stats?.mental||50}`},
      {id:'gel',icon:'🍬',label:'Gel ahora + gestión activa',
       desc:'Combustible extra para la transición más dura. Activas los reflejos.',
       detail:`+15 combustible · consume 1 gel · ${(G.utGels||0)-(G.utGelsUsed||0)} geles disponibles`},
    ].filter(opt=>opt.id!=='gel'||(G.utGels||0)>(G.utGelsUsed||0)).map(opt=>`
      <div class="train-card" onclick="window.utResolveNight('${opt.id}')" style="margin-bottom:8px">
        <div style="font-size:14px;font-weight:700">${opt.icon} ${opt.label}</div>
        <div style="font-size:13px;color:#555;margin-top:3px">${opt.desc}</div>
        <div style="font-size:12px;color:#aaa;margin-top:2px">${opt.detail}</div>
      </div>`).join('')}
    <button class="abandon-btn" style="border-color:#ddd;color:#bbb;margin-top:12px;font-size:12px" onclick="if(confirm('¿Confirmas el abandono?')){G.utDNFReason='abandon';G._utDNFSaved=false;G.screen='ultratrailCutoffDNF';render();}">Abandonar carrera</button>`;
  window.utResolveNight=function(strategy){
    G.utNightStrategy=strategy;
    G.utNocturnaActive=true;
    if(strategy==='gel'){G.utGelsUsed=(G.utGelsUsed||0)+1;G.combustible=Math.min(100,(G.combustible||0)+15);showToast('🍬 Gel nocturno · +15 combustible','#c07a10');}
    else if(strategy==='conservar'){showToast('🔦 Ritmo nocturno conservador','#4a90d9');}
    else{const ok=(G.runner.stats?.mental||50)>=60;if(!ok){G.runner.stats.mental=Math.max(0,(G.runner.stats?.mental||50)-8);showToast('⚡ Mental bajo — ritmo afectado','#c0392b');}else showToast('⚡ Noche bajo control','#4a8a2a');}
    G.screen='ultratrailSegment';render();
  };
}
function renderUltratrailCutoffDNF(){
  const el=document.getElementById('main');
  const race=(G.utCalendar||[])[G.utCurrentRaceIdx]||(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  const segs=G._utCurrentSegs||race.segs||[];
  const kmDone=segs.slice(0,G.seg||0).reduce((a,s)=>a+(s.km||0),0);
  const reason=G.utDNFReason||'cutoff';
  if(!G._utDNFSaved){
    G._utDNFSaved=true;
    G.utCutoffWarnings=(G.utCutoffWarnings||0)+1;
  }
  const isAbandon=reason==='abandon';
  el.innerHTML=`
    <h2>${isAbandon?'🛑 Abandono voluntario':'⏱️ Tiempo límite superado'}</h2>
    <div class="card" style="background:#1e0808;border-color:#4e1818">
      <p style="color:#ff9a9a;margin:0 0 8px 0">${isAbandon?'"Decidiste parar. Conoces tu cuerpo y sabes cuándo el riesgo no vale la pena."':'"El tiempo límite ha hablado. No es un abandono — es la montaña marcando sus propias reglas."'}</p>
      <div style="font-size:13px;color:#999;display:flex;justify-content:space-between;padding:3px 0"><span>Motivo</span><span>${isAbandon?'Abandono voluntario':reason==='cutoff'?'Cutoff':'Agotamiento'}</span></div>
      <div style="font-size:13px;color:#999;display:flex;justify-content:space-between;padding:3px 0"><span>Recorrido</span><span style="color:#ff8a8a">${kmDone}km / ${race.km||0}km</span></div>
      <div style="font-size:13px;color:#999;display:flex;justify-content:space-between;padding:3px 0"><span>Tiempo empleado</span><span>${fmt(G.time||0)}</span></div>
    </div>
    ${utRaceStats()}
    <div class="section-label">¿Qué haces?</div>
    ${!isAbandon?`<div class="work-card" style="margin-bottom:8px" onclick="G.utFueraConcurso=true;G.screen='ultratrailSegment';render()">
      <div style="font-weight:700">Continuar fuera de concurso</div>
      <div style="font-size:13px;color:#888;margin-top:3px">Sin clasificación oficial, pero de cabo a rabo. Eso no te lo quita nadie.</div>
    </div>`:''}
    <div class="work-card" onclick="window.utAfterDNF()">
      <div style="font-weight:700;color:#c0392b">Retirarme aquí</div>
      <div style="font-size:13px;color:#888;margin-top:3px">${isAbandon?'Guardas energía para la próxima. Decisión inteligente.':'Cada DNF enseña algo. La próxima carrera empieza aquí.'}</div>
    </div>`;
  window.utAfterDNF=function(){
    G._utDNFSaved=false;
    if(G.utNocturnaActive){document.body.style.background='';document.body.style.color='';G.utNocturnaActive=false;}
    G.utResults=G.utResults||[];
    G.utResults.push({raceId:race.id||'?',raceName:race.name||'?',year:G.utYear||1,dnf:true,dnfReason:reason,kmDone,km:race.km,timeH:Math.round((G.time||0)/360)/10,piesAlFinalizar:G.pies});
    G.utMoney=Math.max(0,(G.utMoney||0)-(race.cost||0));
    G.runner.energy=Math.min(100,(G.runner.energy||0)+40);G.combustible=Math.min(100,(G.combustible||0)+50);G.pies=Math.min(100,(G.pies||0)+30);
    G.utCurrentRaceIdx=(G.utCurrentRaceIdx||0)+1;
    const cal=G.utCalendar||[];
    autoSave();
    if((G.utCurrentRaceIdx||0)>=cal.length){G._seasonBalanceDone=false;G.screen='ultratrailSeasonBalance';}
    else{G.screen='ultratrailPostRace';}
    render();
  };
}
function renderUltratrailPostRace(){
  const el=document.getElementById('main');
  const race=(G.utCalendar||[])[G.utCurrentRaceIdx]||(ULTRATRAIL_RACES[G.utYear||1]||[])[G.utCurrentRaceIdx]||{};
  const lastRes=(G.utResults||[]).slice(-1)[0]||{};
  const cal=G.utCalendar||[];
  const isLast=(G.utCurrentRaceIdx||0)>=cal.length-1;
  // limpiar estilos nocturnos
  document.body.style.background='';document.body.style.color='';
  const pies=G.pies||0;
  const tiempoH=((G.time||0)/3600).toFixed(1);
  const fueraConcurso=lastRes.fueraConcurso||G.utFueraConcurso||false;
  const dnf=lastRes.dnf&&!fueraConcurso;
  let narrative='';
  if(fueraConcurso)narrative='Sin clasificación oficial, pero de cabo a rabo. Eso no te lo quita nadie.';
  else if(!dnf&&pies>60)narrative='Llegaste entero. El cuerpo aguantó todo lo que la montaña tenía preparado.';
  else if(!dnf&&pies<30)narrative='Las últimas horas fueron solo voluntad. Los pies dijeron basta mucho antes.';
  else if(!dnf&&(G.utCutoffWarnings||0)>0)narrative='Llegaste. Con el tiempo justo, pero llegaste. A veces eso es todo lo que importa.';
  else if(!dnf)narrative=`${tiempoH}h de ${race.km||0}km. Otro punto en tu historial.`;
  else if(dnf)narrative='No fue tu día. Pero te presentaste. Eso ya es más de lo que hace la mayoría.';
  // Check PB
  const dist=race.km||0;
  const pb=G.personalBests||{};
  const pbKey='ut_'+dist;
  const isNewPB=!dnf&&(!pb[pbKey]||(G.time||0)<pb[pbKey]);
  if(isNewPB&&!dnf){G.personalBests=G.personalBests||{};G.personalBests[pbKey]=G.time||0;setTimeout(()=>showToast('🏅 Nuevo record en '+dist+'K','#c07a10'),600);}
  el.innerHTML=`
    <h2>🏁 ${esc(race.name||'')}</h2>
    <div class="card" style="background:${dnf?'#180808':fueraConcurso?'#0f0f18':'#081808'};border-color:${dnf?'#3e1818':fueraConcurso?'#2a2a4a':'#183e18'};text-align:center;margin-bottom:10px">
      <div style="font-size:28px;font-weight:700;color:${dnf?'#ff6a6a':fueraConcurso?'#9090ff':'#6afa6a'};margin-bottom:4px">${dnf?'DNF':fueraConcurso?'FFC':'✓'}</div>
      <div style="color:#999;font-size:13px">${dnf?'No terminada':fueraConcurso?'Fuera de concurso':'Completada · '+tiempoH+'h'}</div>
    </div>
    <div class="card" style="background:#0f1f0f;border-color:#2a4a2a;margin-bottom:10px">
      <p style="color:#7fbf7f;font-size:14px;margin:0;line-height:1.5">"${narrative}"</p>
    </div>
    <div class="card" style="display:flex;justify-content:space-around;text-align:center">
      <div><div style="font-size:18px;font-weight:700">${fmt(G.time||0)}</div><div style="font-size:11px;color:#999">Tiempo</div></div>
      <div><div style="font-size:18px;font-weight:700;color:#8B4513">${Math.round(pies)}</div><div style="font-size:11px;color:#999">Pies</div></div>
      <div><div style="font-size:18px;font-weight:700;color:#c07a10">${G.utCutoffWarnings||0}</div><div style="font-size:11px;color:#999">Cutoff warn</div></div>
    </div>
    ${utRaceStats()}
    <button class="main" onclick="window.utAfterRace()">${isLast?'Ver balance de temporada →':'Siguiente carrera →'}</button>`;
  window.utAfterRace=function(){
    if(G.utNocturnaActive){document.body.style.background='';document.body.style.color='';G.utNocturnaActive=false;}
    G.runner.energy=Math.min(100,(G.runner.energy||0)+30);G.runner.legs=Math.min(100,(G.runner.legs||0)+20);
    G.combustible=Math.min(100,(G.combustible||0)+40);G.pies=Math.min(100,(G.pies||0)+15);
    G.utFueraConcurso=false;G._utSegApplied={};G._utNightEvDone={};
    G.utCurrentRaceIdx=(G.utCurrentRaceIdx||0)+1;
    autoSave();
    if((G.utCurrentRaceIdx||0)>=(G.utCalendar||[]).length){G._seasonBalanceDone=false;G.screen='ultratrailSeasonBalance';}
    else{G.screen='ultratrailPreRace';}
    render();
  };
}
// ── FIN DE AÑO NARRATIVO (nueva pantalla) ────────────────────────
function renderUltratrailYearEnd(){
  const el=document.getElementById('main');
  const year=G.utYear||1;
  const results=G.utResults||[];
  const yearResults=results.filter(r=>r.year===year);
  const fins=yearResults.filter(r=>!r.dnf).length;
  const dnfs=yearResults.filter(r=>r.dnf).length;
  const kmYear=Math.round(yearResults.reduce((a,r)=>a+(r.km||0),0));
  const kmTotal=Math.round(results.reduce((a,r)=>a+(r.km||0),0));
  // Delta de stats
  const snap=G._utYearStatsSnapshot||{};
  const statDelta=Object.entries(G.runner.stats||{}).map(([k,v])=>{
    const prev=snap[k]||v;
    const d=v-prev;
    return d!==0?`${k} ${d>0?'+':''}${d}`:null;
  }).filter(Boolean);
  // Logro del año
  let logro='';
  if(year===1&&fins>0)logro='Primera carrera completada. El ultratrail ya tiene tu nombre.';
  else if(fins===0&&dnfs>0)logro='Un año duro. Pero seguiste presentándote.';
  else if(fins>=2)logro=`${fins} finishes este año. La montaña te conoce.`;
  else if((G.utRanking||999)<100)logro='Top 100 mundial. Pocos llegan aquí.';
  else logro=`${kmYear}km de ultratrail este año. Eso no es nada pequeño.`;
  // Borrar snapshot para el año siguiente
  G._utYearStatsSnapshot=null;
  const nar=UT_YEAR_NARRATIVE[year+1]||UT_YEAR_NARRATIVE[8];
  el.innerHTML=`
    <h2>Año ${year} — Cerrado</h2>
    <div class="card" style="background:#111f11;border-color:#2a4a2a;text-align:center">
      <div style="font-size:14px;color:#7fbf7f;margin-bottom:4px">🏆 Logro del año</div>
      <div style="font-size:15px;font-weight:600;color:#fff">"${logro}"</div>
    </div>
    <div class="card" style="display:flex;justify-content:space-around;text-align:center">
      <div><div style="font-size:20px;font-weight:700">${fins}</div><div style="font-size:11px;color:#999">Finishes</div></div>
      <div><div style="font-size:20px;font-weight:700;color:#c0392b">${dnfs}</div><div style="font-size:11px;color:#999">DNFs</div></div>
      <div><div style="font-size:20px;font-weight:700;color:#4a90d9">${kmYear}km</div><div style="font-size:11px;color:#999">Este año</div></div>
      <div><div style="font-size:20px;font-weight:700;color:#888">${kmTotal}km</div><div style="font-size:11px;color:#999">Total carrera</div></div>
    </div>
    ${statDelta.length?`<div class="card"><div class="sec-title-sm">Evolución de stats</div><div style="font-size:13px;color:#4a8a2a">${statDelta.join(' · ')}</div></div>`:''}
    ${year<8?`<div class="card" style="background:#0f0f1f;border-color:#2a2a4a"><div style="font-size:13px;color:#aaa;margin-bottom:4px">Año ${year+1}: ${esc(nar.title)}</div><div style="font-size:12px;color:#888">${esc(nar.text)}</div></div>`:''}
    <button class="main" onclick="window.utGoNextYear()">${year>=8?'Ver tu legado →':'Año '+(year+1)+' →'}</button>
    ${year>=4?`<button class="secondary" style="margin-top:8px;border-color:#c0392b;color:#c0392b" onclick="G.screen='ultratrailLegado';render()">Retiro anticipado</button>`:''}`;
  window.utGoNextYear=function(){
    if(year>=8){G.screen='ultratrailLegado';render();return;}
    G.utYear=(G.utYear||1)+1;G.utCurrentRaceIdx=0;G._seasonBalanceDone=false;
    G.utTrainingBlock=null;G.utTrainingApplied=false;G.utActiveTab='races';
    autoSave();G.screen='ultratrailWelcome';render();
  };
}
function renderUltratrailSeasonBalance(){
  const el=document.getElementById('main');
  const year=G.utYear||1;
  const yr=(G.utResults||[]).filter(r=>r.year===year);
  const fins=yr.filter(r=>!r.dnf).length;
  const total=yr.length;
  const totKm=yr.reduce((a,r)=>a+(r.km||0),0);
  const totalCareerKm=(G.utResults||[]).reduce((a,r)=>a+(r.km||0),0);
  const rankPrev=G._utRankingPrev||G.utRanking||500;
  const rankNow=G.utRanking||500;
  const prizes=yr.filter(r=>!r.dnf).reduce((a,r)=>a+(r.prize||0),0);
  const costs=yr.reduce((a,r)=>a+(r.cost||0),0);
  const byRes=(G.backyardHistory||[]).filter(b=>b.year===year);
  const by=byRes.length>0?byRes[byRes.length-1]:null;
  const isLast=year>=8;
  if(!G._seasonBalanceDone){
    G._seasonBalanceDone=true;
    G._utRankingPrev=rankNow;
    G.runner.stats.resistencia=Math.min(100,(G.runner.stats.resistencia||50)+fins*2+1);
    G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+fins+1);
    G.runner.age=(G.runner.age||25)+1;
  }
  const balanceColor=prizes-costs>=0?'#4a8a2a':'#c0392b';
  el.innerHTML=`
    <h2>📊 Balance Año ${year}</h2>
    <div class="card" style="display:flex;justify-content:space-around;text-align:center">
      <div><div style="font-size:22px;font-weight:700;color:${fins>0?'#4a8a2a':'#c0392b'}">${fins}/${total}</div><div style="font-size:11px;color:#999">Finales</div></div>
      <div><div style="font-size:22px;font-weight:700;color:#4a90d9">${Math.round(totKm)}</div><div style="font-size:11px;color:#999">km temporada</div></div>
      <div><div style="font-size:22px;font-weight:700;color:#9060c0">${Math.round(totalCareerKm)}</div><div style="font-size:11px;color:#999">km carrera</div></div>
    </div>
    <div class="card" style="display:flex;justify-content:space-around;text-align:center">
      <div><div style="font-size:18px;font-weight:700;color:#c07a10">#${rankNow}</div><div style="font-size:11px;color:#999">Ranking</div></div>
      <div><div style="font-size:18px;font-weight:700;color:${rankNow<rankPrev?'#4a8a2a':rankNow>rankPrev?'#c0392b':'#aaa'}">${rankNow<rankPrev?'▲ +'+(rankPrev-rankNow):rankNow>rankPrev?'▼ '+(rankNow-rankPrev):'—'}</div><div style="font-size:11px;color:#999">Variación</div></div>
      <div><div style="font-size:18px;font-weight:700;color:${balanceColor}">€${prizes-costs>=0?'+':''}${prizes-costs}</div><div style="font-size:11px;color:#999">Balance €</div></div>
    </div>
    ${yr.length>0?`<div class="section-label">Carreras</div>${yr.map(r=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1e1e1e;font-size:13px"><span>${r.dnf?'❌':'✅'} ${esc(r.raceName||'')}</span><span style="color:#999">${r.dnf?'DNF':r.pos?'P'+r.pos:r.loops?r.loops+' loops':r.km+'km'}</span></div>`).join('')}`:''}
    ${by?`<div class="section-label">Backyard Ultra</div>
    <div class="card" style="background:#0f1f0f;border-color:#1e3e1e">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:14px">${by.motivo==='victoria'?'🏆 Last One Standing':'🛑 '+by.loops+' loops'}</span>
        <span style="color:#999;font-size:13px">${Math.round(by.km||0)}km</span>
      </div>
      ${(G.backyardHistory||[]).length>1?`<div style="font-size:12px;color:#777;margin-top:4px">Histórico: ${(G.backyardHistory||[]).map(b=>b.loops+' loops').join(' → ')}</div>`:''}
    </div>`:''}
    <div class="section-label" style="margin-top:8px">Evolución</div>
    <div class="card">${srow('Resistencia',G.runner.stats.resistencia)}${srow('Mental',G.runner.stats.mental)}</div>
    ${isLast
      ?`<button class="main" onclick="G.screen='ultratrailLegado';render()">🏆 Ver tu Legado →</button>`
      :`<button class="main" onclick="G._seasonBalanceDone=false;G.utYear=(G.utYear||1)+1;G.utCalendar=[];G.utCurrentRaceIdx=0;G._utSeasonSelected=[];G.utGels=0;G.utGelsUsed=0;G.utCrew=[];G.utCrewSaved=false;G.screen='ultratrailSeasonStart';render()">Año ${year+1} →</button>`
    }`;
}
function renderUltratrailLegado(){
  const el=document.getElementById('main');
  if(!G.legadoData)G.legadoData=window.generateLegadoData?window.generateLegadoData():generateLegadoData();
  const lg=G.legadoData;
  const byWins=(G.backyardHistory||[]).filter(b=>b.motivo==='victoria').length;
  const narrativa=lg.eliteFinishes>=2?'Perteneces a ese grupo pequeño y extraño de personas que han terminado lo que la mayoría ni se atreve a empezar. Ocho años en las montañas, en los desiertos, en la noche. Tu cuerpo lo sabe. Tus rodillas lo saben.':lg.finishes>=4?'No todos los finales son victorias, y no todas las victorias son finales. Aprendiste eso de la manera difícil, varias veces. Lo que importa es que volviste siempre.':'Ocho años es mucho tiempo para seguir eligiendo el dolor con convicción. Hay algo en ti que la montaña despertó y ya no se apaga.';
  el.innerHTML=`
    <h2>🏆 Tu Legado</h2>
    <div class="card" style="background:#111008;border-color:#4a4808;text-align:center;padding:18px">
      <div style="font-size:26px;font-weight:700;color:#f0c040;margin-bottom:6px">${esc(lg.title||'Corredor de Ultratrail')}</div>
      <div style="color:#ccc;font-size:15px">${esc(G.runner.name||'')}</div>
      <div style="color:#777;font-size:12px;margin-top:4px">8 años · ${Math.round(lg.totalKm||0)}km de ultratrail</div>
    </div>
    <div class="card" style="display:flex;justify-content:space-around;text-align:center">
      <div><div style="font-size:22px;font-weight:700;color:#4a90d9">${Math.round(lg.totalKm||0)}</div><div style="font-size:11px;color:#999">km totales</div></div>
      <div><div style="font-size:22px;font-weight:700;color:#4a8a2a">${lg.finishes||0}</div><div style="font-size:11px;color:#999">finales</div></div>
      <div><div style="font-size:22px;font-weight:700;color:#c07a10">${lg.eliteFinishes||0}</div><div style="font-size:11px;color:#999">élite</div></div>
      ${byWins>0?`<div><div style="font-size:22px;font-weight:700;color:#f0c040">${byWins}</div><div style="font-size:11px;color:#999">Backyard</div></div>`:''}
    </div>
    ${lg.bestPos?`<div class="card" style="text-align:center"><span style="color:#c07a10;font-size:14px">🥇 Mejor posición: <strong>P${lg.bestPos}</strong></span></div>`:''}
    <div class="section-label">Tu historia</div>
    ${(G.utResults||[]).map(r=>`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #111;font-size:13px"><span>${r.dnf?'❌':'✅'} ${esc(r.raceName||'')}</span><span style="color:#999">A${r.year}${r.pos?' · P'+r.pos:r.loops?' · '+r.loops+'L':''}</span></div>`).join('')}
    <div class="card" style="background:#080e18;border-color:#182840;margin-top:12px">
      <p style="color:#8090a8;font-style:italic;margin:0 0 8px 0">${esc(narrativa)}</p>
      <p style="color:#506070;font-style:italic;font-size:13px;margin:0">"La montaña no te recuerda. Pero tú sí la recuerdas a ella. Eso es suficiente."</p>
    </div>
    <button class="main" style="margin-top:14px" onclick="G.screen='modeSelect';render()">Volver al menú</button>`;
}
function renderBackyardConfig(){
  const el=document.getElementById('main');
  const cfg=BACKYARD_CONFIG;
  if(!G.backyardMochila)G.backyardMochila={};
  if(!G._backyardConfigInit){
    G._backyardConfigInit=true;
    BACKYARD_ITEMS.filter(it=>!it.esEquipamiento).forEach(it=>{if(!G.backyardMochila[it.id])G.backyardMochila[it.id]=it.unidadesBase;});
  }
  let peso=0;BACKYARD_ITEMS.forEach(it=>{peso+=(G.backyardMochila[it.id]||0)*it.pesoG;});
  const numRivals=Math.min(10+(G.utYear||1)*2,20);
  el.innerHTML=`
    <h2>🏕️ Backyard Ultra</h2>
    <p class="sub">${cfg.loopKm}km por loop · Hasta que quede uno</p>
    <div class="card" style="background:#0f1f0f;border-color:#1e3e1e">
      <p style="color:#7fbf7f;margin:0">Loops de ${cfg.loopKm}km, uno por hora. El último en completar un loop gana. No hay distancia fija ni tiempo límite. Solo voluntad.</p>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#aaa">Loop</span><span style="font-weight:600">${cfg.loopKm}km · 60 min</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#aaa">Participantes</span><span style="font-weight:600">${numRivals+1} corredores</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:#aaa">Peso mochila</span><span style="font-weight:600;color:${peso>3000?'#c0392b':'#4a8a2a'}">${(peso/1000).toFixed(2)}kg</span></div>
    </div>
    <div class="section-label">Provisiones</div>
    ${BACKYARD_ITEMS.filter(it=>!it.esEquipamiento&&(!it.unlockedYear||it.unlockedYear<=(G.utYear||1))).map(it=>{
      const qty=G.backyardMochila[it.id]||0;
      return `<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div style="flex:1"><span style="font-size:17px">${it.icon}</span> <span style="font-weight:600">${esc(it.label)}</span><div style="font-size:12px;color:#999;margin-top:2px">${esc(it.desc)}</div></div><div style="display:flex;align-items:center;gap:8px"><button class="secondary" style="padding:4px 10px" onclick="if((G.backyardMochila['${it.id}']||0)>0){G.backyardMochila['${it.id}']--;renderBackyardConfig();}">−</button><span style="font-weight:700;min-width:20px;text-align:center">${qty}</span><button class="secondary" style="padding:4px 10px" onclick="if((G.backyardMochila['${it.id}']||0)<${it.maxUnidades}){G.backyardMochila['${it.id}']=(G.backyardMochila['${it.id}']||0)+1;renderBackyardConfig();}">+</button></div></div>`;
    }).join('')}
    <button class="main" style="margin-top:10px" onclick="initBackyard()">🏁 Comenzar</button>
    <button class="secondary" style="margin-top:8px" onclick="G.screen='ultratrailSeasonBalance';render()">← Volver</button>`;
}
function renderBackyardLoop(){
  const el=document.getElementById('main');
  const cfg=BACKYARD_CONFIG;
  const loop=G.backyardCurrentLoop||0;
  const active=(G.backyardRivalState||[]).filter(r=>r.active);
  const isNoc=loop>=12&&loop%24<12;
  const km=Math.round(loop*cfg.loopKm*10)/10;
  const moch=G.backyardMochila||{};
  const racion=(moch.racion_solida||0);
  const gel=(moch.gel||0);
  const vendas=(moch.vendas||0);
  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:12px;color:#999">🏕️ Backyard Ultra</span>
      <span style="font-size:13px;font-weight:700">${loop} loops · ${km}km · ${loop}h</span>
    </div>
    ${isNoc?'<div class="card" style="background:#080818;border-color:#181838"><span style="color:#9090ff">🌙 Tramo nocturno</span></div>':''}
    <div class="card" style="display:flex;justify-content:space-around;text-align:center">
      <div><div style="font-size:22px;font-weight:700;color:#4a90d9">${loop}</div><div style="font-size:11px;color:#999">Loops</div></div>
      <div><div style="font-size:22px;font-weight:700;color:#4a8a2a">${km}km</div><div style="font-size:11px;color:#999">Total</div></div>
      <div><div style="font-size:22px;font-weight:700;color:#c07a10">${active.length}</div><div style="font-size:11px;color:#999">Rivales</div></div>
    </div>
    <div class="card">${[['🔥 Combust.',G.combustible||0,'#e87820'],['🦶 Pies',G.pies||0,'#c07a10'],['⚡ Energía',G.runner.energy||0,'#4a90d9'],['🧠 Mental',G.runner.stats.mental||0,'#9060c0']].map(([l,v,c])=>`<div class="bar-row"><span class="bar-label" style="color:${v<25?'#c0392b':'#666'}">${l}${v<25?' ⚠':''}</span>${rbar(v,c)}<span class="bar-pct" style="color:${v<25?'#c0392b':'#1a1a1a'}">${Math.round(v)}%</span></div>`).join('')}</div>
    ${active.length<=3?`<div class="card" style="background:#111008;border-color:#3a3808"><div style="font-size:13px;color:#f0c040;font-weight:600">⚡ Quedáis ${active.length+1} en carrera</div>${active.map(r=>`<div style="font-size:12px;color:#999;margin-top:3px">${r.flag} ${esc(r.name)}</div>`).join('')}</div>`:''}
    ${(G.combustible||0)<25||(G.runner.energy||0)<25?'<div class="warn">⚠️ Reservas críticas</div>':''}
    <div class="section-label">Antes del loop ${loop+1}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
      <button class="secondary" style="flex:1;min-width:80px" ${racion<=0?'disabled':''} onclick="if((G.backyardMochila.racion_solida||0)>0){G.backyardMochila.racion_solida--;G.combustible=Math.min(100,(G.combustible||0)+30);showToast('🍞 Ración comida +30 combust.','#c07a10');renderBackyardLoop();}">🍞 Ración<br><span style="font-size:11px;color:#999">${racion} uds</span></button>
      <button class="secondary" style="flex:1;min-width:80px" ${gel<=0?'disabled':''} onclick="if((G.backyardMochila.gel||0)>0){G.backyardMochila.gel--;G.combustible=Math.min(100,(G.combustible||0)+15);showToast('🧃 Gel +15 combust.','#c07a10');renderBackyardLoop();}">🧃 Gel<br><span style="font-size:11px;color:#999">${gel} uds</span></button>
      <button class="secondary" style="flex:1;min-width:80px" onclick="G.runner.legs=Math.min(100,(G.runner.legs||0)+5);showToast('🦵 Estiramientos +5 piernas','#4a8a2a');renderBackyardLoop();">🦵 Estirar<br><span style="font-size:11px;color:#999">+5 pies</span></button>
      <button class="secondary" style="flex:1;min-width:80px" ${vendas<=0?'disabled':''} onclick="if((G.backyardMochila.vendas||0)>0){G.backyardMochila.vendas--;G.pies=Math.min(100,(G.pies||0)+20);showToast('🩹 Curas +20 pies','#4a8a2a');renderBackyardLoop();}">🩹 Curas<br><span style="font-size:11px;color:#999">${vendas} uds</span></button>
    </div>
    <button class="main" onclick="window.resolveBackyardLoop?window.resolveBackyardLoop():resolveBackyardLoop()">▶ Loop ${loop+1}</button>
    <button class="secondary" style="margin-top:8px" onclick="window.resolverBackyard?window.resolverBackyard('voluntario'):resolverBackyard('voluntario')">🛑 Retirarse</button>`;
}
function renderBackyardResult(){
  const el=document.getElementById('main');
  const hist=G.backyardHistory||[];
  const r=hist.length>0?hist[hist.length-1]:null;
  if(!r){G.screen='ultratrailSeasonBalance';render();return;}
  const motivoTexts={
    victoria:'Fuiste el último en pie. El campo entero cedió antes que tú. No hay palabras para eso — solo el silencio después del último loop.',
    voluntario:'Decidiste parar cuando aún podías seguir. Esa es la decisión más difícil de todas. Conoces tus límites mejor que nadie.',
    mental:'La cabeza dijo basta antes que el cuerpo. El Backyard no es solo físico — el que resiste aquí tiene algo diferente dentro.',
    colapso:'El cuerpo simplemente se apagó. Llevaste las reservas hasta el límite y más allá. Nadie puede pedirte más que eso.',
    tiempo:'El tiempo límite habló. Completar loops es más difícil de lo que parece cuando el reloj no perdona.'
  };
  const motivo=r.motivo||'colapso';
  const isVictoria=motivo==='victoria';
  el.innerHTML=`
    <h2>${isVictoria?'🏆 ¡Last One Standing!':'🏕️ Backyard terminado'}</h2>
    <div class="card" style="background:${isVictoria?'#111008':'#111'};border-color:${isVictoria?'#4a4808':'#222'};text-align:center">
      <div style="font-size:28px;font-weight:700;color:${isVictoria?'#f0c040':'#aaa'};margin-bottom:6px">${r.loops} loops</div>
      <div style="color:#999;font-size:14px">${Math.round(r.km||0)}km · ${r.loops} hora${r.loops!==1?'s':''}</div>
    </div>
    <div class="card" style="display:flex;justify-content:space-around;text-align:center">
      <div><div style="font-size:20px;font-weight:700">${r.loops}</div><div style="font-size:11px;color:#999">Loops</div></div>
      <div><div style="font-size:20px;font-weight:700">${Math.round(r.km||0)}km</div><div style="font-size:11px;color:#999">Dist.</div></div>
      <div><div style="font-size:20px;font-weight:700">${r.activeAtEnd||0}</div><div style="font-size:11px;color:#999">Activos al final</div></div>
    </div>
    ${hist.length>1?`<div class="section-label">Historial Backyard</div>${hist.slice(-5).map(h=>`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #111;font-size:13px"><span>${h.motivo==='victoria'?'🏆':'🛑'} ${h.loops} loops · ${Math.round(h.km||0)}km</span><span style="color:#999">A${h.year||'—'}</span></div>`).join('')}`:''}
    <div class="card" style="margin-top:10px"><p style="color:#aaa;font-size:14px;margin:0">${esc(motivoTexts[motivo]||motivoTexts.colapso)}</p></div>
    <button class="main" onclick="G._seasonBalanceDone=false;G.screen='ultratrailSeasonBalance';render()">Continuar →</button>`;
}
function renderMDSPreparation(){
  const el=document.getElementById('main');
  const year=G.utYear||1;
  const mds=(ULTRATRAIL_RACES[year]||[]).find(r=>r.isMDS)||{};
  if(!G._mdsInit){
    G._mdsInit=true;
    G.mdsEtapaActual=0;G._mdsResultSaved=false;G._mdsMode=true;
    G._mdsRaciones=6;
  }
  const raciones=G._mdsRaciones||6;
  const pesoRaciones=raciones*500;
  const pesoTotal=6000+pesoRaciones;
  function confirmMDS(){
    G.mdsRacionesRestantes=raciones*6;
    G.mdsEtapaActual=0;G._mdsResultSaved=false;G._mdsMode=true;G._mdsInit=false;
    G.combustible=100;G.pies=100;
    G.screen='mdsDecision';render();
  }
  window._confirmMDS=confirmMDS;
  el.innerHTML=`
    <h2>🏜️ Marathon des Sables</h2>
    <p class="sub">250km · Sahara marroquí · 6 etapas</p>
    <div class="card" style="background:#1e0e00;border-color:#4e2e00">
      <p style="color:#f0a040;margin:0 0 6px 0">La carrera más dura del mundo. Carry your own gear. La organización solo da agua. Tu mochila: entre 6 y 15kg durante 250km de desierto.</p>
      <p style="color:#b07030;font-size:13px;margin:0">Inscripción €${mds.cost||3500} · Premio top-3: €${mds.prize||5000}</p>
    </div>
    <div class="section-label">Raciones de comida</div>
    <div class="card">
      <p style="color:#ccc;font-size:13px;margin:0 0 10px 0">Cada ración pesa 500g. Necesitas mínimo 4 para completar (te quedas sin comida antes del final si llevas menos). Más raciones = más peso = más lento.</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px">
        <button class="secondary" style="padding:6px 14px;font-size:16px" onclick="if(G._mdsRaciones>4){G._mdsRaciones--;renderMDSPreparation();}">−</button>
        <span style="font-size:22px;font-weight:700;color:#f0a040">${raciones}</span>
        <button class="secondary" style="padding:6px 14px;font-size:16px" onclick="if(G._mdsRaciones<8){G._mdsRaciones++;renderMDSPreparation();}">+</button>
        <span style="color:#999;font-size:13px">raciones</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px">
        <span style="color:#999">Peso raciones:</span><span style="color:#ccc">${(pesoRaciones/1000).toFixed(1)}kg</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:3px">
        <span style="color:#999">Peso total mochila:</span><span style="color:${pesoTotal>10000?'#c0392b':pesoTotal>8000?'#e87820':'#4a8a2a'};font-weight:600">${(pesoTotal/1000).toFixed(1)}kg</span>
      </div>
      ${raciones<5?'<div style="color:#c0392b;font-size:12px;margin-top:5px">⚠️ Con menos de 5 raciones corres el riesgo de quedarte sin comida antes del final</div>':''}
    </div>
    <div class="section-label">Las 6 etapas</div>
    ${(mds.etapas||[]).map((e,i)=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1e0e00;font-size:13px"><span style="color:${e.jugable?'#4a90d9':e.cinematica?'#f0c040':'#aaa'}">${i+1}. ${esc(e.name)}</span><span style="color:#c07a10">${e.km}km ${e.jugable?'🎮':e.cinematica?'🎬':'📋'}</span></div>`).join('')}
    <div class="note">🎮 Etapas jugables · 📋 Decisiones rápidas · 🎬 Cinemática</div>
    <button class="main" onclick="window._confirmMDS()">Empezar Etapa 1 →</button>
    <button class="secondary" style="margin-top:8px" onclick="G._mdsInit=false;G.screen='ultratrailSeasonStart';render()">← Volver</button>`;
}
function renderMDSDecision(){
  const el=document.getElementById('main');
  const year=G.utYear||1;
  const mds=(ULTRATRAIL_RACES[year]||[]).find(r=>r.isMDS)||{};
  const etapas=mds.etapas||[];
  const idx=G.mdsEtapaActual||0;
  const etapa=etapas[idx];
  if(!etapa){G.screen='mdsFinal';render();return;}
  if(etapa.cinematica){
    el.innerHTML=`
      <h2>🏜️ ${esc(etapa.name)}</h2>
      <div class="card" style="background:#0e080e;border-color:#3e183e"><p style="color:#f0c040;font-style:italic;font-size:15px;margin:0">${esc(etapa.texto||'')}</p></div>
      <button class="main" onclick="window.mdsCinema()">Cruzar la meta →</button>`;
    window.mdsCinema=function(){
      G.mdsHistorialEtapas=G.mdsHistorialEtapas||[];
      G.mdsHistorialEtapas.push({etapaId:etapa.id,cinematica:true});
      G.mdsEtapaActual=(G.mdsEtapaActual||0)+1;
      G.screen='mdsFinal';render();
    };
    return;
  }
  if(etapa.jugable&&etapa.segs){
    G._utCurrentSegs=etapa.segs;G.seg=0;G.time=0;G.utNocturnaActive=false;
    G._afterRaceScreen='mdsBivouac';G._mdsMode=true;
    G.screen='ultratrailSegment';render();return;
  }
  el.innerHTML=`
    <h2>🏜️ ${esc(etapa.name)}</h2>
    <p class="sub">${etapa.km}km · Etapa ${idx+1} de ${etapas.length}</p>
    <div class="card" style="background:#100c00;border-color:#302800">
      <div style="font-size:12px;color:#c08040;margin-bottom:6px">📋 Etapa no jugable — elige tu estrategia</div>
      ${srow('🔥 Combustible',G.combustible||50)}${srow('🦶 Pies',G.pies||50)}
    </div>
    <div class="section-label">Tu estrategia</div>
    ${(etapa.decisiones||[]).map((d,i)=>`<div class="work-card" style="margin-bottom:8px;cursor:pointer" onclick="window.mdsDecision(${i})">
      <div style="font-weight:600">${esc(d.texto)}</div>
      <div style="font-size:12px;color:#999;margin-top:4px">${Object.entries(d.efecto||{}).map(([k,v])=>`${k}: ${v>0?'+':''}${v}`).join(' · ')}</div>
    </div>`).join('')}`;
  window.mdsDecision=function(i){
    const etapa=(mds.etapas||[])[G.mdsEtapaActual||0];
    if(!etapa||!etapa.decisiones||!etapa.decisiones[i])return;
    const d=etapa.decisiones[i];
    Object.entries(d.efecto||{}).forEach(([k,v])=>{
      if(k==='combustible')G.combustible=Math.max(0,Math.min(100,(G.combustible||50)+v));
      else if(k==='pies')G.pies=Math.max(0,Math.min(100,(G.pies||50)+v));
      else if(k==='piernas')G.runner.legs=Math.max(0,Math.min(100,(G.runner.legs||50)+v));
      else if(k==='hidratacion')G.runner.hydration=Math.max(0,Math.min(100,(G.runner.hydration||50)+v));
    });
    G.mdsRacionesRestantes=Math.max(0,(G.mdsRacionesRestantes||0)-1);
    G.mdsHistorialEtapas=G.mdsHistorialEtapas||[];
    G.mdsHistorialEtapas.push({etapaId:etapa.id,decisionIdx:i,efecto:d.efecto});
    G.mdsEtapaActual=(G.mdsEtapaActual||0)+1;
    G.screen='mdsBivouac';render();
  };
}
function renderMDSBivouac(){
  const el=document.getElementById('main');
  const year=G.utYear||1;
  const mds=(ULTRATRAIL_RACES[year]||[]).find(r=>r.isMDS)||{};
  const etapas=mds.etapas||[];
  const etapaActual=G.mdsEtapaActual||0;
  G.runner.energy=Math.min(100,(G.runner.energy||0)+25);
  G.runner.hydration=Math.min(100,(G.runner.hydration||0)+30);
  G.pies=Math.max(0,(G.pies||0)-3);
  const tips=['La jaima se convierte en tu hogar. 7 desconocidos que se vuelven familia.',
    'El silencio del desierto de noche es algo que no olvidarás nunca.',
    'Cuida tus pies. Las ampollas son el enemigo número uno del MdS.',
    'La etapa larga (86km) decide quién termina y quién abandona.',
    'Gestiona las raciones. Quedarse sin comida tiene penalización de 1 hora por ración.'];
  const rRestantes=G.mdsRacionesRestantes||0;
  el.innerHTML=`
    <h2>🌙 Noche en la jaima</h2>
    <p class="sub">Tras etapa ${etapaActual} · ${Math.max(0,etapas.length-etapaActual-1)} etapa${etapas.length-etapaActual-1!==1?'s':''} restante${etapas.length-etapaActual-1!==1?'s':''}</p>
    <div class="card" style="background:#fdf4e7;border-color:#d4a96a"><p style="color:#7a4010;font-style:italic;margin:0">"${esc(tips[etapaActual%tips.length])}"</p></div>
    <div class="section-label">Tu estado</div>
    <div class="card">${srow('🔥 Combustible',G.combustible||0)}${srow('🦶 Pies',G.pies||0)}${srow('⚡ Energía',G.runner.energy||0)}</div>
    <div style="font-size:13px;color:#999;margin:8px 0">Raciones restantes: <strong style="color:${rRestantes<=1?'#c0392b':'#c07a10'}">${rRestantes}</strong></div>
    ${rRestantes<=0?'<div class="warn">⚠️ Sin raciones — penalización 1h por ración faltante en el final</div>':rRestantes===1?'<div class="warn">⚠️ Última ración — gestiona bien lo que queda</div>':''}
    ${etapaActual>=etapas.length
      ?`<button class="main" onclick="G.screen='mdsFinal';render()">Final →</button>`
      :`<button class="main" onclick="G.screen='mdsDecision';render()">Etapa ${etapaActual+1} →</button>`}`;
}
function renderMDSFinal(){
  const el=document.getElementById('main');
  const year=G.utYear||1;
  const mds=(ULTRATRAIL_RACES[year]||[]).find(r=>r.isMDS)||{};
  if(!G._mdsResultSaved){
    G._mdsResultSaved=true;
    const etapas=mds.etapas||[];
    const done=(G.mdsHistorialEtapas||[]).length;
    const dnf=done<(etapas.length-1)||(G.combustible||0)<=0;
    const pos=dnf?null:Math.max(10,Math.round(150-(G.runner.stats.resistencia||50)/1.5-(G.runner.stats.mental||50)/3+Math.random()*60));
    G.utResults=G.utResults||[];
    G.utResults.push({raceId:'ut_mds',raceName:'Marathon des Sables',year,dnf,pos,km:250,isMDS:true,etapasCompletadas:done});
    if(!dnf){G.utMoney=(G.utMoney||0)+(pos&&pos<=3?mds.prize||5000:Math.round((mds.prize||5000)*0.05));G.utRanking=Math.max(1,(G.utRanking||999)-30);}
    G.utMoney=Math.max(0,(G.utMoney||0)-(mds.cost||3500));
    G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+5);
    G.runner.stats.resistencia=Math.min(100,(G.runner.stats.resistencia||50)+3);
    G.utCurrentRaceIdx=(G.utCurrentRaceIdx||0)+1;
  }
  const res=(G.utResults||[]).filter(r=>r.raceId==='ut_mds'&&r.year===year).slice(-1)[0]||{};
  el.innerHTML=`
    <h2>🏜️ Marathon des Sables — Final</h2>
    <div class="card" style="background:${res.dnf?'#180808':'#081008'};border-color:${res.dnf?'#380808':'#185a18'};text-align:center">
      <div style="font-size:26px;font-weight:700;color:${res.dnf?'#ff6a6a':'#f0c040'};margin-bottom:6px">${res.dnf?'No terminado':'¡Finisher!'}</div>
      ${!res.dnf?`<div style="color:#aaa;font-size:14px">Posición ${res.pos} de cientos · 250km de desierto completados</div>`:`<div style="color:#aaa;font-size:13px">El desierto gana hoy.</div>`}
    </div>
    <div class="card"><p style="color:#aaa;font-size:14px;margin:0">${res.dnf?'Solo los que lo intentan conocen sus límites de verdad. Vuelve más fuerte.':'250 kilómetros de desierto. Sin crew. Carry your own gear. Eso ya nadie te lo quita.'}</p></div>
    <button class="main" onclick="G._seasonBalanceDone=false;G.screen='ultratrailSeasonBalance';render()">Ver balance →</button>`;
}

