const WORK_OPTIONS=[
  {pct:100,label:'Jornada completa',hours:40,income:150,trainingH:5,
   desc:'Máximo dinero. Casi sin tiempo para entrenar.'},
  {pct:80, label:'Jornada reducida (80%)',hours:32,income:120,trainingH:10,
   desc:'Buen equilibrio los primeros años.'},
  {pct:60, label:'Media jornada (60%)',hours:24,income:90,trainingH:16,
   desc:'Justo cubres gastos. Más tiempo de entreno.'},
  {pct:40, label:'Jornada parcial (40%)',hours:16,income:60,trainingH:22,
   desc:'Pierdes dinero cada mes. Necesitas sponsors.'},
  {pct:0,  label:'Profesional (sin trabajo)',hours:0,income:0,trainingH:32,
   desc:'Solo viable si sponsors + premios cubren tus gastos.'},
];
const FIXED_COSTS={rent:60,food:20,transport:8,gear:7,total:95};// por mes (escala juego)

const SEASON_OBJECTIVES=[
  {
    id:'wins3',
    label:'🏆 Ganar 3 carreras',
    desc:'Demuestra que eres competitivo en este nivel',
    target:'wins',
    value:3,
    reward:300
  },
  {
    id:'top10',
    label:'📈 Top 10 global',
    desc:'Escala en el ranking nacional',
    target:'ranking',
    value:10,
    reward:400
  },
  {
    id:'savings1000',
    label:'💰 Ahorrar €1.000',
    desc:'Gestión financiera a largo plazo',
    target:'money',
    value:1000,
    reward:200
  }
];

const ACHIEVEMENTS=[
  // ── Generales por carreras ──
  {id:'runner_5',    label:'Primeros pasos',       desc:'Completar 5 carreras',                   check:()=>G.careerHistory.length>=5},
  {id:'runner_25',   label:'Maratoniano de montaña',desc:'Completar 25 carreras',                 check:()=>G.careerHistory.length>=25},
  {id:'runner_50',   label:'Veterano de verdad',    desc:'Completar 50 carreras',                 check:()=>G.careerHistory.length>=50},
  // ── Victorias y podios ──
  {id:'win_1',       label:'Primera victoria',      desc:'Ganar una carrera',                     check:()=>G.careerHistory.filter(h=>h.pos===1).length>=1},
  {id:'win_5',       label:'Campeón en serie',      desc:'Ganar 5 carreras',                      check:()=>G.careerHistory.filter(h=>h.pos===1).length>=5},
  {id:'win_10',      label:'Dominador',             desc:'Ganar 10 carreras',                     check:()=>G.careerHistory.filter(h=>h.pos===1).length>=10},
  {id:'podium_3',    label:'Primer podio',          desc:'Lograr 3 podios (top 3)',               check:()=>G.careerHistory.filter(h=>h.pos<=3).length>=3},
  {id:'podium_10',   label:'Consagrado',            desc:'Lograr 10 podios',                      check:()=>G.careerHistory.filter(h=>h.pos<=3).length>=10},
  // ── Distancias / km ──
  {id:'distance_100',label:'Centenario',            desc:'Acumular 100 km en carrera',            check:()=>(G.totalCareerKm||0)>=100},
  {id:'distance_500',label:'Ultra leguas',          desc:'Acumular 500 km en carrera',            check:()=>(G.totalCareerKm||0)>=500},
  {id:'distance_1000',label:'Mil kms',             desc:'Acumular 1.000 km a lo largo de tu carrera', check:()=>(G.totalCareerKm||0)>=1000},
  {id:'ultra_finisher',label:'Ultra finisher',     desc:'Terminar una carrera de 40 km o más',   check:()=>G.careerHistory.some(h=>{const r=[...RACES_DB,...(Object.values(SPEC_RACES).flat())];return r.find(x=>x.name===h.name)?.km>=40;})},
  // ── Ranking ──
  {id:'top_50',      label:'Ranking Top 50',        desc:'Alcanzar ranking #50 o mejor',          check:()=>G.ranking<=50},
  {id:'top_10',      label:'Ranking Top 10',        desc:'Alcanzar ranking #10 o mejor',          check:()=>G.ranking<=10},
  {id:'top_1',       label:'Número 1',              desc:'Alcanzar el ranking #1',                check:()=>G.ranking<=1},
  {id:'spec_top10',  label:'Top 10 de tu especialidad', desc:'Alcanzar el ranking #10 en tu especialidad', check:()=>G.specRanking<=10},
  // ── Financieros ──
  {id:'wealthy',     label:'Financieramente estable',desc:'Ahorrar €5.000',                       check:()=>G.money>=5000},
  {id:'rich',        label:'El corredor millonario', desc:'Ahorrar €20.000',                      check:()=>G.money>=20000},
  {id:'sponsor_4',   label:'Totalmente patrocinado', desc:'Tener los 4 sponsors simultáneos',     check:()=>Object.values(G.sponsors).filter(Boolean).length>=4},
  // ── Temporadas ──
  {id:'year_3',      label:'En rodaje',             desc:'Completar 3 temporadas',                check:()=>G.year>=3},
  {id:'year_5',      label:'Veterano',              desc:'Completar 5 temporadas',                check:()=>G.year>=5},
  {id:'year_8',      label:'Leyenda local',         desc:'Completar 8 temporadas',                check:()=>G.year>=8},
  // ── Especiales ──
  {id:'perfect_season',label:'Temporada perfecta',  desc:'Ganar 3+ carreras sin lesionarse en un año', check:()=>{
    const seasonWins=G.careerHistory.filter(h=>h.year===G.year&&h.pos===1).length;
    const seasonInjuries=(G.injuryHistory||[]).filter(i=>i.year===G.year).length;
    return seasonWins>=3&&seasonInjuries===0;
  }},
  {id:'no_abandon',  label:'Nunca te rindas',       desc:'Terminar 10 carreras consecutivas sin abandono', check:()=>(G.raceFinishedCount||0)>=10&&(G.raceAbandonedCount||0)===0},
  {id:'survived_storm',label:'Superviviente de tormenta', desc:'Terminar una carrera con tormenta activa', check:()=>(G.stormSurvivedCount||0)>=1},
  {id:'fair_play',   label:'Fair play total',       desc:'Tomar 3 decisiones honestas en carrera',check:()=>(G.fairPlayCount||0)>=3},
  {id:'fame_1k',     label:'Micro-influencer',      desc:'Llegar a 1.000 seguidores',             check:()=>(G.followers||0)>=1000},
  {id:'fame_10k',    label:'Referente del trail',   desc:'Llegar a 10.000 seguidores',            check:()=>(G.followers||0)>=10000},
  {id:'no_injury',   label:'Cuerpo de hierro',      desc:'Completar una temporada completa sin lesionarse', check:()=>{
    const thisYearInjuries=(G.injuryHistory||[]).filter(i=>i.year===G.year).length;
    return G.raceResults.length>=3&&thisYearInjuries===0;
  }},
  {id:'comeback',    label:'El regreso',            desc:'Ganar una carrera después de una lesión grave', check:()=>{
    const hadBigInjury=(G.injuryHistory||[]).some(i=>i.type==='fractura'||i.type==='rotura');
    const hasWin=G.careerHistory.some(h=>h.pos===1);
    return hadBigInjury&&hasWin;
  }},
];

function trainingEffFromH(h){
  if(h<=5) return 0.50;
  if(h<=10)return 0.65;
  if(h<=16)return 0.80;
  if(h<=22)return 0.90;
  return 1.00;
}

const RACES_DB=[
  {id:'pinar',    name:'Trail Mágina',             type:'20K local',   km:20, cost:30,  prize:60,   reqRanking:999, desnivel:'1.200m+',weather_risk:0.10, month:1, monthName:'Enero',      quarter:1, tier:'local',
   segs:[{name:'Llano Salida',km:4,type:'flat',gain:0,base:1100},{name:'Subida Pinar',km:5,type:'climb',gain:600,base:1900},{name:'Cresta',km:4,type:'flat',gain:0,base:1300,aid:true},{name:'Bajada',km:4,type:'descent',gain:-600,base:1300},{name:'Sprint',km:3,type:'flat',gain:0,base:800}]},
  {id:'febrero',  name:'La Pedriza Trail',        type:'25K regional',km:25, cost:40,  prize:80,   reqRanking:999, desnivel:'1.300m+',weather_risk:0.25, month:2, monthName:'Febrero',     quarter:1, tier:'local',
   segs:[{name:'Salida',km:3,type:'flat',gain:0,base:1200},{name:'Subida Granito',km:7,type:'climb',gain:700,base:2200},{name:'Cuerda Larga',km:2,type:'flat',gain:0,base:1400,aid:true},{name:'Subida Cogolludo',km:3,type:'climb',gain:600,base:2400},{name:'Bajada Técnica',km:8,type:'descent',gain:-900,base:2000,aid:true},{name:'Meta',km:2,type:'flat',gain:0,base:1000}]},
  {id:'copa',     name:'Copa Catalana de Trail',  type:'30K regional',km:30, cost:70,  prize:200,  reqRanking:999, desnivel:'1.200m+',weather_risk:0.20, month:3, monthName:'Marzo',       quarter:1, tier:'regional',
   segs:[{name:'Salida',km:4,type:'flat',gain:0,base:1200},{name:'Primera Subida',km:5,type:'climb',gain:600,base:2100},{name:'Collado',km:3,type:'flat',gain:0,base:1100,aid:true},{name:'Bajada',km:4,type:'descent',gain:-600,base:1600},{name:'Ribera',km:5,type:'flat',gain:0,base:1700},{name:'Segundo Repecho',km:5,type:'climb',gain:600,base:2000},{name:'Meta',km:4,type:'descent',gain:-500,base:1200,aid:true}]},
  {id:'abril',    name:'Maratón de Montaña de Guadarrama',type:'28K media',   km:28, cost:55,  prize:150,  reqRanking:999, desnivel:'1.600m+',weather_risk:0.15, month:4, monthName:'Abril',       quarter:2, tier:'regional',
   segs:[{name:'Llano Inicio',km:4,type:'flat',gain:0,base:1400},{name:'Subida Peñalara',km:7,type:'climb',gain:900,base:2500},{name:'Collado',km:2,type:'flat',gain:0,base:1500,aid:true},{name:'Bajada Técnica',km:5,type:'descent',gain:-800,base:2000},{name:'Valle',km:3,type:'flat',gain:0,base:1400,aid:true},{name:'Repecho Final',km:4,type:'climb',gain:700,base:2200},{name:'Descenso Meta',km:3,type:'descent',gain:-600,base:1700}]},
  {id:'mayo',     name:'Zegama-Aizkorri',         type:'42K élite',   km:42, cost:100, prize:500,  reqRanking:20,  desnivel:'2.800m+',weather_risk:0.25, month:5, monthName:'Mayo',        quarter:2, tier:'elite',   zegamaSpecial:true,
   segs:[{name:'Salida Zumarraga',km:3,type:'flat',gain:0,base:900},{name:'Subida Usategi',km:6,type:'climb',gain:700,base:2800},{name:'Cresta Aizkorri',km:5,type:'climb',gain:800,base:3200,aid:true},{name:'Bajada Técnica',km:5,type:'descent',gain:-1000,base:2400},{name:'Valle de Zegama',km:3,type:'flat',gain:0,base:1200,aid:true},{name:'Subida Aratz',km:8,type:'climb',gain:1000,base:3100},{name:'Collado Zelai',km:3,type:'climb',gain:300,base:1800,aid:true},{name:'Descenso Final',km:7,type:'descent',gain:-1100,base:2200},{name:'Meta Zegama',km:2,type:'flat',gain:0,base:900}]},
  {id:'junio',    name:'Buff Epic Trail',         type:'32K nacional',km:32, cost:90,  prize:300,  reqRanking:30,  desnivel:'2.200m+',weather_risk:0.20, month:6, monthName:'Junio',       quarter:2, tier:'nacional',
   segs:[{name:'Salida Bagà',km:4,type:'flat',gain:0,base:1300},{name:'Repecho Berguedà',km:4,type:'climb',gain:700,base:2300},{name:'Cresta',km:3,type:'climb',gain:600,base:2000,aid:true},{name:'Bajada',km:4,type:'descent',gain:-800,base:1700},{name:'Valle',km:5,type:'flat',gain:0,base:1800,aid:true},{name:'La Pared',km:3,type:'climb',gain:900,base:2600},{name:'Descenso',km:5,type:'descent',gain:-700,base:1700},{name:'Sprint',km:4,type:'flat',gain:0,base:1100}]},
  {id:'julio',    name:'Maratón Alpino Madrileño',type:'42K nacional', km:42, cost:110, prize:450,  reqRanking:25,  desnivel:'2.600m+',weather_risk:0.35, month:7, monthName:'Julio',       quarter:3, tier:'nacional',
   segs:[{name:'Salida Navacerrada',km:5,type:'flat',gain:0,base:1500},{name:'Subida Siete Picos',km:8,type:'climb',gain:900,base:2500},{name:'Collado',km:2,type:'flat',gain:0,base:1800,aid:true},{name:'Bajada Técnica',km:6,type:'descent',gain:-800,base:2000},{name:'Valle Lozoya',km:3,type:'flat',gain:0,base:1500,aid:true},{name:'Subida Peñalara',km:8,type:'climb',gain:1000,base:2800},{name:'Repecho Final',km:3,type:'climb',gain:700,base:2200,aid:true},{name:'Gran Descenso',km:7,type:'descent',gain:-900,base:2500}]},
  {id:'agosto',   name:'KV Canfranc · Vertical', type:'12K vertical', km:12, cost:50,  prize:120,  reqRanking:999, desnivel:'1.000m+',weather_risk:0.20, month:8, monthName:'Agosto',      quarter:3, tier:'local',    altitude:true,
   segs:[{name:'Salida Canfranc',km:2,type:'flat',gain:0,base:900},{name:'Rampa Inicial',km:3,type:'climb',gain:300,base:2000},{name:'Subida Vertical',km:5,type:'climb',gain:700,base:3500,aid:true},{name:'Descenso Rápido',km:2,type:'descent',gain:-700,base:1500}]},
  {id:'sierra',   name:'Ultra Pirineu UP55',      type:'55K élite',   km:55, cost:130, prize:700,  reqRanking:15,  desnivel:'3.700m+',weather_risk:0.30, month:9, monthName:'Septiembre',  quarter:3, tier:'elite',
   segs:[{name:'Salida Bagà',km:4,type:'flat',gain:0,base:1400},{name:'Primer Repecho',km:6,type:'climb',gain:900,base:2800},{name:'Puig de la Canal',km:3,type:'flat',gain:0,base:1800,aid:true},{name:'Bajada Gisclareny',km:5,type:'descent',gain:-900,base:2000},{name:'Valle Llobregat',km:5,type:'flat',gain:0,base:1600,aid:true},{name:'Subida Pedraforca',km:7,type:'climb',gain:1400,base:3200},{name:'Cresta Pedraforca',km:3,type:'climb',gain:400,base:2200,aid:true},{name:'Subida Final',km:5,type:'climb',gain:1000,base:2800,aid:true},{name:'Gran Descenso',km:9,type:'descent',gain:-1300,base:2400},{name:'Meta Guardiola',km:8,type:'flat',gain:0,base:1500}]},
  {id:'octubre',  name:'Ultra Sierra Nevada',     type:'32K media',   km:32, cost:65,  prize:200,  reqRanking:999, desnivel:'1.800m+',weather_risk:0.25, month:10,monthName:'Octubre',     quarter:4, tier:'regional',
   segs:[{name:'Salida Granada',km:4,type:'flat',gain:0,base:1400},{name:'Subida Veleta',km:7,type:'climb',gain:900,base:2800},{name:'Collado',km:3,type:'flat',gain:0,base:1600,aid:true},{name:'Bajada Técnica',km:6,type:'descent',gain:-800,base:2200},{name:'Valle',km:4,type:'flat',gain:0,base:1500,aid:true},{name:'Subida Final',km:5,type:'climb',gain:900,base:2600},{name:'Descenso Meta',km:3,type:'descent',gain:-700,base:1800}]},
  {id:'monteperdido',name:'Monte Perdido Trail 50K',type:'50K élite',km:50,cost:150,prize:800,    reqRanking:20,  desnivel:'1.900m+',weather_risk:0.40, month:11,monthName:'Noviembre',   quarter:4, tier:'elite',    altitude:true,
   segs:[{name:'Salida Llano',km:8,type:'flat',gain:0,base:1800},{name:'Primer Repecho',km:6,type:'climb',gain:650,base:2400},{name:'Cresta Alta',km:5,type:'climb',gain:500,base:2100,aid:true},{name:'Bajada Técnica',km:6,type:'descent',gain:-900,base:1800},{name:'Valle del Río',km:8,type:'flat',gain:0,base:1800,aid:true},{name:'La Pared',km:5,type:'climb',gain:750,base:2700},{name:'Descenso Final',km:6,type:'descent',gain:-600,base:1600,aid:true},{name:'Sprint Llegada',km:6,type:'flat',gain:0,base:900}]},
  {id:'diciembre', name:'San Silvestre de Montaña',type:'15K popular', km:15, cost:20,  prize:40,   reqRanking:999, desnivel:'400m+',  weather_risk:0.30, month:12,monthName:'Diciembre',   quarter:4, tier:'local',
   segs:[{name:'Salida',km:3,type:'flat',gain:0,base:900},{name:'Subida',km:4,type:'climb',gain:250,base:1600},{name:'Cresta',km:2,type:'flat',gain:0,base:900,aid:true},{name:'Bajada',km:3,type:'descent',gain:-250,base:1100},{name:'Meta',km:3,type:'flat',gain:0,base:800}]},
];

const TRAINING_BLOCKS=[
  {id:'volumen',name:'Volumen alto',desc:'Largas tiradas, base aeróbica.',detail:'Ideal para ultras y resistencia.',hours:12,
   effects:{resistencia:8,velocidad:-2,subida:3,bajada:0,nutricion:2,mental:1},
   flavor:['Salidas largas antes del amanecer. El cuerpo protesta las primeras semanas, luego entra en ritmo.','Kilómetros y más kilómetros. El aeróbico no miente — lo construyes a fuego lento.','Tiradas de dos horas que parecen interminables. Y sin embargo, son las que más cuentan.']},
  {id:'velocidad',name:'Trabajo de velocidad',desc:'Series y ritmo, ganas en llano.',detail:'Perfecto para media distancia.',hours:11,
   effects:{resistencia:-2,velocidad:9,subida:0,bajada:2,nutricion:0,mental:1},
   flavor:['Series en pista. La gente del parque te mira raro. A ti ya no te importa.','Repeticiones cortas, muy cortas. Las piernas queman. El crono no miente.','Sprints hasta que el pecho explota. Recuperas. Repites. El tiempo baja.']},
  {id:'tecnico',name:'Descenso técnico',desc:'Terreno difícil, mejora la bajada.',detail:'Ideal con mucho desnivel negativo.',hours:10,
   effects:{resistencia:0,velocidad:-1,subida:1,bajada:10,nutricion:0,mental:2},
   flavor:['Tres horas bajando el barranco. Las rodillas lo saben. Los pies también.','Piedras, raíces, barro. El terreno enseña más que cualquier entrenador.','Bajas rápido, te caes una vez, te levantas, bajas más rápido.']},
  {id:'recuperacion',name:'Recuperación activa',desc:'Sin forzar, consolidas lo aprendido.',detail:'Bueno tras lesión o temporada dura.',hours:6,
   effects:{resistencia:3,velocidad:2,subida:2,bajada:2,nutricion:3,mental:5},
   flavor:['Sin forzar, sin cronómetro. El cuerpo absorbe lo que lleva meses aprendiendo.','Rodajes suaves al atardecer. La mente se despeja. El cuerpo consolida.','Ritmo conversacional, piernas sueltas. A veces lo mejor que puedes hacer es no hacer nada.']},
  {id:'taper',name:'Descarga / Tapering',desc:'Bajas el volumen, dejas que el cuerpo se active.',detail:'Ningún stat sube — llegas fresco y con las piernas listas.',hours:4,
   effects:{resistencia:0,velocidad:0,subida:0,bajada:0,nutricion:0,mental:2},
   taperBlock:true,
   flavor:['Salidas cortas, muy cortas. El cuerpo agradece el respiro y acumula frescura.','Una semana sin forzar. Los músculos se activan de otra manera.','Ritmo tranquilo, cabeza despejada. Reservas llenas. Ya está todo hecho.']},
  {id:'cruzado',name:'Entrenamiento cruzado',desc:'Bici, natación o yoga. Mantienes la base sin destruir el cuerpo.',detail:'Ideal en recuperación de lesión o carga muy alta.',hours:6,
   effects:{resistencia:4,velocidad:0,subida:0,bajada:0,nutricion:2,mental:4},
   crossBlock:true,
   flavor:['Pedaladas tranquilas al atardecer. Las piernas descansan, el corazón sigue trabajando.','Una hora en la piscina. El agua lleva el peso. El cuerpo lo agradece.','Yoga y movilidad. No es correr, pero el cuerpo lo necesita igual.']},
];

