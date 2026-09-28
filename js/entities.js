function distToPath(px,py){let min=Infinity;for(let i=0;i<PATH_POINTS.length-1;i++){const a=PATH_POINTS[i],b=PATH_POINTS[i+1],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;let t=l2?((px-a.x)*dx+(py-a.y)*dy)/l2:0;t=Math.max(0,Math.min(1,t));min=Math.min(min,Math.hypot(px-(a.x+t*dx),py-(a.y+t*dy)))}return min}
function createEnemyVisual(scene,x,y,r,key,color){
  // Máquinas de asedio del Kenney Castle Kit (imagen fija con balanceo al avanzar).
  const c=scene.add.container(x,y).setDepth(y+15);
  const shadow=scene.add.ellipse(0,r*1.12,r*2.15,r*.48,0x000000,.38); c.add(shadow); c.shadow=shadow;

  const isBoss=key==='boss';
  const def=ENEMY_SPRITE_DEFS[key]||ENEMY_SPRITE_DEFS.goblin;
  const sd=SPRITES[def.tex];
  const sprite=scene.add.image(0,r*.85,def.tex).setOrigin(sd.ox,sd.oy);
  sprite.setScale(SPRITE_SCALE*def.scale*(isBoss?1.35:1));
  c.add(sprite); c.charSprite=sprite;

  if(isBoss){
    // Jefe: aura + tinte dorado para distinguirlo (el trabuquete ya lleva sus propias banderas)
    sprite.setTint(0xffcf9e);
    const aura=scene.add.circle(0,-r*.1,r*1.5,0xe7bd5b,.10).setDepth(-1); c.addAt(aura,1); c.aura=aura;
  }

  c.baseY=y; c.bobSeed=Math.random()*6.28; c.animClock=Math.random()*100;
  return c;
}
function spawnDeathBurst(scene,x,y,color){for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,p=scene.add.circle(x,y,Phaser.Math.Between(2,4),color,.9).setDepth(40);scene.tweens.add({targets:p,x:x+Math.cos(a)*Phaser.Math.Between(15,32),y:y+Math.sin(a)*Phaser.Math.Between(15,32)-Phaser.Math.Between(0,10),alpha:0,scale:.15,angle:Phaser.Math.Between(-180,180),duration:360+Math.random()*160,ease:'Cubic.easeOut',onComplete:()=>p.destroy()})}const ring=scene.add.circle(x,y,5,0xffffff,.25).setStrokeStyle(2,color,.7).setDepth(39);scene.tweens.add({targets:ring,scale:3.2,alpha:0,duration:280,onComplete:()=>ring.destroy()})}
function makeEnemy(key,x,y,wpIndex,hp,speed,radius,reward){const s=GameState.scene,type=ENEMY_TYPES[key],sprite=createEnemyVisual(s,x,y,radius,key,type.color),barBg=s.add.rectangle(x,y-radius-9,radius*2+5,6,0x1b120e,.8).setOrigin(.5),bar=s.add.rectangle(x,y-radius-9,radius*2,3,0x7fbd59).setOrigin(.5);const e={sprite,bar,barBg,hp,maxHp:hp,speed,baseSpeed:speed,wpIndex,x,y,radius,slowUntil:0,color:type.color,reward,isBoss:key==='boss',bobSeed:Math.random()*6.28,animClock:Math.random()*100};GameState.enemies.push(e);return e}
function spawnEnemy(fast,tank){const hp=tank?90+GameState.wave*14:30+GameState.wave*8,speed=fast?90:45,r=tank?16:11,key=tank?'ogre':fast?'raider':'goblin',reward=tank?12:fast?6:5;const p=PATH_POINTS[0];return makeEnemy(key,p.x,p.y,0,hp,speed,r,reward)}
function spawnBoss(){const w=GameState.wave,p=PATH_POINTS[0],b=makeEnemy('boss',p.x,p.y,0,320+w*45,28,24,40+w*5);b.summonedReinforcements=false;return b}
function spawnMinionAt(x,y,wp){makeEnemy('goblin',x,y,wp,20+GameState.wave*5,45,11,5)}
function damageEnemy(e,dmg){if(e.dead)return;e.hp-=dmg;const s=GameState.scene;const hit=s.add.circle(e.x,e.y,Math.max(5,e.radius*.55),0xffffff,.5).setDepth(50);s.tweens.add({targets:hit,alpha:0,scale:1.8,duration:100,onComplete:()=>hit.destroy()});const recoil=e.sprite.body?e.sprite.body: e.sprite; s.tweens.add({targets:e.sprite,scaleX:1.12,scaleY:.9,duration:65,yoyo:true,ease:'Quad.Out'});if(e.isBoss&&!e.summonedReinforcements&&e.hp>0&&e.hp<=e.maxHp*.5){e.summonedReinforcements=true;spawnMinionAt(e.x-22,e.y,e.wpIndex);spawnMinionAt(e.x+22,e.y,e.wpIndex);s.cameras.main.shake(180,.008)}if(e.hp<=0){e.dead=true;GameState.gold+=e.reward;updateHUD();spawnDeathBurst(s,e.x,e.y,e.color);if(e.isBoss){s.cameras.main.shake(260,.016);bossDeathEffect(s,e.x,e.y)}s.tweens.add({targets:e.sprite,alpha:0,scale:.35,angle:Phaser.Math.Between(-25,25),duration:240,ease:'Back.In',onComplete:()=>e.sprite.destroy()});s.tweens.add({targets:[e.bar,e.barBg],alpha:0,duration:120,onComplete:()=>{e.bar.destroy();e.barBg.destroy()}})}}
function bossDeathEffect(s,x,y){const ring=s.add.circle(x,y,18,0xe7bd5b,.15).setStrokeStyle(3,0xf4d487,.7).setDepth(60);s.tweens.add({targets:ring,scale:5,alpha:0,duration:650,ease:'Cubic.Out',onComplete:()=>ring.destroy()});for(let i=0;i<26;i++){const a=Math.random()*Math.PI*2,p=s.add.circle(x,y,Phaser.Math.Between(2,4),i%2?0xb41425:0xe7bd5b,.9).setDepth(61);s.tweens.add({targets:p,x:x+Math.cos(a)*Phaser.Math.Between(45,95),y:y+Math.sin(a)*Phaser.Math.Between(45,95),alpha:0,duration:500+Math.random()*350,ease:'Cubic.Out',onComplete:()=>p.destroy()})}}
function killEnemyOffPath(e){e.dead=true;e.sprite.destroy();e.bar.destroy();e.barBg.destroy()}
function updateEnemies(time,delta){for(const e of GameState.enemies){if(e.dead)continue;const spd=(e.slowUntil>time?e.baseSpeed*SLOW_FACTOR:e.baseSpeed)*delta/1000,wp=PATH_POINTS[e.wpIndex+1];if(!wp){GameState.lives--;updateHUD();GameState.scene.cameras.main.shake(100,.004);killEnemyOffPath(e);if(GameState.lives<=0)showGameOver(false);continue}const dx=wp.x-e.x,dy=wp.y-e.y,d=Math.hypot(dx,dy);if(d<4)e.wpIndex++;else{e.x+=dx/d*spd;e.y+=dy/d*spd}const moving=d>=4;const bob=Math.sin(time/145+e.bobSeed)*(moving?(e.isBoss?1.2:1.8):.5);e.sprite.setPosition(e.x,e.y+bob);e.sprite.setDepth(e.y+15);if(e.sprite.shadow)e.sprite.shadow.setY(e.radius*.9-bob);if(e.isBoss&&e.sprite.aura)e.sprite.aura.setAlpha(.08+.04*Math.sin(time/180));
  // Voltea el sprite según la dirección de avance (el arte mira hacia la derecha por defecto)
  if(e.sprite.charSprite){if(Math.abs(dx)>0.5)e.sprite.charSprite.setFlipX(dx<0);e.sprite.charSprite.setAngle(moving?Math.sin(time/(e.isBoss?210:130)+e.bobSeed)*(e.isBoss?1.6:2.6):0)}
  e.bar.setPosition(e.x,e.y-e.radius-9+bob*.4);e.barBg.setPosition(e.x,e.y-e.radius-9+bob*.4);const ratio=Math.max(0,e.hp/e.maxHp);e.bar.width=ratio*(e.radius*2);e.bar.setFillStyle(ratio<.3?0xd84d50:ratio<.6?0xe1b64e:0x7fbd59)}GameState.enemies=GameState.enemies.filter(e=>!e.dead)}
