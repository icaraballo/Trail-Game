// ══════════════════════════════════════════════════════════════════
//  MODO DESARROLLADOR — solo activo con ?dev=1 en la URL
//  Archivo separado a propósito: nada aquí se carga ni se ejecuta si
//  G._devMode no está activo. No forma parte del juego real.
// ══════════════════════════════════════════════════════════════════

// Lista completa de pantallas del dispatcher de render() (js/render.js), para
// el salto libre. Mantener a mano si se añaden pantallas nuevas al juego —
// no se genera dinámicamente para no acoplar devmode.js al objeto interno
// del dispatcher.
const DEV_ALL_SCREENS=['achievements','aid','betweenManage','betweenRace','calendar','canicrossCalendarSetup','canicrossCreateDog','canicrossDisplasia','canicrossDogDeath','canicrossDogRetirement','canicrossHub','canicrossPostRace','canicrossPreRace','canicrossPreseason','canicrossSeasonBalance','canicrossSegment','canicrossTrainingSetup','circuits','clubCalendar','clubCreate','clubEvent','clubHub','clubIntro','clubMonthly','clubOffer','clubPlantilla','clubRivals','clubSeasonEnd','clubSetup','clubSimulate','clubSponsors','clubStaff','coachCalendar','coachEvent','coachHome','coachHub','coachIntro','coachPostRace','coachPreRace','coachRace','coachSeasonEnd','coachSelect','coachSponsors','coachStyleSelect','coachTraining','coachTrainingReaction','expresCalendar','expresPreRacePrep','expresPrep','expresSeasonBalance','expresSeasonStart','expresSponsors','intro','lifeAthleteOffer','lifeRetirement','midRaceEvent','midSeasonCalendar','modeSelect','overlapHub','preRace','preRacePrep','raceResult','retirement','saveScreen','seasonBalance','seasonStart','segment','sponsors','startStrategy','training','workSetup'];

// ── Saltos directos de modo ──
window.devJumpToCoach=()=>{
  const pick=LIFE_ATHLETE_POOL[Math.floor(Math.random()*LIFE_ATHLETE_POOL.length)];
  G.lifeAthlete={...pick,currentStats:{...pick.baseStats}};
  G.carreraVida=true;G.activeTab='game';
  // El flujo real (confirmLifeCoachTransition) nunca toca G.gameMode — se
  // fuerza aquí para que las pestañas funcionen bien en dev (hallazgo de
  // CR-29 en Bugs-Activos, no relacionado con este fix).
  G.gameMode='coach';
  if(!Array.isArray(G.coachRoster))G.coachRoster=[];
  // Reutiliza el flujo real en vez de montar el estado a mano — así el salto
  // de dev también aplica el bonus de fama a coachReputation (CR-24) y pasa
  // por coachIntro, exactamente igual que le pasaría a un jugador real.
  confirmLifeCoachTransition();
};
window.devJumpToClub=()=>{
  if(!G.clubModeData){
    G.clubModeData=initClubModeData('Club de Pruebas','mixto','montanero');
  }
  G.gameMode='club';
  G.carreraVida=true;G.lifecyclePhase='club';
  G.screen='clubHub';G.activeTab='game';
  showToast('DEV: saltado a Club','#1D9E75');
  render();
};
window.devJumpToCanicross=()=>{
  G.gameMode='canicross';
  if(!G.dog)G.dog=cnInitDog('DevDog','mestizo');
  G.screen='canicrossHub';G.activeTab='game';
  showToast('DEV: saltado a Canicross','#4a8a2a');
  render();
};
window.devJumpToClassic=()=>{
  G.gameMode='medio';
  G.screen='workSetup';G.activeTab='game';
  showToast('DEV: saltado a Clásico','#1a1a1a');
  render();
};
window.devForceAthleteOffer=()=>{
  G.carreraVida=true;
  const rejectedIds=(G.lifePendingAthletes||[]).map(a=>a.id);
  const available=LIFE_ATHLETE_POOL.filter(a=>!rejectedIds.includes(a.id));
  const pick=(available.length?available:LIFE_ATHLETE_POOL)[0];
  G.pendingLifeAthleteOffer={...pick,currentStats:{...pick.baseStats}};
  G.screen='lifeAthleteOffer';
  showToast('DEV: oferta de atleta forzada','#534AB7');
  render();
};