const SPONSORS_DB=[
  // ── TIER 1 — Local (año 1+) ──────────────────────────────────────
  {id:'trailbase',   cat:'zapatillas',name:'TrailBase',         tier:1,reqYear:1,
   bonus:'Comodidad en llano',          statBonus:{velocidad:3},
   objective:'Terminar 2 carreras',     objKey:'finish2',
   salary:50,  duration:1, penaltyPct:0.10},
  {id:'vertix',      cat:'zapatillas',name:'Vertix Trail',       tier:1,reqYear:1,
   bonus:'Agarre en bajadas',           statBonus:{bajada:3},
   objective:'Terminar 3 carreras',     objKey:'finish3',
   salary:40,  duration:1, penaltyPct:0.10},
  {id:'altitudobasic',cat:'ropa',     name:'AltitudoBasic',      tier:1,reqYear:1,
   bonus:'Visibilidad y comodidad',     statBonus:{mental:2},
   objective:'Terminar la temporada',   objKey:'finishSeason',
   salary:45,  duration:1, penaltyPct:0.10},
  {id:'gelstart',    cat:'nutricion', name:'GelStart',            tier:1,reqYear:1,
   bonus:'Geles +15% más eficaces',     statBonus:{nutricion:3},
   objective:'Correr 3+ carreras',      objKey:'race3',
   salary:30,  duration:1, penaltyPct:0.10},
  {id:'trailsense',  cat:'tecnologia',name:'TrailSense Basic',    tier:1,reqYear:1,
   bonus:'Datos básicos en carrera',    statBonus:{mental:2},
   objective:'Terminar 2 carreras',     objKey:'finish2',
   salary:25,  duration:1, penaltyPct:0.10},

  // ── TIER 2 — Regional (año 2+) ──────────────────────────────────
  {id:'montanero',   cat:'zapatillas',name:'Montañero Pro',       tier:2,reqYear:2,
   bonus:'Subida más eficiente',        statBonus:{subida:4,bajada:2},
   objective:'Top 10 en una carrera',   objKey:'top10',
   salary:90,  duration:2, penaltyPct:0.15},
  {id:'altitudopro', cat:'ropa',      name:'AltitudoPro',         tier:2,reqYear:2,
   bonus:'Termorregulación avanzada',   statBonus:{mental:4,resistencia:2},
   objective:'Correr 4+ carreras',      objKey:'race4',
   salary:100, duration:2, penaltyPct:0.15},
  {id:'nutrifit',    cat:'nutricion', name:'NutriFit Sport',       tier:2,reqYear:2,
   bonus:'Geles +20% · recuperación mejorada', statBonus:{nutricion:5},
   objective:'Terminar 4+ carreras',    objKey:'finish4',
   salary:80,  duration:2, penaltyPct:0.15},
  {id:'gpspro',      cat:'tecnologia',name:'GPS TrailPro',         tier:2,reqYear:2,
   bonus:'Análisis de ruta · datos avanzados',  statBonus:{mental:3,velocidad:2},
   objective:'Top 10 en 2 carreras',    objKey:'top10x2',
   salary:75,  duration:2, penaltyPct:0.15},

  // ── TIER 3 — Nacional (año 4+) ──────────────────────────────────
  {id:'summit',      cat:'zapatillas',name:'Summit Elite',         tier:3,reqYear:4,reqRanking:50,
   bonus:'Máximo rendimiento en montaña', statBonus:{subida:5,bajada:4,resistencia:2},
   objective:'Top 5 en una carrera nacional', objKey:'top5nacional',
   salary:200, duration:2, penaltyPct:0.20},
  {id:'skyline',     cat:'ropa',      name:'Skyline Race Wear',    tier:3,reqYear:4,reqRanking:50,
   bonus:'Aerodinámica y protección',   statBonus:{velocidad:3,mental:5},
   objective:'Correr 5+ carreras',      objKey:'race5',
   salary:180, duration:2, penaltyPct:0.20},
  {id:'pronutrition',cat:'nutricion', name:'ProNutrition Lab',     tier:3,reqYear:4,reqRanking:50,
   bonus:'Protocolo nutricional completo', statBonus:{nutricion:6,resistencia:3},
   objective:'Top 10 en 3 carreras',    objKey:'top10x3',
   salary:160, duration:2, penaltyPct:0.20},
  {id:'garmontpro',  cat:'tecnologia',name:'Garmont Pro GPS',      tier:3,reqYear:4,reqRanking:50,
   bonus:'Análisis biomecánico completo', statBonus:{mental:5,velocidad:3},
   objective:'Top 5 en 2 carreras',     objKey:'top5x2',
   salary:150, duration:2, penaltyPct:0.20},

  // ── TIER 4 — Élite (año 6+ · ranking < 20) ──────────────────────
  {id:'vanguard',    cat:'zapatillas',name:'Vanguard Ultra',       tier:4,reqYear:6,reqRanking:20,
   bonus:'Material de élite mundial',   statBonus:{subida:6,bajada:5,velocidad:4},
   objective:'Podio en carrera nacional', objKey:'podioNacional',
   salary:400, duration:3, penaltyPct:0.25},
  {id:'alpinaelite', cat:'ropa',      name:'Alpina Elite',         tier:4,reqYear:6,reqRanking:20,
   bonus:'Equipamiento profesional',    statBonus:{mental:6,resistencia:4},
   objective:'Top 5 en 3 carreras',     objKey:'top5x3',
   salary:350, duration:3, penaltyPct:0.25},
  {id:'labnutrition',cat:'nutricion', name:'Lab Nutrition Elite',  tier:4,reqYear:6,reqRanking:20,
   bonus:'Nutrición de alto rendimiento', statBonus:{nutricion:8,resistencia:4},
   objective:'Top 10 en 4 carreras',    objKey:'top10x4',
   salary:300, duration:3, penaltyPct:0.25},
  {id:'polarelite',  cat:'tecnologia',name:'Polar Elite System',   tier:4,reqYear:6,reqRanking:20,
   bonus:'Sistema integrado de rendimiento', statBonus:{mental:6,velocidad:4},
   objective:'Podio en 2 carreras',     objKey:'podiox2',
   salary:280, duration:3, penaltyPct:0.25},
];

const CLUBS=[
  {id:'none',   name:'Sin club',              desc:'Independiente. Sin costes ni beneficios.',                                      cost:0,   statBonus:{},                        hasFisio:false, hasEntrenador:false, minYear:1,
   companions:[]},
  {id:'local',  name:'Club Local Trail',      desc:'Buen ambiente. Entrenas mejor en grupo.',                                       cost:20,  statBonus:{mental:3},               hasFisio:false, hasEntrenador:false, minYear:1,
   companions:['Mikel','Ane','Josu','Leire','Gorka']},
  {id:'montana',name:'Club de Alta Montaña',  desc:'Acceso a altitud. Fisio incluido. Rivales más duros.',                          cost:60,  statBonus:{subida:4},               hasFisio:true,  hasEntrenador:false, minYear:1,
   companions:['Ibón','Nekane','Aitor','Miren','Txomin']},
  {id:'elite',  name:'Club Élite Trail',      desc:'Lo mejor del circuito. Fisio + entrenador incluidos. Acceso a dorsales VIP.',   cost:120, statBonus:{subida:5,mental:3},      hasFisio:true,  hasEntrenador:true,  minYear:3,
   companions:['Eneko','Amaia','Urtzi','Nerea','Beñat']},
];

// Nombres de compañero aleatorio al unirse a un club
const BETWEEN_EVENTS=[
  {id:'injury',title:'Lesión leve',desc:'Tendinitis en la rodilla. Llevas días sin poder entrenar bien.',
   choices:[{text:'Descansar y recuperar (saltas la próxima carrera)',effect:'skip'},{text:'Correr igualmente (llegas con piernas al 80%)',effect:'legs_penalty'}]},
  {id:'interrupted',title:'Entrenamiento interrumpido',desc:'El trabajo y los imprevistos no te han dejado completar el bloque.',
   choices:[{text:'Entrenamiento de emergencia (bloque al 80%)',effect:'train_emergency'},{text:'Asumir que llegas más justo (bloque al 65%)',effect:'train_penalty'}]},
  {id:'extreme_weather',title:'Condiciones extremas anunciadas',desc:'La próxima carrera tiene previsión de calor extremo o tormenta.',
   choices:[{text:'Mantener el plan (penalización en carrera)',effect:'nothing'},{text:'Cambiar bloque de entrenamiento (pierdes progreso)',effect:'change_block'},{text:'Entrenamiento especial desplazándote (€150 extra)',effect:'special_train'}]},
  {id:'invite',title:'Invitación especial',desc:'Un organizador te ofrece una plaza gratis en una carrera fuera del calendario.',
   choices:[{text:'Aceptar — correr una prueba extra',effect:'add_race'},{text:'Declinar — mantener el plan',effect:'nothing'}]},
];

// ── EXPRESS: Eventos con contador (7 s) ──────────────────────────
const EXPRESS_TIMED_EVENTS=[
  {id:'xp_descent',timed:true,defaultChoice:0,
   title:'⛰ Bajada técnica dudosa',
   desc:'Entras demasiado fuerte en una bajada rota. Cada segundo cuenta.',
   choices:[
     {text:'Asegurar trazada — pierdes ritmo, ganas seguridad',id:'safe_descent'},
     {text:'Mantener ritmo — riesgo si las piernas están tocadas',id:'push_descent'},
   ]},
  {id:'xp_rival',timed:true,defaultChoice:1,
   title:'⚡ Un rival acelera delante de ti',
   desc:'Lleva 3 km a tu rueda. De repente clava las botas y acelera. ¿Le sigues?',
   choices:[
     {text:'Seguirle — mejor tiempo si vas bien, peor fatiga si vienes justo',id:'follow_rival'},
     {text:'Mantener tu plan — pequeño bonus mental',id:'hold_rival'},
   ]},
  {id:'xp_cramp',timed:true,defaultChoice:0,
   title:'🦵 Aviso de calambre',
   desc:'Notas un amago en el cuádricep izquierdo. Decisión inmediata.',
   choices:[
     {text:'Bajar un punto — aseguras la llegada',id:'ease_cramp'},
     {text:'Forzar unos minutos — posible bonus si el cuerpo aguanta',id:'push_cramp'},
   ]},
  {id:'xp_final',timed:true,defaultChoice:1,
   title:'🏁 Último tramo — todo o nada',
   desc:'Ves la meta. Vas al límite absoluto. ¿Remates o aseguras?',
   choices:[
     {text:'Rematar — bonus fuerte de tiempo, riesgo de acabar vacío',id:'sprint_finish'},
     {text:'Asegurar — llegas limpio, sin consecuencias',id:'safe_finish'},
   ]},
  {id:'xp_storm_timed',timed:true,defaultChoice:0,
   title:'⛈ El cielo se viene abajo',
   desc:'Tormenta repentina. ¿Guardas posición o aprietas antes de que empeore?',
   choices:[
     {text:'Guardar control — menor castigo de hidratación',id:'shelter_storm'},
     {text:'Apretar antes de que vaya a peor — riesgo si la tormenta sigue',id:'push_storm'},
   ]},
  {id:'xp_fork',timed:true,defaultChoice:0,
   title:'🔀 Bifurcación mal señalizada',
   desc:`Hay dos caminos y la marca está caída. Tienes que decidir ya.`,
   choices:[
     {text:'Izquierda — el terreno tiene mejor pinta (instinto)',id:'fork_left'},
     {text:'Derecha — parece más pisado (seguir la lógica)',id:'fork_right'},
   ]},
  // ── 6 nuevos timed ──────────────────────────────────────────────
  {id:'xp_rival_wheel',timed:true,defaultChoice:1,
   title:'🚴 Rival pegado a tu rueda',
   desc:'Llevas 2 km arrastrándole. Se aprovecha de tu ritmo. ¿Adelantas o le sacudes?',
   choices:[
     {text:'Acelerar fuerte para soltarle — -energía, ganas posición',id:'shake_rival'},
     {text:'Mantener ritmo — llega fresquito detrás, pero tú también',id:'keep_pace'},
   ]},
  {id:'xp_climb_attack',timed:true,defaultChoice:1,
   title:'⛰ Ataque en subida corta',
   desc:'Un rival pega un tirón fuerte justo antes del collado. ¿Respondes?',
   choices:[
     {text:'Responder — igualas su posición, -8 energía',id:'respond_climb'},
     {text:'Dejar ir — el gap crece pero llegas fresco arriba',id:'let_go_climb'},
   ]},
  {id:'xp_last_descent',timed:true,defaultChoice:1,
   title:'💨 Último descenso — ¿todo o nada?',
   desc:'Final técnico con polvo y barro. La meta está cerca. ¿Te la juegas?',
   choices:[
     {text:'Velocidad máxima — ganas 45s, riesgo de caída si piernas bajas',id:'full_descent'},
     {text:'Seguro — llegas limpio, +20s',id:'safe_last_descent'},
   ]},
  {id:'xp_slippery',timed:true,defaultChoice:0,
   title:'🟫 Paso resbaladizo',
   desc:'Barro fresco en plena bajada. El pie izquierdo busca agarre. Reacción.',
   choices:[
     {text:'Frenar y buscar trazada — +10s, evitas caída',id:'careful_slip'},
     {text:'Aguantar el equilibrio y seguir — riesgo si piernas<40',id:'push_slip'},
   ]},
  {id:'xp_heat_cold',timed:true,defaultChoice:0,
   title:'🌡 Golpe brusco de temperatura',
   desc:'En altura la temperatura ha cambiado de golpe. El cuerpo lo nota ya.',
   choices:[
     {text:'Ajustar ritmo — recuperas hidratación +8',id:'adjust_temp'},
     {text:'Ignorar y mantener — riesgo -15% stats',id:'ignore_temp'},
   ]},
  {id:'xp_double_cramp',timed:true,defaultChoice:0,
   title:'🦵🦵 Calambre doble',
   desc:'Los dos cuádriceps avisan a la vez. Carga corporal muy alta. Ahora.',
   choices:[
     {text:'Estirar 25s — -25s tiempo, evitas lesión',id:'stretch_double'},
     {text:'Forzar — posible -20% piernas o lesión si bodyLoad>70',id:'push_double'},
   ]},
];

// ── EXPRESS NARRATIVE EVENTS (sin timer) ─────────────────────────
const EXPRESS_NARRATIVE_EVENTS=[
  {id:'xn_public_final',
   title:'📣 El público te empuja',
   desc:'Hay animadores justo en el último kilómetro. Te llaman por el dorsal. ¿Aprietas o guardas la compostura?',
   choices:[
     {text:'Apretar para la galería — +10% mental, -5 energía',id:'show_public'},
     {text:'Guardar compostura — llegas sereno',id:'ignore_public'},
   ]},
  {id:'xn_rival_position',
   title:'📊 Rival a 20 segundos en clasificación',
   desc:'La pantalla del avituallamiento te muestra que el corredor de delante está a solo 20 segundos.',
   choices:[
     {text:'Ir a por él — -10 energía, posible mejora de posición',id:'chase_rival'},
     {text:'Mantener tu ritmo — llega más fresco al final',id:'hold_position'},
   ]},
  {id:'xn_heat_wave',
   title:'☀ Calor inesperado',
   desc:'El sol ha pegado fuerte desde el último collado. La hidratación se resiente.',
   choices:[
     {text:'Beber más en el próximo avituallamiento — +hidratación 10',id:'drink_more'},
     {text:'Seguir al mismo ritmo — ahorras tiempo',id:'keep_heat'},
   ]},
  {id:'xn_breathing',
   title:'🫁 Fallo de respiración en altitud',
   desc:'La altitud empieza a notarse. La respiración no entra bien desde hace 500m.',
   choices:[
     {text:'Pausa de 20s para regularte — recuperas ritmo cardíaco',id:'pause_breath'},
     {text:'Forzar — -10% resistencia este tramo',id:'push_breath'},
   ]},
  {id:'xn_terrain_bump',
   title:'🪨 Bache en el descenso',
   desc:'Una raíz escondida te hace perder el paso. Sin gravedad, pero el tobillo lo ha notado.',
   choices:[
     {text:'Parar 10s a evaluar — previene empeorar',id:'check_bump'},
     {text:'Seguir sin parar — -5 piernas, ahorras 10s',id:'ignore_bump'},
   ]},
  {id:'xn_fog',
   title:'🌫 Niebla sobre la cresta',
   desc:'Visibilidad muy baja en el collado. El GPS tarda en recalcular. ¿Confías en la memoria o vas despacio?',
   choices:[
     {text:'GPS y cautela — +15s pero camino seguro',id:'gps_fog'},
     {text:'Tirar por intuición — riesgo +40s si te desvías',id:'gut_fog'},
   ]},
  {id:'xn_goat',
   title:'🐐 Cabra en el sendero',
   desc:'Una cabra con sus crías ocupa el paso y no se mueve. Clásico de alta montaña.',
   choices:[
     {text:'Rodear por la ladera — +10s',id:'go_around'},
     {text:'Espantarla despacio — +5s pero riesgo susto -mental',id:'shoo_goat'},
   ]},
  {id:'xn_dog',
   title:'🐕 Perro entusiasta te sigue',
   desc:'Un mastín de rebaño te ha tomado por su corredor favorito. Te acompaña los últimos 200m.',
   choices:[
     {text:'Disfrutarlo — +10% mental, pierdes 5s',id:'enjoy_dog'},
     {text:'Ahuyentarlo — sigues al ritmo',id:'shoo_dog'},
   ]},
  {id:'xn_sign_down',
   title:'🪧 Señal torcida por el viento',
   desc:'Una marca de ruta apunta en dirección sospechosa. Dos corredores de detrás te siguen.',
   choices:[
     {text:'Corregir la señal y continuar — +10s',id:'fix_sign'},
     {text:'Ignorarla y seguir tu instinto — riesgo +30s si fallas',id:'ignore_sign'},
   ]},
  {id:'xn_retired_rival',
   title:'🚩 Un rival se retira delante de ti',
   desc:'El corredor que llevaba tu ritmo se detiene en el borde del sendero. Señala que abandona.',
   choices:[
     {text:'Preguntar si está bien — +20s, +mental, +reputación',id:'help_retired'},
     {text:'Aprovechar el hueco y adelantar posiciones',id:'pass_retired'},
   ]},
  {id:'xn_endless_climb',
   title:'🏔 La subida que no acaba',
   desc:'El mapa decía 200m de desnivel. Llevas 300 y el pico no aparece. La cabeza flojea.',
   choices:[
     {text:'Gestionar energía — ritmo cómodo hasta arriba',id:'manage_climb'},
     {text:'Empujar — llegas antes pero -25% energía',id:'push_climb'},
   ]},
  {id:'xn_runner_fallen',
   title:'🏃 Corredor caído delante',
   desc:'El de delante ha tropezado y está en el suelo. Se incorpora, pero con dificultad.',
   choices:[
     {text:'Ayudarle a levantarse — +20s, +mental',id:'help_fallen'},
     {text:'Preguntar si puede seguir y continuar — +5s',id:'check_fallen'},
   ]},
];

const SPEC_STATS={
  fondista:{resistencia:62,velocidad:48,subida:45,bajada:40,nutricion:52,mental:50},
  montanero:{resistencia:55,velocidad:40,subida:65,bajada:52,nutricion:45,mental:50},
  tecnico:{resistencia:45,velocidad:45,subida:50,bajada:72,nutricion:45,mental:50},
  todoterreno:{resistencia:52,velocidad:50,subida:52,bajada:52,nutricion:48,mental:52},
};

// Ajuste de stats según edad inicial
// Joven (18): velocidad y bajada altas, poca base aeróbica, sin experiencia
// 25: referencia neutra (= SPEC_STATS base)
// Veterano (35): resistencia/mental/nutricion altos, velocidad y subida mermadas
function applyAgeToStats(stats,age){
  const s={...stats};
  if(age<=18){
    s.velocidad   =Math.min(100,s.velocidad+6);
    s.bajada      =Math.min(100,s.bajada+4);   // sin miedo al descenso
    s.resistencia =Math.max(10, s.resistencia-10); // base aeróbica inmadura
    s.nutricion   =Math.max(10, s.nutricion-12);   // no sabe gestionar el esfuerzo
    s.mental      =Math.max(10, s.mental-8);        // inexperiencia
  } else if(age<=22){
    s.velocidad   =Math.min(100,s.velocidad+4);
    s.bajada      =Math.min(100,s.bajada+2);
    s.resistencia =Math.max(10, s.resistencia-6);
    s.nutricion   =Math.max(10, s.nutricion-7);
    s.mental      =Math.max(10, s.mental-4);
  } else if(age<=25){
    // Referencia neutra — SPEC_STATS sin tocar
  } else if(age<=28){
    s.resistencia =Math.min(100,s.resistencia+4); // pico de forma física
    s.mental      =Math.min(100,s.mental+3);
    s.nutricion   =Math.min(100,s.nutricion+3);
    s.velocidad   =Math.min(100,s.velocidad+1);
  } else if(age<=30){
    s.resistencia =Math.min(100,s.resistencia+5);
    s.mental      =Math.min(100,s.mental+6);       // experiencia de carrera
    s.nutricion   =Math.min(100,s.nutricion+5);
    s.velocidad   =Math.max(10, s.velocidad-2);
    s.subida      =Math.max(10, s.subida-1);
  } else { // 35
    s.resistencia =Math.min(100,s.resistencia+7);
    s.mental      =Math.min(100,s.mental+10);      // veterano curtido
    s.nutricion   =Math.min(100,s.nutricion+8);
    s.velocidad   =Math.max(10, s.velocidad-5);
    s.subida      =Math.max(10, s.subida-4);
    s.bajada      =Math.max(10, s.bajada-2);
  }
  return s;
}

