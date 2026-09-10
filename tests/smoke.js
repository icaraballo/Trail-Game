// Ejecutar con: npm test
//
// T105 (v89) — segunda pieza, después del linter. No cubre el juego entero: son
// las invariantes de las tareas que más fácil se rompen al refactorizar (T15,
// T22, T25, T45 y las de la auditoría v80 que se fueron sumando). Si una de
// estas falla, algo que ya estaba arreglado se ha vuelto a romper.
// v94: sin partidas guardadas, ya no se prueban migraciones de formatos
// históricos — T25 y T45 se cubren en ejecución (applyTraining, isDNF).

// Banco de pruebas: concatena los .js en UN solo ámbito, igual que el navegador
// (son scripts clásicos, no módulos), con stubs de DOM. El footer expone las
// funciones y un setter de G, porque los `const`/`let` de nivel raíz no se
// cuelgan del objeto global.
// El banco de pruebas (concatenar los 9 .js en un ámbito con stubs de DOM) vive
// en _bundle.js, compartido con content.js.
const {build,scorer,domStub}=require('./_bundle');
const {T,ctx}=build(['freshState','modeCfg','currentWorkPct','setWorkPct','getEffStat',
  'applyTraining','checkSponsorObjective','isDNF','finishedResults','dnfLabel','migrateState',
  'TRAINING_BLOCKS','monthlyWorkIncome','curWorkOpt','endRaceCleanup',
  'resetRaceFlags','resetRaceDayState','drain','bumpStat','raceHistoryFor',
  'runnerCritState','screenRoutes','profBounds','serializableState',
  'deleteSlot','loadFromSlot','saveToSlot','SAVE_VERSION','SAVE_KEY','LS',
  'cnGetCategory','cnCurrentMonth','CN_CATEGORIES','shuffle','CIRCUITS_DB',
  'raceGainTotal','raceDesnivel','fmtGain','clubRaceKm','RACES_DB','CLUB_RACES','SPEC_RACES',
  'screenRoutes','CLUB_STAFF_TYPES','renderExpresCalendar','renderCoachIntro','TRAINING_BLOCKS']);
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

console.log('\n── T15 · raceModifiers garantizado ──');
// v94: las aserciones de T45 y T25 que vivían aquí probaban migraciones de
// formatos históricos, retiradas de migrateState() (fase sin partidas guardadas).
const viejo={runner:{name:'Txiki',age:30,stats:{resistencia:50,velocidad:50,subida:50,bajada:50,nutricion:50,mental:50}},year:2,money:100};
const mig=T.migrateState(viejo);
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

console.log('\n── T74 (v90) · un solo reset de carrera ──');
// Eran cuatro copias de las mismas líneas. Son DOS resets distintos a propósito:
// resetRaceFlags no toca la condición del día ni el material, resetRaceDayState sí.
setG({preRaceNutrition:'x',dropbagShown:true,redZoneStreak:9,_raceInitialized:true,
  _recoveryUsed:true,dayConditionGenerated:true,dayCondition:{id:'x'},gelsCarried:3,warmedUp:true,startStrategy:'x'});
T.resetRaceFlags();
const g74=T.getG();
t('resetRaceFlags limpia nutrición, dropbag y zona roja',
  g74.preRaceNutrition==='pasta'&&g74.dropbagShown===false&&g74.redZoneStreak===0);
t('resetRaceFlags baja las dos banderas de inicialización',
  g74._raceInitialized===false&&g74._recoveryUsed===false);
t('resetRaceFlags NO toca la condición del día ni el material (la divergencia es real)',
  g74.dayConditionGenerated===true&&g74.gelsCarried===3&&g74.warmedUp===true);
T.resetRaceDayState();
t('resetRaceDayState sí limpia condición del día, geles y estrategia',
  T.getG().dayConditionGenerated===false&&T.getG().dayCondition===null&&
  T.getG().gelsCarried===0&&T.getG().warmedUp===false&&T.getG().startStrategy===null);

