function createTowerVisual(scene,x,y,type,color){
 const c=scene.add.container(x,y).setDepth(y+20);c.add(scene.add.ellipse(0,16,38,13,0x000000,.25));
 const ring=scene.add.circle(0,4,18,0x40382f).setStrokeStyle(2,0x1e1b18);c.add(ring);c.ring=ring;
 if(type==='basic'){
  c.add(scene.add.rectangle(0,0,24,27,0x73583b).setStrokeStyle(2,0x332416));c.add(scene.add.triangle(0,-22,-16,9,16,9,0,-13,0x823a32).setStrokeStyle(2,0x332416));c.add(scene.add.rectangle(0,-1,12,9,0x30251c));
  const archer=scene.add.sprite(0,-6,'elf_m_idle_anim_f0').setScale(1.7);archer.play('elf_m_idle');c.add(archer);c.archer=archer;
 }else if(type==='slow'){
  c.add(scene.add.polygon(0,-5,[-16,14,0,-29,16,14],0x44395f).setStrokeStyle(2,0x21192d));
  const wizard=scene.add.sprite(0,-8,'wizzard_m_idle_anim_f0').setScale(1.7);wizard.play('wizzard_m_idle');c.add(wizard);c.wizard=wizard;
  const orb=scene.add.circle(0,-27,5,color,.55).setStrokeStyle(2,0xc4eaff,.7);c.add(orb);c.orb=orb;scene.tweens.add({targets:orb,scale:1.35,alpha:.2,duration:750,yoyo:true,repeat:-1});
 }else{
  c.add(scene.add.circle(-12,9,8,0x2a2119).setStrokeStyle(2,0x120e0b));c.add(scene.add.circle(12,9,8,0x2a2119).setStrokeStyle(2,0x120e0b));c.add(scene.add.rectangle(0,3,29,10,0x654322).setStrokeStyle(2,0x2e1b10));const arm=scene.add.rectangle(5,-8,5,29,0x9a6a32).setOrigin(.5,1).setRotation(-.42);c.add(arm);c.arm=arm;c.add(scene.add.circle(11,-17,6,0x80623d));
 }
 c.baseScale=1; c.setScale(.8);scene.tweens.add({targets:c,scale:.1+1,duration:260,ease:'Back.Out'});scene.tweens.add({targets:c,y:y-2,duration:850,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});return c;
}
function updateLevelPips(tower){if(tower.pips)tower.pips.destroy();const s=GameState.scene,g=s.add.graphics().setDepth(tower.y+40);const sx=tower.x-(tower.level-1)*5;for(let i=0;i<tower.level;i++){g.fillStyle(0xe7bd5b,1);g.fillCircle(sx+i*10,tower.y-39,3);g.lineStyle(1,0x5d411f,1);g.strokeCircle(sx+i*10,tower.y-39,3)}tower.pips=g}
function getEffectiveStats(tower){return {...TOWER_DEFS[tower.type],...getTowerStats(tower.type,tower.level)}}
function findTowerAt(x,y){for(const t of GameState.towers)if(Math.hypot(t.x-x,t.y-y)<26)return t;return null}

// --- Casillas fijas de construcción ---
function computeBuildSlots(){
  const slots=[];
  for(let gx=20;gx<=GAME_WIDTH-20;gx+=BUILD_GRID_SIZE){
    for(let gy=20;gy<=GAME_HEIGHT-20;gy+=BUILD_GRID_SIZE){
      if(distToPath(gx,gy)<MIN_TOWER_DISTANCE_TO_PATH)continue; // muy cerca del camino
      if(gx>680&&gy<270)continue; // reservado para el castillo
      slots.push({x:gx,y:gy});
    }
  }
  return slots;
}
function isCellOccupied(gx,gy){return GameState.towers.some(t=>t.x===gx&&t.y===gy)}
function nearestSlot(x,y){
  let best=null,bestD=Infinity;
  for(const s of GameState.buildSlots){const d=Math.hypot(s.x-x,s.y-y);if(d<bestD){bestD=d;best=s}}
  return bestD<=BUILD_SNAP_MAX_DIST?best:null;
}
function isValidPlacement(gx,gy,type){const def=TOWER_DEFS[type];if(!def||GameState.gold<def.cost)return false;if(isCellOccupied(gx,gy))return false;return true}
function showBuildGrid(){const s=GameState.scene;if(!s?.slotGraphics)return;const g=s.slotGraphics;g.clear();GameState.buildSlots.forEach(slot=>{if(isCellOccupied(slot.x,slot.y))return;g.fillStyle(0xf1d38b,.32);g.fillCircle(slot.x,slot.y,6);g.lineStyle(2,0xf1d38b,.48);g.strokeCircle(slot.x,slot.y,12)})}
function hideBuildGrid(){GameState.scene?.slotGraphics?.clear()}