// ══════════════════════════════════════
//  CONSTANTES COMPARTIDAS (C4+C5)
// ══════════════════════════════════════
const QUARTERS=[
  {n:1,label:'Q1',months:'Ene · Feb · Mar'},{n:2,label:'Q2',months:'Abr · May · Jun'},
  {n:3,label:'Q3',months:'Jul · Ago · Sep'},{n:4,label:'Q4',months:'Oct · Nov · Dic'},
];
const TIER_COLOR_RACE={local:'#888',regional:'#4a90d9',nacional:'#4a8a2a',elite:'#c07a10'};
const TIER_LABEL_RACE={local:'Local',regional:'Regional',nacional:'Nacional',elite:'Élite'};
const TIER_COLOR_SPONSOR={1:'#888',2:'#4a90d9',3:'#4a8a2a',4:'#c07a10'};
const TIER_LABEL_SPONSOR={1:'Local',2:'Regional',3:'Nacional',4:'Élite'};
const SPEC_LABEL={fondista:'Fondista',montanero:'Montañero',tecnico:'Técnico',todoterreno:'Todoterreno'};

// ══════════════════════════════════════
//  CONSTANTES DE BALANCE (E2)
// ══════════════════════════════════════
// Costes base por ritmo: {timeMult, energy, hydration, legs}
const PACE_COSTS={
  conservar:{tm:1.18, ec:4,  hc:3,  lc:2},
  steady:   {tm:1.0,  ec:9,  hc:6,  lc:5},
  push:     {tm:0.9,  ec:17, hc:11, lc:10},
  allout:   {tm:0.8,  ec:27, hc:17, lc:16},
};
// Penalización por reservas bajas
const LOW_STAT_PENALTIES={energy:{threshold:30,timeMult:1.15},hydration:{threshold:20,timeMult:1.20},legs:{threshold:25,timeMult:1.18}};
// Multiplicadores clima → hidratación
const WEATHER_HYD_MULT={soleado:1.3,extremo:1.8};
const STORM_HYD_MULT={protected:1.3,exposed:2.0};
// Stat scaling por tipo de terreno
const STAT_SCALE_PER_KM=0.003;
const RESISTANCE_SCALE_PER_KM=0.004;
// Puntos de ranking por posición de carrera
const RANKING_PTS=[38,27,18,18,18,10,10,10,10,6,4]; // idx 0=1º, 1=2º... >10=2pts
function getRankPts(pos){return pos<=10?(RANKING_PTS[pos-1]||2):2;}
// Tabla de reparto de premios por posición
const PRIZE_TABLE=[1.0,0.5,0.25,0.12,0.07,0.04,0.02,0.01]; // idx 0=1º... >8=0

// Pool amplio de rivales — se mezclan según nivel de carrera
const RIVALS_POOL=[
  {name:'Kilian Jornet',    flag:'🇪🇸',country:'España',        spec:'montanero',  base:0.92, tier:3},
  {name:'François D\'Haene',flag:'🇫🇷',country:'Francia',       spec:'fondista',   base:0.93, tier:3},
  {name:'Jim Walmsley',    flag:'🇺🇸',country:'Estados Unidos', spec:'velocidad',  base:0.94, tier:3},
  {name:'Courtney Dauwalter',flag:'🇺🇸',country:'Estados Unidos',spec:'fondista',  base:0.93, tier:3},
  {name:'Pau Capell',      flag:'🇪🇸',country:'España',        spec:'montanero',  base:0.95, tier:3},
  {name:'Tom Evans',       flag:'🇬🇧',country:'Reino Unido',   spec:'fondista',   base:0.96, tier:3},
  {name:'Rémi Bonnet',     flag:'🇨🇭',country:'Suiza',         spec:'tecnico',    base:0.95, tier:3},
  {name:'Ruth Croft',      flag:'🇳🇿',country:'Nueva Zelanda', spec:'todoterreno',base:0.97, tier:2},
  {name:'Ludovic Pommeret',flag:'🇫🇷',country:'Francia',       spec:'fondista',   base:0.97, tier:2},
  {name:'Anna Comet',      flag:'🇪🇸',country:'España',        spec:'montanero',  base:0.97, tier:2},
  {name:'Silvia Rampazzo', flag:'🇮🇹',country:'Italia',        spec:'tecnico',    base:0.98, tier:2},
  {name:'Dakota Jones',    flag:'🇺🇸',country:'Estados Unidos',spec:'tecnico',    base:0.99, tier:2},
  {name:'Mathieu Blanchard',flag:'🇫🇷',country:'Francia',      spec:'fondista',   base:0.98, tier:2},
  {name:'Andrea Huser',    flag:'🇨🇭',country:'Suiza',         spec:'todoterreno',base:0.99, tier:2},
  {name:'Ryoichi Sekiya',  flag:'🇯🇵',country:'Japón',         spec:'fondista',   base:1.01, tier:1},
  {name:'Thibaut Baronian',flag:'🇧🇪',country:'Bélgica',       spec:'montanero',  base:1.02, tier:1},
  {name:'Antoine Guillon', flag:'🇫🇷',country:'Francia',       spec:'fondista',   base:1.03, tier:1},
  {name:'Camille Herron',  flag:'🇺🇸',country:'Estados Unidos',spec:'fondista',   base:1.01, tier:1},
];

// ══════════════════════════════════════
//  MODO ENTRENADOR — CONSTANTES
// ══════════════════════════════════════
const COACH_ATHLETE_POOL=[
  {id:'marc',  name:'Marc Puig',      flag:'🇪🇸',spec:'montanero',  personality:'rebelde',  age:24,rivalName:'Oriol Puig',
   bio:'Joven promesa del Pirineo. Talento bruto, pero le cuesta acatar consignas.',
   baseStats:{resistencia:55,velocidad:48,subida:68,bajada:55,nutricion:40,mental:45},monthlyFee:200},
  {id:'ana',   name:'Ana Vilaró',     flag:'🇪🇸',spec:'fondista',   personality:'motivado', age:28,rivalName:'Laia Bonell',
   bio:'Resistente nata. Se entrega al 110% — a veces con consecuencias.',
   baseStats:{resistencia:65,velocidad:52,subida:50,bajada:48,nutricion:55,mental:58},monthlyFee:280},
  {id:'jordi', name:'Jordi Camprubí', flag:'🇪🇸',spec:'tecnico',    personality:'obediente',age:31,rivalName:'Xavi Gómez',
   bio:'Técnico preciso. Hace exactamente lo que le pides, para bien y para mal.',
   baseStats:{resistencia:50,velocidad:50,subida:52,bajada:72,nutricion:52,mental:55},monthlyFee:250},
  {id:'leire', name:'Leire Arana',    flag:'🇪🇸',spec:'todoterreno',personality:'quemado',  age:35,rivalName:'Sara Mateu',
   bio:'Ex-élite del ciclismo. Base física excepcional — necesita reconectar con el trail.',
   baseStats:{resistencia:62,velocidad:58,subida:56,bajada:54,nutricion:60,mental:35},monthlyFee:320},
  {id:'pau',   name:'Pau Ferrer',     flag:'🇪🇸',spec:'montanero',  personality:'motivado', age:22,rivalName:'Iker Zubiaurre',
   bio:'Salvaje en las subidas. No sabe gestionar el ritmo en llano todavía.',
   baseStats:{resistencia:48,velocidad:45,subida:72,bajada:52,nutricion:38,mental:60},monthlyFee:180},
  {id:'marta', name:'Marta Solà',     flag:'🇨🇦',spec:'fondista',   personality:'obediente',age:29,rivalName:'Claire Dubois',
   bio:'Disciplina de hierro. Volvió a Cataluña para dedicarse al trail a tiempo completo.',
   baseStats:{resistencia:60,velocidad:55,subida:50,bajada:50,nutricion:62,mental:60},monthlyFee:260},
  {id:'iker',  name:'Iker Izaguirre', flag:'🇪🇸',spec:'montanero',  personality:'perfeccionista',age:26,rivalName:'Kilian Jornet',
   bio:'Analiza cada entrenamiento. Necesita saber el porqué de cada decisión, pero cuando confía en ti rinde al límite.',
   baseStats:{resistencia:58,velocidad:52,subida:70,bajada:58,nutricion:65,mental:48},monthlyFee:290},
  {id:'sara',  name:'Sara Torrella',  flag:'🇪🇸',spec:'tecnico',    personality:'quemado',  age:38,rivalName:'Núria Picas',
   bio:'Leyenda del trail catalán. Tres lesiones graves en cuatro años. Quiere un último ciclo hecho bien.',
   baseStats:{resistencia:70,velocidad:60,subida:62,bajada:74,nutricion:68,mental:28},monthlyFee:380},
  {id:'rafa',  name:'Rafa Montero',   flag:'🇪🇸',spec:'todoterreno',personality:'rebelde',  age:21,rivalName:'Yeray Igual',
   bio:'Recién llegado al trail desde el fútbol. Físico bruto, cabeza a entrenar. Aprende rápido pero no le gustan las normas.',
   baseStats:{resistencia:50,velocidad:62,subida:55,bajada:50,nutricion:30,mental:55},monthlyFee:150},
];
// ── Pool de atletas para el arco narrativo (Carrera de Vida) ──────────────────
const LIFE_ATHLETE_POOL=[
  {id:'txus',  name:'Txus Olaizola',   flag:'🇪🇸', spec:'montanero',   personality:'rebelde',
   age:22, potential:'bruto',
   bio:'Pastoreaba ovejas en el Pirineo navarro hasta los 20 años. Físico excepcional, cero técnica. Nadie le ha dicho todavía que puede ser bueno.',
   baseStats:{resistencia:60,velocidad:48,subida:70,bajada:44,nutricion:32,mental:52}},
  {id:'noa',   name:'Noa Ferragut',    flag:'🇪🇸', spec:'fondista',    personality:'motivado',
   age:21, potential:'prometedor',
   bio:'Campeona de cross universitario. Quiere dar el salto al trail pero no conoce a nadie del mundillo.',
   baseStats:{resistencia:62,velocidad:58,subida:50,bajada:48,nutricion:50,mental:65}},
  {id:'kepa',  name:'Kepa Etxeberria', flag:'🇪🇸', spec:'todoterreno', personality:'obediente',
   age:23, potential:'talento_oculto',
   bio:'Ciclista de XCO reconvertido. Sus datos de potencia son los mejores que has visto en un aficionado. Él no lo sabe.',
   baseStats:{resistencia:55,velocidad:65,subida:62,bajada:56,nutricion:58,mental:48}},
  {id:'celia', name:'Celia Bravo',     flag:'🇪🇸', spec:'tecnico',     personality:'perfeccionista',
   age:24, potential:'prometedor',
   bio:'Trabaja de fisio. Conoce su cuerpo mejor que nadie. Analiza todo, confía en poco. Necesita a alguien que entienda su forma de pensar.',
   baseStats:{resistencia:52,velocidad:50,subida:52,bajada:68,nutricion:64,mental:44}},
  {id:'unai',  name:'Unai Goikoetxea', flag:'🇪🇸', spec:'montanero',  personality:'quemado',
   age:20, potential:'talento_oculto',
   bio:'Ganó tres carreras juveniles y desapareció. Algo pasó ese último año. Tiene ganas de volver pero no sabe si puede confiar en un entrenador.',
   baseStats:{resistencia:58,velocidad:52,subida:66,bajada:58,nutricion:46,mental:28}},
  {id:'mireia',name:'Mireia Puigdomènech',flag:'🇪🇸',spec:'fondista', personality:'motivado',
   age:21, potential:'bruto',
   bio:'Llega del atletismo de pista. Resistente como pocas, pero el monte le da vértigo todavía. Aprende rápido.',
   baseStats:{resistencia:68,velocidad:60,subida:44,bajada:40,nutricion:52,mental:58}},
];
const LIFE_POTENTIAL_LABEL={
  bruto:         {label:'Talento bruto',  color:'#c07a10', desc:'Base física excepcional, sin pulir.'},
  prometedor:    {label:'Prometedor',     color:'#185FA5', desc:'Perfil equilibrado con margen de mejora claro.'},
  talento_oculto:{label:'Talento oculto', color:'#534AB7', desc:'Nadie lo ha visto todavía. Podría sorprenderte.'},
};

const LIFE_EXTRA_ATHLETES=[
  {id:'aritz', name:'Aritz Zubeldia',  flag:'🇪🇸', spec:'montanero',  personality:'perfeccionista',
   age:20, potential:'talento_oculto',
   bio:'Lo descubres en una carrera local. Lleva cuatro meses entrenando. Ya gana a gente con diez años de experiencia.',
   baseStats:{resistencia:52,velocidad:50,subida:68,bajada:50,nutricion:35,mental:55}},
  {id:'laia',  name:'Laia Sistach',    flag:'🇪🇸', spec:'fondista',   personality:'motivado',
   age:22, potential:'prometedor',
   bio:'Maratoniana reconvertida. Su agente te llama directamente — algo no cuadra con el anterior entrenador.',
   baseStats:{resistencia:66,velocidad:62,subida:46,bajada:44,nutricion:58,mental:60}},
  {id:'bixente',name:'Bixente Larrañaga',flag:'🇪🇸',spec:'tecnico', personality:'rebelde',
   age:19, potential:'bruto',
   bio:'Su padre fue trail runner en los 90. El chico tiene el físico pero ninguna de la disciplina.',
   baseStats:{resistencia:58,velocidad:56,subida:58,bajada:70,nutricion:28,mental:48}},
  {id:'sara2', name:'Sara Mas',        flag:'🇪🇸', spec:'todoterreno',personality:'obediente',
   age:24, potential:'prometedor',
   bio:'Guardabosques. Pasa más horas en el monte que nadie. Solo necesita que alguien le ponga estructura.',
   baseStats:{resistencia:64,velocidad:52,subida:60,bajada:58,nutricion:55,mental:62}},
];
const PERSONALITY_LABEL={
  rebelde:       {label:'Rebelde',       color:'#c0392b',emoji:'🔴',desc:'Modifica tus planes. Difícil de controlar pero tiene chispa.'},
  motivado:      {label:'Motivado',      color:'#c07a10',emoji:'🟡',desc:'Se entrega al máximo. Puede sobreentrenar si no lo controlas.'},
  obediente:     {label:'Obediente',     color:'#2d7a2d',emoji:'🟢',desc:'Sigue tus instrucciones al pie de la letra.'},
  quemado:       {label:'Quemado',       color:'#888',   emoji:'⚫',desc:'Necesita apoyo emocional. Puede recuperar el nivel con el tiempo.'},
  perfeccionista:{label:'Perfeccionista',color:'#6c3483',emoji:'🟣',desc:'Exige feedback constante. Muy sensible a los errores, pero crece mucho con confianza alta.'},
};

// ── Estado emocional evolutivo ──────────────────────────────────────────────
// Independiente de la personalidad. Cambia según decisiones, carga y resultados.
const EMOTIONAL_STATES={
  fresco:    {label:'Fresco',      color:'#4a90d9',emoji:'💙',desc:'Motivado, sin desgaste acumulado.'},
  confiado:  {label:'Confiado',    color:'#2d7a2d',emoji:'💚',desc:'Resultados positivos. Rinde mejor en carrera.'},
  dudoso:    {label:'Dudoso',      color:'#c07a10',emoji:'🟡',desc:'Incertidumbre. Necesita un resultado o un gesto de confianza.'},
  quemado:   {label:'Quemado',     color:'#888',   emoji:'🩶',desc:'Agotado emocionalmente. Riesgo de no renovar.'},
  recuperado:{label:'Recuperado',  color:'#8e44ad',emoji:'💜',desc:'Volvió de un bache. Comprometido y agradecido.'},
};

// Transiciones: qué condiciones llevan a cada estado
// Se evalúa al fin de carrera y en eventos clave
const TRAINER_STYLES={
  motivador:   {label:'Motivador',   emoji:'🔥', color:'#c07a10',
    desc:'Discursos, confianza extrema. El atleta rinde más cuando cree en sí mismo.',
    trustMod:+4, bodyLoadMod:-3, perfMod:+5,
    trainingBonus:'mental', trainingPenalty:null,
    reactionGood:'Se le ilumina la cara. "Si tú lo dices, puedo."',
    reactionBad:'Se nota forzado. No toda la motivación cala igual.'},
  cientifico:  {label:'Científico',  emoji:'📊', color:'#4a90d9',
    desc:'Datos, periodización exacta. Cada bloque tiene su porqué.',
    trustMod:+2, bodyLoadMod:-6, perfMod:+3,
    trainingBonus:'resistencia', trainingPenalty:null,
    reactionGood:'"Los números cuadran. Confío en el plan."',
    reactionBad:'Los atletas emocionales necesitan más que datos.'},
  conservador: {label:'Conservador', emoji:'🛡', color:'#2d7a2d',
    desc:'Menos lesiones, progresión lenta pero segura.',
    trustMod:+3, bodyLoadMod:-10, perfMod:-3,
    trainingBonus:null, trainingPenalty:'velocidad',
    reactionGood:'"Me siento protegido. No me has quemado."',
    reactionBad:'Algunos atletas necesitan ser empujados más.'},
  agresivo:    {label:'Agresivo',    emoji:'⚡', color:'#c0392b',
    desc:'Carga alta, resultados rápidos. Mayor riesgo de lesión.',
    trustMod:-2, bodyLoadMod:+8, perfMod:+8,
    trainingBonus:'velocidad', trainingPenalty:null,
    reactionGood:'"Estoy al límite, pero los resultados hablan."',
    reactionBad:'Demasiada presión. El atleta empieza a dudar.'},
};

// ── Rasgos emergentes del entrenador (E13) ──────────────────────────────────
// Se calculan automáticamente del historial de decisiones
const TRAINER_TRAITS=[
  {id:'protector',  label:'Protector',   emoji:'🛡', color:'#2d7a2d',
   desc:'Siempre priorizas la salud del atleta. Se nota.',
   condition:(log)=>log.filter(d=>d.positive&&(d.type==='taper_used'||d.type==='injury_scare_rest')).length>=3},
  {id:'ganador',    label:'Ganador',     emoji:'🏆', color:'#c07a10',
   desc:'Tienes olfato para los podios. Tu historial lo demuestra.',
   condition:(log,hist)=>(hist||[]).reduce((s,h)=>s+(h.wins||0),0)>=3},
  {id:'comunicador',label:'Comunicador', emoji:'💬', color:'#4a90d9',
   desc:'Sabes escuchar. Los atletas confían en ti como persona.',
   condition:(log)=>log.filter(d=>d.positive&&d.type==='mental_talk').length>=3},
  {id:'exigente',   label:'Exigente',    emoji:'🔥', color:'#c0392b',
   desc:'Empujas duro. Los resultados son buenos, pero hay desgaste.',
   condition:(log)=>log.filter(d=>!d.positive&&d.type==='forced_injury').length>=2},
  {id:'equilibrado',label:'Equilibrado', emoji:'⚖️', color:'#555',
   desc:'Ni demasiado blando ni demasiado duro. Consistente.',
   condition:(log)=>log.filter(d=>d.positive).length>=4&&log.filter(d=>!d.positive).length<=1},
];

const COACH_NARRATIVES={
  climb:[
    'Sube con fluidez, respetando el esfuerzo.',
    'La subida empieza a costar, pero mantiene el paso.',
    'Va en el grupo de cabeza. Subida controlada.',
    'Pierde algo de terreno en la rampa más dura.',
    'Se ve el esfuerzo, pero gestiona bien el ritmo.',
    'Cadencia corta, brazos activos. Sube bien.',
    'La pendiente máxima se acerca. Aguanta.',
    'Zancada recortada, mirada al suelo. Modo supervivencia.',
    'Se para dos segundos a regular la respiración. Luego sigue.',
    'Alcanza a dos rivales en la parte empinada. Buen trabajo.',
    'El último tramo de la subida lo hace en silencio total.',
    'Brazos que acompañan, caderas bajas. Técnica de montaña.',
    'La cabeza cae un momento. Luego vuelve a mirar arriba.',
    'Coge un bastón imaginario de un compañero. Subida solidaria.',
    'Marca diferencias en el empinado. Aquí es donde gana tiempo.',
  ],
  descent:[
    'Bajada técnica. Se mueve con confianza.',
    'Recupera posiciones en la bajada.',
    'Sólido en el descenso. Se nota el trabajo técnico.',
    'Pierde algo de tiempo en el terreno más suelto.',
    'Bajada cautelosa — ahorra piernas para el final.',
    'Vuela en la bajada. El entrenamiento da frutos.',
    'Piedras, raíces, barro. Se adapta a todo sin parar.',
    'Deja ir los frenos mentales. Fluye en el descenso.',
    'Un par de apoyos dudosos, pero nada grave.',
    'Los cuádriceps están finos. Cada zancada, un segundo ganado.',
    'Pasa a tres corredores en la bajada larga.',
    'La confianza en el terreno se nota. Descenso limpio.',
    'Ajusta la línea en el último momento. Buen instinto.',
    'Frena antes de una curva ciega. Decisión correcta.',
  ],
  flat:[
    'Ritmo de crucero. Sin alarmas.',
    'Buen paso en llano. El grupo se fragmenta.',
    'Mantiene el ritmo pactado. Sin sorpresas.',
    'Se nota algo de fatiga acumulada, pero sigue adelante.',
    'Aprovecha el llano para recuperarse antes del siguiente repecho.',
    'Ritmo regular. Economía de movimientos impecable.',
    'Trote suave, respiración acompasada. Modo ahorro.',
    'Se coloca en el grupo. Zona de confort por ahora.',
    'El llano le pesa. Mejor en terreno vertical.',
    'Saca los auriculares imaginarios. Desconecta y fluye.',
    'Toma un sorbo de agua. Sin perder el paso.',
    'Se cruza con espectadores — un gesto de cabeza y sigue.',
    'El kilómetro más plano de la carrera. Lo gestiona bien.',
    'Revisa el reloj. Sigue dentro del plan.',
  ],
};

