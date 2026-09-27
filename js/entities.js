function distToPath(px,py){let min=Infinity;for(let i=0;i<PATH_POINTS.length-1;i++){const a=PATH_POINTS[i],b=PATH_POINTS[i+1],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;let t=l2?((px-a.x)*dx+(py-a.y)*dy)/l2:0;t=Math.max(0,Math.min(1,t));min=Math.min(min,Math.hypot(px-(a.x+t*dx),py-(a.y+t*dy)))}return min}
function createEnemyVisual(scene,x,y,r,key,color){
  // Personajes vectoriales 2D: silueta humanoide, equipo, rostro y animación visual.
  const c=scene.add.container(x,y).setDepth(y+15);
  const shadow=scene.add.ellipse(0,r*1.12,r*2.15,r*.48,0x000000,.38); c.add(shadow); c.shadow=shadow;
  const body=scene.add.container(0,0); c.add(body);
  const g=scene.add.graphics(); body.add(g);

  const isBoss=key==='boss', isOgre=key==='ogre', isRaider=key==='raider';
  const skin=isBoss?0x4f713b:isOgre?0x66834a:isRaider?0x759454:0x5f8d48;
  const skinDark=isBoss?0x2d4b2b:isOgre?0x3f5d34:isRaider?0x49683a:0x3f6334;
  const leather=isBoss?0x302018:isOgre?0x493222:0x573827;
  const metal=isBoss?0xb18b4b:isOgre?0x77736b:0x76614b;
  const cloth=isBoss?0x702c34:isOgre?0x4a4b50:0x3d3030;
  const scale=isBoss?1.18:isOgre?1.08:isRaider?.88:.94;
  c.characterScale=scale;

  // Piernas articuladas
  const legs=scene.add.graphics(); body.add(legs);
  legs.fillStyle(skinDark,1);
  legs.fillRoundedRect(-r*.58,r*.35,r*.34,r*.72,5); legs.fillRoundedRect(r*.24,r*.35,r*.34,r*.72,5);
  legs.fillStyle(0x20150f,1); legs.fillRoundedRect(-r*.70,r*.94,r*.54,r*.22,5); legs.fillRoundedRect(r*.16,r*.94,r*.54,r*.22,5);
  legs.lineStyle(1,0x17100c,.8); legs.strokeRoundedRect(-r*.58,r*.35,r*.34,r*.72,5); legs.strokeRoundedRect(r*.24,r*.35,r*.34,r*.72,5);

  // Capa / faldón
  g.fillStyle(leather,1); g.fillTriangle(-r*.78,-r*.05,r*.78,-r*.05,r*.65,r*.72,-r*.65,r*.72);
  g.fillStyle(skin,1); g.fillRoundedRect(-r*.72,-r*.35,r*1.44,r*.88,7);
  g.lineStyle(2,0x20150f,.8); g.strokeRoundedRect(-r*.72,-r*.35,r*1.44,r*.88,7);

  // Coraza
  g.fillStyle(cloth,1); g.fillRoundedRect(-r*.52,-r*.25,r*1.04,r*.72,5);
  g.fillStyle(metal,.95); g.fillRoundedRect(-r*.43,-r*.18,r*.86,r*.18,3);
  g.fillStyle(0xc2a15c,.8); g.fillRect(-r*.06,-r*.20,r*.12,r*.58);

  // Hombreras
  g.fillStyle(metal,1); g.fillTriangle(-r*.62,-r*.30,-r*1.00,-r*.12,-r*.65,r*.02); g.fillTriangle(r*.62,-r*.30,r*1.00,-r*.12,r*.65,r*.02);

  // Brazos como piezas separadas para simular ataque/caminar
  const armL=scene.add.container(-r*.76,.02), armR=scene.add.container(r*.76,.02); body.add(armL); body.add(armR);
  const agL=scene.add.graphics(), agR=scene.add.graphics(); armL.add(agL); armR.add(agR);
  agL.fillStyle(skin,1); agL.fillRoundedRect(-r*.15,0,r*.30,r*.72,5); agL.fillStyle(0x21150f,1); agL.fillCircle(0,r*.76,r*.17);
  agR.fillStyle(skin,1); agR.fillRoundedRect(-r*.15,0,r*.30,r*.72,5); agR.fillStyle(0x21150f,1); agR.fillCircle(0,r*.76,r*.17);
  c.armL=armL; c.armR=armR;

  // Cabeza / mandíbula
  const head=scene.add.container(0,-r*.82); body.add(head); c.head=head;
  const hg=scene.add.graphics(); head.add(hg);
  hg.fillStyle(skin,1); hg.fillRoundedRect(-r*.53,-r*.42,r*1.06,r*.80,8);
  hg.fillTriangle(-r*.48,r*.27,0,r*.48,r*.48,r*.27);
  // orejas puntiagudas
  hg.fillStyle(skinDark,1); hg.fillTriangle(-r*.45,-r*.10,-r*.93,-r*.25,-r*.50,r*.10); hg.fillTriangle(r*.45,-r*.10,r*.93,-r*.25,r*.50,r*.10);
  // cejas / ojos / nariz
  hg.fillStyle(0x21130e,1); hg.fillRect(-r*.38,-r*.20,r*.27,r*.075); hg.fillRect(r*.11,-r*.20,r*.27,r*.075);
  hg.fillStyle(isBoss?0xffc34f:0xf4d96b,1); hg.fillRect(-r*.28,-r*.15,r*.095,r*.05); hg.fillRect(r*.185,-r*.15,r*.095,r*.05);
  hg.fillStyle(0x253019,1); hg.fillTriangle(0,-r*.12,-r*.10,r*.14,r*.10,r*.14);
  hg.fillStyle(0x1b110d,1); hg.fillRoundedRect(-r*.29,r*.20,r*.58,r*.075,3);
  hg.fillStyle(0xf0e1bd,1); hg.fillTriangle(-r*.22,r*.22,-r*.08,r*.22,-r*.15,r*.43); hg.fillTriangle(r*.22,r*.22,r*.08,r*.22,r*.15,r*.43);

  // Casco/capucha según clase
  if(isRaider){
    hg.fillStyle(0x4a3a31,1); hg.fillTriangle(-r*.62,-r*.30,0,-r*.76,r*.62,-r*.30); hg.fillStyle(0x241a15,1); hg.fillRect(-r*.55,-r*.05,r*1.10,r*.12);
  } else {
    hg.fillStyle(isBoss?0x5b4937:isOgre?0x4e514b:0x4a392c,1); hg.fillRoundedRect(-r*.55,-r*.48,r*1.10,r*.23,5);
    hg.fillStyle(metal,1); hg.fillRect(-r*.11,-r*.58,r*.22,r*.22);
    hg.lineStyle(1,0x1e1510,.9); hg.strokeRoundedRect(-r*.55,-r*.48,r*1.10,r*.23,5);
  }

  // Armas: cada tipo tiene una silueta reconocible
  if(isRaider){
    const dagger=scene.add.graphics(); body.add(dagger); dagger.fillStyle(0x2b211b,1); dagger.fillRect(r*.91,-r*.22,r*.10,r*1.02); dagger.fillStyle(0xbab7ae,1); dagger.fillTriangle(r*.94,-r*.35,r*1.32,-r*.08,r*.94,r*.08); c.weapon=dagger;
  } else if(isOgre){
    const shield=scene.add.graphics(); body.add(shield); shield.fillStyle(0x55483b,1); shield.fillRoundedRect(-r*1.18,-r*.02,r*.42,r*.90,8); shield.lineStyle(2,0xb69457,.9); shield.strokeRoundedRect(-r*1.18,-r*.02,r*.42,r*.90,8); shield.fillStyle(0x8f774d,1); shield.fillCircle(-r*.97,r*.43,r*.08);
    const hammer=scene.add.graphics(); body.add(hammer); hammer.fillStyle(0x2a2019,1); hammer.fillRect(r*.92,-r*.56,r*.12,r*1.52); hammer.fillStyle(0x8b8b83,1); hammer.fillRoundedRect(r*.70,-r*.70,r*.60,r*.34,5); c.weapon=hammer;
  } else {
    const axe=scene.add.graphics(); body.add(axe); axe.fillStyle(0x2a2018,1); axe.fillRect(r*.94,-r*.55,r*.11,r*1.62); axe.fillStyle(metal,1); axe.fillTriangle(r*1.00,-r*.65,r*1.52,-r*.86,r*1.40,-r*.22); axe.lineStyle(1,0x34291e,.8); axe.strokeTriangle(r*1.00,-r*.65,r*1.52,-r*.86,r*1.40,-r*.22); c.weapon=axe;
  }

  if(isBoss){
    // Rey Ogro: corona de cuernos + capa + estandarte
    hg.fillStyle(0x332018,1); hg.fillTriangle(-r*.55,-r*.50,-r*1.02,-r*1.02,-r*.42,-r*.66); hg.fillTriangle(r*.55,-r*.50,r*1.02,-r*1.02,r*.42,-r*.66);
    const cape=scene.add.graphics(); body.add(cape); cape.fillStyle(0x6d2831,.95); cape.fillTriangle(-r*.72,-r*.05,0,r*.72,r*.72,-r*.05); cape.lineStyle(2,0xb88d4d,.8); cape.strokeTriangle(-r*.72,-r*.05,0,r*.72,r*.72,-r*.05);
    const banner=scene.add.graphics(); body.add(banner); banner.fillStyle(0x2c1b15,1); banner.fillRect(-r*1.35,-r*1.18,r*.10,r*2.35); banner.fillStyle(0x9d3036,1); banner.fillTriangle(-r*1.30,-r*1.12,-r*.58,-r*.84,-r*1.30,-r*.45); c.weapon=banner;
  }

  c.baseY=y; c.bobSeed=Math.random()*6.28; c.animClock=Math.random()*100; c.setScale(scale);
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
function updateEnemies(time,delta){for(const e of GameState.enemies){if(e.dead)continue;const spd=(e.slowUntil>time?e.baseSpeed*SLOW_FACTOR:e.baseSpeed)*delta/1000,wp=PATH_POINTS[e.wpIndex+1];if(!wp){GameState.lives--;updateHUD();GameState.scene.cameras.main.shake(100,.004);killEnemyOffPath(e);if(GameState.lives<=0)showGameOver(false);continue}const dx=wp.x-e.x,dy=wp.y-e.y,d=Math.hypot(dx,dy);if(d<4)e.wpIndex++;else{e.x+=dx/d*spd;e.y+=dy/d*spd}const moving=d>=4;const bob=Math.sin(time/145+e.bobSeed)*(moving?(e.isBoss?1.2:1.8):.5);e.sprite.setPosition(e.x,e.y+bob);e.sprite.setDepth(e.y+15);if(e.sprite.shadow)e.sprite.shadow.setY(e.radius*.9-bob);if(e.isBoss&&e.sprite.aura)e.sprite.aura.setAlpha(.05+.03*Math.sin(time/180));if(moving){e.animClock+=delta;const phase=Math.sin(e.animClock/70);e.sprite.scaleY=1+Math.abs(phase)*(e.isBoss?.018:.035);e.sprite.rotation=Math.sin(e.animClock/90)*(e.isBoss?.008:.018);if(e.sprite.armL)e.sprite.armL.rotation=phase*.10;if(e.sprite.armR)e.sprite.armR.rotation=-phase*.10;if(e.sprite.weapon)e.sprite.weapon.rotation=-phase*.025}if(!moving&&e.sprite.armL){e.sprite.armL.rotation=Math.sin(time/260+e.bobSeed)*.025;e.sprite.armR.rotation=-Math.sin(time/260+e.bobSeed)*.025}e.bar.setPosition(e.x,e.y-e.radius-9+bob*.4);e.barBg.setPosition(e.x,e.y-e.radius-9+bob*.4);const ratio=Math.max(0,e.hp/e.maxHp);e.bar.width=ratio*(e.radius*2);e.bar.setFillStyle(ratio<.3?0xd84d50:ratio<.6?0xe1b64e:0x7fbd59)}GameState.enemies=GameState.enemies.filter(e=>!e.dead)}
function startWave(){if(GameState.waveActive)return;GameState.wave++;GameState.waveActive=true;GameState.spawning=true;const boss=GameState.wave%BOSS_WAVE_INTERVAL===0;toggleBossTag(boss);showWaveBanner(boss?`♛ OLEADA ${GameState.wave} · REY OGRO`:`⚔ OLEADA ${GameState.wave}`);updateHUD();const count=4+GameState.wave*2;let spawned=0;GameState.scene.time.addEvent({delay:500,repeat:count-1,callback:()=>{spawned++;spawnEnemy(GameState.wave>1&&Math.random()<.3,GameState.wave>2&&Math.random()<.25);if(spawned>=count){if(boss)GameState.scene.time.delayedCall(900,()=>{spawnBoss();GameState.spawning=false});else GameState.spawning=false}}})}
function checkWaveComplete(){if(GameState.waveActive&&!GameState.spawning&&GameState.enemies.length===0){GameState.waveActive=false;GameState.gold+=25+GameState.wave*3;toggleBossTag(false);updateHUD();showRewardToast(`+${25+GameState.wave*3} oro · Oleada superada`)}}
function showRewardToast(text){const s=GameState.scene,t=s.add.text(400,105,text,{fontFamily:'Cinzel,serif',fontSize:'11px',color:'#f0d994',backgroundColor:'#1b120ddd',padding:{left:10,right:10,top:6,bottom:6}}).setOrigin(.5).setDepth(30).setAlpha(0);s.tweens.add({targets:t,alpha:1,y:92,duration:220,onComplete:()=>s.tweens.add({targets:t,alpha:0,y:80,delay:700,duration:300,onComplete:()=>t.destroy()})})}