// ── Forzar eventos raros (CR-01, CR-07: demasiado improbables para salir jugando a mano) ──
// Consumido una sola vez — no cambia el balance real del juego, solo garantiza
// que el próximo tramo de bajada a ritmo "a tope" caiga, para poder verificar el fix.
window.devForceDescentFall=()=>{
  G._devForceDescentFall=true;
  showToast('DEV: la próxima bajada a ritmo "A tope" forzará una caída','#c0392b');
  render();
};
// ── Selector en cascada: tipo de carrera → tipo de evento → evento concreto ──
// Cada modo tiene su propio sistema de eventos, con su propia forma de
// inyectarse (no hay un único mecanismo común):
//   - Clásico: solo "fuera de carrera" (MONTHLY_EVENTS_POOL, pantalla de
//     balance de temporada). Los eventos DENTRO de una carrera de Clásico
//     (clima/terreno/lesión/fatiga/social) no están en una lista de datos —
//     se generan con lógica propia repartida en varias funciones — así que
//     no se pueden ofrecer aquí. La caída en bajada (CR-01) sigue siendo su
//     propio botón suelto, más abajo.
//   - Entrenador: dentro (COACH_MID_RACE_EVENTS, un evento fijo por carrera)
//     y fuera (COACH_BETWEEN_EVENTS, tras terminar una carrera).
//   - Club: un solo tipo (CLUB_EVENTS) — no tiene "carrera en curso" con la
//     que distinguir dentro/fuera.
//   - Canicross: solo dentro de carrera (los 4 pools de eventos del perro).
const DEV_EVT_TYPES={
  clasico:[{id:'fuera',label:'Fuera de carrera (balance de temporada)'}],
  entrenador:[{id:'dentro',label:'Dentro de carrera'},{id:'fuera',label:'Fuera de carrera (entre carreras)'}],
  club:[{id:'club',label:'Evento de club'}],
  canicross:[{id:'dentro',label:'Dentro de carrera (próximo tramo)'}],
};
function devEvtPool(mode,type){
  if(mode==='clasico'&&type==='fuera')return MONTHLY_EVENTS_POOL.map(e=>({id:e.id,label:e.title||e.id}));
  if(mode==='entrenador'&&type==='dentro')return COACH_MID_RACE_EVENTS.map(e=>({id:e.id,label:e.title||e.id}));
  if(mode==='entrenador'&&type==='fuera')return COACH_BETWEEN_EVENTS.map(e=>({id:e.id,label:e.title||e.id}));
  if(mode==='club')return CLUB_EVENTS.map(e=>({id:e.id,label:e.title||e.id}));
  if(mode==='canicross')return [...CN_EVENTS_POS,...CN_EVENTS_NEG,...CN_EVENTS_RARE,...CN_EVENTS_SPECIAL].map(e=>({id:e.id,label:(e.text||e.id).replace('[DOG]','perro').replace('[KM]','X').slice(0,45)}));
  return [];
}
window.devBalanceModeChanged=()=>{
  const sel=document.getElementById('dev-balance-mode');
  G._devBalancePreviewMode=sel.value;
  renderDevPanel();
};
window.devEvtModeChanged=()=>{
  const sel=document.getElementById('dev-evt-mode');
  G._devEvtMode=sel.value;
  G._devEvtType=(DEV_EVT_TYPES[G._devEvtMode]||[])[0]?.id||null;
  renderDevPanel();
};
window.devEvtTypeChanged=()=>{
  const sel=document.getElementById('dev-evt-type');
  G._devEvtType=sel.value;
  renderDevPanel();
};
window.devForceEventV2=()=>{
  const sel=document.getElementById('dev-evt-item');
  if(!sel||!sel.value)return;
  const mode=G._devEvtMode,type=G._devEvtType,id=sel.value;
  if(mode==='clasico'&&type==='fuera'){
    const ev=MONTHLY_EVENTS_POOL.find(e=>e.id===id);if(!ev)return;
    if(ev.requiresClub&&(!G.club||G.club.id==='none')){
      G.club=CLUBS.find(c=>c.id!=='none')||CLUBS[0];
      showToast('DEV: unido a "'+G.club.name+'" para que el evento tenga sentido','#4a8a2a');
    }
    G.monthlyEvents=[{...ev,resolved:false}];
    G.screen='seasonBalance';
    showToast('DEV: evento "'+(ev.title||id)+'" forzado','#c07a10');
  } else if(mode==='entrenador'&&type==='dentro'){
    if(!G.coachAthlete){showToast('DEV: no hay atleta de Entrenador — usa "Ir a Entrenador ahora" primero','#c0392b');return;}
    G._devForceCoachMidEvent=id;
    showToast('DEV: la próxima carrera de Entrenador que lances incluirá este evento a mitad de carrera','#534AB7');
  } else if(mode==='entrenador'&&type==='fuera'){
    if(!G.coachAthlete){showToast('DEV: no hay atleta de Entrenador — usa "Ir a Entrenador ahora" primero','#c0392b');return;}
    const ev=COACH_BETWEEN_EVENTS.find(e=>e.id===id);if(!ev)return;
    G.coachPendingEvent=ev;
    G.screen='coachEvent';
    showToast('DEV: evento "'+(ev.title||id)+'" forzado','#534AB7');
  } else if(mode==='club'){
    if(!G.clubModeData){showToast('DEV: no hay club fundado — usa "Ir a Club ahora" primero','#c0392b');return;}
    const ev=CLUB_EVENTS.find(e=>e.id===id);if(!ev)return;
    G.clubModeData.pendingEvent=ev;
    G.screen='clubEvent';
    showToast('DEV: evento "'+(ev.title||id)+'" forzado','#1D9E75');
  } else if(mode==='canicross'){
    if(!G.dog){showToast('DEV: no hay perro — usa "Ir a Canicross ahora" primero','#c0392b');return;}
    G._devForceCnEvent=id;
    showToast('DEV: el próximo tramo de Canicross forzará este evento','#4a8a2a');
  }
  render();
};

// Salto libre a cualquier pantalla del juego — sin garantías: algunas pantallas
// esperan estado previo (p.ej. una carrera en curso) y pueden salir vacías o
// rotas si se salta sin ese contexto. Útil para revisar UI puntual rápido.
window.devJumpToScreen=()=>{
  const sel=document.getElementById('dev-screen-jump');
  if(!sel||!sel.value)return;
  G.screen=sel.value;G.activeTab='game';
  showToast('DEV: saltado a pantalla "'+sel.value+'"','#534AB7');
  render();
};

// Inspector de estado en vivo — vuelca G como JSON dentro del propio drawer.
window.devToggleInspector=()=>{
  G._devInspectorOpen=!G._devInspectorOpen;
  render();
};

// ── Ganar / perder la carrera en curso (Clásico) ──
// Trucos legítimos: calcRaceResult() solo mira G.time vs G.rivals[].time,
// así que forzamos G.time y dejamos que finishRace() haga TODO lo demás
// (stat gains, logros, premio, ranking...) exactamente como en una carrera real.
window.devWinRace=()=>{
  if(!G.rivals||!G.rivals.length){showToast('DEV: no hay carrera en curso','#c0392b');return;}
  G.time=Math.max(1,Math.min(...G.rivals.map(r=>r.time))-60);
  finishRace();
};
window.devLoseRace=()=>{
  if(!G.rivals||!G.rivals.length){showToast('DEV: no hay carrera en curso','#c0392b');return;}
  G.time=Math.max(...G.rivals.map(r=>r.time))+60;
  finishRace();
};
window.devToggleGodMode=()=>{
  G._devGodMode=!G._devGodMode;
  showToast(G._devGodMode?'DEV: modo dios ACTIVADO — ganas toda carrera de Clásico':'DEV: modo dios desactivado','#c0392b');
  render();
};

// Simular N temporadas de Clásico de golpe — sin loop de tramos. initRace()/
// finishRace() no exigen jugar segmento a segmento (mismo principio que
// devWinRace/devLoseRace): se aproxima el tiempo total sumando el `.base` de
// cada tramo de la carrera (ya precomputado en RACES_DB) con variación
// aleatoria, tanto para el jugador como para cada rival (misma fórmula que
// usa doPace() por tramo — rv.mult*base — aplicada de una vez en vez de
// tramo a tramo). Auto-elige calendario si no hay uno ya seleccionado.
window.devSimulateClasicoSeasons=()=>{
  const n=Math.max(1,Number(document.getElementById('dev-sim-seasons-clasico')?.value)||1);
  try{
    for(let i=0;i<n;i++){
      if(!G.selectedRaces||!G.selectedRaces.length){
        const canAccess=r=>r.zegamaSpecial?(G.ranking<=20||G.zegamaQual):(r.reqRanking>=G.ranking||r.reqRanking===999);
        let spent=0;const picks=[];
        for(const r of RACES_DB){
          if(picks.length>=5)break;
          if(!canAccess(r)||spent+r.cost>G.money)continue;
          picks.push(r);spent+=r.cost;
        }
        G.selectedRaces=picks;
        if(!picks.length){showToast('DEV: sin dinero/ranking para ninguna carrera — simulación detenida en temporada '+(i+1),'#c0392b');break;}
      }
      G.currentRaceIdx=0;
      while(G.currentRaceIdx<G.selectedRaces.length){
        const race=G.selectedRaces[G.currentRaceIdx];
        G._raceInitialized=false;
        initRace();
        const totalBase=(race.segs||[]).reduce((a,s)=>a+(s.base||0),0);
        G.time=Math.round(totalBase*(0.90+Math.random()*0.20));
        G.rivals.forEach(rv=>{rv.time=Math.round(totalBase*rv.mult*(0.96+Math.random()*0.08));});
        finishRace();
        G.currentRaceIdx++;
      }
      applyTraining();
      doNextYear(0);
    }
    showToast('DEV: '+n+' temporada(s) de Clásico simuladas','#1a1a1a');
  }catch(e){
    showToast('DEV error simulando Clásico: '+e.message,'#c0392b');
    console.error('[devSimulateClasicoSeasons]',e);
  }
  render();
};