function drawPlacementPreview(x,y){
  const s=GameState.scene;if(!s?.previewGraphics)return;const g=s.previewGraphics;g.clear();
  if(!GameState.selectedTower||y>GAME_HEIGHT)return;
  GameState.placementX=x;GameState.placementY=y;
  const d=TOWER_DEFS[GameState.selectedTower],slot=nearestSlot(x,y);
  if(!slot){g.fillStyle(0xd34d46,.18);g.fillCircle(x,y,18);g.lineStyle(2,0xd34d46,.7);g.strokeCircle(x,y,18);return}
  const valid=isValidPlacement(slot.x,slot.y,GameState.selectedTower),col=valid?0x8fb56b:0xd34d46;
  g.fillStyle(col,.08);g.fillCircle(slot.x,slot.y,d.range);
  g.lineStyle(2,col,.65);g.strokeCircle(slot.x,slot.y,d.range);
  g.lineStyle(1,0xffffff,.2);g.strokeCircle(slot.x,slot.y,d.range-5);
  g.lineStyle(2,col,.9);g.strokeRect(slot.x-18,slot.y-18,36,36);
  g.fillStyle(col,.22);g.fillCircle(slot.x,slot.y,18);
  g.lineStyle(2,col,.95);g.strokeCircle(slot.x,slot.y,18);
  // Cruz de colocación visible en móvil mientras se arrastra.
  g.lineStyle(2,col,.9);g.lineBetween(slot.x-8,slot.y,slot.x+8,slot.y);g.lineBetween(slot.x,slot.y-8,slot.x,slot.y+8);
}
function clearPlacementPreview(){GameState.scene?.previewGraphics?.clear();GameState.placementDragging=false;GameState.placementPointerId=null}
function selectPlacedTower(tower){GameState.selectedTower=null;document.querySelectorAll('#buildButtons .tower-btn').forEach(b=>b.classList.remove('selected'));hideBuildGrid();GameState.selectedPlacedTower=tower;showTowerPanel(tower);highlightTower(tower,true)}
function deselectPlacedTower(){if(GameState.selectedPlacedTower)highlightTower(GameState.selectedPlacedTower,false);GameState.selectedPlacedTower=null;hideTowerPanel()}
function highlightTower(t,on){if(!t)return;t.visual.setScale(on?1.12:1);if(t.range)t.range.setVisible(on);if(on){const s=GameState.scene;const pulse=s.add.circle(t.x,t.y,22,towerColor(t.type),0).setStrokeStyle(2,towerColor(t.type),.6).setDepth(t.y+45);t.selectionPulse=pulse;s.tweens.add({targets:pulse,scale:1.35,alpha:.05,duration:650,yoyo:true,repeat:-1})}else if(t.selectionPulse){t.selectionPulse.destroy();t.selectionPulse=null}}
function towerColor(type){return TOWER_DEFS[type].color}
function upgradeTower(t){if(t.level>=MAX_TOWER_LEVEL)return;const cost=getUpgradeCost(t.type,t.level);if(GameState.gold<cost)return;GameState.gold-=cost;t.invested+=cost;t.level++;updateHUD();updateLevelPips(t);refreshTowerPanel(t);const s=GameState.scene;const ring=s.add.circle(t.x,t.y,18,0xe7bd5b,.22).setDepth(t.y+50);s.tweens.add({targets:ring,scale:2.4,alpha:0,duration:400,onComplete:()=>ring.destroy()});const flash=s.add.circle(t.x,t.y,6,0xffffff,.65).setDepth(t.y+51);s.tweens.add({targets:flash,scale:4,alpha:0,duration:260,onComplete:()=>flash.destroy()});}
function sellTower(t){const refund=Math.round(t.invested*SELL_REFUND_RATIO);GameState.gold+=refund;updateHUD();t.visual.destroy();t.range.destroy();t.pips?.destroy();t.selectionPulse?.destroy();GameState.towers=GameState.towers.filter(x=>x!==t);deselectPlacedTower();if(GameState.selectedTower)showBuildGrid()}
function placeTower(x,y){
  if(!GameState.selectedTower)return;
  const slot=nearestSlot(x,y);
  if(!slot||!isValidPlacement(slot.x,slot.y,GameState.selectedTower))return;
  const type=GameState.selectedTower,d=TOWER_DEFS[type],s=GameState.scene,{x:tx,y:ty}=slot;
  GameState.gold-=d.cost;updateHUD();
  const visual=createTowerVisual(s,tx,ty,type,d.color);
  const range=s.add.circle(tx,ty,d.range,0xffffff,0).setStrokeStyle(2,d.color,.28).setDepth(ty+10).setVisible(false);
  const tower={x:tx,y:ty,type,lastShot:0,visual,range,level:1,invested:d.cost};
  GameState.towers.push(tower);updateLevelPips(tower);
  const dust=s.add.circle(tx,ty+9,6,0xc2a36d,.28).setDepth(ty+5);
  s.tweens.add({targets:dust,scaleX:3,scaleY:.5,alpha:0,duration:350,onComplete:()=>dust.destroy()});
  showBuildGrid();
}
function spawnProjectileTrail(s,x,y,color){const p=s.add.circle(x,y,2.5,color,.5).setDepth(28);s.tweens.add({targets:p,scale:0,alpha:0,duration:180,onComplete:()=>p.destroy()});return p}
function shootAt(tower,enemy){const s=GameState.scene,d=getEffectiveStats(tower),tx=enemy.x,ty=enemy.y,dist=Math.hypot(tx-tower.x,ty-tower.y),duration=Math.max(100,dist/(d.area?260:520)*1000);let proj;
 // Ataque: retroceso y retorno suave de la torre
 const kick=tower.visual; s.tweens.add({targets:kick,scaleX:.92,scaleY:1.06,duration:75,yoyo:true,ease:'Quad.Out'});
 if(tower.type==='slow'){const glow=s.add.circle(tower.x,tower.y-25,8,d.proj,.35).setDepth(tower.y+35);s.tweens.add({targets:glow,scale:1.8,alpha:0,duration:220,onComplete:()=>glow.destroy()})}
 if(d.area){proj=s.add.circle(tower.x,tower.y,7,d.proj).setStrokeStyle(2,0xffd99a,.7)}else{const a=Math.atan2(ty-tower.y,tx-tower.x);proj=s.add.rectangle(tower.x,tower.y,17,3,d.proj).setRotation(a);if(tower.type==='basic')proj.setOrigin(.2,.5)}
 const trailTimer=s.time.addEvent({delay:35,loop:true,callback:()=>{if(proj.active)spawnProjectileTrail(s,proj.x,proj.y,d.proj)}});
 s.tweens.add({targets:proj,x:tx,y:ty,duration,ease:'Linear',onComplete:()=>{trailTimer.remove(false);proj.destroy();if(d.area){GameState.enemies.forEach(e=>{if(!e.dead&&Math.hypot(e.x-tx,e.y-ty)<AREA_BLAST_RADIUS)damageEnemy(e,d.dmg)});impactBurst(s,tx,ty,d.proj,true)}else{if(!enemy.dead){damageEnemy(enemy,d.dmg);if(d.slow&&!enemy.isBoss)enemy.slowUntil=s.time.now+SLOW_DURATION_MS}impactBurst(s,tx,ty,d.proj,false)}}});}