console.log('\n── T77/T78 (v90) · drain y bumpStat con la semántica de antes ──');
const o78={legs:50,energy:5};
t('drain resta y devuelve el valor', T.drain(o78,'legs',12)===38&&o78.legs===38);
t('drain corta en 0, no en negativo', T.drain(o78,'energy',12)===0);
t('drain con undefined da NaN, como la línea que sustituye', Number.isNaN(T.drain({},'legs',3)));
const p77={stats:{mental:97}};
t('bumpStat respeta el techo de 100', T.bumpStat(p77,'mental',10)===100);
t('bumpStat parte de 50 si el stat no existe', T.bumpStat({stats:{}},'mental',5)===55);

console.log('\n── T62/T63 (v90) · lo que ahora se cachea ──');
t('modeCfg devuelve el mismo objeto en dos llamadas', T.modeCfg('dificil')===T.modeCfg('dificil'));
t('y no mezcla modos', T.modeCfg('facil').startMoney===550&&T.modeCfg('hardcore').startMoney===150);
t('un modo inventado sigue cayendo en la config de medio', T.modeCfg('zzz').startMoney===300);
t('el despachador de rutas se construye una sola vez', T.screenRoutes()===T.screenRoutes());
t('y las 73 rutas apuntan a funciones',
  Object.values(T.screenRoutes()).every(f=>typeof f==='function'), Object.keys(T.screenRoutes()).length+' rutas');

console.log('\n── T80/T73 (v90) · helpers de carrera ──');
setG({careerRaceHistory:{}});
T.raceHistoryFor('pinar').finished++;
T.raceHistoryFor('pinar').abandoned++;
t('raceHistoryFor crea la ficha y deja contar', T.getG().careerRaceHistory.pinar.finished===1&&T.getG().careerRaceHistory.pinar.abandoned===1);
setG({runner:{...T.freshState().runner,energy:5,hydration:8,legs:50}});
t('runnerCritState cuenta los stats bajo 10', T.runnerCritState().critCount===2);
t('y devuelve el mínimo', T.runnerCritState().minStat===5);

console.log('\n── T68 · por qué NO se cambió a structuredClone ──');
// G.coachSeasonObjective guarda un checkAll (coach.js). JSON.stringify lo tira
// en silencio; structuredClone lanza y dejaría el modo Entrenador sin guardar.
setG({coachSeasonObjective:{id:'win_elite',met:false,checkAll:()=>true}});
t('serializableState sigue tragando una función dentro de G',
  !('checkAll' in T.serializableState().coachSeasonObjective));
let clonable=true; try{structuredClone({f:()=>1})}catch(e){clonable=false;}
t('y structuredClone la rechazaría: el cambio de T68 rompería el guardado', clonable===false);

console.log('\n── T123 (v92) · borrar una ranura la borra de verdad ──');
// El bug: G._saveSlot seguía apuntando ahí y el siguiente autoSave la recreaba.
setG({_saveSlot:2});
T.deleteSlot(2);
t('deleteSlot suelta la ranura activa', T.getG()._saveSlot===null);
setG({_saveSlot:1});
T.deleteSlot(2);
t('y no toca la ranura activa si borras otra', T.getG()._saveSlot===1);

console.log('\n── T124 (v92) · SAVE_VERSION se comprueba al cargar ──');
const almacen={};
const LSfake={get:k=>almacen[k]??null,set:(k,v)=>{almacen[k]=v},del:k=>{delete almacen[k]}};
const LSreal=T.LS.get, LSrealSet=T.LS.set, LSrealDel=T.LS.del;
T.LS.get=LSfake.get; T.LS.set=LSfake.set; T.LS.del=LSfake.del;
const estadoMin=()=>{const g=T.freshState();g.runner.name='Txiki';return g;};
almacen[T.SAVE_KEY+'9']=JSON.stringify({v:T.SAVE_VERSION,ts:1,state:estadoMin()});
t('un save del formato actual carga', T.loadFromSlot(9)!==null);
almacen[T.SAVE_KEY+'9']=JSON.stringify({v:'TRAIL_SAVE_V9',ts:1,state:estadoMin()});
t('un save de un formato futuro ya NO entra como si nada', T.loadFromSlot(9)===null);
almacen[T.SAVE_KEY+'9']=JSON.stringify({ts:1,state:estadoMin()});
t('un save antiguo sin campo v sigue cargando (lo migra migrateState)', T.loadFromSlot(9)!==null);

