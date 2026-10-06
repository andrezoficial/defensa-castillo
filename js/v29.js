/* V29 — Guerra Total
 * Dificultad progresiva: presión de oleada, velocidad, enemigos de élite,
 * recompensas compensatorias y telemetría ligera. Sin pathfinding pesado.
 */
(function(){
  const V={};
  const state=()=>GameState.v29||(GameState.v29={bestWave:0,elite:false});
  V.wave=(w)=>({
    hp: 1 + w*.025,
    speed: 1 + Math.min(.28,w*.012),
    spawn: Math.max(210, 500 - Math.min(210,w*10))
  });
  V.prepare=(w)=>{const s=state();s.elite=w%5===0;s.bestWave=Math.max(s.bestWave,w);return s};
  V.enemy=(e,w)=>{
    const m=V.wave(w);
    e.speed*=m.speed;e.baseSpeed*=m.speed;
    // Los picos élite ganan dureza principalmente por velocidad y escudos,
    // evitando que todo sea simplemente una barra de vida enorme.
    if(w%5===0){
      e.speed*=1.06;e.baseSpeed*=1.06;
      if(e.key==='brute'||e.key==='ogre')e.maxHp=Math.round(e.maxHp*1.10);
      if(e.key==='raider'||e.key==='swarm')e.speed*=1.08;
      e.v29Elite=true;
    }
    e.hp=Math.round(e.hp*m.hp);e.maxHp=Math.round(e.maxHp*m.hp);
  };
  V.spawnDelay=(w,key)=>{
    const m=V.wave(w);const base=key==='swarm'?170:500;
    return Math.max(210,Math.round(Math.min(base,m.spawn)));
  };
  V.start=(w)=>{ V.prepare(w); if(w>=10)showRewardToast(`🔥 GUERRA TOTAL · Oleada ${w}`); };
  V.banner=(w,bossName)=>w%5===0?`☠ OLEADA ÉLITE ${w} · ${bossName.toUpperCase()}`:(`⚔ OLEADA ${w}`);
  V.reward=(w)=>{
    // Más dificultad, pequeña compensación económica.
    const bonus=10+Math.floor(w*1.5)+(w%5===0?25:0);
    GameState.gold+=bonus;GameState.goldEarned+=bonus;updateHUD();
    showRewardToast(`⚔ +${bonus} oro · Bonificación de guerra`);
  };
  window.CombatV29=V;
})();
