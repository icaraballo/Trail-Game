// Ejecutar con: npm test
//
// T105 (v89) — segunda pieza, después del linter. No cubre el juego entero: son
// las invariantes de las tareas que más fácil se rompen al refactorizar (T15,
// T22, T25, T45). Si una de estas falla, algo que ya estaba arreglado se ha
// vuelto a romper.

// Banco de pruebas: concatena los .js en UN solo ámbito, igual que el navegador
// (son scripts clásicos, no módulos), con stubs de DOM. El footer expone las
// funciones y un setter de G, porque los `const`/`let` de nivel raíz no se
// cuelgan del objeto global.
// El banco de pruebas (concatenar los 9 .js en un ámbito con stubs de DOM) vive
// en _bundle.js, compartido con content.js.
const {build,scorer}=require('./_bundle');
const {T}=build(['freshState','modeCfg','currentWorkPct','setWorkPct','getEffStat',
  'applyTraining','checkSponsorObjective','isDNF','finishedResults','dnfLabel','migrateState',
  'TRAINING_BLOCKS','monthlyWorkIncome','curWorkOpt','endRaceCleanup']);
const t=scorer();
const setG=o=>{const g=T.freshState();Object.assign(g,o);T.setG(g);return g;};

console.log('\n── T45 · isDNF / finishedResults ──');
const R=[{pos:3,dnf:false},{pos:null,dnf:true,dnfReason:'abandono'},{pos:null,dnf:true,dnfReason:'lesion'},{pos:1,dnf:false}];
t('un 3.º cuenta como terminada', T.isDNF(R[0])===false);
t('un abandono es DNF', T.isDNF(R[1])===true);
t('una baja por lesión es DNF', T.isDNF(R[2])===true);
t('finishedResults deja 2 de 4', T.finishedResults(R).length===2, T.finishedResults(R).length);
t('forma antigua pos:0 sigue siendo DNF', T.isDNF({pos:0})===true);
t('forma antigua pos:999 sigue siendo DNF', T.isDNF({pos:999,dnf:true})===true);
t('forma antigua pos:null (canicross) es DNF', T.isDNF({pos:null})===true);
t('dnfLabel distingue el motivo', T.dnfLabel(R[1])==='Abandono'&&T.dnfLabel(R[2])==='Baja por lesión');

console.log('\n── T45 · EL BUG: abandonar contaba como top-10 ──');
setG({raceResults:[{pos:null,dnf:true,dnfReason:'abandono',prize:0},{pos:null,dnf:true,dnfReason:'lesion',prize:0}],selectedRaces:[]});
t('2 DNF NO cumplen «top 10»', T.checkSponsorObjective({objKey:'top10'})===false);
t('2 DNF NO cumplen «terminar 2»', T.checkSponsorObjective({objKey:'finish2'})===false);
t('2 DNF NO cumplen «podio»', T.checkSponsorObjective({objKey:'top5x2'})===false);
T.getG().raceResults.push({pos:7,dnf:false,prize:0});
t('un 7.º real SÍ cumple «top 10»', T.checkSponsorObjective({objKey:'top10'})===true);
t('1 terminada + 2 DNF no cumplen «terminar 2»', T.checkSponsorObjective({objKey:'finish2'})===false);
T.getG().raceResults.push({pos:9,dnf:false,prize:0});
t('2 terminadas sí cumplen «terminar 2»', T.checkSponsorObjective({objKey:'finish2'})===true);

console.log('\n── T45 · migración de saves viejos ──');
const viejo={runner:{name:'Txiki',age:30,stats:{resistencia:50,velocidad:50,subida:50,bajada:50,nutricion:50,mental:50}},year:2,money:100,
  raceResults:[{name:'A',pos:4},{name:'B',pos:0},{name:'C',pos:0,injured:true}],
  coachRaceResults:[{raceName:'X',pos:999,dnf:true},{raceName:'Y',pos:2,dnf:false}],
  cnRaceResults:[{raceName:'Z',pos:null,dnf:true}],
  coachRoster:[{coachAthlete:{name:'Ane'},coachRaceResults:[{raceName:'W',pos:999,dnf:true}]}]};