function startWave(){if(GameState.waveActive)return;GameState.wave++;GameState.waveActive=true;GameState.spawning=true;const boss=GameState.wave%BOSS_WAVE_INTERVAL===0;toggleBossTag(boss);showWaveBanner(boss?`♛ OLEADA ${GameState.wave} · TRABUQUETE REAL`:`⚔ OLEADA ${GameState.wave}`);updateHUD();const count=4+GameState.wave*2;let spawned=0;GameState.scene.time.addEvent({delay:500,repeat:count-1,callback:()=>{spawned++;spawnEnemy(GameState.wave>1&&Math.random()<.3,GameState.wave>2&&Math.random()<.25);if(spawned>=count){if(boss)GameState.scene.time.delayedCall(900,()=>{spawnBoss();GameState.spawning=false});else GameState.spawning=false}}})}
function checkWaveComplete(){if(GameState.waveActive&&!GameState.spawning&&GameState.enemies.length===0){GameState.waveActive=false;GameState.gold+=25+GameState.wave*3;toggleBossTag(false);updateHUD();showRewardToast(`+${25+GameState.wave*3} oro · Oleada superada`)}}
function showRewardToast(text){const s=GameState.scene,t=s.add.text(400,105,text,{fontFamily:'Cinzel,serif',fontSize:'11px',color:'#f0d994',backgroundColor:'#1b120ddd',padding:{left:10,right:10,top:6,bottom:6}}).setOrigin(.5).setDepth(30).setAlpha(0);s.tweens.add({targets:t,alpha:1,y:92,duration:220,onComplete:()=>s.tweens.add({targets:t,alpha:0,y:80,delay:700,duration:300,onComplete:()=>t.destroy()})})}
