function assignClubCompanion(club){
  if(!club||club.id==='none'||!club.companions.length) return null;
  return club.companions[Math.floor(Math.random()*club.companions.length)];
}
function freshState(){
  return{
    screen:'saveScreen',year:1,ranking:999,specRanking:999,money:300,
    gameMode:'medio',
    runner:{name:'',specialty:'fondista',energy:100,hydration:100,legs:100,age:25,
      stats:{resistencia:50,velocidad:50,subida:50,bajada:50,nutricion:50,mental:50}},
    workPct:100,trainingHoursPerWeek:5,
    workByQuarter:{1:100,2:100,3:100,4:100},
    currentQuarter:1,
    vacDaysTotal:15,
    vacByQuarter:{1:0,2:0,3:0,4:0},
    selectedRaces:[],sponsors:{zapatillas:null,ropa:null,nutricion:null,tecnologia:null},
    club:CLUBS[0],clubReputation:0,clubCompanion:null,trainingBlock:null,trainingEff:1.0,
    spending:{fisio:false,entrenador:false,suplementos:false},
    currentRaceIdx:0,raceResults:[],careerHistory:[],
    time:0,seg:0,raceEvent:'',
    rivals:[],liveClass:[],weather:'soleado',
    pendingEvent:null,skipNext:false,legsPenalty:false,aidSelected:[],
    activeTab:'game',
    lastRaceGains:[],
    bodyLoad:0,
    injuryStatus:null,injuryType:null,injuryRecoverySeasons:0,
    injuryRacesLeft:0,injuryHistory:[],
    raceFinishedCount:0,raceAbandonedCount:0,
    preRaceNutrition:null,dropbagItems:[],dropbagShown:false,
    careerRaceHistory:{},
    monthlyEvents:[],
    sponsorPenalties:[],
    followers:0,
    fameActionsThisSeason:{},
    fameHoursUsed:0,
    joinedCircuits:[],
    circuitPoints:{},
    circuitCompleted:[],
    openQuarters:{cal:[],mid:[],tab:[]},
    _saveSlot:null,
    runName:'',
    seasonDiary:[],
    midRaceEvent:null,
    midRaceEventTriggered:{},
    stormActive:false,
    stormProtected:false,
    redZoneStreak:0,
    redZoneMax:0,
    postRaceConsequence:null,
    totalCareerKm:0,
    seasonKm:0,
    fairPlayCount:0,
    stormSurvivedCount:0,
    fatBurning:false,
    trainingMomentum:null,
    taperBonus:false,
    personalBests:{},
    raceDayCondition:null,
    trainingEvent:null,
    startStrategy:null,       // 'conservador'|'equilibrado'|'atope'
    nemesis:null,             // {name,flag,wins,lastGap}
    mentalMomentum:0,         // -5 a +5 según racha de resultados
    gelsCarried:0,            // geles en bolsillo al inicio de carrera
    gelsUsed:0,               // geles usados
    warmedUp:false,           // calentamiento hecho esta carrera
    _raceInitialized:false,   // guard para initRace()
    _warmupApplied:false,     // guard para revertir warmup
    // ── Tanda B/C — campos antes lazy-init ──
    unlockedAchievements:[],     // logros desbloqueados (acumulado partida)
    nemesisLog:{},               // {rivalName: {wins, gapSum, gapCount}}
    _xpTimerInterval:null,       // handle del timer de Express mode
    dayConditionGenerated:false, // flag: condición del día ya generada esta carrera
    paceLog:[],                  // registro de pace por segmento
    workChangePenalties:{},      // penalizaciones por cambio de jornada por trimestre
    yearObjective:null,          // objetivo de temporada activo
    _expressSponsorPool:null,    // pool de sponsors generado para esta temporada Express
    // ── Modo Entrenador ──────────────────
    coachPool:null,           // 3 atletas presentados al inicio
    coachAthlete:null,        // atleta seleccionado {id,name,flag,spec,personality,age,bio,baseStats,currentStats,monthlyFee}
    coachReputation:0,        // 0-100 reputación como entrenador
    coachTrainerStyle:null,   // estilo elegido: 'motivador'|'cientifico'|'conservador'|'agresivo'
    coachTrait:null,          // rasgo emergente calculado automáticamente
    _lastRaceResult:null,     // datos de la última carrera para pantalla post-carrera
    coachSeason:1,            // temporada con el atleta actual
    coachTrust:60,            // 0-100 confianza del atleta
    coachEarnings:0,          // ingresos acumulados esta temporada
    coachSelectedRaces:[],    // carreras elegidas para la temporada
    coachRaceIdx:0,           // índice de la próxima carrera
    coachRaceResults:[],      // resultados de carreras esta temporada
    coachAthleteHistory:[],   // historial de atletas entrenados
    coachBodyLoad:0,          // carga corporal del atleta
    coachRaceData:null,       // datos de la carrera en curso (pre-simulada)
    coachRaceAnimIdx:0,       // índice de animación (segmento mostrado)
    coachRaceAidPaused:false, // pausado en avituallamiento
    coachLastTraining:null,   // último bloque propuesto + reacción del atleta
    // ── Coach — relación viva (tandas 1-3) ──
    coachNemesis:null,           // {name, wins} rival recurrente del atleta
    coachPendingEvent:null,      // evento entre carreras pendiente de resolver
    coachLastDialogue:null,      // diálogo post-carrera generado
    coachDayCondition:null,      // condición del día de carrera {text,energyMod,legsMod}
    coachRaceEventPending:null,  // evento a mitad de carrera pendiente
    coachEventLog:[],            // historial de eventos resueltos esta temporada
    coachEmotionalState:'fresco',// estado emocional del atleta (fresco/confiado/dudoso/quemado/recuperado)
    coachDecisionLog:[],         // memoria de decisiones clave [{type,label,positive,season}]
    // ── Coach v24 ──
    coachGels:3,                 // geles asignados pre-carrera
    coachGelsUsed:0,             // geles usados en carrera
    coachRadioUsed:{},           // {segIdx: instrucción usada}
    coachAidExtras:{},           // {aidNum: acción usada en avituallamiento}
    coachPreRaceBlock:null,      // bloque de última hora pre-carrera
    // ── Coach opciones A ──
    coachSeasonObjective:null,
    coachInjury:null,
    coachSponsors:[],
    coachSponsorPool:null,
    coachRadioWindowOpen:false,  // ventana de radio abierta (sobrevive render)
    coachTrainingSelected:null,  // bloque seleccionado pendiente de confirmar
    _coachSlotNotifs:[],         // notificaciones pendientes de este slot
    // ── Multi-atleta ─────────────────────
    coachRoster:[],              // [{...slotState}] — slots guardados
    coachActiveIdx:0,            // índice de slot activo
    // ── Modo Club ────────────────────────
    clubModeData:null,           // objeto completo del club (ver initClubModeData)
    // ── Tienda propia ──
    ownBrand:null,               // null | {launched:year, hasEmployee:bool, employeeYear:null|year}
    // ── Clasificación Zegama ──
    zegamaQual:false,            // true = acceso garantizado a Zegama esta temporada (tiempo del año anterior)
    zegamaQualNext:false,        // true = terminó Zegama bajo el corte este año → pasa a zegamaQual el año siguiente
    // ── Carrera de Vida ──────────────────
    carreraVida:false,           // interruptor maestro del modo Carrera de Vida
    lifecyclePhase:'runner',     // 'runner' → 'overlap' → 'coach' → 'club'
    lifeAthlete:null,            // atleta del arco narrativo {id,name,age,specialty,personality,potential,bio,currentStats}
    lifePendingAthletes:[],      // pool de atletas rechazados (vuelven más adelante)
    lifeAthleteHours:0,          // horas semanales dedicadas al atleta en fase overlap
    rivalRetirements:{},         // {rivalId: {season, childName, childStats}} — rivales retirados
    pendingLifeAthleteOffer:null,// atleta pendiente de aceptar/rechazar en la pantalla de oferta
    lifeAthleteOfferCount:0,     // cuántas veces se ha ofrecido un atleta (para texto urgente año 7)
    rivalChildren:[],            // [{name, flag, spec, parentName, parentWins, baseStats}]
    _clubOfferSeen:false,        // ya se mostró la oferta del club (no repetir)
    _clubOfferDelay:0,           // temporada a partir de la cual vuelve a intentarlo tras rechazo
    // ── Sistema de trabajo ───────────────
    workBonus:0,                 // €/mes extra por ascenso laboral aceptado
    trainingHPenalty:0,          // h/sem de entreno perdidas por ascenso laboral
    workSeasonCount:{pct:100,seasons:0}, // tracking de temporadas consecutivas en la misma jornada
    workPromotionsUsed:[],       // jornadas donde ya se ofreció el ascenso (array de pct)
    // ── Sponsors provisionales ───────────
    _pendingSponsors:{},         // selecciones provisionales antes de confirmar
    // ── Reputación / Horas ───────────────
    trainingBlockHours:8,        // h/sem que consume el bloque elegido
    repInvitations:[],           // invitaciones a carreras por seguidores esta temporada
    _thresholdsSeen:[],          // thresholds cruzados (para no repetir toasts)
    _workTipSeen:false,          // ya se mostró el tip de trabajo año 1 Q1
    // ── Achievement tracking ──────────────────────────────────────
    _nemesisDefeatCount:0,
    _firstSponsorObjMet:false,
    _wonWithTaper:false,
    _sponsorRenewals:0,
    _cleanSponsorSeason:false,
    _clubFisioUsed:false,
    _clubEntrenadorUsed:false,
    _clubLoyaltyStreak:0,
    _clubLoyaltyId:'',
    _clubAscent:false,
    _sponsorNegotiations:0,
    _sponsorBreaks:0,
    _distinctPenaltySponsorIds:[],
    _abandonsByYear:{},
    _lastPlaceCount:0,
    _sabotageCount:0,
    _helpingCount:0,
    _stormLowEnergyFinishes:0,
    _noTrainSeasonDone:false,
    _seasonTrainingDone:false,
    _retireYear:null,
    _rivalLossStreak:0,
    // ── Express tracking ─────────────────────────────────────────
    _xpTimerAnsweredCareer:0,
    _xpTimerExpiredCareer:0,
    _xpAllTimedInARace:false,
    _xpNoAnswerRace:false,
    _xpPerfectTimedRace:false,
    // ── Canicross tracking ────────────────────────────────────────
    _cnInjuryComeback:false,
    _cnBondRecovered:false,
    _cnBondMinReached:false,
    _cnLowBondRaced:0,
    _cnDogDnfCount:0,
    _cnDogHealthyStreak:0,
    _cnDogHealthyPrev:true,
    _cnDogInjury2Consecutive:false,
    _cnPerfectSeasons:0,
    _cnRacedWithoutCommands:false,
    _cnLastPlaceCount:0,
    _cnPreseasonNothing:false,
    _cnIgnoredVetSeason:false,
    _cnVetThisSeason:false,
    // ── Modo Canicross ───────────────────────────
    canicrossMode:false,
    cnSeason:1, cnSelectedRaces:[], cnCurrentRaceIdx:0, cnRaceResults:[],
    cnMoney:500, cnTrainingBlock:null, cnWeek:0,
    cnTrainAdrainSessions:{left:0,hold:0,forward:0},
    cnOwnedEquipment:{dogHarness:['basic_harness'],humanBelt:['basic_belt'],line:['basic_line']},
    equipment:{dogHarness:'basic_harness',humanBelt:'basic_belt',line:'basic_line'},
    cnDogFoodPremium:false, cnDogSupplements:false,
    cnVetHistory:[], cnBirthdayToastShown:{}, cnRaceState:null,
    dog:null,
    // ── Modo Ultratrail ──────────────────────────
    ultratrailMode:false,
    utYear:1,
    utCalendar:[],
    utCurrentRaceIdx:0,
    utResults:[],
    utBodyLoad:0,
    utMoney:800,
    utRanking:999,
    utYear1Bonus:true,
    // Stats nuevos ultratrail
    combustible:100,
    pies:100,
    horasDescanso:0,
    // Mochila
    utMochila:{},
    utMochilaPeso:0,
    // Crew
    utCrew:[],
    utCrewCost:0,
    utCutoffWarnings:0,
    // Backyard Ultra
    backyardHistory:[],
    backyardCurrentLoop:0,
    backyardRivalState:[],
    backyardMochila:{},
    backyardNocturna:false,
    // Intensidad narrativa / selector carrera
    utNarrativeIntensity:'normal',
    utRaceIntensity:'normal',      // 'expres'|'normal'|'inmersivo'
    // Sección nocturna activa
    utNocturnaActive:false,
    utNightEntered:false,          // ya se mostró la pantalla de transición nocturna
    utNightStrategy:null,          // 'conservar'|'mantener'|'gel'
    // Hub de temporada
    utActiveTab:'races',           // 'races'|'training'|'finances'
    utCurrentMonth:1,
    // Entrenamiento
    utTrainingBlock:null,
    utTrainingHours:12,
    utTrainingApplied:false,
    // Economía
    utMonthlyExpenses:150,
    utSponsor:null,
    // Carrera — tracking
    utPaceLog:[],
    utGels:3,
    utGelsUsed:0,
    utKmAtDNF:0,
    _utCrisesThisRace:0,
    _utYearStatsSnapshot:null,
    // Marathon des Sables
    mdsEtapaActual:0,
    mdsRacionesRestantes:0,
    mdsHistorialEtapas:[],
    // Legado
    legadoData:null,
  };
}
let G=freshState();
function monthlyWorkIncome(){
  const pct=G.workByQuarter?G.workByQuarter[G.currentQuarter||1]:G.workPct;
  const base=WORK_OPTIONS.find(o=>o.pct===pct)?.income||0;
  return Math.round((base+(G.workBonus||0))*(modeCfg().sponsorMult||1));
}
function curWorkOpt(){
  const pct=G.workByQuarter?G.workByQuarter[G.currentQuarter||1]:G.workPct;
  return WORK_OPTIONS.find(o=>o.pct===pct)||WORK_OPTIONS[0];
}
function followersSponsorMult(){
  const f=G.followers||0;
  if(f>=100000)return 1.65;
  if(f>=50000) return 1.52;
  if(f>=25000) return 1.42;
  if(f>=15000) return 1.35;
  if(f>=10000) return 1.28;
  if(f>=5000)  return 1.20;
  if(f>=2500)  return 1.15;
  if(f>=1000)  return 1.10;
  return 1.0;
}
function monthlySponsorIncome(){return Math.round(Object.values(G.sponsors).filter(Boolean).reduce((a,s)=>a+(s.salary||0),0)/12*(modeCfg().sponsorMult||1)*(followersSponsorMult()));}
function followersFromRaceResult(pos,tier,dnf){
  if(dnf)return 0;
  const tierMult={local:1,regional:1.6,nacional:2.6,elite:4}[tier]||1;
  let base=0;
  if(pos===1)      base=900;
  else if(pos===2) base=650;
  else if(pos===3) base=500;
  else if(pos<=5)  base=350;
  else if(pos<=10) base=220;
  else if(pos<=20) base=120;
  else             base=60;
  return Math.round(base*tierMult);
}
function applyRepDecay(cause){
  const decays={
    dnf_important:0.15,
    season_inactive:0.10,
    sabotaje:0.25,
    injury_long:0.08,
    no_races:0.20,
    bad_result:0.05,
  };
  const pct=decays[cause]||0;
  const before=G.followers||0;
  G.followers=Math.max(0,Math.round(before*(1-pct)));
  const lost=before-G.followers;
  if(lost>200)setTimeout(()=>showToast('-'+lost+' seguidores 📉','#c07a10'),400);
}
function calcRepInvitations(){
  const f=G.followers||0;
  const invites=[];
  if(f>=5000){
    const regionales=RACES_DB.filter(r=>r.tier==='regional'&&!G.selectedRaces.find(s=>s.id===r.id));
    if(regionales.length)invites.push({...shuffle(regionales)[0],inviteType:'regional'});
  }
  if(f>=10000){
    const nacionales=RACES_DB.filter(r=>r.tier==='nacional'&&!G.selectedRaces.find(s=>s.id===r.id));
    if(nacionales.length)invites.push({...shuffle(nacionales)[0],inviteType:'nacional'});
  }
  if(f>=15000){
    const nacionales2=RACES_DB.filter(r=>r.tier==='nacional'&&!G.selectedRaces.find(s=>s.id===r.id)&&!invites.find(i=>i.id===r.id));
    if(nacionales2.length)invites.push({...shuffle(nacionales2)[0],inviteType:'nacional'});
  }
  if(f>=25000){
    const elites=RACES_DB.filter(r=>r.tier==='elite'&&!G.selectedRaces.find(s=>s.id===r.id));
    if(elites.length)invites.push({...shuffle(elites)[0],inviteType:'elite'});
  }
  if(f>=50000){
    const elites2=RACES_DB.filter(r=>r.tier==='elite'&&!G.selectedRaces.find(s=>s.id===r.id)&&!invites.find(i=>i.id===r.id));
    if(elites2.length)invites.push({...shuffle(elites2)[0],inviteType:'elite'});
  }
  G.repInvitations=invites;
}
function checkFollowerThresholds(){
  const f=G.followers||0;
  if(!G._thresholdsSeen)G._thresholdsSeen=[];
  const invThresholds=[5000,10000,15000,25000,50000];
  invThresholds.forEach(th=>{
    if(f>=th&&!G._thresholdsSeen.includes(th)){
      G._thresholdsSeen.push(th);
      const race=(G.repInvitations||[]).find(i=>['regional','nacional','elite'].includes(i.inviteType));
      if(race)setTimeout(()=>showToast('Tu presencia en redes te abre una puerta: '+race.name+' te invita 📩','#4a8a2a'),1200);
    }
  });
}
function monthlyClubCost(){return G.club?.cost||0;}
function monthlyBrandIncome(){
  if(!G.ownBrand) return 0;
  return G.ownBrand.hasEmployee ? 600 : 300; // con empleado: 1300 bruto - 700 coste = 600 neto
}
function brandHoursPerWeek(){
  // Horas de entrenamiento consumidas por la marca (sin empleado)
  if(!G.ownBrand || G.ownBrand.hasEmployee) return 0;
  return 6;
}
function canLaunchBrand(){
  return !G.ownBrand && (G.ranking<=30 || G.year>=3);
}

