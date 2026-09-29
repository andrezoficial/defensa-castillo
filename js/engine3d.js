// engine3d.js — Motor 3D (Three.js). Conserva el mapa 2D: x→X, y→Z (1 px = 1 unidad).
const host=document.getElementById('gameHost');
const S={running:false,now:0,fx:[],timers:[],shake:0,az:0,zoom:1,last:0,baz:0,dist:900,slots:null,prev:null,sel:null};
GameState.scene=S;
const gc={},mc={},bc={};
const geo=(k,...a)=>gc[k+a]||(gc[k+a]=new THREE[k+'Geometry'](...a));
const mat=c=>mc[c]||(mc[c]=new THREE.MeshLambertMaterial({color:c}));
const bmat=c=>bc[c]||(bc[c]=new THREE.MeshBasicMaterial({color:c}));
const tmat=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,side:THREE.DoubleSide,depthWrite:false});
function part(p,k,a,c,x=0,y=0,z=0,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geo(k,...a),mat(c));m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;p.add(m);return m}
const later=(ms,fn)=>S.timers.push({t:S.now+ms,fn});
const addFx=(ms,fn,end)=>S.fx.push({life:ms,age:0,fn,end});
const easeBack=p=>1+2.7*Math.pow(p-1,3)+1.7*Math.pow(p-1,2);
const flat=m=>{m.rotation.x=-Math.PI/2;return m};
let _s=42;const R=()=>(_s=(_s*1664525+1013904223)%4294967296)/4294967296;

const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fc3d6);scene.fog=new THREE.Fog(0x9fc3d6,750,1600);
const cam=new THREE.PerspectiveCamera(40,1.6,10,5000);
let renderer=null; // se crea en initGame() para poder avisar si no hay WebGL

function distToPath(px,py){let min=Infinity;for(let i=0;i<PATH_POINTS.length-1;i++){const a=PATH_POINTS[i],b=PATH_POINTS[i+1],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;let t=l2?((px-a.x)*dx+(py-a.y)*dy)/l2:0;t=Math.max(0,Math.min(1,t));min=Math.min(min,Math.hypot(px-(a.x+t*dx),py-(a.y+t*dy)))}return min}

/* ---------- Efectos ---------- */
function burst(x,y,z,color,n,spd){for(let i=0;i<n;i++){const m=new THREE.Mesh(geo('Sphere',1.6,6,6),bmat(color));m.position.set(x,y,z);scene.add(m);const a=Math.random()*6.28,v=spd*(.5+Math.random()),vy=spd*(.6+Math.random()),dur=400+Math.random()*250;addFx(dur,p=>{const t=p*dur/1000;m.position.set(x+Math.cos(a)*v*t,y+vy*t-140*t*t,z+Math.sin(a)*v*t);m.scale.setScalar(Math.max(.01,1-p))},()=>scene.remove(m))}}
function ringFx(x,z,color,r,ms,y=2){const m=flat(new THREE.Mesh(geo('Ring',.8,1,32),tmat(color,.7)));m.position.set(x,y,z);scene.add(m);addFx(ms,p=>{m.scale.setScalar(4+r*p);m.material.opacity=.7*(1-p)},()=>{scene.remove(m);m.material.dispose()})}
function toast(text,big){const d=document.createElement('div');d.textContent=text;d.style.cssText=`position:absolute;left:50%;top:${big?'14%':'22%'};transform:translate(-50%,0) scale(.8);opacity:0;z-index:6;pointer-events:none;font:700 ${big?18:12}px Cinzel,serif;color:#f1d38b;background:#21150ee8;border:1px solid #c59a4b;padding:10px 22px;text-shadow:0 2px 3px #120c08;transition:all .3s;white-space:nowrap`;host.appendChild(d);requestAnimationFrame(()=>{d.style.opacity=1;d.style.transform='translate(-50%,0) scale(1)'});setTimeout(()=>{d.style.opacity=0;d.style.transform='translate(-50%,-16px)'},big?1200:1000);setTimeout(()=>d.remove(),1800)}
const showWaveBanner=t=>toast(t,true), showRewardToast=t=>toast(t,false);

