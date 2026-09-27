class MainScene extends Phaser.Scene {
  create(){
    GameState.scene=this;
    this.drawTerrain(); this.drawDecorations(); this.drawPath(); this.drawCastle();
    this.previewGraphics=this.add.graphics().setDepth(8);
    this.addAmbientParticles();
    this.input.on('pointerdown',p=>{if(p.y>GAME_HEIGHT)return;if(GameState.selectedTower){placeTower(p.x,p.y);drawPlacementPreview(p.x,p.y);return}const t=findTowerAt(p.x,p.y);t?selectPlacedTower(t):deselectPlacedTower()});
    this.input.on('pointermove',p=>drawPlacementPreview(p.x,p.y));
    updateHUD();
    this.scene.pause();
  }
  drawTerrain(){
    this.add.rectangle(400,250,800,500,0x314d27);
    const g=this.add.graphics(); const rng=new Phaser.Math.RandomDataGenerator([42]);
    for(let i=0;i<260;i++){const x=rng.between(0,800),y=rng.between(0,500);if(distToPath(x,y)<34)continue;const r=rng.between(1,4);g.fillStyle(rng.pick([0x3c5a2e,0x29441f,0x456536,0x213b1c]),rng.realInRange(.25,.7));g.fillCircle(x,y,r);if(i%7===0){g.lineStyle(1,0x6d8c55,.35);g.lineBetween(x,y,x+rng.between(-3,3),y-5)}}
    // subtle terrain bands
    g.fillStyle(0x162713,.18);g.fillEllipse(120,430,220,90);g.fillEllipse(610,95,260,80);
  }
  drawDecorations(){
    const rng=new Phaser.Math.RandomDataGenerator([99]),spots=[];let tries=0;
    while(spots.length<24&&tries++<600){const x=rng.between(22,755),y=rng.between(22,478);if(distToPath(x,y)<57)continue;if(x>715&&y<225)continue;if(spots.some(s=>Math.hypot(s.x-x,s.y-y)<32))continue;spots.push({x,y})}
    spots.forEach(s=>{const k=rng.pick(['tree','tree','tree','bush','rock','flower']);if(k==='tree')this.drawTree(s.x,s.y,rng.realInRange(.8,1.15));else if(k==='bush')this.drawBush(s.x,s.y);else if(k==='rock')this.drawRock(s.x,s.y);else this.drawFlowers(s.x,s.y)});
  }
  drawTree(x,y,s=1){const c=this.add.container(x,y);c.setDepth(y);c.add(this.add.ellipse(0,15*s,30*s,10*s,0x000000,.22));c.add(this.add.rectangle(0,5*s,7*s,22*s,0x5b3a20));c.add(this.add.circle(-10*s,-4*s,14*s,0x29481f));c.add(this.add.circle(10*s,-4*s,14*s,0x35582a));c.add(this.add.circle(0,-15*s,15*s,0x406b31));c.add(this.add.circle(-6*s,-16*s,6*s,0x5b813e,.45));}
  drawBush(x,y){const g=this.add.graphics().setDepth(y);g.fillStyle(0x000000,.18);g.fillEllipse(x,y+8,27,9);g.fillStyle(0x29491f,1);g.fillCircle(x-8,y,10);g.fillStyle(0x3d6330,1);g.fillCircle(x+7,y-1,10);g.fillStyle(0x5c7d42,.6);g.fillCircle(x,y-6,6)}
  drawRock(x,y){const g=this.add.graphics().setDepth(y);g.fillStyle(0x000000,.2);g.fillEllipse(x,y+7,20,7);g.fillStyle(0x6e716c,1);g.beginPath();g.moveTo(x-9,y+4);g.lineTo(x-5,y-5);g.lineTo(x+4,y-8);g.lineTo(x+10,y);g.lineTo(x+6,y+6);g.closePath();g.fillPath();g.lineStyle(1,0x3d403c,.8);g.strokePath()}
  drawFlowers(x,y){const g=this.add.graphics().setDepth(y);g.lineStyle(1,0x60784b,.8);g.lineBetween(x,y,x,y+6);g.fillStyle(0xd6b66a,.8);g.fillCircle(x,y,2);g.fillStyle(0xa65d4d,.8);g.fillCircle(x+4,y+2,2)}
  drawPath(){
    const g=this.add.graphics().setDepth(1);g.lineStyle(58,0x3b2a1a,1);g.beginPath();g.moveTo(PATH_POINTS[0].x,PATH_POINTS[0].y);for(let i=1;i<PATH_POINTS.length;i++)g.lineTo(PATH_POINTS[i].x,PATH_POINTS[i].y);g.strokePath();
    g.lineStyle(50,0x76522f,1);g.beginPath();g.moveTo(PATH_POINTS[0].x,PATH_POINTS[0].y);for(let i=1;i<PATH_POINTS.length;i++)g.lineTo(PATH_POINTS[i].x,PATH_POINTS[i].y);g.strokePath();
    const rng=new Phaser.Math.RandomDataGenerator([7]);for(let i=0;i<120;i++){const x=rng.between(0,800),y=rng.between(0,500);if(distToPath(x,y)<24){g.fillStyle(rng.pick([0x94734b,0x6b4b2b,0xa38157]),.55);g.fillEllipse(x,y,rng.between(2,5),rng.between(1,3))}}
    // wagon tracks
    g.lineStyle(2,0x4e351f,.45);for(let off of [-9,9]){g.beginPath();for(let i=0;i<PATH_POINTS.length;i++){const p=PATH_POINTS[i];g.lineTo(p.x+off,p.y+off)}g.strokePath()}
  }
  drawCastle(){
    const cx=785,cy=150,c=this.add.container(cx,cy).setDepth(5);
    c.add(this.add.ellipse(0,58,120,24,0x000000,.28));
    c.add(this.add.rectangle(0,0,88,105,0x777b78).setStrokeStyle(3,0x30312f));
    const wall=c.add(this.add.graphics());wall.fillStyle(0x696d6a,1);for(let y=-45;y<45;y+=17)for(let x=-38;x<40;x+=19){wall.lineStyle(1,0x4b4e4c,.65);wall.strokeRect(x+(y%34===0?0:9),y,18,15)}
    [-48,48].forEach((x,i)=>{c.add(this.add.rectangle(x,10,25,122,0x626663).setStrokeStyle(3,0x2d302e));c.add(this.add.triangle(x,-63,-16,13,16,13,0,-20,i?0x7c3430:0x7c3430).setStrokeStyle(2,0x3b211b));});
    const gate=c.add(this.add.rectangle(0,36,26,43,0x342217).setStrokeStyle(3,0x21140d));c.add(this.add.arc(0,37,26,180,360,false,0x4b321f,1).setStrokeStyle(3,0x21140d));
    c.add(this.add.rectangle(0,-74,3,38,0x3a2618));c.add(this.add.triangle(2,-73,0,0,29,7,0,14,0xe7bd5b));
    [-27,27].forEach(x=>{c.add(this.add.rectangle(x,14,4,15,0x352116));const glow=c.add(this.add.circle(x,0,12,0xf3a43c,.12));const flame=c.add(this.add.triangle(x,2,-4,5,4,5,0,-6,0xff9d2e));this.tweens.add({targets:[glow,flame],alpha:.45,scaleX:.8,scaleY:1.15,duration:260+Math.random()*180,yoyo:true,repeat:-1})});
    c.add(this.add.text(-32,-8,'♜',{fontFamily:'serif',fontSize:22,color:'#d9d2b9'}));
  }
  addAmbientParticles(){
    const g=this.add.graphics().setDepth(0);const rng=new Phaser.Math.RandomDataGenerator([123]);
    for(let i=0;i<18;i++){const x=rng.between(0,800),y=rng.between(0,500),p=this.add.circle(x,y,rng.between(1,2),0xe6d59a,.18).setDepth(2);this.tweens.add({targets:p,y:y-rng.between(12,30),x:x+rng.between(-10,10),alpha:0,duration:rng.between(2500,5000),delay:rng.between(0,2500),repeat:-1,ease:'Sine.easeInOut'})}return g;
  }
  update(time,delta){updateTowers(time);updateEnemies(time,delta);checkWaveComplete()}
}
function showWaveBanner(text){const scene=GameState.scene;const box=scene.add.rectangle(400,70,430,52,0x21150e,.92).setStrokeStyle(1,0xc59a4b,.8).setDepth(30).setAlpha(0).setScale(.8);const t=scene.add.text(400,70,text,{fontFamily:'Cinzel,serif',fontSize:'18px',fontStyle:'bold',color:'#f1d38b',stroke:'#120c08',strokeThickness:4}).setOrigin(.5).setDepth(31).setAlpha(0);scene.tweens.add({targets:[box,t],alpha:1,scale:1,duration:280,ease:'Back.Out',onComplete:()=>scene.tweens.add({targets:[box,t],alpha:0,y:'-=16',delay:850,duration:450,onComplete:()=>{box.destroy();t.destroy()}})})}