// ── REPUTACIÓN DE CLUB ──────────────────
function changeClubRep(delta){
  if(!G.club||G.club.id==='none') return;
  G.clubReputation=Math.max(0,Math.min(100,(G.clubReputation||0)+delta));
}
function clubRepLabel(){
  const r=G.clubReputation||0;
  if(r>=80) return {text:'Leyenda del club 🏆',color:'#c07a10'};
  if(r>=60) return {text:'Referente del club',color:'#4a8a2a'};
  if(r>=40) return {text:'Miembro activo',color:'#4a90d9'};
  if(r>=20) return {text:'Miembro reciente',color:'#888'};
  return {text:'Recién llegado',color:'#aaa'};
}

function monthlyNet(){
  if(G.gameMode==='expres')return monthlySponsorIncome();
  return monthlyWorkIncome()+monthlySponsorIncome()+monthlyBrandIncome()-FIXED_COSTS.total-monthlyClubCost();
}
function sponsorAnnual(){return Math.round(Object.values(G.sponsors).filter(Boolean).reduce((a,s)=>a+(s.salary||0),0)*(modeCfg().sponsorMult||1));}
function curSegs(){return G.selectedRaces[G.currentRaceIdx]?.segs||[];}
function checkSponsorObjective(sp){
  if(!sp)return true;
  const races=G.raceResults||[];
  const finished=races.length;
  const top10=races.filter(r=>r.pos<=10).length;
  const top5=races.filter(r=>r.pos<=5).length;
  const podio=races.filter(r=>r.pos<=3).length;
  const nacionales=races.filter(r=>{
    const rd=G.selectedRaces.find(x=>x.name===r.name);
    return rd&&(rd.tier==='nacional'||rd.tier==='elite');
  });
  switch(sp.objKey){
    case'finish2':      return finished>=2;
    case'finish3':      return finished>=3;
    case'finish4':      return finished>=4;
    case'finishSeason': return finished>=1;
    case'race3':        return G.selectedRaces.length>=3;
    case'race4':        return G.selectedRaces.length>=4;
    case'race5':        return G.selectedRaces.length>=5;
    case'top10':        return top10>=1;
    case'top10x2':      return top10>=2;
    case'top10x3':      return top10>=3;
    case'top10x4':      return top10>=4;
    case'top5x2':       return top5>=2;
    case'top5x3':       return top5>=3;
    case'top5nacional': return nacionales.filter(r=>r.pos<=5).length>=1;
    case'podioNacional':return nacionales.filter(r=>r.pos<=3).length>=1;
    case'podiox2':      return podio>=2;
    default:            return true;
  }
}
function getSpecRaces(){return SPEC_RACES[G.runner.specialty]||[];}
function isInCircuit(raceId){return G.joinedCircuits.some(cid=>CIRCUITS_DB.find(c=>c.id===cid)?.raceIds.includes(raceId));}
function fameLevel(){
  const f=G.followers||0;
  for(let i=FAME_THRESHOLDS.length-1;i>=0;i--){if(f>=FAME_THRESHOLDS[i].followers)return FAME_THRESHOLDS[i];}
  return null;
}
function vacDaysUsed(){return Object.values(G.vacByQuarter||{}).reduce((a,v)=>a+(v?.amount||v||0),0);}
function vacDaysLeft(){return (G.vacDaysTotal||15)-vacDaysUsed();}
function vacTrainingHBonus(q){return (G.vacByQuarter?.[q]||0)*1.5;}
function modeCfg(){
  const m=G.gameMode||'medio';
  return {
    facil:    {injuryRiskMult:0.4, fatigueMult:0.7, rivalMult:1.12, startMoney:550, sponsorMult:1.2, trainingMult:1.0, maxYears:99},
    medio:    {injuryRiskMult:1.0, fatigueMult:1.0, rivalMult:1.00, startMoney:300, sponsorMult:1.0, trainingMult:1.0, maxYears:99},
    dificil:  {injuryRiskMult:1.6, fatigueMult:1.3, rivalMult:0.90, startMoney:180, sponsorMult:0.85,trainingMult:1.0, maxYears:99},
    hardcore: {injuryRiskMult:2.2, fatigueMult:1.6, rivalMult:0.85, startMoney:200, sponsorMult:0.7, trainingMult:1.0, maxYears:99},
    expres:   {injuryRiskMult:0.6, fatigueMult:0.8, rivalMult:0.98, startMoney:500, sponsorMult:1.1, trainingMult:1.5, maxYears:3},
    coach:    {injuryRiskMult:1.0, fatigueMult:1.0, rivalMult:1.00, startMoney:500, sponsorMult:1.0, trainingMult:1.0, maxYears:99},
  }[m]||{injuryRiskMult:1.0,fatigueMult:1.0,rivalMult:1.00,startMoney:300,sponsorMult:1.0,trainingMult:1.0,maxYears:99};
}
function availableFameHours(){
  const wo=curWorkOpt();
  const blockH=G.trainingBlockHours||8;
  const totalH=(wo?.trainingH||5)+vacTrainingHBonus(G.currentQuarter||1);
  const repH=Math.max(0,totalH-blockH);
  return Math.max(0,repH-(G.fameHoursUsed||0));
}
function getExpressSponsors(){
  // Returns 2 sponsor candidates appropriate to current year
  const year=G.year||1;
  const tier=year<=1?1:year<=2?2:2;
  const pool=SPONSORS_DB.filter(s=>s.tier===tier||(year>=2&&s.tier===1));
  // One per category variety
  const cats=['zapatillas','ropa','nutricion','tecnologia'];
  const picked=[];
  const shuffled=shuffle(pool);
  for(const s of shuffled){
    if(!picked.find(p=>p.cat===s.cat))picked.push(s);
    if(picked.length>=2)break;
  }
  // fallback: just first 2
  if(picked.length<2){for(const s of shuffled){if(!picked.includes(s))picked.push(s);if(picked.length>=2)break;}}
  return picked.slice(0,2);
}