// ── Diálogos post-carrera por personalidad ──
const COACH_POST_RACE_DIALOGUES={
  rebelde:{
    great:['"Lo sabía. Solo necesitaba correr a mi ritmo."','"¿Ves? Cuando me dejas ser, funciono."','"Bien. Pero la siguiente la hago sin plan."'],
    good: ['"Podría haber ido más fuerte, coach."','"Bien, pero la próxima vez confía más en mí."'],
    bad:  ['"El plan era una mierda."','"Hay que cambiar la estrategia. La mía."','"No vuelvo a hacer eso."'],
    dnf:  ['"Hoy no era el día. Y lo sabía desde el principio."'],
    highTrust:{
      great:['"Oye... esta vez el plan tuyo no estuvo mal. Lo admito."','"¿Sabes qué? Confío en ti. Y hoy se ha notado."'],
      good: ['"Bien. Creo que estamos encontrando algo juntos."','"Me gustó la libertad que me diste en los últimos km."'],
      bad:  ['"No salió, pero sé que lo intentamos bien. Siguiente."'],
    },
    lowTrust:{
      great:['"Salió bien pero no por tu plan, sino a pesar de él."','"¿Ves? Yo tenía razón. Siempre tengo razón."'],
      good: ['"Eso es todo lo que consigo cuando no me escuchas."'],
      bad:  ['"No me sorprende. Esto pasa cuando no me dejas ser yo."','"Si hubiera corrido a mi manera, habría ido mejor."'],
      dnf:  ['"Este abandono es culpa del plan. No mío."'],
    },
  },
  motivado:{
    great:['"¡Increíble! ¿Cuándo es la siguiente?"','"Esto es lo que quería. ¡Más!"','"¡Coach! ¿Lo viste? ¡Lo viste!"'],
    good: ['"Sé que puedo más. Siguiente vez vamos a por el podio."','"Bien... pero me quedé corto en el final."'],
    bad:  ['"No lo entiendo. Entrené tan duro..."','"Me dejé las piernas en el primer repecho y no pude recuperar."'],
    dnf:  ['"Me duele haberlo dejado. Me duele mucho."'],
    highTrust:{
      great:['"¡Lo sabía! ¡Contigo al lado nada es imposible!"','"Equipo imbatible. Esto es solo el comienzo."'],
      good: ['"Cada vez me siento más fuerte. Y tú tienes mucho que ver."'],
      bad:  ['"Algo falla, pero sé que juntos lo vamos a resolver. ¡Vamos!"'],
    },
    lowTrust:{
      great:['"Salió bien... aunque no sé muy bien por qué."','"Bien. Pero necesito que te involucres más, coach."'],
      good: ['"Me siento solo en esto. Necesito más de ti."','"¿Estás ahí? Parece que entreno solo."'],
      bad:  ['"Esto no puede seguir así. Necesito un coach de verdad."'],
      dnf:  ['"Abandoné porque no estaba bien mentalmente. Y tú no lo viste."'],
    },
  },
  obediente:{
    great:['"Gracias, coach. El plan fue perfecto."','"Seguí tus instrucciones y funcionó exactamente como dijiste."'],
    good: ['"¿Lo hice bien? Creo que lo hice bien."','"¿Qué podría mejorar para la siguiente?"'],
    bad:  ['"Intenté hacer lo que me dijiste. ¿Qué salió mal?"','"Dime qué cambiar y lo hago."'],
    dnf:  ['"Lo siento. No quería defraudarte."'],
    highTrust:{
      great:['"Contigo me siento capaz de cualquier cosa. Gracias por creer en mí."','"Hemos trabajado mucho para esto. Vale la pena."'],
      good: ['"Confío en el proceso. Sé que con tu guía vamos a llegar."'],
      bad:  ['"Fallé, pero sé que lo analizaremos juntos y aprenderé."'],
    },
    lowTrust:{
      great:['"Salió bien... pero me gustaría entender mejor qué hacer."'],
      good: ['"¿Estoy haciendo bien las cosas? A veces no lo sé."','"Necesito más indicaciones. Me pierdo sin ellas."'],
      bad:  ['"No sé qué se espera de mí. Necesito más guía."','"Lo hice lo mejor que pude, pero algo no cuadra."'],
      dnf:  ['"Perdón. No sé en qué me equivoqué. Ayúdame a entenderlo."'],
    },
  },
  quemado:{
    great:['"...No me lo esperaba. Hace tiempo que no me sentía así."','"Quizás no estoy tan acabado."'],
    good: ['"Pasable."','"No estuvo mal. Podría haber sido peor."'],
    bad:  ['"Ya me lo imaginaba."','"¿Para esto me levanté a las 5 de la mañana?"'],
    dnf:  ['"Mejor. El cuerpo ya no responde como antes."'],
    highTrust:{
      great:['"No esperaba sentirme bien. Gracias por no rendirte conmigo."','"Quizás hay algo aún. Seguimos."'],
      good: ['"Está bien. Me alegra no haberte fallado del todo."'],
      bad:  ['"Mal resultado, pero me alegra que aún estés ahí."'],
    },
    lowTrust:{
      great:['"Salió bien. Tampoco hace falta tanto drama."'],
      good: ['"Podría haber salido peor."'],
      bad:  ['"¿Ves? Para esto no vale la pena el esfuerzo."','"Cada vez me pregunto más para qué sigo."'],
      dnf:  ['"El cuerpo ya no da para esto. Y así es."'],
    },
  },
  // ── E4: Perfeccionista — personalidad propia ──
  perfeccionista:{
    great:['"El tiempo podía haber sido mejor, pero el resultado es bueno."','"Salió según el plan. Casi perfectamente."','"Un podio es un podio. Aunque sé dónde perdí tiempo."'],
    good: ['"Cometí errores en el km 18. Lo vi venir y no lo corregí a tiempo."','"Técnicamente bien, pero el ritmo en la subida no fue el óptimo."','"Hay que revisar la estrategia de hidratación. Dímelo para la próxima."'],
    bad:  ['"Analicé la carrera: tres decisiones incorrectas. No puede volver a pasar."','"El plan tenía fallos. Los dos lo sabemos."','"Necesito datos. ¿Qué salió mal exactamente?"'],
    dnf:  ['"No tenía sentido continuar sin las condiciones mínimas. Lo calculé."','"Abandonar fue la decisión correcta. Pero no debería haber llegado a eso."'],
    highTrust:{
      great:['"El análisis es bueno. Y confío en que lo haremos mejor la próxima."','"Con más datos y tu apoyo, la siguiente puede ser perfecta."'],
      good: ['"Errores corregibles. Y tengo un entrenador que me ayuda a verlos. Eso vale."'],
      bad:  ['"Mal resultado, pero con tu ayuda encontraremos el fallo. Lo sé."'],
    },
    lowTrust:{
      great:['"Salió bien a pesar de todo. Pero necesito más análisis de tu parte."'],
      good: ['"No recibo suficiente feedback. Sin datos no puedo mejorar."','"¿Puedes ser más específico? Los comentarios generales no me sirven."'],
      bad:  ['"No tengo la información que necesito para mejorar. Eso es un problema."','"Si no analizamos esto en profundidad, volverá a pasar."'],
      dnf:  ['"Si hubiera tenido mejor información previa, no habría llegado a esto."'],
    },
  },
};

// ── Objetivos de temporada del atleta (por personalidad) ──
const COACH_SEASON_OBJECTIVES={
  rebelde:[
    {id:'win_elite',  label:'Ganar una carrera élite o nacional',    reward:+12, penalty:-10,
     desc:'"Quiero ganar algo importante. No carreras de barrio."',
     check:r=>r.pos===1&&['elite','nacional'].includes(r.tier)},
    {id:'no_abandon', label:'Terminar todas las carreras sin abandonar',reward:+8, penalty:-6,
     desc:'"Puede que cambie el plan pero no me rindo."',
     check:r=>!r.dnf},
  ],
  motivado:[
    {id:'podio_x2',   label:'Dos podios esta temporada',             reward:+10, penalty:-8,
     desc:'"Quiero al menos dos podios. No uno, dos."',
     check:(r,all)=>all.filter(x=>x.pos<=3&&!x.dnf).length>=2},
    {id:'top10_all',  label:'Top 10 en todas las carreras',          reward:+8, penalty:-5,
     desc:'"Si no estoy en el top 10, algo ha salido mal."',
     check:(r,all)=>all.every(x=>x.dnf||x.pos<=10)},
  ],
  obediente:[
    {id:'finish_all', label:'Terminar todas las carreras del calendario', reward:+6, penalty:-4,
     desc:'"Me has puesto un calendario. Lo cumplo."',
     check:(r,all)=>all.filter(x=>!x.dnf).length>=(G.coachSelectedRaces||[]).length},
    {id:'improve_pb', label:'Mejorar posición respecto a la temporada anterior', reward:+8, penalty:-3,
     desc:'"Quiero mejorar. Cada año, un poco mejor."',
     check:(r,all)=>{ const best=Math.min(...all.filter(x=>!x.dnf).map(x=>x.pos)||[999]); return best<=(G.coachAthleteHistory?.slice(-1)[0]?.bestPos||999);}},
  ],
  quemado:[
    {id:'no_injury',  label:'Terminar la temporada sin lesiones graves', reward:+10, penalty:-2,
     desc:'"Solo quiero llegar sano al final. Nada más."',
     check:()=>!G.coachInjury||(G.coachInjury?.severity||0)<2},
    {id:'two_races',  label:'Completar al menos 2 carreras',          reward:+6, penalty:-3,
     desc:'"Que nadie diga que me rendí antes de empezar."',
     check:(r,all)=>all.filter(x=>!x.dnf).length>=2},
  ],
  // ── E4: pool propio para la personalidad perfeccionista ──
  perfeccionista:[
    {id:'perf_time',   label:'Mejorar el tiempo en al menos una carrera',  reward:+14, penalty:-8,
     desc:'"No me conformo con la posición. Quiero hacerlo más rápido que la vez anterior."',
     checkAll:(all)=>{ const prev=(G.coachAthleteHistory||[]).slice(-1)[0]?.bestPos||999; return(all||[]).some(x=>!x.dnf&&x.pos<prev);}},
    {id:'perf_no_dnf', label:'Terminar todas las carreras — sin abandonos', reward:+10, penalty:-10,
     desc:'"Un abandono es un fracaso de planificación. No voy a planificar mal."',
     checkAll:(all)=>(all||[]).every(x=>!x.dnf)},
    {id:'perf_top5',   label:'Top 5 en una carrera de nivel regional o superior', reward:+12, penalty:-7,
     desc:'"El top 10 no es suficiente. Quiero estar en el grupo de cabeza."',
     checkAll:(all)=>(all||[]).some(x=>!x.dnf&&x.pos<=5&&['regional','nacional','elite'].includes(x.tier||''))},
  ],
};

// ── Lesiones del atleta ──
const COACH_INJURY_TYPES=[
  {id:'sobrecarga',  label:'Sobrecarga muscular', severity:1, racesOut:1,
   desc:'Contractura en el cuádriceps. Puede correr pero al 80% de capacidad.',
   statPenalty:{resistencia:-8,velocidad:-5}, causeLoad:75},
  {id:'tendinitis',  label:'Tendinitis de Aquiles',severity:1, racesOut:1,
   desc:'El tendón protesta. Puede seguir entrenando con precaución.',
   statPenalty:{bajada:-12,velocidad:-6}, causeLoad:80},
  {id:'rotura',      label:'Rotura de fibras',    severity:2, racesOut:2,
   desc:'Rotura parcial en el gemelo. Necesita reposo obligatorio.',
   statPenalty:{resistencia:-15,velocidad:-12,subida:-8}, causeLoad:85},
  {id:'esguince',    label:'Esguince de tobillo',  severity:1, racesOut:1,
   desc:'Torcedura durante el entrenamiento. Dolor al bajar escalones.',
   statPenalty:{bajada:-15,velocidad:-8}, causeLoad:70},
  {id:'fractura_estres',label:'Fractura por estrés',severity:3,racesOut:3,
   desc:'Fractura por estrés en el metatarso. Temporada comprometida.',
   statPenalty:{resistencia:-20,velocidad:-15,subida:-10,bajada:-10}, causeLoad:90},
];

// ── Pool de sponsors para el atleta ──
const COACH_SPONSORS_POOL=[
  {id:'cs_trailbase',  name:'TrailBase',      cat:'zapatillas', tier:1,
   salary:80, coachCut:0.15, duration:1,
   objective:'Terminar 2 carreras', objKey:'finish2',
   bonus:'Las mejores condiciones para el pie del atleta'},
  {id:'cs_altitudo',   name:'AltitudoSport',  cat:'ropa',       tier:1,
   salary:60, coachCut:0.15, duration:1,
   objective:'Top 15 en alguna carrera', objKey:'top15',
   bonus:'Material técnico de montaña'},
  {id:'cs_protaltrail',name:'ProtalNutrition', cat:'nutricion',  tier:1,
   salary:70, coachCut:0.20, duration:1,
   objective:'Terminar 3 carreras', objKey:'finish3',
   bonus:'Geles y sales para todo el año'},
  {id:'cs_suunto',     name:'Suunto',         cat:'tecnologia', tier:2,
   salary:120, coachCut:0.15, duration:1,
   objective:'Top 10 en alguna carrera', objKey:'top10',
   bonus:'GPS y métricas de entrenamiento'},
  {id:'cs_salomon',    name:'Salomon',        cat:'zapatillas', tier:2,
   salary:150, coachCut:0.10, duration:1,
   objective:'Podio en alguna carrera', objKey:'podio',
   bonus:'Modelo exclusivo para el atleta'},
  {id:'cs_clif',       name:'Clif Bar',       cat:'nutricion',  tier:2,
   salary:100, coachCut:0.20, duration:1,
   objective:'Top 5 en alguna carrera', objKey:'top5',
   bonus:'Protocolo nutricional personalizado'},
];
const COACH_DAY_CONDITIONS=[
  {text:'Dormiste mal — piernas al 90% de lo habitual.',energyMod:-3,legsMod:-8},
  {text:'Amanece con las piernas frescas. Buena señal.',energyMod:+4,legsMod:+5},
  {text:'Algo de nervios en el estómago. Normal antes de competir.',energyMod:-2,legsMod:0},
  {text:'Ha dormido 9 horas. Llega descansado y concentrado.',energyMod:+5,legsMod:+4},
  {text:'El calor ya aprieta antes de salir. Hidratación clave.',energyMod:0,legsMod:0,hydMod:-8},
  {text:'Condiciones perfectas. Sin viento, temperatura ideal.',energyMod:+3,legsMod:+2},
  {text:'Un pequeño dolor en el tibial. Probablemente nada.',energyMod:0,legsMod:-5},
];

// ── Eventos entre carreras ──
const COACH_BETWEEN_EVENTS=[
  {id:'family_stress',prob:0.14,icon:'📞',title:'Llamada familiar',
   desc:'{{name}} aparece con cara de preocupación. "Hay un problema en casa, coach. No sé si tengo la cabeza para entrenar esta semana."',
   choices:[
     {text:'"Tómate el tiempo que necesites. El entreno puede esperar."',trust:+5,bodyLoad:-5},
     {text:'"Entiendo, pero el deporte ayuda. Sigue adelante."',trust:+1},
     {text:'"Esto es profesional. No podemos mezclar las cosas."',trust:-6},
   ]},
  {id:'doubt_crisis',prob:0.12,icon:'💭',title:'Crisis de confianza',
   desc:'"No sé si soy lo suficientemente bueno para esto, coach. Veo los resultados de los demás y me pregunto si tiene sentido seguir."',
   choices:[
     {text:'"Mira cuánto has avanzado. Los números no mienten."',trust:+6},
     {text:'"El trail no es solo resultados. Es quién eres cuando nadie mira."',trust:+5},
     {text:'"Si tienes dudas, quizás no estás listo para el siguiente nivel."',trust:-8},
   ]},
  {id:'equipment_issue',prob:0.10,icon:'👟',title:'Problema con el material',
   desc:'"Las zapatillas me están destrozando los pies. Llevo dos semanas con ampollas y no te digo nada para no preocuparte."',
   choices:[
     {text:'Cambiar zapatillas inmediatamente (−€60)',trust:+4,money:-60},
     {text:'"Adapta la técnica. Es temporal."',trust:+1},
     {text:'"Hay que aguantar. No hay presupuesto ahora."',trust:-3,bodyLoad:+5},
   ]},
  {id:'rival_obsession',prob:0.13,icon:'🎯',title:'El rival en la cabeza',
   desc:'"{{rival}} volvió a ganar. Lo sigo en redes y... la verdad, me pone muy nervioso comparar."',
   choices:[
     {text:'"{{rival}} no viene a tus carreras. Enfócate en ti."',trust:+4},
     {text:'"Úsalo como motivación. Que te queme por dentro."',trust:+2},
     {text:'"Cuidado con obsesionarte. Eso destruye carreras."',trust:+5},
   ]},
  {id:'overtraining_signal',prob:0.11,icon:'😴',title:'Señales de sobrecarga',
   desc:'"Últimamente duermo fatal y tengo las piernas pesadas todo el día. Pero es normal, ¿no? Es parte del proceso."',
   choices:[
     {text:'Reducir carga esta semana (carga −15)',trust:+6,bodyLoad:-15},
     {text:'"Sí, es normal. Duerme más y ajusta la alimentación."',trust:+2},
     {text:'"El cuerpo se adapta. Aguanta."',trust:-2,bodyLoad:+8},
   ]},
  {id:'media_opportunity',prob:0.08,icon:'🎙',title:'Oferta de entrevista',
   desc:'Un podcast de trail running quiere entrevistar a {{name}}. "¿Merece la pena perder una sesión de entreno, coach?"',
   choices:[
     {text:'"Hazla. La visibilidad te abre puertas."',trust:+2,reputation:+5},
     {text:'"Esta semana no. El entreno primero."',trust:+1},
     {text:'"Tú decides. Es tu carrera."',trust:+3},
   ]},
  {id:'personal_best_ambition',prob:0.09,icon:'⏱',title:'Ambición de récord',
   desc:'"Coach, quiero ir a por el récord personal en la próxima. Sé que es arriesgado con la carga que llevo, pero... necesito saberlo."',
   choices:[
     {text:'"Con la carga actual, no. Espera a estar fresco."',trust:+4},
     {text:'"Inténtalo, pero gestiona el ritmo en los primeros km."',trust:+2,bodyLoad:+6},
     {text:'"Ve a por ello."',trust:+1,bodyLoad:+10},
   ]},
  {id:'injury_scare',prob:0.09,icon:'🩹',title:'Susto con una molestia',
   desc:'"Me torció el tobillo en el último entrenamiento. No es grave, pero me preocupa. ¿Corro la siguiente carrera?"',
   choices:[
     {text:'"Descanso total esta semana. La carrera puede esperar."',trust:+5,bodyLoad:-8,decisionType:'injury_scare_rest',decisionPositive:true},
     {text:'"Ve al fisio. Si da el visto bueno, corres."',trust:+4},
     {text:'"Es una molestia. Corres y punto."',trust:-4,bodyLoad:+5},
   ]},
  {id:'fear_after_fall',prob:0.08,icon:'😰',title:'Miedo tras una caída',
   desc:'"Tuve una caída fea entrenando en bajada técnica. Físicamente estoy bien, pero... me da pánico la bajada ahora. No sé cómo gestionarlo."',
   choices:[
     {text:'"Volvemos a la bajada en entrenos controlados. Paso a paso."',trust:+7,bodyLoad:-5,decisionType:'fear_rehab',decisionPositive:true},
     {text:'"Es psicológico. Tienes que empujarte a ti mismo."',trust:-3},
     {text:'"Evitamos bajadas técnicas este mes. Nos adaptamos."',trust:+4},
   ]},
  {id:'work_conflict',prob:0.09,icon:'💼',title:'Presión laboral',
   desc:'"Me han ofrecido un ascenso en el trabajo. Más dinero, pero menos tiempo para entrenar. No sé qué hacer, coach."',
   choices:[
     {text:'"El trail es tu carrera deportiva. Decide tú, pero sé consciente del coste."',trust:+5},
     {text:'"Acepta el ascenso y ajustamos el volumen de entrenamiento."',trust:+3,bodyLoad:-8},
     {text:'"Ahora no es el momento. El rendimiento primero."',trust:-4},
   ]},
  {id:'media_pressure',prob:0.07,icon:'📱',title:'Presión en redes',
   desc:'"Hay comentarios en Instagram diciendo que soy un fraude, que mis resultados son mediocres para mi edad. Me está afectando más de lo que debería."',
   choices:[
     {text:'"Desconecta de las redes este mes. Sin excepciones."',trust:+6},
     {text:'"Úsalos de combustible. Que la rabia te lleve más lejos."',trust:+3},
     {text:'"No les hagas caso. Lo que importa está en el cronómetro."',trust:+2},
   ]},
  {id:'sponsor_pressure',prob:0.07,icon:'💸',title:'Presión del sponsor',
   desc:'"El sponsor me presiona para que haga más contenido en redes. Dicen que no genero suficiente visibilidad. Me quita mucho tiempo de entreno."',
   choices:[
     {text:'"Negociamos juntos con el sponsor. Te respaldo."',trust:+8,decisionType:'sponsor_backup',decisionPositive:true},
     {text:'"Es parte del trato. Tienes que cumplir."',trust:-5},
     {text:'"Reduce el contenido a lo mínimo pactado. Explícales que el rendimiento es tu escaparate."',trust:+3},
   ]},
  {id:'relationship_tension',prob:0.06,icon:'💔',title:'Tensión personal',
   desc:'"Mi pareja dice que el trail lo ocupa todo. Que no estoy presente. Está en lo cierto, pero no sé cómo equilibrarlo."',
   choices:[
     {text:'"La vida personal es la base de todo. Dales tiempo real esta semana."',trust:+5,bodyLoad:-5},
     {text:'"Es un momento de sacrificio. El deporte de alto nivel exige eso."',trust:-3},
     {text:'"Buscamos un equilibrio. Entrenos más cortos, más presencia en casa."',trust:+4,bodyLoad:-8},
   ]},
];