function impactBurst(s,x,y,color,big){const r=s.add.circle(x,y,big?7:5,color,.45).setDepth(25);s.tweens.add({targets:r,scale:big?3.5:2.2,alpha:0,duration:220,onComplete:()=>r.destroy()});for(let i=0;i<(big?12:7);i++){const a=Math.random()*Math.PI*2,p=s.add.circle(x,y,big?2.5:2,color,.85).setDepth(25);s.tweens.add({targets:p,x:x+Math.cos(a)*(big?30:16),y:y+Math.sin(a)*(big?30:16),alpha:0,scale:.2,duration:260,onComplete:()=>p.destroy()})}if(big){s.cameras.main.shake(90,.004);const smoke=s.add.circle(x,y,10,0x2b2119,.3).setDepth(24);s.tweens.add({targets:smoke,y:y-16,scale:2.2,alpha:0,duration:420,onComplete:()=>smoke.destroy()})}}
function updateTowers(time){for(const t of GameState.towers){const st=getEffectiveStats(t);if(time-t.lastShot<st.rate)continue;let target=null,best=Infinity;for(const e of GameState.enemies){if(e.dead)continue;const d=Math.hypot(e.x-t.x,e.y-t.y);if(d<=st.range&&d<best){best=d;target=e}}if(target){t.lastShot=time;shootAt(t,target)}}}