/* ---------- Mundo ---------- */
function buildWorld(){
  scene.add(new THREE.HemisphereLight(0xcfe8ff,0x3a4a2a,.8));
  const sun=new THREE.DirectionalLight(0xfff0d0,.85);sun.position.set(220,380,420);sun.target.position.set(400,0,250);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-470,right:470,top:330,bottom:-330,near:10,far:1200});scene.add(sun,sun.target);
  const g=flat(new THREE.Mesh(geo('Plane',800,500),mat(0x3f6b2c)));g.position.set(400,0,250);g.receiveShadow=true;scene.add(g);
  // Plano de fondo enorme: se dibuja primero y sin escribir profundidad; si no, en algunos equipos tapa el terreno.
  const far=flat(new THREE.Mesh(geo('Plane',3200,2600),new THREE.MeshLambertMaterial({color:0x2f5222,depthWrite:false})));far.renderOrder=-1;far.position.set(400,-.6,250);scene.add(far);
  for(let i=0;i<22;i++){const p=flat(new THREE.Mesh(geo('Circle',1,16),mat([0x4a7a35,0x35591f,0x548540][i%3])));p.scale.set(30+R()*50,20+R()*30,1);p.position.set(R()*800,.15,R()*500);scene.add(p)}
  for(let i=0;i<8;i++)part(scene,'Cone',[120+R()*70,120+R()*90,7],0x4b6a4a,i*170-120,45,-230-R()*70).castShadow=false;
  // camino
  const P=PATH_POINTS;
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],L=Math.hypot(b.x-a.x,b.y-a.y),ang=Math.atan2(-(b.y-a.y),b.x-a.x);
    for(const[w,h,c]of[[60,.8,0x5c4a2e],[50,1.2,0x9a7a4c]]){const m=part(scene,'Box',[L+w,h,w],c,(a.x+b.x)/2,h/2,(a.y+b.y)/2,0,ang);m.castShadow=false;m.receiveShadow=true}}
  // decoración
  const spots=[];for(let i=0;i<600&&spots.length<26;i++){const x=22+R()*735,y=22+R()*456;if(distToPath(x,y)<57||(x>700&&y<230)||spots.some(s=>Math.hypot(s.x-x,s.y-y)<32))continue;spots.push({x,y})}
  spots.forEach(s=>{const k=R(),o=new THREE.Group();o.position.set(s.x,0,s.y);
    if(k<.55){part(o,'Cylinder',[3,4,16,6],0x5b3a20,0,8);part(o,'Cone',[14,22,8],0x2f5a2a,0,26);part(o,'Cone',[11,18,8],0x3a6b30,0,38);o.scale.setScalar(.8+R()*.5)}
    else if(k<.78){part(o,'Sphere',[9,8,6],0x3d6330,0,5);part(o,'Sphere',[7,8,6],0x2f5223,8,4)}
    else part(o,'Dodecahedron',[8,0],0x777b76,0,4);
    scene.add(o)});
  buildCastle();
  // casillas, vista previa y selección
  S.slots=new THREE.Group();S.slots.visible=false;scene.add(S.slots);const sm=tmat(0xf1d38b,.55);
  GameState.buildSlots=computeBuildSlots();GameState.buildSlots.forEach(sl=>{const m=flat(new THREE.Mesh(geo('Ring',5,8,20),sm));m.position.set(sl.x,1.6,sl.y);m.userData=sl;S.slots.add(m)});
  const pv=S.prev=new THREE.Group();pv.visible=false;scene.add(pv);
  pv.rng=flat(new THREE.Mesh(geo('Ring',.97,1,64),tmat(0x8fb56b,.75)));pv.fill=flat(new THREE.Mesh(geo('Circle',1,48),tmat(0x8fb56b,.12)));
  pv.col=new THREE.Mesh(geo('Cylinder',14,14,36,20),tmat(0x8fb56b,.35));pv.rng.position.y=pv.fill.position.y=1.8;pv.col.position.y=18;pv.add(pv.rng,pv.fill,pv.col);
  S.sel=flat(new THREE.Mesh(geo('Ring',20,23,32),tmat(0xe7bd5b,.9)));S.sel.visible=false;scene.add(S.sel);
}
function buildCastle(){const c=inst('castle',150,-Math.PI/2);c.position.set(775,0,150);c.traverse(o=>{if(o.isMesh)o.receiveShadow=true});scene.add(c);const tl=new THREE.PointLight(0xffa040,.9,160);tl.position.set(725,25,150);scene.add(tl)}

