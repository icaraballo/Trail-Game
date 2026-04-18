// ══════════════════════════════════════════════════════════════════
//  MODO CANICROSS
// ══════════════════════════════════════════════════════════════════

const CN_BREED_MODS={
  husky:   {speed:-5,  stamina:15, bondDecayPerWeek:0, label:'Husky Siberiano', desc:'Resistencia larga distancia. Débil en calor.'},
  vizsla:  {speed:15,  stamina:-10,bondDecayPerWeek:0, label:'Vizsla',          desc:'Velocidad en tramos cortos. Se agota rápido.'},
  malinois:{speed:10,  stamina:5,  bondDecayPerWeek:3, label:'Malinois',        desc:'Intensidad y recuperación rápida. Necesita más entrenamiento o se estresa.'},
  mestizo: {speed:0,   stamina:0,  bondDecayPerWeek:0, label:'Mestizo',         desc:'Stats equilibrados. Sin pico en nada.'},
};

const CN_EVENTS_POS=[
  {id:'mirada',  text:'[DOG] se gira a mirarte en el km [KM]',                     bondMod:5,  mentalMod:3},
  {id:'ritmo',   text:'Lleváis el mismo ritmo sin esfuerzo',                        bondMod:8,  speedBonus:2},
  {id:'rival',   text:'[DOG] ladra al pasar por delante de un rival',               bondMod:4,  mentalMod:5},
  {id:'cuesta',  text:'[DOG] te arrastra cuesta arriba sin que se lo pidas',        energyBonus:10, bondMod:5},
  {id:'nieve',   text:'[DOG] encuentra un tramo de nieve virgen y enloquece de alegría', bondMod:6, winterOnly:true},
];
const CN_EVENTS_NEG=[
  {id:'olor', text:'[DOG] se para en seco — huele algo, pierdes 15s', timeLoss:15, decision:true,
   options:[{label:'Esperar con calma (+2 vínculo)',bondMod:2,timeLoss:0},{label:'Tirar de él (-4 vínculo)',bondMod:-4,timeLoss:0}]},
  {id:'cojera', text:'[DOG] cojea levemente — ¿sigues o reduces ritmo?', decision:true,
   options:[{label:'Seguir igual (riesgo lesión, -8 vínculo)',bondMod:-8,injuryRisk:true},{label:'Reducir ritmo (+4 vínculo)',bondMod:4,timeLoss:120}]},
  {id:'dessinc', text:'Lleváis 3 km sin sincronía — el arnés tensa constantemente', bondMod:-5},
];
const CN_EVENTS_RARE=[
  {id:'autopilot',    text:'Modo automático — [DOG] anticipa tus movimientos durante 2 tramos', speedBonus:5, energyBonus:8},
  {id:'publico_rare', text:'El público os señala a los dos — alguien grita vuestros dos nombres', mentalMod:10, bondMod:5},
];
const CN_EVENTS_SPECIAL=[
  {id:'ardilla',  text:'🐿️ [DOG] ve una ardilla', timeLoss:10, decision:true,
   options:[{label:'Controlar bien (+3 vínculo)',bondMod:3,timeLoss:0},{label:'Dejarle ir (-5 vínculo)',bondMod:-5,timeLoss:15}]},
  {id:'arroyo',   text:'💧 [DOG] encuentra un arroyo — rehidratación gratuita', hydBonus:10},
  {id:'espectad', text:'🎉 Los espectadores gritan tu nombre y el de [DOG]',   mentalMod:8, bondMod:4},
  {id:'coj_grave',text:'🐾 [DOG] cojea en km [KM] — ¿retiras o continúas despacio?', decision:true,
   options:[{label:'Retirar (sin penalización vínculo)',retire:true,bondMod:2},{label:'Continuar (riesgo lesión grave)',injuryRisk:true,injurySevere:true,bondMod:-3}]},
];

const CN_PACES=[
  {id:'suave',   label:'Suave',         desc:'Conserváis energía juntos',      timeMult:1.18, energyCost:5,  dogCost:4,  bondMod:2 },
  {id:'ritmo',   label:'Ritmo conjunto',desc:'Equilibrado — buena sincronía',  timeMult:1.00, energyCost:10, dogCost:8,  bondMod:0 },
  {id:'apretar', label:'Apretar',       desc:'Rápido, el perro va al límite',  timeMult:0.90, energyCost:17, dogCost:14, bondMod:-2},
  {id:'atope',   label:'A tope',        desc:'Máximo esfuerzo — riesgo real',  timeMult:0.82, energyCost:25, dogCost:21, bondMod:-5},
];
const CN_SEG_NAMES={
  flat:    ['Pista forestal','Camino llano','Senda suave','Llano abierto','Recta de velocidad'],
  climb:   ['Repecho sostenido','Subida técnica','Cuesta exigente','Rampa pronunciada','Ascenso en zigzag'],
  descent: ['Bajada técnica','Descenso rápido','Pendiente suelta','Tramo de bajada','Descenso en pista'],
};
const CN_RIVAL_NAMES=[
  'Elena & Nala','Carlos & Thor','Ana & Kira','Javi & Bolt','Laura & Max',
  'Pedro & Zara','Marta & Rex','Iñaki & Txuri','Sara & Nina','Pol & Ares',
  'Eva & Lola','Tomás & Figo','Noa & Coco','Rubén & Draco','Lidia & Hera',
  'Diego & Rayo','Claudia & Kira','Andrei & Boss',
];

// ── STATE HELPERS ─────────────────────────────────────
function cnInitDog(name,breed){
  const m=CN_BREED_MODS[breed]||CN_BREED_MODS.mestizo;
  return{name,breed,age:1,
    speed:Math.min(100,Math.max(0,50+(m.speed||0))),
    stamina:Math.min(100,Math.max(0,50+(m.stamina||0))),
    bond:0,health:100,birthSeason:G.cnSeason||1,
    retired:false,races:0,kmTogether:0,peakBond:0,
    injury:null,injuryRaces:0,
    commands:{left:false,hold:false,forward:false},
  };
}

function cnGetEquipMods(){
  const eq=G.equipment||{};
  const harness=(CANICROSS_EQUIPMENT.dogHarness||[]).find(e=>e.id===eq.dogHarness)||{};
  const belt=(CANICROSS_EQUIPMENT.humanBelt||[]).find(e=>e.id===eq.humanBelt)||{};
  const line=(CANICROSS_EQUIPMENT.line||[]).find(e=>e.id===eq.line)||{};
  return{speedMod:harness.speedMod||0,staminaMod:harness.staminaMod||0,injuryRisk:belt.injuryRiskMod||0,jerkMod:line.jerkMod||0};
}

function cnCanRace(){
  const d=G.dog;
  if(!d||d.retired)return false;
  if(d.injury&&d.injuryRaces>0)return false;
  if(d.bond<30)return false;
  return true;
}

function cnNextCommand(){
  if(!G.dog)return null;
  const c=G.dog.commands;
  if(!c.left)return 'left';
  if(!c.hold)return 'hold';
  if(!c.forward)return 'forward';
  return null;
}

function cnCommandLabel(id){return{left:'Izquierda',hold:'Aguanta',forward:'Adelante'}[id]||id;}

function cnCommandsList(){
  if(!G.dog)return[];
  const c=G.dog.commands||{};
  return[{id:'left',label:'Izquierda',learned:c.left},{id:'hold',label:'Aguanta',learned:c.hold},{id:'forward',label:'Adelante',learned:c.forward}];
}

function cnDogAgeLabel(){
  const y=G.dog?G.dog.age:0;
  return y===1?'1 año':y+' años';
}

function cnMonthlyDogCost(){
  let c=40;
  if(G.cnDogFoodPremium)c+=30;
  if(G.cnDogSupplements)c+=25;
  return c;
}

function cnCurrentMonth(){
  const w=G.cnWeek||0;
  if(w<5)return 10;
  if(w<9)return 11;
  if(w<13)return 12;
  if(w<17)return 1;
  if(w<21)return 2;
  return 3;
}

function cnPickEvent(raceMonth){
  if(Math.random()>0.60)return null;
  const d=G.dog;if(!d)return null;
  const isWinter=raceMonth===12||raceMonth===1||raceMonth===2;
  const r=Math.random();
  if(d.bond>=75&&r<0.15)return{...CN_EVENTS_RARE[Math.floor(Math.random()*CN_EVENTS_RARE.length)],eventType:'rare'};
  if(r<0.3){
    const pool=CN_EVENTS_SPECIAL;
    return{...pool[Math.floor(Math.random()*pool.length)],eventType:'special'};
  }
  if(r<0.65){
    const pool=CN_EVENTS_POS.filter(e=>!e.winterOnly||(e.winterOnly&&isWinter));
    if(!pool.length)return null;
    return{...pool[Math.floor(Math.random()*pool.length)],eventType:'pos'};
  }
  return{...CN_EVENTS_NEG[Math.floor(Math.random()*CN_EVENTS_NEG.length)],eventType:'neg'};
}

function cnReplaceVars(text){
  if(!G.dog)return text;
  const km=Math.floor(Math.random()*7)+1;
  return text.replace(/\[DOG\]/g,esc(G.dog.name)).replace(/\[KM\]/g,km);
}

function cnApplyEventAuto(ev,rs){
  if(ev.bondMod)rs.bondDelta=(rs.bondDelta||0)+ev.bondMod;
  if(ev.energyBonus)rs.energyBonus=(rs.energyBonus||0)+ev.energyBonus;
  if(ev.speedBonus)rs.speedBonus=(rs.speedBonus||0)+(typeof ev.speedBonus==='number'?ev.speedBonus:3);
  if(ev.mentalMod)G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+(ev.mentalMod||0));
  if(ev.hydBonus)rs.runnerEnergy=Math.min(100,(rs.runnerEnergy||100)+(ev.hydBonus||0));
  if(ev.timeLoss)rs.timePenalty=(rs.timePenalty||0)+ev.timeLoss;
}

