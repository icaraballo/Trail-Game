function circuitPoints(pos,total){
  if(pos===1)return 50;if(pos===2)return 40;if(pos===3)return 32;
  if(pos<=5)return 25;if(pos<=8)return 18;if(pos<=10)return 12;
  return Math.max(1,Math.round(10*(1-pos/total)));
}

function profSvg(race, activeSeg, mode, raceProgress){
  const W=560,H=100,PT=8,PB=18,PL=4,PR=4;
  const cW=W-PL-PR,cH=H-PT-PB;
  const COL={climb:'#639922',descent:'#E24B4A',flat:'#888780'};
  const COL_LIGHT={climb:'#EAF3DE',descent:'#FCEBEB',flat:'#F1EFE8'};
  const prog=raceProgress||0;
  const selSeg=activeSeg!=null?activeSeg:-1;

  // Build elevation points
  const pts=[{km:0,elev:0,seg:-1}];
  let ck=0,ce=0;
  race.segs.forEach((s,si)=>{
    const steps=Math.max(3,Math.round(s.km*3));
    for(let i=1;i<=steps;i++){ck+=s.km/steps;ce+=s.gain/steps;pts.push({km:ck,elev:ce,seg:si});}
  });
  const elevs=pts.map(p=>p.elev);
  const minE=Math.min(...elevs),maxE=Math.max(...elevs),er=maxE-minE||1;

  // Boundaries — end at actual race km
  let bounds=[0],c=0;
  race.segs.forEach(s=>{c+=s.km;bounds.push(c);});
  const totalKm=race.km;

  const tx=km=>PL+(km/totalKm)*cW;
  const ty=e=>PT+cH-((e-minE)/er)*cH;

  let html='';

  // Fill and line per segment
  race.segs.forEach((s,si)=>{
    const prev=si===0?{km:0,elev:0}:pts.filter(p=>p.seg===si-1).slice(-1)[0]||{km:bounds[si],elev:0};
    const segPts=[{km:bounds[si],elev:prev.elev},...pts.filter(p=>p.seg===si)];
    if(segPts.length<2)return;
    const last=segPts[segPts.length-1];
    const isDone=mode==='race'&&si<prog;
    const isCur=mode==='race'&&si===prog;
    const isSel=si===selSeg;
    const fill=isDone?'#D3D1C7':isSel||isCur?COL[s.type]:COL_LIGHT[s.type];
    const stroke=isDone?'#B4B2A9':COL[s.type];
    const sw=isSel||isCur?2.5:1.5;
    const op=(mode==='race'&&si>prog&&!isSel)?0.55:1;
    const pp=segPts.map(p=>`${tx(p.km).toFixed(1)},${ty(p.elev).toFixed(1)}`).join(' ');
    const cp=` ${tx(last.km).toFixed(1)},${(PT+cH).toFixed(1)} ${tx(bounds[si]).toFixed(1)},${(PT+cH).toFixed(1)}`;
    html+=`<polygon points="${pp}${cp}" fill="${fill}" opacity="${op}"/>`;
    html+=`<polyline points="${pp}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"/>`;
  });

  // Segment dividers
  bounds.slice(1,-1).forEach((k,i)=>{
    const ep=pts.filter(p=>p.seg===i).slice(-1)[0];
    if(!ep)return;
    html+=`<line x1="${tx(k).toFixed(1)}" y1="${ty(ep.elev).toFixed(1)}" x2="${tx(k).toFixed(1)}" y2="${PT+cH}" stroke="#e8e6e0" stroke-width="0.5" stroke-dasharray="3,2"/>`;
  });

  // Baseline
  html+=`<line x1="${PL}" y1="${PT+cH}" x2="${W-PR}" y2="${PT+cH}" stroke="#e0dfd8" stroke-width="0.5"/>`;

  // Aid stations
  race.segs.forEach((s,si)=>{
    if(!s.aid)return;
    const ep=pts.filter(p=>p.seg===si).slice(-1)[0];
    if(!ep)return;
    html+=`<circle cx="${tx(bounds[si+1]).toFixed(1)}" cy="${ty(ep.elev).toFixed(1)}" r="4" fill="#378ADD"/>`;
  });

  // Current position marker in race mode
  if(mode==='race'){
    const cp=pts.filter(p=>p.seg===prog);
    const mid=cp[Math.floor(cp.length/2)];
    if(mid){
      html+=`<circle cx="${tx(mid.km).toFixed(1)}" cy="${ty(mid.elev).toFixed(1)}" r="5" fill="#1a1a1a"/>`;
      html+=`<circle cx="${tx(mid.km).toFixed(1)}" cy="${ty(mid.elev).toFixed(1)}" r="8.5" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>`;
    }
  }

  // Km axis — ends exactly at race.km
  const step=totalKm<=20?5:totalKm<=35?10:10;
  for(let k=0;k<=totalKm;k+=step)
    html+=`<text x="${tx(k).toFixed(1)}" y="${H-3}" text-anchor="middle" font-size="9" fill="#aaa">${k}km</text>`;
  // Always show final km label if not already shown
  if(totalKm%step!==0)
    html+=`<text x="${tx(totalKm).toFixed(1)}" y="${H-3}" text-anchor="middle" font-size="9" fill="#aaa">${totalKm}km</text>`;

  // Transparent tap/click zones
  race.segs.forEach((s,si)=>{
    const x1=tx(bounds[si]),x2=tx(bounds[si+1]);
    html+=`<rect x="${x1.toFixed(1)}" y="${PT}" width="${(x2-x1).toFixed(1)}" height="${cH+2}" fill="transparent" data-seg="${si}" style="cursor:pointer"/>`;
  });

  const svgId=`prof-${race.id}`;
  return `<svg id="${svgId}" viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block;overflow:visible;cursor:pointer">${html}</svg>`;
}

function profSegInfo(race, si, mode, raceProgress){
  if(si==null||si<0)return `<div style="font-size:12px;color:#aaa;text-align:center;padding:4px 0">Toca un tramo para ver los detalles</div>`;
  const COL={climb:'#639922',descent:'#E24B4A',flat:'#888780'};
  const COL_LIGHT={climb:'#EAF3DE',descent:'#FCEBEB',flat:'#F1EFE8'};
  const TYPE_LABEL={climb:'▲ Subida',descent:'▼ Bajada',flat:'▶ Llano'};
  const prog=raceProgress||0;
  const s=race.segs[si];
  let bounds=[0],c=0;race.segs.forEach(x=>{c+=x.km;bounds.push(c);});
  const kmLeft=race.km-bounds[si];
  const isDone=mode==='race'&&si<prog;
  const isCur=mode==='race'&&si===prog;
  const isAhead=mode==='race'&&si>prog;
  let badge='';
  if(isCur)badge=`<span style="font-size:12px;padding:1px 7px;border-radius:4px;background:${COL_LIGHT[s.type]};color:${COL[s.type]};margin-left:7px">Aquí estás</span>`;
  else if(isDone)badge=`<span style="font-size:12px;padding:1px 7px;border-radius:4px;background:#f5f4f0;color:#888;margin-left:7px">Completado</span>`;
  else if(isAhead)badge=`<span style="font-size:12px;padding:1px 7px;border-radius:4px;background:#f5f4f0;color:#aaa;margin-left:7px">Por delante</span>`;
  const bg=isDone?'#f5f4f0':COL_LIGHT[s.type];
  const border=isDone?'#e0dfd8':COL[s.type];
  return `<div style="margin-top:8px;padding:8px 11px;border-radius:8px;background:${bg};border:0.5px solid ${border}">
    <div style="font-size:13px;font-weight:600;color:${isDone?'#888':COL[s.type]};margin-bottom:2px">${TYPE_LABEL[s.type]} — ${s.name}${badge}</div>
    <div style="font-size:12px;color:#666">${s.km}km${s.gain>0?` · +${s.gain}m`:s.gain<0?` · ${s.gain}m`:''}${s.aid?' · 🔵 Avituallamiento':''}${mode==='race'&&!isDone?` · <strong>${kmLeft.toFixed(0)}km para meta</strong>`:''}</div>
  </div>`;
}

function attachProfHandlers(race, containerId, mode, raceProgress){
  setTimeout(()=>{
    const svg=document.getElementById(`prof-${race.id}`);
    if(!svg)return;
    svg.querySelectorAll('rect[data-seg]').forEach(r=>{
      const handler=()=>{
        const si=parseInt(r.dataset.seg);
        const infoEl=document.getElementById(`prof-info-${containerId}`);
        if(!infoEl)return;
        const cur=infoEl.dataset.sel;
        const next=cur==si?-1:si;
        infoEl.dataset.sel=next;
        infoEl.innerHTML=profSegInfo(race,next>=0?next:null,mode,raceProgress);
        // Redraw with new selection
        const svgWrap=document.getElementById(`prof-wrap-${containerId}`);
        if(svgWrap)svgWrap.innerHTML=profSvg(race,next>=0?next:-1,mode,raceProgress);
        attachProfHandlers(race,containerId,mode,raceProgress);
      };
      r.addEventListener('click',handler);
      r.addEventListener('touchend',e=>{e.preventDefault();handler();});
    });
  },0);
}

function racePreviewCard(race, mode, raceProgress){
  const cid=race.id+(mode||'');
  return `<div class="card">
    <div style="font-size:14px;font-weight:600;margin-bottom:2px">${race.name}</div>
    <div style="font-size:12px;color:#888;margin-bottom:10px">${race.type} · ${race.km}km · ${race.desnivel}</div>
    <div id="prof-wrap-${cid}">${profSvg(race,-1,mode||'preview',raceProgress||0)}</div>
    <div id="prof-info-${cid}" data-sel="-1" style="min-height:20px">${profSegInfo(race,null,mode||'preview',raceProgress||0)}</div>
    <div style="display:flex;gap:10px;font-size:12px;color:#aaa;margin-top:8px;flex-wrap:wrap">
      <span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#EAF3DE;border:1px solid #639922;margin-right:3px;vertical-align:middle"></span>Subida</span>
      <span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#FCEBEB;border:1px solid #E24B4A;margin-right:3px;vertical-align:middle"></span>Bajada</span>
      <span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#F1EFE8;border:1px solid #888;margin-right:3px;vertical-align:middle"></span>Llano</span>
      <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#378ADD;margin-right:3px;vertical-align:middle"></span>Avituallamiento</span>
    </div>
  </div>`;
}
function effForWork(){
  const wo=curWorkOpt();
  const vacBonus=vacTrainingHBonus(G.currentQuarter||1);
  const brandH=brandHoursPerWeek(); // 6h/sem si marca activa sin empleado
  const promotionPenalty=G.trainingHPenalty||0; // 2h/sem por ascenso laboral aceptado
  const h=Math.max(0,(wo?.trainingH||5)+vacBonus-brandH-promotionPenalty);
  const overlapMult=(G.carreraVida&&G.lifecyclePhase==='overlap')?lifeAthleteEffMult(G.lifeAthleteHours||0):1.0;
  return trainingEffFromH(h)*(G.spending.entrenador?1.2:1.0)*G.trainingEff*overlapMult;
}
function getTerrainCondition(race){
  // Based on season and recent weather_risk
  const s=getSeason(race.month);
  const roll=Math.random();
  if(s==='invierno'&&roll<0.4)return {id:'nieve',label:'Nieve',icon:'❄',descentMult:1.3,climbMult:1.2,color:'#4a90d9'};
  if(s==='invierno'&&roll<0.7)return {id:'barro',label:'Barro',icon:'🟫',descentMult:1.2,climbMult:1.1,color:'#8B5E3C'};
  if(s==='verano'&&roll<0.3)return {id:'seco',label:'Polvo seco',icon:'🌵',descentMult:1.15,climbMult:1.0,color:'#c07a10'};
  if(race.weather_risk>0.25&&roll<0.3)return {id:'barro',label:'Barro (lluvia reciente)',icon:'🟫',descentMult:1.25,climbMult:1.1,color:'#8B5E3C'};
  return {id:'bueno',label:'Terreno en buen estado',icon:'✅',descentMult:1.0,climbMult:1.0,color:'#4a8a2a'};
}
function getAltitudePenalty(race){
  if(!race.altitude)return 0;
  const hasAltitudeTraining=G.club?.id==='montana'||G.club?.id==='elite'||hasClubEntrenador();
  if(hasAltitudeTraining)return 0.03;
  return 0.10; // 10% slower without altitude training
}
function applyInjuryToRaceStart(){
  if(!G.injuryType)return;
  const inj=INJURY_TYPES[G.injuryType];
  if(!inj)return;
  const ns=inj.nextRaceStats||{};
  if(ns.energy!=null) G.runner.energy=ns.energy;
  if(ns.legs!=null)   G.runner.legs=ns.legs;
  if(ns.hydration!=null) G.runner.hydration=ns.hydration;
}

function getSpecificInjury(paceLog,load){
  const allout=paceLog.filter(p=>p==='allout').length;
  const push=paceLog.filter(p=>p==='push').length;
  let risk=0;
  if(load>=85)risk+=0.25;
  else if(load>=70)risk+=0.12;
  if(allout>=3)risk+=0.15;
  if(allout>=2)risk+=0.08;
  if(hasFisio())risk*=0.35;
  if(Math.random()>risk)return null;
  // Type depends on what dominated
  const descents=(G.selectedRaces[G.currentRaceIdx]?.segs||[]).filter(s=>s.type==='descent').length;
  if(load>=85&&allout>=3)return 'fractura';
  if(descents>=3)return 'tendinitis';
  return 'rotura';
}