/* ---------- Modelos ---------- */
const MODELS={};
function loadModels(onProgress){const keys=['archer','wizard','catapult','goblin','raider','ogre','castle'],L=new THREE.GLTFLoader();let n=0;const tick=()=>{n++;if(onProgress)onProgress(n/keys.length)};
  return Promise.all(keys.map(k=>new Promise((ok,no)=>{
    if(MODELS[k]){tick();return ok()}
    const d=window.MODEL_DATA&&MODEL_DATA[k],done=g=>{MODELS[k]=g;tick();ok()};
    if(d){const b=atob(d),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);L.parse(a.buffer,'',done,no)}else L.load('assets/models/'+k+'.glb',done,undefined,no)})))}
function inst(k,size,ry=0){const g=new THREE.Group(),m=MODELS[k].scene.clone();m.scale.setScalar(size);m.rotation.y=ry;m.traverse(o=>{if(o.isMesh)o.castShadow=true});g.add(m);return g}
function towerModel(type){const g=new THREE.Group();let top,fig;
  if(type==='basic'){part(g,'Box',[28,4,28],0x8a877e,0,2);part(g,'Box',[20,34,20],0xb5b1a5,0,21);part(g,'Box',[28,5,28],0xa19d92,0,40.5);
    for(const sx of[-1,1])for(const sz of[-1,1])part(g,'Box',[5,5,5],0xa19d92,sx*11,45.5,sz*11);
    fig=inst('archer',30);fig.position.y=43;g.add(fig);top=60}
  else if(type==='slow'){part(g,'Cylinder',[15,17,4,6],0x8a877e,0,2);part(g,'Cylinder',[10.5,13,34,6],0x6c86ad,0,21);part(g,'Cylinder',[14,14,3,6],0x54698c,0,39.5);
    fig=inst('wizard',34);fig.position.y=41;g.add(fig);top=66}
  else{g.add(inst('catapult',38));top=30}
  return{g,top,fig}}
const EN={goblin:{hb:42,s:1},raider:{hb:34,s:1},ogre:{hb:58,s:1},boss:{hb:96,s:1}};
function enemyModel(key){const g=new THREE.Group(),c={goblin:['goblin',30],raider:['raider',44],ogre:['ogre',46],boss:['ogre',84]}[key];let aura;g.add(inst(c[0],c[1],Math.PI/2));
  if(key==='boss'){aura=flat(new THREE.Mesh(geo('Ring',30,37,32),tmat(0xe7bd5b,.2)));aura.position.y=1.5;g.add(aura)}
  return{g,aura}}
function makeBar(w){const g=new THREE.Group(),bg=new THREE.Mesh(geo('Plane',1,1),bmat(0x1b120e)),fg=new THREE.Mesh(geo('Plane',1,1),new THREE.MeshBasicMaterial({color:0x7fbd59}));bg.scale.set(w+2,5,1);fg.position.z=.1;[bg,fg].forEach(o=>{o.material.depthTest=false;o.renderOrder=10});g.add(bg,fg);return{g,fg}}

/* ---------- Enemigos ---------- */
function makeEnemy(key,x,y,wp,hp,speed,r,reward){const m=enemyModel(key),bw=r*2+8,b=makeBar(bw);m.g.position.set(x,0,y);scene.add(m.g,b.g);
  const e={key,mesh:m.g,aura:m.aura,bar:b.g,fg:b.fg,bw,hp,maxHp:hp,speed,baseSpeed:speed,wpIndex:wp,x,y,radius:r,slowUntil:0,color:ENEMY_TYPES[key].color,reward,isBoss:key==='boss',seed:Math.random()*6.28,ang:0,flash:0,sc:EN[key].s};
  GameState.enemies.push(e);return e}