// ── Eventos a mitad de carrera ──
const COACH_MID_RACE_EVENTS=[
  {id:'confidence_crash',icon:'💬',title:'Crisis de confianza',
   desc:'"No puedo más, coach. Las piernas no responden. ¿Sigo?"',
   choices:[
     {text:'"Tú puedes. Falta poco. Uno a uno."',trust:+4,legBoost:8},
     {text:'"Baja el ritmo. Llega, aunque sea el último."',trust:+3,legBoost:5},
     {text:'"Abandona. El cuerpo primero."',trust:-1,dnf:true},
   ]},
  {id:'rival_block',icon:'⚔️',title:'Pegado al rival',
   desc:'"{{rival}} me lleva bloqueado dos kilómetros en un singletrack. No puedo adelantar. ¿Qué hago?"',
   choices:[
     {text:'"Paciencia. Tu momento llega en la bajada."',trust:+2,timeMod:+25},
     {text:'"Presiona. Que sienta que estás ahí."',trust:+1,timeMod:-20},
     {text:'"Ignóralo. Corre tu carrera."',trust:+2,timeMod:+15},
   ]},
  {id:'shortcut_temptation',icon:'🗺️',title:'Atajo tentador',
   desc:'Ves lo que parece un atajo no señalizado. Ganarías tiempo pero arriesgas descalificación.',
   choices:[
     {text:'"No lo hagas. La integridad primero."',trust:+6},
     {text:'"Decide tú. Yo no lo vi."',trust:-3},
   ]},
  {id:'weather_turn',icon:'⛈️',title:'Tormenta repentina',
   desc:'Tormenta súbita a mitad de carrera. El terreno se vuelve peligroso. {{name}} pide instrucciones.',
   choices:[
     {text:'"Reduce el ritmo. Safety first."',trust:+3,timeMod:+55},
     {text:'"Aprovecha — los técnicos pierden más que tú."',trust:+1,timeMod:-10},
   ]},
  {id:'gel_crisis',icon:'🍬',title:'Sin energía',
   desc:'"Me quedé sin geles hace tres kilómetros. Me estoy hundiendo."',
   choices:[
     {text:'"Busca a alguien que te ceda uno en el siguiente avituallamiento."',trust:+3,energyBoost:12},
     {text:'"Gestiona el ritmo. Llegarás."',trust:+2,timeMod:+40},
   ]},
  {id:'cramp',icon:'⚡',title:'Calambre',
   desc:'{{name}} para en seco. Calambre en el gemelo. Te mira para saber qué hacer.',
   choices:[
     {text:'Parar 2 minutos a estirar (−2 min pero sin secuelas)',trust:+3,timeMod:+120,legBoost:10},
     {text:'Bajar ritmo y soltar la zancada',trust:+1,timeMod:+55,legBoost:5},
     {text:'Aguantar y seguir — el calor lo deshará',trust:-1,timeMod:+20},
   ]},
  {id:'fallen_competitor',icon:'🏃',title:'Corredor caído',
   desc:'Hay un corredor en el suelo a 10 metros. No parece grave pero tampoco se levanta.',
   choices:[
     {text:'Parar a ayudar (−3 min, +confianza, +reputación)',trust:+7,timeMod:+180,reputation:4},
     {text:'Preguntar si está bien y seguir (−30s)',trust:+2,timeMod:+30},
     {text:'"Hay avituallamiento cerca, alguien le ayudará."',trust:-3,timeMod:0},
   ]},
  {id:'nemesis_passes',icon:'🎯',title:'El rival pasa',
   desc:'"{{rival}} me acaba de adelantar, coach. Va fuerte. ¿Lo sigo o gestiono?"',
   choices:[
     {text:'"Deja que se vaya. Tu carrera es tuya."',trust:+3,timeMod:+20},
     {text:'"Aguanta su rueda. No le pierdas de vista."',trust:+1,timeMod:-15},
     {text:'"Ataca ahora. Es tu momento."',trust:+1,timeMod:-30,energyCost:12},
   ]},
  {id:'wrong_path',icon:'🗺️',title:'¿Es por aquí?',
   desc:'La baliza señala dos caminos. Otros corredores van por la izquierda. {{name}} duda.',
   choices:[
     {text:'"Izquierda con el grupo — riesgo mínimo."',trust:+1},
     {text:'"Derecha — confía en el recorrido que estudiamos."',trust:+2,timeMod:-25},
   ]},
];

// ── Mensajes de radio por tramo ──
const COACH_RADIO_MESSAGES=[
  {id:'push',     label:'⚡ Empuja',    desc:'Dale más intensidad',        timeMod:-20, energyCost:8},
  {id:'conserve', label:'🛡 Conserva', desc:'Guarda energía para después', timeMod:+25, energySave:5},
  {id:'attack',   label:'🗡 Ataca',    desc:'Supera posiciones ahora',     timeMod:-35, energyCost:14},
  {id:'breathe',  label:'🌬 Respira',  desc:'Relaja, baja los hombros',    timeMod:+10, trustBoost:1},
  {id:'focus',    label:'🎯 Enfoca',   desc:'Solo el siguiente km',        timeMod:-5,  trustBoost:2},
  {id:'silent',   label:'📵 Silencio', desc:'Le dejas decidir solo',       timeMod:0},
];
const SPEC_RACES={
  fondista:[
    {id:'sf1',name:'Transvulcania Ultramarathon',type:'73K ultra',   km:73,cost:200,prize:1000,reqRanking:10, desnivel:'4.200m+',weather_risk:0.30,month:5,monthName:'Mayo',    quarter:2,tier:'elite',  spec:'fondista',
     segs:[{name:'Salida Los Llanos',km:5,type:'flat',gain:0,base:1500},{name:'Valle Aridane',km:5,type:'flat',gain:0,base:1600,aid:true},{name:'Subida Inicial',km:8,type:'climb',gain:900,base:2800},{name:'Cumbre Vieja',km:6,type:'climb',gain:800,base:3200,aid:true},{name:'Bajada Técnica',km:8,type:'descent',gain:-1100,base:2200},{name:'Valle Central',km:6,type:'flat',gain:0,base:1800,aid:true},{name:'Subida Roque',km:7,type:'climb',gain:1000,base:3000},{name:'Cresta Alta',km:4,type:'flat',gain:0,base:1800,aid:true},{name:'Subida Final',km:6,type:'climb',gain:1500,base:3200},{name:'Gran Descenso',km:9,type:'descent',gain:-1400,base:2500,aid:true},{name:'Llegada Santa Cruz',km:9,type:'flat',gain:0,base:1800,aid:true}]},
    {id:'sf2',name:'Andalucía Ultra Trail',  type:'42K fondista',km:42,cost:85, prize:300, reqRanking:999,desnivel:'1.500m+',weather_risk:0.15,month:7,monthName:'Julio',    quarter:3,tier:'regional',spec:'fondista',
     segs:[{name:'Salida Almería',km:5,type:'flat',gain:0,base:1200},{name:'Subida Sierra',km:9,type:'climb',gain:700,base:2400,aid:true},{name:'Collado',km:3,type:'flat',gain:0,base:1500},{name:'Bajada',km:7,type:'descent',gain:-700,base:2000},{name:'Valle Almanzora',km:4,type:'flat',gain:0,base:1400,aid:true},{name:'Repecho Final',km:7,type:'climb',gain:800,base:2200},{name:'Descenso Meta',km:5,type:'descent',gain:-700,base:1800},{name:'Meta',km:2,type:'flat',gain:0,base:1100}]},
    {id:'sf3',name:'100 Millas de Aneto',    type:'100K ultra',  km:100,cost:200,prize:1200,reqRanking:15,desnivel:'4.500m+',weather_risk:0.25,month:10,monthName:'Octubre', quarter:4,tier:'elite',spec:'fondista',
     segs:[{name:'Salida Benasque',km:8,type:'flat',gain:0,base:1500},{name:'Subida Aneto 1',km:14,type:'climb',gain:1300,base:3100,aid:true},{name:'Collado 1',km:6,type:'flat',gain:0,base:2000},{name:'Bajada 1',km:10,type:'descent',gain:-1200,base:2200},{name:'Valle Central',km:8,type:'flat',gain:0,base:1500,aid:true},{name:'Subida Aneto 2',km:14,type:'climb',gain:1700,base:3300},{name:'Collado 2',km:4,type:'flat',gain:0,base:2000,aid:true},{name:'Subida Final',km:10,type:'climb',gain:1500,base:3200,aid:true},{name:'Gran Descenso',km:14,type:'descent',gain:-1400,base:2800},{name:'Meta Benasque',km:12,type:'flat',gain:0,base:1500}]},
  ],
  montanero:[
    {id:'sm1',name:'Zegama Skyrace',          type:'25K vertical',km:25,cost:80, prize:280, reqRanking:999,desnivel:'2.200m+',weather_risk:0.35,month:3,monthName:'Marzo',    quarter:1,tier:'regional',spec:'montanero',
     segs:[{name:'Salida',km:2,type:'flat',gain:0,base:900},{name:'Subida Continua',km:10,type:'climb',gain:2200,base:3500,aid:true},{name:'Cresta',km:3,type:'flat',gain:0,base:1200},{name:'Bajada Técnica',km:7,type:'descent',gain:-1800,base:2200},{name:'Meta',km:3,type:'flat',gain:0,base:1000}]},
    {id:'sm2',name:'Trail dels Bastions',     type:'50K montaña', km:50,cost:120,prize:600, reqRanking:20, desnivel:'3.000m+',weather_risk:0.30,month:7,monthName:'Julio',    quarter:3,tier:'nacional',spec:'montanero',
     segs:[{name:'Salida',km:4,type:'flat',gain:0,base:1100},{name:'Subida 1',km:9,type:'climb',gain:900,base:2800,aid:true},{name:'Cresta Alta',km:4,type:'flat',gain:0,base:1600},{name:'Bajada Técnica',km:7,type:'descent',gain:-800,base:2400},{name:'Valle',km:5,type:'flat',gain:0,base:1400,aid:true},{name:'Subida 2',km:9,type:'climb',gain:1100,base:3000},{name:'Collado',km:3,type:'flat',gain:0,base:1600,aid:true},{name:'Subida 3',km:6,type:'climb',gain:1000,base:2800},{name:'Bajada Final',km:3,type:'descent',gain:-900,base:1900}]},
    {id:'sm3',name:'UTMB OCC',                type:'55K élite mt',km:55,cost:160,prize:900, reqRanking:12, desnivel:'3.500m+',weather_risk:0.40,month:8,monthName:'Agosto',   quarter:3,tier:'elite',spec:'montanero',
     segs:[{name:'Salida Orsières',km:4,type:'flat',gain:0,base:900},{name:'Subida Champex',km:10,type:'climb',gain:1400,base:3000,aid:true},{name:'Lac de Champex',km:4,type:'flat',gain:0,base:1200},{name:'Bajada Vallorcine',km:8,type:'descent',gain:-1100,base:2200,aid:true},{name:'Valle Montagne',km:5,type:'flat',gain:0,base:1100,aid:true},{name:'Subida Tête Vents',km:9,type:'climb',gain:1300,base:3000},{name:'Cresta Brévent',km:3,type:'flat',gain:0,base:1600,aid:true},{name:'Subida Final',km:5,type:'climb',gain:800,base:2600},{name:'Gran Descenso Chamonix',km:7,type:'descent',gain:-1000,base:2000}]},
  ],
  tecnico:[
    {id:'st1',name:'Descenso de Jaca',        type:'18K técnico', km:18,cost:55, prize:160, reqRanking:999,desnivel:'800m+', weather_risk:0.20,month:5,monthName:'Mayo',     quarter:2,tier:'regional',spec:'tecnico',
     segs:[{name:'Salida',km:2,type:'flat',gain:0,base:800},{name:'Subida',km:4,type:'climb',gain:400,base:1600},{name:'Cresta',km:2,type:'flat',gain:0,base:900,aid:true},{name:'Bajada Técnica',km:6,type:'descent',gain:-800,base:2000},{name:'Meta',km:4,type:'flat',gain:0,base:1100}]},
    {id:'st2',name:'TransValles Cantábrico',  type:'30K técnico', km:30,cost:80, prize:260, reqRanking:25, desnivel:'1.600m+',weather_risk:0.25,month:8,monthName:'Agosto',   quarter:3,tier:'nacional',spec:'tecnico',
     segs:[{name:'Salida',km:3,type:'flat',gain:0,base:1000},{name:'Subida',km:5,type:'climb',gain:600,base:2100},{name:'Cresta',km:3,type:'flat',gain:0,base:1100,aid:true},{name:'Bajada Técnica 1',km:5,type:'descent',gain:-700,base:2200},{name:'Puerto',km:4,type:'climb',gain:400,base:1800,aid:true},{name:'Bajada Final',km:6,type:'descent',gain:-900,base:2500},{name:'Meta',km:4,type:'flat',gain:0,base:1100}]},
    {id:'st3',name:'TransPirenaica Técnica',  type:'40K técnico', km:40,cost:110,prize:500, reqRanking:15, desnivel:'2.200m+',weather_risk:0.30,month:11,monthName:'Noviembre',quarter:4,tier:'elite',spec:'tecnico',
     segs:[{name:'Salida',km:4,type:'flat',gain:0,base:1200},{name:'Subida',km:7,type:'climb',gain:700,base:2400},{name:'Alto',km:5,type:'flat',gain:0,base:1400,aid:true},{name:'Bajada 1',km:6,type:'descent',gain:-800,base:2300},{name:'Repecho',km:5,type:'climb',gain:500,base:1900,aid:true},{name:'Descenso Final',km:8,type:'descent',gain:-1100,base:2800},{name:'Meta',km:5,type:'flat',gain:0,base:1100}]},
  ],
  todoterreno:[
    {id:'stt1',name:'Copa Spain Trail',        type:'28K mixto',   km:28,cost:65, prize:200, reqRanking:999,desnivel:'1.000m+',weather_risk:0.18,month:4,monthName:'Abril',   quarter:2,tier:'regional',spec:'todoterreno',
     segs:[{name:'Salida',km:4,type:'flat',gain:0,base:1200},{name:'Subida',km:6,type:'climb',gain:500,base:2000},{name:'Cresta',km:3,type:'flat',gain:0,base:1100,aid:true},{name:'Bajada',km:6,type:'descent',gain:-500,base:1800},{name:'Llano',km:5,type:'flat',gain:0,base:1300},{name:'Meta',km:4,type:'climb',gain:200,base:1500}]},
    {id:'stt2',name:'Ultra Alpujarra Trail',   type:'35K mixto',   km:35,cost:85, prize:320, reqRanking:22, desnivel:'2.000m+',weather_risk:0.22,month:8,monthName:'Agosto',   quarter:3,tier:'nacional',spec:'todoterreno',
     segs:[{name:'Salida',km:5,type:'flat',gain:0,base:1300},{name:'Subida',km:7,type:'climb',gain:600,base:2200},{name:'Alto',km:5,type:'flat',gain:0,base:1400,aid:true},{name:'Bajada',km:7,type:'descent',gain:-600,base:1900},{name:'Valle',km:6,type:'flat',gain:0,base:1500,aid:true},{name:'Meta',km:5,type:'climb',gain:300,base:1700}]},
    {id:'stt3',name:'Transandalus Trail',      type:'50K mixto',   km:50,cost:130,prize:650, reqRanking:15, desnivel:'2.000m+',weather_risk:0.28,month:10,monthName:'Octubre', quarter:4,tier:'elite',spec:'todoterreno',
     segs:[{name:'Salida',km:6,type:'flat',gain:0,base:1500},{name:'Subida Larga',km:8,type:'climb',gain:800,base:2600},{name:'Cima',km:6,type:'flat',gain:0,base:1700,aid:true},{name:'Bajada Técnica',km:8,type:'descent',gain:-900,base:2300},{name:'Llanura',km:7,type:'flat',gain:0,base:1700,aid:true},{name:'Último Puerto',km:6,type:'climb',gain:700,base:2400},{name:'Descenso Meta',km:9,type:'descent',gain:-600,base:2100,aid:true}]},
  ],
};

// ══════════════════════════════════════
//  CIRCUITOS / LIGAS
// ══════════════════════════════════════
const CIRCUITS_DB=[
  {id:'copa_trail',name:'Copa Trail España',color:'#4a90d9',
   desc:'Liga nacional con 3 pruebas clave. Acumula puntos para el podio final.',
   prize:'€500 + patrocinio garantizado para el top 3',
   raceIds:['copa','junio','sierra'],
   pointsForPrize:150,
   reward:{money:500,sponsorBonus:true}},
  {id:'circuito_montaña',name:'Circuito de Alta Montaña',color:'#4a8a2a',
   desc:'3 pruebas de montaña exigentes. Solo para los mejores.',
   prize:'€800 + acceso directo al Monte Perdido',
   raceIds:['agosto','sm2','sm3'],
   pointsForPrize:180,
   reqRanking:25,
   reward:{money:800,unlockElite:true}},
  {id:'liga_local',name:'Liga Local Trail',color:'#888',
   desc:'Perfecta para el año 1. 3 pruebas accesibles con buena recompensa.',
   prize:'€200 + visibilidad ante sponsors locales',
   raceIds:['pinar','febrero','octubre'],
   pointsForPrize:80,
   reward:{money:200,followerBonus:500}},
];