// ── Ganar / perder la carrera en curso (Entrenador) ──
// doCoachRaceFinish() lee G.coachRaceData.finalPos, ya fijado al generar la
// carrera — lo sobreescribimos y dejamos que la función real haga el resto.
window.devWinCoachRace=()=>{
  if(!G.coachRaceData){showToast('DEV: no hay carrera de Entrenador en curso','#c0392b');return;}
  G.coachRaceData.finalPos=1;
  doCoachRaceFinish();
};
window.devLoseCoachRace=()=>{
  if(!G.coachRaceData){showToast('DEV: no hay carrera de Entrenador en curso','#c0392b');return;}
  G.coachRaceData.finalPos=G.coachRaceData.totalParticipants||99;
  doCoachRaceFinish();
};
window.devToggleGodModeCoach=()=>{
  G._devGodModeCoach=!G._devGodModeCoach;
  showToast(G._devGodModeCoach?'DEV: modo dios Entrenador ACTIVADO':'DEV: modo dios Entrenador desactivado','#c0392b');
  render();
};

// Simular N temporadas de Entrenador de golpe — mucho más directo que
// Clásico/Canicross: coachBuildRaceData() calcula el resultado entero
// (finalPos incluido) a partir de las stats del atleta en el momento de
// crear la carrera, sin depender de nada de lo que pase en la animación —
// así que basta con generarlo y llamar a doCoachRaceFinish() directamente,
// sin tocar la pantalla de carrera en absoluto.
window.devSimulateCoachSeasons=()=>{
  const n=Math.max(1,Number(document.getElementById('dev-sim-seasons-coach')?.value)||1);
  if(!G.coachAthlete){showToast('DEV: no hay atleta de Entrenador — usa "Ir a Entrenador ahora" primero','#c0392b');return;}
  try{
    for(let i=0;i<n;i++){
      if(!G.coachSelectedRaces||!G.coachSelectedRaces.length){
        const available=RACES_DB.filter(r=>{
          if(G.coachSeason===1&&r.tier==='elite')return false;
          if(G.coachSeason<=1&&(r.reqRanking||999)<25)return false;
          return true;
        });
        G.coachSelectedRaces=available.slice(0,4);
      }
      G.coachSelectedRaces.forEach(race=>{
        G.coachRaceData=coachBuildRaceData(race,0);
        doCoachRaceFinish();
      });
      doCoachNextSeason();
    }
    showToast('DEV: '+n+' temporada(s) de Entrenador simuladas','#534AB7');
  }catch(e){
    showToast('DEV error simulando Entrenador: '+e.message,'#c0392b');
    console.error('[devSimulateCoachSeasons]',e);
  }
  render();
};

// ── Ganar / perder la carrera en curso (Canicross) ──
// Mismo truco que Clásico: forzamos rs.time por debajo/encima del rival más
// rápido/lento y dejamos que cnFinishRace() real haga el resto.
window.devWinCnRace=()=>{
  const rs=G.cnRaceState;
  if(!rs||!rs.rivals||!rs.rivals.length||rs.done){showToast('DEV: no hay carrera de Canicross en curso','#c0392b');return;}
  rs.timePenalty=0;
  rs.time=Math.max(1,Math.min(...rs.rivals.map(r=>r.estimatedTime))-60);
  cnFinishRace();
};
window.devLoseCnRace=()=>{
  const rs=G.cnRaceState;
  if(!rs||!rs.rivals||!rs.rivals.length||rs.done){showToast('DEV: no hay carrera de Canicross en curso','#c0392b');return;}
  rs.timePenalty=0;
  rs.time=Math.max(...rs.rivals.map(r=>r.estimatedTime))+60;
  cnFinishRace();
};
window.devToggleGodModeCn=()=>{
  G._devGodModeCn=!G._devGodModeCn;
  showToast(G._devGodModeCn?'DEV: modo dios Canicross ACTIVADO':'DEV: modo dios Canicross desactivado','#c0392b');
  render();
};

// Simular N temporadas de Canicross de golpe — reutiliza cnStartRace() para
// construir rivales/estado real de cada carrera (evita reimplementar
// cnGenerateRivals a mano), luego fuerza rs.time aproximado (basePace×km con
// variación, igual que el resto de simuladores) y llama a cnFinishRace()
// directo, sin pasar por tramos ni por la pantalla de carrera.
window.devSimulateCanicrossSeasons=()=>{
  const n=Math.max(1,Number(document.getElementById('dev-sim-seasons-cn')?.value)||1);
  if(!G.dog){showToast('DEV: no hay perro — usa "Ir a Canicross ahora" primero','#c0392b');return;}
  try{
    for(let i=0;i<n;i++){
      if(!G.cnSelectedRaces||!G.cnSelectedRaces.length){
        G.cnSelectedRaces=[...CANICROSS_RACES].sort((a,b)=>a.month-b.month).slice(0,5);
      }
      G.cnSelectedRaces.forEach((race,idx)=>{
        if(!cnCanRace())return; // vínculo insuficiente / perro lesionado — se salta el resto
        cnStartRace(idx);
        const rs=G.cnRaceState;
        if(!rs||rs.raceId!==race.id)return;
        const totalBase=(rs.basePace||390)*(race.km||8);
        rs.time=Math.round(totalBase*(0.90+Math.random()*0.20));
        rs.timePenalty=0;
        cnFinishRace();
      });
      cnDoSeasonTransition();
    }
    showToast('DEV: '+n+' temporada(s) de Canicross simuladas','#4a8a2a');
  }catch(e){
    showToast('DEV error simulando Canicross: '+e.message,'#c0392b');
    console.error('[devSimulateCanicrossSeasons]',e);
  }
  render();
};

// ── Club — no hay "carrera en curso" única, la temporada se resuelve de golpe
// (doClubSimulateSeason()) — solo tiene sentido el modo dios, no ganar/perder
// una carrera suelta.
window.devToggleGodModeClub=()=>{
  G._devGodModeClub=!G._devGodModeClub;
  showToast(G._devGodModeClub?'DEV: modo dios Club ACTIVADO — gana todas las carreras al simular temporada':'DEV: modo dios Club desactivado','#c0392b');
  render();
};

// Simular N temporadas de golpe — solo Club tiene un "resolver toda la
// temporada" ya construido (doClubSimulateSeason()); auto-asigna toda la
// plantilla a cada carrera desbloqueada (mismo filtro repReq/sociosReq que
// usa la función real) para que cada temporada genere datos de verdad, y
// encadena doClubNextSeason() para avanzar. Útil para probar rachas/eventos
// multi-temporada sin montar el calendario a mano cada vez.
window.devSimulateClubSeasons=()=>{
  const n=Math.max(1,Number(document.getElementById('dev-sim-seasons')?.value)||1);
  const d=G.clubModeData;
  if(!d){showToast('DEV: no hay club fundado — usa "Ir a Club ahora" primero','#c0392b');return;}
  try{
    for(let i=0;i<n;i++){
      const clubRep=d.reputacion||0,clubSocios=d.socios||8;
      d.calAssignments={};
      CLUB_RACES.forEach(race=>{
        if((race.repReq||0)>clubRep||(race.sociosReq||0)>clubSocios)return;
        d.calAssignments[race.id]=d.plantilla.map(r=>r.id);
      });
      doClubSimulateSeason();
      doClubNextSeason(0,0,0);
    }
    showToast('DEV: '+n+' temporada(s) de Club simuladas','#1D9E75');
  }catch(e){
    showToast('DEV error simulando Club: '+e.message,'#c0392b');
    console.error('[devSimulateClubSeasons]',e);
  }
  render();
};