function spawnEnemy(fast,tank){const hp=Math.round((tank?90+GameState.wave*14:30+GameState.wave*8)*getHpScale(GameState.wave)),speed=fast?90:45,r=tank?16:11,key=tank?'ogre':fast?'raider':'goblin',reward=tank?12:fast?6:5,p=PATH_POINTS[0];return makeEnemy(key,p.x,p.y,0,hp,speed,r,reward)}
function spawnBoss(){const w=GameState.wave,p=PATH_POINTS[0],b=makeEnemy('boss',p.x,p.y,0,Math.round((320+w*45)*getHpScale(w)),28,24,40+w*5);b.summonedReinforcements=false;return b}
function spawnMinionAt(x,y,wp){makeEnemy('goblin',x,y,wp,Math.round((20+GameState.wave*5)*getHpScale(GameState.wave)),45,11,5)}
function damageEnemy(e,dmg){if(e.dead)return;e.hp-=dmg;e.flash=90;
  if(e.isBoss&&!e.summonedReinforcements&&e.hp>0&&e.hp<=e.maxHp*.5){e.summonedReinforcements=true;spawnMinionAt(e.x-22,e.y,e.wpIndex);spawnMinionAt(e.x+22,e.y,e.wpIndex);S.shake=6;sfx.boss();showRewardToast('♛ ¡El jefe llama refuerzos!')}
  if(e.hp<=0){e.dead=true;GameState.gold+=e.reward;updateHUD();sfx.kill(e.isBoss);burst(e.x,10,e.y,e.color,14,45);
    if(e.isBoss){S.shake=12;ringFx(e.x,e.y,0xf4d487,110,650);burst(e.x,20,e.y,0xe7bd5b,26,95)}
    scene.remove(e.bar);const m=e.mesh,s0=e.sc;addFx(240,p=>{m.scale.setScalar(Math.max(.01,s0*(1-p)));m.position.y=p*10},()=>scene.remove(m))}}
function killEnemyOffPath(e){e.dead=true;scene.remove(e.mesh,e.bar)}
function updateEnemies(time,dt){for(const e of GameState.enemies){if(e.dead)continue;
  const spd=(e.slowUntil>time?e.baseSpeed*SLOW_FACTOR:e.baseSpeed)*dt/1000,wp=PATH_POINTS[e.wpIndex+1];
  if(!wp){GameState.lives=Math.max(0,GameState.lives-(e.isBoss?BOSS_LEAK_DAMAGE:1));updateHUD();S.shake=5;sfx.leak();killEnemyOffPath(e);if(GameState.lives<=0)showGameOver(false);continue}
  const dx=wp.x-e.x,dy=wp.y-e.y,d=Math.hypot(dx,dy),mv=d>=4;
  if(!mv)e.wpIndex++;else{e.x+=dx/d*spd;e.y+=dy/d*spd;let df=Math.atan2(-dy,dx)-e.ang;df=Math.atan2(Math.sin(df),Math.cos(df));e.ang+=df*Math.min(1,dt/120)}
  e.flash=Math.max(0,e.flash-dt);
  e.mesh.position.set(e.x,mv?Math.abs(Math.sin(time/110+e.seed))*1.6:0,e.y);e.mesh.rotation.set(0,e.ang,mv?Math.sin(time/130+e.seed)*.03:0);e.mesh.scale.setScalar(e.sc*(1+e.flash/600));
  if(e.aura)e.aura.material.opacity=.2+.08*Math.sin(time/180);
  const r=Math.max(0,e.hp/e.maxHp);e.bar.position.set(e.x,EN[e.key].hb,e.y);e.fg.scale.set(Math.max(.01,r*e.bw),3,1);e.fg.position.x=-(1-r)*e.bw/2;e.fg.material.color.setHex(r<.3?0xd84d50:r<.6?0xe1b64e:0x7fbd59)}
  GameState.enemies=GameState.enemies.filter(e=>!e.dead)}