// ══════════════════════════════════════
//  MODO ULTRATRAIL
// ══════════════════════════════════════
const ULTRATRAIL_RACES={
  1:[
    {id:'ut_zegama',name:'Maratón Montaña Zegama',km:42,desnivel:'2.728m+',
     month:5,monthName:'Mayo',type:'prep',tier:'regional',
     cost:80,prize:200,cutoffs:[{cp:'Aizkorri km22',maxH:3.5}],
     nocturna:false,crew:false,
     segs:[
       {name:'Salida Zegama',km:6,type:'flat',gain:0,base:1600},
       {name:'Aizkorri subida',km:8,type:'climb',gain:900,base:3200,aid:true},
       {name:'Cresta Aizkorri',km:5,type:'flat',gain:0,base:1800},
       {name:'Descenso Aratz',km:7,type:'descent',gain:-800,base:2200,aid:true},
       {name:'Subida Murumendi',km:8,type:'climb',gain:700,base:2800},
       {name:'Llegada Zegama',km:8,type:'descent',gain:-800,base:2000,aid:true}
     ]},
    {id:'ut_pirineos80',name:'Ultra Pirineos 80K',km:80,desnivel:'4.800m+',
     month:8,monthName:'Agosto',type:'objetivo',tier:'nacional',
     cost:150,prize:600,
     cutoffs:[
       {cp:'Refugio Respomuso km28',maxH:7},
       {cp:'Sallent de Gállego km55',maxH:13},
       {cp:'Meta Sallent',maxH:18}
     ],
     nocturna:true,nocturnaStart:55,nocturnaEnd:72,crew:false,
     segs:[
       {name:'Salida Formigal',km:7,type:'flat',gain:0,base:1800},
       {name:'Subida Anayet',km:9,type:'climb',gain:900,base:3200},
       {name:'Valle Tena',km:6,type:'flat',gain:0,base:1700,aid:true},
       {name:'Puerto del Palo',km:8,type:'climb',gain:800,base:3000},
       {name:'Cresta Alta',km:5,type:'flat',gain:0,base:1900},
       {name:'Bajada Técnica',km:7,type:'descent',gain:-900,base:2400,aid:true},
       {name:'Refugio Respomuso',km:8,type:'climb',gain:700,base:2800,aid:true},
       {name:'Sección Llana',km:6,type:'flat',gain:0,base:1700},
       {name:'Subida Nocturna',km:8,type:'climb',gain:600,base:3100},
       {name:'Cresta Nocturna',km:7,type:'flat',gain:0,base:2000,aid:true},
       {name:'Gran Descenso Final',km:9,type:'descent',gain:-900,base:2600,aid:true}
     ]},
    {id:'ut_menorca50',name:'Trail Menorca 50K',km:50,desnivel:'1.500m+',
     month:10,monthName:'Octubre',type:'cierre',tier:'regional',
     cost:90,prize:300,cutoffs:[{cp:'CP Central km28',maxH:8}],
     nocturna:false,crew:false,
     segs:[
       {name:'Salida Ciutadella',km:7,type:'flat',gain:0,base:1600},
       {name:'Camí de Cavalls N',km:9,type:'flat',gain:0,base:1500,aid:true},
       {name:'Subida Monte Toro',km:7,type:'climb',gain:400,base:2200},
       {name:'Bajada Este',km:6,type:'descent',gain:-400,base:1900,aid:true},
       {name:'Costa Sur',km:8,type:'flat',gain:0,base:1600},
       {name:'Subida Final',km:6,type:'climb',gain:300,base:2100},
       {name:'Llegada Maó',km:7,type:'flat',gain:0,base:1700,aid:true}
     ]}
  ],
  2:[
    {id:'ut_med42',name:'Maratón Mediterráneo Trail',km:42,desnivel:'2.200m+',
     month:4,monthName:'Abril',type:'prep',tier:'regional',
     cost:80,prize:250,cutoffs:[{cp:'CP km22',maxH:4}],
     nocturna:false,crew:false,
     segs:[
       {name:'Salida',km:6,type:'flat',gain:0,base:1600},
       {name:'Subida Serra',km:8,type:'climb',gain:700,base:2800},
       {name:'Cresta',km:5,type:'flat',gain:0,base:1700,aid:true},
       {name:'Bajada',km:7,type:'descent',gain:-700,base:2100},
       {name:'Llano costero',km:8,type:'flat',gain:0,base:1600,aid:true},
       {name:'Subida final',km:4,type:'climb',gain:300,base:2000},
       {name:'Meta',km:4,type:'flat',gain:0,base:1600}
     ]},
    {id:'ut_buff105',name:'Buff Epic Trail 105K',km:105,desnivel:'6.000m+',
     month:9,monthName:'Septiembre',type:'objetivo',tier:'elite',
     cost:200,prize:1200,
     cutoffs:[
       {cp:'Espot km35',maxH:8},
       {cp:'Tavascan km65',maxH:15},
       {cp:'Llessui km85',maxH:21},
       {cp:'Meta Sort',maxH:27}
     ],
     nocturna:true,nocturnaStart:65,nocturnaEnd:88,crew:false,
     segs:[
       {name:'Salida Sort',km:8,type:'flat',gain:0,base:1900},
       {name:'Subida Pallars',km:10,type:'climb',gain:1000,base:3400},
       {name:'Cresta Pirineo',km:7,type:'flat',gain:0,base:2100,aid:true},
       {name:'Bajada Espot',km:9,type:'descent',gain:-1100,base:2600,aid:true},
       {name:'Valle Àneu',km:8,type:'flat',gain:0,base:1900},
       {name:'Subida Alta',km:10,type:'climb',gain:1100,base:3500,aid:true},
       {name:'Travesía Alta',km:8,type:'flat',gain:0,base:2200},
       {name:'Bajada Nocturna',km:9,type:'descent',gain:-1000,base:2800,aid:true},
       {name:'Subida Nocturna',km:10,type:'climb',gain:900,base:3300},
       {name:'Cresta Final',km:7,type:'flat',gain:0,base:2100,aid:true},
       {name:'Gran Descenso',km:10,type:'descent',gain:-1000,base:2700},
       {name:'Llegada Llessui',km:9,type:'flat',gain:0,base:2000,aid:true}
     ]}
  ],
  3:[
    {id:'ut_ccc100',name:'CCC - Courmayeur Champex Chamonix',km:100,desnivel:'6.100m+',
     month:8,monthName:'Agosto',type:'prep',tier:'elite',
     cost:250,prize:1000,
     cutoffs:[
       {cp:'Champex-Lac km63',maxH:15},
       {cp:'Vallorcine km87',maxH:22},
       {cp:'Meta Chamonix',maxH:26.5}
     ],
     nocturna:true,nocturnaStart:55,nocturnaEnd:78,
     crew:true,crewCPs:['Champex-Lac km63','Vallorcine km87'],
     segs:[
       {name:'Salida Courmayeur',km:8,type:'flat',gain:0,base:2000},
       {name:'Subida Grand Col Ferret',km:12,type:'climb',gain:1200,base:3800,aid:true},
       {name:'Bajada La Fouly',km:9,type:'descent',gain:-1100,base:2700,aid:true},
       {name:'Val Ferret',km:8,type:'flat',gain:0,base:2000},
       {name:'Subida Champex',km:10,type:'climb',gain:900,base:3200,aid:true},
       {name:'Bosques Valais',km:9,type:'flat',gain:0,base:2100},
       {name:'Subida Nocturna Catogne',km:10,type:'climb',gain:800,base:3100,aid:true},
       {name:'Bajada Nocturna',km:9,type:'descent',gain:-900,base:2800},
       {name:'Subida Tête aux Vents',km:8,type:'climb',gain:700,base:3000,aid:true},
       {name:'Cresta Final',km:8,type:'flat',gain:0,base:2200},
       {name:'Llegada Chamonix',km:9,type:'descent',gain:-700,base:2400,aid:true}
     ]},
    {id:'ut_tds145',name:'TDS - Sur les Traces des Ducs',km:145,desnivel:'9.100m+',
     month:8,monthName:'Agosto',type:'objetivo',tier:'elite',
     cost:300,prize:1800,
     cutoffs:[
       {cp:'Bourg Saint Maurice km45',maxH:10},
       {cp:'Les Chapieux km75',maxH:17},
       {cp:'Courmayeur km110',maxH:27},
       {cp:'Meta Chamonix',maxH:38}
     ],
     nocturna:true,nocturnaStart:80,nocturnaEnd:115,
     crew:true,crewCPs:['Courmayeur km110'],
     segs:[
       {name:'Salida Courmayeur',km:10,type:'flat',gain:0,base:2100},
       {name:'Subida Mont Favre',km:12,type:'climb',gain:1300,base:4000,aid:true},
       {name:'Travesía Alta',km:10,type:'flat',gain:0,base:2300},
       {name:'Bajada Les Chapieux',km:11,type:'descent',gain:-1200,base:3000,aid:true},
       {name:'Val Veny',km:9,type:'flat',gain:0,base:2100},
       {name:'Subida Col Checrouit',km:11,type:'climb',gain:1100,base:3500,aid:true},
       {name:'Cresta Alta',km:9,type:'flat',gain:0,base:2400},
       {name:'Bajada Nocturna',km:12,type:'descent',gain:-1100,base:3100,aid:true},
       {name:'Subida Nocturna',km:11,type:'climb',gain:1000,base:3700},
       {name:'Cresta Nocturna',km:9,type:'flat',gain:0,base:2500,aid:true},
       {name:'Subida Fenêtre dArpette',km:12,type:'climb',gain:1200,base:3900,aid:true},
       {name:'Bajada Chamonix',km:11,type:'descent',gain:-1100,base:2900},
       {name:'Valle Final',km:8,type:'flat',gain:0,base:2200,aid:true}
     ]}
  ],
  4:[
    {id:'ut_mds',name:'Marathon des Sables',km:250,desnivel:'2.500m+',
     month:4,monthName:'Abril',type:'objetivo_especial',tier:'elite',
     cost:3500,prize:5000,isMDS:true,
     etapas:[
       {id:'mds_e1',name:'Etapa 1 — Bienvenida al desierto',km:32,
        jugable:true,cutoffs:[{cp:'Meta etapa',maxH:6}],
        segs:[
          {name:'Salida campamento',km:6,type:'flat',gain:0,base:1700},
          {name:'Primer erg',km:8,type:'climb',gain:200,base:2000,aid:true},
          {name:'Valle rocoso',km:7,type:'flat',gain:0,base:1800},
          {name:'Dunas pequeñas',km:7,type:'climb',gain:150,base:2200},
          {name:'Meta etapa 1',km:4,type:'flat',gain:0,base:1600,aid:true}
        ]},
       {id:'mds_e2',name:'Etapa 2 — El calor aumenta',km:39,jugable:false,
        decisiones:[
          {texto:'Ritmo conservador',efecto:{combustible:10,pies:-5,tiempo:25}},
          {texto:'Ritmo agresivo',efecto:{combustible:-15,pies:-15,tiempo:-20}},
          {texto:'Gestión perfecta',efecto:{combustible:0,hidratacion:10,tiempo:5}}
        ]},
       {id:'mds_e3',name:'Etapa 3 — Las dunas',km:36,jugable:false,
        decisiones:[
          {texto:'Bastones en las dunas',efecto:{pies:-8,piernas:-5,tiempo:20}},
          {texto:'Sin bastones',efecto:{pies:-18,piernas:-15,tiempo:-15}},
          {texto:'Curar ampollas en CP',efecto:{pies:20,tiempo:10}}
        ]},
       {id:'mds_e4',name:'Etapa 4 — La Larga (86K)',km:86,jugable:true,
        cutoffs:[{cp:'CP intermedio km45',maxH:12},{cp:'Meta etapa',maxH:22}],
        segs:[
          {name:'Salida temprana',km:8,type:'flat',gain:0,base:1900},
          {name:'Dunas grandes',km:10,type:'climb',gain:300,base:2800,aid:true},
          {name:'Valle del viento',km:9,type:'flat',gain:0,base:1800},
          {name:'Jebel subida',km:11,type:'climb',gain:400,base:3000,aid:true},
          {name:'Travesía alta',km:9,type:'flat',gain:0,base:2100},
          {name:'Descenso largo',km:10,type:'descent',gain:-400,base:2200,aid:true},
          {name:'Sección nocturna',km:11,type:'flat',gain:0,base:2000},
          {name:'Dunas finales',km:10,type:'climb',gain:200,base:2600,aid:true},
          {name:'Meta etapa 4',km:8,type:'flat',gain:0,base:1900,aid:true}
        ]},
       {id:'mds_e5',name:'Etapa 5 — Supervivencia',km:42,jugable:true,
        cutoffs:[{cp:'Meta etapa',maxH:9}],
        segs:[
          {name:'Salida dolorosa',km:7,type:'flat',gain:0,base:2100},
          {name:'Erg final',km:9,type:'climb',gain:200,base:2400,aid:true},
          {name:'Valle de piedras',km:8,type:'flat',gain:0,base:2000},
          {name:'Jebel último',km:9,type:'climb',gain:250,base:2600,aid:true},
          {name:'Llegada campamento',km:9,type:'descent',gain:-250,base:2200,aid:true}
        ]},
       {id:'mds_e6',name:'Etapa 6 — Llegada',km:15,jugable:false,
        cinematica:true,
        texto:'Los últimos kilómetros del desierto. El cuerpo ya no siente el dolor. Solo la meta.'}
     ]},
    {id:'ut_utmb170',name:'UTMB - Ultra Trail du Mont Blanc',km:170,
     desnivel:'10.000m+',month:8,monthName:'Agosto',
     type:'objetivo',tier:'elite',cost:400,prize:3000,
     cutoffs:[
       {cp:'Les Contamines km31',maxH:8},
       {cp:'Courmayeur km79',maxH:19.5},
       {cp:'Champex-Lac km125',maxH:29},
       {cp:'Meta Chamonix',maxH:46.5}
     ],
     nocturna:true,nocturnaStart:100,nocturnaEnd:140,
     crew:true,crewCPs:['Courmayeur km79','Champex-Lac km125','Vallorcine km155'],
     segs:[
       {name:'Salida Chamonix',km:10,type:'flat',gain:0,base:2200},
       {name:'Les Houches subida',km:11,type:'climb',gain:1000,base:3500,aid:true},
       {name:'Saint Gervais bajada',km:10,type:'descent',gain:-900,base:2800,aid:true},
       {name:'Les Contamines',km:10,type:'flat',gain:0,base:2100,aid:true},
       {name:'Col du Bonhomme',km:12,type:'climb',gain:1200,base:3900},
       {name:'Val Veny',km:11,type:'descent',gain:-1100,base:2900,aid:true},
       {name:'Courmayeur subida',km:11,type:'climb',gain:1100,base:3700,aid:true},
       {name:'Grand Col Ferret',km:12,type:'climb',gain:1000,base:3600},
       {name:'La Fouly bajada',km:10,type:'descent',gain:-1000,base:2800,aid:true},
       {name:'Champex-Lac',km:11,type:'climb',gain:800,base:3200,aid:true},
       {name:'Tramo nocturno largo',km:12,type:'flat',gain:0,base:2400},
       {name:'Subida nocturna',km:11,type:'climb',gain:900,base:3500,aid:true},
       {name:'Bajada Vallorcine',km:10,type:'descent',gain:-900,base:2700,aid:true},
       {name:'Llegada Chamonix',km:9,type:'flat',gain:0,base:2300,aid:true}
     ]}
  ],
  5:[
    {id:'ut_transgran128',name:'Transgrancanaria',km:128,desnivel:'7.300m+',
     month:3,monthName:'Marzo',type:'prep',tier:'elite',
     cost:200,prize:1500,
     cutoffs:[
       {cp:'Tejeda km50',maxH:12},
       {cp:'Cruz de Tejeda km80',maxH:19},
       {cp:'Meta Las Palmas',maxH:28}
     ],
     nocturna:true,nocturnaStart:70,nocturnaEnd:100,crew:false,
     segs:[
       {name:'Salida Agaete',km:9,type:'flat',gain:0,base:2000},
       {name:'Subida interior',km:12,type:'climb',gain:1100,base:3600,aid:true},
       {name:'Cresta volcánica',km:10,type:'flat',gain:0,base:2200},
       {name:'Bajada Tejeda',km:11,type:'descent',gain:-1000,base:2800,aid:true},
       {name:'Valle central',km:10,type:'flat',gain:0,base:2100},
       {name:'Subida Cruz',km:12,type:'climb',gain:1000,base:3500,aid:true},
       {name:'Tramo nocturno',km:12,type:'flat',gain:0,base:2300},
       {name:'Subida nocturna',km:11,type:'climb',gain:900,base:3400,aid:true},
       {name:'Bajada Las Palmas',km:12,type:'descent',gain:-1000,base:2900},
       {name:'Costa llegada',km:9,type:'flat',gain:0,base:2000,aid:true}
     ]},
    {id:'ut_tor330',name:'Tor des Géants',km:330,desnivel:'24.000m+',
     month:9,monthName:'Septiembre',type:'objetivo',tier:'elite',
     cost:600,prize:5000,isTOR:true,maxHoras:150,
     cutoffs:[
       {cp:'Cogne km78',maxH:22},
       {cp:'Ollomont km145',maxH:45},
       {cp:'Valpelline km220',maxH:72},
       {cp:'Donnas km278',maxH:96},
       {cp:'Meta Courmayeur',maxH:150}
     ],
     nocturna:true,nocturnaStart:0,nocturnaEnd:330,
     crew:true,crewCPs:['Cogne km78','Ollomont km145','Donnas km278'],
     microSiestas:true,segs:[]}
  ],
  6:[
    {id:'ut_spine431',name:'Spine Race',km:431,desnivel:'12.000m+',
     month:1,monthName:'Enero',type:'objetivo',tier:'elite',
     cost:800,prize:6000,isSpine:true,
     descripcion:'Pennine Way completo. Enero. Lluvia, barro, nieve. 7 días.',
     cutoffs:[
       {cp:'Hawes km165',maxH:60},
       {cp:'Middleton km280',maxH:100},
       {cp:'Meta Kirk Yetholm',maxH:168}
     ],
     nocturna:true,nocturnaStart:0,nocturnaEnd:431,crew:false,segs:[]}
  ],
  7:[
    {id:'ut_moab386',name:'Moab 240',km:386,desnivel:'12.400m+',
     month:10,monthName:'Octubre',type:'objetivo',tier:'elite',
     cost:700,prize:5000,
     cutoffs:[
       {cp:'Green River km130',maxH:44},
       {cp:'Moab km260',maxH:84},
       {cp:'Meta',maxH:117}
     ],
     nocturna:true,nocturnaStart:0,nocturnaEnd:386,
     crew:true,crewCPs:['Green River km130','Moab km260'],segs:[]}
  ],
  8:[
    {id:'ut_gran_travesia',name:'La Gran Travesía',km:500,desnivel:'28.000m+',
     month:7,monthName:'Julio',type:'endgame',tier:'elite',
     cost:1200,prize:10000,isEndgame:true,
     descripcion:'500K de los Pirineos al Mediterráneo. 7 etapas. El final de todo.',
     cutoffs:[
       {cp:'Pamplona km80',maxH:24},
       {cp:'Jaca km165',maxH:50},
       {cp:'Benasque km250',maxH:78},
       {cp:'Andorra km330',maxH:104},
       {cp:'La Seu km380',maxH:122},
       {cp:'Berga km430',maxH:140},
       {cp:'Meta Sitges',maxH:168}
     ],
     nocturna:true,nocturnaStart:0,nocturnaEnd:500,
     crew:true,crewCPs:['Jaca km165','Benasque km250','Andorra km330','Berga km430'],
     segs:[]}
  ]
};

const BACKYARD_CONFIG={
  loopKm:6.706,
  minutesPerLoop:60,
  rivalNames:[
    {name:'Harvey Lewis',flag:'🇺🇸'},{name:'Ihor Verys',flag:'🇺🇦'},
    {name:'Damian Hall',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},{name:'Beth Pascall',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},
    {name:'Tom Hollins',flag:'🇬🇧'},{name:'Carla Molinaro',flag:'🇬🇧'},
    {name:'Olivier Leblond',flag:'🇫🇷'},{name:'Antoine Guillon',flag:'🇫🇷'},
    {name:'Michał Nowak',flag:'🇵🇱'},{name:'Sara Alonso',flag:'🇪🇸'},
    {name:'Ibon Urdangarin',flag:'🇪🇸'},{name:'Kilian Puerta',flag:'🇪🇸'},
    {name:'Lars Hansen',flag:'🇩🇰'},{name:'Marta Ryś',flag:'🇵🇱'},
    {name:'Yuki Kawamoto',flag:'🇯🇵'},{name:'Pedro Crespo',flag:'🇧🇷'},
    {name:'Ana Fernández',flag:'🇪🇸'},{name:'Marco Oliveri',flag:'🇮🇹'},
    {name:'Lena Braun',flag:'🇩🇪'},{name:'Johan Ek',flag:'🇸🇪'}
  ]
};

const BACKYARD_ITEMS=[
  {id:'racion_solida',label:'Ración sólida',icon:'🍞',
   desc:'Comida real. Esencial para aguantar.',
   pesoG:300,unidadesBase:12,maxUnidades:20,efecto:{combustible:25}},
  {id:'gel',label:'Gel energético',icon:'🧃',
   desc:'Energía rápida. No sustituye a la comida.',
   pesoG:45,unidadesBase:20,maxUnidades:30,efecto:{energia:15}},
  {id:'sales',label:'Sales minerales',icon:'💊',
   desc:'Previene calambres. Vital en calor.',
   pesoG:80,unidadesBase:30,maxUnidades:30,
   efecto:{piernas:8,hidratacion:5},unlockedYear:4},
  {id:'vendas',label:'Vendas para pies',icon:'🩹',
   desc:'Trata ampollas. Resetea el stat Pies parcialmente.',
   pesoG:60,unidadesBase:3,maxUnidades:6,efecto:{pies:30}},
  {id:'ibuprofeno',label:'Ibuprofeno',icon:'💊',
   desc:'Reduce dolor. Úsalo con cuidado.',
   pesoG:20,unidadesBase:6,maxUnidades:6,
   efecto:{piernas:12,energia:5},
   advertencia:'Uso excesivo oculta lesiones reales',unlockedYear:4},
  {id:'ropa_abrigo',label:'Ropa de abrigo',icon:'🧥',
   desc:'Loops nocturnos: evita penalización por frío.',
   pesoG:400,unidadesBase:1,maxUnidades:1,esEquipamiento:true}
];

// Puntos por posición en carrera de circuito
const FAME_ACTIONS=[
  {id:'reel',      label:'Subir reel de entrenamiento',  icon:'🎬',
   desc:'Contenido rápido. Pocos seguidores pero constante.',
   hours:2, followers:200, cost:0,  cooldown:1},
  {id:'podcast',   label:'Entrevista en podcast',         icon:'🎙',
   desc:'Visibilidad media. Sin coste de tiempo alto.',
   hours:2, followers:350, cost:0,  cooldown:2},
  {id:'clinic',    label:'Clínica de trail running',       icon:'🏫',
   desc:'Enseñas a otros. Seguidores + stat Mental.',
   hours:5, followers:450, cost:0,  cooldown:3, statBonus:{mental:1}},
  {id:'vlog',      label:'Vlog de una carrera',           icon:'🎥',
   desc:'Más currado. Necesitas haber corrido recientemente.',
   hours:4, followers:600, cost:0,  cooldown:2, reqLastRace:true},
  {id:'solidaria', label:'Carrera solidaria',             icon:'🤝',
   desc:'Imagen pública. Seguidores + reputación con sponsors.',
   hours:6, followers:900, cost:30, cooldown:4, sponsorBonus:true},
  {id:'anuncio',   label:'Rodar anuncio con marca',       icon:'📺',
   desc:'Solo si tienes sponsor activo. Ingresos extra.',
   hours:8, followers:1200, cost:0,  cooldown:3, reqSponsor:true, income:150},
];