function startExpressTimer(defaultChoiceIdx){
  clearExpressTimer();
  G._xpTimerVal=7;
  G._xpTimerDefault=defaultChoiceIdx;
  G._xpTimerInterval=setInterval(()=>{
    G._xpTimerVal=(G._xpTimerVal||7)-1;
    const bar=document.getElementById('xp-timer-bar');
    const num=document.getElementById('xp-timer-num');
    if(bar)bar.style.width=(G._xpTimerVal/7*100)+'%';
    if(num)num.textContent=G._xpTimerVal;
    if(G._xpTimerVal<=0){
      clearExpressTimer();
      const ev=G.midRaceEvent;
      if(ev&&ev.choices[defaultChoiceIdx]){
        resolveMidRaceEvent(ev.id,ev.choices[defaultChoiceIdx].id);
      }
    }
  },1000);
}

function clearExpressTimer(){
  if(G._xpTimerInterval){clearInterval(G._xpTimerInterval);G._xpTimerInterval=null;}
}
function getBodyLoad(){return Math.max(0,Math.min(100,Math.round(G.bodyLoad||0)));}
function hasFisio(){return G.spending.fisio||G.club?.hasFisio;}
function hasClubEntrenador(){return G.spending.entrenador||G.club?.hasEntrenador;}