function startWave(){if(GameState.waveActive||GameState.winPending||!canAct())return;const W=++GameState.wave;GameState.waveActive=true;GameState.spawning=true;const boss=W%BOSS_WAVE_INTERVAL===0;toggleBossTag(boss);if(boss)sfx.boss();else sfx.wave();showWaveBanner(boss?`♛ OLEADA ${W} · TRABUQUETE REAL`:`⚔ OLEADA ${W}`);updateHUD();const n=4+W*2;
  for(let i=1;i<=n;i++)later(500*i,()=>{spawnEnemy(W>1&&Math.random()<.3,W>2&&Math.random()<.25);if(i===n){if(boss)later(900,()=>{spawnBoss();GameState.spawning=false});else GameState.spawning=false}})}
function checkWaveComplete(){if(GameState.waveActive&&!GameState.spawning&&GameState.enemies.length===0){GameState.waveActive=false;const g=25+GameState.wave*3;GameState.gold+=g;toggleBossTag(false);updateHUD();writeBestWave(GameState.wave);sfx.waveDone();showRewardToast(`+${g} oro · Oleada superada`);if(GameState.wave===WIN_WAVE&&!GameState.continued){GameState.winPending=true;later(900,()=>{GameState.winPending=false;showGameOver(true)})}}}

/* ---------- Torres ---------- */
const getEffectiveStats=t=>({...TOWER_DEFS[t.type],...getTowerStats(t.type,t.level)});
const findTowerAt=(x,y)=>GameState.towers.find(t=>Math.hypot(t.x-x,t.y-y)<26)||null;
function computeBuildSlots(){const s=[];for(let gx=20;gx<=GAME_WIDTH-20;gx+=BUILD_GRID_SIZE)for(let gy=20;gy<=GAME_HEIGHT-20;gy+=BUILD_GRID_SIZE){if(distToPath(gx,gy)<MIN_TOWER_DISTANCE_TO_PATH)continue;if(gx>680&&gy<270)continue;s.push({x:gx,y:gy})}return s}
const isCellOccupied=(gx,gy)=>GameState.towers.some(t=>t.x===gx&&t.y===gy);
function nearestSlot(x,y){let best=null,bd=Infinity;for(const s of GameState.buildSlots){const d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;best=s}}return bd<=BUILD_SNAP_MAX_DIST?best:null}
function isValidPlacement(gx,gy,type){const d=TOWER_DEFS[type];return !!d&&GameState.gold>=d.cost&&!isCellOccupied(gx,gy)}
function showBuildGrid(){S.slots.visible=true;S.slots.children.forEach(m=>m.visible=!isCellOccupied(m.userData.x,m.userData.y))}
function hideBuildGrid(){S.slots.visible=false}
function drawPlacementPreview(x,y){if(!GameState.selectedTower)return;GameState.placementX=x;GameState.placementY=y;const d=TOWER_DEFS[GameState.selectedTower],sl=nearestSlot(x,y),ok=sl&&isValidPlacement(sl.x,sl.y,GameState.selectedTower),c=ok?0x8fb56b:0xd34d46,p=sl||{x,y},r=sl?d.range:18,pv=S.prev;
  pv.visible=true;pv.position.set(p.x,0,p.y);[pv.rng,pv.fill,pv.col].forEach(o=>o.material.color.setHex(c));pv.rng.scale.set(r,r,1);pv.fill.scale.set(r,r,1);pv.col.visible=!!sl}