// ── Control de tiempo — forzar fin de temporada, un botón por modo ──
// Reutiliza la función real de cada modo (doNextYear/doCoachNextSeason/
// cnDoSeasonTransition/doClubNextSeason) con valores neutros donde hace
// falta un parámetro — igual que el resto de trucos, no reimplementa el
// cierre de temporada, solo lo dispara antes de tiempo. Recibe el modo
// explícito (no lo adivina por G.gameMode) para que cada botón, colocado
// junto a la tarjeta de "carrera en curso" de su modo, haga siempre lo mismo
// sin depender de en qué modo estés jugando ahora mismo.
window.devForceSeasonEnd=(mode)=>{
  if(mode==='coach'){doCoachNextSeason();return;}
  if(mode==='club'){doClubNextSeason(0,0,0);return;}
  if(mode==='canicross'){cnDoSeasonTransition();return;}
  doNextYear(0);
};

// ── Lesión rápida ──
window.devSetInjury=(type)=>{
  if(!type){G.injuryStatus=null;G.injuryType=null;G.injuryRacesLeft=0;showToast('DEV: lesión retirada','#4a8a2a');render();return;}
  const injData=INJURY_TYPES[type];
  if(!injData){showToast('DEV: tipo de lesión desconocido','#c0392b');return;}
  G.injuryStatus='moderada';G.injuryType=type;
  G.injuryRecoverySeasons=injData.recoverySeasons||1;
  G.injuryRacesLeft=injData.racesBlocked||0;
  showToast('DEV: lesión aplicada — '+(injData.label||type),'#c0392b');
  render();
};

// ── Gestión de saves — export/import ligero para repetir la misma prueba
// exacta varias veces sin depender de los 5 slots de guardado reales.
// Reutiliza serializableState()/sanitizeState()/migrateState() (js/save.js),
// el mismo camino que un guardado/carga normal — nada de parsear a mano.
window.devExportState=()=>{
  const ta=document.getElementById('dev-save-io');
  if(!ta)return;
  try{
    ta.value=JSON.stringify(serializableState(),null,2);
    showToast('DEV: estado exportado abajo — cópialo','#1a1a1a');
  }catch(e){
    showToast('DEV error al exportar: '+e.message,'#c0392b');
  }
  render();
};
window.devImportState=()=>{
  const ta=document.getElementById('dev-save-io');
  if(!ta||!ta.value.trim())return;
  try{
    const parsed=JSON.parse(ta.value);
    const clean=sanitizeState(parsed);
    if(!clean){showToast('DEV: JSON inválido — no pasa sanitizeState()','#c0392b');return;}
    G=migrateState(clean);
    showToast('DEV: estado importado','#4a8a2a');
    render();
  }catch(e){
    showToast('DEV error al importar: '+e.message,'#c0392b');
  }
};
window.devSnapshotState=()=>{
  try{
    LS.set('dev_snapshot',JSON.stringify(serializableState()));
    showToast('DEV: snapshot guardado','#1a1a1a');
  }catch(e){showToast('DEV error: '+e.message,'#c0392b');}
};
window.devRestoreSnapshot=()=>{
  const raw=LS.get('dev_snapshot');
  if(!raw){showToast('DEV: no hay snapshot guardado','#c0392b');return;}
  try{
    const clean=sanitizeState(JSON.parse(raw));
    if(!clean){showToast('DEV: snapshot corrupto','#c0392b');return;}
    G=migrateState(clean);
    showToast('DEV: snapshot restaurado','#4a8a2a');
    render();
  }catch(e){showToast('DEV error: '+e.message,'#c0392b');}
};

// ── Logros ──
window.devUnlockAllAchievements=()=>{
  // Solo en memoria — NO toca localStorage['globalAchs'], así que no ensucia
  // el historial de logros real de otras partidas guardadas. Además respalda
  // G.unlockedAchievements antes de forzarlo: serializableState() (save.js)
  // usa ese respaldo mientras dure la sesión dev, así ningún guardado normal
  // (cambiar de pantalla, terminar algo) persiste el desbloqueo de prueba.
  if(!G._devAchievementsDirty){
    G._devAchievementsBackup=[...(G.unlockedAchievements||[])];
    G._devAchievementsDirty=true;
  }
  if(!G.achievementMeta)G.achievementMeta={};
  G.unlockedAchievements=ACHIEVEMENTS.map(a=>a.id);
  ACHIEVEMENTS.forEach(a=>{if(!G.achievementMeta[a.id])G.achievementMeta[a.id]={difficulty:G.gameMode||'medio',year:G.year||1};});
  showToast('DEV: todos los logros desbloqueados (solo esta partida)','#c07a10');
  render();
};

// Toggle individual — a diferencia de "desbloquear todos" (cheat de vista
// previa, no persiste), esto es una edición real: entra/sale de
// G.unlockedAchievements normal, persiste igual que si el jugador lo hubiera
// ganado o nunca lo hubiera tenido. También actualiza localStorage['globalAchs']
// — la pantalla de logros (renderAchievements()) lee de ahí, NO de
// G.unlockedAchievements, así que sin esto el toggle no se vería en pantalla
// aunque el toast confirmara el cambio (bug encontrado 2026-09-02).
// OJO: "bloquear de nuevo" también borra el logro de globalAchs, que es un
// trofeo global compartido entre partidas — si lo habías ganado de verdad en
// otra partida guardada, esto también lo quita de ahí.
window.devToggleAchievement=()=>{
  const sel=document.getElementById('dev-achievement');
  if(!sel||!sel.value)return;
  const id=sel.value;
  if(!Array.isArray(G.unlockedAchievements))G.unlockedAchievements=[];
  let globalAchs={};
  try{globalAchs=JSON.parse(LS.get('globalAchs')||'{}');}catch(e){}
  const idx=G.unlockedAchievements.indexOf(id);
  if(idx>=0){
    G.unlockedAchievements.splice(idx,1);
    delete globalAchs[id];
    LS.set('globalAchs',JSON.stringify(globalAchs));
    showToast('DEV: logro bloqueado de nuevo (también en el trofeo global)','#888');
  }else{
    G.unlockedAchievements.push(id);
    if(!G.achievementMeta)G.achievementMeta={};
    const diff=G.gameMode==='canicross'?'canicross':(G.gameMode||'medio');
    if(!G.achievementMeta[id])G.achievementMeta[id]={difficulty:diff,year:G.year||G.cnSeason||1};
    if(!globalAchs[id])globalAchs[id]={difficulty:diff,year:G.year||G.cnSeason||1};
    LS.set('globalAchs',JSON.stringify(globalAchs));
    showToast('DEV: logro desbloqueado','#c07a10');
  }
  render();
};