console.log('\n── T140 (v92) · el id del circuito pasa a ASCII ──');
// v94: la migración de saves con el id viejo se retiró; queda fijado el dato.
t('CIRCUITS_DB ya no tiene ids con ñ', T.CIRCUITS_DB.every(c=>/^[\w-]+$/.test(c.id)));
t('y el circuito de montaña existe con el id nuevo', T.CIRCUITS_DB.some(c=>c.id==='circuito_montana'));
T.LS.get=LSreal; T.LS.set=LSrealSet; T.LS.del=LSrealDel;

console.log('\n── T119/T120 (v92) · bordes de canicross ──');
setG({cnWeek:-5});
t('cnCurrentMonth con semana negativa da octubre, no marzo', T.cnCurrentMonth()===10, T.cnCurrentMonth());
setG({cnWeek:0});   t('semana 0 → octubre', T.cnCurrentMonth()===10);
setG({cnWeek:999}); t('una semana enorme sigue dando el último mes', T.cnCurrentMonth()===3);
t('cnGetCategory con edad negativa da la primera categoría', T.cnGetCategory(-4)===T.CN_CATEGORIES[0], JSON.stringify(T.cnGetCategory(-4)));
t('y con edad no numérica también', T.cnGetCategory(undefined)===T.CN_CATEGORIES[0]);

console.log('\n── T117 (v92) · el barajado es uniforme ──');
// sort(()=>Math.random()-0.5) dejaba el primer elemento en su sitio mucho más
// de lo que le toca. Con 6.000 barajados de 5 elementos, cada posición debería
// salir ~1.200 veces; se admite un margen amplio para que no sea escamosa.
const cuenta=[0,0,0,0,0];
for(let i=0;i<6000;i++) cuenta[T.shuffle([0,1,2,3,4]).indexOf(0)]++;
const peor=Math.max(...cuenta.map(c=>Math.abs(c-1200)));
t('el primer elemento acaba repartido por las 5 posiciones', peor<220, 'reparto: '+cuenta.join('/'));

console.log('\n── T52 (v92) · un solo esquema de carrera ──');
// El desnivel se escribía a mano Y se podía sumar de los tramos, y las dos
// cifras no coincidían en 8 de 24 carreras. Ahora la fuente son los tramos.
t('fmtGain reproduce el formato de las cadenas que había',
  T.fmtGain(600)==='600m+'&&T.fmtGain(1200)==='1.200m+'&&T.fmtGain(2800)==='2.800m+',
  [600,1200,2800].map(n=>T.fmtGain(n)).join(' '));
t('fmtGain no se rompe con 0 ni con basura', T.fmtGain(0)==='0m+'&&T.fmtGain(undefined)==='0m+'&&T.fmtGain(-50)==='0m+');
const todasR=[...T.RACES_DB,...Object.values(T.SPEC_RACES||{}).flat()];
t('ninguna carrera declara ya el desnivel a mano', todasR.every(r=>r.desnivel===undefined));
t('raceGainTotal suma solo los tramos de subida',
  todasR.every(r=>T.raceGainTotal(r)===r.segs.reduce((a,x)=>a+Math.max(0,x.gain||0),0)));
t('y lo que se pinta sale de ahí (Zegama: 2.800m+)',
  T.raceDesnivel(T.RACES_DB.find(r=>r.id==='mayo'))==='2.800m+', T.raceDesnivel(T.RACES_DB.find(r=>r.id==='mayo')));
t('pinar ya anuncia sus 600m reales, no los 1.200m+ que decía',
  T.raceDesnivel(T.RACES_DB.find(r=>r.id==='pinar'))==='600m+', T.raceDesnivel(T.RACES_DB.find(r=>r.id==='pinar')));