function cnCheckBirthday(){
  const d=G.dog;if(!d)return;
  const key='s'+G.cnSeason;
  if(!G.cnBirthdayToastShown)G.cnBirthdayToastShown={};
  if(G.cnBirthdayToastShown[key])return;
  const age=G.cnSeason-(d.birthSeason||1);
  if(age>0){
    G.cnBirthdayToastShown[key]=true;
    d.bond=Math.min(100,(d.bond||0)+3);
    d.peakBond=Math.max(d.peakBond||0,d.bond);
    setTimeout(()=>showToast('🎂 ¡Cumpleaños de '+esc(d.name)+'! '+age+' año'+(age>1?'s':'')+' juntos · +3 vínculo','#c07a10'),350);
  }
}

function cnGenerateSegs(race){
  const n=Math.min(6,Math.max(3,Math.ceil((race.km||8)/2)));
  const kmPerSeg=Math.round((race.km||8)/n*10)/10;
  const typeSeq=['flat','climb','flat','descent','climb','flat'];
  return Array.from({length:n},(_,i)=>{
    const type=typeSeq[i%typeSeq.length];
    const gain=type==='climb'?Math.round(40+Math.random()*70):type==='descent'?-Math.round(30+Math.random()*50):0;
    const names=CN_SEG_NAMES[type];
    return{km:kmPerSeg,type,gain,name:names[Math.floor(Math.random()*names.length)]};
  });
}

function cnGenerateRivals(race){
  const n=(race.tier||1)*4+Math.floor(Math.random()*4)+3;
  const base={1:360,2:390,3:415,4:440}[race.tier||1]||390;
  const pool=[...CN_RIVAL_NAMES].sort(()=>Math.random()-0.5).slice(0,Math.min(n,CN_RIVAL_NAMES.length));
  while(pool.length<n)pool.push('Equipo #'+(pool.length+1));
  return pool.map(name=>{
    const skill=0.80+Math.random()*0.40;
    return{name,estimatedTime:Math.round(base/skill*(race.km||8))};
  });
}

function cnLivePosition(rs){
  if(!rs.rivals||!rs.rivals.length)return{pos:1,total:1};
  const myTime=(rs.time||0)+(rs.timePenalty||0);
  const total=rs.rivals.length+1;
  const pos=rs.rivals.filter(r=>r.estimatedTime<myTime).length+1;
  return{pos,total};
}

// ── RACE FINISH ───────────────────────────────────────
function cnFinishRace(){
  const rs=G.cnRaceState;if(!rs)return;
  const d=G.dog;if(!d)return;
  const race=(G.cnSelectedRaces||[])[G.cnCurrentRaceIdx]||{};
  const mods=cnGetEquipMods();

  const totalBond=rs.bondDelta||0;
  d.bond=Math.max(0,Math.min(100,d.bond+totalBond));
  d.peakBond=Math.max(d.peakBond||0,d.bond);

  let totalTime=Math.round((rs.time||0)+(rs.timePenalty||0));
  const rivals=rs.rivals||[];
  const numRivals=rivals.length||((race.tier||1)*4+5);
  const pos=Math.max(1,rivals.filter(r=>r.estimatedTime<totalTime).length+1);

  const prize=pos===1?race.prize:pos===2?Math.round(race.prize*0.6):pos===3?Math.round(race.prize*0.4):0;
  G.cnMoney=(G.cnMoney||0)+prize;

  if(rs.injuryPending){
    d.injury=rs.injuryPending;
    d.injuryRaces=rs.injuryPending==='luxacion'?2:1;
    d.health=Math.max(20,(d.health||100)-20);
  }
  if(!rs.retired){
    d.races=(d.races||0)+1;
    d.kmTogether=(d.kmTogether||0)+(race.km||0);
    G.cnMoney=Math.max(0,(G.cnMoney||0)-(race.cost||0));
  }

  G.followers=(G.followers||0)+Math.round((pos<=3?150:pos<=10?80:30)*(race.tier||1));

  if(!G.cnRaceResults)G.cnRaceResults=[];
  G.cnRaceResults.push({
    raceId:race.id,raceName:race.name,season:G.cnSeason||1,
    pos:rs.retired?null:pos,time:totalTime,dnf:rs.retired||false,
    bondDelta:totalBond,prize,km:race.km||0,
  });

  rs.finalPos=pos;rs.finalTime=totalTime;rs.finalPrize=prize;rs.done=true;
  autoSave();
  G.screen='canicrossPostRace';
  render();
}

// ── INIT FLOW ─────────────────────────────────────────
window.doStartCanicross=()=>{
  const nm=document.getElementById('rname');if(nm)G.runner.name=nm.value;
  const rn=document.getElementById('runname');if(rn)G.runName=rn.value;
  if(!G.runner.name.trim())G.runner.name='Corredor';
  G.runner.stats=applyAgeToStats({...SPEC_STATS[G.runner.specialty]},G.runner.age||25);
  G.canicrossMode=true;
  G.cnMoney=500;G.cnSeason=1;
  G.cnSelectedRaces=[];G.cnCurrentRaceIdx=0;G.cnRaceResults=[];
  G.cnTrainingBlock=null;G.cnWeek=0;
  G.cnRestWeeksLeft=3;G.cnOpenMonths=[];
  G.cnTrainAdrainSessions={left:0,hold:0,forward:0};
  G.equipment={dogHarness:'basic_harness',humanBelt:'basic_belt',line:'basic_line'};
  G.cnOwnedEquipment={dogHarness:['basic_harness'],humanBelt:['basic_belt'],line:['basic_line']};
  G.cnDogFoodPremium=false;G.cnDogSupplements=false;
  G.cnVetHistory=[];G.cnBirthdayToastShown={};G.cnRaceState=null;
  G.dog=null;G._cnDogBreed=null;G._cnDogName=null;
  G.screen='canicrossCreateDog';
  render();
};

window.doCreateDog=()=>{
  const nm=document.getElementById('dogname');
  const name=(nm?nm.value:'').trim();
  if(!name){showToast('Ponle nombre al perro primero','#c0392b');return;}
  if(!G._cnDogBreed){showToast('Elige una raza','#c0392b');return;}
  G.dog=cnInitDog(name,G._cnDogBreed);
  G._cnDogBreed=null;G._cnDogName=null;
  G.activeTab='game';G.screen='canicrossHub';
  autoSave();
  showToast('¡'+esc(G.dog.name)+' se une a tu equipo! 🐕','#4a8a2a');
  render();
};

window.cnSelectBreed=breed=>{G._cnDogBreed=breed;const nm=document.getElementById('dogname');if(nm)G._cnDogName=nm.value;render();};
window.cnSelectTraining=id=>{G.cnTrainingBlock=id;render();};

window.cnToggleMonth=m=>{
  if(!G.cnOpenMonths)G.cnOpenMonths=[];
  const i=G.cnOpenMonths.indexOf(m);
  if(i>=0)G.cnOpenMonths.splice(i,1);else G.cnOpenMonths.push(m);
  render();
};

window.cnAdvanceRestWeek=()=>{
  if((G.cnRestWeeksLeft??3)<=0){showToast('Sin semanas de descanso disponibles','#c0392b');return;}
  const d=G.dog;
  if(d){
    d.health=Math.min(100,(d.health||100)+6);
    d.bond=Math.min(100,(d.bond||0)+3);
    d.peakBond=Math.max(d.peakBond||0,d.bond);
  }
  if(G.runner?.stats?.mental!==undefined)G.runner.stats.mental=Math.min(100,(G.runner.stats.mental||50)+4);
  G.cnRestWeeksLeft=Math.max(0,(G.cnRestWeeksLeft??3)-1);
  G.cnWeek=(G.cnWeek||0)+1;
  if((G.cnWeek||0)%4===0){
    const cost=cnMonthlyDogCost();
    G.cnMoney=Math.max(0,(G.cnMoney||0)-cost);
    showToast('Gastos del perro: -€'+cost+'/mes','#c07a10');
  }
  autoSave();render();
  setTimeout(()=>showToast('Semana de descanso — '+esc(d?.name||'el perro')+' se recupera ✓','#4a8a2a'),150);
};

window.cnAdvanceWeek=()=>{
  if(!G.cnTrainingBlock){showToast('Elige un bloque de entrenamiento','#c0392b');return;}
  const block=(CANICROSS_TRAINING_BLOCKS||[]).find(b=>b.id===G.cnTrainingBlock);
  if(!block)return;
  const d=G.dog;

  Object.entries(block.runnerMod||{}).forEach(([k,v])=>{
    if(G.runner.stats[k]!==undefined)G.runner.stats[k]=Math.min(100,G.runner.stats[k]+(v||0));
  });

  if(d){
    if(block.dogMod&&block.dogMod.speed)d.speed=Math.min(100,(d.speed||50)+(block.dogMod.speed||0));
    if(block.dogMod&&block.dogMod.stamina)d.stamina=Math.min(100,(d.stamina||50)+(block.dogMod.stamina||0));
    if(block.dogMod&&block.dogMod.health)d.health=Math.min(100,(d.health||100)+(block.dogMod.health||0));

    let bMod=block.bondMod||0;
    if(d.breed==='malinois'&&block.id==='solo')bMod-=CN_BREED_MODS.malinois.bondDecayPerWeek;
    d.bond=Math.max(0,Math.min(100,(d.bond||0)+bMod));
    d.peakBond=Math.max(d.peakBond||0,d.bond);

    if(block.teachCommand){
      const next=cnNextCommand();
      if(next){
        if(!G.cnTrainAdrainSessions)G.cnTrainAdrainSessions={left:0,hold:0,forward:0};
        G.cnTrainAdrainSessions[next]=(G.cnTrainAdrainSessions[next]||0)+1;
        if(G.cnTrainAdrainSessions[next]>=2){
          d.commands[next]=true;G.cnTrainAdrainSessions[next]=0;
          showToast('¡'+esc(d.name)+' aprende "'+cnCommandLabel(next)+'"! ✅','#4a8a2a');
        } else {
          showToast(esc(d.name)+' practica "'+cnCommandLabel(next)+'" (1/2)','#c07a10');
        }
      } else {
        showToast('¡'+esc(d.name)+' ya conoce todos los comandos! 🌟','#4a8a2a');
      }
    }

    if(G.cnDogSupplements)d.stamina=Math.min(100,(d.stamina||50)+1);
  }

  G.cnWeek=(G.cnWeek||0)+1;
  if((G.cnWeek||0)%4===0){
    const cost=cnMonthlyDogCost();
    G.cnMoney=Math.max(0,(G.cnMoney||0)-cost);
    showToast('Gastos del perro: -€'+cost+'/mes','#c07a10');
  }

  autoSave();render();
  setTimeout(()=>showToast('Semana '+(G.cnWeek)+' completada ✓','#4a8a2a'),150);
};