// Señales pasivas según nivel de carga
function bodyLoadHint(){
  const load=getBodyLoad();
  const fisio=hasFisio();
  if(load>=85)return {type:'danger',msg:'El cuerpo está muy al límite. Cualquier esfuerzo añadido tiene riesgo real de lesión.'};
  if(load>=70&&!fisio)return {type:'warn',msg:'Llevas semanas muy cargado. El cuerpo pide un respiro — sin fisio el riesgo aumenta.'};
  if(load>=70&&fisio)return {type:'warn',msg:'Acumulación de fatiga notable. El fisio ayuda, pero conviene bajar la intensidad.'};
  if(load>=55)return {type:'hint',msg:'Te notas algo cargado últimamente. Nada preocupante, pero el cuerpo lo nota.'};
  if(load>=40)return {type:'hint',msg:'Forma física normal. Llevas buen ritmo de trabajo.'};
  return null;
}

function bodyLoadAfterTraining(blockId){
  const deltas={volumen:18,velocidad:12,tecnico:10,recuperacion:-12,taper:-18,cruzado:4};
  const base=deltas[blockId]||0;
  // Con edad, la recuperación activa es menos efectiva
  const aged=base<0?Math.round(base*(1-agingDeg()*0.5)):base;
  return Math.max(0,Math.min(100,(G.bodyLoad||0)+aged-(hasFisio()?5:0)));
}

