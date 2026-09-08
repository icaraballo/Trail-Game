function assignClubCompanion(club){
  if(!club||club.id==='none'||!club.companions?.length) return null; // T41 (v88): club migrado sin companions → TypeError
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
    // T15 (v89): modificadores TEMPORALES de carrera (calentamiento + momentum
    // mental). Antes se sumaban dentro de runner.stats y se restaban al acabar,
    // con un guard (_warmupApplied) que no sobrevivía a una recarga: si algo
    // guardaba con el bonus puesto, se volvía permanente (la clase entera de
    // bug de C2). Ahora getEffStat() los suma al vuelo y endRaceCleanup() los
    // pone a cero. Se persisten a propósito —son estado de la carrera en curso,
    // como G.seg o G.time— pero nunca tocan el stat base.
    raceModifiers:{mental:0,velocidad:0,subida:0},
    trainingBlockApplied:false,  // T25 (v89): el bloque de esta temporada ya se aplicó
    selectedRaces:[],sponsors:{zapatillas:null,ropa:null,nutricion:null,tecnologia:null},
    club:CLUBS[0],clubReputation:0,clubCompanion:null,trainingBlock:null,trainingEff:1.0,
    spending:{fisio:false,entrenador:false,suplementos:false},
    currentRaceIdx:0,raceResults:[],careerHistory:[],
    time:0,seg:0,raceEvent:'',
    rivals:[],weather:'soleado', // T14 (v82): liveClass eliminado — siempre vacío y se serializaba en cada guardado; ahora se calcula al vuelo con computeLiveClass()
    rivalIncidents:[],rivalRadio:null,   // T32
    debt:0,debtSeasons:0,forcedFullTime:false,careerEnded:null,   // T29
    debtInterestTotal:0,   // T29b — total de intereses pagados en la carrera
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
    redZoneZeroHits:{energy:false,hydration:false,legs:false},
    postRaceConsequence:null,
    totalCareerKm:0,
    seasonKm:0,
    fairPlayCount:0,
    stormSurvivedCount:0,
    fatBurning:false,
    trainingMomentum:null,
    taperBonus:false,
    personalBests:{},
    dayCondition:null,        // condición del día generada en initRace()
    trainingEvent:null,
    startStrategy:null,       // 'conservador'|'equilibrado'|'atope'
    nemesis:null,             // {name,flag,wins,lastGap}
    mentalMomentum:0,         // -5 a +5 según racha de resultados
    gelsCarried:0,            // geles en bolsillo al inicio de carrera
    gelsUsed:0,               // geles usados
    warmedUp:false,           // calentamiento hecho esta carrera
    _raceInitialized:false,   // guard para initRace()
    // ── Tanda B/C — campos antes lazy-init ──
    unlockedAchievements:[],     // logros desbloqueados (acumulado partida)
    nemesisLog:{},               // {rivalName: {wins, gapSum, gapCount}}
    _xpTimerInterval:null,       // handle del timer de Express mode
    dayConditionGenerated:false, // flag: condición del día ya generada esta carrera
    paceLog:[],                  // registro de pace por segmento
    workChangePenalties:{},      // penalizaciones por cambio de jornada por trimestre
    yearObjective:null,          // objetivo de temporada activo
    _yearObjectiveRewardPaid:false, // T03 (v81): ya estaba en PERSISTENT_UNDERSCORE_KEYS
                                 // pero sin declarar aquí. Sin valor por defecto tras
                                 // migrateState, un save antiguo lo deja undefined y
                                 // render-clasico.js vuelve a pagar el objetivo del año.
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
    cnOwnedEquipment:{dogHarness:['basic_harness'],humanBelt:['basic_belt'],line:['soft_line']},
    equipment:{dogHarness:'basic_harness',humanBelt:'basic_belt',line:'soft_line'},
    cnDogFoodPremium:false, cnDogSupplements:false,
    cnVetHistory:[], cnBirthdayToastShown:{}, cnRaceState:null,
    dog:null,
  };
}
let G=freshState();
// T22 (v89): «jornada actual» tenía CUATRO fuentes de verdad que divergían en
// cuanto cambiabas de jornada entre trimestres: G.workPct, G.workByQuarter[1],
// G.workByQuarter[currentQuarter] y, desde v86, G.forcedFullTime. Esta es la
// única que debe leerse. El orden importa: la vuelta forzosa por deuda manda
// sobre todo lo demás, o el jugador la esquivaría cambiando de trimestre.
// T45 (v89): «no terminó» se escribía de TRES formas — pos:0 (Clásico),
// pos:null (Canicross) y pos:999 con dnf:true (Entrenador) — y ninguna lectura
// las distinguía. En JavaScript `0 <= 10` y `null <= 10` son ciertos, así que
// `races.filter(r=>r.pos<=10)` contaba los abandonos y las bajas por lesión
// como top-10 para los objetivos de sponsor, y `races.length` los contaba como
// carreras terminadas. Ahora los tres modos usan la forma de Canicross, que ya
// era la correcta y la que usan bien sus 20 logros: `dnf` manda, `pos` es null.
//
// Un DNF no es «acabar último»: es NO ESTAR CLASIFICADO. No cuenta como carrera
// terminada, no da posición y no entra en ningún recuento de resultados.
function isDNF(r){
  if(!r)return true;
  if(r.dnf===true)return true;
  if(r.dnf===false&&r.pos>0)return false;
  // Formas antiguas, por si un resultado se cuela sin pasar por migrateState
  return r.pos==null||r.pos<=0||r.pos>=999;
}
function finishedResults(list){return (list||[]).filter(r=>!isDNF(r));}
function dnfLabel(r){
  const reason=r?.dnfReason;
  if(reason==='lesion')  return 'Baja por lesión';
  if(reason==='abandono')return 'Abandono';
  return 'No clasificado';
}