const mig=T.migrateState(viejo);
t('Clásico: el 4.º sobrevive', mig.raceResults[0].pos===4&&mig.raceResults[0].dnf===false);
t('Clásico: pos:0 → abandono', mig.raceResults[1].dnf===true&&mig.raceResults[1].pos===null&&mig.raceResults[1].dnfReason==='abandono');
t('Clásico: pos:0+injured → lesión', mig.raceResults[2].dnfReason==='lesion');
t('Entrenador: 999 → null', mig.coachRaceResults[0].pos===null&&mig.coachRaceResults[0].dnf===true);
t('Entrenador: el 2.º real sobrevive', mig.coachRaceResults[1].pos===2&&mig.coachRaceResults[1].dnf===false);
t('Entrenador: también dentro de coachRoster', mig.coachRoster[0].coachRaceResults[0].pos===null);
t('Canicross: se queda como estaba', mig.cnRaceResults[0].dnf===true&&mig.cnRaceResults[0].pos===null);
t('T25: trainingBlockApplied deducido de la temporada en curso', mig.trainingBlockApplied===true);
t('T15: raceModifiers garantizado a cero', mig.raceModifiers.mental===0&&mig.raceModifiers.velocidad===0);

console.log('\n── T22 · una sola «jornada actual» ──');
setG({currentQuarter:3,workByQuarter:{1:100,2:80,3:60,4:40},workPct:100});
t('lee el trimestre en curso, no G.workPct', T.currentWorkPct()===60, T.currentWorkPct());
T.getG().forcedFullTime=true;
t('la vuelta forzosa por deuda manda sobre todo', T.currentWorkPct()===100);
T.getG().forcedFullTime=false;
T.setWorkPct(20,2);
t('setWorkPct escribe el trimestre pedido', T.getG().workByQuarter[2]===20);
t('y deja G.workPct como espejo del actual', T.getG().workPct===60, T.getG().workPct);
t('curWorkOpt usa la misma fuente', T.curWorkOpt().pct===60, T.curWorkOpt().pct);

console.log('\n── T22 · el sueldo deja de escalar con los patrocinadores ──');
for(const m of ['facil','medio','dificil','hardcore','expres']){
  T.getG().gameMode=m;
  const c=T.modeCfg();
  t(m+': workIncomeMult ('+c.workIncomeMult+') === sponsorMult ('+c.sponsorMult+') — mismo balance',
    c.workIncomeMult===c.sponsorMult&&c.workIncomeMult!==undefined);
}

console.log('\n── T15 · los modificadores no tocan el stat base ──');
setG({});
T.getG().runner.stats.mental=70;
T.getG().raceModifiers={mental:8,velocidad:0,subida:0};
t('getEffStat suma el modificador', T.getEffStat('mental')===78, T.getEffStat('mental'));
t('el stat base no se ha tocado', T.getG().runner.stats.mental===70);
T.getG().runner.stats.mental=98; T.getG().raceModifiers.mental=5;
t('tope de 100 respetado', T.getEffStat('mental')===100, T.getEffStat('mental'));
t('y el base sigue en 98 (antes el clamp se lo comía)', T.getG().runner.stats.mental===98);
T.getG().raceModifiers.mental=-40; T.getG().runner.stats.mental=20;
t('suelo de 10 respetado', T.getEffStat('mental')===10, T.getEffStat('mental'));
T.endRaceCleanup();
t('endRaceCleanup vacía los modificadores', T.getG().raceModifiers.mental===0);
t('y no ha tocado el stat base', T.getG().runner.stats.mental===20);

console.log('\n── T25 · applyTraining es idempotente ──');
setG({trainingBlock:T.TRAINING_BLOCKS[0],trainingBlockApplied:false,selectedRaces:[]});
const antes=JSON.stringify(T.getG().runner.stats);
T.applyTraining();
const trasUna=JSON.stringify(T.getG().runner.stats);
T.applyTraining(); T.applyTraining(); T.applyTraining();
const trasCuatro=JSON.stringify(T.getG().runner.stats);
t('la primera llamada sube stats', antes!==trasUna, antes+' → '+trasUna);
t('las tres siguientes no hacen NADA', trasUna===trasCuatro, trasUna+' vs '+trasCuatro);
t('queda marcado como aplicado', T.getG().trainingBlockApplied===true);
T.applyTraining(true);
t('force:true sí reaplica (modo desarrollador)', JSON.stringify(T.getG().runner.stats)!==trasCuatro);

t.done('TODO OK');