window.cnStartRace=idx=>{
  if(!cnCanRace()){
    const d=G.dog;
    if(!d){showToast('Sin perro asignado','#c0392b');return;}
    if(d.bond<30){showToast('Vínculo insuficiente — necesitas ≥30 para competir (actual: '+d.bond+')','#c0392b');return;}
    if(d.injury&&d.injuryRaces>0){showToast(esc(d.name)+' está de baja ('+d.injuryRaces+' carreras)','#c0392b');return;}
    showToast('El perro no puede correr ahora','#c0392b');return;
  }
  const race=(G.cnSelectedRaces||[])[idx];
  if(!race){showToast('Carrera no disponible','#c0392b');return;}
  G.cnCurrentRaceIdx=idx;
  const segs=cnGenerateSegs(race);
  const numSegs=segs.length;
  const basePace={1:360,2:390,3:415,4:440}[race.tier]||390;
  G.cnRaceState={
    raceId:race.id,raceName:race.name,km:race.km,tier:race.tier,month:race.month,
    numSegs,segs,rivals:cnGenerateRivals(race),basePace,
    currentSeg:0,pendingEvent:null,decisionMade:false,paceChosen:false,
    time:0,bondDelta:0,energyBonus:0,speedBonus:0,timePenalty:0,
    dogHealth:G.dog.health,dogBond:G.dog.bond,runnerEnergy:100+(G.cnDogFoodPremium?5:0),
    eventLog:[],retired:false,injuryPending:null,done:false,
  };
  G.screen='canicrossPreRace';render();
};

window.cnGoToRace=()=>{G.screen='canicrossSegment';render();};

window.cnNextSegment=()=>{
  const rs=G.cnRaceState;if(!rs)return;
  rs.currentSeg++;
  rs.pendingEvent=null;rs.decisionMade=false;rs.paceChosen=false;
  if(rs.currentSeg>=rs.numSegs){cnFinishRace();return;}
  render();
};

window.cnMakeDecision=optIdx=>{
  const rs=G.cnRaceState;if(!rs||!rs.pendingEvent)return;
  const ev=rs.pendingEvent;
  const opt=(ev.options||[])[optIdx];if(!opt)return;
  if(opt.bondMod)rs.bondDelta=(rs.bondDelta||0)+opt.bondMod;
  if(opt.timeLoss)rs.timePenalty=(rs.timePenalty||0)+opt.timeLoss;
  if(opt.injuryRisk&&Math.random()<0.4)rs.injuryPending=opt.injurySevere?'luxacion':'almohadillas';
  if(opt.retire)rs.retired=true;
  rs.eventLog.push({seg:rs.currentSeg,event:ev,choice:optIdx,resolved:true});
  rs.pendingEvent=null;rs.decisionMade=true;
  render();
};

window.cnChoosePace=paceId=>{
  const rs=G.cnRaceState;if(!rs)return;
  const pace=CN_PACES.find(p=>p.id===paceId);if(!pace)return;
  const d=G.dog;
  const seg=rs.segs?.[rs.currentSeg];
  const basePace=rs.basePace||390;
  const kmPerSeg=(rs.km||8)/rs.numSegs;
  const speedFactor=Math.max(0.7,Math.min(1.3,(d?.speed||50)/50));
  const staminaFactor=Math.max(0.8,(d?.stamina||50)/100);

  let tm=Math.round(basePace*kmPerSeg*pace.timeMult/speedFactor);
  let ec=pace.energyCost;
  let dc=Math.round(pace.dogCost/staminaFactor);
  let bm=pace.bondMod;

  if(seg?.type==='climb'){tm=Math.round(tm*1.15);ec=Math.round(ec*1.3);dc=Math.round(dc*1.2);}
  if(seg?.type==='descent'){tm=Math.round(tm*0.88);ec=Math.round(ec*0.8);dc=Math.round(dc*0.85);}

  rs.time=(rs.time||0)+tm;
  rs.runnerEnergy=Math.max(0,(rs.runnerEnergy||100)-ec);
  rs.dogHealth=Math.max(0,(rs.dogHealth||100)-dc);
  rs.bondDelta=(rs.bondDelta||0)+bm;

  if(paceId==='atope'&&d?.commands?.forward){
    rs.time=Math.max(0,(rs.time||0)-10);rs.bondDelta=(rs.bondDelta||0)+1;
    setTimeout(()=>showToast(esc(d.name)+' responde "Adelante" ✓ −10s','#4a8a2a'),50);
  }
  if(paceId==='suave'&&d?.commands?.hold){
    rs.dogHealth=Math.min(100,(rs.dogHealth||100)+4);
    setTimeout(()=>showToast(esc(d.name)+' mantiene el ritmo — "Aguanta" ✓','#4a8a2a'),50);
  }

  const ev=cnPickEvent(rs.month||1);
  if(ev&&!ev.decision){
    cnApplyEventAuto(ev,rs);
    rs.eventLog.push({seg:rs.currentSeg,event:ev,resolved:true});
  }else if(ev&&ev.decision){
    rs.pendingEvent=ev;
  }
  rs.paceChosen=true;
  render();
};

window.cnToggleRace=id=>{
  const race=CANICROSS_RACES.find(r=>r.id===id);if(!race)return;
  const sel=G.cnSelectedRaces||[];
  const idx=sel.findIndex(r=>r.id===id);
  if(idx>=0){G.cnSelectedRaces.splice(idx,1);}
  else{
    if(sel.length>=5){showToast('Máximo 5 carreras por temporada','#c0392b');return;}
    G.cnSelectedRaces=[...sel,race];
  }
  render();
};

window.cnConfirmCalendar=()=>{
  if(!(G.cnSelectedRaces||[]).length){showToast('Selecciona al menos una carrera','#c0392b');return;}
  G.cnSelectedRaces=[...G.cnSelectedRaces].sort((a,b)=>a.month-b.month);
  G.activeTab='game';
  showToast('Calendario confirmado: '+G.cnSelectedRaces.length+' carrera(s)','#4a8a2a');
  render();
};

window.cnCallVet=type=>{
  const d=G.dog;if(!d)return;
  const cost=type==='complete'?120:50;
  if((G.cnMoney||0)<cost){showToast('Sin fondos suficientes','#c0392b');return;}
  G.cnMoney-=cost;
  if(!G.cnVetHistory)G.cnVetHistory=[];
  G.cnVetHistory.push({type,season:G.cnSeason,cost});
  if(type==='basic'&&(d.injuryRaces||0)>0){
    d.injuryRaces=Math.ceil(d.injuryRaces/2);
    showToast('Revisión completada — baja reducida a '+d.injuryRaces+' carrera(s)','#4a8a2a');
  } else if(type==='complete'&&d.injury){
    d.injuryRaces=Math.max(0,(d.injuryRaces||0)-1);
    if(d.injuryRaces===0){d.injury=null;showToast(esc(d.name)+' se recupera ✓','#4a8a2a');}
    else showToast('Tratamiento en curso — '+d.injuryRaces+' carrera(s) de baja','#4a90d9');
  } else {
    showToast('Revisión completada ✓','#4a8a2a');
  }
  autoSave();render();
};

window.cnBuyEquip=(category,id)=>{
  const items=CANICROSS_EQUIPMENT[category]||[];
  const item=items.find(i=>i.id===id);if(!item)return;
  if(!G.cnOwnedEquipment)G.cnOwnedEquipment={dogHarness:['basic_harness'],humanBelt:['basic_belt'],line:['basic_line']};
  if((G.cnOwnedEquipment[category]||[]).includes(id)){showToast('Ya tienes este equipo','#888');return;}
  if((G.cnMoney||0)<item.price){showToast('Sin fondos suficientes','#c0392b');return;}
  G.cnMoney-=item.price;
  G.cnOwnedEquipment[category]=[...(G.cnOwnedEquipment[category]||[]),id];
  G.equipment[category]=id;
  showToast('¡'+item.name+' comprado! 🎒','#4a8a2a');
  autoSave();render();
};

window.cnSelectEquip=(category,id)=>{
  if(!(G.cnOwnedEquipment[category]||[]).includes(id))return;
  if(!G.equipment)G.equipment={dogHarness:'basic_harness',humanBelt:'basic_belt',line:'basic_line'};
  G.equipment[category]=id;
  render();
};

window.cnEndSeason=()=>{
  const d=G.dog;
  if(d&&!d.retired){
    d.age=(d.age||1)+1;
    if((d.injuryRaces||0)>0){d.injuryRaces=Math.max(0,d.injuryRaces-1);if(d.injuryRaces===0)d.injury=null;}
    if(d.age>=6&&!G._cnAgingWarned){G._cnAgingWarned=true;}
    // Displasia: 8% chance, ages 4-7, once
    if(d.age>=4&&d.age<=7&&!G._cnDislasiaEvent&&Math.random()<0.08){
      G._cnDislasiaEvent=true;G.screen='canicrossDisplasia';render();return;
    }
    // Neglect health decay age 7+
    if(d.age>=7){
      d.health=Math.max(0,(d.health||100)-5);
      if(d.health<=0){G.screen='canicrossDogDeath';render();return;}
    }
  }
  cnDoSeasonTransition();
};