// Seguidores necesarios para desbloquear beneficios
const FAME_THRESHOLDS=[
  {followers:200,   label:'Cara conocida',        benefit:'Los rivales te reconocen en la salida'},
  {followers:500,   label:'Conocido local',        benefit:'Los eventos locales te mencionan'},
  {followers:1000,  label:'Micro-influencer',      benefit:'+10% salario sponsors · sponsors locales te contactan primero'},
  {followers:2500,  label:'Voz del trail',         benefit:'+15% salario · descuento inscripciones -10%'},
  {followers:5000,  label:'Conocido en el circuito', benefit:'+20% salario · 1 invitación regional/temporada · sponsors tier 2 antes de año 3'},
  {followers:10000, label:'Referente regional',    benefit:'+28% salario · 1 invitación nacional/temporada · sponsors hacen ofertas sin buscarlas'},
  {followers:15000, label:'Figura nacional',       benefit:'+35% salario · 2 invitaciones nacionales/temporada · sponsors tier 3 antes de año 4'},
  {followers:25000, label:'Embajador del trail',   benefit:'+42% salario · 1 invitación élite/temporada'},
  {followers:50000, label:'Leyenda mediática',     benefit:'+52% salario · 2 invitaciones élite/temporada · sponsors tier 4 desde año 3'},
  {followers:100000,label:'Icono del trail',       benefit:'+65% salario · acceso libre a cualquier carrera · marca propia se desbloquea antes'},
];
// ══════════════════════════════════════
//  MODO CLUB — CONSTANTES
// ══════════════════════════════════════
const CLUB_RUNNER_POOL=[
  {id:'cr1', name:'Iker Garmendia',  flag:'🇪🇸', spec:'montanero',  age:24, stats:{resistencia:52,velocidad:44,subida:65,bajada:55}, salary:150, potential:'alto',   bio:'Joven del Pirineo. Sube como un cabra.'},
  {id:'cr2', name:'Amaia Etxeberria',flag:'🇪🇸', spec:'fondista',   age:29, stats:{resistencia:68,velocidad:54,subida:50,bajada:48}, salary:180, potential:'medio',  bio:'Fondo sólido. Gana en los tramos largos.'},
  {id:'cr3', name:'Josu Markiegi',   flag:'🇪🇸', spec:'tecnico',    age:32, stats:{resistencia:55,velocidad:58,subida:52,bajada:70}, salary:200, potential:'bajo',   bio:'Veterano del circuito. Bajadas de manual.'},
  {id:'cr4', name:'Nere Iturbe',     flag:'🇪🇸', spec:'todoterreno',age:26, stats:{resistencia:60,velocidad:56,subida:58,bajada:58}, salary:170, potential:'alto',   bio:'Polivalente. Se adapta a cualquier terreno.'},
  {id:'cr5', name:'Unai Lazkano',    flag:'🇪🇸', spec:'montanero',  age:21, stats:{resistencia:44,velocidad:48,subida:60,bajada:50}, salary:100, potential:'alto',   bio:'Sub-23 con hambre. Poco rodaje, mucho talento.'},
  {id:'cr6', name:'Miren Azpeitia',  flag:'🇪🇸', spec:'fondista',   age:34, stats:{resistencia:70,velocidad:50,subida:48,bajada:46}, salary:190, potential:'bajo',   bio:'Resistencia bruta. Mejor en ultras largas.'},
  {id:'cr7', name:'Gorka Tellería',  flag:'🇪🇸', spec:'tecnico',    age:28, stats:{resistencia:56,velocidad:62,subida:54,bajada:66}, salary:210, potential:'medio',  bio:'Ex-ciclista reconvertido. Rápido en llano.'},
  {id:'cr8', name:'Leire Ugarte',    flag:'🇪🇸', spec:'todoterreno',age:31, stats:{resistencia:62,velocidad:55,subida:60,bajada:58}, salary:175, potential:'medio',  bio:'Constante y fiable. La capitana ideal.'},
  {id:'cr9', name:'Aritz Agirre',    flag:'🇪🇸', spec:'montanero',  age:27, stats:{resistencia:58,velocidad:50,subida:72,bajada:52}, salary:220, potential:'alto',   bio:'Especialista en vertical. Fuera de serie en rampas.'},
  {id:'cr10',name:'Ane Goikoetxea',  flag:'🇪🇸', spec:'fondista',   age:23, stats:{resistencia:50,velocidad:52,subida:46,bajada:50}, salary:120, potential:'alto',   bio:'Recién llegada al trail. Viene del atletismo de pista.'},
  {id:'cr11',name:'Txomin Elosegi',  flag:'🇪🇸', spec:'tecnico',    age:36, stats:{resistencia:60,velocidad:55,subida:50,bajada:68}, salary:160, potential:'bajo',   bio:'Alma del club. Nunca abandona. Liderazgo natural.'},
  {id:'cr12',name:'Itziar Mendiburu',flag:'🇪🇸', spec:'todoterreno',age:25, stats:{resistencia:55,velocidad:58,subida:62,bajada:60}, salary:155, potential:'alto',   bio:'Talento sin pulir. Necesita disciplina de entreno.'},
];

// ── Roles de plantilla (C8) ────────────────────────────────────────────────
const CLUB_ROLES={
  capitan:    {label:'Capitán',    emoji:'⭐',color:'#c07a10',
    desc:'Sube la cohesión del equipo en +5 por temporada. Bonus de rendimiento a corredores cercanos.',
    cohesionBonus:5, perfBonus:4, crewBonus:true},
  promesa:    {label:'Promesa',    emoji:'🌱',color:'#2d7a2d',
    desc:'Progresa un 50% más rápido que el resto. Solo menores de 26 años.',
    growthBonus:1.5, perfBonus:0},
  especialista:{label:'Especialista',emoji:'🎯',color:'#4a90d9',
    desc:'Bonus +10 de rendimiento en carreras de su especialidad.',
    perfBonus:10, specBonus:true},
  gregario:   {label:'Gregario',  emoji:'🤝',color:'#888',
    desc:'Reduce el riesgo de DNF del capitán o promesa cuando corren juntos.',
    perfBonus:-3, dnfShield:true},
  normal:     {label:'Corredor',  emoji:'🏃',color:'#aaa',
    desc:'Sin bonus especial.',
    perfBonus:0},
};

// ── Filosofía del club (C9) ────────────────────────────────────────────────
const CLUB_FILOSOFIAS={
  montanero:  {label:'Montañero',  emoji:'🏔️',color:'#2d7a2d',
    desc:'Especialistas en desnivel. Corredores de subida crecen más rápido.',
    specBonus:'montanero', raceBonus:['regional','nacional'], sponsorBonus:'material',
    statGrowthKey:'subida', cohesionBonus:2},
  tecnico:    {label:'Técnico',   emoji:'⚡',color:'#4a90d9',
    desc:'Precisión en descensos técnicos. Más eventos de visibilidad mediática.',
    specBonus:'tecnico', raceBonus:['local','regional'], sponsorBonus:'tecnologia',
    statGrowthKey:'bajada', cohesionBonus:0},
  estrategico:{label:'Estratégico',emoji:'🧠',color:'#8e44ad',
    desc:'Menos lesiones. Mejor gestión de carga y calendario.',
    specBonus:null, raceBonus:[], sponsorBonus:'nutricion',
    injuryReduction:0.3, cohesionBonus:3},
  comercial:  {label:'Comercial', emoji:'💰',color:'#c07a10',
    desc:'Más patrocinadores disponibles. Ingresos de socios +20%.',
    specBonus:null, raceBonus:[], sponsorBonus:'local',
    socioBonus:1.2, cohesionBonus:0},
};

// ── Staff técnico (C11) ────────────────────────────────────────────────────
const CLUB_STAFF_TYPES={
  fisio:      {label:'Fisioterapeuta',emoji:'🧑‍⚕️',costMonth:200,
    desc:'Reduce lesiones en un 40% y acelera recuperación.',
    injuryReduction:0.4},
  entrenador: {label:'Entrenador',   emoji:'🧑‍🏫',costMonth:300,
    desc:'Todos los corredores progresan un 30% más rápido.',
    growthBonus:1.3},
  marketing:  {label:'Marketing',    emoji:'📣',costMonth:150,
    desc:'+3 socios automáticos al mes. Mejora visibilidad en eventos.',
    sociosPerMonth:3},
  psicologo:  {label:'Psicólogo',    emoji:'🧠',costMonth:180,
    desc:'Cohesión grupal +8 por temporada. Reduce conflictos internos.',
    cohesionBonus:8},
};

// ── Pool de patrocinadores de club (C13) ───────────────────────────────────
const CLUB_SPONSORS_POOL=[
  {id:'cs1',name:'TrailShop Local',    cat:'material',  tier:1, monthlyIncome:150,
   objective:'Top 10 en 3 carreras',   objKey:'top10x3', duration:1},
  {id:'cs2',name:'Turismo Activo',     cat:'turismo',   tier:1, monthlyIncome:120,
   objective:'Participar en 5 carreras',objKey:'part5',   duration:1},
  {id:'cs3',name:'NutriTrail',         cat:'nutricion', tier:1, monthlyIncome:100,
   objective:'Sin abandonos colectivos',objKey:'no_dnf',  duration:1},
  {id:'cs4',name:'Suunto Club',        cat:'tecnologia',tier:2, monthlyIncome:280,
   objective:'Un podio de equipo',     objKey:'podio1',  duration:2},
  {id:'cs5',name:'Salomon Team',       cat:'material',  tier:2, monthlyIncome:350,
   objective:'Top 5 en carrera nacional',objKey:'top5nat',duration:2},
  {id:'cs6',name:'Diputación Foral',   cat:'local',     tier:2, monthlyIncome:400,
   objective:'50+ socios activos',     objKey:'socios50',duration:2},
];

// ── Cantera juvenil — pool de jóvenes fichables (C12) ────────────────────
const CLUB_YOUTH_POOL=[
  {id:'y1',name:'Mikel Iturbe',   flag:'🇪🇸',spec:'montanero',  age:18,stats:{resistencia:38,velocidad:40,subida:52,bajada:42},salary:60, potential:'alto', bio:'Ganador del campeonato juvenil de Navarra.'},
  {id:'y2',name:'June Garmendia', flag:'🇪🇸',spec:'fondista',   age:19,stats:{resistencia:45,velocidad:38,subida:40,bajada:38},salary:70, potential:'alto', bio:'Viene del cross. Fondo excepcional para su edad.'},
  {id:'y3',name:'Ander Zubiaurre',flag:'🇪🇸',spec:'tecnico',    age:17,stats:{resistencia:35,velocidad:44,subida:38,bajada:55},salary:50, potential:'alto', bio:'Natural en la bajada. Nadie le enseñó — es instinto.'},
  {id:'y4',name:'Irati Aizpurua', flag:'🇪🇸',spec:'todoterreno',age:20,stats:{resistencia:42,velocidad:42,subida:44,bajada:44},salary:80, potential:'alto', bio:'Polivalente. Acabó tercera en su primera carrera senior.'},
  {id:'y5',name:'Oier Etxabe',    flag:'🇪🇸',spec:'montanero',  age:18,stats:{resistencia:36,velocidad:38,subida:58,bajada:40},salary:55, potential:'alto', bio:'Escalador nato. Sube como un motor.'},
];

// ── Objetivos de temporada del club (C18) ─────────────────────────────────
const CLUB_OBJECTIVES=[
  {id:'subir_nivel',  label:'Subir de nivel de club',
   desc:'Conseguir suficientes socios para el siguiente nivel.',
   check:(d,lvl)=>d.socios>lvl.sociosMax,
   reward:{rep:15,socios:10}, penalty:{rep:-5}},
  {id:'ganar_circuito',label:'Ganar una carrera del circuito',
   desc:'Al menos un corredor del club en el primer puesto.',
   check:(d)=>(d.seasonResults||[]).some(r=>r.pos===1),
   reward:{rep:12,socios:6}, penalty:{rep:-3}},
  {id:'tres_podios',  label:'3 podios en la temporada',
   desc:'El club acumula tres podios entre todos sus corredores.',
   check:(d)=>(d.seasonResults||[]).filter(r=>r.pos<=3).length>=3,
   reward:{rep:10,socios:5}, penalty:{rep:-4}},
  {id:'socios_30',    label:'Llegar a 30 socios activos',
   desc:'Crecer la base social del club.',
   check:(d)=>d.socios>=30,
   reward:{rep:8,socios:8}, penalty:{rep:-2}},
  {id:'socios_80',    label:'Llegar a 80 socios activos',
   desc:'Consolidarse como club regional.',
   check:(d)=>d.socios>=80,
   reward:{rep:15,socios:12}, penalty:{rep:-5}},
  {id:'no_abandono',  label:'Temporada sin abandonos colectivos',
   desc:'Ningún corredor del club abandona este año.',
   check:(d)=>!(d.seasonResults||[]).some(r=>r.dnf),
   reward:{rep:8,cohesion:10}, penalty:{rep:-3,cohesion:-5}},
  {id:'presupuesto',  label:'Cerrar la temporada en positivo',
   desc:'El presupuesto del club no baja de cero.',
   check:(d)=>d.presupuesto>0,
   reward:{rep:5,socios:3}, penalty:{rep:-8}},
];

const CLUB_LEVELS=[
  {id:'local',    label:'Club Local',    icon:'🏘️', sociosMin:0,   sociosMax:30,  presupuestoBase:800,  color:'#888',    repReq:0},
  {id:'regional', label:'Club Regional', icon:'🏔️', sociosMin:31,  sociosMax:100, presupuestoBase:2000, color:'#4a90d9', repReq:40},
  {id:'nacional', label:'Club Nacional', icon:'🏅', sociosMin:101, sociosMax:300, presupuestoBase:5000, color:'#2d7a2d', repReq:70},
  {id:'elite',    label:'Club Élite',    icon:'🌟', sociosMin:301, sociosMax:999, presupuestoBase:12000,color:'#c07a10', repReq:90},
];

const CLUB_RACES=[
  // Locales — siempre disponibles
  {id:'clr1', name:'Trail Local de Primavera',  dist:21, month:4, cost:0,  tier:'local',    prize:300,  repReq:0,  sociosReq:0,  desc:'Carrera de club. Ambiente familiar.'},
  {id:'clr8', name:'Kilómetro Vertical Otoño',  dist:8,  month:11,cost:50, tier:'local',    prize:200,  repReq:0,  sociosReq:0,  desc:'Cierre de temporada. Corto pero letal.'},
  // Regionales — se desbloquean con rep ≥15
  {id:'clr2', name:'Circuito Vasco Trail',      dist:28, month:5, cost:80, tier:'regional', prize:600,  repReq:15, sociosReq:0,  desc:'Circuito con varios clubes del norte.'},
  {id:'clr3', name:'Vertical del Gorbea',       dist:12, month:6, cost:60, tier:'regional', prize:400,  repReq:15, sociosReq:0,  desc:'Vertical de referencia. Sube sin parar.'},
  {id:'clr5', name:'Vuelta al Txindoki',        dist:35, month:8, cost:90, tier:'regional', prize:700,  repReq:25, sociosReq:15, desc:'Clásica del Goierri. Mucho desnivel.'},
  {id:'clr6', name:'Copa de Clubes País Vasco', dist:42, month:9, cost:0,  tier:'regional', prize:800,  repReq:30, sociosReq:20, desc:'Puntos para el ranking de clubes regional.'},
  // Nacionales — se desbloquean con rep ≥45
  {id:'clr4', name:'Ultra Aralar',              dist:50, month:7, cost:120,tier:'nacional',  prize:1200, repReq:45, sociosReq:30, desc:'Ultra exigente. Solo los mejores del club.'},
  {id:'clr7', name:'Marathon de Montaña',       dist:44, month:10,cost:100,tier:'nacional',  prize:1500, repReq:45, sociosReq:30, desc:'Nacional. Clasifica para el ranking anual.'},
  // Élite — se desbloquean con rep ≥70
  {id:'clr9', name:'Campeonato Nacional de Trail',dist:60,month:6, cost:200,tier:'elite',    prize:3000, repReq:70, sociosReq:60, desc:'Lo más alto del trail nacional. Invitación por méritos.'},
  {id:'clr10',name:'Zegama-Aizkorri Open',      dist:42, month:5, cost:150,tier:'elite',    prize:2500, repReq:80, sociosReq:80, desc:'La carrera más mítica del País Vasco. Pocas plazas de club.'},
];

const CLUB_EVENTS=[
  {id:'cle1', title:'Un socio organiza un taller de nutrición para el club',
   options:[{text:'Apoyarlo públicamente — cohesión del club (+rep, +socios)',repDelta:8,sociosDelta:3},{text:'Dejarlo hacer sin implicarte',repDelta:0,sociosDelta:1}]},
  {id:'cle2', title:'El ayuntamiento os ofrece un espacio para entrenar gratuitamente',
   options:[{text:'Aceptar — base de entrenamiento del club (−€200 acondicionamiento, +rep)',repDelta:12,cost:200,sociosDelta:5},{text:'Rechazar — no tenéis recursos ahora',repDelta:-3}]},
  {id:'cle3', title:'Un corredor local con potencial os contacta para unirse al club',
   options:[{text:'Ficharlo — suma a la plantilla (−€100/mes salario)',repDelta:5,addRunner:true},{text:'No tenemos hueco ahora',repDelta:0}]},
  {id:'cle4', title:'Hay tensión entre dos corredores de la plantilla',
   options:[{text:'Mediar y resolver (+cohesión, +rep)',repDelta:10},{text:'Ignorarlo — que lo resuelvan solos',repDelta:-5,sociosDelta:-1}]},
  {id:'cle5', title:'Os invitan a participar en una carrera benéfica',
   options:[{text:'Mandar a dos corredores (+visibilidad, +socios)',repDelta:6,sociosDelta:4,cost:80},{text:'No podemos permitírnoslo este mes',repDelta:-2}]},
  {id:'cle6', title:'Un patrocinador local ofrece materiales a cambio de llevar su logo',
   options:[{text:'Aceptar — €300 en material gratis',repDelta:3,income:300},{text:'Prefiero mantener la imagen limpia',repDelta:2}]},
  {id:'cle7', title:'Una revista de trail quiere hacer un reportaje sobre el club',
   options:[{text:'Sí — visibilidad nacional (+rep, +socios)',repDelta:15,sociosDelta:8},{text:'Aún no estamos listos',repDelta:0}]},
  {id:'cle8', title:'Uno de tus corredores quiere irse a un club rival',
   options:[{text:'Ofrecerle una mejora salarial (+€50/mes) para retenerle',repDelta:5,salaryIncrease:true},{text:'Dejarle ir — el club no puede forzar a nadie',repDelta:-4,loseRunner:true}]},

  // ── C3: Eventos condicionales según estado del club ──────────────────────

  // Cohesión baja (< 35)
  {id:'cle_tension1', title:'Dos corredores de la plantilla han dejado de hablarse',
   minCohesion:0, maxCohesion:34,
   options:[
     {text:'Reunión de equipo urgente — encaras el conflicto (+cohesión, −€150)',repDelta:4,cohesionDelta:12,cost:150},
     {text:'Dejarles resolver el conflicto solos — puede empeorar',repDelta:0,cohesionDelta:-5},
   ]},
  {id:'cle_tension2', title:'El ambiente en los entrenos es muy malo. Nadie habla.',
   minCohesion:0, maxCohesion:34,
   options:[
     {text:'Organizar una salida de equipo (−€200, +cohesión, +rep)',repDelta:6,cohesionDelta:15,cost:200},
     {text:'Ignorarlo — el rendimiento es lo primero',repDelta:-2,cohesionDelta:-3},
   ]},
  {id:'cle_tension3', title:'Un corredor amenaza con no presentarse a la siguiente carrera por el mal ambiente',
   minCohesion:0, maxCohesion:30,
   options:[
     {text:'Hablar con él personalmente (+confianza, +cohesión)',repDelta:5,cohesionDelta:10},
     {text:'Decirle que es su responsabilidad presentarse',repDelta:-3,cohesionDelta:-4,loseRunner:true},
   ]},

  // Cohesión alta (> 70)
  {id:'cle_buena1', title:'El buen ambiente del club ha llegado a oídos de un talento local',
   minCohesion:70,
   options:[
     {text:'Invitarle a entrenar con vosotros — posible fichaje',repDelta:8,addRunner:true},
     {text:'No tenemos hueco ahora mismo',repDelta:0},
   ]},
  {id:'cle_buena2', title:'Un medio deportivo quiere hacer un reportaje sobre vuestra cohesión de equipo',
   minCohesion:70,
   options:[
     {text:'Aceptar — visibilidad enorme (+rep, +socios)',repDelta:18,sociosDelta:10},
     {text:'Preferimos pasar desapercibidos',repDelta:0},
   ]},

  // Reputación alta (> 50) — oportunidades de nivel superior
  {id:'cle_rep1', title:'Una federación regional os invita a un circuito de élite el próximo año',
   minRep:50,
   options:[
     {text:'Aceptar — compromiso de participar (−€300 inscripción, +rep)',repDelta:14,cost:300},
     {text:'No estamos preparados aún',repDelta:-2},
   ]},
  {id:'cle_rep2', title:'Una empresa tecnológica quiere patrocinaros por vuestra imagen de club serio',
   minRep:55,
   options:[
     {text:'Firmar el acuerdo (€600/año, compromiso de imagen)',repDelta:8,income:600},
     {text:'Preferimos mantener nuestra independencia',repDelta:2},
   ]},

  // Presupuesto bajo (< 500)
  {id:'cle_crisis1', title:'El club no llega a fin de mes. Hay que tomar decisiones difíciles.',
   maxPresupuesto:500,
   options:[
     {text:'Organizar una carrera popular para recaudar fondos (+€800, tiempo de prep)',repDelta:5,income:800,sociosDelta:3},
     {text:'Pedir ayuda al ayuntamiento (trámite lento, +€400)',repDelta:2,income:400},
     {text:'Reducir el salario del staff temporalmente',repDelta:-5,cohesionDelta:-4},
   ]},
  {id:'cle_crisis2', title:'Un patrocinador amenaza con retirarse si los resultados no mejoran',
   maxPresupuesto:600,
   options:[
     {text:'Negociar un plazo — comprometerse a resultados',repDelta:0,cohesionDelta:-2},
     {text:'Dejarle ir y buscar otro — más libertad, menos ingresos',repDelta:-3,income:-300},
   ]},
];
const EXCLUSIVE_CLUB_RACE={
  id:'copa_clubes',name:'Copa de Clubes Trail',dist:42,month:9,cost:0,
  minYear:1,spec:'all',circuit:null,
  desc:'Carrera exclusiva para miembros con alta reputación en su club. Rivales top, sin inscripción.',
  prize:300,isExclusive:true
};
const TRAINING_EVENTS_POOL=[
  {id:'revelation', prob:0.12, type:'good',
   title:'Algo hace clic',
   desc:'Llevas semanas martillando el mismo estímulo y de repente el cuerpo responde de otra manera.',
   effMult:1.4, icon:'⚡'},
  {id:'plateau',    prob:0.14, type:'bad',
   title:'Estancamiento',
   desc:'Mismo estímulo, mismo plateau. El cuerpo ya no responde igual a este bloque.',
   effMult:0.6, icon:'📉'},
  {id:'group_run',  prob:0.15, type:'good',
   title:'Entreno en grupo improvisado',
   desc:'Te cruzas con tres corredores locales y entrenáis juntos. La competitividad saca algo extra.',
   effMult:1.3, icon:'👥'},
  {id:'veteran',    prob:0.10, type:'good',
   title:'Consejo de un veterano',
   desc:'En la tirada larga te cruzas con un corredor experimentado. Entrena una hora contigo y te da un truco clave.',
   statBonus:{bajada:2}, icon:'🧓', effMult:1.0},
  {id:'heat_week',  prob:0.10, type:'bad',
   title:'Semana de calor extremo',
   desc:'Las temperaturas se disparan. Entrenas igual pero el rendimiento cae.',
   effMult:0.7, icon:'🌡'},
  {id:'minor_tweak',prob:0.10, type:'bad',
   title:'Molestia en el entreno',
   desc:'Te haces daño leve en una serie. Decides parar dos días. Carga baja pero el bloque rinde menos.',
   effMult:0.8, loadMod:-6, icon:'🩹'},
  {id:'flow_state', prob:0.09, type:'good',
   title:'Semana de flujo',
   desc:'Todo sale bien esta semana. Las piernas responden, la cabeza está limpia. El bloque rinde al máximo.',
   effMult:1.25, icon:'🌊'},
  {id:'illness',    prob:0.08, type:'bad',
   title:'Virus pasajero',
   desc:'Un resfriado a mitad del bloque te corta el ritmo. Dos días en cama, el resto recuperándote.',
   effMult:0.5, icon:'🤧'},
  {id:'gear_test',  prob:0.07, type:'good',
   title:'Test de material nuevo',
   desc:'Una marca te manda unas zapatillas de prueba. No te comprometes a nada pero el material ayuda hoy.',
   statBonus:{velocidad:1,bajada:1}, effMult:1.0, icon:'👟'},
  {id:'bad_weather_week',prob:0.05,type:'bad',
   title:'Semana de lluvia continua',
   desc:'Llueve sin parar. Entrenar en barro constante no es lo mismo que en condiciones normales.',
   effMult:0.75, icon:'🌧'},
];