t('una carrera sin tramos no revienta ni pinta undefined', T.raceDesnivel({id:'x'})==='—'&&T.raceGainTotal(null)===0);
t('un save antiguo con la cadena dentro la sigue pudiendo pintar si no hay tramos',
  T.raceDesnivel({id:'x',desnivel:'1.900m+'})==='1.900m+');

console.log('\n── T52 (v92) · `dist` desaparece, todo es `km` ──');
t('CLUB_RACES usa km y ninguna conserva dist', T.CLUB_RACES.every(r=>typeof r.km==='number'&&r.dist===undefined));
t('clubRaceKm lee un save nuevo', T.clubRaceKm({km:35})===35);
t('y uno viejo, que trae dist', T.clubRaceKm({dist:21})===21);
t('y no pinta undefined con basura', T.clubRaceKm(null)===0&&T.clubRaceKm({})===0);

console.log('\n── v92 · interfaz que se calculaba y no se pintaba ──');
// Esta tanda salió de revisar los 13 avisos de variables muertas del linter.
// Una variable calculada y sin usar es a veces ruido y a veces una pieza de
// interfaz escrita y nunca conectada: aquí se fijan las tres que lo eran.
const pintar=domStub(ctx);

// 🐛 zegamaBadge: la insignia existía, la mecánica existe (G.zegamaQual se gana
// terminando Zegama bajo el corte) y la plantilla nunca la interpolaba.
setG({gameMode:'expres',screen:'expresCalendar',year:2,ranking:50,zegamaQual:true,
  selectedRaces:[],expresRaces:[]});
let html=pintar(()=>T.renderExpresCalendar());
t('con G.zegamaQual, el calendario exprés dice «Clasificado por tiempo»',
  html.includes('Clasificado por tiempo'), html.includes('Zegama')?'(Zegama sí sale)':'(Zegama no sale)');
setG({gameMode:'expres',screen:'expresCalendar',year:2,ranking:5,zegamaQual:false,
  selectedRaces:[],expresRaces:[]});
html=pintar(()=>T.renderExpresCalendar());
t('y con top-20 sin clasificación, dice «Invitación por ranking»', html.includes('Invitación por ranking'));
setG({gameMode:'expres',screen:'expresCalendar',year:2,ranking:500,zegamaQual:false,
  selectedRaces:[],expresRaces:[]});
html=pintar(()=>T.renderExpresCalendar());
t('sin acceso no se anuncia ninguna clasificación',
  !html.includes('Clasificado por tiempo')&&!html.includes('Invitación por ranking'));

// El resumen de legado de coachIntro contaba las carreras y no las enseñaba.
// (Ojo: renderLifeRetirement tiene OTRO resumen distinto que sí las mostraba —
//  el primer intento de este test pintaba ese y pasaba por el motivo equivocado.)
setG({screen:'coachIntro',year:6,ranking:12,
  careerHistory:[{pos:1,prize:100},{pos:4,prize:20},{pos:2,prize:50}],
  lifeAthlete:{name:'Ane Uriarte',age:19,spec:'montanero',stats:{}}});
html=pintar(()=>T.renderCoachIntro());
// La aserción va sobre la celda concreta, no sobre un '3' suelto en la página.
const celda=/Carreras<\/div>\s*<div[^>]*>(\d+)<\/div>/.exec(html);
t('el resumen de legado de coachIntro muestra las carreras corridas',
  !!celda&&celda[1]==='3', celda?('pinta '+celda[1]):'no encuentra la celda «Carreras»');
t('y sigue mostrando victorias, temporadas y premios',
  html.includes('Victorias')&&html.includes('Temporadas')&&html.includes('Premios ganados'));

// El «+30%» de la tarjeta de club estaba escrito a mano al lado del dato.
t('el porcentaje de crecimiento del entrenador sale de CLUB_STAFF_TYPES, no a mano',
  Math.round((T.CLUB_STAFF_TYPES.entrenador.growthBonus-1)*100)===30,
  'growthBonus='+T.CLUB_STAFF_TYPES.entrenador.growthBonus);

t.done('TODO OK');