function clearPlacementPreview(){S.prev.visible=false;GameState.placementDragging=false;GameState.placementPointerId=null}
function applyScale(t){t.visual.scale.setScalar((1+.07*(t.level-1))*(t.hl?1.06:1))}
function updateLevelPips(t){if(t.pips)scene.remove(t.pips);const g=new THREE.Group();g.position.set(t.x,3,t.y+18);for(let i=0;i<t.level;i++){const m=new THREE.Mesh(geo('Sphere',2.6,8,8),bmat(0xe7bd5b));m.position.x=(i-(t.level-1)/2)*8;g.add(m)}scene.add(g);t.pips=g}
function selectPlacedTower(t){GameState.selectedTower=null;syncBuildButtons();hideBuildGrid();clearPlacementPreview();
  if(GameState.selectedPlacedTower&&GameState.selectedPlacedTower!==t)highlightTower(GameState.selectedPlacedTower,false);
  GameState.selectedPlacedTower=t;showTowerPanel(t);highlightTower(t,true);sfx.click()}
function deselectPlacedTower(){if(GameState.selectedPlacedTower)highlightTower(GameState.selectedPlacedTower,false);GameState.selectedPlacedTower=null;hideTowerPanel()}
function syncBuildButtons(){document.querySelectorAll('#buildButtons .tower-btn').forEach(b=>b.classList.toggle('selected',b.dataset.tower===GameState.selectedTower))}
function clearSelection(){GameState.selectedTower=null;syncBuildButtons();deselectPlacedTower();clearPlacementPreview();hideBuildGrid()}
function highlightTower(t,on){if(!t)return;t.hl=on;applyScale(t);t.range.visible=on;S.sel.visible=on;if(on)S.sel.position.set(t.x,2,t.y)}
function placeTower(x,y){if(!GameState.selectedTower)return;const type=GameState.selectedTower,d=TOWER_DEFS[type],slot=nearestSlot(x,y);
  if(!slot){sfx.deny();showRewardToast('Elige una casilla libre del mapa');return}
  if(isCellOccupied(slot.x,slot.y)){sfx.deny();showRewardToast('Esa casilla ya está ocupada');return}
  if(GameState.gold<d.cost){sfx.deny();showRewardToast(`Oro insuficiente · faltan ${d.cost-GameState.gold} ✦`);return}
  const {x:tx,y:ty}=slot;GameState.gold-=d.cost;updateHUD();
  const m=towerModel(type);m.g.position.set(tx,0,ty);scene.add(m.g);
  const rg=flat(new THREE.Mesh(geo('Ring',.97,1,64),tmat(0xf1d38b,.6)));rg.position.set(tx,1.8,ty);rg.scale.set(d.range,d.range,1);rg.visible=false;scene.add(rg);
  const t={x:tx,y:ty,type,lastShot:0,visual:m.g,range:rg,level:1,invested:d.cost,top:m.top,fig:m.fig};GameState.towers.push(t);updateLevelPips(t);
  addFx(300,p=>m.g.scale.setScalar(Math.max(.01,easeBack(p))),()=>applyScale(t));ringFx(tx,ty,0xc2a36d,26,350);sfx.place();showBuildGrid()}
function upgradeTower(t){if(t.level>=MAX_TOWER_LEVEL)return;const cost=getUpgradeCost(t.type,t.level);
  if(GameState.gold<cost){sfx.deny();showRewardToast(`Oro insuficiente · faltan ${cost-GameState.gold} ✦`);return}
  GameState.gold-=cost;t.invested+=cost;t.level++;updateHUD();updateLevelPips(t);applyScale(t);const r=getEffectiveStats(t).range;t.range.scale.set(r,r,1);refreshTowerPanel(t);ringFx(t.x,t.y,0xe7bd5b,40,400);burst(t.x,20,t.y,0xe7bd5b,10,40);sfx.upgrade()}