// Desbloquear por categoría — edición real (igual que el toggle individual,
// no el cheat de "vista previa"). Solo hay 3 categorías reales en los datos:
// las etiquetadas mode:'cn' (Canicross) y mode:'expres' (Exprés), y el resto
// sin etiqueta ("general" — Clásico normal, Hardcore, jokes, etc.). No hay
// logros propios de Entrenador ni de Club como modo — los "club_*" son sobre
// unirte a un club en Clásico, no sobre fundar un club.
window.devUnlockCategory=()=>{
  const sel=document.getElementById('dev-achievement-category');
  if(!sel)return;
  const cat=sel.value;
  const targets=ACHIEVEMENTS.filter(a=>{
    if(cat==='todos')return true;
    if(cat==='general')return a.mode!=='cn'&&a.mode!=='expres'&&a.mode!=='coach'&&a.mode!=='club';
    return a.mode===cat;
  });
  if(!Array.isArray(G.unlockedAchievements))G.unlockedAchievements=[];
  let globalAchs={};
  try{globalAchs=JSON.parse(LS.get('globalAchs')||'{}');}catch(e){}
  const diff=G.gameMode==='canicross'?'canicross':(G.gameMode||'medio');
  if(!G.achievementMeta)G.achievementMeta={};
  targets.forEach(a=>{
    if(!G.unlockedAchievements.includes(a.id))G.unlockedAchievements.push(a.id);
    if(!G.achievementMeta[a.id])G.achievementMeta[a.id]={difficulty:diff,year:G.year||G.cnSeason||1};
    if(!globalAchs[a.id])globalAchs[a.id]={difficulty:diff,year:G.year||G.cnSeason||1};
  });
  LS.set('globalAchs',JSON.stringify(globalAchs));
  showToast('DEV: '+targets.length+' logro(s) desbloqueados','#c07a10');
  render();
};

// ── Editor de estado ──
window.devApplyStats=()=>{
  const val=id=>{const el=document.getElementById(id);return el&&el.value!==''?Number(el.value):null;};
  const set=(field,v)=>{if(v!=null)G[field]=v;};
  set('year',val('dev-year'));
  set('money',val('dev-money'));
  set('followers',val('dev-followers'));
  set('ranking',val('dev-ranking'));
  set('specRanking',val('dev-specranking'));
  set('coachReputation',val('dev-coachrep'));
  set('coachSeason',val('dev-coachseason'));
  set('coachTrust',val('dev-coachtrust'));
  set('bodyLoad',val('dev-bodyload'));
  set('cnMoney',val('dev-cnmoney'));
  set('cnSeason',val('dev-cnseason'));
  const clubRep=val('dev-clubrep');if(clubRep!=null&&G.clubModeData)G.clubModeData.reputacion=clubRep;
  const clubTemp=val('dev-clubtemporada');if(clubTemp!=null&&G.clubModeData)G.clubModeData.temporada=clubTemp;
  const energy=val('dev-energy');if(energy!=null)G.runner.energy=energy;
  const hydration=val('dev-hydration');if(hydration!=null)G.runner.hydration=hydration;
  const legs=val('dev-legs');if(legs!=null)G.runner.legs=legs;
  ['resistencia','velocidad','subida','bajada','nutricion','mental'].forEach(s=>{
    const v=val('dev-stat-'+s);if(v!=null)G.runner.stats[s]=v;
  });
  if(G.dog){
    const dogSpeed=val('dev-dog-speed');if(dogSpeed!=null)G.dog.speed=dogSpeed;
    const dogStamina=val('dev-dog-stamina');if(dogStamina!=null)G.dog.stamina=dogStamina;
    const dogBond=val('dev-dog-bond');if(dogBond!=null)G.dog.bond=dogBond;
    const dogHealth=val('dev-dog-health');if(dogHealth!=null)G.dog.health=dogHealth;
  }
  const carreraVidaEl=document.getElementById('dev-carreravida');
  if(carreraVidaEl)G.carreraVida=carreraVidaEl.checked;
  const modeEl=document.getElementById('dev-gamemode');
  if(modeEl&&modeEl.value&&modeEl.value!==G.gameMode)G.gameMode=modeEl.value;
  showToast('DEV: valores aplicados','#1a1a1a');
  render();
};

// ── Consola de código libre — poder real, sin límites de lo que yo haya previsto ──
// Usa eval() DIRECTO (no new Function, no window.eval) a propósito: solo el eval
// directo ve el scope léxico compartido entre <script> del documento (todas las
// const/let de constants.js, race.js, etc. — SPONSORS_DB, RACES_DB, INJURY_TYPES...).
// new Function() solo ve variables globales var/function, se queda corto para esto.
window.devRunCode=()=>{
  const ta=document.getElementById('dev-console');
  if(!ta)return;
  const code=ta.value;
  if(!code.trim())return;
  try{
    eval(code);
    showToast('DEV: código ejecutado','#1a1a1a');
    render();
  }catch(e){
    showToast('DEV error: '+e.message,'#c0392b');
    console.error('[devRunCode]',e);
  }
};

// ── Drawer lateral — el panel dev vive ENCIMA de la pantalla de juego, no la
// sustituye. Así se puede provocar algo desde el panel (forzar un evento,
// tocar un stat) y ver el resultado en la misma pantalla sin navegar fuera
// y volver. render() (js/render.js) llama a renderDevOverlay() en cada pasada
// mientras G._devMode esté activo, así que el contenido del drawer se
// mantiene en vivo aunque el cambio de estado no venga de un botón dev
// (p.ej. avanzar un tramo de carrera jugando normal).
window.devToggleDrawer=()=>{
  const dr=document.getElementById('dev-drawer');
  if(!dr)return;
  const opening=!dr.classList.contains('open');
  dr.classList.toggle('open',opening);
  const btn=document.getElementById('dev-btn');
  if(btn)btn.style.background=opening?'#c07a10':'#1a1a1a';
  if(opening)renderDevPanel();
};
window.renderDevOverlay=()=>{
  const dr=document.getElementById('dev-drawer');
  if(dr&&dr.classList.contains('open'))renderDevPanel();
};