function bodyLoadAfterRace(raceKm){
  const add=raceKm>=50?22:raceKm>=35?16:raceKm>=28?12:8;
  const fisioRedux=hasFisio()?6:0;
  const agingExtra=Math.round(agingDeg()*10); // hasta +5 extra pts a los 54
  return Math.max(0,Math.min(100,(G.bodyLoad||0)+add+agingExtra-fisioRedux));
}

// ══════════════════════════════════════
//  CLIMA Y ESTACIONES
// ══════════════════════════════════════
function getSeason(month){
  if([12,1,2].includes(month))return 'invierno';
  if([3,4,5].includes(month))return 'primavera';
  if([6,7,8].includes(month))return 'verano';
  return 'otoño';
}

function getSeasonEffects(month){
  const s=getSeason(month);
  return {
    invierno:{label:'Invierno ❄',trainingMod:-0.08,note:'El frío y la nieve reducen la efectividad del entrenamiento un 8%.'},
    primavera:{label:'Primavera 🌿',trainingMod:0.05,note:'Condiciones ideales. Entrenamiento un 5% más efectivo.'},
    verano:{label:'Verano ☀',trainingMod:0.0,note:'Calor intenso. Hidratación crítica en carreras.'},
    otoño:{label:'Otoño 🍂',trainingMod:-0.03,note:'Días más cortos, algo menos de efectividad.'},
  }[s];
}
function getTrainingEvent(blockId){
  // Solo se activa ~1 de cada 4 trimestres
  if(Math.random()>0.28) return null;
  // Momentum: si llevas 2+ trimestres con el mismo bloque, subir prob de revelation/plateau
  const momentum=G.trainingMomentum;
  let pool=[...TRAINING_EVENTS_POOL];
  if(momentum&&momentum.blockId===blockId&&momentum.count>=2){
    pool=pool.map(e=>({...e,prob:e.id==='revelation'?e.prob*2.2:e.id==='plateau'?e.prob*2.0:e.prob}));
  }
  const total=pool.reduce((a,e)=>a+e.prob,0);
  let r=Math.random()*total;
  for(const ev of pool){if((r-=ev.prob)<=0)return ev;}
  return null;
}
function seasonWeatherMultiplier(month){
  const s=getSeason(month);
  if(s==='verano')return 1.4;
  if(s==='invierno')return 0.8;
  return 1.0;
}
function generateMonthlyEvents(){
  G.monthlyEvents=[];
  const hasClub=G.club&&G.club.id!=='none';
  const hasWork=!!(WORK_OPTIONS.find(o=>o.pct===(G.workByQuarter?G.workByQuarter[G.currentQuarter||1]:G.workPct))?.income);
  const pool=MONTHLY_EVENTS_POOL.filter(e=>(!e.requiresClub||hasClub)&&(!e.requiresWork||hasWork));
  if(Math.random()<0.6)G.monthlyEvents.push({...pool[Math.floor(Math.random()*pool.length)],resolved:false});
  // 2a: Evento de ascenso laboral si lleva 3+ temporadas en la misma jornada
  if(hasWork&&G.gameMode!=='expres'){
    const curPct=G.workByQuarter?G.workByQuarter[1]:G.workPct;
    if(!G.workSeasonCount)G.workSeasonCount={pct:curPct,seasons:0};
    if(G.workSeasonCount.pct===curPct&&G.workSeasonCount.seasons>=3){
      if(!(G.workPromotionsUsed||[]).includes(curPct)){
        G.monthlyEvents.push({
          id:'work_promotion',
          title:'Tu empresa te ofrece un ascenso',
          options:[
            {text:'Aceptar (+€20/mes, -2h/sem de entreno)',effect:'work_promotion_accept',value:0},
            {text:'Rechazar — el entreno es tu prioridad',effect:'nothing',value:0},
          ],
          resolved:false,
          _isPromotion:true,
          _promotionPct:curPct,
        });
      }
    }
  }
}
function getNutritionCost(id){
  const n=PRE_RACE_NUTRITION.find(x=>x.id===id);
  if(!n)return 0;
  // Base cost (pasta) + year-scaling cost (proto pro)
  const base=n.cost||0;
  if(!n.yearCosts)return base;
  const yr=Math.min(G.year, Math.max(...Object.keys(n.yearCosts).map(Number)));
  return base+(n.yearCosts[yr]||n.yearCosts[Object.keys(n.yearCosts)[0]]||0);
}