window.cnDoSeasonTransition=function cnDoSeasonTransition(){
  G.cnSeason=(G.cnSeason||1)+1;
  G.cnWeek=0;G.cnSelectedRaces=[];G.cnCurrentRaceIdx=0;
  G.cnTrainingBlock=null;G.cnRestWeeksLeft=3;G.cnOpenMonths=[];
  G.cnTrainAdrainSessions={left:0,hold:0,forward:0};
  G.cnRaceState=null;
  G.activeTab='game';G.screen='canicrossHub';
  autoSave();render();
};

window.cnResolveDislasia=opt=>{
  const d=G.dog;if(!d)return;
  if(opt==='treat'){
    if((G.cnMoney||0)<300){showToast('Sin fondos para el tratamiento (€300)','#c0392b');return;}
    G.cnMoney-=300;
    d.speed=Math.round((d.speed||50)*0.85);
    d.stamina=Math.round((d.stamina||50)*0.85);
    showToast('Tratamiento intensivo iniciado 💊','#4a90d9');
    cnDoSeasonTransition();
  } else if(opt==='retire'){
    d.retired=true;G.screen='canicrossDogRetirement';render();
  } else if(opt==='ignore'){
    d.health=Math.max(0,(d.health||100)-5);
    d.bond=Math.max(0,(d.bond||0)-5);
    showToast(esc(d.name)+' nota que no le cuidas. -5 vínculo','#c0392b');
    cnDoSeasonTransition();
  }
};

window.cnRetireDog=()=>{
  if(!G.dog)return;
  G.dog.retired=true;G.screen='canicrossDogRetirement';render();
};

window.cnNewDogAfterRetirement=()=>{
  if(G.dog&&!G.dog.retired)G.dog.retired=true;
  G._cnDogBreed=null;G._cnDogName=null;
  // Reset dog training sessions
  G.cnTrainAdrainSessions={left:0,hold:0,forward:0};
  G.screen='canicrossCreateDog';render();
};

// ══════════════════════════════════════════════════════
//  RENDER — CANICROSS
// ══════════════════════════════════════════════════════

function renderCnCreateDog(){
  const el=document.getElementById('main');
  const breed=G._cnDogBreed;
  el.innerHTML=`
    <h2>🐕 Tu compañero</h2>
    <p class="sub">Elige el perro con el que competirás</p>
    <label class="field-label">Nombre del perro</label>
    <input id="dogname" type="text" placeholder="Ej: Txuri, Luna, Thor..." maxlength="20" value="${esc(G._cnDogName||'')}" style="margin-bottom:14px"/>
    <label class="field-label">Raza</label>
    <div class="grid2" style="margin-bottom:18px">
      ${Object.entries(CN_BREED_MODS).map(([id,m])=>`
        <div class="spec ${breed===id?'sel':''}" onclick="cnSelectBreed('${id}')">
          <div class="spec-label">${m.label}</div>
          <div class="spec-desc" style="margin-bottom:4px">${m.desc}</div>
          <div style="font-size:11px;color:#4a8a2a">${m.speed>0?'+'+m.speed+' vel':m.speed<0?m.speed+' vel':'vel base'} · ${m.stamina>0?'+'+m.stamina+' res':m.stamina<0?m.stamina+' res':'res base'}</div>
          ${m.bondDecayPerWeek>0?`<div style="font-size:11px;color:#c0392b;margin-top:2px">⚠ -${m.bondDecayPerWeek} vínculo/sem sin entreno</div>`:''}
        </div>`).join('')}
    </div>
    ${breed?(()=>{
      const m=CN_BREED_MODS[breed];
      const spd=50+(m.speed||0);const sta=50+(m.stamina||0);
      return `<div class="card" style="margin-bottom:16px">
        <div class="sec-title-sm">Stats iniciales</div>
        <div class="bar-row"><span class="bar-label">Velocidad</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${spd}%;background:${spd>=60?'#4a90d9':'#c07a10'}"></div></div><span class="bar-pct">${spd}</span></div>
        <div class="bar-row"><span class="bar-label">Resistencia</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${sta}%;background:${sta>=60?'#4a8a2a':'#c07a10'}"></div></div><span class="bar-pct">${sta}</span></div>
        <div class="bar-row"><span class="bar-label">Vínculo</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:0%;background:#c07a10"></div></div><span class="bar-pct">0</span></div>
      </div>`;
    })():`<div class="hint" style="margin-bottom:16px">Elige una raza para ver los stats iniciales</div>`}
    <div class="note" style="margin-bottom:14px">El perro empieza con vínculo <strong>0</strong>. Necesitas <strong>≥30 para competir</strong>. Entrena juntos cada semana.</div>
    <button class="main" onclick="doCreateDog()">Crear perro y empezar →</button>
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="G.screen='modeSelect';render()">← Volver al menú</button>`;
  setTimeout(()=>{
    const i=document.getElementById('dogname');
    if(i){i.oninput=e=>{G._cnDogName=e.target.value;};if(G._cnDogName)i.value=G._cnDogName;}
  },0);
}