// ══════════════════════════════════════
//  TANDA 7: REPUTACIÓN POR HISTORIAL
// ══════════════════════════════════════
function getRaceReputation(raceId){
  const hist=G.careerRaceHistory[raceId]||{finished:0,abandoned:0};
  return hist;
}
function getReputationBonus(raceId){
  const rep=getRaceReputation(raceId);
  // Each completion of same race gives small mental/sponsor bonus
  if(rep.finished>=3)return {label:'Finisher veterano ×'+rep.finished,statBonus:{mental:2},sponsorBonus:true};
  if(rep.finished>=2)return {label:'Finisher repetido ×'+rep.finished,statBonus:{mental:1},sponsorBonus:false};
  return null;
}
function getAbandonPenalty(){
  const abandoned=G.raceAbandonedCount||0;
  if(abandoned===0)return null;
  if(abandoned>=3)return {label:'Historial de abandonos ('+abandoned+')',sponsorMult:0.8};
  return {label:'Abandonos previos ('+abandoned+')',sponsorMult:0.95};
}
function initRace(){
  const race=G.selectedRaces[G.currentRaceIdx];
  if(!race||G._raceInitialized)return;
  G._raceInitialized=true;

  G.weather=Math.random()<race.weather_risk?'extremo':Math.random()>0.5?'soleado':'nublado';
  G.runner.energy=100;G.runner.hydration=100;
  G.runner.legs=G.legsPenalty?82:100;G.legsPenalty=false;
  G.time=0;G.seg=0;G.raceEvent='';G.aidSelected=[];
  // ── Condición del día (genera solo una vez por carrera) ───────────
  if(!G.dayConditionGenerated){
    const dayRoll=Math.random();
    const conditions=[
      {id:'normal',        w:0.40, icon:'', label:'',             energyMod:0,  legsMod:0, hydMod:0},
      {id:'buena_noche',   w:0.12, icon:'😴', label:'Dormiste como un tronco.',   energyMod:5,  legsMod:0,  hydMod:0},
      {id:'mala_noche',    w:0.12, icon:'😶', label:'Noche irregular. Las piernas no están finas.', energyMod:0, legsMod:-5, hydMod:0},
      {id:'estomago',      w:0.10, icon:'🤢', label:'El estómago no está fino esta mañana.',energyMod:0, legsMod:0,  hydMod:-8},
      {id:'piernas_mal',   w:0.10, icon:'🦵', label:'Las piernas llevan días sin recuperar del todo.', energyMod:0, legsMod:-8, hydMod:0},
      {id:'dia_especial',  w:0.08, icon:'⚡', label:'Sin explicación, esta mañana todo fluye.',energyMod:7, legsMod:5,  hydMod:0},
      {id:'calor_extra',   w:0.08, icon:'🌡', label:'Más calor de lo previsto. Bebe antes de salir.',energyMod:-3,legsMod:0, hydMod:-5},
    ];
    let cumul=0;
    let picked=conditions[0];
    for(const c of conditions){cumul+=c.w;if(dayRoll<=cumul){picked=c;break;}}
    G.dayCondition=picked.id==='normal'?null:picked;
    G.dayConditionGenerated=true;
  }

  // Generar 14 rivales del pool según tier de carrera y ranking actual del jugador (5c)
  const rankingForcesHighTier=G.ranking<=10; // top 10 mundial: siempre hay élite
  const maxTier=rankingForcesHighTier?3:(race.reqRanking===999?1:race.reqRanking<=15?3:race.tier==='nacional'?2:race.tier==='elite'?3:2);
  const minTier=rankingForcesHighTier?2:1; // al menos tier 2 si el jugador está en top 10
  const pool=[...RIVALS_POOL.filter(r=>r.tier<=maxTier&&r.tier>=minTier)];
  const shuffled=shuffle(pool).slice(0,14);

  // Escalar dificultad por tier de carrera
  const tierDiffMult={local:1.15,regional:1.08,nacional:1.02,elite:0.97};
  const diffMult=tierDiffMult[race.tier]||1.0;
  // Escalado de dificultad por año según modo:
  // fácil/medio: rivales algo más lentos al inicio (pequeño margen de aprendizaje)
  // difícil/hardcore: rivales cada año más rápidos (presión creciente)
  const _ybCfg={
    facil:    {scale: 0.010, cap:  0.05},
    medio:    {scale: 0.015, cap:  0.08},
    dificil:  {scale:-0.022, cap: -0.13},
    hardcore: {scale:-0.030, cap: -0.18},
    expres:   {scale:-0.015, cap: -0.03},
  }[G.gameMode||'medio']||{scale:0.015,cap:0.08};
  const _ybRaw=(G.year-1)*_ybCfg.scale;
  // 5c: Bonus de dificultad adicional según ranking (independiente del año)
  const rankingDiffBonus=G.ranking<=10?-0.07:G.ranking<=50?-0.04:G.ranking<=100?-0.02:0;
  const yearBonus=(_ybCfg.scale<0?Math.max(_ybCfg.cap,_ybRaw):Math.min(_ybCfg.cap,_ybRaw))+rankingDiffBonus;

  G.rivals=shuffled.map(r=>{
    let rankingRange;
    if(r.tier===1){rankingRange=[200,500];}
    else if(r.tier===2){rankingRange=[50,200];}
    else{rankingRange=[1,50];}
    const ranking=Math.floor(rankingRange[0]+Math.random()*(rankingRange[1]-rankingRange[0]));
    const winsProb={1:0.2,2:0.45,3:0.7}[r.tier]||0.3;
    const recentWins=Math.random()<winsProb?Math.floor(1+Math.random()*(r.tier*1.5)):0;
    const ageRanges={3:[20,36],2:[24,44],1:[28,56]};
    const ar=ageRanges[r.tier]||[24,44];
    const rivalAge=Math.floor(ar[0]+Math.random()*(ar[1]-ar[0]));
    return {
      name:r.name,spec:r.spec,flag:r.flag||'',country:r.country||'',time:0,
      mult:(r.base*diffMult*modeCfg().rivalMult*(0.87+Math.random()*0.26)*(1-agingDeg()*0.25))+yearBonus,
      ranking,recentWins,age:rivalAge
    };
  });
  G.liveClass=[];
  G.aidSelected=[];
  G.terrainCondition=getTerrainCondition(race);
  G.paceLog=[];
  G.midRaceEventTriggered={};G.midRaceEvent=null;G.stormActive=false;G.stormProtected=false;

  // ── Mental momentum (p6) — racha de resultados recientes ─────────
  const recentResults=(G.raceResults||[]).filter(r=>r.pos>0).slice(-4);
  let mentalMom=0;
  if(recentResults.length>=2){
    const goodCount=recentResults.filter(r=>r.pos<=Math.ceil(10+(r.all?.length||15)*0.3)).length;
    const badCount=recentResults.filter(r=>r.zeroedOut||r.pos>Math.ceil((r.all?.length||15)*0.7)).length;
    const abandonRecent=(G.raceResults||[]).slice(-3).filter(r=>r.pos===0&&!r.injured).length;
    if(goodCount>=2)mentalMom=Math.min(5,goodCount);
    if(badCount>=2||abandonRecent>=1)mentalMom=Math.max(-5,-(badCount+abandonRecent*2));
  }
  G.mentalMomentum=mentalMom;
  // Apply pre-race nutrition
  const nutr=PRE_RACE_NUTRITION.find(n=>n.id===(G.preRaceNutrition||'pasta'))||PRE_RACE_NUTRITION[0];
  const nutrCost=getNutritionCost(nutr.id);
  if(nutrCost>0)G.money=Math.max(0,G.money-nutrCost);
  G.fatBurning=(nutr.id==='ayuno');
  // Coste de geles en bolsillo
  if((G.gelsCarried||0)>0){const gelCost=(G.gelsCarried||0)*2;G.money=Math.max(0,G.money-gelCost);G.gelsUsed=0;}
  const injStart=G.injuryType?INJURY_TYPES[G.injuryType]?.nextRaceStats:null;
  const energyCap=nutr.id==='pro'?110:100;

  // ── Aplicar condición del día ────────────────────────────────────
  const dayEnergyMod=G.dayCondition?.energyMod||0;
  const dayLegsMod=G.dayCondition?.legsMod||0;
  const dayHydMod=G.dayCondition?.hydMod||0;

  // ── Aplicar taper bonus ──────────────────────────────────────────
  const taperE=G.taperBonus?6:0;
  const taperL=G.taperBonus?6:0;

  G.runner.energy=injStart?injStart.energy:Math.min(energyCap,Math.round((100+nutr.energyBonus+dayEnergyMod+taperE)*(G.nextRaceEnergyStart!=null?G.nextRaceEnergyStart/100:1)));
  G.runner.hydration=injStart?injStart.hydration:Math.min(100,(G.nextRaceHydrationStart??100)+dayHydMod);
  G.runner.legs=injStart?injStart.legs:Math.min(100,(G.legsPenalty?82:100)*(G.nextRaceLegsStart!=null?G.nextRaceLegsStart/100:1)+dayLegsMod+taperL);
  G.legsPenalty=false;
  // Mental momentum: modifica temporalmente el stat mental para la carrera
  if(!injStart&&G.mentalMomentum!==0){
    const _before=G.runner.stats.mental;
    G.runner.stats.mental=Math.max(10,Math.min(100,G.runner.stats.mental+G.mentalMomentum));
    G._mentalMomentumApplied=G.runner.stats.mental-_before; // delta real (clamped)
  }
  // Warmup bonus (p9) — temporal para esta carrera
  if(G.warmedUp&&!injStart){
    G.runner.energy=Math.max(10,G.runner.energy-5);
    const _velBefore=G.runner.stats.velocidad;
    const _subBefore=G.runner.stats.subida;
    G.runner.stats.velocidad=Math.min(100,G.runner.stats.velocidad+4);
    G.runner.stats.subida=Math.min(100,G.runner.stats.subida+3);
    G._warmupApplied=true;
    G._warmupVelDelta=G.runner.stats.velocidad-_velBefore;
    G._warmupSubDelta=G.runner.stats.subida-_subBefore;
  }
  G.nextRaceEnergyStart=null;G.nextRaceLegsStart=null;G.nextRaceHydrationStart=null;
  G.postRaceConsequence=null;
  G.preDegradMult=1.0;
}
function renderPreRace(){
  const race=G.selectedRaces[G.currentRaceIdx];
  if(!race){applyTraining();G.screen='seasonBalance';render();return;}
  // Init race state only once per race (safe to re-render without side effects)
  initRace();
  const el=document.getElementById('main');
  const wlabel={soleado:'Soleado ☀',nublado:'Nublado ☁',extremo:'Condiciones extremas ⚠',tormenta:'Tormenta ⛈'};
  const hint=bodyLoadHint();
  const se=getSeasonEffects(race.month);
  const altPenalty=getAltitudePenalty(race);
  const rep=getReputationBonus(race.id);

  // ── PB de esta carrera ───────────────────────────────────────────
  const pb=G.personalBests&&G.personalBests[race.id];
  const pbHtml=pb?`<div style="font-size:12px;background:#fef9ec;border-radius:6px;padding:6px 10px;margin-bottom:10px;color:#c07a10">🏆 Tu récord aquí: <strong>${fmt(pb.time)}</strong> · Año ${pb.year}${pb.pos?', '+pb.pos+'º':''}</div>`:'';
  const nutr=PRE_RACE_NUTRITION.find(n=>n.id===(G.preRaceNutrition||'pasta'))||PRE_RACE_NUTRITION[0];

  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px">
      <h2>${race.name}</h2>
      <span style="font-size:12px;color:#999;padding-top:5px">Carrera ${G.currentRaceIdx+1}/${G.selectedRaces.length}</span>
    </div>
    <p class="sub">${race.type} · ${race.km}km · ${race.desnivel}</p>
    <div class="stat-grid">
      ${[['Distancia',race.km+'km'],['Desnivel',race.desnivel],['Clima',wlabel[G.weather]]].map(([l,v])=>`<div class="stat"><div class="stat-label">${l}</div><div class="stat-val" style="font-size:12px">${v}</div></div>`).join('')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      <span class="terrain-badge" style="background:${G.terrainCondition.color}22;color:${G.terrainCondition.color}">${G.terrainCondition.icon} ${G.terrainCondition.label}</span>
      ${race.altitude?`<span class="terrain-badge" style="background:#4a90d922;color:#4a90d9">⛰ Alta altitud</span>`:''}
      ${rep?`<span class="terrain-badge" style="background:#c07a1022;color:#c07a10">🏆 ${rep.label}</span>`:''}
      <span class="terrain-badge" style="background:var(--color-background-secondary);color:var(--color-text-secondary)">${{facil:'🟢 Fácil',medio:'🟡 Medio',dificil:'🔴 Difícil',hardcore:'💀 Hardcore'}[G.gameMode||'medio']}</span>
      ${G.startStrategy&&G.startStrategy!=='equilibrado'?`<span class="terrain-badge" style="background:${G.startStrategy==='conservador'?'#4a8a2a22':'#c0392b22'};color:${G.startStrategy==='conservador'?'#4a8a2a':'#c0392b'}">${G.startStrategy==='conservador'?'🐢 Conservador':'🔥 A tope'}</span>`:''}
    </div>
    ${pbHtml}
    ${G.dayCondition?`<div class="note">${G.dayCondition.icon} <strong>Condición del día</strong> — ${G.dayCondition.label}</div>`:''}
    ${G.taperBonus?`<div class="note">💤 <strong>Has hecho tapering</strong> — llegas con más energía y las piernas más frescas (+6 energía, +6 piernas).</div>`:''}
    ${G.weather==='extremo'?`<div class="warn">Condiciones extremas — hidratación crítica.</div>`:
      G.weather==='soleado'&&se.label.includes('☀')?`<div class="warn">Calor intenso de verano.</div>`:''}
    ${G.terrainCondition.id==='barro'?`<div class="warn">Terreno con barro — bajadas más lentas y mayor riesgo de caída.</div>`:''}
    ${G.terrainCondition.id==='nieve'?`<div class="danger">Nieve en ruta — ritmo muy reducido en todas las subidas y bajadas.</div>`:''}
    ${altPenalty>0?`<div class="warn">Alta altitud sin entrenamiento específico — ${Math.round(altPenalty*100)}% más lento en subidas.</div>`:''}
    ${hint?`<div class="${hint.type}">${hint.msg}</div>`:''}
    ${(()=>{const ad=agingDeg();if(ad<=0)return '';const pct=Math.round(ad*100);if(pct>=16)return `<div class="warn">⏳ Con ${G.runner.age} años el cuerpo gasta más energía y los avituallamientos recuperan menos. Los rivales también se alejan un poco más.</div>`;return `<div class="hint">⏳ A los ${G.runner.age} años el desgaste empieza a notarse en carrera — más cansancio por tramo.</div>`;})()}
    ${G.runner.legs<100?`<div class="danger">Llegas con las piernas tocadas (${Math.round(G.runner.legs)}%).</div>`:''}
    ${(()=>{const mm=G.mentalMomentum||0;if(mm===0)return '';const good=mm>0;return `<div class="${good?'note':'hint'}">${good?'🔥':'😶'} <strong>Mental ${good?'+'+mm:mm}</strong> — ${good?'Llevas una buena racha. El cuerpo responde mejor al esfuerzo.':'Vienes de resultados duros. La cabeza no ayuda hoy.'}</div>`;})()}
    ${nutr.id!=='pasta'?`<div class="note">Nutrición previa: ${nutr.label} — energía inicial +${nutr.energyBonus}</div>`:''}
    ${(G.dropbagItems||[]).length>0?`<div class="note">Dropbag preparada: ${G.dropbagItems.map(id=>DROPBAG_OPTIONS.find(d=>d.id===id)?.label||id).join(' + ')}</div>`:''}
    ${(G.gelsCarried||0)>0?`<div class="note">🧃 Llevas ${G.gelsCarried} gel${G.gelsCarried>1?'es':''} en el bolsillo · €${G.gelsCarried*2}</div>`:''}
    ${G.warmedUp?`<div class="note">🏃 Calentamiento hecho · −5 energía inicial · +4 Velocidad · +3 Subida</div>`:''}
    ${racePreviewCard(race,'preview',0)}
    <div class="section-label">${G.rivals.length} corredores en carrera <button class="tip-btn" onclick="showTip('Rivales en carrera','El <strong>tier</strong> del rival indica su nivel: tier 1 = amateur local, tier 3 = élite nacional. Su ranking (#) y victorias recientes (W) dan una idea de su forma actual.<br><br>Los rivales de tier alto son casi imbatibles los primeros años. Céntrate en acabar bien posicionado entre los de tu nivel — el ranking global mejora con consistencia, no con victorias sueltas.')">ⓘ</button></div>
    ${(()=>{const nem=G.nemesis;if(!nem||nem.wins<2)return '';const inRace=G.rivals.some(r=>r.name===nem.name);if(!inRace)return '';return `<div class="warn" style="margin-bottom:8px">🎯 <strong>${nem.flag} ${nem.name}</strong> está en esta carrera — te lleva ${nem.wins}-0. Última vez te sacó ${fmt(nem.avgGap)}.</div>`;})()}
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
      ${G.rivals.slice(0,8).map(rv=>`<div style="font-size:11px;background:var(--color-background-secondary);border-radius:6px;padding:4px 10px;color:var(--color-text-secondary);display:flex;align-items:center;gap:4px">
        <span title="${rv.country||''}" style="cursor:default">${rv.flag||''}</span>
        <span style="font-weight:600">${rv.name}</span>
        <span style="color:#aaa">·</span>
        <span style="font-size:10px;color:#888">#${rv.ranking}${rv.recentWins?` · ${rv.recentWins}W`:''}</span>
      </div>`).join('')}
      ${G.rivals.length>8?`<span style="font-size:12px;color:var(--color-text-tertiary);padding:3px 8px">+${G.rivals.length-8} más...</span>`:''}
    </div>
    <div class="grid-2">
      <button class="main" onclick="G.screen=${G.gameMode==='expres'?`'expresPreRacePrep'`:`'preRacePrep'`};render()" style="margin-top:0">← Preparación</button>
      <button class="main" onclick="G.startStrategy=G.startStrategy||'equilibrado';G.screen=${G.gameMode==='expres'?`'segment';G.raceEvent=''`:`'startStrategy'`};render()" style="margin-top:0">${G.gameMode==='expres'?'¡Salir a correr! →':'Estrategia de salida →'}</button>
    </div>`;
  attachProfHandlers(race, race.id+'preview', 'preview', 0);
}

function liveClassPanel(){
  if(!G.rivals||G.rivals.length===0||G.seg===0)return '';
  const all=[{name:G.runner.name||'Tú',time:G.time,me:true},...G.rivals.map(r=>({name:r.name,time:r.time,me:false}))].sort((a,b)=>a.time-b.time);
  const myPos=all.findIndex(x=>x.me);
  const start=Math.max(0,myPos-2);
  const end=Math.min(all.length,start+5);
  const slice=all.slice(start,end);
  const myTime=G.time;
  return `<div class="live-class">
    <div class="live-class-title">Clasificación · ${myPos+1}º de ${all.length}</div>
    ${slice.map((r,i)=>{
      const absPos=start+i;
      const gap=r.me?'—':r.time<myTime?'-'+fmt(myTime-r.time):'+'+fmt(r.time-myTime);
      const flagHtml=r.flag?`<span title="${r.country||''}" style="cursor:default;font-size:13px">${r.flag}</span> `:'';
      return `<div class="live-row ${r.me?'me':''}">
        <span class="live-pos" style="color:${absPos===0?'#c07a10':'#bbb'}">${absPos+1}º</span>
        <span class="live-name">${flagHtml}${r.name}${r.me?' ◀':''}</span>
        <span class="live-gap">${gap}</span>
      </div>`;}).join('')}
  </div>`;
}

// ── SEGMENT ────────────────────────────
// ── START STRATEGY ─────────────────────
function renderStartStrategy(){
  const el=document.getElementById('main');
  const race=G.selectedRaces[G.currentRaceIdx];
  const strategies=[
    {id:'conservador',icon:'🐢',label:'Conservador',
     desc:'Sales tranquilo. Guardas fuerzas para el final.',
     detail:'Primeros tramos −8% velocidad. Últimos tramos +10% rendimiento. Fatiga acumulada más lenta.',
     earlyMult:1.08, lateMult:0.92, fatigueMod:-0.15, col:'#4a8a2a'},
    {id:'equilibrado',icon:'⚖️',label:'Equilibrado',
     desc:'Ritmo constante de principio a fin.',
     detail:'Sin bonos ni penalizaciones. El modo base.',
     earlyMult:1.0, lateMult:1.0, fatigueMod:0, col:'#4a90d9'},
    {id:'atope',icon:'🔥',label:'A tope',
     desc:'Máxima velocidad desde la salida. El cuerpo paga después.',
     detail:'Primeros tramos +10% velocidad. Fatiga exponencial acumulada más rápida. Los últimos km cuestan el doble.',
     earlyMult:0.90, lateMult:1.12, fatigueMod:0.30, col:'#c0392b'},
  ];
  const sel=G.startStrategy||'equilibrado';
  el.innerHTML=`
    <h2>Estrategia de salida</h2>
    <p class="sub">${race?.name||''} · ¿Cómo vas a salir?</p>
    <div style="display:grid;gap:8px;margin-bottom:16px">
      ${strategies.map(s=>`
        <div class="work-card ${sel===s.id?'sel':''}" onclick="G.startStrategy='${s.id}';render()" style="${sel===s.id?'border-color:'+s.col+';background:'+s.col+'11;':''}">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="font-size:26px;flex-shrink:0">${s.icon}</div>
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700;color:${sel===s.id?s.col:'#1a1a1a'}">${s.label}</div>
              <div style="font-size:13px;color:#555;margin:2px 0">${s.desc}</div>
              <div style="font-size:12px;color:#aaa">${s.detail}</div>
            </div>
            ${sel===s.id?`<span style="color:${s.col};font-size:18px;flex-shrink:0">✓</span>`:''}
          </div>
        </div>`).join('')}
    </div>
    <div class="grid-2">
      <button class="main" onclick="G.screen='preRace';render()" style="margin-top:0">← Volver</button>
      <button class="main" onclick="G.screen='segment';G.raceEvent='';render()" style="margin-top:0">¡Salir a correr! →</button>
    </div>`;
}

function renderSegment(){
  const segs=curSegs();const s=segs[G.seg];
  if(!s){finishRace();return;}
  const race=G.selectedRaces[G.currentRaceIdx];
  const el=document.getElementById('main');
  el.innerHTML=`
    ${topBar()}${progBar()}${raceStats()}
    ${liveClassPanel()}
    ${race?`<div style="margin-bottom:10px">
      <div id="prof-wrap-race">${profSvg(race,G.seg,'race',G.seg)}</div>
      <div id="prof-info-race" data-sel="${G.seg}">${profSegInfo(race,G.seg,'race',G.seg)}</div>
    </div>`:''}
    ${G.raceEvent?`<div class="event-box">${G.raceEvent}</div>`:''}
    ${G.stormActive?`<div class="${G.stormProtected?'note':'danger'}">⛈ Tormenta en curso${G.stormProtected?' · Equipado, hidratación protegida':' · Hidratación muy penalizada en todos los tramos'}</div>`:''}
    <div class="section-label">Elige tu ritmo:</div>
    <div class="pace-grid">
      ${[['conservar','Conservar','Ahorra fuerzas','-4 energía',1.18],['steady','Ritmo fijo','Equilibrado','-9 energía',1.0],['push','Apretar','Rápido pero cuesta','-17 energía',0.9],['allout','A tope','Máximo esfuerzo','-27 energía',0.8]].map(([id,l,d,c,mult])=>{
        const mins=Math.round(s.base*mult/60);
        const sb=getEffStat('bajada');
        const load=getBodyLoad();
        const isAllout=id==='allout';
        const isPush=id==='push';
        const onDescent=s.type==='descent';
        const recentLog=G.paceLog||[];
        const alloutStreak=recentLog.slice(-3).filter(x=>x==='allout').length;
        const hardCount=recentLog.slice(-4).filter(x=>x==='allout'||x==='push').length;
        let warningMsg='';let warningCol='';
        if(isAllout&&alloutStreak>=2){
          {const baseMult=alloutStreak>=3?2.2:1.6;const realMult=(baseMult*(modeCfg().fatigueMult||1.0)).toFixed(1);warningMsg=`⚠ ${alloutStreak} tramos a tope seguidos — fatiga ×${realMult} en energía y piernas`;warningCol='#c0392b';}
        } else if((isAllout||isPush)&&hardCount>=3){
          warningMsg=`⚠ Llevas ${hardCount} tramos duros — el cuerpo está pagando el precio`;warningCol='#c07a10';
        } else if(isAllout&&onDescent){
          if(sb<50&&load>=70){warningMsg=`⚠ bajada técnica + cuerpo cargado (${load}%) — riesgo alto`;warningCol='#c0392b';}
          else if(sb<50)     {warningMsg=`⚠ bajada técnica (bajada ${sb}) — posible caída`;warningCol='#c0392b';}
          else if(load>=85)  {warningMsg=`⚠ cuerpo muy al límite (${load}%) — posible caída`;warningCol='#c0392b';}
          else if(load>=70)  {warningMsg=`⚠ cuerpo cargado (${load}%) — hay riesgo de caída`;warningCol='#c07a10';}
        } else if(isAllout&&load>=70&&!onDescent){
          warningMsg=`⚠ cuerpo cargado — recuperación lenta`;warningCol='#c07a10';
        }
        // Adjust displayed cost if fatigue multiplier active
        const fatigueMult=alloutStreak>=3?2.2:alloutStreak===2?1.6:hardCount>=3?1.3:1.0;
        const adjCost=(isAllout||isPush)&&fatigueMult>1?c+` (×${fatigueMult} fatiga)`:c;
        return `<div class="pace" onclick="doPace('${id}')">
          <div class="pace-label">${l}</div>
          <div class="pace-desc">${d}</div>
          ${warningMsg?`<div style="font-size:12px;color:${warningCol};margin-bottom:4px">${warningMsg}</div>`:''}
          <div class="pace-meta"><span style="font-size:12px">${adjCost}</span><span>~${mins} min</span></div>
        </div>`;}).join('')}
    </div>
    ${(()=>{
      const r=G.runner;
      const minStat=Math.min(r.energy,r.hydration,r.legs);
      const critCount=[r.energy,r.hydration,r.legs].filter(v=>v<10).length;
      if(minStat<10){
        const col=critCount>=2?'#c0392b':critCount===1?'#c07a10':'#888';
        const bg=critCount>=2?'#fef0f0':critCount===1?'#fff9f0':'#f5f5f5';
        const msg=critCount>=2?'⚠ Límite físico — continuar tiene consecuencias graves':critCount===1?'⚠ Al límite — continuar puede costar caro':'Al límite — considera abandonar';
        return `<div style="margin-top:10px;padding:10px 12px;background:${bg};border:1.5px solid ${col};border-radius:8px">
          <div style="font-size:12px;color:${col};font-weight:600;margin-bottom:6px">${msg}</div>
          <button class="abandon-btn" style="border-color:${col};color:${col};background:${bg};margin-top:0" onclick="doAbandon()">Abandonar carrera</button>
        </div>`;
      } else if(minStat<30){
        return `<button class="abandon-btn" style="border-color:#ccc;color:#999;background:#fafafa;margin-top:8px;font-size:13px" onclick="doAbandon()">Abandonar carrera</button>`;
      }
      return '';
    })()}
    ${(()=>{
      const gelesLeft=(G.gelsCarried||0)-(G.gelsUsed||0);
      if(gelesLeft<=0)return '';
      const nb=G.sponsors.nutricion?1.2:1.0;
      const gelEnergy=Math.round(18*nb);
      const energyLow=G.runner.energy<50;
      return `<div style="margin-top:10px;display:flex;align-items:center;gap:10px;padding:9px 14px;background:#f2faf0;border:1px solid #b8ddb8;border-radius:8px">
        <span style="font-size:18px">🧃</span>
        <div style="flex:1;font-size:13px;color:#2d5a2d"><strong>${gelesLeft} gel${gelesLeft>1?'es':''} disponible${gelesLeft>1?'s':''}</strong> · +${gelEnergy} energía${energyLow?' — ¡buena idea ahora!':''}</div>
        <button class="secondary" style="font-size:13px;padding:5px 12px;background:#4a8a2a;color:#fff;border-color:#4a8a2a" onclick="doUseGel()">Usar gel</button>
      </div>`;
    })()}
    `;
  if(race) attachProfHandlers(race,'race','race',G.seg);
}

// ── AID ────────────────────────────────
window.doUseGel=()=>{
  const gelesLeft=(G.gelsCarried||0)-(G.gelsUsed||0);
  if(gelesLeft<=0)return;
  const nb=G.sponsors.nutricion?1.2:1.0;
  const gelEnergy=Math.round(18*nb);
  G.runner.energy=Math.min(100,G.runner.energy+gelEnergy);
  G.time+=8; // 8 segundos de pausa para el gel
  G.gelsUsed=(G.gelsUsed||0)+1;
  showToast(`🧃 Gel · +${gelEnergy} energía`,'#4a8a2a');
  render();
};
const AID_OPTIONS=[
  {id:'gel',    label:'Gel energético', col:'#4a8a2a', timeCost:15, efFn:(nb)=>`+${Math.round(20*nb)} energía`},
  {id:'agua',   label:'Beber agua',     col:'#4a90d9', timeCost:0,  efFn:(nb)=>'+30 hidratación'},
  {id:'solido', label:'Comida sólida',  col:'#c07a10', timeCost:45, efFn:(nb)=>`+${Math.round(35*nb)} energía`},
  {id:'descanso',label:'Descansar',     col:'#888',    timeCost:90, efFn:(nb)=>'+15 energía +15 hidra'},
];
function renderAid(){
  const el=document.getElementById('main');
  const nb=G.sponsors.nutricion?1.2:1.0;
  const sel=G.aidSelected||[];
  const remaining=2-sel.length;
  const selLabel=sel.length===0?'sin selección':sel.map(id=>AID_OPTIONS.find(a=>a.id===id)?.label).join(' + ');
  const nutBadge=G.sponsors.nutricion
    ? ' · <span style="color:#4a8a2a;cursor:pointer;text-decoration:underline dotted" onclick="toggleNutTooltip()">sponsor nutrición +20% ⓘ</span>'
    : '';
  const nutGel=Math.round(20*1.2);
  const nutSolid=Math.round(35*1.2);
  // Check if this is the dropbag aid point (middle of ultra)
  const race=G.selectedRaces[G.currentRaceIdx];
  const segs=curSegs();
  const _doneKm=segs.slice(0,G.seg).reduce((a,s)=>a+s.km,0);
  const _totalKm=segs.reduce((a,s)=>a+s.km,0);
  const _racePct=_totalKm>0?_doneKm/_totalKm:0;
  const isDropbagPoint=race&&race.km>=40&&dropItems.length>0&&!G.dropbagShown&&_racePct>=0.35&&_racePct<=0.72;
  if(isDropbagPoint) G.dropbagShown=true;
  const dropItems=(G.dropbagItems||[]).filter(id=>!G.dropbagUsed?.includes(id));
  el.innerHTML=`
    ${topBar()}${progBar()}${raceStats()}
    ${liveClassPanel()}
    <p style="font-size:15px;font-weight:600;margin-bottom:2px">Avituallamiento</p>
    <p style="font-size:13px;color:#888;margin-bottom:12px">Hasta 2 cosas · ${remaining} restante${remaining!==1?'s':''}${nutBadge}</p>
    <div id="nut-tooltip" style="display:none;background:#eaf4ea;border:1px solid #b8ddb8;border-radius:8px;padding:9px 13px;font-size:13px;color:#2d5a2d;margin-bottom:12px">
      Tu sponsor de nutrición mejora la eficacia de los geles y la comida sólida un 20%. Gel: +${nutGel} energía (en vez de +20). Comida sólida: +${nutSolid} energía (en vez de +35).
    </div>
    ${AID_OPTIONS.map(a=>{
      const isSel=sel.includes(a.id);
      const disabled=!isSel&&remaining===0;
      return `<div class="aid-row ${disabled?'disabled':''} ${isSel?'sel-aid':''}" onclick="${disabled?'':'toggleAid(\''+a.id+'\')'}">
        <div>
          <div class="aid-name" style="color:${a.col}">${a.label}${isSel?' ✓':''}</div>
          <div class="aid-effect">${a.efFn(nb)}</div>
        </div>
        <span class="aid-time">${a.timeCost>0?'+'+a.timeCost+' seg':'+0 seg'}</span>
      </div>`;}).join('')}
    ${isDropbagPoint&&dropItems.length>0?`
    <div style="margin-top:10px;padding:10px 12px;background:#eaf4ea;border-radius:8px;border:1px solid #b8ddb8">
      <div style="font-size:13px;font-weight:600;color:#2d5a2d;margin-bottom:6px">🎒 Tu dropbag está aquí</div>
      ${dropItems.map(id=>{
        const d=DROPBAG_OPTIONS.find(x=>x.id===id);
        if(!d)return '';
        return `<div style="display:flex;justify-content:space-between;font-size:13px;color:#2d5a2d;padding:3px 0">
          <span>${d.label}</span>
          <button class="secondary" style="font-size:12px;padding:2px 8px" onclick="useDropbag('${id}')">Usar</button>
        </div>`;}).join('')}
    </div>`:''}
    <button class="main" style="margin-top:8px" onclick="confirmAid()">Continuar — ${selLabel} →</button>
    ${(()=>{
      const r=G.runner;
      const minStat=Math.min(r.energy,r.hydration,r.legs);
      const critCount=[r.energy,r.hydration,r.legs].filter(v=>v<10).length;
      const col=critCount>=2?'#c0392b':critCount===1?'#c07a10':'#bbb';
      const label=critCount>=2?'⚠ Al límite — retirarse aquí es lo sensato':critCount===1?'Al límite — ¿seguir o retirarse?':'Retirarse en este avituallamiento';
      return `<button class="abandon-btn" style="margin-top:6px;border-color:${col};color:${col};background:${critCount>=2?'#fef0f0':critCount===1?'#fff9f0':'#fafafa'};font-size:13px;font-weight:${critCount>=1?'600':'400'}" onclick="doAbandon()">${label}</button>`;
    })()}
    `;
}
function calcPaceCosts(p,seg,paceLog){
  const recentPaces=paceLog.slice(-4);
  const hardCount=recentPaces.filter(x=>x==='allout'||x==='push').length;
  const alloutStreak=paceLog.slice(-3).filter(x=>x==='allout').length;
  const fatigueMult=(alloutStreak>=3?2.2:alloutStreak===2?1.6:hardCount>=3?1.3:1.0)*modeCfg().fatigueMult;

  const segs=curSegs();const totalSegs=segs.length;
  const segPct=G.seg/totalSegs;
  const strat=G.startStrategy||'equilibrado';
  const STRAT={conservador:{earlyTm:1.08,lateTm:0.92,fatigueMod:-0.15},equilibrado:{earlyTm:1.0,lateTm:1.0,fatigueMod:0},atope:{earlyTm:0.90,lateTm:1.12,fatigueMod:0.30}}[strat]||{earlyTm:1.0,lateTm:1.0,fatigueMod:0};
  const stratTm=segPct<0.33?STRAT.earlyTm:segPct>0.67?STRAT.lateTm:1.0;
  const stratFatMod=1+STRAT.fatigueMod;

  const pc=PACE_COSTS[p]||PACE_COSTS.steady;
  let tm=pc.tm*stratTm;
  let ec=Math.round(pc.ec*fatigueMult*stratFatMod);
  let hc=pc.hc;
  let lc=Math.round(pc.lc*fatigueMult*stratFatMod);
  if(G.fatBurning){ec=Math.round(ec*0.90);hc=Math.round(hc*1.08);} // ayuno: quema grasas −10% energía pero +8% sed

  const ad=agingDeg();
  if(ad>0){ec=Math.round(ec*(1+ad));hc=Math.round(hc*(1+ad*0.8));lc=Math.round(lc*(1+ad*0.7));}

  const sv=getEffStat('velocidad'),ss=getEffStat('subida'),sb=getEffStat('bajada'),sr=getEffStat('resistencia');
  const race=G.selectedRaces[G.currentRaceIdx];
  const hydMult=seasonWeatherMultiplier(race?.month||6);
  const terrain=G.terrainCondition||{descentMult:1.0,climbMult:1.0};
  const altPenalty=race?getAltitudePenalty(race):0;
  const degradMult=G.preDegradMult||1.0;

  if(seg.type==='flat')   {tm*=1-(sv-50)*STAT_SCALE_PER_KM;}
  if(seg.type==='climb')  {tm*=1-(ss-50)*STAT_SCALE_PER_KM;tm*=terrain.climbMult;tm*=1+altPenalty;ec=Math.round(ec*(1-(sr-50)*RESISTANCE_SCALE_PER_KM)*degradMult);}
  if(seg.type==='descent'){tm*=1-(sb-50)*STAT_SCALE_PER_KM;tm*=terrain.descentMult;}

  if(G.weather==='soleado')hc=Math.round(hc*WEATHER_HYD_MULT.soleado*hydMult);
  if(G.weather==='extremo')hc=Math.round(hc*WEATHER_HYD_MULT.extremo*hydMult);
  if(G.stormActive)hc=Math.round(hc*(G.stormProtected?STORM_HYD_MULT.protected:STORM_HYD_MULT.exposed));

  const r=G.runner;
  if(r.energy<LOW_STAT_PENALTIES.energy.threshold)tm*=LOW_STAT_PENALTIES.energy.timeMult;
  if(r.hydration<LOW_STAT_PENALTIES.hydration.threshold)tm*=LOW_STAT_PENALTIES.hydration.timeMult;
  if(r.legs<LOW_STAT_PENALTIES.legs.threshold)tm*=LOW_STAT_PENALTIES.legs.timeMult;

  return {tm,ec,hc,lc,alloutStreak,sb};
}

// ── Comprueba lesión durante el tramo ──
function checkSegInjury(p,seg,alloutStreak,sb){
  const load=getBodyLoad();
  let descentFall=false,midRaceInjury=null;
  if(seg.type==='descent'&&p==='allout'){
    let fallRisk=0;
    if(sb<50)    fallRisk+=((50-sb)/50)*0.30;
    if(load>=85) fallRisk+=0.30;
    else if(load>=70)fallRisk+=0.18;
    else if(load>=55)fallRisk+=0.07;
    if(hasFisio())fallRisk*=0.45;
    if(Math.random()<fallRisk)descentFall=true;
  }
  if(alloutStreak>=3&&load>=70&&!hasFisio()){
    const injRisk=(0.08+(load-70)*0.004)*modeCfg().injuryRiskMult*(1+agingDeg()*0.8);
    if(Math.random()<injRisk)midRaceInjury=load>=85?'fractura':'rotura';
  } else if(alloutStreak>=2&&load>=80&&!hasFisio()){
    if(Math.random()<0.06*modeCfg().injuryRiskMult*(1+agingDeg()*0.8))midRaceInjury='tendinitis';
  }
  return {descentFall,midRaceInjury};
}

window.doPace=p=>{
  const segs=curSegs();const s=segs[G.seg];const r=G.runner;
  if(!G.paceLog)G.paceLog=[];
  G.paceLog.push(p);

  // Calcular costes del ritmo
  const {tm,ec,hc,lc,alloutStreak,sb}=calcPaceCosts(p,s,G.paceLog);

  // Lesión durante el tramo
  const {descentFall,midRaceInjury}=checkSegInjury(p,s,alloutStreak,sb);

  G.time+=Math.round(s.base*tm);
  r.energy=Math.max(0,r.energy-ec);
  r.hydration=Math.max(0,r.hydration-hc);
  r.legs=Math.max(0,r.legs-lc);
  G.rivals.forEach(rv=>rv.time+=Math.round(s.base*rv.mult*(0.96+Math.random()*0.08)));
  G.seg++;

  // ── TRACKING ZONA ROJA ───────────────
  const inRedZone=r.energy<10||r.hydration<10||r.legs<10;
  if(inRedZone){
    G.redZoneStreak=(G.redZoneStreak||0)+1;
    G.redZoneMax=Math.max(G.redZoneMax||0,G.redZoneStreak);
  } else {
    G.redZoneStreak=0;
  }

  // ── EVENTOS POST-TRAMO ───────────────
  if(midRaceInjury){
    const injData=INJURY_TYPES[midRaceInjury];
    G.injuryType=midRaceInjury;
    G.injuryStatus='moderada';
    G.injuryRecoverySeasons=injData.recoverySeasons||1;
    G.injuryRacesLeft=injData.racesBlocked||0;
    Object.entries(injData.statPenalty).forEach(([k,v])=>{
      G.runner.stats[k]=Math.max(10,(G.runner.stats[k]||50)+v);
    });
    // Record in injury history
    if(!G.injuryHistory)G.injuryHistory=[];
    G.injuryHistory.push({type:midRaceInjury,label:injData.label,race:G.selectedRaces[G.currentRaceIdx]?.name||'',year:G.year,km:Math.round(G.selectedRaces[G.currentRaceIdx]?.km*(G.seg/curSegs().length))});
    if(!injData.canRace){
      // Forzar abandono automático
      const el=document.getElementById('main');
      const race2=G.selectedRaces[G.currentRaceIdx];
      if(!G.careerRaceHistory)G.careerRaceHistory={};
      if(!G.careerRaceHistory[race2.id])G.careerRaceHistory[race2.id]={finished:0,abandoned:0};
      G.careerRaceHistory[race2.id].abandoned++;
      G.raceAbandonedCount=(G.raceAbandonedCount||0)+1;
      G.bodyLoad=Math.min(100,G.bodyLoad+5);
      el.innerHTML=`
        <h2>Abandono forzado</h2>
        <p class="sub">${race2.name}</p>
        <div class="injury-card">
          <div class="injury-type">${injData.label}</div>
          <div style="font-size:13px;color:#555;margin:6px 0">${injData.desc}</div>
          <div style="font-size:12px;color:#c0392b">Has tenido que retirarte en el km ~${Math.round(race2.km*(G.seg/segs.length))}. No es posible continuar con esta lesión.</div>
        </div>
        <div class="warn">Recuperación estimada: ${injData.recoverySeasons} temporada${injData.recoverySeasons>1?'s':''}. Descansa bien antes de la siguiente carrera.</div>
        ${raceStats()}
        <button class="main" style="margin-top:8px" onclick="afterRace()">Continuar →</button>`;
      G._raceResultHTML=el.innerHTML;
      G.screen='raceResult';
      updateFinBar();
      return;
    } else {
      G.raceEvent=`${injData.label} — puedes terminar pero las piernas pagan el precio.`;
      r.legs=Math.max(0,r.legs-15);
    }
  } else if(descentFall){
    const sbVal=getEffStat('bajada');
    const cause=sbVal<50&&load>=70?'Cuerpo cargado y técnica ajustada en la bajada':
                load>=70?'El cuerpo cargado no respondió en la bajada':
                'Resbalón en terreno técnico';
    G.raceEvent=`${cause}. Pierdes tiempo y las piernas se resienten.`;
    r.legs=Math.max(0,r.legs-20);G.time+=Math.round(45+Math.random()*30);
    r.energy=Math.max(0,r.energy-10);
  } else {
    const evPool=['','','Terreno resbaladizo, vas con cuidado.','Cruzas un riachuelo.',''];
    G.raceEvent=
      alloutStreak>=3?'Llevas varios tramos a tope — las piernas empiezan a acusar el esfuerzo acumulado.':
      r.energy<25?'La energía flaquea — las piernas ya no responden bien.':
      r.hydration<15?'Boca seca. El ritmo baja sin querer.':
      r.legs<25?'Las piernas están al límite. Cada paso cuesta.':
      evPool[Math.floor(Math.random()*evPool.length)];
  }

  if(G.seg>=segs.length)finishRace();
  else if(segs[G.seg-1]?.aid){G.aidSelected=[];G.screen='aid';render();}
  else{
    const mre=checkMidRaceEvents();
    if(mre){G.midRaceEvent=mre;G.screen='midRaceEvent';render();}
    else render();
  }
};


// ── EVENTOS MID-RACE ──────────────────
// Devuelve un objeto de evento o null si no hay nada que disparar
function checkMidRaceEvents(){
  const race=G.selectedRaces[G.currentRaceIdx];
  if(!race)return null;
  const segs=curSegs();
  const totalKm=race.km;
  const doneKm=segs.slice(0,G.seg).reduce((a,s)=>a+s.km,0);
  const pct=totalKm>0?doneKm/totalKm:0;
  const mental=getEffStat('mental');
  if(!G.midRaceEventTriggered)G.midRaceEventTriggered={};

  // ⛈ TORMENTA — km >20, carreras >=35km, 1 sola vez por carrera
  if(!G.stormActive&&!G.midRaceEventTriggered.storm&&totalKm>=35&&doneKm>20){
    const stormChance=(race.weather_risk||0.2)*2.2;
    if(Math.random()<stormChance){
      G.midRaceEventTriggered.storm=true;
      return{id:'storm',
        title:'⛈ Tormenta sorpresa',
        desc:`En el km ${Math.round(doneKm)} el cielo se cierra de golpe. Granizo y viento lateral azotan la cresta. Los avitualladores bloquean el paso durante unos minutos.`,
        choices:[
          {text:'Refugiarse y ponerse el chubasquero (+3 min · hidratación protegida)',id:'shelter'},
          {text:'Apretar y cruzar sin parar (pierde más hidratación en todos los tramos)',id:'push_through'},
        ]
      };
    }
  }

  // 🩹 CORREDOR LESIONADO — tramo central (25%-75%), carreras >=18km, 1 vez por carrera
  if(!G.midRaceEventTriggered.injured_runner&&totalKm>=18&&pct>=0.25&&pct<0.75){
    if(Math.random()<0.15){
      G.midRaceEventTriggered.injured_runner=true;
      return{id:'injured_runner',
        title:'🩹 Corredor en el suelo',
        desc:'Hay un corredor caído al lado de la senda. Parece que se ha torcido el tobillo. Nadie más está cerca. Te mira buscando ayuda.',
        choices:[
          {text:'Parar y ayudarle hasta que llegue un voluntario (+2 min · +2 Mental)',id:'help'},
          {text:'Avisarle de que llamarás en el siguiente avituallamiento y seguir',id:'warn'},
          {text:'Seguir tu ritmo (eres competidor, hay voluntarios para esto)',id:'ignore'},
        ]
      };
    }
  }

  // 🌫 PERDERSE EN RUTA — Mental bajo + clima extremo/tormenta, 1 vez por carrera
  if(!G.midRaceEventTriggered.lost&&(G.weather==='extremo'||G.stormActive)&&mental<45&&pct>=0.3&&pct<0.8){
    if(Math.random()<0.35){
      G.midRaceEventTriggered.lost=true;
      return{id:'lost',
        title:'🌫 Visibilidad cero',
        desc:`La niebla y la tormenta borran las marcas. En el km ${Math.round(doneKm)} llevas unos minutos sin ver ninguna señal. El GPS parpadea.`,
        choices:[
          {text:'Usar el GPS (pierdes batería y 2:30 min, pero llegas seguro)',id:'gps'},
          {text:`Buscar la senda a ojo (Mental ${mental} — resultado incierto)`,id:'find_trail'},
        ]
      };
    }
  }

  // 👥 AMIGOS ANIMANDO — tramo cualquiera (15%-85%), 1 vez por carrera
  if(!G.midRaceEventTriggered.friends&&pct>=0.15&&pct<0.85){
    if(Math.random()<0.18){
      G.midRaceEventTriggered.friends=true;
      return{id:'friends_cheer',
        title:'👥 ¡Tus amigos están aquí!',
        desc:`Al girar un recodo, un grupo te reconoce y se pone a gritar tu nombre. Carteles, silbatos y todo el equipo. El km ${Math.round(doneKm)} de repente parece mucho más corto.`,
        choices:[
          {text:'Acelerar con esa energía (−3 min extra, −3 energía, +4 Mental)',id:'sprint'},
          {text:'Saludar y seguir tu ritmo (+4 Mental, sin coste)',id:'wave'},
        ]
      };
    }
  }

  // 💨 EL VIENTO SE LLEVA LA GORRA — condiciones adversas, 1 vez
  if(!G.midRaceEventTriggered.hat&&(G.weather==='extremo'||G.stormActive)&&pct>=0.1&&pct<0.7){
    if(Math.random()<0.22){
      G.midRaceEventTriggered.hat=true;
      return{id:'hat_blown',
        title:'💨 ¡La gorra sale volando!',
        desc:'Una ráfaga inesperada te arranca la gorra y la manda a unos metros cuesta abajo. Puedes recuperarla rápido o seguir sin protección solar.',
        choices:[
          {text:'Volver a por ella (+1:30 min, protección solar mantenida)',id:'get_hat'},
          {text:'Olvidarse y seguir (sin pausa, pero el sol/viento pica más)',id:'ignore_hat'},
        ]
      };
    }
  }

  // 🧦 ROZADURA EN EL PIE — cualquier tramo (20%-70%), 1 vez
  if(!G.midRaceEventTriggered.sock&&pct>=0.2&&pct<0.7){
    if(Math.random()<0.12){
      G.midRaceEventTriggered.sock=true;
      return{id:'sock_adjust',
        title:'🧦 Rozadura en el pie',
        desc:`Algo se ha desplazado dentro de la zapatilla y notas un punto de roce que va a más. En el km ${Math.round(doneKm)} aún puedes cortarlo.`,
        choices:[
          {text:'Parar 1 minuto a recolocar (+1 min, evitas ampollas)',id:'fix_sock'},
          {text:'Ignorar y aguantar (sin pausa, riesgo de ampolla real)',id:'push_sock'},
        ]
      };
    }
  }

  // 🟫 CAÍDA EN EL BARRO — terreno barro o invierno, 1 vez
  if(!G.midRaceEventTriggered.mud&&(G.terrainCondition?.id==='barro'||G.terrainCondition?.id==='nieve')&&pct>=0.3&&pct<0.8){
    if(Math.random()<0.22){
      G.midRaceEventTriggered.mud=true;
      return{id:'mud_fall',
        title:'🟫 ¡Pisas barro y te caes!',
        desc:`Tramo resbaladizo, el pie se va y caes. Te levantas enseguida — nada grave — pero el golpe se nota en las piernas. Km ${Math.round(doneKm)}.`,
        choices:[
          {text:'Levantarse y seguir sin perder tiempo (−5 piernas, −2 energía)',id:'get_up_fast'},
          {text:'Tomarse 30 seg para evaluarte (+30 seg, −3 piernas)',id:'check_first'},
        ]
      };
    }
  }

  // 😈 PENSAMIENTO INTRUSO: dilema moral con otro corredor, 1 vez
  if(!G.midRaceEventTriggered.sabotage&&totalKm>=15&&pct>=0.35&&pct<0.75){
    const sabotageChance=mental<50?0.18:0.10;
    if(Math.random()<sabotageChance){
      G.midRaceEventTriggered.sabotage=true;
      const scenarios=[
        {title:'😈 Un rival te pregunta por dónde es',
         desc:'Llevas varios kms batallando con el mismo corredor. En una bifurcación te pregunta: "¿Por cuál es?" Tú lo sabes perfectamente. Una pequeña voz te dice que podrías aprovechar el momento.',
         opts:[
           {text:'Señalar el camino correcto — fair play (+2 Mental)',id:'honest'},
           {text:'Señalarle el camino equivocado (ganas ~5 min, −5 popularidad, −3 Mental)',id:'deceive'},
         ]},
        {title:'😈 Una señal de ruta está caída',
         desc:'Hay una marca de ruta en el suelo, tumbada por el viento. Dos corredores vienen justo detrás. Podrías colocarla mal sin que nadie lo vea.',
         opts:[
           {text:'Dejarla como está y seguir (+1 Mental)',id:'honest'},
           {text:'Colocarla en dirección incorrecta (pueden perderse, −6 popularidad)',id:'deceive'},
         ]},
      ];
      const s=scenarios[Math.floor(Math.random()*scenarios.length)];
      return{id:'sabotage',title:s.title,desc:s.desc,choices:s.opts};
    }
  }

  // 🫗 AVITUALLAMIENTO VACÍO — cualquier carrera, tramo 20%-70%, 1 vez
  if(!G.midRaceEventTriggered.empty_aid&&pct>=0.2&&pct<0.7){
    if(Math.random()<0.12){
      G.midRaceEventTriggered.empty_aid=true;
      return{id:'empty_aid',
        title:'🫗 El avituallamiento está vacío',
        desc:`Llegas al puesto del km ${Math.round(doneKm)} y no hay ni agua ni comida. Los voluntarios se disculpan — el suministro se ha agotado. El siguiente puesto está en varios kilómetros.`,
        choices:[
          {text:'Racionarte estrictamente hasta el siguiente (−5 hidratación, −4 energía)',id:'ration'},
          {text:'Beber de un arroyo cercano (recuperas hidratación, pero riesgo digestivo)',id:'stream'},
          {text:'Forzar sin recargar (sigues a ritmo pero el cuerpo lo pagará más adelante)',id:'push_empty'},
        ]
      };
    }
  }

  // 🤢 GEL EN MAL ESTADO — tramo 25%-65%, 1 vez
  if(!G.midRaceEventTriggered.bad_gel&&pct>=0.25&&pct<0.65){
    if(Math.random()<0.10){
      G.midRaceEventTriggered.bad_gel=true;
      return{id:'bad_gel',
        title:'🤢 El gel sabe raro',
        desc:'Abres un gel y el olor no es el habitual. El calor o la fecha de caducidad han hecho de las suyas. Queda poco y lo necesitas, pero el estómago ya da señales.',
        choices:[
          {text:'Tomarlo de todas formas (+5 energía, riesgo estomacal)',id:'eat_gel'},
          {text:'Tirarlo y continuar sin gel (sin riesgo, pero sin recarga)',id:'discard_gel'},
        ]
      };
    }
  }

  // 🐐 SENDERO BLOQUEADO POR ANIMALES — carreras pirenaicas, tramo 10%-60%, 1 vez
  if(!G.midRaceEventTriggered.trail_blocked&&pct>=0.1&&pct<0.6){
    if(Math.random()<0.09){
      G.midRaceEventTriggered.trail_blocked=true;
      return{id:'trail_blocked',
        title:'🐐 ¡Rebaño en el sendero!',
        desc:`Un rebaño de cabras ocupa completamente el camino en el km ${Math.round(doneKm)}. El pastor está lejos y las cabras no tienen prisa. Clásico de los Pirineos.`,
        choices:[
          {text:'Esperar pacientemente a que pasen (+1:30 min, sin gasto extra)',id:'wait_herd'},
          {text:'Rodear por la ladera (±2 min, −4 piernas por el desnivel extra)',id:'detour_herd'},
          {text:'Abrirte paso con calma — las cabras son curiosas (+40 seg, +1 Mental)',id:'weave_herd'},
        ]
      };
    }
  }

  // 🔀 CRUCE CONFUSO — carreras medianas/largas, tramo 15%-70%, 1 vez
  if(!G.midRaceEventTriggered.confusing_fork&&totalKm>=15&&pct>=0.15&&pct<0.7){
    if(Math.random()<0.11){
      G.midRaceEventTriggered.confusing_fork=true;
      return{id:'confusing_fork',
        title:'🔀 Bifurcación sin señal',
        desc:`El viento (o alguien) ha tumbado la marca de ruta. Hay dos sendas que podrían ser la correcta. Detrás de ti vienen tres corredores que tampoco saben. Km ${Math.round(doneKm)}.`,
        choices:[
          {text:'Sacar el GPS y confirmar (+45 seg, 100% seguro)',id:'gps_fork'},
          {text:`Confiar en el instinto — recuerdas el perfil (sin pausa, Mental ${mental} define el resultado)`,id:'gut_fork'},
          {text:'Esperar a que llegue otro corredor que sepa (+30 seg, decisión compartida)',id:'wait_fork'},
        ]
      };
    }
  }

  // 🏃 RIVAL PIDE PASO — tramo 20%-75%, 1 vez
  if(!G.midRaceEventTriggered.rival_pass&&pct>=0.2&&pct<0.75){
    if(Math.random()<0.13){
      G.midRaceEventTriggered.rival_pass=true;
      return{id:'rival_pass',
        title:'🏃 «¡Paso, por favor!»',
        desc:'Un corredor más rápido viene por detrás y te pide paso en un tramo estrecho. Estás en buen ritmo y cederle significa perder la posición que llevas km manteniendo.',
        choices:[
          {text:'Ceder limpiamente y dejarle pasar (+20 seg, +2 Mental, +fair play)',id:'give_way'},
          {text:'Aguantar el ritmo — que te pase si puede (sin pausa, rivalidad activada)',id:'hold_pace'},
          {text:'Dejarte llevar por su rueda — intentas seguirle (−8 energía, opción de adelantarle después)',id:'follow_wheel'},
        ]
      };
    }
  }

  // 🌡 CAMBIO BRUSCO DE TEMPERATURA — altitud o otoño/invierno, 1 vez
  if(!G.midRaceEventTriggered.temp_change&&(G.selectedRaces[G.currentRaceIdx]?.altitude||[10,11,3,4,12,1,2].includes(G.selectedRaces[G.currentRaceIdx]?.month||6))&&pct>=0.15&&pct<0.65){
    if(Math.random()<0.14){
      G.midRaceEventTriggered.temp_change=true;
      return{id:'temp_change',
        title:'🌡 El frío llega de golpe',
        desc:`Al salir de la ladera protegida, el viento frío de cresta te da de pleno. En minutos, la temperatura ha bajado diez grados. Km ${Math.round(doneKm)}.`,
        choices:[
          {text:'Parar a ponerse el cortavientos (+1:30 min, protección térmica completa)',id:'put_jacket'},
          {text:'Apretar el paso para entrar en calor (sin pausa, −5 hidratación por el esfuerzo extra)',id:'run_warm'},
        ]
      };
    }
  }

  // 📸 PÚBLICO Y CÁMARAS — tramos populares, 1 vez
  if(!G.midRaceEventTriggered.crowd_cameras&&pct>=0.2&&pct<0.8){
    if(Math.random()<0.10){
      G.midRaceEventTriggered.crowd_cameras=true;
      return{id:'crowd_cameras',
        title:'📸 ¡Hay cámaras y público!',
        desc:'Entras en un núcleo de montaña con aficionados a ambos lados. Hay cámaras de la organización y varios móviles apuntando. El ambiente es eléctrico.',
        choices:[
          {text:'Saludar y seguir a tu ritmo (+3 Mental, +100 seguidores)',id:'wave_crowd'},
          {text:'Subir el ritmo para la cámara — parece que vuela (+50 seg ganados, −6 energía)',id:'show_off'},
          {text:'Bajar la cabeza y mantener el foco (sin cambio, máxima concentración)',id:'focus_crowd'},
        ]
      };
    }
  }

  // 🚧 ATASCO EN SUBIDA TÉCNICA — tramo 20%-65%, 1 vez
  if(!G.midRaceEventTriggered.bottleneck&&pct>=0.2&&pct<0.65){
    if(Math.random()<0.11){
      G.midRaceEventTriggered.bottleneck=true;
      return{id:'bottleneck',
        title:'🚧 Embotellamiento en la subida',
        desc:`Un grupo de cinco corredores bloquea una canal técnica en el km ${Math.round(doneKm)}. El paso es de uno en uno y nadie cede. Llevas 1:30 min a su sombra.`,
        choices:[
          {text:'Esperar tu turno con calma (+1:30 min, energía conservada)',id:'wait_jam'},
          {text:'Buscar línea alternativa por roca (±45 seg, −5 piernas por el terreno)',id:'alt_line'},
          {text:'Pedir paso con educación — a veces funciona (+30 seg, posible hueco)',id:'ask_jam'},
        ]
      };
    }
  }

  // 🍬 MINI CRISIS DE HAMBRE — tramo 35%-75%, 1 vez
  if(!G.midRaceEventTriggered.hunger_crisis&&pct>=0.35&&pct<0.75){
    if(Math.random()<0.13){
      G.midRaceEventTriggered.hunger_crisis=true;
      return{id:'hunger_crisis',
        title:'🍬 Bajón de glucosa',
        desc:`Sin aviso, las piernas se vuelven de plomo y la cabeza se nubla un momento. El reloj marca km ${Math.round(doneKm)} y reconoces la sensación: el cuerpo pide azúcar ahora.`,
        choices:[
          {text:'Usar un gel de emergencia ahora (+12 energía, gastas tu reserva)',id:'use_gel_now'},
          {text:'Bajar el ritmo y aguantar hasta el avituallamiento (−10 energía extra, sin gastar gel)',id:'slow_hunger'},
          {text:'Tomar una fecha o barrita que llevas (−8 energía, +5 sostenido)',id:'snack_bar'},
        ]
      };
    }
  }

  // 🥶 MANOS CONGELADAS — invierno/cresta, 1 vez
  if(!G.midRaceEventTriggered.frozen_hands&&(G.weather==='extremo'||[12,1,2].includes(G.selectedRaces[G.currentRaceIdx]?.month||6))&&pct>=0.15&&pct<0.7){
    if(Math.random()<0.16){
      G.midRaceEventTriggered.frozen_hands=true;
      return{id:'frozen_hands',
        title:'🥶 Las manos dejan de responder',
        desc:`En la cresta el viento corta y las manos se te han quedado blancas. Los bastones se mueven solos y no sientes los dedos. Km ${Math.round(doneKm)}.`,
        choices:[
          {text:'Parar 2 min a calentar con el cuerpo (+2 min, agarre recuperado al 100%)',id:'warm_hands'},
          {text:'Guardar los bastones y seguir sin ellos (+ritmo en llano, −piernas en subidas)',id:'no_poles'},
          {text:'Aguantar — el frío es temporal (sin pausa, −8 piernas por mal apoyo de bastones)',id:'push_cold'},
        ]
      };
    }
  }

  // 🥾 BARRO HASTA EL TOBILLO — bajada lluviosa, 1 vez
  if(!G.midRaceEventTriggered.ankle_mud&&(G.terrainCondition?.id==='barro'||G.weather==='extremo')&&pct>=0.3&&pct<0.8){
    if(Math.random()<0.15){
      G.midRaceEventTriggered.ankle_mud=true;
      return{id:'ankle_mud',
        title:'🥾 Barro hasta el tobillo',
        desc:`La bajada se ha convertido en un lodazal. Con cada paso las zapatillas se hunden y el esfuerzo de sacar el pie se multiplica. Km ${Math.round(doneKm)}.`,
        choices:[
          {text:'Cambiar a la trazada de roca lateral (+30 seg, piernas conservadas)',id:'rock_line'},
          {text:'Atravesar directo — cada segundo cuenta (−10 piernas, sin pausa)',id:'mud_direct'},
        ]
      };
    }
  }

  // 📐 FALSA LLANURA — tramo 15%-65%, 1 vez
  if(!G.midRaceEventTriggered.false_flat&&pct>=0.15&&pct<0.65){
    if(Math.random()<0.09){
      G.midRaceEventTriggered.false_flat=true;
      return{id:'false_flat',
        title:'📐 Parece llano pero no lo es',
        desc:`Llevas 10 minutos a un ritmo que debería ser cómodo pero el GPS no cuadra y la respiración se dispara. El perfil te estaba mintiendo — es un repecho sostenido del 4% que parece llano.`,
        choices:[
          {text:'Bajar el ritmo y leer bien el terreno (−0 tiempo extra, −6 energía)',id:'read_terrain'},
          {text:'Mantener el esfuerzo creyendo que es llano (−14 energía, forzando el cuerpo)',id:'ignore_flat'},
        ]
      };
    }
  }

  // 😬 RESBALÓN SIN CAÍDA — terreno técnico o húmedo, tramo 20%-75%, 1 vez
  if(!G.midRaceEventTriggered.slip_nf&&(G.terrainCondition?.id==='barro'||G.terrainCondition?.id==='tecnico'||G.terrainCondition?.id==='nieve')&&pct>=0.2&&pct<0.75){
    if(Math.random()<0.18){
      G.midRaceEventTriggered.slip_nf=true;
      return{id:'slip_nf',
        title:'😬 El pie patina — no llegas a caer',
        desc:`Un resbalón brusco en una raíz mojada. El cuerpo reacciona solo, recuperas el equilibrio, pero el esfuerzo de frenada lo notan los isquios. Km ${Math.round(doneKm)}.`,
        choices:[
          {text:'Bajar el ritmo un tramo — el cuerpo manda (−4 piernas, sin tiempo extra)',id:'ease_slip'},
          {text:'Sacudir la cabeza y seguir igual (−6 piernas, riesgo si el terreno continúa así)',id:'push_slip'},
        ]
      };
    }
  }

  // ⛰ MEDIA MONTAÑA TRAICIONERA — carreras con altitud, tramo 25%-65%, 1 vez
  if(!G.midRaceEventTriggered.mid_trap&&G.selectedRaces[G.currentRaceIdx]?.altitude&&pct>=0.25&&pct<0.65){
    if(Math.random()<0.11){
      G.midRaceEventTriggered.mid_trap=true;
      return{id:'mid_trap',
        title:'⛰ La montaña te engaña',
        desc:`Parece que llegas al collado pero hay otro detrás. Y otro más. El perfil miente en terreno de media montaña — las cumbres se ocultan entre sí. El cuerpo empieza a pedir explicaciones.`,
        choices:[
          {text:'Gestionar el esfuerzo — bajar la potencia y adaptarse (−5 energía controlada)',id:'manage_trap'},
          {text:'Seguir empujando — ya llegará el plano (−15 energía, pero mantienes el ritmo)',id:'push_trap'},
        ]
      };
    }
  }

  // 🧱 PIERNAS DE MADERA — bodyLoad alto o pct>40%, 1 vez
  if(!G.midRaceEventTriggered.heavy_legs&&(G.bodyLoad||0)>=55&&pct>=0.35&&pct<0.75){
    if(Math.random()<0.14){
      G.midRaceEventTriggered.heavy_legs=true;
      return{id:'heavy_legs',
        title:'🧱 Piernas de piedra',
        desc:`Sin aviso, las piernas pesan el doble. No es dolor — es un cansancio muscular profundo que sube desde las pantorrillas. Km ${Math.round(doneKm)}. El entrenamiento acumulado pasa factura.`,
        choices:[
          {text:'Parar 1 min a estirar y activar la circulación (+1 min, −3 piernas)',id:'stretch_legs'},
          {text:'Cambiar la zancada — pasos cortos, mayor cadencia (sin pausa, −8 piernas)',id:'shuffle_legs'},
          {text:'Aguantar y forzar — esto es trail (−15 piernas, riesgo calambre posterior)',id:'force_legs'},
        ]
      };
    }
  }

  // 📣 PÚBLICO TE GRITA TU APODO — si tienes seguidores/fama, 1 vez
  if(!G.midRaceEventTriggered.nickname_shout&&(G.followers||0)>=500&&pct>=0.2&&pct<0.8){
    if(Math.random()<0.13){
      G.midRaceEventTriggered.nickname_shout=true;
      const nick=G.runner.name||'crack';
      return{id:'nickname_shout',
        title:'📣 «¡Vamos, '+nick+'!»',
        desc:`Un grupo de aficionados locales te grita por tu nombre. No "venga corredor" — por tu nombre. Alguien te conoce, alguien ha venido a verte a ti. Se te pone la piel de gallina.`,
        choices:[
          {text:'Levantar el puño y acelerar (+6 Mental, −5 energía por el sprint espontáneo)',id:'fist_pump'},
          {text:'Sonreír y mantener el ritmo (+4 Mental, +150 seguidores)',id:'smile_fans'},
        ]
      };
    }
  }

  // 🥢 BASTÓN PRESTADO — carreras con bastones (>30km), tramo 15%-55%, 1 vez
  if(!G.midRaceEventTriggered.lent_pole&&totalKm>=30&&pct>=0.15&&pct<0.55){
    if(Math.random()<0.08){
      G.midRaceEventTriggered.lent_pole=true;
      return{id:'lent_pole',
        title:'🥢 Un bastón en el suelo',
        desc:`Hay un bastón de carbono en el sendero, boca abajo. Su dueño está unos metros más adelante, cojeando. Se le ha partido la correa. Te lo está mirando.`,
        choices:[
          {text:'Correr y dárselo — +2 min y +3 Mental, pero le sacas del problema',id:'give_pole'},
          {text:'Señalarle el bastón sin parar (él puede volver, tú no pierdes tiempo)',id:'point_pole'},
          {text:'Llevártelo temporalmente hasta el avituallamiento y dejarlo allí (+1 min)',id:'carry_pole'},
        ]
      };
    }
  }

  // 🐕 PERRO FAN — zona rural, 1 vez (modo normal)
  if(!G.midRaceEventTriggered.dog_fan&&pct>=0.2&&pct<0.75){
    if(Math.random()<0.09){
      G.midRaceEventTriggered.dog_fan=true;
      return{id:'dog_fan',
        title:'🐕 Un perro te sigue',
        desc:`Un labrador con collar aparece de la nada y decide que tú eres su corredor favorito. Te sigue a metro y medio, lengua fuera, feliz como nadie. Lleva ya 400 metros contigo.`,
        choices:[
          {text:'Disfrutarlo — corres un tramo con compañía (+5 Mental, +5 seg, +seguidores)',id:'enjoy_dog'},
          {text:'Ahuyentarlo para no distraerte (sin coste, pero +10 seg en el intento)',id:'shoo_dog'},
        ]
      };
    }
  }

  // 💥 CAÍDA GRAVE — barro/nieve/técnico, tramo 30%-70%, 1 vez
  if(!G.midRaceEventTriggered.bad_fall&&(G.terrainCondition?.id==='barro'||G.terrainCondition?.id==='nieve'||G.terrainCondition?.id==='tecnico')&&pct>=0.3&&pct<0.7){
    if(Math.random()<0.08){
      G.midRaceEventTriggered.bad_fall=true;
      return{id:'bad_fall',
        title:'💥 Caída de verdad',
        desc:`El pie se va en una raíz y caes de rodillas sobre la roca. Un segundo de blanco. Te levantas — las manos y la rodilla sangran — pero todo parece moverse. Km ${Math.round(doneKm)}.`,
        choices:[
          {text:'Evaluarte 2 min antes de seguir (+2 min, evitas agravar lesión)',id:'check_fall'},
          {text:'Levantarse y correr — si puedes caminar puedes correr (sin pausa, −14 piernas, −8 energía)',id:'run_fall'},
        ]
      };
    }
  }

  // 🏔 DESNIVEL INFINITO — carreras con mucho desnivel (>2000m), tramo 30%-65%, 1 vez
  if(!G.midRaceEventTriggered.endless_climb&&(G.selectedRaces[G.currentRaceIdx]?.gain||0)>=2000&&pct>=0.3&&pct<0.65){
    if(Math.random()<0.13){
      G.midRaceEventTriggered.endless_climb=true;
      return{id:'endless_climb',
        title:'🏔 La subida no tiene fin',
        desc:`Llevas 20 minutos subiendo y el collado no aparece. El mapa dice que ya debería estar aquí. Mentira. La montaña se burla del papel. Sientes las piernas llenarse de lava.`,
        choices:[
          {text:'Gestionar: marchar rápido y conservar energía para la cima (−8 energía, llegada estable)',id:'manage_climb'},
          {text:'Empujar hasta arriba — la cima tiene que aparecer ya (−20 energía, ganas 2 min)',id:'push_climb'},
        ]
      };
    }
  }

  // 🪨 PIERNAS LLENAS DE PIEDRA — segunda mitad de carrera, bodyLoad alto, 1 vez
  if(!G.midRaceEventTriggered.stone_legs&&(G.bodyLoad||0)>=60&&pct>=0.55&&pct<0.85){
    if(Math.random()<0.14){
      G.midRaceEventTriggered.stone_legs=true;
      return{id:'stone_legs',
        title:'🪨 Los cuádriceps ya no responden',
        desc:`Km ${Math.round(doneKm)}. La bajada que antes era tu punto fuerte ahora duele. Los cuádriceps están saturados — cada paso hacia abajo es un impacto. La meta parece muy lejos.`,
        choices:[
          {text:'Andar las bajadas — conservar lo que queda (sin tiempo extra, −5 piernas)',id:'walk_descents'},
          {text:'Seguir corriendo bajadas con bastones de apoyo (−10 piernas, ganas 1:30 min)',id:'run_descents'},
          {text:'Buscar la trazada más suave aunque sea más larga (+1 min, −6 piernas)',id:'soft_line'},
        ]
      };
    }
  }

  // ⚡ EXPRESS EVENTS — solo en modo exprés, máx. 4 por carrera (2 timed + 2 narrative)
  if(G.gameMode==='expres'){
    const xpTimed=G.midRaceEventTriggered._xpTimedCount||0;
    const xpNarr=G.midRaceEventTriggered._xpNarrCount||0;

    // ── TIMED (máx 2) ──────────────────────────────────────────────
    if(xpTimed<2){
      // Último tramo: casi garantizado km 85%+
      if(!G.midRaceEventTriggered.xp_final&&pct>=0.85){
        if(Math.random()<0.82){
          G.midRaceEventTriggered.xp_final=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_final')};
        }
      }
      // Último descenso: en el último 20% si hay descenso
      if(!G.midRaceEventTriggered.xp_last_descent&&pct>=0.75&&pct<0.92){
        if(Math.random()<0.45){
          G.midRaceEventTriggered.xp_last_descent=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_last_descent')};
        }
      }
      // Bajada técnica: terreno técnico o piernas bajas
      if(!G.midRaceEventTriggered.xp_descent&&pct>=0.2&&pct<0.75&&(r.legs<45||G.terrainCondition?.id==='tecnico')){
        if(Math.random()<0.55){
          G.midRaceEventTriggered.xp_descent=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_descent')};
        }
      }
      // Rival a rueda: cuando llevas steady o push varios tramos
      if(!G.midRaceEventTriggered.xp_rival_wheel&&pct>=0.25&&pct<0.7&&(G.paceLog||[]).filter(p=>p==='steady'||p==='push').length>=2){
        if(Math.random()<0.4){
          G.midRaceEventTriggered.xp_rival_wheel=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_rival_wheel')};
        }
      }
      // Ataque en subida: cuando estés en top 5
      if(!G.midRaceEventTriggered.xp_climb_attack&&pct>=0.3&&pct<0.8){
        const myPos=(G.liveClass||[]).findIndex(e=>e.me)+1;
        if(myPos>0&&myPos<=5&&Math.random()<0.45){
          G.midRaceEventTriggered.xp_climb_attack=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_climb_attack')};
        }
      }
      // Rival simple: top 5
      if(!G.midRaceEventTriggered.xp_rival&&pct>=0.3&&pct<0.8){
        const myPos=(G.liveClass||[]).findIndex(e=>e.me)+1;
        if(myPos>0&&myPos<=5&&Math.random()<0.35){
          G.midRaceEventTriggered.xp_rival=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_rival')};
        }
      }
      // Paso resbaladizo: barro/nieve
      if(!G.midRaceEventTriggered.xp_slippery&&pct>=0.2&&pct<0.75&&(G.terrainCondition?.id==='barro'||G.terrainCondition?.id==='nieve')){
        if(Math.random()<0.5){
          G.midRaceEventTriggered.xp_slippery=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_slippery')};
        }
      }
      // Golpe calor/frío: verano o invierno
      if(!G.midRaceEventTriggered.xp_heat_cold&&pct>=0.15&&pct<0.6){
        const m=G.selectedRaces[G.currentRaceIdx]?.month||6;
        const extreme=[6,7,8,12,1,2].includes(m);
        if(extreme&&Math.random()<0.4){
          G.midRaceEventTriggered.xp_heat_cold=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_heat_cold')};
        }
      }
      // Calambre simple: piernas<35
      if(!G.midRaceEventTriggered.xp_cramp&&pct>=0.4&&r.legs<35){
        if(Math.random()<0.55){
          G.midRaceEventTriggered.xp_cramp=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_cramp')};
        }
      }
      // Calambre doble: piernas<30 y bodyLoad>60
      if(!G.midRaceEventTriggered.xp_double_cramp&&pct>=0.45&&r.legs<30&&(G.bodyLoad||0)>60){
        if(Math.random()<0.65){
          G.midRaceEventTriggered.xp_double_cramp=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_double_cramp')};
        }
      }
      // Tormenta: clima extremo
      if(!G.midRaceEventTriggered.xp_storm_timed&&G.weather==='extremo'&&pct>=0.25&&pct<0.7){
        if(Math.random()<0.5){
          G.midRaceEventTriggered.xp_storm_timed=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_storm_timed')};
        }
      }
      // Bifurcación: aleatorio
      if(!G.midRaceEventTriggered.xp_fork&&pct>=0.15&&pct<0.65){
        if(Math.random()<0.22){
          G.midRaceEventTriggered.xp_fork=true;
          G.midRaceEventTriggered._xpTimedCount=(xpTimed+1);
          return{...EXPRESS_TIMED_EVENTS.find(e=>e.id==='xp_fork')};
        }
      }
    }

    // ── NARRATIVE (máx 2) ──────────────────────────────────────────
    if(xpNarr<2){
      // Pool de narrativos no usados
      const usedNarr=Object.keys(G.midRaceEventTriggered).filter(k=>k.startsWith('xn_'));
      const availNarr=EXPRESS_NARRATIVE_EVENTS.filter(e=>!usedNarr.includes(e.id));
      if(availNarr.length>0&&Math.random()<0.30){
        // Filtrar por contexto
        let candidates=availNarr;
        // Calor solo en verano, niebla en montaña
        if(![6,7,8].includes(G.selectedRaces[G.currentRaceIdx]?.month||6)){
          candidates=candidates.filter(e=>e.id!=='xn_heat_wave');
        }
        if(!(G.selectedRaces[G.currentRaceIdx]?.altitude)){
          candidates=candidates.filter(e=>e.id!=='xn_breathing'&&e.id!=='xn_fog');
        }
        if(candidates.length===0)candidates=availNarr;
        const picked=candidates[Math.floor(Math.random()*candidates.length)];
        G.midRaceEventTriggered[picked.id]=true;
        G.midRaceEventTriggered._xpNarrCount=(xpNarr+1);
        return{...picked};
      }
    }
  }

  return null;
}

function renderMidRaceEvent(){
  const el=document.getElementById('main');
  const ev=G.midRaceEvent;
  if(!ev){G.screen='segment';render();return;}
  const race=G.selectedRaces[G.currentRaceIdx];
  const isTimed=ev.timed&&G.gameMode==='expres';
  el.innerHTML=`
    ${topBar()}${progBar()}${raceStats()}
    <div style="margin:14px 0 6px">
      ${isTimed?`<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:11px;font-weight:700;color:#c07a10;letter-spacing:1px;text-transform:uppercase">⚡ Decisión rápida</div>
          <div style="font-size:18px;font-weight:700;color:#c07a10" id="xp-timer-num">7</div>
        </div>
        <div style="height:5px;background:#f0e8d8;border-radius:3px;overflow:hidden">
          <div id="xp-timer-bar" style="height:100%;width:100%;background:#c07a10;border-radius:3px;transition:width .9s linear"></div>
        </div>
      </div>`:'<div style="font-size:11px;font-weight:700;color:#aaa;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Evento en carrera</div>'}
      <h2 style="font-size:19px;margin-bottom:6px">${ev.title}</h2>
      <p style="font-size:14px;color:#555;line-height:1.65;margin-bottom:18px">${ev.desc}</p>
      <div style="display:grid;gap:8px">
        ${ev.choices.map((c,i)=>`<div class="pace" onclick="resolveMidRaceEvent('${ev.id}','${c.id}')">
          <div class="pace-label" style="font-size:14px;margin-bottom:0">${isTimed&&i===(ev.defaultChoice||0)?'<span style="font-size:11px;color:#aaa;font-weight:400">(por defecto) </span>':''}${c.text}</div>
        </div>`).join('')}
      </div>
    </div>`;
  if(isTimed)startExpressTimer(ev.defaultChoice||0);
}
window.resolveMidRaceEvent=(evId,choiceId)=>{
  const r=G.runner;
  if(evId==='storm'){
    G.stormActive=true;
    if(choiceId==='shelter'){
      G.stormProtected=true;
      G.time+=180; // +3 min
      G.weather='tormenta';
      G.raceEvent='Te refugias y te pones el chubasquero. Pierdes 3 minutos pero la tormenta ya no te penalizará tanto.';
    } else {
      G.stormProtected=false;
      G.weather='tormenta';
      G.raceEvent='Atraviesas la tormenta a cuerpo descubierto. Rápido, pero la hidratación se resentirá en los tramos siguientes.';
    }
  } else if(evId==='injured_runner'){
    if(choiceId==='help'){
      G.time+=120; // +2 min
      G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+2);
      G.followers=(G.followers||0)+200;
      G.raceEvent='Ayudas al corredor hasta que llega un voluntario. Pierdes 2 minutos pero el gesto te da alas. +2 Mental.';
    } else if(choiceId==='warn'){
      G.raceEvent='Le dices que avisarás en el siguiente puesto y continúas. Una decisión razonable.';
    } else {
      r.energy=Math.max(0,r.energy-5);
      G.raceEvent='Sigues adelante. La imagen del corredor en el suelo te acompaña los siguientes kilómetros. -5 energía.';
    }
  } else if(evId==='friends_cheer'){
    if(choiceId==='sprint'){
      G.time+=180; // se van 3 min extra de "pérdida" por acelerar demasiado
      G.runner.energy=Math.max(0,G.runner.energy-3);
      G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+4);
      G.raceEvent='¡Tus amigos te dan alas! Aceleras a tope durante 200m. +4 Mental, pero el cuerpo lo nota. 🔥';
    } else {
      G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+4);
      G.followers=(G.followers||0)+120;
      G.raceEvent='Saludas con la mano y sigues. La energía del grupo te lleva hasta el siguiente avituallamiento. +4 Mental 🙌';
    }
  } else if(evId==='hat_blown'){
    if(choiceId==='get_hat'){
      G.time+=90;
      G.raceEvent='Vuelves a por la gorra. 90 segundos perdidos pero la cabeza protegida para el resto de la carrera.';
    } else {
      // sin gorra: más hidratación perdida en tramos solares
      G.runner.hydration=Math.max(0,G.runner.hydration-6);
      G.raceEvent='Sigues sin gorra. El viento y el sol pican el resto de la carrera. −6 hidratación.';
    }
  } else if(evId==='sock_adjust'){
    if(choiceId==='fix_sock'){
      G.time+=60;
      G.raceEvent='Un minuto parado recolocando el calcetín. Bien hecho — ninguna ampolla molestará el resto del camino.';
    } else {
      // riesgo de ampolla: piernas pierden algo más al final
      G.runner.legs=Math.max(0,G.runner.legs-8);
      G.raceEvent='Aguantas el roce. Las piernas pagarán el precio en los últimos kilómetros. −8 piernas.';
    }
  } else if(evId==='mud_fall'){
    if(choiceId==='get_up_fast'){
      G.runner.legs=Math.max(0,G.runner.legs-5);
      G.runner.energy=Math.max(0,G.runner.energy-2);
      G.raceEvent='Te levantas en un segundo y sigues. El ego más que las piernas. −5 piernas, −2 energía.';
    } else {
      G.time+=30;
      G.runner.legs=Math.max(0,G.runner.legs-3);
      G.raceEvent='Treinta segundos para asegurarte de que todo está bien. Nada roto, sigues. −3 piernas.';
    }
  } else if(evId==='sabotage'){
    if(choiceId==='honest'){
      G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+2);
      G.followers=(G.followers||0)+80;
      G.fairPlayCount=(G.fairPlayCount||0)+1;
      G.raceEvent='Haces lo correcto. El fair play define quién eres en el monte, no solo el tiempo. +2 Mental.';
    } else {
      // Engañas: ganas tiempo pero pierdes reputación y mental
      G.time=Math.max(0,G.time-300); // ~5 min de ventaja
      G.runner.stats.mental=Math.max(1,(G.runner.stats.mental||50)-3);
      G.followers=Math.max(0,(G.followers||0)-150);
      G.raceEvent='El rival toma el camino equivocado. Ganas posición, pero algo te pesa dentro. −3 Mental, −popularidad.';
    }
  } else if(evId==='lost'){
    if(choiceId==='gps'){
      G.time+=150; // +2:30 min
      G.raceEvent='El GPS te saca del laberinto de niebla. Pierdes 2:30 pero llegas al tramo correcto.';
    } else {
      // Roll de Mental
      const mental=getEffStat('mental');
      const roll=Math.random()*100;
      if(roll<mental){
        G.time+=80; // +1:20 min
        G.raceEvent='Tu instinto y experiencia en montaña te orientan rápido. Sólo pierdes 1:20 minutos.';
      } else {
        G.time+=280; // +4:40 min
        r.energy=Math.max(0,r.energy-8);
        G.raceEvent='Te pierdes más de lo esperado. Pierdes 4:40 y llegas a la senda exhausto. -8 energía.';
      }
    }
  }
  // ── EXPRESS TIMED EVENTS resolution ─────────────────────────────
  clearExpressTimer();
  if(evId==='xp_descent'){
    if(choiceId==='safe_descent'){r.legs=Math.min(100,r.legs+3);G.time+=45;G.raceEvent='Aseguras la bajada. +45 seg pero las piernas te lo agradecen.';}
    else{const risk=r.legs<40||r.energy<30;if(risk){r.legs=Math.max(0,r.legs-8);r.energy=Math.max(0,r.energy-5);G.raceEvent='Mantienes el ritmo en la bajada pero el cuerpo está justo. -8 piernas.';}else{G.time-=30;G.raceEvent='La bajada sale bien. Ganas 30 seg.';}}
  } else if(evId==='xp_rival'){
    if(choiceId==='follow_rival'){const ok=r.legs>50&&r.energy>40;if(ok){G.time-=25;G.raceEvent='Le sigues y aguantas. Ganas 25 seg al pelotón.';}else{r.energy=Math.max(0,r.energy-10);r.legs=Math.max(0,r.legs-8);G.raceEvent='Le sigues pero el cuerpo no responde. -10 energía, -8 piernas.';}}
    else{r.stats.mental=Math.min(100,(r.stats.mental||50)+2);G.raceEvent='Mantienes tu plan. +2 Mental — la cabeza manda.';}
  } else if(evId==='xp_cramp'){
    if(choiceId==='ease_cramp'){r.legs=Math.min(100,r.legs+4);G.time+=60;G.raceEvent='Bajas el ritmo. El calambre se va. +1 min pero llegas bien.';}
    else{const ok=Math.random()<0.45;if(ok){G.time-=20;G.raceEvent='Fuerzas y el cuerpo responde. Ganas 20 seg.';}else{r.legs=Math.max(0,r.legs-14);G.raceEvent='El calambre se dispara. -14 piernas.';}}
  } else if(evId==='xp_final'){
    if(choiceId==='sprint_finish'){G.time-=55;r.energy=Math.max(0,r.energy-15);G.raceEvent='¡Rematas a tope! -55 seg. Las piernas piden parar pero la meta está cerca.';}
    else{r.energy=Math.min(100,r.energy+4);G.raceEvent='Llegas sólido y con margen. Buen final controlado.';}
  } else if(evId==='xp_storm_timed'){
    if(choiceId==='shelter_storm'){G.stormProtected=true;G.stormActive=true;G.weather='tormenta';G.raceEvent='Guardas posición. La tormenta castiga menos.';}
    else{G.stormProtected=false;G.stormActive=true;G.weather='tormenta';G.time-=40;r.hydration=Math.max(0,r.hydration-15);G.raceEvent='Aprietas bajo la tormenta. Ganas 40 seg pero la hidratación se resiente. -15 hidratación.';}
  } else if(evId==='xp_fork'){
    const ok=Math.random()<0.6;
    if(ok){G.raceEvent='¡Acertaste la bifurcación! Camino correcto, sin perder tiempo.';}
    else{G.time+=150;r.energy=Math.max(0,r.energy-6);G.raceEvent='Camino equivocado. Vuelves atrás. +2:30 min, -6 energía.';}
  }
  // ── 6 nuevos timed ──────────────────────────────────────────────
  else if(evId==='xp_rival_wheel'){
    if(choiceId==='shake_rival'){r.energy=Math.max(0,r.energy-10);G.time-=20;G.raceEvent='Le sacudes de tu rueda. Ganas 20s pero pagas 10 de energía.';}
    else{r.stats.mental=Math.min(100,(r.stats.mental||50)+2);G.raceEvent='Mantienes el ritmo. Él viene fresquito, tú también. +2 Mental.';}
  }
  else if(evId==='xp_climb_attack'){
    if(choiceId==='respond_climb'){r.energy=Math.max(0,r.energy-8);G.time-=15;G.raceEvent='Respondes al ataque. -8 energía pero mantienes la posición.';}
    else{G.raceEvent='Dejas ir el ataque. El gap crece pero llegas fresco al collado.';}
  }
  else if(evId==='xp_last_descent'){
    if(choiceId==='full_descent'){const risk=r.legs<40;if(risk){r.legs=Math.max(0,r.legs-12);G.raceEvent='Caída en el último descenso. -12 piernas, llegas cojeando.'}else{G.time-=45;G.raceEvent='¡Vuelas en el descenso! -45s. Llegada espectacular.';}}
    else{G.time+=20;G.raceEvent='Desciendes seguro. +20s pero sin sustos. Llegas de una pieza.';}
  }
  else if(evId==='xp_slippery'){
    if(choiceId==='careful_slip'){G.time+=10;G.raceEvent='Buscas la trazada. +10s pero el pie aguanta.';}
    else{const risk=r.legs<40;if(risk){r.legs=Math.max(0,r.legs-8);G.time+=8;G.raceEvent='El pie se va. Te recuperas pero -8 piernas.';}else{G.raceEvent='Aguantas el equilibrio. Sin perder tiempo.';}}}
  else if(evId==='xp_heat_cold'){
    if(choiceId==='adjust_temp'){r.hydration=Math.min(100,r.hydration+8);G.raceEvent='Ajustas el ritmo. +8 hidratación, el cuerpo lo agradece.';}
    else{r.energy=Math.max(0,r.energy-8);r.stats.resistencia=Math.max(10,(r.stats.resistencia||50)-5);G.raceEvent='El golpe de temperatura te castiga. -8 energía, -5 Resistencia.';}
  }
  else if(evId==='xp_double_cramp'){
    if(choiceId==='stretch_double'){G.time+=25;r.legs=Math.min(100,r.legs+6);G.raceEvent='Estiras 25s. Los calambres ceden. +6 piernas.';}
    else{const risk=(G.bodyLoad||0)>70;if(risk){r.legs=Math.max(0,r.legs-20);if(Math.random()<0.3)G.injuryType='tendinitis';G.raceEvent='Los dos cuádriceps explotan. -20 piernas'+(!G.injuryType?'':' y tendinitis')+'.';}else{G.raceEvent='Aguantas. Llegas al límite pero de pie.';}}}
  // ── 12 narrativos ───────────────────────────────────────────────
  else if(evId==='xn_public_final'){
    if(choiceId==='show_public'){r.stats.mental=Math.min(100,(r.stats.mental||50)+10);r.energy=Math.max(0,r.energy-5);G.raceEvent='¡La gente te enloquece! +10 Mental, -5 energía. Llegas con el puño en alto.';}
    else{G.raceEvent='Llegas sereno. Sin explosiones, sin regalar energía.';}
  }
  else if(evId==='xn_rival_position'){
    if(choiceId==='chase_rival'){r.energy=Math.max(0,r.energy-10);const caught=Math.random()<0.55;if(caught){G.time-=18;G.raceEvent='¡Le atrapas! Ganas posición. -10 energía pero merece la pena.';}else{G.raceEvent='No llegas a alcanzarle. -10 energía sin resultado.';}}
    else{G.raceEvent='Mantienes tu ritmo. Llegas más fresco al final.';}
  }
  else if(evId==='xn_heat_wave'){
    if(choiceId==='drink_more'){r.hydration=Math.min(100,r.hydration+10);G.raceEvent='Bebes bien en el avituallamiento. +10 hidratación.';}
    else{r.hydration=Math.max(0,r.hydration-12);G.raceEvent='El calor se lleva la hidratación. -12 hidratación.';}
  }
  else if(evId==='xn_breathing'){
    if(choiceId==='pause_breath'){G.time+=20;r.stats.resistencia=Math.min(100,(r.stats.resistencia||50)+3);G.raceEvent='20s de pausa. La respiración se regulariza. +3 Resistencia.';}
    else{r.stats.resistencia=Math.max(10,(r.stats.resistencia||50)-5);G.raceEvent='Fuerzas la respiración. -10% Resistencia en este tramo.';}
  }
  else if(evId==='xn_terrain_bump'){
    if(choiceId==='check_bump'){G.time+=10;G.raceEvent='Evalúas el tobillo. Está bien. +10s pero sin riesgo.';}
    else{r.legs=Math.max(0,r.legs-5);G.raceEvent='Sigues sin parar. -5 piernas pero ahorras el tiempo.';}
  }
  else if(evId==='xn_fog'){
    if(choiceId==='gps_fog'){G.time+=15;G.raceEvent='GPS y cautela. +15s pero camino correcto.';}
    else{const ok=Math.random()<0.55;if(ok){G.raceEvent='El instinto no falla. Sendero correcto.';}else{G.time+=40;r.energy=Math.max(0,r.energy-5);G.raceEvent='Te desvías en la niebla. +40s, -5 energía.';}}}
  else if(evId==='xn_goat'){
    if(choiceId==='go_around'){G.time+=10;G.raceEvent='Rodeo por la ladera. +10s. La cabra ni se inmuta.';}
    else{const ok=Math.random()<0.6;if(ok){G.time+=5;G.raceEvent='La cabra se aparta. Solo +5s.'}else{r.stats.mental=Math.max(10,(r.stats.mental||50)-3);G.time+=15;G.raceEvent='El susto te descoloca. +15s, -3 Mental.';}}}
  else if(evId==='xn_dog'){
    if(choiceId==='enjoy_dog'){r.stats.mental=Math.min(100,(r.stats.mental||50)+8);G.time+=5;G.followers=(G.followers||0)+150;G.raceEvent='El perro se hace viral en redes. +8 Mental, +150 seguidores 🐕';}
    else{G.raceEvent='El perro desiste. Sigues al ritmo.';}
  }
  else if(evId==='xn_sign_down'){
    if(choiceId==='fix_sign'){G.time+=10;r.stats.mental=Math.min(100,(r.stats.mental||50)+3);G.raceEvent='Corriges la señal. +10s, +3 Mental. Los de atrás te lo agradecerán.';}
    else{const ok=Math.random()<0.65;if(ok){G.raceEvent='Tu instinto es correcto. Sin pérdida de tiempo.'}else{G.time+=30;G.raceEvent='Te equivocas. +30s para retomar el camino.';}}}
  else if(evId==='xn_retired_rival'){
    if(choiceId==='help_retired'){G.time+=20;r.stats.mental=Math.min(100,(r.stats.mental||50)+4);G.followers=(G.followers||0)+200;G.raceEvent='Te paras a ayudar. +20s pero +4 Mental y +200 seguidores.';}
    else{G.time-=10;G.raceEvent='Aprovechas el hueco. Ganas 10s y subes posiciones.';}
  }
  else if(evId==='xn_endless_climb'){
    if(choiceId==='manage_climb'){G.raceEvent='Gestionas la subida. Llegas al collado con reservas.';}
    else{r.energy=Math.max(0,r.energy-18);G.time-=30;G.raceEvent='Empujas la subida. -18 energía pero llegas 30s antes.';}
  }
  else if(evId==='xn_runner_fallen'){
    if(choiceId==='help_fallen'){G.time+=20;r.stats.mental=Math.min(100,(r.stats.mental||50)+4);G.raceEvent='Le ayudas a levantarse. +20s, +4 Mental.';}
    else{G.time+=5;G.raceEvent='Compruebas que puede seguir y continúas. +5s.';}
  }
  else if(evId==='slip_nf'){
    if(choiceId==='ease_slip'){
      r.legs=Math.max(0,r.legs-4);G.raceEvent='Bajas un poco el ritmo. El pie ha aprendido la lección. −4 piernas, nada más.';
    } else {
      r.legs=Math.max(0,r.legs-6);G.raceEvent='Sigues igual. El terreno sigue resbaladizo y las piernas compensan cada paso. −6 piernas.';
    }
  }
  else if(evId==='mid_trap'){
    if(choiceId==='manage_trap'){
      r.energy=Math.max(0,r.energy-5);G.raceEvent='Gestionas el esfuerzo. La montaña te engañó, pero tú no la engañaste a ti mismo. −5 energía bien administrada.';
    } else {
      r.energy=Math.max(0,r.energy-15);G.raceEvent='Sigues empujando cumbre a cumbre. La montaña gana la partida — llegas al plano completamente vaciado. −15 energía.';
    }
  }
  else if(evId==='heavy_legs'){
    if(choiceId==='stretch_legs'){
      G.time+=60;r.legs=Math.max(0,r.legs-3);G.raceEvent='Un minuto de estiramiento activa la circulación. Las piernas responden un poco mejor. +1 min, −3 piernas.';
    } else if(choiceId==='shuffle_legs'){
      r.legs=Math.max(0,r.legs-8);G.raceEvent='Zancada corta y cadencia alta. Las piernas pagan el cambio pero el ritmo no cae. −8 piernas.';
    } else {
      r.legs=Math.max(0,r.legs-15);
      if((G.bodyLoad||0)>70&&Math.random()<0.35){G.injuryType=G.injuryType||'tendinitis';G.raceEvent='Las piernas explotan. −15 piernas. La tensión acumulada deriba en tendinitis.';}
      else{G.raceEvent='Aguantas a duras penas. −15 piernas. Llegas al avituallamiento arrastrando los pies.';}
    }
  }
  else if(evId==='nickname_shout'){
    if(choiceId==='fist_pump'){
      r.stats.mental=Math.min(100,(r.stats.mental||50)+6);r.energy=Math.max(0,r.energy-5);
      G.raceEvent='¡El puño en alto y a volar! +6 Mental. Las piernas no saben que están cansadas. −5 energía.';
    } else {
      r.stats.mental=Math.min(100,(r.stats.mental||50)+4);G.followers=(G.followers||0)+150;
      G.raceEvent='Sonríes y sigues. Ese +4 Mental te lleva al siguiente avituallamiento casi gratis. +150 seguidores.';
    }
  }
  else if(evId==='lent_pole'){
    if(choiceId==='give_pole'){
      G.time+=120;r.stats.mental=Math.min(100,(r.stats.mental||50)+3);G.followers=(G.followers||0)+200;G.fairPlayCount=(G.fairPlayCount||0)+1;
      G.raceEvent='Le llevas el bastón. Dos minutos perdidos, pero el corredor sigue. +3 Mental, +200 seguidores, y fair play anotado.';
    } else if(choiceId==='point_pole'){
      G.raceEvent='Le señalas el bastón y sigues. Él puede volver. Hiciste lo mínimo sin perder el ritmo.';
    } else {
      G.time+=60;r.stats.mental=Math.min(100,(r.stats.mental||50)+1);
      G.raceEvent='Llevas el bastón hasta el avituallamiento. +1 min. Queda allí para cuando él llegue.';
    }
  }
  else if(evId==='dog_fan'){
    if(choiceId==='enjoy_dog'){
      r.stats.mental=Math.min(100,(r.stats.mental||50)+5);G.time+=5;G.followers=(G.followers||0)+180;
      G.raceEvent='¡El perro se hace viral! Corréis juntos 400m más. +5 Mental, +180 seguidores 🐕';
    } else {
      G.time+=10;G.raceEvent='El perro entiende el mensaje y da media vuelta. +10 seg. Ya puedes concentrarte.';
    }
  }
  else if(evId==='bad_fall'){
    if(choiceId==='check_fall'){
      G.time+=120;r.legs=Math.max(0,r.legs-8);
      G.raceEvent='Dos minutos de evaluación. Nada roto, solo arañazos y orgullo herido. −8 piernas. Sigues con cabeza.';
    } else {
      r.legs=Math.max(0,r.legs-14);r.energy=Math.max(0,r.energy-8);
      if(Math.random()<0.25){G.injuryType=G.injuryType||'tendinitis';G.raceEvent='Te levantas y corres. −14 piernas, −8 energía. El cuerpo lo pagará — y aparece tendinitis.';}
      else{G.raceEvent='Te levantas y corres. La adrenalina tapa el dolor 2 km. −14 piernas, −8 energía. Sobrevives.';}
    }
  }
  else if(evId==='endless_climb'){
    if(choiceId==='manage_climb'){
      r.energy=Math.max(0,r.energy-8);G.raceEvent='Marchas rápido y llegas al collado con algo en el depósito. −8 energía. Ahí estaba la cima.';
    } else {
      G.time-=120;r.energy=Math.max(0,r.energy-20);G.raceEvent='Empujas y llegas 2 min antes. −20 energía. La bajada será otra historia.';
    }
  }
  else if(evId==='stone_legs'){
    if(choiceId==='walk_descents'){
      r.legs=Math.max(0,r.legs-5);G.raceEvent='Caminas las bajadas. El ego sufre pero los cuádriceps aguantan hasta la meta. −5 piernas.';
    } else if(choiceId==='run_descents'){
      r.legs=Math.max(0,r.legs-10);G.time-=90;G.raceEvent='Bajas corriendo con bastones. Ganas 1:30 pero los cuádriceps ya no perdonarán. −10 piernas.';
    } else {
      G.time+=60;r.legs=Math.max(0,r.legs-6);G.raceEvent='La trazada suave absorbe algo del impacto. +1 min, −6 piernas. La mejor opción posible.';
    }
  }
  // ── 12 NUEVOS EVENTOS MODO NORMAL ────────────────────────────────
  else if(evId==='empty_aid'){
    if(choiceId==='ration'){
      r.hydration=Math.max(0,r.hydration-5);r.energy=Math.max(0,r.energy-4);
      G.raceEvent='Te racionas. Llegas al siguiente puesto con reservas justas, pero de una pieza. −5 hidratación, −4 energía.';
    } else if(choiceId==='stream'){
      r.hydration=Math.min(100,r.hydration+10);
      if(Math.random()<0.4){r.energy=Math.max(0,r.energy-12);G.raceEvent='Bebes del arroyo. El estómago protesta a los 500 metros. +hidratación, −12 energía por malestar.';}
      else{G.raceEvent='Bebes del arroyo sin consecuencias. Suerte — el agua estaba bien. +10 hidratación.';}
    } else {
      r.hydration=Math.max(0,r.hydration-12);r.energy=Math.max(0,r.energy-10);
      G.raceEvent='Fuerzas sin recargar. Los kilómetros siguientes son un calvario. −12 hidratación, −10 energía.';
    }
  }
  else if(evId==='bad_gel'){
    if(choiceId==='eat_gel'){
      r.energy=Math.min(100,r.energy+5);
      if(Math.random()<0.45){r.energy=Math.max(0,r.energy-14);G.raceEvent='+5 energía del gel… pero el estómago se rebela a los 200m. −14 energía neta.';}
      else{G.raceEvent='El gel sabe fatal pero el cuerpo lo acepta. +5 energía con suerte de tu lado.';}
    } else {
      G.raceEvent='Tiras el gel. No vale la pena el riesgo. Sigues con lo que tienes.';
    }
  }
  else if(evId==='trail_blocked'){
    if(choiceId==='wait_herd'){
      G.time+=90;G.raceEvent='Las cabras pasan a su ritmo. Usas el minuto y medio para estirarte un poco. +1:30 min.';
    } else if(choiceId==='detour_herd'){
      G.time+=120;r.legs=Math.max(0,r.legs-4);G.raceEvent='Rodeas por la ladera. +2 min y −4 piernas por el desnivel extra, pero sin perder ritmo mental.';
    } else {
      G.time+=40;r.stats.mental=Math.min(100,(r.stats.mental||50)+1);G.followers=(G.followers||0)+80;
      G.raceEvent='Las cabras se apartan curiosas. Imagen para el recuerdo. +40 seg, +1 Mental, +seguidores 🐐';
    }
  }
  else if(evId==='confusing_fork'){
    if(choiceId==='gps_fork'){
      G.time+=45;G.raceEvent='GPS confirmado. Camino correcto. +45 seg pero sin margen de error.';
    } else if(choiceId==='gut_fork'){
      const roll=Math.random()*100;
      if(roll<mental){G.time+=10;G.raceEvent='Tu instinto no falla. Sendero correcto con solo +10 seg de duda.';}
      else{G.time+=240;r.energy=Math.max(0,r.energy-8);G.raceEvent='El instinto te traiciona. +4 min para volver a la senda correcta. −8 energía.';}
    } else {
      G.time+=30;G.raceEvent='El corredor que llega también duda, pero entre dos la lógica gana. +30 seg. Camino correcto.';
    }
  }
  else if(evId==='rival_pass'){
    if(choiceId==='give_way'){
      G.time+=20;r.stats.mental=Math.min(100,(r.stats.mental||50)+2);G.fairPlayCount=(G.fairPlayCount||0)+1;
      G.raceEvent='Le cedes el paso. El gesto te da la razón y +2 Mental. Recuperarás esa posición más adelante. +20 seg.';
    } else if(choiceId==='hold_pace'){
      if(Math.random()<0.55){G.raceEvent='Aguantas el ritmo y él no puede pasar. Llegas a un tramo ancho y se separa. Sin coste.'}
      else{r.energy=Math.max(0,r.energy-5);G.time+=10;G.raceEvent='La tensión de no ceder te cuesta energía. Finalmente pasa. −5 energía.';}
    } else {
      r.energy=Math.max(0,r.energy-8);
      if(Math.random()<0.5){G.time-=15;G.raceEvent='¡Aguantas su rueda y tiras de él! Ganas 15 seg netos. −8 energía bien invertida.'}
      else{G.raceEvent='Intentas seguirle pero la diferencia de forma se nota. −8 energía sin beneficio.'}
    }
  }
  else if(evId==='temp_change'){
    if(choiceId==='put_jacket'){
      G.time+=90;r.hydration=Math.min(100,r.hydration+4);
      G.raceEvent='Te pones el cortavientos. +1:30 min pero el cuerpo agradece la protección térmica los siguientes km.';
    } else {
      r.hydration=Math.max(0,r.hydration-5);r.legs=Math.max(0,r.legs-4);
      G.raceEvent='Aprietas para entrar en calor. El frío pasa antes de lo esperado pero −5 hidratación y −4 piernas por el esfuerzo extra.';
    }
  }
  else if(evId==='crowd_cameras'){
    if(choiceId==='wave_crowd'){
      r.stats.mental=Math.min(100,(r.stats.mental||50)+3);G.followers=(G.followers||0)+100;
      G.raceEvent='¡La gente te anima! Saludas y sigues fuerte. +3 Mental, +100 seguidores 📸';
    } else if(choiceId==='show_off'){
      G.time-=50;r.energy=Math.max(0,r.energy-6);G.followers=(G.followers||0)+250;
      G.raceEvent='Aceleras para la cámara. −50 seg y +250 seguidores, pero −6 energía. Las redes lo adorarán.';
    } else {
      r.stats.mental=Math.min(100,(r.stats.mental||50)+1);
      G.raceEvent='Foco total. El ruido de fondo desaparece. +1 Mental por la concentración.';
    }
  }
  else if(evId==='bottleneck'){
    if(choiceId==='wait_jam'){
      G.time+=90;G.raceEvent='Esperas. Noventa segundos de pausa forzada. Al menos las piernas descansan un poco.';
    } else if(choiceId==='alt_line'){
      r.legs=Math.max(0,r.legs-5);
      if(Math.random()<0.6){G.time-=10;G.raceEvent='La línea alternativa funciona. −5 piernas pero ganas posición.'}
      else{G.time+=45;r.legs=Math.max(0,r.legs-3);G.raceEvent='La roca está resbaladiza. +45 seg y −8 piernas en total.'}
    } else {
      if(Math.random()<0.55){G.time+=30;G.raceEvent='Pides paso con educación y alguno se aparta. +30 seg y problema resuelto.'}
      else{G.time+=90;G.raceEvent='Nadie cede. Esperas a que el sendero se ensanche. +1:30 min como el plan A.'}
    }
  }
  else if(evId==='hunger_crisis'){
    if(choiceId==='use_gel_now'){
      r.energy=Math.min(100,r.energy+12);G.raceEvent='El gel hace efecto en dos minutos. +12 energía. Llegas al siguiente avituallamiento bien.';
    } else if(choiceId==='slow_hunger'){
      r.energy=Math.max(0,r.energy-10);G.raceEvent='Bajas el ritmo y aguantas. −10 energía extra, pero llegas al avituallamiento y recargas.';
    } else {
      r.energy=Math.min(100,r.energy+5);
      G.raceEvent='La barrita tarda más en hacer efecto pero es sostenida. +5 energía gradual. Una buena decisión.';
    }
  }
  else if(evId==='frozen_hands'){
    if(choiceId==='warm_hands'){
      G.time+=120;r.legs=Math.min(100,r.legs+2);
      G.raceEvent='Dos minutos frotándote las manos contra el pecho. Recuperas el agarre y el bastón vuelve a ser un aliado.';
    } else if(choiceId==='no_poles'){
      r.stats.mental=Math.min(100,(r.stats.mental||50)+2);
      G.raceEvent='Guardas los bastones. Sin ellos vas más libre pero las subidas cuestan el doble. +2 Mental por la adaptación.';
    } else {
      r.legs=Math.max(0,r.legs-8);G.raceEvent='Aguantas el frío. Los bastones resbalan en los apoyos y −8 piernas compensando el mal agarre.';
    }
  }
  else if(evId==='ankle_mud'){
    if(choiceId==='rock_line'){
      G.time+=30;G.raceEvent='Tomas la trazada de roca. +30 seg pero las piernas llegan al fondo sin extra de fatiga.';
    } else {
      r.legs=Math.max(0,r.legs-10);G.raceEvent='Atraviesas el lodazal a trompicones. −10 piernas por el esfuerzo muscular de sacar el pie en cada paso.';
    }
  }
  else if(evId==='false_flat'){
    if(choiceId==='read_terrain'){
      r.energy=Math.max(0,r.energy-6);G.raceEvent='Lees el terreno y ajustas el esfuerzo. −6 energía absorbida correctamente — sin colapso posterior.';
    } else {
      r.energy=Math.max(0,r.energy-14);G.raceEvent='Mantienes el ritmo de "llano" en un repecho real. −14 energía de golpe. El cuerpo tarda tres kilómetros en recuperarse.';
    }
  }
  G.midRaceEvent=null;
  G.screen='segment';
  render();
};

window.toggleNutTooltip=()=>{
  const t=document.getElementById('nut-tooltip');
  if(t)t.style.display=t.style.display==='none'?'block':'none';
};

window.doAbandon=()=>{
  const race=G.selectedRaces[G.currentRaceIdx];
  if(!race){G.screen='seasonBalance';render();return;}
  const kmDone=Math.round(race.km*(G.seg/curSegs().length));
  const sponsorPenalty=Object.values(G.sponsors).filter(Boolean).some(sp=>sp.objKey==='finish2'||sp.objKey==='finish3'||sp.objKey==='finish4');
  const el=document.getElementById('main');
  // Show confirm screen
  el.innerHTML=`
    ${topBar()}${progBar()}
    <h2 style="margin-top:12px">¿Abandonar la carrera?</h2>
    <p class="sub">${race.name} · km ${kmDone} de ${race.km}</p>
    <div class="note">
      <div style="font-weight:600;margin-bottom:6px">✅ Si abandonas ahora</div>
      <div style="font-size:13px;line-height:1.8">
        · Carga corporal reducida — llegas mejor a la siguiente<br>
        · Piernas y energía se recuperan parcialmente<br>
        · Si ya acumulas lesiones, proteger el cuerpo tiene sentido
      </div>
    </div>
    <div class="danger">
      <div style="font-weight:600;margin-bottom:6px">⚠️ Consecuencias del abandono</div>
      <div style="font-size:13px;line-height:1.8">
        · Sin puntos de ranking en esta carrera<br>
        · Sin premio económico<br>
        ${sponsorPenalty?'· Puede afectar al cumplimiento del objetivo de sponsor<br>':''}
        ${G.raceAbandonedCount>=2?`· Historial de ${G.raceAbandonedCount} abandonos — sponsors lo valoran negativamente<br>`:''}
        · Los rivales sumarán tiempo sin ti en la clasificación
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">
      <button class="main" style="margin-top:0;border-color:#c0392b;color:#c0392b" onclick="doAbandonConfirmed()">Sí, abandonar</button>
      <button class="main" style="margin-top:0" onclick="G.screen='segment';render()">Seguir corriendo →</button>
    </div>`;
};

window.doAbandonConfirmed=()=>{
  const race=G.selectedRaces[G.currentRaceIdx];
  if(!race){G.screen='seasonBalance';render();return;}
  // Revertir modificaciones temporales de carrera (warmup + mental momentum)
  endRaceCleanup();
  // Recover some energy from not finishing
  G.runner.energy=Math.min(60,G.runner.energy+20);
  G.runner.legs=Math.min(60,G.runner.legs+15);
  // Track abandonment
  G.raceAbandonedCount=(G.raceAbandonedCount||0)+1;
  if(!G.careerRaceHistory)G.careerRaceHistory={};
  if(!G.careerRaceHistory[race.id])G.careerRaceHistory[race.id]={finished:0,abandoned:0};
  G.careerRaceHistory[race.id].abandoned++;
  if(G.club&&G.club.id!=='none')changeClubRep(-10);
  // Small body load reduction (stopped early)
  G.bodyLoad=Math.max(0,G.bodyLoad-8);
  const el=document.getElementById('main');
  el.innerHTML=`
    <h2>Abandono</h2>
    <p class="sub">${race.name}</p>
    <div class="danger">Has decidido retirarte en el km ~${Math.round(race.km*(G.seg/curSegs().length))}. Es una decisión legítima — proteger el cuerpo es parte del trail.</div>
    <div class="note">
      <div style="font-weight:600;margin-bottom:4px">Consecuencias</div>
      <div style="font-size:13px">· Sin puntos de ranking en esta carrera</div>
      <div style="font-size:13px">· Sin premio</div>
      <div style="font-size:13px">· Carga corporal reducida — llegas mejor a la siguiente</div>
      ${G.raceAbandonedCount>=2?`<div style="font-size:13px;color:#c07a10">· Historial de abandonos — puede afectar negociaciones con sponsors</div>`:''}
    </div>
    <button class="main" style="margin-top:8px" onclick="afterRace()">Continuar →</button>`;
};

window.useDropbag=id=>{
  const d=DROPBAG_OPTIONS.find(x=>x.id===id);if(!d)return;
  if(!G.dropbagUsed)G.dropbagUsed=[];
  G.dropbagUsed.push(id);
  const r=G.runner;
  if(d.effect==='energy'||d.effect==='energy_slow'){
    r.energy=Math.min(100,r.energy+d.value);
    if(d.effect==='energy_slow')G.time+=60;
  }
  if(d.effect==='hydration')r.hydration=Math.min(100,r.hydration+d.value);
  if(d.effect==='legs')r.legs=Math.min(100,r.legs+d.value);
  render();
};
window.toggleAid=id=>{
  const idx=G.aidSelected.indexOf(id);
  if(idx>=0){G.aidSelected.splice(idx,1);}
  else if(G.aidSelected.length<2){G.aidSelected.push(id);}
  render();
};
window.confirmAid=()=>{
  const nb=G.sponsors.nutricion?1.2:1.0;
  const aidEff=Math.max(0.5, 1-agingDeg()*0.5); // geles/comida hasta 25% menos eficaces a los 54
  const r=G.runner;
  (G.aidSelected||[]).forEach(id=>{
    const o=AID_OPTIONS.find(a=>a.id===id);if(!o)return;
    if(id==='agua')   r.hydration=Math.min(100,r.hydration+30);
    if(id==='gel')    {r.energy=Math.min(100,r.energy+Math.round(20*nb*aidEff));G.time+=15;}
    if(id==='solido') {r.energy=Math.min(100,r.energy+Math.round(35*nb*aidEff));G.time+=45;}
    if(id==='descanso'){r.energy=Math.min(100,r.energy+Math.round(15*aidEff));r.hydration=Math.min(100,r.hydration+15);G.time+=90;}
  });
  G.rivals.forEach(rv=>rv.time+=Math.round(15+Math.random()*20));
  G.aidSelected=[];
  G.screen='segment';G.raceEvent='';render();
};

// ── CONSECUENCIAS ZONA ROJA ───────────────
function resolveRedZoneConsequence(zeroCount, redZoneMax, stormActive){
  // zeroCount = número de stats que llegaron a 0
  // redZoneMax = máx tramos consecutivos con alguna stat <10
  // Devuelve objeto de consecuencia o null
  const roll=Math.random();
  if(zeroCount>=3||(zeroCount>=2&&stormActive&&redZoneMax>=3)){
    // EXTREMA
    const opts=[
      {id:'hospitalizacion', label:'Hospitalización',
       desc:'El cuerpo dijo basta. Semana en urgencias, rehidratación IV. Pierdes €150 y un mes completo de competición.',
       icon:'🏥', color:'#c0392b',
       apply:(G)=>{G.money=Math.max(0,G.money-150);G.injuryRacesLeft=(G.injuryRacesLeft||0)+2;G.postRaceRestWeeks=(G.postRaceRestWeeks||0)+3;G.followers=(G.followers||0)+1200;},fameBonus:1200},
      {id:'colapso_muscular', label:'Colapso muscular',
       desc:'Rotura de fibras múltiples. El fisio dice que no corras en 6 semanas. Las piernas tardarán en volver.',
       icon:'💢', color:'#c0392b',
       apply:(G)=>{G.runner.stats.resistencia=Math.max(10,(G.runner.stats.resistencia||50)-8);G.injuryRacesLeft=(G.injuryRacesLeft||0)+2;G.postRaceRestWeeks=(G.postRaceRestWeeks||0)+2;G.followers=(G.followers||0)+900;},fameBonus:900},
    ];
    return opts[Math.floor(roll*opts.length)];
  } else if(zeroCount>=2||(zeroCount>=1&&redZoneMax>=4)||(stormActive&&redZoneMax>=3)){
    // SEVERA
    const opts=[
      {id:'gripe', label:'Bajón inmune — gripe',
       desc:'El esfuerzo extremo dejó las defensas por los suelos. Tres semanas en casa, sin entrenar ni competir.',
       icon:'🤒', color:'#c07a10',
       apply:(G)=>{G.injuryRacesLeft=(G.injuryRacesLeft||0)+1;G.postRaceRestWeeks=(G.postRaceRestWeeks||0)+2;G.followers=(G.followers||0)+500;},fameBonus:500},
      {id:'sobrecarga', label:'Sobrecarga muscular crónica',
       desc:'Las piernas han pagado el precio. Este año entrenarás un 20% menos efectivo en todo lo que sea de piernas.',
       icon:'🦵', color:'#c07a10',
       apply:(G)=>{G.seasonLegsPenalty=(G.seasonLegsPenalty||0)+0.20;G.followers=(G.followers||0)+350;},fameBonus:350},
      {id:'deshidratacion', label:'Deshidratación severa',
       desc:'La siguiente carrera la empiezas al 60% de hidratación. El cuerpo aún no ha recuperado el equilibrio electrolítico.',
       icon:'💧', color:'#c07a10',
       apply:(G)=>{G.nextRaceHydrationStart=60;G.followers=(G.followers||0)+250;},fameBonus:250},
    ];
    return opts[Math.floor(roll*opts.length)];
  } else if(redZoneMax>=2||(zeroCount>=1)){
    // LEVE
    const opts=[
      {id:'fatiga_residual', label:'Fatiga residual',
       desc:'El cuerpo no se ha recuperado del todo. La siguiente carrera empieza al 65% de energía y piernas.',
       icon:'😮‍💨', color:'#888',
       apply:(G)=>{G.nextRaceEnergyStart=65;G.nextRaceLegsStart=65;G.followers=(G.followers||0)+120;},fameBonus:120},
      {id:'descanso_forzado', label:'Semana de descanso obligatorio',
       desc:'El médico recomienda no entrenar esta semana. Pierdes un bloque de entrenamiento.',
       icon:'🛌', color:'#888',
       apply:(G)=>{G.postRaceRestWeeks=(G.postRaceRestWeeks||0)+1;G.followers=(G.followers||0)+80;},fameBonus:80},
    ];
    return opts[Math.floor(roll*opts.length)];
  }
  return null;
}

function renderRaceResult(){
  const el=document.getElementById('main');
  if(G._raceResultHTML){el.innerHTML=G._raceResultHTML;}
  else{el.innerHTML='<h2>Resultado</h2><p class="sub">Sin datos disponibles</p><button class="main" onclick="afterRace()">Continuar →</button>';}
}

// ── Calcula posición, premios y stats ganados ──────────
function calcRaceResult(race){
  const specBonus=race.spec&&race.spec===G.runner.specialty?0.92:1.0;
  // Calcular tiempos ajustados sin mutar G.rivals ni G.time
  const rivalsAdjusted=G.rivals.map(rv=>({...rv,time:Math.round(rv.time*(rv.spec===G.runner.specialty?0.97:1.0))}));
  const playerTime=Math.round(G.time*specBonus);
  const playerAge=G.runner.age||25;
  const playerCat=getAgeCategory(playerAge);
  const all=[{name:G.runner.name||'Tú',time:playerTime,me:true,flag:'',country:'',age:playerAge},
             ...rivalsAdjusted.map(rv=>({name:rv.name,time:rv.time,me:false,flag:rv.flag||'',country:rv.country||'',age:rv.age||30}))].sort((a,b)=>a.time-b.time);
  const pos=all.findIndex(x=>x.me)+1;
  const total=all.length;
  const catAll=all.filter(x=>getAgeCategory(x.age).id===playerCat.id);
  const catPos=catAll.findIndex(x=>x.me)+1;
  const catTotal=catAll.length;
  const prize=Math.round(race.prize*(PRIZE_TABLE[pos-1]||0)*(modeCfg().sponsorMult||1));
  // Stat bonuses
  const climbSegs=race.segs.filter(s=>s.type==='climb').length;
  const descentSegs=race.segs.filter(s=>s.type==='descent').length;
  const flatSegs=race.segs.filter(s=>s.type==='flat').length;
  const dom=climbSegs>=descentSegs&&climbSegs>=flatSegs?'subida':descentSegs>=flatSegs?'bajada':race.km>=40?'resistencia':'velocidad';
  const statGains=[];
  if(pos===1)statGains.push({k:dom,v:3});
  else if(pos===2)statGains.push({k:dom,v:2});
  else if(pos===3)statGains.push({k:dom,v:1});
  if(pos<=10)statGains.push({k:'mental',v:1});
  return {pos,total,all,prize,statGains,playerCat,catPos,catTotal,rivalsAdjusted,playerTime};
}

// ── Revierte modificaciones temporales de carrera (warmup + mental momentum) ──
// Llamado desde applyPostRaceTracking (carrera terminada) y desde doAbandonConfirmed (abandono).
// Usa deltas guardados en initRace para revertir exactamente lo que se aplicó (evita drift por clamping).
function endRaceCleanup(){
  if(G._mentalMomentumApplied){
    G.runner.stats.mental=Math.max(10,Math.min(100,G.runner.stats.mental-G._mentalMomentumApplied));
    G._mentalMomentumApplied=0;
  }
  G.mentalMomentum=0;
  if(G._warmupApplied){
    if(G._warmupVelDelta)G.runner.stats.velocidad=Math.max(10,Math.min(100,G.runner.stats.velocidad-G._warmupVelDelta));
    if(G._warmupSubDelta)G.runner.stats.subida=Math.max(10,Math.min(100,G.runner.stats.subida-G._warmupSubDelta));
    G._warmupApplied=false;
    G._warmupVelDelta=0;
    G._warmupSubDelta=0;
  }
}

// ── Aplica tracking, nemesis, km, PBs, lesiones, circuitos ──
function applyPostRaceTracking(race,res){
  const {pos,all,prize,statGains,playerCat,catPos,catTotal}=res;
  statGains.forEach(({k,v})=>{G.runner.stats[k]=Math.min(100,G.runner.stats[k]+v);});
  G.lastRaceGains=statGains;

  const zeroCount=[G.runner.energy,G.runner.hydration,G.runner.legs].filter(v=>v===0).length;
  const zeroedOut=zeroCount>=1;
  if(zeroedOut)G.zeroedOutThisRace=true;
  const consequence=resolveRedZoneConsequence(zeroCount,G.redZoneMax||0,G.stormActive||false);
  if(consequence){G.postRaceConsequence=consequence;consequence.apply(G);}
  G.redZoneStreak=0;G.redZoneMax=0;

  // Revertir modificaciones temporales de carrera (warmup + mental momentum)
  endRaceCleanup();

  // Rankings
  const rankPts=getRankPts(pos);
  G.ranking=Math.max(1,Math.min(999,(G.ranking===999?400:G.ranking)-rankPts+Math.floor(Math.random()*4)));
  G.specRanking=Math.max(1,Math.min(999,(G.specRanking===999?350:G.specRanking)-Math.round(rankPts*1.3)+Math.floor(Math.random()*3)));

  G.raceResults.push({name:race.name,time:G.time,pos,prize,all,statGains,
    catPos,catTotal,catName:playerCat.label,
    injuryType:G.injuryType||null,
    injuryLabel:G.injuryType?INJURY_TYPES[G.injuryType]?.label:null,
    kmAtInjury:G.injuryType?Math.round(race.km*(G.seg/curSegs().length)):null,
    zeroedOut,
  });
  // Clasificación Zegama por tiempo (corte: 4h20 = 260 min)
  if(race.id==='mayo'&&!G.injuryType&&G.time<=260){
    G.zegamaQualNext=true;
    showToast('¡Bajo el corte de Zegama! Clasificado para el año que viene 🏔️','#4a8a2a');
  }
  G.careerHistory.push({name:race.name,year:G.year,time:G.time,pos,prize,catPos,catTotal,catName:playerCat.label});
  G.money+=prize;

  // Nemesis tracking
  const myIdx=all.findIndex(a=>a.me);
  all.forEach((x,i)=>{
    if(x.me||i>=myIdx)return;
    const gap=G.time-x.time;
    if(!G.nemesisLog)G.nemesisLog={};
    if(!G.nemesisLog[x.name])G.nemesisLog[x.name]={wins:0,gapSum:0,gapCount:0};
    // Migración: si viene de save antiguo con `gaps` array, convertirlo
    if(G.nemesisLog[x.name].gaps){
      const old=G.nemesisLog[x.name].gaps;
      G.nemesisLog[x.name].gapSum=(G.nemesisLog[x.name].gapSum||0)+old.reduce((a,b)=>a+b,0);
      G.nemesisLog[x.name].gapCount=(G.nemesisLog[x.name].gapCount||0)+old.length;
      delete G.nemesisLog[x.name].gaps;
    }
    G.nemesisLog[x.name].wins++;
    G.nemesisLog[x.name].gapSum+=gap;
    G.nemesisLog[x.name].gapCount++;
  });
  if(G.nemesisLog&&Object.keys(G.nemesisLog).length>0){
    const sorted=Object.entries(G.nemesisLog)
      .map(([name,d])=>{
        // Compatibilidad con saves viejos
        const sum=d.gapSum!=null?d.gapSum:(d.gaps?d.gaps.reduce((a,b)=>a+b,0):0);
        const cnt=d.gapCount!=null?d.gapCount:(d.gaps?d.gaps.length:1);
        return {name,wins:d.wins,avgGap:cnt>0?sum/cnt:0};
      })
      .sort((a,b)=>b.wins-a.wins||(a.avgGap-b.avgGap));
    const top=sorted[0];
    const nemRival=all.find(x=>x.name===top.name);
    G.nemesis={name:top.name,flag:nemRival?.flag||'',wins:top.wins,avgGap:Math.round(top.avgGap)};
  }

  // Km, PBs, tormenta
  G.totalCareerKm=(G.totalCareerKm||0)+race.km;
  G.seasonKm=(G.seasonKm||0)+race.km;
  G.raceFinishedCount=(G.raceFinishedCount||0)+1;
  if(!G.personalBests)G.personalBests={};
  const existingPB=G.personalBests[race.id];
  if(!existingPB||G.time<existingPB.time){
    const isNew=!existingPB;
    G.personalBests[race.id]={time:G.time,year:G.year,pos};
    if(isNew) setTimeout(()=>showToast('🏆 ¡Primer registro en '+race.dist+'K! '+fmt(G.time),'#c07a10'),600);
    else setTimeout(()=>showToast('🏆 ¡Nuevo récord personal! '+fmt(G.time),'#c07a10'),600);
  }
  if(G.stormActive)G.stormSurvivedCount=(G.stormSurvivedCount||0)+1;
  checkAndUnlockAchievements();

  // Circuitos
  G.joinedCircuits.forEach(cid=>{
    const c=CIRCUITS_DB.find(x=>x.id===cid);
    if(c&&c.raceIds.includes(race.id)){
      if(!G.circuitPoints)G.circuitPoints={};
      G.circuitPoints[cid]=(G.circuitPoints[cid]||0)+circuitPoints(pos,all.length);
    }
  });
  G.followers=(G.followers||0)+Math.round(50+(pos===1?300:pos<=3?150:50));

  // Lesión post-carrera
  const specificInjury=getSpecificInjury(G.paceLog||[],getBodyLoad());
  if(specificInjury){
    const injData=INJURY_TYPES[specificInjury];
    G.injuryStatus='moderada';G.injuryType=specificInjury;
    G.injuryRecoverySeasons=injData.recoverySeasons||1;
    G.injuryRacesLeft=hasFisio()?Math.max(0,Math.round((injData.racesBlocked||0)*(injData.fisioDiscount||0.5))):injData.racesBlocked||0;
    Object.entries(injData.statPenalty).forEach(([k,v])=>{G.runner.stats[k]=Math.max(10,(G.runner.stats[k]||50)+v);});
    if(!G.injuryHistory)G.injuryHistory=[];
    G.injuryHistory.push({type:specificInjury,label:injData.label,race:race.name,year:G.year,km:race.km});
  } else {G.injuryStatus=null;G.injuryType=null;}

  // Historial y carga
  if(!G.careerRaceHistory)G.careerRaceHistory={};
  if(!G.careerRaceHistory[race.id])G.careerRaceHistory[race.id]={finished:0,abandoned:0};
  G.careerRaceHistory[race.id].finished++;
  G.bodyLoad=bodyLoadAfterRace(race.km);
  G.dropbagUsed=[];G.dropbagShown=false;G.redZoneStreak=0;G.redZoneMax=0;
  // Reputación de club: sube si top10, baja si posición mala
  if(G.club&&G.club.id!=='none'){
    if(pos===1)changeClubRep(10);
    else if(pos<=3)changeClubRep(6);
    else if(pos<=10)changeClubRep(3);
    else changeClubRep(-2);
  }
}

function finishRace(){
  G.screen='raceResult';
  const race=G.selectedRaces[G.currentRaceIdx];
  const res=calcRaceResult(race);
  // Aplicar mutaciones que antes hacía calcRaceResult (ahora pura)
  G.rivals=res.rivalsAdjusted;
  G.time=res.playerTime;
  applyPostRaceTracking(race,res);
  const {pos,total,all,prize,statGains,playerCat,catPos,catTotal}=res;

  const el=document.getElementById('main');
  const titles=['¡Victoria!','2.º puesto','3.º puesto','4.º puesto','5.º puesto'];
  const capStat=k=>k.charAt(0).toUpperCase()+k.slice(1);
  const topRows=all.slice(0,5);
  const meInTop=pos<=5;
  el.innerHTML=`
    <h2>${titles[pos-1]||pos+'º de '+total}</h2>
    <p class="sub">${race.name} · ${total} corredores</p>
    <div class="finish-time"><div class="label">Tiempo final</div><div class="val">${fmt(G.time)}</div></div>
    ${G.postRaceConsequence?`<div class="danger" style="border-color:${G.postRaceConsequence.color};background:${G.postRaceConsequence.color}11;margin-bottom:10px">
      <div style="font-size:15px;font-weight:700;color:${G.postRaceConsequence.color};margin-bottom:4px">${G.postRaceConsequence.icon} ${G.postRaceConsequence.label}</div>
      <div style="font-size:13px;color:#444;margin-bottom:${G.postRaceConsequence.fameBonus?'8px':'0'}">${G.postRaceConsequence.desc}</div>
      ${G.postRaceConsequence.fameBonus?`<div style="font-size:12px;color:#c07a10;font-weight:600">❤️ +${G.postRaceConsequence.fameBonus} seguidores — la comunidad del trail está contigo</div>`:''}
    </div>`:''}
    <div style="margin-bottom:14px">
      ${topRows.map((x,i)=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border-tertiary);${x.me?'font-weight:700;background:var(--color-background-secondary);border-radius:6px;padding:8px 6px;margin:2px -6px':''}">
        <div style="display:flex;gap:10px;align-items:center">
          <span style="font-size:13px;color:${i===0?'#c07a10':i<=2?'#4a8a2a':'#bbb'};width:22px">${i+1}º</span>
          <span>${x.flag?`<span title="${x.country||''}" style="cursor:default">${x.flag}</span> `:''} ${x.name}${x.me?' ◀':''}</span>
        </div>
        <span style="font-size:13px;color:var(--color-text-secondary)">${fmt(x.time)}</span>
      </div>`).join('')}
      ${!meInTop?`<div style="font-size:12px;color:#aaa;text-align:center;padding:4px">···</div>
      <div style="display:flex;justify-content:space-between;padding:8px 6px;font-weight:700;background:#f9f9f7;border-radius:6px">
        <div style="display:flex;gap:10px;align-items:center">
          <span style="font-size:13px;color:#888;width:22px">${pos}º</span>
          <span>${esc(G.runner.name||'Tú')} ◀</span>
        </div>
        <span style="font-size:13px;color:#888">${fmt(G.time)}</span>
      </div>`:''}
    </div>
    ${G.injuryType?`<div class="injury-card">
      <div class="injury-type">${INJURY_TYPES[G.injuryType]?.label||'Lesión'}</div>
      <div style="font-size:13px;color:#555;margin-bottom:6px">${INJURY_TYPES[G.injuryType]?.desc||''}</div>
      <div style="font-size:12px;color:#888">Recuperación estimada: ${INJURY_TYPES[G.injuryType]?.recoverySeasons||1} temporada${INJURY_TYPES[G.injuryType]?.recoverySeasons>1?'s':''}</div>
      ${!INJURY_TYPES[G.injuryType]?.canRace?`<div style="font-size:12px;color:#c0392b;margin-top:4px">⚠ Con esta lesión no puedes correr la siguiente carrera</div>`:''}
    </div>`:
    G.injuryStatus==='leve'?`<div class="warn">Molestia leve tras la carrera. Nada grave, pero el cuerpo acusa el esfuerzo.</div>`:''}
    ${statGains.length>0?`<div class="note">
      <div style="font-weight:600;margin-bottom:4px">Stats ganados</div>
      ${statGains.map(({k,v})=>`<div style="font-size:13px">+${v} <strong>${capStat(k)}</strong></div>`).join('')}
    </div>`:''}
    ${prize>0?`<div class="note">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
        <span>+€${prize} ingresados</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="background:#f0ede8;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:700">Global ${pos}º / ${total}</span>
          ${catTotal>1?`<span style="background:#e8eef8;color:#2d4fa0;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:700">${playerCat.label} ${catPos}º / ${catTotal}</span>`:''}
          <span style="font-size:12px;color:#888">Ranking #${G.ranking}</span>
        </div>
      </div>
    </div>`:
    `<div style="margin-top:8px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <span style="background:#f0ede8;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:700">Global ${pos}º / ${total}</span>
        ${catTotal>1?`<span style="background:#e8eef8;color:#2d4fa0;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:700">${playerCat.label} ${catPos}º / ${catTotal}</span>`:''}
      </div>
      <div style="font-size:13px;color:#aaa">Sin premio · Ranking #${G.ranking}</div>
    </div>`}
    ${raceStats()}
    <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:6px">
      <button class="main" onclick="postRaceContinue()" style="margin-top:0">Continuar →</button>
    </div>`;
  G._raceResultHTML=el.innerHTML;
  updateFinBar();
  autoSave();
}
function goNextRace(){
  G.preRaceNutrition='pasta';G.dropbagItems=[];G.dropbagUsed=[];G.dropbagShown=false;G.redZoneStreak=0;G.redZoneMax=0;
  G.dayConditionGenerated=false;G.dayCondition=null;G.raceDayCondition=null;
  G.gelsCarried=0;G.gelsUsed=0;G.warmedUp=false;G.startStrategy=null;
  G._raceInitialized=false;G._warmupApplied=false;G._recoveryUsed=false;
  const isExpres=G.gameMode==='expres';
  const nextScreen=isExpres?'expresPreRacePrep':'preRacePrep';
  const balanceScreen=isExpres?'expresSeasonBalance':'seasonBalance';
  if(G.skipNext){G.skipNext=false;G.currentRaceIdx++;
    if(G.currentRaceIdx>=G.selectedRaces.length){applyTraining();G.screen=balanceScreen;}
    else G.screen=nextScreen;
  }else G.screen=nextScreen;
  render();
}