function isNutritionAvailable(n){
  if(G.year<n.reqYear)return {ok:false,reason:`Disponible desde año ${n.reqYear}`};
  if(n.id==='pro'){
    const req=n.yearReqs?.[G.year];
    if(req==='nutSponsor'&&!G.sponsors.nutricion)
      return {ok:false,reason:'Requiere sponsor de nutrición activo'};
    if(req==='nutSponsorTop10'&&(!G.sponsors.nutricion||G.ranking>10))
      return {ok:false,reason:'Requiere sponsor nutrición + top 10 ranking'};
    if(req==='nutSponsorRanking50'&&(!G.sponsors.nutricion||G.ranking>50))
      return {ok:false,reason:'Requiere sponsor nutrición + ranking < 50'};
  }
  return {ok:true,reason:''};
}
function checkYearObjectiveMet(){
  if(!G.yearObjective)return null;
  const obj=SEASON_OBJECTIVES.find(o=>o.id===G.yearObjective);
  if(!obj)return null;
  let met=false;
  switch(obj.target){
    case'wins':
      const myWins=G.careerHistory.filter(h=>h.year===G.year&&h.pos===1).length;
      met=myWins>=obj.value;
      return {met,label:obj.label,actual:myWins,target:obj.value,reward:obj.reward};
    case'ranking':
      met=G.ranking<=obj.value;
      return {met,label:obj.label,actual:G.ranking,target:obj.value,reward:obj.reward};
    case'money':
      met=G.money>=obj.value;
      return {met,label:obj.label,actual:G.money,target:obj.value,reward:obj.reward};
    default:
      return null;
  }
}

function getRankingHistory(){
  // Generar histórico de ranking basado en careerHistory
  const history=[{race:'Inicio',ranking:G.ranking>500?999:Math.max(1,G.ranking+100)}];
  G.careerHistory.forEach(r=>{
    const pos=r.pos;
    const rankPts=getRankPts(pos);
    const prevRank=history[history.length-1].ranking;
    const newRank=Math.max(1,Math.min(999,prevRank-rankPts));
    history.push({race:r.name.substring(0,12),ranking:newRank});
  });
  return history;
}

function getSavingsProjection(){
  const monthly=monthlyNet();
  const months=12;
  const projection=[];
  let current=G.money;
  projection.push({month:'Hoy',money:current});
  for(let m=1;m<=months;m++){
    current+=monthly;
    projection.push({month:`M${m}`,money:Math.max(0,current)});
  }
  return projection;
}