function renderDevPanel(){
  const el=document.getElementById('dev-drawer');
  if(!el)return;
  // El drawer se refresca en CADA render() del juego (js/render.js), no solo
  // cuando tú tocas un botón dev — cualquier cosa que dispare un render()
  // mientras el panel está abierto (una animación de carrera en curso, un
  // autoguardado...) regeneraba el innerHTML entero y borraba en silencio lo
  // que estuvieras escribiendo o eligiendo (número de temporadas a simular,
  // evento seleccionado, código a medio escribir en la consola...). Se
  // captura el valor de todos los campos antes de regenerar y se restaura
  // después, para que sobrevivan a refrescos que no vienen de este panel.
  const preserved={};
  el.querySelectorAll('input,select,textarea').forEach(f=>{
    if(f.id)preserved[f.id]=f.type==='checkbox'?f.checked:f.value;
  });
  const r=G.runner||{stats:{}};
  const inRace=!!(G.rivals&&G.rivals.length);
  const inCoachRace=!!G.coachRaceData;
  const inCnRace=!!(G.cnRaceState&&G.cnRaceState.rivals&&G.cnRaceState.rivals.length&&!G.cnRaceState.done);
  el.innerHTML=`
    <button onclick="devToggleDrawer()" style="position:absolute;top:14px;right:14px;border:none;background:none;font-size:20px;color:#bbb;cursor:pointer;line-height:1">✕</button>
    <h2>🛠 Modo Desarrollador</h2>
    <p class="sub" style="margin-bottom:16px">Solo visible con <code>?dev=1</code> en la URL. No pensado para partidas reales.</p>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Saltos directos</div>
      <button class="main" style="margin-top:6px" onclick="devJumpToClassic()">🏃 Ir a Clásico ahora</button>
      <button class="main" style="margin-top:6px" onclick="devJumpToCoach()">📋 Ir a Entrenador ahora</button>
      <div style="font-size:11px;color:#888;margin:2px 0 6px">Pasa por el flujo real de transición (bonus de fama + pantalla "coachIntro"), no es un atajo que se lo salte.</div>
      <button class="main" style="margin-top:6px" onclick="devJumpToClub()">🏕 Ir a Club ahora</button>
      <button class="main" style="margin-top:6px" onclick="devJumpToCanicross()">🐕 Ir a Canicross ahora</button>
      <button class="main" style="margin-top:6px" onclick="devForceAthleteOffer()">🏔 Forzar oferta "hazte entrenador"</button>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Salto libre a cualquier pantalla</div>
      <div style="font-size:11px;color:#888;margin-bottom:6px">Sin garantías — algunas pantallas esperan estado previo (una carrera en curso, un club fundado...) y pueden salir vacías o rotas si faltan esos datos. Útil para revisar UI puntual sin jugar hasta ahí.</div>
      <div style="display:flex;gap:6px">
        <select id="dev-screen-jump" style="flex:1;min-width:0;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
          ${DEV_ALL_SCREENS.map(s=>`<option value="${s}" ${G.screen===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <button class="secondary" style="margin-top:0" onclick="devJumpToScreen()">Ir →</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Carrera en curso (Clásico)${inRace?'':' — no hay ninguna ahora mismo'}</div>
      <button class="main" style="margin-top:6px;border-color:#4a8a2a;color:#2d5a1a" ${inRace?'':'disabled'} onclick="devWinRace()">🏆 Ganar esta carrera ya (1º puesto)</button>
      <button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b" ${inRace?'':'disabled'} onclick="devLoseRace()">🥴 Perder esta carrera ya (último)</button>
      <button class="main" style="margin-top:6px;${G._devGodMode?'background:#c0392b;color:#fff;border-color:#c0392b':''}" onclick="devToggleGodMode()">${G._devGodMode?'😇 Modo dios ACTIVO — pulsa para desactivar':'👑 Activar modo dios (ganas toda carrera de Clásico)'}</button>
      <div style="font-size:11px;color:#888;margin-top:6px">Modo dios: mientras esté activo, cualquier carrera que termines normalmente (jugando los tramos) se resuelve en victoria.</div>
      <button class="secondary" style="margin-top:8px" onclick="devForceSeasonEnd('clasico')">⏭ Forzar fin de temporada (Clásico)</button>
      <div style="font-size:12px;color:#888;margin:10px 0 4px">Simular varias temporadas de golpe (aprox. sin jugar tramos, auto-elige calendario)</div>
      <div style="display:flex;gap:6px">
        <input id="dev-sim-seasons-clasico" type="number" min="1" value="3" style="width:70px;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
        <button class="secondary" style="margin-top:0" onclick="devSimulateClasicoSeasons()">⏩ Simular temporadas</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Carrera en curso (Entrenador)${inCoachRace?'':' — no hay ninguna ahora mismo'}</div>
      <button class="main" style="margin-top:6px;border-color:#4a8a2a;color:#2d5a1a" ${inCoachRace?'':'disabled'} onclick="devWinCoachRace()">🏆 Ganar esta carrera ya (1º puesto)</button>
      <button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b" ${inCoachRace?'':'disabled'} onclick="devLoseCoachRace()">🥴 Perder esta carrera ya</button>
      <button class="main" style="margin-top:6px;${G._devGodModeCoach?'background:#c0392b;color:#fff;border-color:#c0392b':''}" onclick="devToggleGodModeCoach()">${G._devGodModeCoach?'😇 Modo dios ACTIVO — pulsa para desactivar':'👑 Activar modo dios (Entrenador)'}</button>
      <button class="secondary" style="margin-top:8px" onclick="devForceSeasonEnd('coach')">⏭ Forzar fin de temporada (Entrenador)</button>
      <div style="font-size:12px;color:#888;margin:10px 0 4px">Simular varias temporadas de golpe</div>
      <div style="display:flex;gap:6px">
        <input id="dev-sim-seasons-coach" type="number" min="1" value="3" style="width:70px;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
        <button class="secondary" style="margin-top:0" onclick="devSimulateCoachSeasons()">⏩ Simular temporadas</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Carrera en curso (Canicross)${inCnRace?'':' — no hay ninguna ahora mismo'}</div>
      <button class="main" style="margin-top:6px;border-color:#4a8a2a;color:#2d5a1a" ${inCnRace?'':'disabled'} onclick="devWinCnRace()">🏆 Ganar esta carrera ya (1º puesto)</button>
      <button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b" ${inCnRace?'':'disabled'} onclick="devLoseCnRace()">🥴 Perder esta carrera ya</button>
      <button class="main" style="margin-top:6px;${G._devGodModeCn?'background:#c0392b;color:#fff;border-color:#c0392b':''}" onclick="devToggleGodModeCn()">${G._devGodModeCn?'😇 Modo dios ACTIVO — pulsa para desactivar':'👑 Activar modo dios (Canicross)'}</button>
      <button class="secondary" style="margin-top:8px" onclick="devForceSeasonEnd('canicross')">⏭ Forzar fin de temporada (Canicross)</button>
      <div style="font-size:12px;color:#888;margin:10px 0 4px">Simular varias temporadas de golpe</div>
      <div style="display:flex;gap:6px">
        <input id="dev-sim-seasons-cn" type="number" min="1" value="3" style="width:70px;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
        <button class="secondary" style="margin-top:0" onclick="devSimulateCanicrossSeasons()">⏩ Simular temporadas</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Club</div>
      <div style="font-size:11px;color:#888;margin-bottom:6px">Club no tiene "carrera en curso" — la temporada entera se resuelve de golpe con "Simular temporada". El modo dios afecta a esa simulación completa.</div>
      <button class="main" style="margin-top:0;${G._devGodModeClub?'background:#c0392b;color:#fff;border-color:#c0392b':''}" onclick="devToggleGodModeClub()">${G._devGodModeClub?'😇 Modo dios ACTIVO — pulsa para desactivar':'👑 Activar modo dios (Club)'}</button>
      <button class="secondary" style="margin-top:8px" onclick="devForceSeasonEnd('club')">⏭ Forzar fin de temporada (Club)</button>
      <div style="font-size:12px;color:#888;margin:10px 0 4px">Simular varias temporadas de golpe (auto-asigna toda la plantilla a cada carrera desbloqueada)</div>
      <div style="display:flex;gap:6px">
        <input id="dev-sim-seasons" type="number" min="1" value="3" style="width:70px;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
        <button class="secondary" style="margin-top:0" onclick="devSimulateClubSeasons()">⏩ Simular temporadas</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Eventos</div>
      <div style="font-size:11px;color:#888;margin-bottom:6px">Se consumen una sola vez, no cambian el balance real del juego.</div>
      <button class="secondary" style="margin-top:0" onclick="devForceDescentFall()">🪨 Forzar caída en la próxima bajada "a tope" (CR-01)</button>
      <div style="font-size:11px;color:#888;margin-top:4px">Único caso suelto: los eventos dentro de una carrera de Clásico no están en una lista de datos, así que no entran en el selector de abajo.</div>
      ${(()=>{
        if(!G._devEvtMode)G._devEvtMode='clasico';
        const types=DEV_EVT_TYPES[G._devEvtMode]||[];
        if(!G._devEvtType||!types.find(t=>t.id===G._devEvtType))G._devEvtType=types[0]?.id||null;
        const items=devEvtPool(G._devEvtMode,G._devEvtType);
        return `
      <div style="font-size:12px;color:#888;margin:12px 0 4px">1. Tipo de carrera</div>
      <select id="dev-evt-mode" onchange="devEvtModeChanged()" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
        ${[['clasico','Clásico'],['entrenador','Entrenador'],['club','Club'],['canicross','Canicross']].map(([id,label])=>`<option value="${id}" ${G._devEvtMode===id?'selected':''}>${label}</option>`).join('')}
      </select>
      <div style="font-size:12px;color:#888;margin:10px 0 4px">2. Tipo de evento</div>
      <select id="dev-evt-type" onchange="devEvtTypeChanged()" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
        ${types.map(t=>`<option value="${t.id}" ${G._devEvtType===t.id?'selected':''}>${t.label}</option>`).join('')}
      </select>
      <div style="font-size:12px;color:#888;margin:10px 0 4px">3. Evento (${items.length})</div>
      <div style="display:flex;gap:6px">
        <select id="dev-evt-item" style="flex:1;min-width:0;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
          ${items.map(e=>`<option value="${e.id}">${esc(e.label)}</option>`).join('')}
        </select>
        <button class="secondary" style="margin-top:0" onclick="devForceEventV2()">Forzar</button>
      </div>`;
      })()}
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Lesión</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
        <button class="secondary" onclick="devSetInjury('tendinitis')">Tendinitis</button>
        <button class="secondary" onclick="devSetInjury('rotura')">Rotura</button>
        <button class="secondary" onclick="devSetInjury('fractura')">Fractura</button>
        <button class="secondary" onclick="devSetInjury(null)">Quitar lesión</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Editor de estado</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px">Deja un campo vacío para no tocarlo. "Aplicar" no cambia de pantalla.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <label style="font-size:12px">Año (G.year)<input id="dev-year" type="number" placeholder="${G.year}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Dinero<input id="dev-money" type="number" placeholder="${G.money}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Seguidores<input id="dev-followers" type="number" placeholder="${G.followers||0}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Ranking<input id="dev-ranking" type="number" placeholder="${G.ranking}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Ranking especialidad<input id="dev-specranking" type="number" placeholder="${G.specRanking}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Carga corporal<input id="dev-bodyload" type="number" placeholder="${G.bodyLoad||0}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Rep. Entrenador<input id="dev-coachrep" type="number" placeholder="${G.coachReputation||0}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Temporada Coach<input id="dev-coachseason" type="number" placeholder="${G.coachSeason||1}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Confianza Coach<input id="dev-coachtrust" type="number" min="0" max="100" placeholder="${G.coachTrust||60}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Rep. Club${G.clubModeData?'':' (sin club aún)'}<input id="dev-clubrep" type="number" ${G.clubModeData?'':'disabled'} placeholder="${G.clubModeData?G.clubModeData.reputacion:'—'}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Temporada Club${G.clubModeData?'':' (sin club aún)'}<input id="dev-clubtemporada" type="number" ${G.clubModeData?'':'disabled'} placeholder="${G.clubModeData?G.clubModeData.temporada:'—'}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Dinero Canicross<input id="dev-cnmoney" type="number" placeholder="${G.cnMoney||0}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Temporada Canicross<input id="dev-cnseason" type="number" placeholder="${G.cnSeason||1}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
      </div>
      ${G.dog?`
      <div style="font-size:12px;color:#888;margin:10px 0 6px">Perro (${esc(G.dog.name||'')})</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:8px">
        <label style="font-size:11px">Velocidad<input id="dev-dog-speed" type="number" min="0" max="100" placeholder="${G.dog.speed??50}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:11px">Resistencia<input id="dev-dog-stamina" type="number" min="0" max="100" placeholder="${G.dog.stamina??50}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:11px">Vínculo<input id="dev-dog-bond" type="number" min="0" max="100" placeholder="${G.dog.bond??50}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:11px">Salud<input id="dev-dog-health" type="number" min="0" max="100" placeholder="${G.dog.health??100}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
      </div>`:''}
      <div style="font-size:12px;color:#888;margin:10px 0 6px">Reservas del corredor</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">
        <label style="font-size:12px">Energía<input id="dev-energy" type="number" min="0" max="100" placeholder="${r.energy}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Hidratación<input id="dev-hydration" type="number" min="0" max="100" placeholder="${r.hydration}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
        <label style="font-size:12px">Piernas<input id="dev-legs" type="number" min="0" max="100" placeholder="${r.legs}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
      </div>
      <div style="font-size:12px;color:#888;margin:10px 0 6px">Stats del corredor</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">
        ${['resistencia','velocidad','subida','bajada','nutricion','mental'].map(s=>`<label style="font-size:11px">${s}<input id="dev-stat-${s}" type="number" min="0" max="100" placeholder="${r.stats?.[s]??50}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>`).join('')}
      </div>
      <label style="font-size:12px;display:block;margin-bottom:10px">Modo de juego
        <select id="dev-gamemode" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
          <option value="">— no cambiar —</option>
          ${['facil','medio','dificil','hardcore','expres','coach','club','canicross'].map(m=>`<option value="${m}" ${G.gameMode===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </label>
      <label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-bottom:10px"><input id="dev-carreravida" type="checkbox" ${G.carreraVida?'checked':''}> Carrera de Vida activa</label>
      <button class="main" style="margin-top:0" onclick="devApplyStats()">Aplicar cambios</button>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Logros</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px">"Desbloquear todos" es solo vista previa (no persiste). El toggle individual de abajo sí es una edición real — entra/sale del progreso normal del jugador.</div>
      <button class="main" style="margin-top:0" onclick="devUnlockAllAchievements()">Desbloquear todos los logros (vista previa)</button>
      <div style="font-size:12px;color:#888;margin:10px 0 4px">Toggle individual (edición real, persiste)</div>
      <div style="display:flex;gap:6px">
        <select id="dev-achievement" style="flex:1;min-width:0;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
          ${ACHIEVEMENTS.map(a=>`<option value="${a.id}">${(G.unlockedAchievements||[]).includes(a.id)?'✓ ':''}${esc(a.label||a.id)}</option>`).join('')}
        </select>
        <button class="secondary" style="margin-top:0" onclick="devToggleAchievement()">Forzar</button>
      </div>
      <div style="font-size:12px;color:#888;margin:10px 0 4px">Desbloquear por categoría (edición real, persiste)</div>
      <div style="display:flex;gap:6px">
        <select id="dev-achievement-category" style="flex:1;min-width:0;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
          <option value="general">General / Clásico (${ACHIEVEMENTS.filter(a=>a.mode!=='cn'&&a.mode!=='expres'&&a.mode!=='coach'&&a.mode!=='club').length})</option>
          <option value="cn">Canicross (${ACHIEVEMENTS.filter(a=>a.mode==='cn').length})</option>
          <option value="expres">Exprés (${ACHIEVEMENTS.filter(a=>a.mode==='expres').length})</option>
          <option value="coach">Entrenador (${ACHIEVEMENTS.filter(a=>a.mode==='coach').length})</option>
          <option value="club">Club (${ACHIEVEMENTS.filter(a=>a.mode==='club').length})</option>
          <option value="todos">Todos (${ACHIEVEMENTS.length})</option>
        </select>
        <button class="secondary" style="margin-top:0" onclick="devUnlockCategory()">Forzar</button>
      </div>
      <div style="font-size:11px;color:#888;margin-top:6px">Los 7 "club_*" de la categoría General son sobre unirte a un club en Clásico, no sobre fundar el modo Club — por eso siguen contando ahí, separados de la categoría "Club" (CR-38, v76).</div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Gestión de saves</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px">Exporta/importa el estado actual como JSON — útil para repetir la misma prueba exacta varias veces. Pasa por el mismo camino de validación que un guardado real (<code>sanitizeState</code>/<code>migrateState</code>).</div>
      <textarea id="dev-save-io" rows="4" style="width:100%;padding:8px;border:1px solid #e0dfd8;border-radius:6px;font-family:monospace;font-size:11px" placeholder="Exporta aquí, o pega un JSON para importar"></textarea>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button class="secondary" style="margin-top:0" onclick="devExportState()">⬇ Exportar</button>
        <button class="secondary" style="margin-top:0" onclick="devImportState()">⬆ Importar</button>
        <button class="secondary" style="margin-top:0" onclick="devSnapshotState()">📌 Snapshot rápido</button>
        <button class="secondary" style="margin-top:0" onclick="devRestoreSnapshot()">↩ Restaurar snapshot</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Inspector de balance</div>
      <div style="font-size:11px;color:#888;margin-bottom:6px">Multiplicadores efectivos de <code>modeCfg()</code> por modo — para comparar dificultades sin jugar carreras completas. Independiente del modo real de la partida.</div>
      <label style="font-size:12px;display:block;margin-bottom:8px">Modo a inspeccionar
        <select id="dev-balance-mode" onchange="devBalanceModeChanged()" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px">
          ${['facil','medio','dificil','hardcore','expres','coach'].map(m=>`<option value="${m}" ${(G._devBalancePreviewMode||G.gameMode||'medio')===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </label>
      ${(()=>{
        const bm=G._devBalancePreviewMode||G.gameMode||'medio';
        const cfg=modeCfg(['facil','medio','dificil','hardcore','expres','coach'].includes(bm)?bm:'medio');
        const injAt=(load)=>Math.min(95,Math.round((0.08+(load-70)*0.004)*cfg.injuryRiskMult*100));
        const fatAt=(streak)=>((streak>=3?2.2:streak===2?1.6:1.0)*cfg.fatigueMult).toFixed(2);
        return `
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr><td style="padding:3px 0;color:#888">injuryRiskMult</td><td style="text-align:right;font-weight:600">${cfg.injuryRiskMult}</td></tr>
          <tr><td style="padding:3px 0;color:#888">fatigueMult</td><td style="text-align:right;font-weight:600">${cfg.fatigueMult}</td></tr>
          <tr><td style="padding:3px 0;color:#888">rivalMult</td><td style="text-align:right;font-weight:600">${cfg.rivalMult}</td></tr>
          <tr><td style="padding:3px 0;color:#888">sponsorMult</td><td style="text-align:right;font-weight:600">${cfg.sponsorMult}</td></tr>
          <tr><td style="padding:3px 0;color:#888">trainingMult</td><td style="text-align:right;font-weight:600">${cfg.trainingMult}</td></tr>
          <tr><td style="padding:3px 0;color:#888">startMoney</td><td style="text-align:right;font-weight:600">€${cfg.startMoney}</td></tr>
          <tr><td style="padding:3px 0;color:#888">maxYears</td><td style="text-align:right;font-weight:600">${cfg.maxYears}</td></tr>
        </table>
        <div style="font-size:12px;color:#888;margin:10px 0 4px">tierDiffMult (mayor = rivales más lentos)</div>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          ${['local','regional','nacional','elite'].map(t=>`<tr><td style="padding:3px 0;color:#888">${t}</td><td style="text-align:right;font-weight:600">${cfg.tierDiffMult[t]}</td></tr>`).join('')}
        </table>
        <div style="font-size:12px;color:#888;margin:10px 0 4px">Ejemplos derivados</div>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr><td style="padding:3px 0;color:#888">Riesgo lesión/tramo (carga 90)</td><td style="text-align:right;font-weight:600">${injAt(90)}%</td></tr>
          <tr><td style="padding:3px 0;color:#888">Fatiga efectiva (3 tramos a tope)</td><td style="text-align:right;font-weight:600">×${fatAt(3)}</td></tr>
        </table>`;
      })()}
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Inspector de estado</div>
      <button class="secondary" style="margin-top:0" onclick="devToggleInspector()">${G._devInspectorOpen?'▲ Ocultar G como JSON':'▼ Ver G como JSON'}</button>
      ${G._devInspectorOpen?`<pre style="margin-top:8px;max-height:320px;overflow:auto;background:#f5f4f0;border-radius:6px;padding:8px;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-all">${(()=>{try{return esc(JSON.stringify(G,null,2));}catch(e){return 'No se pudo serializar G: '+e.message;}})()}</pre>`:''}
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Consola de código</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px">JS libre: ves <code>G</code> y también todas las constantes del juego (<code>SPONSORS_DB</code>, <code>ACHIEVEMENTS</code>, <code>INJURY_TYPES</code>...) y sus funciones (<code>checkAndUnlockAchievements()</code>, <code>checkFollowerThresholds()</code>...). Se ejecuta y se re-renderiza. Sin red de seguridad — puedes dejar el estado inconsistente si escribes algo raro.</div>
      <textarea id="dev-console" rows="4" style="width:100%;padding:8px;border:1px solid #e0dfd8;border-radius:6px;font-family:monospace;font-size:12px" placeholder="G.money = 99999;"></textarea>
      <button class="main" style="margin-top:8px" onclick="devRunCode()">▶ Ejecutar</button>
    </div>

  `;
  Object.entries(preserved).forEach(([id,val])=>{
    const f=document.getElementById(id);
    if(!f)return; // el campo pudo dejar de existir (p.ej. cambiaste de tipo de carrera en eventos)
    if(f.type==='checkbox')f.checked=val;
    else f.value=val;
  });
}