function sellTower(t){GameState.gold+=Math.round(t.invested*SELL_REFUND_RATIO);updateHUD();scene.remove(t.visual,t.range);if(t.pips)scene.remove(t.pips);GameState.towers=GameState.towers.filter(x=>x!==t);deselectPlacedTower();sfx.sell();if(GameState.selectedTower)showBuildGrid()}
function selectTower(type){if(!canAct())return;deselectPlacedTower();clearPlacementPreview();GameState.selectedTower=GameState.selectedTower===type?null:type;syncBuildButtons();sfx.click();if(GameState.selectedTower)showBuildGrid();else hideBuildGrid()}
function shootAt(t,e){sfx.shoot(t.type);const d=getEffectiveStats(t),tx=e.x,ty=e.y,dist=Math.hypot(tx-t.x,ty-t.y),dur=Math.max(100,dist/(d.area?260:520)*1000),h=t.top;
  const proj=new THREE.Mesh(d.area?geo('Sphere',5,10,10):t.type==='slow'?geo('Sphere',3.5,8,8):geo('Box',1.6,1.6,14),d.area?mat(0x3a2a1c):bmat(d.proj));proj.position.set(t.x,h,t.y);scene.add(proj);
  if(t.fig)t.fig.rotation.y=Math.atan2(tx-t.x,ty-t.y);if(d.area){t.visual.rotation.y=Math.atan2(-(ty-t.y),tx-t.x);addFx(280,p=>{t.visual.position.y=3*Math.sin(p*Math.PI)})}else if(t.type==='basic')proj.lookAt(tx,8,ty);else ringFx(t.x,t.y,d.proj,16,220,h);
  addFx(dur,p=>proj.position.set(t.x+(tx-t.x)*p,h+(8-h)*p+(d.area?Math.sin(p*Math.PI)*45:0),t.y+(ty-t.y)*p),()=>{scene.remove(proj);
    if(d.area){GameState.enemies.forEach(en=>{if(!en.dead&&Math.hypot(en.x-tx,en.y-ty)<AREA_BLAST_RADIUS)damageEnemy(en,d.dmg)});ringFx(tx,ty,d.proj,AREA_BLAST_RADIUS,300);S.shake=2.5}
    else if(!e.dead){damageEnemy(e,d.dmg);if(d.slow&&!e.isBoss)e.slowUntil=S.now+SLOW_DURATION_MS}
    burst(tx,8,ty,d.proj,d.area?12:7,d.area?40:22)})}
function updateTowers(time){for(const t of GameState.towers){const st=getEffectiveStats(t);if(time-t.lastShot<st.rate)continue;let target=null,best=Infinity;for(const e of GameState.enemies){if(e.dead)continue;const d=Math.hypot(e.x-t.x,e.y-t.y);if(d<=st.range&&d<best){best=d;target=e}}if(target){t.lastShot=time;shootAt(t,target)}}}