// ══════════════════════════════════════
//  EVENTOS ECONÓMICOS MENSUALES
// ══════════════════════════════════════
const MONTHLY_EVENTS_POOL=[
  {id:'surplus',  title:'Te han sobrado €50 este mes',  options:[
    {text:'Ahorrar',                effect:'save',     value:50},
    {text:'Calcetines técnicos',    effect:'gear',     value:-30, statBonus:{bajada:1}},
    {text:'Sesión de masajista',    effect:'massage',  value:-40, loadRedux:8},
    {text:'Caja de geles extra',    effect:'gels',     value:-25, statBonus:{nutricion:1}},
  ]},
  {id:'bonus',    title:'Premio inesperado de una carrera antigua (+€80)', options:[
    {text:'Ahorrar',                effect:'save',     value:80},
    {text:'Inscripción extra',      effect:'race',     value:-60, unlockRace:true},
    {text:'Semana de entrenamiento en altitud', effect:'altitude', value:-80, statBonus:{subida:2,resistencia:1}},
  ]},
  {id:'expense',  title:'Rotura de material — tienes que reponer', options:[
    {text:'Material básico (€30)',   effect:'basic',   value:-30},
    {text:'Material técnico (€80)', effect:'tech',    value:-80, statBonus:{velocidad:1}},
  ]},

  // ── 10 NUEVOS EVENTOS ──────────────────────────────────────
  {id:'rival_run', title:'Te cruzas con un rival conocido entrenando en el monte', options:[
    {text:'Salir a correr juntos — te exige más (+subida, +carga)', value:0, statBonus:{subida:2}, loadAdd:6},
    {text:'Charlar un rato y seguir tu plan (+mental)',              value:0, statBonus:{mental:2}},
    {text:'Ignorarle. Foco en lo tuyo',                             value:0},
  ]},
  {id:'bad_weather', title:'Semana de temporal — imposible salir al monte', options:[
    {text:'Gym de montaña (€30 · mantienes base)',    value:-30, statBonus:{resistencia:1}},
    {text:'Descanso forzado — te recuperas bien',     value:0,   loadRedux:14},
    {text:'Salir bajo la lluvia (resistencia, pero pierdes motivación)', value:0, statBonus:{resistencia:2,mental:-2}},
  ]},
  {id:'local_media', title:'Un medio local quiere entrevistarte sobre el trail', options:[
    {text:'Dar la entrevista (+mental, +visibilidad)', value:0, statBonus:{mental:3}},
    {text:'Declinar — te quedas entrenando',           value:0, statBonus:{velocidad:1}},
  ]},
  {id:'friend_race', title:'Un amigo te arrastra a una popular del pueblo el domingo', options:[
    {text:'¡Vamos! Competir sin presión (+velocidad, +carga)',  value:-15, statBonus:{velocidad:2}, loadAdd:8},
    {text:'Solo como espectador y a animar',                    value:0,   statBonus:{mental:2}},
    {text:'Paso — respeto el plan',                             value:0},
  ]},
  {id:'volunteer',  title:'El club necesita voluntarios para una carrera local', options:[
    {text:'Echar una mano — gran ambiente (+mental)',  value:0, statBonus:{mental:4}},
    {text:'No puedo este fin de semana',               value:0},
  ]},
  {id:'medical_check', title:'La federación te pide una revisión médica', options:[
    {text:'Básica — gratis, todo en orden',                                  value:0},
    {text:'Completa (€60 · detectan sobrecarga, carga -15)',                 value:-60, loadRedux:15},
  ]},
  {id:'training_camp', title:'Campo de entrenamiento en los Pirineos — plazas limitadas', options:[
    {text:'Apuntarse (€110 · semana en altitud)',   value:-110, statBonus:{subida:4,resistencia:2}},
    {text:'Demasiado caro este mes',                value:0},
  ]},
  {id:'gear_deal', title:'Flash sale de material técnico — 48 horas', options:[
    {text:'Zapatillas de montaña (€40)',              value:-40,  statBonus:{bajada:1}},
    {text:'Mochila hidratación técnica (€55)',        value:-55,  statBonus:{resistencia:1,nutricion:1}},
    {text:'Paso — no lo necesito ahora',             value:0},
  ]},
  {id:'strained_ankle', title:'Tobillo cargado al bajar por el canal', options:[
    {text:'Reposo inmediato — vale la pena (carga -10)',           value:0, loadRedux:10},
    {text:'Seguir entrenando con precaución (+carga, +riesgo)',    value:0, loadAdd:8},
  ]},
  {id:'podium_party', title:'Celebración en el club — un compañero subió al podio', options:[
    {text:'¡A celebrar! (+mental, algo más de carga)',  value:0, statBonus:{mental:3}, loadAdd:5},
    {text:'Me quedo en casa descansando (carga -5)',    value:0, loadRedux:5},
  ]},
  // ── Eventos extra positivos ──
  {id:'old_friend', title:'Te encuentras con un antiguo compañero de club', options:[
    {text:'Salir a correr juntos como antes (+mental, +velocidad)', value:0, statBonus:{mental:3,velocidad:1}, loadAdd:6},
    {text:'Tomar algo y ponerse al día (+mental sin carga extra)',   value:0, statBonus:{mental:4}},
  ]},
  {id:'local_win', title:'Ganas la popular del pueblo sin ni haberla planificado', options:[
    {text:'Aceptar el trofeo y la camiseta (+mental, +fama)',  value:10, statBonus:{mental:3}},
    {text:'Cederlo al segundo — gesto bonito (+mental extra)', value:0,  statBonus:{mental:5}},
  ]},
  {id:'trail_doc', title:'Un canal de trail quiere grabarte en tu entrenamiento', options:[
    {text:'Aceptar — buena visibilidad (+fama)',   value:0, statBonus:{mental:2}},
    {text:'Pasar — no quieres distracciones',      value:0},
  ]},
  {id:'good_sleep', title:'Una semana de descanso activo — el cuerpo responde bien', options:[
    {text:'Aprovechar la recuperación (carga -12)',       value:0, loadRedux:12},
    {text:'Meter una sesión extra (+velocidad, +carga)',  value:0, statBonus:{velocidad:2}, loadAdd:8},
  ]},
  {id:'club_sponsor', title:'El club consigue un pequeño patrocinador y hay dinero extra', options:[
    {text:'Recibir tu parte: +€40',             value:40},
    {text:'Donarlo al fondo de material (+mental)', value:0, statBonus:{mental:3}},
  ]},
  {id:'mountain_hike', title:'Fin de semana de senderismo con la familia — sin competir', options:[
    {text:'Desconectar del todo (+mental, carga -8)',            value:0, statBonus:{mental:5}, loadRedux:8},
    {text:'Aprovechar para reconocer un tramo de próxima carrera', value:0, statBonus:{bajada:1,subida:1}},
  ]},
  {id:'physio_advice', title:'Tu fisio te da un consejo específico esta semana', options:[
    {text:'Aplicarlo al entrenamiento (carga -10, +resistencia)', value:0, statBonus:{resistencia:1}, loadRedux:10},
    {text:'Pedirle que te haga una sesión completa (€35, carga -18)', value:-35, loadRedux:18},
  ]},
  {id:'challenge_accepted', title:'Un seguidor te desafía a batir un récord de segmento', options:[
    {text:'Aceptar el reto (+velocidad, +carga, +seguidores)',   value:0, statBonus:{velocidad:2}, loadAdd:10},
    {text:'Ignorarlo — no merece la pena cargar extra',          value:0},
  ]},
  // ── Eventos de club con reputación ──
  {id:'club_president',  title:'El presidente del club quiere que corras el campeonato regional', requiresClub:true, options:[
    {text:'Aceptar — el club lo necesita (+reputación, carrera extra)',  value:0, statBonus:{mental:2}, clubRepDelta:12, addChampionship:true},
    {text:'Declinar — no encaja en mi plan (-reputación)',               value:0, clubRepDelta:-8},
  ]},
  {id:'companion_advice', title:'Tu compañero de club te pide consejo antes de su primera ultra', requiresClub:true, options:[
    {text:'Dedicarle una tarde entera — le sale bien (+mental, +reputación)', value:0, statBonus:{mental:4}, clubRepDelta:10},
    {text:'Un consejo rápido por WhatsApp — algo es algo (+rep leve)',        value:0, statBonus:{mental:2}, clubRepDelta:4},
    {text:'No tengo tiempo ahora mismo',                                      value:0, clubRepDelta:-3},
  ]},
  {id:'club_gear_discount', title:'El club negocia un descuento en material para sus miembros', requiresClub:true, options:[
    {text:'Aprovechar el descuento — zapatillas nuevas (€25, +bajada, +rep)', value:-25, statBonus:{bajada:2}, clubRepDelta:5},
    {text:'Pasar — el material que tengo va bien',                            value:0},
  ]},
  {id:'club_conflict', title:'Tensión en el club — dos miembros discuten y te piden que medie', requiresClub:true, options:[
    {text:'Mediar con calma — se resuelve bien (+rep, +mental)',   value:0, statBonus:{mental:3}, clubRepDelta:12},
    {text:'Mantenerse al margen — no es tu pelea',                value:0, clubRepDelta:-2},
    {text:'Tomar partido — resuelves rápido pero hay bando perdedor', value:0, clubRepDelta:-6},
  ]},
  {id:'companion_race', title:'Tu compañero de club corre su primera carrera contigo este fin de semana', requiresClub:true, options:[
    {text:'Correr a su ritmo los primeros km (+mental, +rep)',     value:0, statBonus:{mental:5}, clubRepDelta:8, loadAdd:4},
    {text:'Salir a tu ritmo — cada uno a lo suyo',                value:0},
  ]},
  {id:'club_training_camp', title:'El club organiza un campo de entrenamiento en la sierra — plazas para todos', requiresClub:true, options:[
    {text:'Apuntarse — una semana con el grupo (+subida, +mental, +rep, +carga)', value:-30, statBonus:{subida:3,mental:4}, clubRepDelta:10, loadAdd:12},
    {text:'Unirse solo el fin de semana (+rep leve, menos carga)',                value:-10, statBonus:{mental:2}, clubRepDelta:5, loadAdd:5},
    {text:'Esta vez no puedo',                                                    value:0, clubRepDelta:-2},
  ]},
  // ── Eventos de trabajo (2b) ──────────
  {id:'work_audit', title:'Semana de auditoría en el trabajo — ritmo frenético', requiresWork:true, options:[
    {text:'Afrontarlo — agotado, entrenamientos menos efectivos (carga +15)',  value:0, loadAdd:15},
    {text:'Pedir días de asuntos propios — pierdes €20 pero mantienes el ritmo', value:-20},
  ]},
  {id:'work_overtime', title:'Tu jefe te ofrece horas extra este mes', requiresWork:true, options:[
    {text:'Aceptar (+€40, pero el cuerpo llega cargado al entreno, carga +18)', value:40, loadAdd:18},
    {text:'Rechazar — respeta tu plan de entrenamiento', value:0},
  ]},
  {id:'work_congrats', title:'Tu empresa celebra un trimestre récord — bonus sorpresa', requiresWork:true, options:[
    {text:'Disfrutar el reconocimiento (+€30)', value:30},
    {text:'Invertirlo en material técnico (+€10 · +bajada)', value:10, statBonus:{bajada:1}},
  ]},
];

const PRE_RACE_NUTRITION=[
  {id:'pasta',    label:'Pasta / arroz',          energyBonus:8,  reqYear:1, cost:5,
   desc:'Clásico de corredor. Buena base de carbohidratos. €5 en el restaurante del hotel.'},
  {id:'ayuno',    label:'Ayuno pre-carrera',       energyBonus:-5, reqYear:1, cost:0,
   desc:'Sin desayuno. Energía inicial baja (−5) pero el cuerpo activa la quema de grasas — el gasto de energía en carrera se reduce un 10%. Atención: correr en ayunas aumenta la sed un 8%.'},
  {id:'nada',     label:'Sin planificar',          energyBonus:0,  reqYear:1, cost:0,
   desc:'Sin preparación específica. Sin bonus ni penalización.'},
  {id:'pro',      label:'Protocolo pro',           energyBonus:15, reqYear:3, cost:0,
   desc:'Cena + desayuno específico. Máxima energía inicial. El exceso sobre 100% sube hasta 110%.',
   reqNutSponsor:false,
   yearCosts:{3:15, 4:20, 5:25, 6:30},
   yearReqs:{4:'nutSponsor', 5:'nutSponsorTop10', 6:'nutSponsorRanking50'}},
];

const DROPBAG_OPTIONS=[
  {id:'geles',   label:'Geles extra (x3)',    desc:'+25 energía en el avituallamiento designado', effect:'energy', value:25, cost:15},
  {id:'agua',    label:'Bidón extra',         desc:'+30 hidratación en el avituallamiento',        effect:'hydration', value:30, cost:0},
  {id:'ropa',    label:'Chaqueta/ropa abrigo',desc:'Protección si empeora el tiempo',               effect:'weather', value:0, cost:0},
  {id:'zapatillas',label:'Zapatillas de cambio',desc:'Piernas -10% desgaste en segunda mitad',     effect:'legs', value:10, cost:0},
  {id:'comida',  label:'Comida real sólida',  desc:'+40 energía pero +60 seg en el avituallamiento',effect:'energy_slow', value:40, cost:0},
];
const INJURY_TYPES={
  tendinitis:{
    label:'Tendinitis',
    desc:'Inflamación en el tendón. Puedes correr pero con penalización seria.',
    statPenalty:{bajada:-5,velocidad:-2},
    recoverySeasons:1,canRace:true,
    racesBlocked:0,
    nextRaceStats:{energy:75,legs:65,hydration:80},
    fisioDiscount:0.5,
  },
  rotura:{
    label:'Rotura de fibras',
    desc:'Rotura muscular grave. No puedes correr las próximas 2 carreras.',
    statPenalty:{velocidad:-6,resistencia:-4,mental:-2},
    recoverySeasons:1,canRace:false,
    racesBlocked:2,
    nextRaceStats:{energy:55,legs:45,hydration:70},
    fisioDiscount:0.4,
  },
  fractura:{
    label:'Fractura de estrés',
    desc:'Lesión muy grave. La temporada puede estar comprometida.',
    statPenalty:{resistencia:-9,subida:-5,mental:-4,velocidad:-3},
    recoverySeasons:2,canRace:false,
    racesBlocked:999,
    nextRaceStats:{energy:40,legs:30,hydration:60},
    fisioDiscount:0.3,
  },
};

// ══════════════════════════════════════
const SCREENS_WITH_TABS=['seasonStart','calendar','sponsors','training','betweenRace','seasonBalance','betweenManage','preRace','preRacePrep','segment','aid','raceResult','expresSeasonStart','expresCalendar','expresSponsors','expresPrep','expresPreRacePrep','expresSeasonBalance','coachHome','coachTraining','coachCalendar','coachTrainingReaction','coachEvent','coachPreRace','coachSponsors','clubSetup','canicrossHub','canicrossSeasonBalance'];
const RACE_SCREENS=['preRace','segment','aid','raceResult','midRaceEvent'];

// ── CANICROSS ──────────────────────────────────────────
const CANICROSS_RACES=[
  {id:'cn_guadarrama', name:'Canicross Guadarrama',           location:'Madrid',    km:8,  month:1,  monthName:'Enero',     tier:1, prize:150, cost:25},
  {id:'cn_volcanic',   name:'Canicross Volcànic',             location:'Cataluña',  km:7,  month:1,  monthName:'Enero',     tier:1, prize:120, cost:20},
  {id:'cn_moncayo',    name:'Canicross Moncayo',              location:'Zaragoza',  km:9,  month:2,  monthName:'Febrero',   tier:2, prize:200, cost:30},
  {id:'cn_tramuntana', name:'Canicross Serra de Tramuntana',  location:'Mallorca',  km:10, month:12, monthName:'Diciembre', tier:2, prize:220, cost:35},
  {id:'cn_benasque',   name:'Canicross Valle de Benasque',    location:'Huesca',    km:12, month:3,  monthName:'Marzo',     tier:3, prize:300, cost:40},
  {id:'cn_copa',       name:'Copa de España Canicross',       location:'Itinerante',km:10, month:2,  monthName:'Nov–Mar',   tier:3, prize:400, cost:50},
  {id:'cn_campeonato', name:'Campeonato de España Canicross', location:'Itinerante',km:12, month:2,  monthName:'Febrero',   tier:4, prize:600, cost:60},
];

const CANICROSS_EQUIPMENT={
  dogHarness:[
    {id:'basic_harness', name:'Arnés Corto Básico',    price:35,  desc:'Equilibrado. Viene de inicio.',                     speedMod:0,  staminaMod:0,  default:true},
    {id:'freemotion_pro',name:'Freemotion Pro',         price:95,  desc:'+agilidad técnico, -potencia tracción',             speedMod:2,  staminaMod:-1},
    {id:'xback',         name:'X-Back Competición',    price:120, desc:'+velocidad llano, ideal larga distancia',           speedMod:5,  staminaMod:2},
  ],
  humanBelt:[
    {id:'basic_belt',    name:'Cinturón Simple',        price:25,  desc:'Viene de inicio.',                                  injuryRiskMod:0,   default:true},
    {id:'hip_harness',   name:'Arnés Cadera Completo',  price:140, desc:'-riesgo lesión lumbar, mejor control',              injuryRiskMod:-10},
  ],
  line:[
    {id:'soft_line',     name:'Línea Amortiguador Blando',price:30,desc:'Viene de inicio.',                                  jerkMod:0,  default:true},
    {id:'hard_line',     name:'Línea Amortiguador Duro',  price:55,desc:'Perros con mucha tracción, -tirones bruscos',       jerkMod:-5},
  ],
};

const CANICROSS_TRAINING_BLOCKS=[
  {id:'conjunto',     label:'Entrenamiento conjunto',  hours:5, runnerMod:{resistencia:2,velocidad:1},       dogMod:{speed:2,stamina:2},    bondMod:5,  desc:'Entrenas juntos. Sube vínculo.'},
  {id:'adiestramiento',label:'Adiestramiento',         hours:3, runnerMod:{},                                dogMod:{},                     bondMod:3,  desc:'Enseña comandos al perro (2 sesiones/comando). +3 vínculo.', teachCommand:true},
  {id:'tecnica',      label:'Técnica conjunta',        hours:4, runnerMod:{bajada:2,velocidad:1},            dogMod:{speed:1,stamina:1},    bondMod:4,  desc:'Sincronía en tramos técnicos.'},
  {id:'solo',         label:'Entreno corredor solo',   hours:4, runnerMod:{resistencia:3,velocidad:2,subida:2}, dogMod:{},                  bondMod:-2, desc:'Entrenas sin el perro. -2 vínculo (Malinois: -5 extra).'},
  {id:'descanso',     label:'Descanso activo juntos',  hours:2, runnerMod:{mental:2},                        dogMod:{health:3},             bondMod:3,  desc:'Paseo tranquilo. Descarga física y vínculo.'},
];