// ── TAB: CORREDOR ─────────────────────────────────────
function renderCnCorredorTab(){
  const el=document.getElementById('main');
  const d=G.dog;
  const canRace=cnCanRace();
  const races=G.cnSelectedRaces||[];
  const doneIds=(G.cnRaceResults||[]).filter(r=>r.season===G.cnSeason).map(r=>r.raceId);
  const pendingRaces=races.filter(r=>!doneIds.includes(r.id));
  const allRaceDone=races.length>0&&pendingRaces.length===0;
  const curMonth=cnCurrentMonth();
  const MONTHS=[10,11,12,1,2,3];
  const MONTH_NAMES={10:'Octubre',11:'Noviembre',12:'Diciembre',1:'Enero',2:'Febrero',3:'Marzo'};
  const mIdx=m=>MONTHS.indexOf(m);
  const restLeft=G.cnRestWeeksLeft??3;

  cnCheckBirthday();

  el.innerHTML=`
    <div class="flex-between-center" style="margin-bottom:4px">
      <h2>🏃 ${esc(G.runner.name||'Corredor')}</h2>
      <span style="font-size:12px;color:#888">Temporada ${G.cnSeason||1}</span>
    </div>
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat"><div class="stat-label">Presupuesto</div><div class="stat-val" style="color:#2d7a2d">€${G.cnMoney||0}</div></div>
      <div class="stat"><div class="stat-label">Semana</div><div class="stat-val">${G.cnWeek||0}</div></div>
      <div class="stat"><div class="stat-label">Carreras sel.</div><div class="stat-val">${races.length}</div></div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Stats del corredor</div>
      ${Object.entries(G.runner.stats||{}).slice(0,4).map(([k,v])=>`<div class="bar-row"><span class="bar-label">${k.charAt(0).toUpperCase()+k.slice(1)}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${v}%;background:${v>=70?'#4a8a2a':v>=50?'#4a90d9':'#c07a10'}"></div></div><span class="bar-pct">${v}</span></div>`).join('')}
    </div>

    ${d&&d.breed==='malinois'&&G.cnTrainingBlock==='solo'?`<div class="warn">⚠ Malinois + entreno solo → -${CN_BREED_MODS.malinois.bondDecayPerWeek} vínculo extra esta semana.</div>`:''}

    <div class="section-label">Bloque de entrenamiento semanal</div>
    ${(CANICROSS_TRAINING_BLOCKS||[]).map(b=>`
      <div class="train-card ${G.cnTrainingBlock===b.id?'sel':''}" onclick="cnSelectTraining('${b.id}')">
        <div class="flex-between-center">
          <div>
            <div class="card-title">${b.label}</div>
            <div class="card-sub">${b.desc}</div>
          </div>
          <span style="font-size:12px;color:#888;flex-shrink:0">${b.hours}h</span>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px">
          ${Object.entries(b.runnerMod||{}).filter(([,v])=>v).map(([k,v])=>`<span style="font-size:11px;background:#eaf4ea;color:#2d5a2d;padding:1px 6px;border-radius:4px">corredor ${k} ${v>0?'+'+v:v}</span>`).join('')}
          ${b.dogMod?Object.entries(b.dogMod).filter(([,v])=>v).map(([k,v])=>`<span style="font-size:11px;background:#f0f6ff;color:#2d4fa0;padding:1px 6px;border-radius:4px">perro ${k} ${v>0?'+'+v:v}</span>`).join(''):''}
          ${b.bondMod!=null?`<span style="font-size:11px;background:${b.bondMod>=0?'#fef9ec':'#fef0f0'};color:${b.bondMod>=0?'#c07a10':'#c0392b'};padding:1px 6px;border-radius:4px">vínculo ${b.bondMod>=0?'+'+b.bondMod:b.bondMod}</span>`:''}
          ${b.teachCommand?`<span style="font-size:11px;background:#f0ede8;color:#555;padding:1px 6px;border-radius:4px">enseña comando</span>`:''}
        </div>
      </div>`).join('')}

    <div class="card" style="margin-top:12px;margin-bottom:4px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="card-title">🏖 Semanas de descanso</div>
        <div style="font-size:12px;color:#888">${restLeft}/3 disponibles</div>
      </div>
      ${restLeft>0?`
        <div style="font-size:12px;color:#555;margin-bottom:8px">Avanza sin entrenar: +6 salud ${d?esc(d.name):'perro'} · +3 vínculo · +4 mental corredor.</div>
        <button class="secondary" onclick="cnAdvanceRestWeek()">Tomar semana de descanso →</button>
      `:`<div style="font-size:12px;color:#aaa">Sin semanas de descanso disponibles esta temporada.</div>`}
    </div>

    <button class="main" style="margin-top:10px" onclick="cnAdvanceWeek()">Avanzar semana de entrenamiento →</button>

    <div class="section-label" style="margin-top:18px">📅 Carreras de temporada</div>
    ${races.length>0?MONTHS.map(m=>{
      const mName=MONTH_NAMES[m];
      const race=races.find(r=>r.month===m);
      const isCurrent=m===curMonth;
      const isPast=mIdx(m)<mIdx(curMonth);
      const isOpen=(G.cnOpenMonths||[]).includes(m);
      const done=race&&doneIds.includes(race.id);
      const result=done?(G.cnRaceResults||[]).find(res=>res.raceId===race.id&&res.season===G.cnSeason):null;
      const overdue=isPast&&race&&!done;
      const idx=race?races.indexOf(race):-1;
      return `<div style="border:1px solid ${isCurrent?'#b8ddb8':'#e8e6e0'};border-radius:10px;margin-bottom:6px;overflow:hidden;${isCurrent?'background:#f8fdf8':'background:#fff'}">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 14px;cursor:${race?'pointer':'default'}" ${race?`onclick="cnToggleMonth(${m})"`:''}">
          <div style="flex:1;min-width:0">
            <span style="font-size:14px;font-weight:600;color:${isCurrent?'#2d7a2d':isPast?'#aaa':'#1a1a1a'}">${mName}</span>
            ${race?`<span style="font-size:12px;color:${isPast&&!done?'#bbb':'#888'};margin-left:6px">· ${esc(race.name)} · ${race.km}km · Tier ${race.tier}</span>`
                  :`<span style="font-size:12px;color:#ccc;margin-left:6px">· Sin carrera</span>`}
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:8px">
            ${done?`<span style="font-size:13px;font-weight:600;color:${result?.dnf?'#c0392b':'#4a8a2a'}">${result?.dnf?'DNF':'#'+(result?.pos||'?')}</span>`
                  :overdue?`<span style="font-size:12px;color:#bbb">⏱</span>`
                  :isCurrent&&race?`<span style="font-size:12px;color:#4a8a2a;font-weight:600">← Ahora</span>`:''}
            ${race?`<span style="font-size:11px;color:#bbb;display:inline-block;transition:transform .2s;transform:${isOpen?'rotate(90deg)':'rotate(0)'}">▶</span>`:''}
          </div>
        </div>
        ${race&&isOpen?`<div style="padding:0 14px 14px;border-top:1px solid #f0ede8">
          <div style="font-size:12px;color:#888;margin:8px 0 6px">${esc(race.location)} · €${race.cost} inscr. · €${race.prize} premio 1º</div>
          ${done?`<div style="font-size:13px;font-weight:600;color:${result?.dnf?'#c0392b':'#4a8a2a'}">${result?.dnf?'DNF — Retirado':'Posición #'+(result?.pos||'?')}${(result?.prize||0)>0?' · +€'+result.prize:''}</div>`
                :overdue?`<div style="font-size:13px;color:#bbb">⏱ Plazo superado — no se puede correr</div>`
                :canRace?`<button class="main" style="margin-top:6px;background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="cnStartRace(${idx})">Correr ahora →</button>`
                :d&&d.bond<30?`<div class="note" style="margin-top:6px">Vínculo insuficiente (${d.bond}/30)</div>`
                :`<div class="note" style="margin-top:6px">El perro no puede correr ahora</div>`}
        </div>`:''}
      </div>`;
    }).join('')
    :`<div class="hint">Ve a <strong>📅 Calendario</strong> para seleccionar tus carreras de temporada (oct–mar).</div>`}

    ${allRaceDone?`<button class="main" style="margin-top:12px;border-color:#4a8a2a;color:#2d7a2d" onclick="G.screen='canicrossSeasonBalance';render()">Cerrar temporada ${G.cnSeason} →</button>`:''}
  `;
}

// ── TAB: PERRO ────────────────────────────────────────
function renderCnPerroTab(){
  const el=document.getElementById('main');
  const d=G.dog;
  cnCheckBirthday();
  if(!d){el.innerHTML=`<div class="hint">Sin perro. Algo fue mal.</div>`;return;}

  const isOld=d.age>=6;
  const cmds=cnCommandsList();
  const breedInfo=CN_BREED_MODS[d.breed]||CN_BREED_MODS.mestizo;

  el.innerHTML=`
    <h2>🐕 ${esc(d.name)}</h2>
    <p class="sub">${breedInfo.label} · ${cnDogAgeLabel()} · ${d.retired?'<span style="color:#888">Retirado</span>':'<span style="color:#4a8a2a">Activo</span>'}</p>

    ${isOld?`<div class="warn">🦴 ${esc(d.name)} ya nota el paso del tiempo (${d.age} años). Su rendimiento puede empezar a decrecer.</div>`:''}
    ${d.injury?`<div class="danger">🤕 Lesión: <strong>${{almohadillas:'Almohadillas rozadas',luxacion:'Luxación',golpe_calor:'Golpe de calor'}[d.injury]||d.injury}</strong> · ${d.injuryRaces} carrera(s) de baja<br><span style="font-size:12px;color:#c0392b">Usa el veterinario para reducir la baja</span></div>`:''}
    ${!d.injury&&d.bond<30?`<div class="note">⚡ Vínculo insuficiente para competir. Necesita ≥30 (actual: <strong>${d.bond}</strong>). Entrena juntos.</div>`:''}

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Stats</div>
      ${[['Velocidad',d.speed,'#4a90d9'],['Resistencia',d.stamina,'#4a8a2a'],['Vínculo',d.bond,'#c07a10'],['Salud',d.health,'#e74c3c']].map(([l,v,c])=>`<div class="bar-row"><span class="bar-label">${l}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${Math.round(v)}%;background:${c}"></div></div><span class="bar-pct">${Math.round(v)}</span></div>`).join('')}
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Comandos aprendidos</div>
      ${cmds.map(c=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f5f4f0;font-size:14px"><span>${c.label}</span><span>${c.learned?'✅ Aprendido':'❌ Pendiente'}</span></div>`).join('')}
      <div class="text-hint" style="margin-top:6px">${cmds.every(c=>c.learned)?'¡'+esc(d.name)+' conoce todos los comandos! 🌟':'Entrena "Adiestramiento" para enseñar comandos (2 sesiones por comando).'}</div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Historial juntos</div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-label">Carreras</div><div class="stat-val">${d.races||0}</div></div>
        <div class="stat"><div class="stat-label">Km juntos</div><div class="stat-val">${d.kmTogether||0}</div></div>
        <div class="stat"><div class="stat-label">Vínculo máx.</div><div class="stat-val">${d.peakBond||0}</div></div>
      </div>
    </div>

    ${!d.retired?`
    <div class="section-label">Veterinario</div>
    <div class="grid-2" style="margin-bottom:12px">
      <button class="main" style="margin-top:0;font-size:13px;padding:10px 8px" onclick="cnCallVet('basic')" ${(d.injuryRaces||0)<=0?'disabled':''}>Revisión básica<br><span style="font-size:11px;color:#888">€50 · reduce baja</span></button>
      <button class="main" style="margin-top:0;font-size:13px;padding:10px 8px" onclick="cnCallVet('complete')" ${!d.injury?'disabled':''}>Tratamiento completo<br><span style="font-size:11px;color:#888">€120 · cura en 1 carrera</span></button>
    </div>
    ${(G.cnSeason||1)>1?`<button class="main" style="background:#fef9ec;border-color:#e8c97a;color:#c07a10" onclick="if(confirm('¿Retirar a '+${JSON.stringify(esc(d.name))}+'?'))cnRetireDog()">Retirar a ${esc(d.name)} voluntariamente</button>`:''}
    `:`<div class="note" style="margin-top:8px">${esc(d.name)} está retirado. <button class="secondary" onclick="cnNewDogAfterRetirement()">Adoptar nuevo perro →</button></div>`}
  `;
}

// ── TAB: EQUIPO ───────────────────────────────────────
function renderCnEquipoTab(){
  const el=document.getElementById('main');
  const owned=G.cnOwnedEquipment||{dogHarness:['basic_harness'],humanBelt:['basic_belt'],line:['basic_line']};
  const eq=G.equipment||{dogHarness:'basic_harness',humanBelt:'basic_belt',line:'basic_line'};

  const renderSection=(title,category)=>{
    const items=CANICROSS_EQUIPMENT[category]||[];
    return `<div class="fin-section">
      <div class="fin-title">${title}</div>
      ${items.map(item=>{
        const isOwned=(owned[category]||[]).includes(item.id);
        const isSelected=eq[category]===item.id;
        const canAfford=(G.cnMoney||0)>=item.price;
        return `<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid #f5f4f0">
          <div style="flex:1">
            <div style="font-size:14px;font-weight:${isSelected?'600':'400'}">${esc(item.name)}${item.default?' <span style="font-size:11px;color:#888">(inicio)</span>':''}</div>
            <div style="font-size:12px;color:#888">${esc(item.desc)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:10px">
            ${isOwned?
              `<label style="font-size:13px;display:flex;align-items:center;gap:5px;cursor:pointer"><input type="radio" name="eq-${category}" ${isSelected?'checked':''} onchange="cnSelectEquip('${category}','${item.id}')"> ${isSelected?'En uso':'Usar'}</label>`:
              item.default?'':
              `<button class="secondary" style="${!canAfford?'opacity:0.4;cursor:default':''}" onclick="${canAfford?`cnBuyEquip('${category}','${item.id}')`:'void 0'}">Comprar €${item.price}</button>`}
          </div>
        </div>`;}).join('')}
    </div>`;
  };

  el.innerHTML=`
    <h2>🎒 Equipo</h2>
    <p class="sub">El equipo activo aplica modificadores en carrera</p>
    <div style="background:#f5f4f0;border-radius:8px;padding:9px 14px;margin-bottom:14px">💰 Presupuesto disponible: <strong>€${G.cnMoney||0}</strong></div>
    ${renderSection('Arnés del perro','dogHarness')}
    ${renderSection('Cinturón del corredor','humanBelt')}
    ${renderSection('Línea de tiro','line')}
  `;
}

// ── TAB: CALENDARIO ───────────────────────────────────
function renderCnCalendarioTab(){
  const el=document.getElementById('main');
  const sel=G.cnSelectedRaces||[];
  const selIds=sel.map(r=>r.id);
  const MONTHS=[10,11,12,1,2,3];
  const MONTH_NAMES={10:'Octubre',11:'Noviembre',12:'Diciembre',1:'Enero',2:'Febrero',3:'Marzo'};
  const doneIds=(G.cnRaceResults||[]).filter(r=>r.season===G.cnSeason).map(r=>r.raceId);
  const curMonth=cnCurrentMonth();
  const mIdx=m=>MONTHS.indexOf(m);

  if(!sel.length){
    const byMonth={};
    CANICROSS_RACES.forEach(r=>{if(!byMonth[r.month])byMonth[r.month]=[];byMonth[r.month].push(r);});
    el.innerHTML=`
      <h2>📅 Calendario</h2>
      <p class="sub">Temporada oct–mar · Máximo 5 carreras</p>
      <div class="note" style="margin-bottom:12px">Seleccionadas: <strong>${selIds.length}/5</strong> · Inscripciones: €${CANICROSS_RACES.filter(r=>selIds.includes(r.id)).reduce((a,r)=>a+(r.cost||0),0)}</div>
      ${MONTHS.map(m=>{
        const races=(byMonth[m]||[]);
        if(!races.length)return'';
        const tierIcon=['','🟢','🟡','🟠','🔴'];
        return`<div class="section-label">${MONTH_NAMES[m]}</div>
        ${races.map(r=>{
          const isSel=selIds.includes(r.id);
          return`<div class="race-card ${isSel?'sel':''}" onclick="cnToggleRace('${r.id}')">
            <div class="flex-between">
              <div>
                <div class="card-title">${esc(r.name)}</div>
                <div class="card-sub">${esc(r.location)} · ${r.km}km</div>
                <div style="margin-top:4px;font-size:12px">${tierIcon[r.tier]||''} Tier ${r.tier} · €${r.cost} inscr. · €${r.prize} premio 1º</div>
              </div>
              ${isSel?`<span style="color:#4a8a2a;font-size:20px;font-weight:700;margin-left:8px;flex-shrink:0">✓</span>`:''}
            </div>
          </div>`;}).join('')}`;}).join('')}
      <button class="main" style="margin-top:10px" onclick="cnConfirmCalendar()">Confirmar calendario →</button>
    `;
  } else {
    el.innerHTML=`
      <h2>📅 Calendario confirmado</h2>
      <p class="sub">Temporada ${G.cnSeason||1} · Semana ${G.cnWeek||0}</p>
      <div style="border-radius:10px;overflow:hidden;border:1px solid #e8e6e0;margin-bottom:14px">
      ${MONTHS.map(m=>{
        const race=sel.find(r=>r.month===m);
        const mName=MONTH_NAMES[m];
        const isCurrent=m===curMonth;
        const isPast=mIdx(m)<mIdx(curMonth);
        const bg=isCurrent?'#f0f7f0':isPast?'#fafaf8':'#fff';
        const monthColor=isCurrent?'#2d7a2d':isPast?'#aaa':'#555';
        if(!race){
          return`<div style="display:flex;align-items:center;padding:11px 14px;border-bottom:1px solid #f0ede8;background:${bg}">
            <div style="min-width:80px;font-size:13px;font-weight:600;color:${monthColor}">${mName}</div>
            <div style="font-size:13px;color:#ccc;font-style:italic">Sin carrera</div>
          </div>`;
        }
        const isDone=doneIds.includes(race.id);
        const result=(G.cnRaceResults||[]).find(r=>r.raceId===race.id&&r.season===G.cnSeason);
        const overdue=isPast&&!isDone;
        return`<div style="padding:11px 14px;border-bottom:1px solid #f0ede8;background:${bg}">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <div style="min-width:80px;font-size:13px;font-weight:600;color:${monthColor};padding-top:2px">${mName}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:600;${overdue?'color:#bbb':''}">${esc(race.name)}</div>
              <div style="font-size:12px;color:#888">${esc(race.location)} · ${race.km}km · Tier ${race.tier}</div>
              ${isDone&&result?`<div style="margin-top:3px;font-size:13px;font-weight:600;color:${result.dnf?'#c0392b':'#4a8a2a'}">${result.dnf?'DNF':'#'+result.pos}${(result.prize||0)>0?' · +€'+result.prize:''}</div>`:
                overdue?`<div style="margin-top:3px;font-size:12px;color:#bbb">⏱ Plazo superado</div>`:
                isCurrent?`<div style="margin-top:3px;font-size:12px;color:#4a8a2a;font-weight:600">← Mes actual</div>`:''}
            </div>
          </div>
        </div>`;}).join('')}
      </div>
      <button class="secondary" style="font-size:12px" onclick="if(confirm('¿Reiniciar el calendario? Perderás las carreras seleccionadas.')){G.cnSelectedRaces=[];render()}">Reiniciar selección</button>
    `;
  }
}

// ── TAB: FINANZAS ─────────────────────────────────────
function renderCnFinanzasTab(){
  const el=document.getElementById('main');
  const prizeTotal=(G.cnRaceResults||[]).filter(r=>r.season===G.cnSeason).reduce((a,r)=>a+(r.prize||0),0);
  const inscCost=(G.cnSelectedRaces||[]).reduce((a,r)=>a+(r.cost||0),0);
  const dogMonthly=cnMonthlyDogCost();
  const seasonResults=(G.cnRaceResults||[]).filter(r=>r.season===G.cnSeason);

  el.innerHTML=`
    <h2>💰 Finanzas</h2>
    <p class="sub">Temporada ${G.cnSeason||1}</p>

    <div class="fin-section">
      <div class="fin-title">Balance</div>
      <div class="fin-row"><span>Presupuesto actual</span><span class="plus">€${G.cnMoney||0}</span></div>
      <div class="fin-row"><span>Premios cobrados</span><span class="${prizeTotal>0?'plus':'neutral'}">€${prizeTotal}</span></div>
      <div class="fin-row"><span>Inscripciones</span><span class="minus">-€${inscCost}</span></div>
    </div>

    <div class="fin-section">
      <div class="fin-title">Gastos del perro (mensual)</div>
      <div class="fin-row"><span>Manutención básica</span><span class="minus">-€40/mes</span></div>
      <div class="fin-row">
        <div style="flex:1"><span>Manutención premium</span><div style="font-size:11px;color:#888">+5 energía en carrera</div></div>
        <div style="display:flex;align-items:center;gap:8px"><span class="minus">-€30/mes</span><button class="secondary" style="font-size:12px;flex-shrink:0" onclick="G.cnDogFoodPremium=!G.cnDogFoodPremium;autoSave();render()">${G.cnDogFoodPremium?'✅ Activo':'Activar'}</button></div>
      </div>
      <div class="fin-row">
        <div style="flex:1"><span>Suplementos</span><div style="font-size:11px;color:#888">+1 resistencia/sem perro</div></div>
        <div style="display:flex;align-items:center;gap:8px"><span class="minus">-€25/mes</span><button class="secondary" style="font-size:12px;flex-shrink:0" onclick="G.cnDogSupplements=!G.cnDogSupplements;autoSave();render()">${G.cnDogSupplements?'✅ Activo':'Activar'}</button></div>
      </div>
      <div class="fin-row tot"><span>Total/mes perro</span><span class="minus">-€${dogMonthly}/mes</span></div>
    </div>

    ${(G.cnVetHistory||[]).length>0?`
    <div class="fin-section">
      <div class="fin-title">Historial veterinario</div>
      ${G.cnVetHistory.map(v=>`<div class="fin-row"><span>${{basic:'Revisión básica',complete:'Tratamiento completo'}[v.type]||v.type} · T${v.season||1}</span><span class="minus">-€${v.cost}</span></div>`).join('')}
    </div>`:''}

    ${seasonResults.length>0?`
    <div class="fin-section">
      <div class="fin-title">Resultados de la temporada</div>
      ${seasonResults.map(r=>`<div class="fin-row"><span>${esc(r.raceName||'')}</span><span class="${(r.prize||0)>0?'plus':'neutral'}">${r.dnf?'DNF':'#'+(r.pos||'—')}${(r.prize||0)>0?' · +€'+r.prize:''}</span></div>`).join('')}
    </div>`:''}
  `;
}

// ── RACE SCREENS ──────────────────────────────────────
function renderCanicrossPreRace(){
  const el=document.getElementById('main');
  const race=(G.cnSelectedRaces||[])[G.cnCurrentRaceIdx];
  if(!race){G.screen='canicrossHub';G.activeTab='game';render();return;}
  const d=G.dog;
  const eq=G.equipment||{};
  const harness=(CANICROSS_EQUIPMENT.dogHarness||[]).find(e=>e.id===eq.dogHarness)||{name:'—'};
  const belt=(CANICROSS_EQUIPMENT.humanBelt||[]).find(e=>e.id===eq.humanBelt)||{name:'—'};
  const line=(CANICROSS_EQUIPMENT.line||[]).find(e=>e.id===eq.line)||{name:'—'};
  const mods=cnGetEquipMods();

  el.innerHTML=`
    <h2>🐕 Pre-carrera</h2>
    <p class="sub">${esc(race.name)} · ${race.km}km · ${esc(race.location)}</p>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Estado del equipo</div>
      <div class="flex-between-center" style="margin-bottom:6px">
        <span style="font-size:14px">🏃 ${esc(G.runner.name||'Corredor')}</span>
        <span style="color:#4a8a2a;font-size:13px">Listo ✓</span>
      </div>
      ${d?`<div class="flex-between-center">
        <span style="font-size:14px">🐕 ${esc(d.name)}</span>
        <span style="color:${d.bond>=30?'#4a8a2a':'#c0392b'};font-size:13px">Vínculo ${d.bond}/100</span>
      </div>`:''}
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Equipo activo</div>
      <div style="font-size:13px;color:#555;margin-bottom:3px">Arnés: ${esc(harness.name)}</div>
      <div style="font-size:13px;color:#555;margin-bottom:3px">Cinturón: ${esc(belt.name)}</div>
      <div style="font-size:13px;color:#555">Línea: ${esc(line.name)}</div>
      ${mods.speedMod||mods.staminaMod?`<div class="text-ok" style="margin-top:4px">Bonificadores: ${[mods.speedMod?'+'+mods.speedMod+' vel':null,mods.staminaMod?(mods.staminaMod>0?'+':'')+mods.staminaMod+' res':null].filter(Boolean).join(' · ')}</div>`:''}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="sec-title-sm">Información de la carrera</div>
      <div style="font-size:13px;color:#555">Distancia: ${race.km}km · Tier ${race.tier}</div>
      <div style="font-size:13px;color:#555">Inscripción: €${race.cost} · Premio 1º: €${race.prize}</div>
      ${race.month===12||race.month===1?`<div style="font-size:12px;color:#4a90d9;margin-top:3px">❄️ Carrera invernal — posibles eventos de nieve</div>`:''}
    </div>

    ${(()=>{
      const rs=G.cnRaceState;
      if(!rs?.segs?.length)return'';
      const tCol={flat:'#888780',climb:'#639922',descent:'#E24B4A'};
      const tBg={flat:'#F1EFE8',climb:'#EAF3DE',descent:'#FCEBEB'};
      const tLabel={flat:'▶ Llano',climb:'▲ Subida',descent:'▼ Bajada'};
      return`<div class="card" style="margin-bottom:16px">
        <div class="sec-title-sm">Recorrido — ${rs.segs.length} tramos</div>
        ${rs.segs.map((s,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:${i<rs.segs.length-1?'1px solid #f5f4f0':'none'}">
          <div style="min-width:18px;font-size:12px;font-weight:600;color:#aaa">${i+1}</div>
          <div style="padding:2px 8px;border-radius:5px;background:${tBg[s.type]};font-size:12px;font-weight:600;color:${tCol[s.type]};white-space:nowrap">${tLabel[s.type]}</div>
          <div style="flex:1;font-size:13px">${esc(s.name)}</div>
          <div style="font-size:12px;color:#888;white-space:nowrap">${s.km}km${s.gain>0?' +'+s.gain+'m':s.gain<0?' '+s.gain+'m':''}</div>
        </div>`).join('')}
        <div style="font-size:12px;color:#888;margin-top:8px">Rivales: ${rs.rivals?.length||0} equipos</div>
      </div>`;
    })()}

    ${G.cnDogFoodPremium?`<div class="note" style="margin-bottom:12px">🥩 Manutención premium: +5 energía en carrera</div>`:''}

    <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="cnGoToRace()">¡A correr! 🐕 →</button>
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="G.screen='canicrossHub';G.activeTab='game';render()">← Volver</button>`;
}

function renderCanicrossSegment(){
  const el=document.getElementById('main');
  const rs=G.cnRaceState;
  if(!rs||rs.done){G.screen='canicrossHub';G.activeTab='game';render();return;}
  const race=(G.cnSelectedRaces||[])[G.cnCurrentRaceIdx];
  if(!race){G.screen='canicrossHub';G.activeTab='game';render();return;}
  const d=G.dog;
  const seg=rs.segs?.[rs.currentSeg];
  const kmDone=Math.round((race.km||8)*rs.currentSeg/rs.numSegs*10)/10;
  const kmLeft=Math.round(((race.km||8)-kmDone)*10)/10;
  const pct=Math.round(rs.currentSeg/rs.numSegs*100);
  const isLastSeg=rs.currentSeg+1>=rs.numSegs;
  const ev=rs.pendingEvent;
  const curBond=Math.max(0,Math.min(100,(rs.dogBond||0)+(rs.bondDelta||0)));

  const evBg={pos:'#eaf4ea',neg:'#fef0f0',special:'#fef9ec',rare:'#f0f6ff'}[ev?.eventType]||'#f5f4f0';
  const evBorder={pos:'#b8ddb8',neg:'#f5b8b8',special:'#e8c97a',rare:'#b8d4f0'}[ev?.eventType]||'#e8e6e0';

  const segTypeLabel={flat:'▶ Llano',climb:'▲ Subida',descent:'▼ Bajada'}[seg?.type||'flat'];
  const segTypeCol={flat:'#888780',climb:'#639922',descent:'#E24B4A'}[seg?.type||'flat'];
  const segTypeBg={flat:'#F1EFE8',climb:'#EAF3DE',descent:'#FCEBEB'}[seg?.type||'flat'];

  const livePos=cnLivePosition(rs);
  const posCol=livePos.pos===1?'#c07a10':livePos.pos<=3?'#4a8a2a':livePos.pos<=Math.ceil(livePos.total*0.4)?'#555':'#aaa';
  const posLabel=livePos.pos===1?'🥇 Líder':livePos.pos===2?'🥈 2.º':livePos.pos===3?'🥉 3.º':livePos.pos<=Math.ceil(livePos.total*0.4)?'Top pelotón':'Pelotón';

  const lastLogEntry=rs.eventLog?.length>0&&!ev?rs.eventLog[rs.eventLog.length-1]:null;

  el.innerHTML=`
    <div class="flex-between-center" style="margin-bottom:10px">
      <span style="font-size:12px;color:#999">${esc(race.name)} · Tramo ${rs.currentSeg+1}/${rs.numSegs}</span>
      <span style="font-size:13px;font-weight:600">${fmt((rs.time||0)+(rs.timePenalty||0))}</span>
    </div>

    <div class="prog-wrap" style="margin-bottom:10px">
      <div class="prog-meta"><span>${kmDone}km hechos</span><span>${kmLeft}km restantes</span></div>
      <div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div>
    </div>

    <div class="card" style="margin-bottom:10px">
      ${[['Vínculo',curBond,'#c07a10'],['Salud '+esc(d?.name||'perro'),rs.dogHealth||100,'#e74c3c'],['Energía corredor',rs.runnerEnergy||100,'#4a8a2a']].map(([l,v,c])=>`<div class="bar-row"><span class="bar-label" style="color:${v<25?'#c0392b':'#666'}">${l}${v<25?' ⚠':''}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${Math.round(Math.max(0,v))}%;background:${c}"></div></div><span class="bar-pct">${Math.round(Math.max(0,v))}</span></div>`).join('')}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 13px;background:#f8f7f3;border-radius:8px;margin-bottom:10px">
      <div>
        <span style="font-size:14px;font-weight:700;color:${posCol}">#${livePos.pos}</span>
        <span style="font-size:12px;color:#888"> de ${livePos.total} equipos</span>
      </div>
      <span style="font-size:12px;color:${posCol};font-weight:600">${posLabel}</span>
    </div>

    ${seg?`<div style="padding:9px 13px;border-left:3px solid ${segTypeCol};background:${segTypeBg};border-radius:0 8px 8px 0;margin-bottom:10px">
      <div style="font-size:13px;font-weight:600;color:${segTypeCol}">${segTypeLabel} — ${esc(seg.name)}</div>
      <div style="font-size:12px;color:#777">${seg.km}km${seg.gain>0?` · +${seg.gain}m desnivel`:seg.gain<0?` · ${seg.gain}m desnivel`:' · llano'}</div>
    </div>`:''}

    ${lastLogEntry?(()=>{
      const lev=lastLogEntry.event||{};
      const bg={pos:'#eaf4ea',neg:'#fef0f0',special:'#fef9ec',rare:'#f0f6ff'}[lev.eventType]||'#f5f4f0';
      const border={pos:'#b8ddb8',neg:'#f5b8b8',special:'#e8c97a',rare:'#b8d4f0'}[lev.eventType]||'#e8e6e0';
      const label={pos:'✨ Evento positivo',neg:'⚡ Evento',special:'🌟 Especial',rare:'💫 Raro'}[lev.eventType]||'📍 Evento';
      return`<div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:12px;margin-bottom:10px"><div style="font-size:12px;color:#888;margin-bottom:3px">${label}</div><div style="font-size:14px;font-weight:600">${cnReplaceVars(lev.text||'')}</div></div>`;
    })():''}

    ${ev?`<div style="background:${evBg};border:1px solid ${evBorder};border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:600;margin-bottom:10px">${cnReplaceVars(ev.text||'')}</div>
      ${(ev.options||[]).map((opt,i)=>`<button class="main" style="margin-top:6px;font-size:13px" onclick="cnMakeDecision(${i})">${esc(opt.label)}</button>`).join('')}
    </div>`:''}

    ${!rs.paceChosen&&!ev?`
    <div class="section-label">Elige el ritmo del tramo:</div>
    <div class="pace-grid">
      ${CN_PACES.map(p=>{
        const basePace=rs.basePace||390;
        const kmPerSeg=(rs.km||8)/rs.numSegs;
        const speedFactor=Math.max(0.7,Math.min(1.3,(d?.speed||50)/50));
        let tm=Math.round(basePace*kmPerSeg*p.timeMult/speedFactor);
        if(seg?.type==='climb')tm=Math.round(tm*1.15);
        if(seg?.type==='descent')tm=Math.round(tm*0.88);
        const mins=Math.floor(tm/60);const secs=tm%60;
        const timeStr=mins+'m'+(secs>0?' '+secs+'s':'');
        const dogWarn=p.dogCost>14&&(rs.dogHealth||100)<35?`<div style="font-size:11px;color:#c0392b;margin:3px 0">⚠ ${esc(d?.name||'perro')} al límite</div>`:'';
        const bondBadge=p.bondMod>0?`<span style="font-size:11px;color:#4a8a2a">vínculo +${p.bondMod}</span>`:p.bondMod<0?`<span style="font-size:11px;color:#c07a10">vínculo ${p.bondMod}</span>`:'';
        return`<div class="pace" onclick="cnChoosePace('${p.id}')">
          <div class="pace-label">${p.label}</div>
          <div class="pace-desc">${p.desc}</div>
          ${dogWarn}
          <div class="pace-meta">
            <div style="display:flex;flex-direction:column;gap:2px">${bondBadge}<span style="font-size:11px;color:#aaa">−${p.energyCost} energía · −${p.dogCost} salud</span></div>
            <span>~${timeStr}</span>
          </div>
        </div>`;}).join('')}
    </div>`:''}

    ${rs.paceChosen&&!ev?`<button class="main" style="${isLastSeg||rs.retired?'background:#1a1a1a;color:#fff;border-color:#1a1a1a':''}" onclick="${rs.retired?'cnFinishRace()':'cnNextSegment()'}">${isLastSeg||rs.retired?'Terminar carrera 🏁':'Siguiente tramo →'}</button>`:''}

    ${(rs.bondDelta||0)!==0?`<div style="font-size:12px;color:#888;text-align:center;margin-top:10px">Vínculo acumulado: <span style="color:${(rs.bondDelta||0)>=0?'#4a8a2a':'#c0392b'};font-weight:600">${(rs.bondDelta||0)>=0?'+':''}${rs.bondDelta||0}</span></div>`:''}
  `;
}

function renderCanicrossPostRace(){
  const el=document.getElementById('main');
  const rs=G.cnRaceState;
  if(!rs||!rs.done){G.screen='canicrossHub';G.activeTab='game';render();return;}
  const d=G.dog;
  const races=G.cnSelectedRaces||[];
  const doneIds=(G.cnRaceResults||[]).filter(r=>r.season===G.cnSeason).map(r=>r.raceId);
  const remaining=races.filter(r=>!doneIds.includes(r.id));
  const seasonDone=remaining.length===0;

  el.innerHTML=`
    <h2>🏁 Post-carrera</h2>
    <p class="sub">${esc(rs.raceName||'')}</p>

    <div class="finish-time" style="margin-bottom:14px">
      <div class="label">${rs.retired?'Tiempo al retiro':'Tiempo final'}</div>
      <div class="val">${rs.retired?'DNF':fmt(rs.finalTime||0)}</div>
    </div>

    ${!rs.retired?`<div class="card" style="margin-bottom:12px">
      <div class="stat-grid">
        <div class="stat"><div class="stat-label">Posición</div><div class="stat-val">#${rs.finalPos||'—'}</div></div>
        <div class="stat"><div class="stat-label">Premio</div><div class="stat-val" style="color:${(rs.finalPrize||0)>0?'#2d7a2d':'#1a1a1a'}">€${rs.finalPrize||0}</div></div>
        <div class="stat"><div class="stat-label">Vínculo</div><div class="stat-val" style="color:${(rs.bondDelta||0)>=0?'#4a8a2a':'#c0392b'}">${(rs.bondDelta||0)>=0?'+':''}${rs.bondDelta||0}</div></div>
      </div>
    </div>`:''}

    ${d?`<div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Estado de ${esc(d.name)} tras la carrera</div>
      ${[['Vínculo',d.bond,'#c07a10'],['Salud',d.health,'#e74c3c']].map(([l,v,c])=>`<div class="bar-row"><span class="bar-label">${l}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${Math.round(v)}%;background:${c}"></div></div><span class="bar-pct">${Math.round(v)}</span></div>`).join('')}
      ${d.injury?`<div class="danger" style="margin-top:8px">🤕 Lesión: ${d.injury} · ${d.injuryRaces} carrera(s) de baja</div>`:''}
    </div>`:''}

    ${rs.eventLog&&rs.eventLog.length>0?`<div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Eventos de la carrera</div>
      ${rs.eventLog.slice(-4).map(e=>`<div class="event-box" style="margin-bottom:6px">${cnReplaceVars((e.event||{}).text||'')}</div>`).join('')}
    </div>`:''}

    ${seasonDone?
      `<button class="main" style="border-color:#4a8a2a;color:#2d7a2d" onclick="G.screen='canicrossSeasonBalance';render()">Cerrar temporada ${G.cnSeason} →</button>`:
      `<button class="main" onclick="G.screen='canicrossHub';G.activeTab='game';render()">Continuar temporada →</button>`}`;
}

function renderCnSeasonBalance(){
  const el=document.getElementById('main');
  const results=(G.cnRaceResults||[]).filter(r=>r.season===G.cnSeason);
  const d=G.dog;
  const totalPrize=results.reduce((a,r)=>a+(r.prize||0),0);
  const wins=results.filter(r=>r.pos===1).length;
  const podiums=results.filter(r=>r.pos&&r.pos<=3).length;
  const bondGain=results.reduce((a,r)=>a+(r.bondDelta||0),0);

  el.innerHTML=`
    <h2>📊 Fin de temporada ${G.cnSeason||1}</h2>
    <p class="sub">${esc(G.runner.name||'Corredor')} &amp; ${d?esc(d.name):'—'}</p>

    <div class="card" style="margin-bottom:12px">
      <div class="stat-grid">
        <div class="stat"><div class="stat-label">Carreras</div><div class="stat-val">${results.length}</div></div>
        <div class="stat"><div class="stat-label">Victorias</div><div class="stat-val">${wins}</div></div>
        <div class="stat"><div class="stat-label">Podios</div><div class="stat-val">${podiums}</div></div>
      </div>
    </div>

    <div class="fin-section">
      <div class="fin-title">Economía</div>
      <div class="fin-row"><span>Premios cobrados</span><span class="plus">+€${totalPrize}</span></div>
      <div class="fin-row"><span>Presupuesto final</span><span class="${(G.cnMoney||0)>=0?'plus':'minus'}">€${G.cnMoney||0}</span></div>
    </div>

    ${d?`<div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">🐕 ${esc(d.name)} · Temporada ${G.cnSeason}</div>
      ${[['Vínculo',d.bond,'#c07a10'],['Velocidad',d.speed,'#4a90d9'],['Resistencia',d.stamina,'#4a8a2a'],['Salud',d.health,'#e74c3c']].map(([l,v,c])=>`<div class="bar-row"><span class="bar-label">${l}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${Math.round(v)}%;background:${c}"></div></div><span class="bar-pct">${Math.round(v)}</span></div>`).join('')}
      <div style="font-size:12px;color:#888;margin-top:8px">Vínculo máximo: ${d.peakBond||0} · Km juntos: ${d.kmTogether||0} · Vínculo ganado esta temporada: ${bondGain>=0?'+':''}${bondGain}</div>
      ${(d.age||1)>=5?`<div class="warn" style="margin-top:8px">🦴 ${esc(d.name)} tendrá ${(d.age||1)+1} años la próxima temporada. Considera su bienestar.</div>`:''}
    </div>`:''}

    <button class="main" style="background:#1a1a1a;color:#fff;border-color:#1a1a1a" onclick="cnEndSeason()">Comenzar temporada ${(G.cnSeason||1)+1} →</button>`;
}

function renderCnDogRetirement(){
  const el=document.getElementById('main');
  const d=G.dog;if(!d)return;
  const seasons=(G.cnSeason||1)-(d.birthSeason||1);

  el.innerHTML=`
    <div style="text-align:center;padding:30px 0 20px">
      <div style="font-size:52px;margin-bottom:12px">🐕</div>
      <h2>Adiós, ${esc(d.name)}</h2>
    </div>
    <div class="card" style="margin-bottom:16px;background:#f8f7f3">
      <p style="font-size:15px;line-height:1.8;color:#444">${esc(d.name)} corrió contigo <strong>${seasons}</strong> temporada${seasons!==1?'s':''}, <strong>${d.races||0}</strong> carrera${(d.races||0)!==1?'s':''} y <strong>${d.kmTogether||0} km</strong> juntos.</p>
      <p style="font-size:14px;color:#666;margin-top:8px">Vínculo máximo alcanzado: <strong>${d.peakBond||0}</strong>.</p>
      <p style="font-size:13px;color:#aaa;margin-top:10px;font-style:italic">"Algunos compañeros se convierten en parte de ti. ${esc(d.name)} siempre lo será."</p>
    </div>
    <button class="main" onclick="cnNewDogAfterRetirement()">Adoptar un nuevo compañero →</button>
    <button class="main" style="margin-top:6px;opacity:0.5" onclick="cnDoSeasonTransition()">Continuar sin perro (categoría individual)</button>`;
}

function renderCnDogDeath(){
  const el=document.getElementById('main');
  const d=G.dog;
  el.innerHTML=`
    <div style="text-align:center;padding:28px 0 18px">
      <div style="font-size:48px;margin-bottom:12px">🕯️</div>
      <h2 style="color:#555">${d?esc(d.name):''}</h2>
    </div>
    <div class="card" style="margin-bottom:16px">
      <p style="font-size:14px;line-height:1.7;color:#555">La salud de ${d?esc(d.name):''} llegó a cero. ${d?esc(d.name):''} ya no está.</p>
      <p style="font-size:13px;color:#888;margin-top:8px">Puedes continuar adoptando un nuevo perro. El vínculo empezará desde cero.</p>
    </div>
    <button class="main" onclick="cnNewDogAfterRetirement()">Adoptar nuevo perro →</button>`;
}

function renderCnDisplasia(){
  const el=document.getElementById('main');
  const d=G.dog;if(!d)return;
  el.innerHTML=`
    <h2>🩺 Diagnóstico veterinario</h2>
    <p class="sub">${esc(d.name)}</p>
    <div class="danger" style="margin-bottom:14px">El veterinario detecta <strong>displasia de cadera</strong> en ${esc(d.name)}. Necesitas tomar una decisión.</div>
    <div class="card work-card" style="cursor:pointer;margin-bottom:8px" onclick="cnResolveDislasia('treat')">
      <div class="card-title">💊 Tratamiento intensivo — €300</div>
      <div class="card-sub">Permite 1-2 temporadas más. Stats -15%.</div>
    </div>
    <div class="card work-card" style="cursor:pointer;margin-bottom:8px" onclick="cnResolveDislasia('retire')">
      <div class="card-title">🐕 Retiro tranquilo</div>
      <div class="card-sub">Una vida plena fuera de la competición. La opción más justa para él.</div>
    </div>
    <div class="card work-card" style="cursor:pointer;border-color:#f5b8b8" onclick="cnResolveDislasia('ignore')">
      <div class="card-title" style="color:#c0392b">⚠ Ignorar y seguir</div>
      <div class="card-sub">1 temporada más. Health -5/mes. El perro nota que no le cuidas (-vínculo).</div>
    </div>`;
}