/* ---------- Cámara, entrada y bucle ---------- */
function fit(){if(!renderer)return;const w=host.clientWidth||800,h=host.clientHeight||500;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();const v=cam.aspect<1,t=Math.tan(cam.fov*Math.PI/360);S.baz=v?-Math.PI/2:0;S.dist=(v?Math.max(300/(t*cam.aspect),420/t):Math.max(440/(t*cam.aspect),270/t))*S.zoom;scene.fog.near=S.dist+500;scene.fog.far=S.dist+2600}
function placeCam(){const el=.96,c=Math.cos(el),d=S.dist,j=()=>(Math.random()-.5)*S.shake;const A=S.baz+S.az;cam.position.set(400+Math.sin(A)*c*d+j(),Math.sin(el)*d+j(),255+Math.cos(A)*c*d);cam.lookAt(400,0,255);S.shake=S.shake<.05?0:S.shake*.88}
const ray=new THREE.Raycaster(),gp=new THREE.Plane(new THREE.Vector3(0,1,0),0),v2=new THREE.Vector2(),hit=new THREE.Vector3();
function groundAt(e){const r=host.getBoundingClientRect();v2.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(v2,cam);return ray.ray.intersectPlane(gp,hit)?{x:Math.min(GAME_WIDTH,Math.max(0,hit.x)),y:Math.min(GAME_HEIGHT,Math.max(0,hit.z))}:null}
function rotateCam(dir){S.az=Math.max(-1.2,Math.min(1.2,S.az+dir*.15))}
function zoomCam(f){S.zoom=Math.min(1.2,Math.max(.55,S.zoom*f));fit()}
function bindInput(){
  host.style.touchAction='none';
  const ignore=e=>e.target.closest('#msg,#howToPanel,#camControls');
  const inside=e=>{const r=host.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};
  host.addEventListener('pointerdown',e=>{if(ignore(e)||!canAct())return;
    if(e.pointerType==='mouse'&&e.button===2){clearSelection();return}
    if(e.pointerType==='mouse'&&e.button!==0)return;
    const p=groundAt(e);if(!p)return;
    if(GameState.selectedTower){GameState.placementDragging=true;GameState.placementPointerId=e.pointerId;try{host.setPointerCapture(e.pointerId)}catch(_){}drawPlacementPreview(p.x,p.y);return}
    const t=findTowerAt(p.x,p.y);if(t)selectPlacedTower(t);else deselectPlacedTower()});
  host.addEventListener('pointermove',e=>{if(!GameState.selectedTower||!canAct())return;if(GameState.placementDragging?e.pointerId!==GameState.placementPointerId:e.pointerType!=='mouse')return;const p=groundAt(e);if(p)drawPlacementPreview(p.x,p.y)});
  host.addEventListener('pointerup',e=>{if(!GameState.selectedTower||!GameState.placementDragging||e.pointerId!==GameState.placementPointerId)return;
    // soltar fuera del mapa cancela la colocación
    const p=canAct()&&inside(e)?groundAt(e):null;if(p)placeTower(p.x,p.y);clearPlacementPreview();if(GameState.selectedTower)showBuildGrid()});
  host.addEventListener('pointercancel',e=>{if(e.pointerId===GameState.placementPointerId){clearPlacementPreview();if(GameState.selectedTower)showBuildGrid()}});
  host.addEventListener('contextmenu',e=>e.preventDefault());
  host.addEventListener('wheel',e=>{e.preventDefault();zoomCam(e.deltaY>0?1.06:.94)},{passive:false});
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(k==='q')rotateCam(-1);if(k==='e')rotateCam(1)});
}
function frame(ts){requestAnimationFrame(frame);const raw=Math.min(ts-(S.last||ts),50);S.last=ts;
  if(S.running){const dt=raw*GameState.speedMultiplier;S.now+=dt;
    const tm=S.timers;S.timers=[];for(const x of tm){if(x.t<=S.now)x.fn();else S.timers.push(x)}
    updateTowers(S.now);updateEnemies(S.now,dt);checkWaveComplete();
    const cur=S.fx;S.fx=[];for(const f of cur){f.age+=dt;const p=Math.min(1,f.age/f.life);f.fn(p);if(p>=1){if(f.end)f.end()}else S.fx.push(f)}}
  S.sel.scale.setScalar(1+.1*Math.sin(ts/150));
  placeCam();GameState.enemies.forEach(e=>e.bar.quaternion.copy(cam.quaternion));renderer.render(scene,cam)}
let booting=false,worldReady=false;
async function initGame(){
  if(booting||worldReady)return;booting=true;setLoadState('loading',0);
  let failed=false;
  try{
    if(!renderer){try{renderer=new THREE.WebGLRenderer({antialias:true})}catch(err){const e=new Error('webgl');e.code='webgl';throw e}}
    await loadModels(p=>{if(!failed)setLoadState('loading',p)});
  }catch(err){
    failed=true;console.error(err);booting=false;
    setLoadState('error',0,err&&err.code==='webgl'?'TU NAVEGADOR NO PUEDE MOSTRAR GRÁFICOS 3D (WEBGL).':'NO SE PUDIERON CARGAR LOS MODELOS 3D. Si abriste el archivo directamente, usa un servidor local (ver README).');return}
  const cs=renderer.domElement;cs.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';
  if(getComputedStyle(host).position==='static')host.style.position='relative';host.style.overflow='hidden';
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;host.prepend(cs);
  buildWorld();bindInput();fit();new ResizeObserver(fit).observe(host);updateHUD();requestAnimationFrame(frame);
  worldReady=true;booting=false;setLoadState('ready');
}