function currentWorkPct(){
  if(G.forcedFullTime)return 100;
  const q=G.currentQuarter||1;
  const byQ=G.workByQuarter?.[q];
  if(Number.isFinite(byQ))return byQ;
  return Number.isFinite(G.workPct)?G.workPct:100;
}
// Único camino de escritura. Mantiene G.workPct como espejo del trimestre en
// curso, que es lo único para lo que sigue existiendo.
function setWorkPct(pct,quarter){
  const q=quarter||G.currentQuarter||1;
  if(!G.workByQuarter)G.workByQuarter={1:100,2:100,3:100,4:100};
  G.workByQuarter[q]=pct;
  G.workPct=currentWorkPct();
}
function monthlyWorkIncome(){
  const base=WORK_OPTIONS.find(o=>o.pct===currentWorkPct())?.income||0;
  // T22 (v89): esto multiplicaba el sueldo por modeCfg().sponsorMult — el
  // salario de tu turno no depende de tus patrocinadores. Se saca un
  // workIncomeMult propio con los MISMOS valores, así que el balance no cambia:
  // era la escala por dificultad que queremos, metida en el sitio equivocado.
  return Math.round((base+(G.workBonus||0))*(modeCfg().workIncomeMult||1));
}
function curWorkOpt(){
  return WORK_OPTIONS.find(o=>o.pct===currentWorkPct())||WORK_OPTIONS[0];
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
// T71 (v90): eran cinco bloques `if` casi idénticos donde solo cambiaban el
// umbral, el tier y el filtro. Dos de los cinco excluían las carreras ya
// invitadas y tres no — pero eso daba igual, porque un tier no se repite hasta
// su propio escalón (el segundo nacional y el segundo élite eran justo los dos
// que sí lo llevaban). Aplicarlo a los cinco es equivalente y quita el caso
// especial. Verificado comparando la salida contra la versión anterior con
// shuffle determinista, sobre todos los umbrales y varios calendarios.
const REP_INVITE_TIERS=[
  {min:5000,  tier:'regional'},
  {min:10000, tier:'nacional'},
  {min:15000, tier:'nacional'},
  {min:25000, tier:'elite'},
  {min:50000, tier:'elite'},
];
function calcRepInvitations(){
  const f=G.followers||0;
  const invites=[];
  for(const nivel of REP_INVITE_TIERS){
    if(f<nivel.min)continue;
    const libres=RACES_DB.filter(r=>r.tier===nivel.tier
      &&!G.selectedRaces.find(s=>s.id===r.id)
      &&!invites.find(i=>i.id===r.id));
    if(libres.length)invites.push({...shuffle(libres)[0],inviteType:nivel.tier});
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
// T27 (v88): el anual ignoraba followersSponsorMult(), que el mensual sí aplica.
// Con 100.000 seguidores el desfase era del 65 % a favor del mensual.
function sponsorAnnual(){return Math.round(Object.values(G.sponsors).filter(Boolean).reduce((a,s)=>a+(s.salary||0),0)*(modeCfg().sponsorMult||1)*followersSponsorMult());}
function curSegs(){return G.selectedRaces[G.currentRaceIdx]?.segs||[];}
function checkSponsorObjective(sp){
  if(!sp)return true;
  // T45 (v89): esto leía G.raceResults en crudo, así que un abandono (pos:0) o
  // una baja por lesión pasaban el filtro `r.pos<=10` y contaban como top-10, y
  // `races.length` los contaba como carreras terminadas. Solo cuentan las que
  // tienen clasificación.
  const races=finishedResults(G.raceResults);
  const finished=races.length;
  const top10=races.filter(r=>r.pos<=10).length;
  const top5=races.filter(r=>r.pos<=5).length;
  const podio=races.filter(r=>r.pos<=3).length;
  // T104 (v88): se cruzaba por nombre. Dos carreras homónimas, o un rename en los
  // datos, y los objetivos de sponsor dejaban de contar. Los ids existen; se usan.
  // El fallback por nombre cubre los resultados guardados antes de v88.
  const nacionales=races.filter(r=>{
    const rd=(G.selectedRaces||[]).find(x=>r.id!=null?x.id===r.id:x.name===r.name);
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
// T43 (v88): con la forma {amount} esto devolvía NaN. migrateState ya normaliza
// los saves antiguos; esta guarda cubre lo que se cree en caliente.
function vacTrainingHBonus(q){const v=G.vacByQuarter?.[q];const n=(v&&typeof v==='object')?Number(v.amount):Number(v);return (Number.isFinite(n)?n:0)*1.5;}
// tierDiffMult por modo: escala la desviación desde el neutro (medio) del
// spread local↔élite proporcionalmente a la dificultad — mismo criterio que
// injuryRiskMult/fatigueMult/rivalMult, para que elegir una carrera de tier
// alto pese más cuanto más difícil es el modo (CR-33, v73).
const _TDM_BASE={local:0.15, regional:0.08, nacional:0.02, elite:-0.03}; // desviación desde 1.0 en medio
const _TDM_SCALE={facil:0.7, medio:1.0, dificil:1.3, hardcore:1.6, expres:0.85};
function _tierDiffMultFor(mode){
  const scale=_TDM_SCALE[mode]??1.0;
  const out={};
  for(const tier in _TDM_BASE)out[tier]=Math.round((1+_TDM_BASE[tier]*scale)*100)/100;
  return out;
}
// trainingMult (facil/dificil/hardcore) espeja la progresión ya validada de
// T22 (v89): workIncomeMult sale de sponsorMult con los mismos valores — el
// sueldo del trabajo no debe escalar con tus patrocinadores. Mismo balance.
// sponsorMult en esta misma tabla — antes solo Exprés lo usaba (CR-37, v75).
// T62 (v90): se llama al menos siete veces por tramo y cada llamada reconstruía
// los cinco objetos de configuración más cinco _tierDiffMultFor. Todo lo que
// hay dentro son constantes literales y _tierDiffMultFor es pura (solo lee
// _TDM_SCALE/_TDM_BASE), así que el resultado por modo no cambia nunca en toda
// la partida. OJO: ahora el objeto se comparte entre llamadas — nadie debe
// mutar lo que devuelve modeCfg(); si hace falta cambiar el balance se toca
// aquí, en la tabla, como dice la nota de T29b sobre minPay.
const _MODE_CFG_CACHE={};
// T77/T78 (v90): 95 repeticiones de las mismas dos operaciones con clamp
// (26 legs, 31 energy, 5 hydration + expresiones, y 25 subidas de stat).
//
// Toman el objeto explícitamente en vez de asumir G.runner, al revés de lo que
// pedía la ficha: en race.js `r` es el corredor en unos ámbitos y un rival o un
// resultado en otros, y pasarlo hace que la sustitución sea local y no dependa
// de razonar sobre qué hay en `r` en cada sitio. La transformación se verificó
// aplicándole la inversa: reproduce race.js y canicross.js byte a byte.
//
// Hacen EXACTAMENTE lo que hacía la línea que sustituyen. En particular drain
// no mete un `||0` de cortesía: si el campo llega undefined el resultado sigue
// siendo NaN igual que antes, porque tapar eso aquí sería cambiar comportamiento
// y escondería el bug de quien no inicializó el campo.
function drain(o,k,n){o[k]=Math.max(0,o[k]-n);return o[k];}
function bumpStat(o,k,n){o.stats[k]=Math.min(100,(o.stats[k]||50)+n);return o.stats[k];}

function modeCfg(mode){
  const m=mode||G.gameMode||'medio';
  if(_MODE_CFG_CACHE[m])return _MODE_CFG_CACHE[m];
  return _MODE_CFG_CACHE[m]=_buildModeCfg(m);
}
function _buildModeCfg(m){
  return {
    facil:    {injuryRiskMult:0.4, fatigueMult:0.7, rivalMult:1.12, startMoney:550, sponsorMult:1.2, workIncomeMult:1.2, trainingMult:1.2, maxYears:99, tierDiffMult:_tierDiffMultFor('facil'),
               fisio:{floor:0.35, onset:75, decay:0.008, cap:0.85}, bankruptcy:{soft:700, hard:null, interest:0.08, minPay:0.25}},
    medio:    {injuryRiskMult:1.0, fatigueMult:1.0, rivalMult:1.00, startMoney:300, sponsorMult:1.0, workIncomeMult:1.0, trainingMult:1.0, maxYears:99, tierDiffMult:_tierDiffMultFor('medio'),
               fisio:{floor:0.45, onset:65, decay:0.012, cap:0.90}, bankruptcy:{soft:500, hard:null, interest:0.12, minPay:0.25}},
    dificil:  {injuryRiskMult:1.6, fatigueMult:1.3, rivalMult:0.90, startMoney:180, sponsorMult:0.85,workIncomeMult:0.85, trainingMult:0.85, maxYears:99, tierDiffMult:_tierDiffMultFor('dificil'),
               fisio:{floor:0.55, onset:55, decay:0.016, cap:0.95}, bankruptcy:{soft:400, hard:2500,interest:0.18, minPay:0.25}},
    hardcore: {injuryRiskMult:2.2, fatigueMult:1.6, rivalMult:0.85, startMoney:150, sponsorMult:0.7, workIncomeMult:0.7, trainingMult:0.7, maxYears:99, tierDiffMult:_tierDiffMultFor('hardcore'),
               fisio:{floor:0.62, onset:50, decay:0.014, cap:1.00}, bankruptcy:{soft:300, hard:1800,interest:0.25, minPay:0.25}},
    expres:   {injuryRiskMult:0.6, fatigueMult:0.8, rivalMult:0.98, startMoney:500, sponsorMult:1.1, workIncomeMult:1.1, trainingMult:1.5, maxYears:3, tierDiffMult:_tierDiffMultFor('expres'),
               fisio:{floor:0.40, onset:70, decay:0.010, cap:0.88}, bankruptcy:{soft:600, hard:null, interest:0.10, minPay:0.25}},
  }[m]||{injuryRiskMult:1.0,fatigueMult:1.0,rivalMult:1.00,startMoney:300,sponsorMult:1.0,workIncomeMult:1.0,trainingMult:1.0,maxYears:99,tierDiffMult:_tierDiffMultFor('medio'),
         fisio:{floor:0.45,onset:65,decay:0.012,cap:0.90}, bankruptcy:{soft:500,hard:null,interest:0.12,minPay:0.25}};
}
// T29 (v86): única puerta de entrada de dinero involuntario (cierre de
// temporada y penalizaciones vencidas). Las compras voluntarias siguen
// clampadas con Math.max(0,…) en sus propios sitios: no puedes endeudarte
// comprando, solo por no llegar a fin de temporada.
// T29b (v87): applyYearBalance solo reparte entre saldo y deuda. La amortización
// y los intereses se resuelven una sola vez por temporada en settleDebtSeason(),
// porque doNextYear() llama aquí dos veces (balance anual y penalizaciones
// vencidas) y los intereses no pueden cobrarse dos veces.
function applyYearBalance(delta){
  const net=(G.money||0)+delta;
  if(net<0){ G.debt=Math.min(9999999,(G.debt||0)+Math.abs(net)); G.money=0; }
  else G.money=net;
}

// T29b (v87): se llama UNA vez por temporada, al final de doNextYear(), después
// de que applyYearBalance() haya repartido todo lo que entra y sale.
//   · En escalón 2 (forcedFullTime): todo el saldo a la deuda y SIN intereses.
//     Es el trato: pierdes la libertad de elegir jornada, pero deja de crecer.
//   · Fuera del escalón 2: pago mínimo del 25% del saldo, e interés sobre lo
//     que quede pendiente. Lo que no amortices voluntariamente durante la
//     temporada, lo pagas más caro al cerrarla.
function settleDebtSeason(){
  const cfg=modeCfg().bankruptcy||{soft:500,hard:null,interest:0.12,minPay:0.25};
  if((G.debt||0)<=0){ checkDebtEscalation(); return; }

  if(G.forcedFullTime){
    const pay=Math.min(G.debt,G.money||0);
    G.debt-=pay; G.money-=pay;
    if(pay>0&&typeof showToast==='function')
      setTimeout(()=>showToast(`Deuda amortizada: −€${pay}`,'#c07a10'),800);
    checkDebtEscalation();
    return;
  }

  // Pago mínimo obligatorio
  const minPay=Math.min(G.debt,Math.floor((G.money||0)*(cfg.minPay??0.25)));
  if(minPay>0){ G.debt-=minPay; G.money-=minPay; }

  // Interés sobre el pendiente
  let interest=0;
  if(G.debt>0){
    interest=Math.round(G.debt*(cfg.interest??0.12));
    G.debt=Math.min(9999999,G.debt+interest);
    G.debtInterestTotal=(G.debtInterestTotal||0)+interest;
  }

  if((minPay>0||interest>0)&&typeof showToast==='function'){
    setTimeout(()=>showToast(
      `Deuda: −€${minPay} amortizado · +€${interest} de intereses`,
      interest>minPay?'#c0392b':'#c07a10'),800);
  }
  checkDebtEscalation();
}

// T29b: amortización voluntaria. Disponible en Finanzas y entre carreras, para
// que la deuda sea una decisión recurrente y no un descuento automático.
window.doPayDebt=(amount)=>{
  if((G.debt||0)<=0){showToast('No tienes deuda pendiente','#888');return;}
  const want=(amount==='all')?Math.min(G.debt,G.money||0):Math.min(Number(amount)||0,G.debt,G.money||0);
  if(want<=0){showToast('Sin saldo para amortizar','#c0392b');return;}
  G.debt-=want; G.money-=want;
  if(G.debt<=0){
    G.debt=0;
    showToast('✓ Deuda saldada','#4a8a2a');
    checkDebtEscalation();   // libera forcedFullTime si estaba activo
  } else {
    showToast(`−€${want} · quedan €${G.debt}`,'#c07a10');
  }
  autoSave();render();
};

// T29 (v86): tres escalones. Nadie debería perder una partida sin haber
// ignorado antes dos avisos claros.
//   1 · Números rojos  — deuda visible y −3 mental por temporada (estrés).
//   2 · Vuelta forzosa — jornada al 100% y staff cancelado hasta saldar.
//   3 · Retiro forzoso — solo Difícil/Hardcore, y solo si YA estás en el
//       escalón 2: si trabajas a tope y sigues hundiéndote, no hay salida.
function checkDebtEscalation(){
  const cfg=modeCfg().bankruptcy||{soft:500,hard:null};

  if((G.debt||0)>0){
    G.debtSeasons=(G.debtSeasons||0)+1;
    G.runner.stats.mental=Math.max(25,(G.runner.stats.mental||50)-3);
  } else {
    G.debtSeasons=0;
    if(G.forcedFullTime){
      G.forcedFullTime=false;
      if(typeof showToast==='function')showToast('✓ Deuda saldada — vuelves a elegir jornada','#4a8a2a');
    }
    return;
  }

  // Escalón 3 antes que el 2: si ya estabas forzado y has superado el techo,
  // se acabó, y no tiene sentido volver a lanzar la pantalla del escalón 2.
  if(cfg.hard!=null && G.forcedFullTime && G.debt>=cfg.hard){
    G.careerEnded='bankruptcy';
    G.screen='careerEnd';
    return;
  }

  if(G.debt>=cfg.soft && !G.forcedFullTime){
    G.forcedFullTime=true;
    // T22 (v89): currentWorkPct() ya devuelve 100 con forcedFullTime; estas dos
    // líneas son redundantes a propósito, para que G.workByQuarter no mienta si
    // alguien lo inspecciona directamente.
    G.workPct=100;
    G.workByQuarter={1:100,2:100,3:100,4:100};
    // Si no puedes pagar al fisio, el fisio se va. Sin esto la deuda no tiene
    // suelo: seguirías pagando €550/mes de staff mientras te hundes.
    G.spending={fisio:false,entrenador:false,suplementos:false};
    // doNextYear() sigue ejecutándose tras esta llamada y fija G.screen='workSetup'
    // al final, así que además de la pantalla se deja una marca transitoria que
    // ese cierre de temporada consume. No va en PERSISTENT_UNDERSCORE_KEYS.
    G.screen='debtCrisis';
    G._debtCrisisPending=true;
  }
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
      G._xpTimerExpiredCareer=(G._xpTimerExpiredCareer||0)+1; // tracking logros Exprés
      // T34 (v88): si defaultChoiceIdx no existía no se resolvía nada y el
      // jugador se quedaba encallado en la pantalla del evento sin contador.
      // Ahora cae a la primera opción válida y, si no hay ninguna, cierra el
      // evento y devuelve al tramo en vez de dejar la partida muerta.
      const ev=G.midRaceEvent;
      if(!ev){return;}
      const choices=Array.isArray(ev.choices)?ev.choices:[];
      const pick=choices[defaultChoiceIdx]||choices[0];
      if(pick&&pick.id!=null){
        resolveMidRaceEvent(ev.id,pick.id);
      } else {
        console.warn('startExpressTimer: evento sin opciones válidas →',ev.id);
        G.midRaceEvent=null;G.screen='segment';render();
      }
    }
  },1000);
}

function clearExpressTimer(){
  if(G._xpTimerInterval){clearInterval(G._xpTimerInterval);G._xpTimerInterval=null;}
}
function getBodyLoad(){return Math.max(0,Math.min(100,Math.round(G.bodyLoad||0)));}
function hasFisio(){return G.spending.fisio||G.club?.hasFisio;}
// T18 (v83): el fisio ya no da inmunidad. Protege bien con el cuerpo fresco y
// pierde efecto conforme sube la carga corporal, hasta dejar de cubrirte en los
// modos duros. Los cuatro puntos de riesgo de lesión de race.js usan esta única
// función: antes había tres tratamientos distintos (×0,35, ×0,45 e inmunidad).
// Enlaza con las sesiones puntuales de «Entre carreras»: bajar carga recupera
// cobertura sin tocar el contrato.
function fisioInjuryMult(load){
  if(!hasFisio())return 1;
  const f=modeCfg().fisio||{floor:0.45,onset:65,decay:0.012,cap:0.90};
  const L=Number.isFinite(load)?load:getBodyLoad();
  return Math.min(f.cap, f.floor + Math.max(0, L - f.onset) * f.decay);
}
function hasClubEntrenador(){return G.spending.entrenador||G.club?.hasEntrenador;}

// Umbrales de carga corporal dinámicos por dificultad (más lesión-riesgo = umbrales más bajos)
function getLoadThresholdsByMode(){
  const mult=modeCfg().injuryRiskMult;
  if(mult<=0.4)return {warningLevel1:70,warningLevel2:85,criticalLevel:95};   // Fácil
  if(mult<=0.6)return {warningLevel1:65,warningLevel2:80,criticalLevel:90};   // Exprés
  if(mult<=1.0)return {warningLevel1:55,warningLevel2:70,criticalLevel:85};   // Medio/Coach
  if(mult<=1.6)return {warningLevel1:45,warningLevel2:60,criticalLevel:75};   // Difícil
  return {warningLevel1:35,warningLevel2:50,criticalLevel:65};                // Hardcore
}

// Color de aviso según carga actual + dificultad
function getLoadWarningColor(load){
  const t=getLoadThresholdsByMode();
  if(load<t.warningLevel1)return null;
  const mode=G.gameMode||'medio';
  const palette={
    facil:    {n1:'#f0a000', n2:'#c07a10'},
    expres:   {n1:'#f0a000', n2:'#c07a10'},
    medio:    {n1:'#c07a10', n2:'#c0392b'},
    coach:    {n1:'#c07a10', n2:'#c0392b'},
    dificil:  {n1:'#d97a00', n2:'#a82525'},
    hardcore: {n1:'#c0392b', n2:'#8b1a1a'},
  };
  const p=palette[mode]||palette.medio;
  return load>=t.warningLevel2?p.n2:p.n1;
}

// Mensaje de aviso escalado por dificultad — {msg, color}
function getLoadWarningMsg(load){
  const t=getLoadThresholdsByMode();
  if(load<t.warningLevel1)return {msg:'',color:null};
  const mode=G.gameMode||'medio';
  const color=getLoadWarningColor(load);
  const messages={
    facil:    {n1:'El cuerpo nota el esfuerzo. Considera bajar intensidad.', n2:'Cuerpo cargado — conviene un respiro pronto.', crit:'⚠ Cuerpo al límite — riesgo real de lesión.'},
    expres:   {n1:'El cuerpo nota el esfuerzo. Considera bajar intensidad.', n2:'Cuerpo cargado — conviene un respiro pronto.', crit:'⚠ Cuerpo al límite — riesgo real de lesión.'},
    medio:    {n1:'Acumulación de fatiga. Sin descanso, aumenta el riesgo de lesión.', n2:'⚠ Cuerpo muy cargado — riesgo de lesión notable.', crit:'⚠ Cuerpo al límite — riesgo alto de lesión.'},
    coach:    {n1:'Acumulación de fatiga. Sin descanso, aumenta el riesgo de lesión.', n2:'⚠ Cuerpo muy cargado — riesgo de lesión notable.', crit:'⚠ Cuerpo al límite — riesgo alto de lesión.'},
    dificil:  {n1:'⚠ Cuerpo cargado — el riesgo de lesión empieza a subir.', n2:'⚠ Cuerpo muy cargado — riesgo de lesión aumentado. Ten cuidado.', crit:'🚨 Cuerpo al límite — riesgo crítico de lesión.'},
    hardcore: {n1:'⚠ CUERPO CARGADO — vigila cada tramo.', n2:'🚨 CUERPO MUY CARGADO — riesgo de lesión alto.', crit:'🚨 CUERPO AL LÍMITE — riesgo crítico de lesión. Abandona si es posible.'},
  };
  const m=messages[mode]||messages.medio;
  const msg=load>=t.criticalLevel?m.crit:(load>=t.warningLevel2?m.n2:m.n1);
  return {msg,color};
}

// Señales pasivas según nivel de carga
function bodyLoadHint(){
  const load=getBodyLoad();
  const fisio=hasFisio();
  const t=getLoadThresholdsByMode();
  if(load>=t.criticalLevel)return {type:'danger',msg:'El cuerpo está muy al límite. Cualquier esfuerzo añadido tiene riesgo real de lesión.'};
  if(load>=t.warningLevel2&&!fisio)return {type:'warn',msg:'Llevas semanas muy cargado. El cuerpo pide un respiro — sin fisio el riesgo aumenta.'};
  if(load>=t.warningLevel2&&fisio)return {type:'warn',msg:'Acumulación de fatiga notable. El fisio ayuda, pero conviene bajar la intensidad.'};
  if(load>=t.warningLevel1)return {type:'hint',msg:'Te notas algo cargado últimamente. Nada preocupante, pero el cuerpo lo nota.'};
  if(load>=t.warningLevel1-15)return {type:'hint',msg:'Forma física normal. Llevas buen ritmo de trabajo.'};
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
  // T26 (v88): esto hacía G.monthlyEvents=[] y se llevaba por delante los eventos
  // que el jugador no había atendido — incluidos los económicos, que son los que
  // más pesan. Ahora los pendientes sobreviven y los nuevos se añaden detrás.
  // El de ascenso laboral no se duplica: se comprueba antes de volver a crearlo.
  const pending=(G.monthlyEvents||[]).filter(e=>e&&!e.resolved);
  G.monthlyEvents=pending;
  const hasClub=G.club&&G.club.id!=='none';
  const hasWork=!!(WORK_OPTIONS.find(o=>o.pct===currentWorkPct())?.income); // T22 (v89)
  const pool=MONTHLY_EVENTS_POOL.filter(e=>(!e.requiresClub||hasClub)&&(!e.requiresWork||hasWork));
  if(Math.random()<0.6)G.monthlyEvents.push({...pool[Math.floor(Math.random()*pool.length)],resolved:false});
  // 2a: Evento de ascenso laboral si lleva 3+ temporadas en la misma jornada
  if(hasWork&&G.gameMode!=='expres'){
    const curPct=currentWorkPct(); // T22 (v89): era workByQuarter[1], no el trimestre en curso
    if(!G.workSeasonCount)G.workSeasonCount={pct:curPct,seasons:0};
    if(G.workSeasonCount.pct===curPct&&G.workSeasonCount.seasons>=3){
      if(!(G.workPromotionsUsed||[]).includes(curPct)&&!pending.some(e=>e._isPromotion)){ // T26 (v88): sin duplicar el pendiente
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
    // T28 (v88): yearReqs solo define 4, 5 y 6 — del año 7 en adelante devolvía
    // undefined y la nutrición más potente quedaba libre. Se mantiene el último
    // año definido, igual que ya hacía nutritionCost() con yearCosts.
    const _reqYears=Object.keys(n.yearReqs||{}).map(Number);
    const req=_reqYears.length?n.yearReqs[Math.min(G.year,Math.max(..._reqYears))]:undefined;
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
