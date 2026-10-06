/* V26 — Combate Inteligente
 * Comportamientos ligeros: no añade IA pesada ni pathfinding nuevo.
 * Cada enemigo usa una pequeña máquina de estados temporal y efectos reutilizables.
 */
(function(){
  const AI={};
  const now=()=>performance.now();
  function ensure(e){
    if(e.ai)return e.ai;
    const max=e.maxHp||1;
    e.ai={
      next:now()+700+Math.random()*900,
      burstUntil:0, shield:0, shieldMax:0, dodgeUntil:0,
      phaseUntil:0, lastCue:0, rage:false, seed:Math.random()*6.28
    };
    if(e.key==='ogre'||e.key==='brute'){
      e.ai.shieldMax=Math.round(max*(e.key==='brute'?.16:.12));
      e.ai.shield=e.ai.shieldMax;
    }
    return e.ai;
  }
  function cue(e,color,scale){
    const t=now(); const a=ensure(e);
    if(t-a.lastCue<850)return; a.lastCue=t;
    if(typeof ringFx==='function')ringFx(e.x,e.y,color,scale||28,420);
    if(typeof rise==='function')rise(e.x,10,e.y,color,500,22);
  }
  function update(e,time,dt){
    if(!e||e.dead)return;
    const a=ensure(e); e.aiSpeedMul=1;
    // Balista Veloz: aceleraciones cortas y esquiva parcial de flechas.
    if(e.key==='raider'){
      if(time>=a.next){a.next=time+3800+Math.random()*1700;a.burstUntil=time+900;a.dodgeUntil=time+650;cue(e,0xffd45a,24);}
      if(time<a.burstUntil)e.aiSpeedMul=1.85;
    }
    // Blindados: regeneran una pequeña barrera en combate; no es permanente.
    if(e.key==='ogre'||e.key==='brute'){
      if(a.shield<=0&&time>=a.next){a.shield=a.shieldMax;a.next=time+5600+Math.random()*1800;cue(e,e.key==='brute'?0xff7040:0x9fb35a,e.key==='brute'?38:32);}
      // El bruto entra en furia al estar herido: más rápido, sin cambiar su vida.
      const r=e.hp/e.maxHp;
      a.rage=r<.45;
      if(a.rage)e.aiSpeedMul=1.18;
    }
    // Espectro: fase corta de movimiento acelerado, visualmente etérea.
    if(e.key==='wraith'){
      if(time>=a.next){a.next=time+5200+Math.random()*1800;a.phaseUntil=time+850;cue(e,0x8fd3ff,34);}
      if(time<a.phaseUntil)e.aiSpeedMul=1.7;
    }
    // Saboteador y Chamán ya poseen rutinas específicas en el motor base.
  }
  function hit(e,dtype,crit){
    if(!e||e.dead)return false;
    const a=ensure(e),t=now();
    // La esquiva del raider evita parte de los impactos de proyectil físico.
    if(e.key==='raider'&&t<a.dodgeUntil&&(dtype==='pierce'||dtype==='snipe')){
      if(typeof rise==='function')rise(e.x,12,e.y,0xffd45a,380,28);
      return true;
    }
    // Barrera inteligente de blindados: absorbe daño antes de la barra de vida.
    if((e.key==='ogre'||e.key==='brute')&&a.shield>0){
      const absorbed=Math.min(a.shield,Math.max(0,e.__v26PendingDamage||0));
      if(absorbed>0){a.shield-=absorbed;e.__v26Absorbed=absorbed;if(typeof spark==='function')spark(e.x,e.hb*.6,e.y,0xc7df8a,220,1.3);}
    }
    return false;
  }
  AI.update=update; AI.hit=hit;
  window.CombatV26=AI;
})();
