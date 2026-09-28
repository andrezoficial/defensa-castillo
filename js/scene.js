class MainScene extends Phaser.Scene {
  preload(){
    const base='assets/kenney/';
    for(const [key,def] of Object.entries(SPRITES)) this.load.image(key, base+def.file);
  }
  create(){
    GameState.scene=this;
    this.setupTextureFilters();
    this.drawTerrain(); this.drawDecorations(); this.drawPath(); this.drawCastle();
    GameState.buildSlots=computeBuildSlots();
    this.slotGraphics=this.add.graphics().setDepth(7);
    this.previewGraphics=this.add.graphics().setDepth(8);
    this.addAmbientParticles();
    // Controles táctiles y mouse. En móvil la torre se puede ARRastrar:
    // tocar el mapa inicia el fantasma, mover lo desplaza y soltar construye.
    // Usamos worldX/worldY para que funcione con Phaser.Scale.FIT en cualquier pantalla.
    this.input.on('pointerdown',p=>{
      const x=Phaser.Math.Clamp(p.worldX ?? p.x,0,GAME_WIDTH);
      const y=Phaser.Math.Clamp(p.worldY ?? p.y,0,GAME_HEIGHT);
      if(GameState.selectedTower){
        GameState.placementDragging=true;
        GameState.placementPointerId=p.id;
        drawPlacementPreview(x,y);
        return;
      }
      const t=findTowerAt(x,y);
      t?selectPlacedTower(t):deselectPlacedTower();
    });
    this.input.on('pointermove',p=>{
      if(!GameState.selectedTower || !GameState.placementDragging)return;
      if(GameState.placementPointerId!==null && p.id!==GameState.placementPointerId)return;
      const x=Phaser.Math.Clamp(p.worldX ?? p.x,0,GAME_WIDTH);
      const y=Phaser.Math.Clamp(p.worldY ?? p.y,0,GAME_HEIGHT);
      drawPlacementPreview(x,y);
    });
    this.input.on('pointerup',p=>{
      if(!GameState.selectedTower || !GameState.placementDragging)return;
      if(GameState.placementPointerId!==null && p.id!==GameState.placementPointerId)return;
      const x=Phaser.Math.Clamp(p.worldX ?? p.x,0,GAME_WIDTH);
      const y=Phaser.Math.Clamp(p.worldY ?? p.y,0,GAME_HEIGHT);
      const slot=nearestSlot(x,y);
      if(slot && isValidPlacement(slot.x,slot.y,GameState.selectedTower)) placeTower(slot.x,slot.y);
      clearPlacementPreview();
      if(GameState.selectedTower)showBuildGrid();
    });
    this.input.on('pointerout',p=>{
      if(GameState.selectedTower && GameState.placementDragging)drawPlacementPreview(p.worldX ?? p.x,p.worldY ?? p.y);
    });
    updateHUD();
    this.scene.pause();
  }
  drawTerrain(){
    this.add.rectangle(400,250,800,500,0x30491f);
    const g=this.add.graphics(),rng=new Phaser.Math.RandomDataGenerator([42]);
    // parches grandes de pradera (claros y oscuros) para romper la planicie
    for(let i=0;i<26;i++){const x=rng.between(0,800),y=rng.between(0,500);g.fillStyle(rng.pick([0x3d5c2a,0x27401a,0x466a30,0x223716]),rng.realInRange(.16,.3));g.fillEllipse(x,y,rng.between(90,190),rng.between(50,110))}
    for(let i=0;i<340;i++){const x=rng.between(0,800),y=rng.between(0,500);if(distToPath(x,y)<34)continue;
      if(i%3===0){g.lineStyle(1,rng.pick([0x7fa05c,0x5d8443,0x9db874]),.5);g.lineBetween(x,y,x-2,y-5);g.lineBetween(x,y,x+1,y-6);g.lineBetween(x,y,x+3,y-4)}
      else{g.fillStyle(rng.pick([0x3c5a2e,0x29441f,0x517a3a,0x213b1c]),rng.realInRange(.25,.6));g.fillCircle(x,y,rng.between(1,3))}}
    g.fillStyle(0x0f1d0c,.2);g.fillEllipse(120,430,240,100);g.fillEllipse(610,95,280,90);
    // luz cálida desde el castillo
    g.fillStyle(0xf3d48a,.05);g.fillCircle(700,150,190);g.fillStyle(0xf3d48a,.04);g.fillCircle(700,150,120);
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
    const g=this.add.graphics().setDepth(1),P=PATH_POINTS;
    const stroke=(w,c,al)=>{g.lineStyle(w,c,al);g.beginPath();g.moveTo(P[0].x,P[0].y);for(let i=1;i<P.length;i++)g.lineTo(P[i].x,P[i].y);g.strokePath();g.fillStyle(c,al);P.forEach(q=>g.fillCircle(q.x,q.y,w/2))};
    stroke(74,0x1f3315,.55);   // hierba pisada alrededor
    stroke(60,0x2c1d11,1);     // borde oscuro
    stroke(54,0x9a7a4c,1);     // franja de piedra clara
    stroke(48,0x7d5a33,1);     // tierra
    stroke(28,0x94703f,.55);   // centro desgastado
    const rng=new Phaser.Math.RandomDataGenerator([7]);
    for(let i=0;i<260;i++){const x=rng.between(0,800),y=rng.between(0,500),d=distToPath(x,y);if(d>25)continue;g.fillStyle(rng.pick([0xa88a5e,0x6b4b2b,0xb59468,0x5a3f24]),.55);g.fillEllipse(x,y,rng.between(2,6),rng.between(1,3))}
    // piedras del borde
    for(let i=0;i<150;i++){const x=rng.between(0,800),y=rng.between(0,500),d=distToPath(x,y);if(d<24||d>30)continue;g.fillStyle(rng.pick([0x8c8d86,0x74766f,0xa2a39a]),.9);g.fillEllipse(x,y,rng.between(4,7),rng.between(3,5));g.lineStyle(1,0x2c2a25,.5);g.strokeEllipse(x,y,5,3.5)}
    g.lineStyle(2,0x4e351f,.4);for(const off of [-9,9]){g.beginPath();P.forEach((q,i)=>i?g.lineTo(q.x+off,q.y+off):g.moveTo(q.x+off,q.y+off));g.strokePath()}
  }
  drawCastle(){
    const cx=785,cy=150,c=this.add.container(cx,cy).setDepth(5);
    c.add(this.add.ellipse(0,62,140,26,0x000000,.3));c.add(this.add.circle(0,20,70,0xf3a43c,.06));
    const g=this.add.graphics();c.add(g);
    const brick=(x0,y0,w,h,base,line)=>{g.fillStyle(base,1);g.fillRect(x0,y0,w,h);g.lineStyle(1,line,.6);for(let y=y0;y<y0+h;y+=12){g.lineBetween(x0,y,x0+w,y);const off=((y-y0)/12)%2?9:0;for(let x=x0+off;x<x0+w;x+=18)g.lineBetween(x,y,x,Math.min(y+12,y0+h))}g.lineStyle(3,0x2d302e,1);g.strokeRect(x0,y0,w,h)};
    brick(-44,-50,88,108,0x7f837f,0x50534f);g.fillStyle(0x000000,.14);g.fillRect(18,-50,26,108);
    for(let x=-42;x<44;x+=14){g.fillStyle(0x848883,1);g.fillRect(x,-59,9,9);g.lineStyle(2,0x2d302e,1);g.strokeRect(x,-59,9,9)}
    [-50,50].forEach((x,i)=>{
      brick(x-15,-64,30,128,0x6c706c,0x4a4d4a);
      g.fillStyle(0x8c3a34,1);g.fillTriangle(x-20,-64,x+20,-64,x,-104);g.lineStyle(2,0x3b211b,1);g.strokeTriangle(x-20,-64,x+20,-64,x,-104);g.lineStyle(1,0x5a2420,.8);g.lineBetween(x-13,-82,x+13,-82);
      g.fillStyle(0x1a120c,1);g.fillRect(x-2.5,-40,5,16);g.fillStyle(0xf3a43c,.55);g.fillRect(x-1,-38,2,12);
      g.lineStyle(2,0x3a2618,1);g.lineBetween(x,-104,x,-122);
      const f=this.add.triangle(x,-116,0,0,18,6,0,12,i?0xb8353a:0xe7bd5b).setOrigin(0,.5);c.add(f);
      this.tweens.add({targets:f,scaleX:.75,duration:500+i*140,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    });
    // portón con rastrillo
    g.fillStyle(0x21140d,1);g.fillRect(-14,20,28,38);g.beginPath();g.arc(0,20,14,Math.PI,0,false);g.fillPath();
    g.lineStyle(2,0x6b5a45,.9);[-9,-3,3,9].forEach(i=>g.lineBetween(i,14,i,58));[28,40,52].forEach(yy=>g.lineBetween(-14,yy,14,yy));
    g.lineStyle(4,0x4a4d4a,1);g.beginPath();g.arc(0,20,16,Math.PI,0,false);g.strokePath();g.lineBetween(-16,20,-16,58);g.lineBetween(16,20,16,58);
    // estandarte sobre el portón
    g.fillStyle(0x8f2f35,1);g.fillRect(-11,-36,22,30);g.fillTriangle(-11,-6,11,-6,0,4);g.fillStyle(0xe7bd5b,1);g.fillRect(-11,-36,22,2);
    c.add(this.add.text(-8,-32,'♜',{fontFamily:'serif',fontSize:18,color:'#e7bd5b'}));
    [-28,28].forEach(x=>{c.add(this.add.rectangle(x,14,4,15,0x352116));const glow=this.add.circle(x,0,12,0xf3a43c,.14);const flame=this.add.triangle(x,2,-4,5,4,5,0,-6,0xff9d2e);c.add(glow);c.add(flame);this.tweens.add({targets:[glow,flame],alpha:.45,scaleX:.8,scaleY:1.15,duration:260+Math.random()*180,yoyo:true,repeat:-1})});
  }
  addAmbientParticles(){
    const g=this.add.graphics().setDepth(0);const rng=new Phaser.Math.RandomDataGenerator([123]);
    for(let i=0;i<18;i++){const x=rng.between(0,800),y=rng.between(0,500),p=this.add.circle(x,y,rng.between(1,2),0xe6d59a,.18).setDepth(2);this.tweens.add({targets:p,y:y-rng.between(12,30),x:x+rng.between(-10,10),alpha:0,duration:rng.between(2500,5000),delay:rng.between(0,2500),repeat:-1,ease:'Sine.easeInOut'})}return g;
  }
  update(time,delta){updateTowers(time);updateEnemies(time,delta);checkWaveComplete()}
  setupTextureFilters(){
    // Renders 3D suavizados: filtro LINEAR para que escalen bien.
    for(const key of Object.keys(SPRITES)) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
function showWaveBanner(text){const scene=GameState.scene;const box=scene.add.rectangle(400,70,430,52,0x21150e,.92).setStrokeStyle(1,0xc59a4b,.8).setDepth(30).setAlpha(0).setScale(.8);const t=scene.add.text(400,70,text,{fontFamily:'Cinzel,serif',fontSize:'18px',fontStyle:'bold',color:'#f1d38b',stroke:'#120c08',strokeThickness:4}).setOrigin(.5).setDepth(31).setAlpha(0);scene.tweens.add({targets:[box,t],alpha:1,scale:1,duration:280,ease:'Back.Out',onComplete:()=>scene.tweens.add({targets:[box,t],alpha:0,y:'-=16',delay:850,duration:450,onComplete:()=>{box.destroy();t.destroy()}})})}
