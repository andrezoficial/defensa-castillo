/* V28 — Enemigos Avanzados
 * IA ligera: coordinación, protectores, curación inteligente, asedio y cazadores de torres.
 * No añade pathfinding pesado ni aumenta el número de enemigos por sí mismo.
 */
(function(){
  const V={};
  const now=()=>performance.now();
  const ensure=e=>e.__v28||(e.__v28={next:now()+900+Math.random()*1000,lastCue:0,guardUntil:0,siegeUntil:0});
  const cue=(e,color,scale=30)=>{const a=ensure(e),t=now();if(t-a.lastCue<850)return;a.lastCue=t;if(typeof ringFx==='function')ringFx(e.x,e.y,color,scale,480);if(typeof rise==='function')rise(e.x,10,e.y,color,520,22)};
  function nearby(e,r,fn){for(const o of GameState.enemies){if(o!==e&&!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<r)fn(o)}}
  function update(e,time,dt){
    if(!e||e.dead)return;
    const a=ensure(e);e.v28SpeedMul=1;e.v28Protected=false;e.v28Guard=null;
    // Coordinación: grupos cercanos avanzan ligeramente más juntos/rápido.
    let allies=0;nearby(e,78,()=>allies++);
    if(allies>=2)e.v28SpeedMul=1.08;
    // Protector: el Bruto crea una pequeña zona de guardia. Visual barata y sin pathfinding.
    if(e.key==='brute'){
      if(time>=a.next){a.next=time+2600+Math.random()*1200;a.guardUntil=time+1900;cue(e,0x8fe06a,40)}
      if(time<a.guardUntil){e.v28Guard=true;nearby(e,72,o=>{o.v28Protected=true;o.v28Guard=e})}
    }
    // El jefe también protege a los aliados que marchan junto a él, sin hacerlos invencibles.
    if(e.isBoss){nearby(e,92,o=>{o.v28Protected=true;o.v28Guard=e})}
    // Chamán: el motor existente cura; V28 fuerza prioridad al aliado más herido.
    if(e.key==='healer'){
      let target=null,best=1;
      nearby(e,HEAL_RADIUS,o=>{const r=o.hp/o.maxHp;if(r<best){best=r;target=o}});
      e.v28HealTarget=target;
      if(target&&time>=a.next){a.next=time+1200;cue(e,0x66ff99,HEAL_RADIUS*.55)}
    }
    // Asedio: Ogro/Bruto intentan desactivar brevemente la torre más próxima cuando están cerca.
    if((e.key==='ogre'||e.key==='brute')&&time>=a.siegeUntil){
      let best=null,bd=58;
      for(const t of GameState.towers){const d=Math.hypot(t.x-e.x,t.y-e.y);if(d<bd){bd=d;best=t}}
      if(best){a.siegeUntil=time+(e.key==='brute'?5200:6800);if(typeof stunTower==='function')stunTower(best,e.key==='brute'?900:650,e);cue(e,e.key==='brute'?0xff7040:0xffa04a,34);showRewardToast(e.key==='brute'?'⚠ Ogro Bruto golpea una torre':'⚠ Ogro de asedio presiona una torre')}
    }
    // Saboteador: comportamiento de V4 se conserva; V28 le da prioridad al objetivo más avanzado.
    if(e.key==='saboteur'){
      let best=null,bestScore=-Infinity;for(const t of GameState.towers){if(t.stunUntil>S.now)continue;const d=Math.hypot(t.x-e.x,t.y-e.y);if(d<SAB_RANGE){const score=(t.level||1)*100-d;if(score>bestScore){bestScore=score;best=t}}}
      e.v28TargetTower=best;
    }
  }
  function damageTaken(e,dmg){
    if(!e||e.dead)return dmg;
    let protectedBy=false;
    for(const o of GameState.enemies){if(o.dead||o===e)continue;if((o.key==='brute'||o.isBoss)&&Math.hypot(o.x-e.x,o.y-e.y)<(o.isBoss?92:72)){protectedBy=true;break}}
    if(protectedBy)dmg*=.82;
    return dmg;
  }
  function resetWave(){
    for(const e of GameState.enemies)if(e.__v28){e.__v28.next=now()+500+Math.random()*900;e.__v28.siegeUntil=0}
  }
  V.update=update;V.damageTaken=damageTaken;V.resetWave=resetWave;
  window.CombatV28=V;
})();
