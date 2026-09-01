// ══════════════════════════════════════════════════════════════════
//  MODO DESARROLLADOR — solo activo con ?dev=1 en la URL
//  Archivo separado a propósito: nada aquí se carga ni se ejecuta si
//  G._devMode no está activo. No forma parte del juego real.
// ══════════════════════════════════════════════════════════════════

// ── Saltos directos de modo ──
window.devJumpToCoach=()=>{
  const pick=LIFE_ATHLETE_POOL[Math.floor(Math.random()*LIFE_ATHLETE_POOL.length)];
  G.lifeAthlete={...pick,currentStats:{...pick.baseStats}};
  G.coachAthlete={...G.lifeAthlete};
  G.gameMode='coach';
  G.carreraVida=true;G.lifecyclePhase='coach';
  if(!Array.isArray(G.coachRoster))G.coachRoster=[];
  if(!Array.isArray(G.coachSelectedRaces))G.coachSelectedRaces=[];
  if(!Array.isArray(G.coachRaceResults))G.coachRaceResults=[];
  G.coachRaceIdx=0;G.coachSeason=G.coachSeason||1;G.coachTrust=G.coachTrust||60;
  G.screen='coachHome';G.activeTab='game';
  showToast('DEV: saltado a Entrenador','#534AB7');
  render();
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

// ── Logros ──
window.devUnlockAllAchievements=()=>{
  // Solo en memoria — NO toca localStorage['globalAchs'], así que no ensucia
  // el historial de logros real de otras partidas guardadas.
  if(!G.achievementMeta)G.achievementMeta={};
  G.unlockedAchievements=ACHIEVEMENTS.map(a=>a.id);
  ACHIEVEMENTS.forEach(a=>{if(!G.achievementMeta[a.id])G.achievementMeta[a.id]={difficulty:G.gameMode||'medio',year:G.year||1};});
  showToast('DEV: todos los logros desbloqueados (solo esta partida)','#c07a10');
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
  set('bodyLoad',val('dev-bodyload'));
  const clubRep=val('dev-clubrep');if(clubRep!=null&&G.clubModeData)G.clubModeData.reputacion=clubRep;
  const energy=val('dev-energy');if(energy!=null)G.runner.energy=energy;
  const hydration=val('dev-hydration');if(hydration!=null)G.runner.hydration=hydration;
  const legs=val('dev-legs');if(legs!=null)G.runner.legs=legs;
  ['resistencia','velocidad','subida','bajada','nutricion','mental'].forEach(s=>{
    const v=val('dev-stat-'+s);if(v!=null)G.runner.stats[s]=v;
  });
  const carreraVidaEl=document.getElementById('dev-carreravida');
  if(carreraVidaEl)G.carreraVida=carreraVidaEl.checked;
  const modeEl=document.getElementById('dev-gamemode');
  if(modeEl&&modeEl.value&&modeEl.value!==G.gameMode)G.gameMode=modeEl.value;
  showToast('DEV: valores aplicados','#1a1a1a');
  render();
};

// ── Consola de código libre — poder real, sin límites de lo que yo haya previsto ──
window.devRunCode=()=>{
  const ta=document.getElementById('dev-console');
  if(!ta)return;
  const code=ta.value;
  if(!code.trim())return;
  try{
    // eslint-disable-next-line no-new-func
    const fn=new Function('G','render','showToast','ACHIEVEMENTS','CLUBS','LIFE_ATHLETE_POOL',code);
    fn(G,render,showToast,ACHIEVEMENTS,CLUBS,LIFE_ATHLETE_POOL);
    showToast('DEV: código ejecutado','#1a1a1a');
    render();
  }catch(e){
    showToast('DEV error: '+e.message,'#c0392b');
    console.error('[devRunCode]',e);
  }
};

window.devClose=()=>{
  G.screen=G._devPrevScreen||'modeSelect';
  render();
};

function renderDevPanel(){
  const el=document.getElementById('main');
  const nav=document.getElementById('tab-nav');if(nav)nav.style.display='none';
  const fb=document.getElementById('fin-bar');if(fb)fb.style.display='none';
  const r=G.runner||{stats:{}};
  const inRace=!!(G.rivals&&G.rivals.length);
  el.innerHTML=`
    <h2>🛠 Modo Desarrollador</h2>
    <p class="sub" style="margin-bottom:16px">Solo visible con <code>?dev=1</code> en la URL. No pensado para partidas reales.</p>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Saltos directos</div>
      <button class="main" style="margin-top:6px" onclick="devJumpToClassic()">🏃 Ir a Clásico ahora</button>
      <button class="main" style="margin-top:6px" onclick="devJumpToCoach()">📋 Ir a Entrenador ahora</button>
      <button class="main" style="margin-top:6px" onclick="devJumpToClub()">🏕 Ir a Club ahora</button>
      <button class="main" style="margin-top:6px" onclick="devJumpToCanicross()">🐕 Ir a Canicross ahora</button>
      <button class="main" style="margin-top:6px" onclick="devForceAthleteOffer()">🏔 Forzar oferta "hazte entrenador"</button>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Carrera en curso (Clásico)${inRace?'':' — no hay ninguna ahora mismo'}</div>
      <button class="main" style="margin-top:6px;border-color:#4a8a2a;color:#2d5a1a" ${inRace?'':'disabled'} onclick="devWinRace()">🏆 Ganar esta carrera ya (1º puesto)</button>
      <button class="main" style="margin-top:6px;border-color:#c0392b;color:#c0392b" ${inRace?'':'disabled'} onclick="devLoseRace()">🥴 Perder esta carrera ya (último)</button>
      <button class="main" style="margin-top:6px;${G._devGodMode?'background:#c0392b;color:#fff;border-color:#c0392b':''}" onclick="devToggleGodMode()">${G._devGodMode?'😇 Modo dios ACTIVO — pulsa para desactivar':'👑 Activar modo dios (ganas toda carrera de Clásico)'}</button>
      <div style="font-size:11px;color:#888;margin-top:6px">Modo dios: mientras esté activo, cualquier carrera de Clásico que termines normalmente (jugando los tramos) se resuelve en victoria. Solo Clásico por ahora — Coach/Club/Canicross tienen motores de carrera distintos, no cubiertos todavía.</div>
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
        <label style="font-size:12px">Rep. Club${G.clubModeData?'':' (sin club aún)'}<input id="dev-clubrep" type="number" ${G.clubModeData?'':'disabled'} placeholder="${G.clubModeData?G.clubModeData.reputacion:'—'}" style="width:100%;padding:6px;border:1px solid #e0dfd8;border-radius:6px"></label>
      </div>
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
      <div style="font-size:12px;color:#888;margin-bottom:8px">Solo afecta a esta partida en memoria — no toca el historial global de logros.</div>
      <button class="main" style="margin-top:0" onclick="devUnlockAllAchievements()">Desbloquear todos los logros</button>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div class="sec-title-sm">Consola de código</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px">JS libre con <code>G</code> en el ámbito. Ej: <code>G.sponsors.zapatillas={...}</code>, <code>G.followers=50000</code>, o llamar a cualquier función del juego. Se ejecuta y se re-renderiza. Sin red de seguridad — puedes dejar el estado inconsistente si escribes algo raro.</div>
      <textarea id="dev-console" rows="4" style="width:100%;padding:8px;border:1px solid #e0dfd8;border-radius:6px;font-family:monospace;font-size:12px" placeholder="G.money = 99999;"></textarea>
      <button class="main" style="margin-top:8px" onclick="devRunCode()">▶ Ejecutar</button>
    </div>

    <button class="main" style="opacity:0.6" onclick="devClose()">← Cerrar panel</button>
  `;
}
