// engine3d.js — Motor 3D (Three.js). Conserva el mapa 2D: x→X, y→Z (1 px = 1 unidad).
const host=document.getElementById('gameHost');
const S={running:false,now:0,fx:[],timers:[],shake:0,az:0,zoom:1,u:1,last:0,baz:0,dist:900,centerX:400,centerZ:250,slots:null,prev:null,sel:null,eid:0,slow:0,skPrev:null,fl:null,scorch:[],pops:0,pan:null,pinch:null,touches:new Map(),fitDist:900,lastV:null};
GameState.scene=S;
const gc={},mc={},bc={};
// Dispositivo táctil / pantalla pequeña: sombras y resolución más ligeras.
S.lowPower=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||Math.min(innerWidth,innerHeight)<600;
// En celulares, el ajuste automático para mostrar todo el mapa deja la cámara demasiado lejos.
// Acercamos la cámara un 28% solo en pantallas táctiles pequeñas; PC conserva exactamente su distancia.
S.mobileCam=!!(navigator.maxTouchPoints>0&&Math.min(innerWidth,innerHeight)<=900);
S.mobileCamMul=S.mobileCam?.72:1;
S.prMax=Math.min(window.devicePixelRatio||1,S.lowPower?1.5:2);S.prMin=.6;S.pr=S.prMax;S.acc=0;S.n=0;S.bad=0;S.lastRender=0;
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
const partPool=[];
function burst(x,y,z,color,n,spd){if(S.fx.length>300)n=Math.ceil(n/3);for(let i=0;i<n;i++){const m=partPool.pop()||new THREE.Mesh(geo('Sphere',1.6,6,6),bmat(color));m.material=bmat(color);m.scale.setScalar(1);m.position.set(x,y,z);scene.add(m);const a=Math.random()*6.28,v=spd*(.5+Math.random()),vy=spd*(.6+Math.random()),dur=400+Math.random()*250;addFx(dur,p=>{const t=p*dur/1000;m.position.set(x+Math.cos(a)*v*t,y+vy*t-140*t*t,z+Math.sin(a)*v*t);m.scale.setScalar(Math.max(.01,1-p))},()=>{scene.remove(m);partPool.push(m)})}}
function ringFx(x,z,color,r,ms,y=2){const m=flat(new THREE.Mesh(geo('Ring',.8,1,32),tmat(color,.7)));m.position.set(x,y,z);scene.add(m);addFx(ms,p=>{m.scale.setScalar(4+r*p);m.material.opacity=.7*(1-p)},()=>{scene.remove(m);m.material.dispose()})}
function toast(text,big){const d=document.createElement('div');d.textContent=text;d.style.cssText=`position:absolute;left:50%;top:${big?'14%':'22%'};transform:translate(-50%,0) scale(.8);opacity:0;z-index:6;pointer-events:none;font:700 ${big?18:12}px Cinzel,serif;color:#e8f6ff;background:#0d1620ea;border:1px solid #5fd4ff55;border-radius:12px;backdrop-filter:blur(8px);box-shadow:0 8px 24px #0008;padding:10px 20px;text-shadow:0 1px 2px #000;transition:all .3s;white-space:nowrap`;host.appendChild(d);requestAnimationFrame(()=>{d.style.opacity=1;d.style.transform='translate(-50%,0) scale(1)'});setTimeout(()=>{d.style.opacity=0;d.style.transform='translate(-50%,-16px)'},big?1200:1000);setTimeout(()=>d.remove(),1800)}
const showWaveBanner=t=>toast(t,true), showRewardToast=t=>toast(t,false);

/* ---------- Mundo ---------- */
function hexRgb(h){return {r:(h>>16)&255,g:(h>>8)&255,b:h&255}}
function texturedMat(baseHex, seed, kind='ground'){
  const key=`${baseHex}:${seed}:${kind}`; if(mc[key]) return mc[key];
  const c=document.createElement('canvas'),size=384;c.width=c.height=size;const x=c.getContext('2d'),b=hexRgb(baseHex);
  x.fillStyle=`rgb(${b.r},${b.g},${b.b})`;x.fillRect(0,0,size,size);
  let q=seed|0; const rnd=()=>((q=(Math.imul(q,1664525)+1013904223)|0)>>>0)/4294967296;
  for(let i=0;i<(kind==='road'?2200:3000);i++){
    const px=rnd()*size,py=rnd()*size,rad=kind==='road'?(0.5+rnd()*2.8):(0.4+rnd()*3.4);
    const delta=((rnd()-.5)*18)|0, r=Math.max(0,Math.min(255,b.r+delta)),g=Math.max(0,Math.min(255,b.g+delta)),bl=Math.max(0,Math.min(255,b.b+delta));
    x.fillStyle=`rgba(${r},${g},${bl},${kind==='road'?.20:.16})`;x.beginPath();x.arc(px,py,rad,0,Math.PI*2);x.fill();
  }
  if(kind==='ground'){
    for(let i=0;i<90;i++){
      const px=rnd()*size,py=rnd()*size; x.strokeStyle='rgba(245,235,185,.10)';x.lineWidth=.7;
      x.beginPath();x.moveTo(px,py);x.lineTo(px+2+rnd()*4,py-1+rnd()*2);x.stroke();
    }
  } else {
    for(let i=0;i<120;i++){
      const px=rnd()*size,py=rnd()*size; x.fillStyle='rgba(58,43,27,.16)';x.beginPath();x.arc(px,py,1+rnd()*2.2,0,Math.PI*2);x.fill();
    }
  }
  const tex=new THREE.CanvasTexture(c);tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(kind==='road'?4.6:2.5,kind==='road'?3.2:2.1);tex.anisotropy=Math.min(8,renderer?.capabilities?.getMaxAnisotropy?.()||4);if(THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;
  const m=new THREE.MeshLambertMaterial({color:0xffffff,map:tex});mc[key]=m;return m;
}
function pebbleField(x0,z0,x1,z1,baseHex,count,scale=1,avoid=0){
  const g=new THREE.Group();g.position.set(0,0,0);for(let i=0;i<count;i++){
    const x=x0+R()*(x1-x0),z=z0+R()*(z1-z0);if(avoid&&distToPath(x,z)<avoid)continue;
    const s=scale*(.7+R()*1.3),m=part(g,'Dodecahedron',[3.8*s,0],baseHex,x,1.8*s,z,0,R()*6.2,R()*.25);m.rotation.x=R()*.15;m.rotation.z=R()*.2;
  }scene.add(g);return g;
}
function shrubCluster(x,z,sc=1){const g=new THREE.Group();g.position.set(x,0,z);const trunk=part(g,'Cylinder',[2.3*sc,3.2*sc,10*sc,6],0x583a22,0,5*sc);trunk.castShadow=true;
  for(let i=0;i<4;i++){const a=i*1.57+R()*.3;part(g,'Sphere',[7*sc,7*sc,5.2*sc],i%2?0x315b2c:0x3d6a32,Math.cos(a)*5*sc,8*sc+R()*5*sc,Math.sin(a)*5*sc)}
  scene.add(g);return g;}
function addValleyRiver(){
  if(CURRENT_MAP.id!=='valle')return;
  const pts=[[610,500],[635,470],[652,445],[680,420],[710,402],[742,392],[800,388]];
  const strip=new THREE.Group();
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),ang=Math.atan2(-dz,dx);
    const w=20+R()*6, m=part(strip,'Plane',[L,w],0x2d6f87,(a[0]+b[0])/2,0.42,(a[1]+b[1])/2,0,ang);m.rotation.x=-Math.PI/2;m.castShadow=false;m.receiveShadow=true;
  }
  scene.add(strip);
  if(!NK.ok)for(let i=0;i<26;i++){const t=i/25,x=610+(800-610)*t,z=500+(388-500)*t+Math.sin(t*11)*8;part(scene,'Dodecahedron',[3.5+R()*4,0],i%3?0x6c746d:0x81857b,x,2.0,z,0,R()*6.2,R()*.2)}
  // Puente de madera: el camino sigue siendo plenamente transitable; esto es decoración visual.
  const bridge=new THREE.Group();bridge.position.set(662,0,430);
  for(const sx of [-22,22]){part(bridge,'Box',[10,4,56],0x6a4528,sx,4,0,0,0);part(bridge,'Box',[7,5,56],0x8a5e38,sx*.72,7,0,0,0)}
  for(let i=-3;i<=3;i++){part(bridge,'Box',[58,2,8],i%2?0x77502f:0x8b633f,0,10,i*7,0,0)}
  for(const sz of [-27,27]){part(bridge,'Box',[4,14,4],0x513622,-25,9,sz);part(bridge,'Box',[4,14,4],0x513622,25,9,sz)}
  scene.add(bridge);
}
function addBattlefieldProps(){
  const zones=[
    [20,20,250,180],[250,20,570,170],[20,300,330,490],[350,300,610,485],[690,230,790,360]
  ];
  if(!NK.ok)for(const [x0,z0,x1,z1] of zones){for(let i=0;i<5;i++){const x=x0+R()*(x1-x0),z=z0+R()*(z1-z0);if(distToPath(x,z)<78||((x>700&&z<235)))continue;shrubCluster(x,z,.65+R()*.45)}}
  if(!NK.ok)pebbleField(15,15,785,485,0x74776f,45,1,.0);
  // Montículos bajos para romper la planitud visual; no interfieren con el plano de selección.
  for(let i=0;i<18;i++){const x=30+R()*740,z=30+R()*430;if(distToPath(x,z)<82)continue;const m=part(scene,'Cylinder',[18+R()*16,3+R()*4,12],0x4b6938,x,2,z);m.scale.y=.45;m.castShadow=true;m.receiveShadow=true}

  // Props 3D del pack adjunto: dos catapultas como ambientación defensiva cerca de la entrada.
  // Se mantienen fuera del camino para no interferir con enemigos, selección ni construcción.
  const a=PATH_POINTS[0], b=PATH_POINTS[1], dx=b.x-a.x, dz=b.y-a.y, len=Math.hypot(dx,dz)||1;
  const nx=-dz/len, nz=dx/len, midX=a.x+dx*.58, midZ=a.y+dz*.58;
  for(const side of [-1,1]){
    const g=inst('catapult',30,Math.atan2(dz,dx));
    g.position.set(midX+nx*side*58,0,midZ+nz*side*58);
    g.rotation.y += side<0 ? 0.16 : -0.16;
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
    scene.add(g);
  }
}
/* ---------- Cobertura del suelo (V8.18): hierba, flores y tréboles con instancing ---------- */
// Todo es procedural (sin modelos): ~10 000 matas en 1 sola llamada de dibujo, más flores y tréboles.
// Usa su propio generador aleatorio para no alterar la posición de árboles y props existentes.
function addGroundCover(){
  const low=!!S.lowPower, id=CURRENT_MAP.id, lush=id==='valle'||id==='bosque';
  let gs=9157+id.length*131;const r=()=>(gs=(gs*1664525+1013904223)%4294967296)/4294967296;
  const N={grass:low?(lush?4200:1800):(lush?10500:4500),fringe:low?260:520,flowers:lush?(low?240:720):0,clover:lush?(low?450:1300):0};
  const riverPts=id==='valle'?[[610,500],[635,470],[652,445],[680,420],[710,402],[742,392],[800,388]]:[];
  const blocked=(x,z)=>(x>718&&z<245)||riverPts.some(p=>Math.hypot(p[0]-x,p[1]-z)<27);
  const dum=new THREE.Object3D(),col=new THREE.Color();

  // Geometría con color por vértice (base oscura → punta clara) y normales hacia arriba para integrarse con el suelo.
  const g0=new THREE.Color(CURRENT_MAP.ground);
  const baseC=g0.clone().multiplyScalar(.5),tipC=g0.clone().multiplyScalar(1.5).lerp(new THREE.Color(0xd8e27a),lush?.2:.08);
  const tuft=(()=>{const P=[],C=[],Nn=[];const blades=5;
    for(let k=0;k<blades;k++){const a=k*(Math.PI/blades)*1.9+.3,ca=Math.cos(a),sa=Math.sin(a),w=.55+.18*(k%2),h=3.6+1.3*((k*7)%3)/2,lean=(k%2?.9:-.7);
      const v=[[-w,0,0],[w,0,0],[lean,h,.35]];
      v.forEach((p,i)=>{P.push(p[0]*ca+p[2]*sa,p[1],-p[0]*sa+p[2]*ca);const c=i<2?baseC:tipC;C.push(c.r,c.g,c.b);Nn.push(0,1,0)})}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));return g})();

  // Une geometrías con un color propio cada una (para flores y tréboles).
  const merge=list=>{const P=[],C=[],Nn=[];for(const it of list){const g=it.g.index?it.g.toNonIndexed():it.g;g.computeVertexNormals();
    const p=g.attributes.position.array,n=g.attributes.normal.array;for(let i=0;i<p.length;i++){P.push(p[i]);Nn.push(n[i])}
    for(let i=0;i<p.length/3;i++)C.push(it.c.r,it.c.g,it.c.b)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));return g};
  const make=(geom,count,shadow)=>{const m=new THREE.InstancedMesh(geom,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),count);
    m.frustumCulled=false;m.castShadow=false;m.receiveShadow=!!shadow;m.userData.groundCover=true;return m};
  const put=(m,i,x,y,z,sx,sy,ry,tint)=>{dum.position.set(x,y,z);dum.rotation.set(0,ry,0);dum.scale.set(sx,sy,sx);dum.updateMatrix();m.setMatrixAt(i,dum.matrix);
    if(tint!==undefined){col.setRGB(tint,tint,tint);m.setColorAt(i,col)}};

  // 1) Matas de hierba: más densas cerca del camino y con claros suaves lejos de él.
  const grass=make(tuft,N.grass+N.fringe,!low);let gi=0;
  for(let t=0;t<N.grass*7&&gi<N.grass;t++){const x=6+r()*788,z=6+r()*488;if(blocked(x,z))continue;const d=distToPath(x,z);if(d<34)continue;
    if(r()>.28+.72*Math.exp(-(d-34)/42))continue;const s=.7+r()*1.1;put(grass,gi++,x,.05,z,s,s*(.75+r()*.7),r()*6.28,.82+r()*.3)}
  // Borde del camino: franja de hierba pegada a la calzada.
  const P=PATH_POINTS;
  for(let i=0;i<P.length-1&&gi<N.grass+N.fringe;i++){const a=P[i],b=P[i+1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),nx=-dy/L,nz=dx/L;
    for(const side of [-1,1])for(let u=0;u<L&&gi<N.grass+N.fringe;u+=5+r()*4){const off=33+r()*7,x=a.x+dx*(u/L)+nx*side*off,z=a.y+dy*(u/L)+nz*side*off;
      if(blocked(x,z)||distToPath(x,z)<32)continue;const s=1+r()*.9;put(grass,gi++,x,.05,z,s,s*(.9+r()*.6),r()*6.28,.9+r()*.25)}}
  grass.count=gi;grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;scene.add(grass);

  // 2) Tréboles: discos diminutos pegados al suelo, agrupados en la hierba.
  if(N.clover){const cl=new THREE.Color(lush?0x3f8a3c:0x4a6a3a).multiplyScalar(id==='bosque'?.7:1);
    const parts=[[0,0],[1.5,.4],[-.4,1.5]].map(o=>{const g=new THREE.CircleGeometry(1.25,6);g.rotateX(-Math.PI/2);g.translate(o[0],.12,o[1]);return{g,c:cl}});
    const cm=make(merge(parts),N.clover,false);let ci=0;
    for(let t=0;t<N.clover*8&&ci<N.clover;t++){const x=6+r()*788,z=6+r()*488;if(blocked(x,z))continue;const d=distToPath(x,z);if(d<35)continue;if(r()>.3+.7*Math.exp(-(d-35)/55))continue;
      const s=.8+r()*.9;put(cm,ci++,x,0,z,s,1,r()*6.28,.8+r()*.35)}
    cm.count=ci;cm.instanceMatrix.needsUpdate=true;if(cm.instanceColor)cm.instanceColor.needsUpdate=true;scene.add(cm)}

  // 3) Flores: tres colores por mapa, en ramilletes alrededor de unos cuantos centros.
  if(N.flowers){const heads=id==='bosque'?[0xb79bff,0xdfeaff,0xff9fd0]:[0xf6f2e6,0xffd84a,0xf08fb6];
    const stemC=new THREE.Color(0x3c7a35).multiplyScalar(id==='bosque'?.7:1);
    const centers=[];for(let t=0;t<400&&centers.length<(low?26:46);t++){const x=20+r()*760,z=20+r()*460;if(!blocked(x,z)&&distToPath(x,z)>44)centers.push([x,z])}
    heads.forEach((hc,hi)=>{const stem=new THREE.CylinderGeometry(.14,.18,3,4);stem.translate(0,1.5,0);const head=new THREE.SphereGeometry(.95,6,4);head.scale(1,.7,1);head.translate(0,3.2,0);
      const fm=make(merge([{g:stem,c:stemC},{g:head,c:new THREE.Color(hc)}]),Math.ceil(N.flowers/3)+4,false);let fi=0;
      for(let t=0;t<N.flowers*4&&fi<Math.ceil(N.flowers/3);t++){const c=centers[(r()*centers.length)|0];if(!c)break;const a=r()*6.28,rad=Math.sqrt(r())*22,x=c[0]+Math.cos(a)*rad,z=c[1]+Math.sin(a)*rad;
        if(x<5||x>795||z<5||z>495||blocked(x,z)||distToPath(x,z)<36)continue;const s=.8+r()*.7;put(fm,fi++,x,0,z,s,s*(.8+r()*.5),r()*6.28,.9+r()*.2)}
      fm.count=fi;fm.instanceMatrix.needsUpdate=true;if(fm.instanceColor)fm.instanceColor.needsUpdate=true;scene.add(fm)})}
}
function buildWorld(){
  S.hemi=new THREE.HemisphereLight(0xd9edff,0x344526,.92);scene.add(S.hemi);
  const sun=S.sun=new THREE.DirectionalLight(0xffe8bc,1.05);sun.position.set(180,420,360);sun.target.position.set(410,0,250);sun.castShadow=true;sun.shadow.mapSize.set(S.lowPower?1024:2048,S.lowPower?1024:2048);
  sun.shadow.bias=-0.0007;sun.shadow.normalBias=.55;Object.assign(sun.shadow.camera,{left:-500,right:500,top:340,bottom:-340,near:10,far:1350});scene.add(sun,sun.target);

  const g=new THREE.Mesh(geo('Plane',800,500),texturedMat(CURRENT_MAP.ground,17,'ground'));g.rotation.x=-Math.PI/2;g.position.set(400,0,250);g.receiveShadow=true;scene.add(g);
  const far=flat(new THREE.Mesh(geo('Plane',3200,2600),new THREE.MeshLambertMaterial({color:CURRENT_MAP.far,depthWrite:false})));far.renderOrder=-1;far.position.set(400,-.7,250);scene.add(far);

  // Variación suave del suelo para que deje de parecer una superficie plana.
  for(let i=0;i<30;i++){
    const p=flat(new THREE.Mesh(geo('Circle',1,28),new THREE.MeshLambertMaterial({color:CURRENT_MAP.patches[i%CURRENT_MAP.patches.length],transparent:true,opacity:.11})));
    p.scale.set(32+R()*80,22+R()*48,1);p.position.set(15+R()*770,.08,15+R()*470);scene.add(p);
  }
  for(let i=0;i<8;i++){const m=part(scene,'Cone',[100+R()*65,110+R()*90,7],CURRENT_MAP.far,i*165-90,45,-245-R()*60);m.castShadow=false}

  // Camino: base de suelo compacto + capa de tierra texturizada + grava irregular.
  const P=PATH_POINTS;
  if(NK.ok)nkBuildRoad();else{
  for(let i=0;i<P.length-1;i++){
    const a=P[i],b=P[i+1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),ang=Math.atan2(-dy,dx),nx=-dy/L,nz=dx/L;
    const base=part(scene,'Box',[L+78,1.0,70],CURRENT_MAP.pathCol[0],(a.x+b.x)/2,.5,(a.y+b.y)/2,0,ang);base.castShadow=false;base.receiveShadow=true;
    base.material=texturedMat(CURRENT_MAP.pathCol[0],41+i,'road');
    const road=part(scene,'Box',[L+62,1.0,54],CURRENT_MAP.pathCol[1],(a.x+b.x)/2,1.05,(a.y+b.y)/2,0,ang);road.castShadow=false;road.receiveShadow=true;road.material=texturedMat(CURRENT_MAP.pathCol[1],71+i,'road');
    for(const side of [-1,1]){const edge=part(scene,'Box',[L+48,.65,5.5],CURRENT_MAP.pathCol[0],(a.x+b.x)/2+nx*side*24,(1.45),(a.y+b.y)/2+nz*side*24,0,ang);edge.castShadow=false;edge.receiveShadow=true}
    // Huellas y piedras sobre la calzada: puramente decorativas.
    for(let k=0;k<Math.max(3,Math.floor(L/85));k++){const t=(k+.35+R()*.35)/(Math.max(4,Math.floor(L/85))),px=a.x+(b.x-a.x)*t+nx*(R()-.5)*28,pz=a.y+(b.y-a.y)*t+nz*(R()-.5)*28;const s=.9+R()*1.7;part(scene,'Dodecahedron',[2.1*s,0],0x6c5437,px,1.9,pz,0,R()*6.2,R()*.18)}
  }
  for(let i=1;i<P.length-1;i++){const pt=P[i];const base=new THREE.Mesh(geo('Cylinder',38,32,1),mat(CURRENT_MAP.pathCol[0]));base.position.set(pt.x,.55,pt.y);base.receiveShadow=true;scene.add(base);const road=new THREE.Mesh(geo('Cylinder',29,28,1),texturedMat(CURRENT_MAP.pathCol[1],90+i,'road'));road.position.set(pt.x,1.08,pt.y);road.receiveShadow=true;scene.add(road)}
  }

  // Hitos de entrada y llegada.
  const start=P[0];for(const sx of [-20,20]){part(scene,'Box',[9,38,9],0x593a23,start.x+sx,19,start.y);part(scene,'Cone',[11,13,7],CURRENT_MAP.pathCol[1],start.x+sx,41,start.y)}
  const startRing=flat(new THREE.Mesh(geo('Ring',25,3,28),tmat(0xeac873,.24)));startRing.position.set(start.x,1.5,start.y);scene.add(startRing);
  const goalRing=flat(new THREE.Mesh(geo('Ring',48,4,36),tmat(0xffcf70,.22)));goalRing.position.set(742,1.4,150);scene.add(goalRing);
  if(!NK.ok)for(let i=0;i<6;i++){const s=16+i*11,ang=i*1.047;const stone=part(scene,'Dodecahedron',[3.2,0],0x77766f,742+Math.cos(ang)*s,3,150+Math.sin(ang)*s);stone.receiveShadow=true}

  // Árboles 3D: las posiciones se mantienen fuera de la ruta y se sustituyen por
  // variantes del Stylized Nature MegaKit. La carga es diferida para no bloquear el arranque.
  const treeCap=NK.ok?(S.lowPower?6:10):34;
  const treeSpots=[];for(let i=0;i<1500&&treeSpots.length<treeCap;i++){const x=18+R()*764,y=18+R()*464;if(distToPath(x,y)<(NK.ok?84:70)||(x>700&&y<225)||(NK.ok&&!nkFree(x,y,84,nkHouses()))||treeSpots.some(s=>Math.hypot(s.x-x,s.y-y)<(NK.ok?72:29)))continue;treeSpots.push({x,y,seed:R()})}
  // Con el Stylized Nature MegaKit (js/nature18.js): pocos árboles sueltos en el claro, bosque instanciado en los bordes y rocas/arbustos reales.
  if(NK.ok){nkLoneTrees(treeSpots);nkBuildForest();nkBuildProps(treeSpots)}else queueNatureTrees(treeSpots);
  // Relleno ligero de suelo: conserva arbustos y rocas, sin competir con los nuevos árboles.
  if(!NK.ok)treeSpots.forEach((s,i)=>{
    if(i%2!==0){for(let j=0;j<2;j++)part(scene,'Sphere',[5.5+R()*3,4.2+R()*2.5,4.4],j?0x3f6e36:0x315b2c,s.x+(R()-.5)*14,4+R()*4,s.y+(R()-.5)*12)}
    if(i%4===0){const rock=part(scene,'Dodecahedron',[4.5+R()*4,0],0x73766f,s.x+(R()-.5)*18,3,s.y+(R()-.5)*18);rock.receiveShadow=true}
  });

  if(NK.ok)nkBuildGround();else addGroundCover();
  addBattlefieldProps();
  addValleyRiver();
  mergeStatic();
  buildCastle();
  GameState.buildSlots=computeBuildSlots();const sm=tmat(0xbfeaff,.5),dm=new THREE.Object3D();dm.rotation.x=-Math.PI/2;S.slots=new THREE.InstancedMesh(geo('Ring',3.4,5,24),sm,GameState.buildSlots.length);S.slots.frustumCulled=false;S.slots.visible=false;scene.add(S.slots);
  S.slotOn=GameState.buildSlots.map(sl=>{dm.position.set(sl.x,1.6,sl.y);dm.updateMatrix();return dm.matrix.clone()});S.slotOff=new THREE.Matrix4().makeScale(0,0,0);
  const pv=S.prev=new THREE.Group();pv.visible=false;scene.add(pv);pv.rng=flat(new THREE.Mesh(geo('Ring',.97,1,64),tmat(0x5be3b0,.85)));pv.fill=flat(new THREE.Mesh(geo('Circle',1,48),tmat(0x5be3b0,.12)));pv.col=new THREE.Mesh(geo('Cylinder',7,7,36,20),tmat(0x5be3b0,.3));pv.rng.position.y=pv.fill.position.y=1.8;pv.col.position.y=18;pv.add(pv.rng,pv.fill,pv.col);
  S.sel=flat(new THREE.Mesh(geo('Ring',20,23,32),tmat(0x6fd8ff,.9)));S.sel.visible=false;scene.add(S.sel);initSkills4();Ambience.init();
}
// Une en una sola malla por material todo lo estático (suelo, camino, árboles, rocas…):
// pasa de ~150 llamadas de dibujo (x2 por las sombras) a una decena.
function mergeStatic(){const cached=new Set(Object.values(mc)),groups=new Map(),old=[];scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(!o.isMesh||!cached.has(o.material)||o.material.map||o.renderOrder)return; // los materiales con textura necesitan UV: no se fusionan
  const k=o.material.uuid+(o.castShadow?'c':'')+(o.receiveShadow?'r':'');let g=groups.get(k);if(!g)groups.set(k,g={mat:o.material,cs:o.castShadow,rs:o.receiveShadow,items:[]});g.items.push(o);old.push(o)});
  old.forEach(o=>o.parent.remove(o));
  for(const g of groups.values()){const gs=g.items.map(o=>{const c=o.geometry.clone();c.applyMatrix4(o.matrixWorld);return c});let nv=0,ni=0;
    for(const c of gs){nv+=c.attributes.position.count;ni+=c.index?c.index.count:c.attributes.position.count}
    const P=new Float32Array(nv*3),N=new Float32Array(nv*3),I=new Uint32Array(ni);let vo=0,io=0;
    for(const c of gs){const n=c.attributes.position.count;P.set(c.attributes.position.array,vo*3);N.set(c.attributes.normal.array,vo*3);
      if(c.index){for(let i=0;i<c.index.count;i++)I[io+i]=c.index.array[i]+vo;io+=c.index.count}else{for(let i=0;i<n;i++)I[io+i]=vo+i;io+=n}vo+=n;c.dispose()}
    const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P,3));mg.setAttribute('normal',new THREE.BufferAttribute(N,3));mg.setIndex(new THREE.BufferAttribute(I,1));
    const m=new THREE.Mesh(mg,g.mat);m.castShadow=g.cs;m.receiveShadow=g.rs;scene.add(m)}
  scene.children.filter(o=>o.isGroup&&!o.children.length).forEach(o=>scene.remove(o))}
function buildCastle(){const c=inst('castle',150,-Math.PI/2);c.position.set(775,0,150);c.traverse(o=>{if(o.isMesh)o.receiveShadow=true});scene.add(c);const tl=new THREE.PointLight(0xffa040,.9,160);tl.position.set(725,25,150);scene.add(tl)}

/* ---------- Modelos ---------- */
const MODELS={};window.MODELS=MODELS; // v69.js lee los clips desde window.MODELS (un const global no cuelga de window)

const MAPKIT_MODELS={}; let MAPKIT_READY=Promise.resolve();
/* Decoración 3D del mapa: carga diferida y limitada para no penalizar el arranque. */
function loadMapKitKey(k,L){return new Promise((ok)=>{
  if(MAPKIT_MODELS[k]) return ok(MAPKIT_MODELS[k]);
  L.load('assets/map-kit/'+k+'.gltf',g=>{MAPKIT_MODELS[k]=g;ok(g)},undefined,e=>{console.warn('MapKit asset omitido:',k,e);ok(null)});
})}
function mapProp(k,scale=1,ry=0){
  const src=MAPKIT_MODELS[k]; if(!src) return null;
  const g=src.scene.clone(true); g.scale.setScalar(scale); g.rotation.y=ry;
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=true}});
  return g;
}

/* ---------- Árboles 3D del Stylized Nature MegaKit ---------- */
const NATURE_TREE_MODELS={};
let NATURE_TREES_READY=Promise.resolve();
const NATURE_TREE_KEYS=['CommonTree_1','CommonTree_2','CommonTree_3','Pine_1','Pine_2'];

function loadNatureTreeKey(k,L){
  return new Promise((ok)=>{
    if(NATURE_TREE_MODELS[k]) return ok(NATURE_TREE_MODELS[k]);
    L.load('assets/nature-trees/'+k+'.gltf',g=>{
      NATURE_TREE_MODELS[k]=g;
      ok(g);
    },undefined,e=>{
      console.warn('Nature tree omitido:',k,e);
      ok(null);
    });
  });
}
function addNatureTreeInstance(src,x,z,scale,rot,shadow){
  if(!src) return;
  const g=src.scene.clone(true);
  g.position.set(x,Math.max(.16,.24*scale),z);
  g.rotation.y=rot;
  g.scale.setScalar(scale);
  g.traverse(o=>{
    if(!o.isMesh) return;
    o.castShadow=shadow;
    o.receiveShadow=true;
    o.frustumCulled=true;
    // Material simple y claro: los PBR del kit salían casi negros con esta iluminación.
    const fix=m=>{
      if(!m||!m.map) return m;
      if(m.userData&&m.userData.treeFix) return m;
      if(THREE.sRGBEncoding) m.map.encoding=THREE.sRGBEncoding;
      m.map.anisotropy=Math.min(4,m.map.anisotropy||4);
      const leaf=/leaf|leaves/i.test(m.name||'');
      const pine=/pine/i.test(m.name||'');const n=new THREE.MeshLambertMaterial({map:m.map,side:THREE.DoubleSide,alphaTest:leaf?.1:.2,color:leaf?(pine?0xb8f08a:0xe6ffb8):0xffffff,emissive:leaf?(pine?0x2a5a1c:0x2f5f1c):0x1a0f08});
      n.userData={treeFix:true};n.name=m.name;return n;
    };
    o.material=Array.isArray(o.material)?o.material.map(fix):fix(o.material);
  });
  scene.add(g);(window.V8Trees=window.V8Trees||[]).push({g,ph:x*.013+z*.021,pine:/pine/i.test(src.scene.name||'')||scale>6.1});
}
function queueNatureTrees(spots){
  const L=new THREE.GLTFLoader();
  NATURE_TREES_READY=Promise.all(NATURE_TREE_KEYS.map(k=>loadNatureTreeKey(k,L))).then(models=>{
    const usable=models.filter(Boolean);
    if(!usable.length) return;
    spots.forEach((s,i)=>{
      const r=s.seed;
      const pine=r>.72;
      const variant=pine ? usable[3+(i%Math.min(2,Math.max(1,usable.length-3)))] : usable[i%Math.min(3,usable.length)];
      const treeScale=(pine?6.1:5.7)+r*(pine?1.35:1.55);
      const rot=(r*6.28318530718);
      // Solo una fracción proyecta sombras: la escena conserva profundidad sin multiplicar el coste del shadow map.
      const shadow=!S.lowPower && (i%3===0);
      addNatureTreeInstance(variant,s.x,s.y,treeScale,rot,shadow);
    });
  }).catch(e=>console.warn('Nature trees no disponibles:',e));
}
function addMapHouse(x,z,rot=0,scale=13.5){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rot;
  // Una casa modular compacta: tres muros + fachada con puerta + tejado.
  const parts=[
    ['Wall_Plaster_Straight',scale,0,scale*1.02,0],
    ['Wall_Plaster_Straight',scale,Math.PI,0,scale*1.02],
    ['Wall_Plaster_Straight',scale,Math.PI/2,-scale*1.02,0],
    ['Wall_Plaster_Door_Round',scale,Math.PI/2,scale*1.02,0],
  ];
  parts.forEach(([k,s,ry,px,pz])=>{const p=mapProp(k,s,ry);if(p){p.position.set(px,0,pz);g.add(p)}});
  const roof=mapProp('Roof_RoundTiles_6x6',scale*.55,0); if(roof){roof.position.y=scale*3.15;g.add(roof)}
  // Un pequeño zócalo para que la casa no parezca pegada al terreno.
  const base=part(g,'Box',[scale*2.35,.9,scale*2.35],0x6a5a45,0,1.0,0);base.castShadow=false;base.receiveShadow=true;
  scene.add(g); return g;
}
function addMapKitScenery(){
  const id=CURRENT_MAP.id;
  const candidateMap={
    // Puntos alejados de la ruta; en mapas muy cerrados priorizamos decoración pequeña.
    valle:[[740,360,-Math.PI*.12],[740,460,Math.PI*.38],[740,260,Math.PI*.08]],
    paso:[[380,40,Math.PI*.15],[740,260,-Math.PI*.22],[720,460,Math.PI*.32]],
    bosque:[[340,40,-Math.PI*.35],[560,320,Math.PI*.6],[40,440,-Math.PI*.08]],
    fortaleza:[[40,40,Math.PI*.12],[340,40,Math.PI*.55],[40,240,-Math.PI*.22]]
  };
  const candidates=candidateMap[id]||candidateMap.valle;
  const safe=[];
  for(const c of candidates){
    if(distToPath(c[0],c[1])>70 && !(c[0]>700 && c[1]<230)) safe.push(c);
  }
  // Dos casas como máximo; el resto del pack se usa como ambientación ligera.
  safe.slice(0,2).forEach((c,i)=>addMapHouse(c[0],c[1],c[2], i?13:13.5));
  safe.slice(0,2).forEach((c,i)=>{
    const [x,z,rot]=c, side=i?1:-1;
    const wagon=mapProp('Prop_Wagon',8.5,rot); if(wagon){wagon.position.set(x+side*46,0,z+35);scene.add(wagon)}
    const crate1=mapProp('Prop_Crate',8.2,rot*.2); if(crate1){crate1.position.set(x-side*34,0,z-30);scene.add(crate1)}
    const crate2=mapProp('Prop_Crate',7.2,-rot*.35); if(crate2){crate2.position.set(x-side*28,0,z-22);scene.add(crate2)}
    for(let j=0;j<3;j++){
      const fr=mapProp(j===2?'Prop_WoodenFence_Extension1':'Prop_WoodenFence_Single',10.5,rot);
      if(fr){fr.position.set(x+side*(45+j*19),0,z-side*24);scene.add(fr)}
    }
    // Una enredadera por fachada: aporta detalle sin multiplicar geometría.
    const vine=mapProp('Prop_Vine1',10.5,rot+Math.PI/2); if(vine){vine.position.set(x-side*13,28,z+side*18);scene.add(vine)}
  });
}
function loadMapKit(){
  const keys=['Prop_Wagon','Prop_Crate','Prop_WoodenFence_Single','Prop_WoodenFence_Extension1','Prop_Vine1','Wall_Plaster_Straight','Wall_Plaster_Door_Round','Roof_RoundTiles_6x6'];
  const L=new THREE.GLTFLoader();
  MAPKIT_READY=Promise.all(keys.map(k=>loadMapKitKey(k,L))).then(()=>{addMapKitScenery();return MAPKIT_MODELS}).catch(e=>{console.warn('MapKit no disponible:',e);return MAPKIT_MODELS});
  return MAPKIT_READY;
}
let BOSS_MODELS_READY=Promise.resolve();
// V8.14: orc.glb trae colores por vértice muy oscuros (verde ~0.05-0.15 en lineal) y la escena renderiza sin corrección gamma,
// así que el Ogro Bruto y la Balista Veloz se veían casi negros. Se aclaran una sola vez al cargar (c^exp, exp<1): conserva el matiz y sube el brillo.
function liftVertexColors(root,exp){const seen=new Set();root.traverse(o=>{if(!o.isMesh||!o.geometry)return;const a=o.geometry.attributes.color;if(!a||seen.has(a))return;seen.add(a);
  for(let i=0;i<a.count;i++)a.setXYZ(i,Math.pow(a.getX(i),exp),Math.pow(a.getY(i),exp),Math.pow(a.getZ(i),exp));
  if(a.data)a.data.needsUpdate=true;else a.needsUpdate=true})}
// V8.14: las texturas de enemy_soldier (brillo medio ≈0,1) y solani se decodificaban como sRGB y se mostraban sin gamma → casi negras.
// Se redibujan una vez en un canvas con una curva c^exp y se usan como textura lineal (sin decodificar sRGB), como el resto de colores de la escena.
function liftTextures(root,exp){const lut=new Uint8ClampedArray(256);for(let i=0;i<256;i++)lut[i]=Math.round(255*Math.pow(i/255,exp));const cache=new Map();
  root.traverse(o=>{if(!o.isMesh||!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(mt=>{const t=mt.map;if(!t||!t.image)return;
    let nt=cache.get(t);if(!nt){try{const im=t.image,w=im.width||im.naturalWidth,h=im.height||im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0,w,h);
      const d=x.getImageData(0,0,w,h),a=d.data;for(let i=0;i<a.length;i+=4){a[i]=lut[a[i]];a[i+1]=lut[a[i+1]];a[i+2]=lut[a[i+2]]}x.putImageData(d,0,0);
      nt=new THREE.CanvasTexture(c);nt.flipY=t.flipY;nt.wrapS=t.wrapS;nt.wrapT=t.wrapT;nt.anisotropy=t.anisotropy||4;nt.needsUpdate=true}catch(err){nt=t}cache.set(t,nt)}
    mt.map=nt;mt.needsUpdate=true})})}
// V8.16: el clip de Mixamo del soldado trae root motion: la cadera avanza ~1,8 u por ciclo y vuelve de golpe al inicio, así que al
// reproducirlo el modelo se salía del camino y desaparecía. Se deja la cadera quieta en el eje de avance (índice 1) y se conserva el balanceo.
function stripRootMotion(root,clips){if(!clips)return;clips.forEach(cl=>cl.tracks.forEach(t=>{
  if(!/hips.*\.position$/i.test(t.name)||t.values.length<6)return;const v=t.values,y0=v[1];for(let i=1;i<v.length;i+=3)v[i]=y0}))}
function loadModelKey(k,L){return new Promise((ok,no)=>{
  if(MODELS[k]) return ok();
  const d=window.MODEL_DATA&&MODEL_DATA[k],done=g=>{if(k==='orc')liftVertexColors(g.scene,.4);else if(k==='darkknight')liftVertexColors(g.scene,.55);else if(k==='enemy_soldier'){liftTextures(g.scene,.6);stripRootMotion(g.scene,g.animations)}else if(k==='solani')liftTextures(g.scene,.8);MODELS[k]=g;if(k==='wyvern')MODELS.wyvernboss=g;if(k==='orc')MODELS.orcrun=g;ok()},fail=e=>no(e);
  if(d){const b=atob(d),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);L.parse(a.buffer,'',done,fail)}else L.load('assets/models/'+k+'.glb',done,undefined,fail);
})}
function loadModels(onProgress){
  // Carga inicial ligera: no se descargan los jefes de 8-12 MB hasta que hacen falta.
  const core=['archer','wizard','catapult','goblin','raider','ogre','castle','enemy_soldier','orc'],boss=['wyvern','solani','darkknight'];
  const L=new THREE.GLTFLoader();let n=0;const tick=()=>{n++;if(onProgress)onProgress(n/core.length)};
  return Promise.all(core.map(k=>loadModelKey(k,L).then(tick))).then(()=>{
    // Preparación en segundo plano; el jugador puede empezar sin esperar los assets pesados.
    BOSS_MODELS_READY=Promise.all(boss.map(k=>loadModelKey(k,L))).catch(()=>{});
    window.BOSS_MODELS_READY=BOSS_MODELS_READY;
  });
}
// Clonar un modelo con esqueleto: Object3D.clone() comparte el esqueleto del original, así que cada copia
// necesita su propio Skeleton enlazado a sus huesos clonados (si no, todas las copias se animarían a la vez / no se verían).
function cloneModel(src){const clone=src.clone(true),a=[],b=[],sl=[],cl=[],s2c=new Map();
  // el clon recorre los nodos en el mismo orden que el original: se enlaza hueso a hueso por posición (los nombres pueden repetirse, p. ej. _rootJoint en el zombi)
  src.traverse(o=>{sl.push(o);if(o.isSkinnedMesh)a.push(o)});clone.traverse(o=>{cl.push(o);if(o.isSkinnedMesh)b.push(o)});sl.forEach((o,i)=>s2c.set(o,cl[i]));
  b.forEach((cm,i)=>{const sm=a[i];cm.bind(new THREE.Skeleton(sm.skeleton.bones.map(x=>s2c.get(x)),sm.skeleton.boneInverses),sm.bindMatrix);cm.frustumCulled=false});
  return clone}
// Ajuste de pivote por modelo [x,y,z] (unidades del modelo, antes de escalar): apoya los pies en y=0 y centra el cuerpo.
// El wyvern mide ~7 u de largo (cola incluida), tiene los pies en y≈-1.24 y su centro en z≈-1.45; mira hacia +z.
const MODEL_FIX={wyvern:[0,1.24,1.45],wyvernboss:[0,.93,1.3],orc:[0,.14,0],orcrun:[0,.14,0],darkknight:[0,.05,0]}; // orc: sube el modelo para que los pies pisen el suelo durante el ciclo de caminar
// zombie.glb es una multitud de 10 zombis (5 mujeres A-E, 5 hombres A-E) separados en el suelo + una línea de suelo.
// Se deja solo una variante por instancia y se centra en el origen. Centros (x,z) medidos con la pose de reposo.
const ZOMBIE_VARIANTS=[['rig_CharRoot',2.2,-0.97],['rig_CharRoot001',.24,2.44],['rig_CharRoot002',.05,.03],['rig_CharRoot003',-1.39,0],
  ['rig_CharRoot004',1.4,.08],['rig_CharRoot005',-2.2,-1.08],['rig_CharRoot006',-.5,-1.05],['rig_CharRoot007',.78,-.92],['rig_CharRoot008',-.78,1.12],['rig_CharRoot009',.95,1]];
function pickZombie(m,idx){const keep=ZOMBIE_VARIANTS[idx][0],rm=[];
  m.traverse(o=>{if(o.name==='Line001_peopleColors_0'||(/^rig_CharRoot\d*$/.test(o.name)&&o.name!==keep))rm.push(o)});
  rm.forEach(o=>o.parent&&o.parent.remove(o));return ZOMBIE_VARIANTS[idx]}
function inst(k,size,ry=0,own=false,zv=null){const g=new THREE.Group(),src=MODELS[k];if(!src||!src.scene){console.warn('Modelo 3D no disponible:',k);return g}const m=cloneModel(src.scene),mats=[];m.scale.setScalar(size);m.rotation.y=ry;
  let fx=MODEL_FIX[k];
  if(k==='zombie'){const vi=zv!=null?zv:Math.floor(Math.random()*10),v=pickZombie(m,vi);fx=[-v[1],0,-v[2]];g.userData.zv=vi}
  if(fx){const c=Math.cos(ry),s=Math.sin(ry);m.position.set((fx[0]*c+fx[2]*s)*size,fx[1]*size,(-fx[0]*s+fx[2]*c)*size)}m.traverse(o=>{if(o.isMesh){o.castShadow=true;if(own&&o.material){o.material=o.material.clone();mats.push(o.material)}}});g.add(m);g.userData.mats=mats;if(k==='enemy_soldier'&&src.animations&&src.animations.length){const mixer=new THREE.AnimationMixer(m);g.userData.animMixer=mixer;const clip=src.animations.find(a=>/walk|run/i.test(a.name))||src.animations[0];const action=mixer.clipAction(clip);action.reset();action.play();g.userData.animAction=action;}if(window.V69Animations&&k!=='enemy_soldier')window.V69Animations.attach(g,k);return g}
function towerModel(type){const g=new THREE.Group();let top,fig;
  // V7: sin torres, solo el personaje sobre el suelo con una sombra suave
  const sh=flat(new THREE.Mesh(geo('Circle',1,24),tmat(0x000000,.28)));sh.position.y=1.4;sh.scale.setScalar(type==='area'?27:16);g.add(sh);
  if(type==='basic'){
    // Archer: mayor contraste con el terreno + base de identidad visual.
    fig=inst('archer',34,0,true);
    const navy=new THREE.Color(0x17324d);
    const silver=new THREE.Color(0xd8e7f2);
    (fig.userData.mats||[]).forEach((mm,i)=>{
      if(!mm.color)return;
      // Oscurece y enfría la silueta sin convertir piel/telas en un bloque plano.
      const c=mm.color.clone();
      const luma=(c.r+c.g+c.b)/3;
      mm.color.lerp(navy,luma>.62?.72:.5);
      if(mm.emissive)mm.emissive.lerp(navy,.18);
    });
    const base=flat(new THREE.Mesh(geo('Cylinder',13.5,16,4),new THREE.MeshLambertMaterial({color:0x102235})));
    base.position.y=2.4;
    base.castShadow=false;base.receiveShadow=true;
    const rim=flat(new THREE.Mesh(geo('Ring',13.5,15.5,40),tmat(0x35b8ff,.95)));
    rim.position.y=4.55;
    const core=flat(new THREE.Mesh(geo('Circle',7.8,32),tmat(0xf3c85b,.9)));
    core.position.y=4.58;
    const badge=new THREE.Mesh(geo('Cylinder',4.2,5,6),new THREE.MeshLambertMaterial({color:silver}));
    badge.position.set(0,8.3,0);
    badge.rotation.x=Math.PI/2;
    badge.castShadow=false;
    g.add(base,core,rim,badge,fig);
    top=58;
  }
  else if(type==='slow'){fig=inst('wizard',34);g.add(fig);top=62}
  else{g.add(inst('catapult',50));top=40}
  return{g,top,fig}}
const EN={goblin:{hb:34,s:1},raider:{hb:34,s:1},ogre:{hb:58,s:1},brute:{hb:62,s:1},swarm:{hb:26,s:1},saboteur:{hb:36,s:1},healer:{hb:46,s:1},wraith:{hb:50,s:1},boss:{hb:96,s:1}};
// modelo, tamaño, color de tinte, intensidad del tinte, opacidad
const MODEL_CFG={goblin:['enemy_soldier',38],brute:['orc',40],raider:['orcrun',32,0xd4af37,.4],ogre:['enemy_soldier',38],swarm:['enemy_soldier',25,0xe0b341,.45],saboteur:['enemy_soldier',44,0x4a4a66,.55],healer:['wizard',18,0x55d98a,.5],wraith:['enemy_soldier',48,0x8fd3ff,.7,.55]};
function enemyModel(key,bd){const g=new THREE.Group();let c=MODEL_CFG[key],aura,icon,sc=1;
  if(key==='boss'){
    const mk=bd.model&&MODELS[bd.model[0]]?bd.model[0]:'solani';
    const have=MODELS[mk];
    c=have?(bd.model?[mk,bd.model[1],bd.tint,.55]:['solani',13.3,bd.tint,.55]):['ogre',46,bd.tint,.55];
    sc=bd.size/84;
  }
  const m=inst(c[0],c[1],Math.PI/2,true,key==='brute'?5+Math.floor(Math.random()*5):null),mats=m.userData.mats;
  if(c[2]!=null){const tc=new THREE.Color(c[2]);mats.forEach(mm=>mm.color.lerp(tc,c[3]))}
  if(c[4]!=null)mats.forEach(mm=>{mm.transparent=true;mm.opacity=c[4];mm.depthWrite=false});
  g.add(m);g.userData.v69=m.userData.v69; // el motor llama a V69Animations.trigger/state con e.mesh (grupo externo)
  if(m.userData.animMixer){g.userData.animMixer=m.userData.animMixer;g.userData.animAction=m.userData.animAction} // V8.16: el soldado anima con su propio mezclador; el bucle de enemigos lo lee de e.mesh (grupo externo), no del interno
  if(key==='boss'){aura=flat(new THREE.Mesh(geo('Ring',30,37,32),tmat(0xe7bd5b,.2)));aura.scale.setScalar(sc);aura.position.y=1.5;g.add(aura)}
  else if(key==='healer'){aura=flat(new THREE.Mesh(geo('Ring',HEAL_RADIUS-4,HEAL_RADIUS,48),tmat(0x55ff99,.2)));aura.position.y=1.5;g.add(aura);
    icon=new THREE.Group();icon.position.y=EN.healer.hb-6;icon.add(new THREE.Mesh(geo('Box',9,3,3),bmat(0x66ff99)),new THREE.Mesh(geo('Box',3,9,3),bmat(0x66ff99)));g.add(icon)}
  else if(key==='saboteur'){icon=new THREE.Mesh(geo('Sphere',3.2,8,8),bmat(0xff5040));icon.position.y=EN.saboteur.hb-8;g.add(icon)}
  return{g,aura,icon,mats}}
function makeBar(w){const g=new THREE.Group(),bg=new THREE.Mesh(geo('Plane',1,1),bmat(0x1b120e)),fg=new THREE.Mesh(geo('Plane',1,1),new THREE.MeshBasicMaterial({color:0x7fbd59}));bg.scale.set(w+2,5,1);fg.position.z=.1;[bg,fg].forEach(o=>{o.material.depthTest=false;o.renderOrder=10});g.add(bg,fg);return{g,fg}}

/* ---------- Enemigos ---------- */
function makeEnemy(key,x,y,wp,hp,speed,r,reward,bd){const m=enemyModel(key,bd),bw=r*2+8,b=makeBar(bw);m.g.position.set(x,0,y);scene.add(m.g,b.g);
  const e={id:++S.eid,key,name:ENEMY_TYPES[key].name,mesh:m.g,aura:m.aura,icon:m.icon,mats:m.mats,bar:b.g,fg:b.fg,bw,hp,maxHp:hp,speed,baseSpeed:speed,wpIndex:wp,x,y,radius:r,slowUntil:0,slowF:0,freezeUntil:0,burnUntil:0,burnDps:0,burnT:0,color:ENEMY_TYPES[key].color,reward,isBoss:key==='boss',seed:Math.random()*6.28,ang:0,flash:0,sc:EN[key].s,travel:0,vx:0,vy:0,hb:EN[key].hb,bd:bd||null,phaseIdx:0,phaseLock:0,shield:0,maxShield:0,pulseT:0,sabT:2500};
  if(bd){e.name=bd.name;e.hb=bd.hb||bd.size+12}
  GameState.enemies.push(e);return e}
function spawnTypeAt(key,x,y,wp,travel=0){const st=ENEMY_STATS[key],w=GameState.wave,e=makeEnemy(key,x,y,wp,Math.round(st.hp(w)*getHpScale(w)),st.speed,st.r,st.reward);e.travel=travel;return e}
function spawnEnemy(key){const p=PATH_POINTS[0];return spawnTypeAt(key,p.x,p.y,0)}
function spawnBoss(){const w=GameState.wave,p=PATH_POINTS[0],bd=getBossDef(w),hp=Math.round((320+w*45)*bd.hpMul*getHpScale(w));return makeEnemy('boss',p.x,p.y,0,hp,bd.speed,24+(bd.size-84)/4,40+w*5,bd)}
function spawnMinionAt(x,y,wp,travel=0){const m=makeEnemy('goblin',x,y,wp,Math.round((20+GameState.wave*5)*getHpScale(GameState.wave)),45,11,5);m.travel=travel;return m}
function goldPop(x,z,amount){const v=new THREE.Vector3(x,24,z).project(cam),d=document.createElement('div');d.className='gold-pop';d.textContent='+'+amount+' ✦';d.style.left=((v.x*.5+.5)*host.clientWidth)+'px';d.style.top=((-v.y*.5+.5)*host.clientHeight)+'px';host.appendChild(d);d.addEventListener('animationend',()=>d.remove())}
function damageEnemy(e,dmg,dtype,o){o=o||{};if(e.dead)return;
  // Invulnerable durante el cambio de fase del jefe
  if(e.phaseLock>S.now){if(!o.tick)spark(e.x,e.hb*.5,e.y,0xffffff,200,1.4);return}
  dmg*=1-((RESIST[e.key]||{})[dtype]||0);if(o.crit)dmg*=CRIT_MULT;
  const shown=dmg;let soak=false;GameState.totalDamage+=Math.max(0,dmg);
  if(e.shield>0){const ab=Math.min(e.shield,dmg);e.shield-=ab;dmg-=ab;soak=true;if(e.shield<=0)breakShield(e);else shieldHitFx(e)}
  e.hp-=dmg;if(!o.tick){e.flash=90;if(window.V69Animations)V69Animations.trigger(e.mesh,'hit');}
  damageNumber(e,shown,{crit:o.crit,tick:o.tick,soak:soak&&dmg<=0,force:e.hp<=0});
  if(!o.tick&&window.V8Visual)V8Visual.hit(e,dtype,o.crit);
  if(o.crit){sfx.crit();burst(e.x,22,e.y,0xffe27a,6,55)}
  if(e.hp<=0){e.dead=true;if(window.V69Animations)V69Animations.trigger(e.mesh,'death');const bounty=Math.round(e.reward*Progress.goldMul());GameState.gold+=bounty;GameState.goldEarned+=bounty;GameState.kills++;Progress.onKill(e);goldPop(e.x,e.y,bounty);updateHUD();sfx.kill(e.isBoss);deathFx(e);
    dropBar(e);const m=e.mesh,s0=e.sc*S.u;addFx(240,p=>{m.scale.setScalar(Math.max(.01,s0*(1-p)));m.position.y=p*10},()=>{scene.remove(m);freeEnemy(e)});return}
  const ph=e.bd&&e.bd.phases[e.phaseIdx];if(ph&&e.hp<=e.maxHp*ph.at){if(window.V69Animations)V69Animations.trigger(e.mesh,'phase');startBossPhase(e,ph)}}
function dropBar(e){scene.remove(e.bar);e.fg.material.dispose()}
function freeEnemy(e){e.mats.forEach(m=>m.dispose())}
function killEnemyOffPath(e){e.dead=true;scene.remove(e.mesh);dropBar(e);freeEnemy(e)}
function healerTick(e,dt){e.pulseT-=dt;const k=dt/1000*HEAL_RATE;let any=false;
  for(const o of GameState.enemies){if(o===e||o.dead||o.hp>=o.maxHp)continue;if(Math.hypot(o.x-e.x,o.y-e.y)<HEAL_RADIUS){o.hp=Math.min(o.maxHp,o.hp+o.maxHp*k*(o.isBoss?.3:1));any=true}}
  if(e.pulseT<=0){e.pulseT=1100;if(any){ringFx(e.x,e.y,0x55ff99,HEAL_RADIUS,650);sfx.heal();rise(e.x+rnd(20),8,e.y+rnd(20),0x66ff99,700,40)}}}
function saboteurTick(e,dt){e.sabT-=dt;if(e.sabT>0)return;let best=null,bd=SAB_RANGE;
  for(const t of GameState.towers){if(t.stunUntil>S.now)continue;const d=Math.hypot(t.x-e.x,t.y-e.y);if(d<bd){bd=d;best=t}}
  if(best){stunTower(best,SAB_STUN_MS,e);e.sabT=SAB_COOLDOWN}else e.sabT=400}
function updateEnemies(time,dt){for(const e of GameState.enemies){if(e.dead)continue;
  if(e.burnUntil>time){e.burnT-=dt;if(e.burnT<=0){e.burnT=500;damageEnemy(e,e.burnDps*.5,'burn',{tick:true});if(e.dead)continue}}
  if(e.key==='healer')healerTick(e,dt);else if(e.key==='saboteur')saboteurTick(e,dt);
  if(e.stomping){e.stompT-=dt;if(e.stompT<=0){e.stompT=5200;bossStomp(e)}}
  const still=e.freezeUntil>time||e.phaseLock>time,cur=still?0:e.slowUntil>time?e.baseSpeed*(e.slowF||SLOW_FACTOR):e.baseSpeed,spd=cur*dt/1000,wp=PATH_POINTS[e.wpIndex+1];
  if(!wp){GameState.lives=Math.max(0,GameState.lives-(e.isBoss?BOSS_LEAK_DAMAGE:1));updateHUD();S.shake=5;sfx.leak();Progress.onLeak();Settings.buzz(45);killEnemyOffPath(e);if(GameState.lives<=0)showGameOver(false);continue}
  const dx=wp.x-e.x,dy=wp.y-e.y,d=Math.hypot(dx,dy),mv=d>=4;
  if(!mv){e.wpIndex++;e.vx=e.vy=0}else{e.x+=dx/d*spd;e.y+=dy/d*spd;e.travel+=spd;e.vx=dx/d*cur;e.vy=dy/d*cur;let df=Math.atan2(-dy,dx)-e.ang;df=Math.atan2(Math.sin(df),Math.cos(df));e.ang+=df*Math.min(1,dt/120)}
  e.flash=Math.max(0,e.flash-dt);
  const walk=mv&&cur>0;if(e.mesh.userData.animMixer)e.mesh.userData.animMixer.update(dt/1000);else if(window.V69Animations)V69Animations.state(e.mesh,e.dead?'death':walk?'walk':'idle');const hov=e.hov=e.key==='wraith'?9+Math.sin(time/280+e.seed)*3:(e.bd&&e.bd.fly)?12+Math.sin(time/420+e.seed)*3:0;
  e.mesh.position.set(e.x,hov+(walk?Math.abs(Math.sin(time/110+e.seed))*1.6:0),e.y);e.mesh.rotation.set(0,e.ang,walk?Math.sin(time/130+e.seed)*.03:0);e.mesh.scale.setScalar(e.sc*S.u*(1+e.flash/600));
  if(e.aura)e.aura.material.opacity=(e.key==='healer'?.14:.2)+.08*Math.sin(time/180);
  if(e.icon)e.icon.rotation.y=time/300;
  if(e.shieldMesh&&e.shield>0)e.shieldMesh.material.opacity=.22+.08*Math.sin(time/160);
  updateEnemyLook(e,time,dt);
  const r=Math.max(0,e.hp/e.maxHp);e.bar.position.set(e.x,e.hb*S.u,e.y);e.bar.scale.setScalar(S.u);e.fg.scale.set(Math.max(.01,r*e.bw),3,1);e.fg.position.x=-(1-r)*e.bw/2;e.fg.material.color.setHex(r<.3?0xd84d50:r<.6?0xe1b64e:0x7fbd59)}
  GameState.enemies=GameState.enemies.filter(e=>!e.dead)}
function startWave(){if(GameState.waveActive||GameState.winPending||!canAct())return;const W=++GameState.wave;GameState.waveActive=true;GameState.spawning=true;const plan=getWavePlan(W),boss=plan.boss,bd=boss?getBossDef(W):null;toggleBossTag(boss,bd&&bd.name);Music.setMood(boss?'boss':'battle');Ambience.setWave(W,boss);if(boss)sfx.boss();else sfx.wave();showWaveBanner(boss?`♛ OLEADA ${W} · ${bd.name.toUpperCase()}`:`⚔ OLEADA ${W}`);updateHUD();
  // Aviso la primera vez que aparece cada enemigo nuevo
  [['swarm','swarm'],['brute','brutes'],['saboteur','saboteurs'],['healer','healers'],['wraith','wraiths']].filter(([k,pk])=>plan[pk]>0&&!GameState.seen[k]).forEach(([k],i)=>{GameState.seen[k]=1;later(1500+i*1900,()=>showRewardToast(`⚠ Nuevo: ${ENEMY_TYPES[k].name} — ${ENEMY_TIPS[k]}`))});
  const list=[];[['goblin','goblins'],['raider','raiders'],['ogre','ogres'],['brute','brutes'],['saboteur','saboteurs'],['healer','healers'],['wraith','wraiths']].forEach(([k,pk])=>{for(let i=0;i<plan[pk];i++)list.push(k)});
  let sd=W*7919+13;const rnd=()=>(sd=(sd*1664525+1013904223)%4294967296)/4294967296;for(let i=list.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[list[i],list[j]]=[list[j],list[i]]}
  // La plaga sale en un bloque seguido, en un punto aleatorio de la oleada
  if(plan.swarm)list.splice(Math.floor(rnd()*(list.length+1)),0,...Array(plan.swarm).fill('swarm'));
  const n=list.length;let t=0;
  list.forEach((k,i)=>{t+=k==='swarm'?170:500;later(t,()=>{spawnEnemy(k);if(i===n-1){if(boss)later(900,()=>{
      const ready=window.BOSS_MODELS_READY||Promise.resolve();
      ready.then(()=>{spawnBoss();GameState.spawning=false});
    });else GameState.spawning=false}})})}
function checkWaveComplete(){if(GameState.waveActive&&!GameState.spawning&&GameState.enemies.length===0){GameState.waveActive=false;const g=25+GameState.wave*3;GameState.gold+=g;GameState.goldEarned+=g;toggleBossTag(false);updateHUD();writeBestWave(GameState.wave);Progress.onWave(GameState.wave);Save.write();Music.setMood('calm');Ambience.setWave(GameState.wave,false);sfx.waveDone();showRewardToast(`+${g} oro · Oleada superada`);if(GameState.wave===WIN_WAVE&&!GameState.continued){GameState.winPending=true;later(900,()=>{GameState.winPending=false;showGameOver(true)})}}}

/* ---------- Torres ---------- */
const getEffectiveStats=t=>{const b={...TOWER_DEFS[t.type],...getTowerStats(t.type,t.level)},sp=specOf(t);
  if(sp){const m=sp.mul||{};b.dmg=Math.round(b.dmg*(m.dmg||1));b.range=Math.round(b.range*(m.range||1));b.rate=Math.round(b.rate*(m.rate||1));if(sp.dtype)b.dtype=sp.dtype}
  b.spec=sp;b.crit=(sp&&sp.crit)||CRIT_CHANCE;return b};
const findTowerAt=(x,y)=>GameState.towers.find(t=>Math.hypot(t.x-x,t.y-y)<26)||null;
function computeBuildSlots(){const s=[];for(let gx=20;gx<=GAME_WIDTH-20;gx+=BUILD_GRID_SIZE)for(let gy=20;gy<=GAME_HEIGHT-20;gy+=BUILD_GRID_SIZE){if(distToPath(gx,gy)<MIN_TOWER_DISTANCE_TO_PATH)continue;if(gx>680&&gy<270)continue;s.push({x:gx,y:gy})}return s}
const isCellOccupied=(gx,gy)=>GameState.towers.some(t=>t.x===gx&&t.y===gy);
function nearestSlot(x,y){let best=null,bd=Infinity;for(const s of GameState.buildSlots){const d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;best=s}}return bd<=BUILD_SNAP_MAX_DIST?best:null}
function isValidPlacement(gx,gy,type){const d=TOWER_DEFS[type];return !!d&&GameState.gold>=d.cost&&!isCellOccupied(gx,gy)}
function showBuildGrid(){S.slots.visible=true;GameState.buildSlots.forEach((sl,i)=>S.slots.setMatrixAt(i,isCellOccupied(sl.x,sl.y)?S.slotOff:S.slotOn[i]));S.slots.instanceMatrix.needsUpdate=true}
function hideBuildGrid(){S.slots.visible=false}
function drawPlacementPreview(x,y){if(!GameState.selectedTower)return;GameState.placementX=x;GameState.placementY=y;const d=TOWER_DEFS[GameState.selectedTower],sl=nearestSlot(x,y),ok=sl&&isValidPlacement(sl.x,sl.y,GameState.selectedTower),c=ok?0x5be3b0:0xff6b6b,p=sl||{x,y},r=sl?d.range:18,pv=S.prev;
  pv.visible=true;pv.position.set(p.x,0,p.y);[pv.rng,pv.fill,pv.col].forEach(o=>o.material.color.setHex(c));pv.rng.scale.set(r,r,1);pv.fill.scale.set(r,r,1);pv.col.visible=!!sl}
function clearPlacementPreview(){S.prev.visible=false;if(S.skPrev)S.skPrev.visible=false;GameState.placementDragging=false;GameState.placementPointerId=null}
function applyScale(t){t.visual.scale.setScalar((1+.07*(t.level-1))*(t.hl?1.06:1)*S.u)}
function updateLevelPips(t){if(t.pips)scene.remove(t.pips);const g=new THREE.Group(),sp=specOf(t),col=sp?sp.color:0xcfefff;g.position.set(t.x,3,t.y+18);for(let i=0;i<t.level;i++){const m=new THREE.Mesh(geo('Sphere',2.6,8,8),bmat(col));m.position.x=(i-(t.level-1)/2)*8;g.add(m)}scene.add(g);t.pips=g}
function selectPlacedTower(t){GameState.selectedTower=null;GameState.selectedSkill=null;if(S.skPrev)S.skPrev.visible=false;t.specPending=null;syncBuildButtons();hideBuildGrid();clearPlacementPreview();
  if(GameState.selectedPlacedTower&&GameState.selectedPlacedTower!==t)highlightTower(GameState.selectedPlacedTower,false);
  GameState.selectedPlacedTower=t;showTowerPanel(t);highlightTower(t,true);sfx.click()}
function deselectPlacedTower(){if(GameState.selectedPlacedTower)highlightTower(GameState.selectedPlacedTower,false);GameState.selectedPlacedTower=null;hideTowerPanel()}
function syncBuildButtons(){document.querySelectorAll('#buildButtons .tower-btn').forEach(b=>b.classList.toggle('selected',b.dataset.tower===GameState.selectedTower))}
function clearSelection(){GameState.selectedTower=null;GameState.selectedSkill=null;syncBuildButtons();deselectPlacedTower();clearPlacementPreview();hideBuildGrid()}
function highlightTower(t,on){if(!t)return;t.hl=on;applyScale(t);t.range.visible=on;S.sel.visible=on;if(on)S.sel.position.set(t.x,2,t.y)}
function placeTower(x,y){if(!GameState.selectedTower)return;const type=GameState.selectedTower,d=TOWER_DEFS[type],slot=nearestSlot(x,y);
  if(!slot){sfx.deny();showRewardToast('Elige una casilla libre del mapa');return}
  if(isCellOccupied(slot.x,slot.y)){sfx.deny();showRewardToast('Esa casilla ya está ocupada');return}
  if(GameState.gold<d.cost){sfx.deny();showRewardToast(`Oro insuficiente · faltan ${d.cost-GameState.gold} ✦`);return}
  const {x:tx,y:ty}=slot;GameState.gold-=d.cost;updateHUD();
  const m=towerModel(type);m.g.position.set(tx,0,ty);scene.add(m.g);
  const rg=flat(new THREE.Mesh(geo('Ring',.97,1,64),tmat(0x9fe3ff,.5)));rg.position.set(tx,1.8,ty);rg.scale.set(d.range,d.range,1);rg.visible=false;scene.add(rg);
  const t={x:tx,y:ty,type,mode:'first',lastShot:0,visual:m.g,range:rg,level:1,invested:d.cost,top:m.top*S.u,top0:m.top,fig:m.fig};GameState.towers.push(t);updateLevelPips(t);
  addFx(300,p=>m.g.scale.setScalar(Math.max(.01,easeBack(p))),()=>applyScale(t));burst(tx,4,ty,0xb9ad98,6,26);sfx.place();clearSelection()}
function upgradeTower(t){if(t.level>=MAX_TOWER_LEVEL)return;const cost=getUpgradeCost(t.type,t.level);
  if(GameState.gold<cost){sfx.deny();showRewardToast(`Oro insuficiente · faltan ${cost-GameState.gold} ✦`);return}
  GameState.gold-=cost;t.invested+=cost;t.level++;updateHUD();updateLevelPips(t);applyScale(t);const r=getEffectiveStats(t).range;t.range.scale.set(r,r,1);refreshTowerPanel(t);ringFx(t.x,t.y,0x7fe3ff,40,400);burst(t.x,20,t.y,0x7fe3ff,10,40);sfx.upgrade()}
function sellTower(t){GameState.gold+=Math.round(t.invested*SELL_REFUND_RATIO);updateHUD();scene.remove(t.visual,t.range);t.range.material.dispose();if(t.pips)scene.remove(t.pips);disposeTowerExtras(t);GameState.towers=GameState.towers.filter(x=>x!==t);deselectPlacedTower();sfx.sell();if(GameState.selectedTower)showBuildGrid()}
function selectTower(type){if(!canAct())return;GameState.selectedSkill=null;deselectPlacedTower();clearPlacementPreview();GameState.selectedTower=GameState.selectedTower===type?null:type;syncBuildButtons();sfx.click();if(GameState.selectedTower)showBuildGrid();else hideBuildGrid()}
function hitSlow(t,e,d){const sp=d.spec;if(e.isBoss&&!(sp&&sp.slowBoss))return;
  e.slowF=e.isBoss?sp.slowBoss:(sp&&sp.slowF)||SLOW_FACTOR;e.slowUntil=Math.max(e.slowUntil,S.now+SLOW_DURATION_MS*(sp&&sp.slowDur||1));
  if(sp&&sp.freezeEvery&&!e.isBoss){t.shots=(t.shots||0)+1;if(t.shots%sp.freezeEvery===0)freezeEnemy(e,FREEZE_HIT_MS)}}
function zap(t,st,first){sfx.zap();const sp=st.spec,hit=[first],pts=[new THREE.Vector3(t.x,t.top,t.y),new THREE.Vector3(first.x,18,first.y)];let cur=first;
  for(let i=1;i<sp.chain;i++){let nx=null,bd=CHAIN_RANGE;for(const o of GameState.enemies){if(o.dead||hit.includes(o))continue;const dd=Math.hypot(o.x-cur.x,o.y-cur.y);if(dd<bd){bd=dd;nx=o}}if(!nx)break;hit.push(nx);pts.push(new THREE.Vector3(nx.x,18,nx.y));cur=nx}
  lightningFx(pts,st.proj);
  hit.forEach((o,i)=>{damageEnemy(o,st.dmg*(1-.12*i),st.dtype,{crit:Math.random()<st.crit});if(!o.dead){hitSlow(t,o,st);burst(o.x,18,o.y,st.proj,5,30)}});
  if(t.fig){t.fig.rotation.y=Math.atan2(first.x-t.x,first.y-t.y);if(window.V69Animations)V69Animations.trigger(t.fig,'attack',t.interval);}ringFx(t.x,t.y,st.proj,18,240,t.top)}
function shootAt(t,e,st){sfx.shoot(t.type);const d=st||getEffectiveStats(t),sp=d.spec,dist=Math.hypot(e.x-t.x,e.y-t.y),dur=Math.max(100,dist/(d.area?260:520)*1000),h=t.top,sn=sp&&sp.id==='sniper';
  let tx=e.x,ty=e.y;if(d.area){tx+=e.vx*dur/1000;ty+=e.vy*dur/1000}
  const proj=new THREE.Mesh(d.area?geo('Sphere',5,10,10):t.type==='slow'?geo('Sphere',3.5,8,8):geo('Box',1.6,1.6,14),d.area?mat(0x3a2a1c):bmat(sn?0xfff2b0:d.proj));proj.position.set(t.x,h,t.y);if(sn)proj.scale.set(1.5,1.5,1.5);scene.add(proj);
  spark(t.x,h,t.y,d.proj,160,1.7);
  if(t.fig){t.fig.rotation.y=Math.atan2(tx-t.x,ty-t.y);if(window.V69Animations)V69Animations.trigger(t.fig,'attack',t.interval);}if(d.area){t.visual.rotation.y=Math.atan2(-(ty-t.y),tx-t.x);addFx(280,p=>{t.visual.position.y=3*Math.sin(p*Math.PI)})}else if(t.type==='basic')proj.lookAt(tx,8,ty);else ringFx(t.x,t.y,d.proj,16,220,h);
  let n=0;
  addFx(dur,p=>{if(!d.area&&!e.dead){tx=e.x;ty=e.y}proj.position.set(t.x+(tx-t.x)*p,h+(8-h)*p+(d.area?Math.sin(p*Math.PI)*45:0),t.y+(ty-t.y)*p);if(!d.area&&t.type==='basic')proj.lookAt(tx,8,ty);
    if(++n%3===0)spark(proj.position.x,proj.position.y,proj.position.z,d.area?0x8a7a6a:d.proj,d.area?420:220,d.area?1.3:.7)},()=>{scene.remove(proj);
    if(d.area){const R=AREA_BLAST_RADIUS*(sp&&sp.blast||1),crit=Math.random()<d.crit;
      GameState.enemies.forEach(en=>{if(!en.dead&&Math.hypot(en.x-tx,en.y-ty)<R){damageEnemy(en,d.dmg,d.dtype,{crit});if(!en.dead&&sp&&sp.burn){en.burnUntil=S.now+BURN_MS;en.burnDps=d.dmg*sp.burn;if(en.burnT<=0)en.burnT=500}}});
      explosionFx(tx,ty,R,sp&&sp.blast?'lg':'sm',!!(sp&&sp.burn));S.shake=Math.max(S.shake,sp&&sp.blast?4:2.5);sfx.boom()}
    else if(!e.dead){damageEnemy(e,d.dmg,d.dtype,{crit:Math.random()<d.crit});if(d.slow)hitSlow(t,e,d)}
    burst(tx,8,ty,d.proj,d.area?6:sn?12:7,d.area?40:22)})}
function cycleTarget(t){t.mode=TARGET_MODES[(TARGET_MODES.indexOf(t.mode)+1)%TARGET_MODES.length];refreshTowerPanel(t);sfx.click()}
function updateTowers(time){const fury=time<GameState.furyUntil?SKILL_DEFS.fury.mult:1;
  for(const t of GameState.towers){
    if(t.stunUntil){if(time<t.stunUntil){if(t.stunMark)t.stunMark.rotation.y=time/140;continue}clearStun(t)}
    const st=getEffectiveStats(t);if(time-t.lastShot<st.rate/fury)continue;
    const cand=[];for(const e of GameState.enemies){if(e.dead)continue;const d=Math.hypot(e.x-t.x,e.y-t.y);if(d>st.range)continue;cand.push({e,sc:t.mode==='strong'?e.hp:t.mode==='close'?-d:e.travel})}
    if(!cand.length)continue;cand.sort((a,b)=>b.sc-a.sc);t.lastShot=time;t.interval=st.rate/fury/(GameState.speedMultiplier||1); // ms reales entre disparos: el clip de ataque se ajusta a este tiempo
   
    const sp=st.spec;if(sp&&sp.chain)zap(t,st,cand[0].e);else for(let i=0,n=Math.min(sp&&sp.multi||1,cand.length);i<n;i++)shootAt(t,cand[i].e,st)}}

/* ---------- Cámara, entrada y bucle ---------- */
function fitPortrait(){/* Móvil vertical: busca la distancia a la que el mapa proyectado llena el ancho (y cabe en alto). */
const el=.96,c=Math.cos(el),A=-Math.PI/2,pts=[[0,0,0],[800,0,0],[0,0,500],[800,0,500],[40,70,0],[40,70,500]],pr=new THREE.Vector3();
const ext=d=>{cam.position.set(400+Math.sin(A)*c*d,Math.sin(el)*d,255+Math.cos(A)*c*d);cam.lookAt(400,0,255);cam.updateProjectionMatrix();cam.updateMatrixWorld(true);cam.matrixWorldInverse.copy(cam.matrixWorld).invert();let ex=0,ey=0;for(const q of pts){pr.set(q[0],q[1],q[2]).project(cam);ex=Math.max(ex,Math.abs(pr.x));ey=Math.max(ey,Math.abs(pr.y))}return[ex,ey]};
let d=1000;for(let i=0;i<8;i++){const[ex,ey]=ext(d);d*=Math.max(ex/.97,ey/.9)**.9}return d}
function fit(){if(!renderer)return;const w=host.clientWidth||800,h=host.clientHeight||500;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();const v=cam.aspect<1,t=Math.tan(cam.fov*Math.PI/360);S.baz=v?Math.PI/2:0;if(S.lastV!==null&&S.lastV!==v){S.zoom=1;S.centerX=400;S.centerZ=255}S.lastV=v;S.fitDist=(v?fitPortrait():Math.max(440/(t*cam.aspect),270/t))*(v?1:S.mobileCamMul);S.zoom=clampZoom(S.zoom);S.dist=S.fitDist*S.zoom;scene.fog.near=S.dist+500;scene.fog.far=S.dist+2600;
  /* Móvil: personajes más grandes para que se distingan (vertical x1.5, horizontal bajo x1.25) */
  S.u=v?(w<=520?1.5:1.3):(h<420?1.25:1);
  for(const t of GameState.towers){t.top0=t.top0||t.top;t.top=t.top0*S.u;applyScale(t)}}
function clampCenter(){const m=Math.max(30,S.dist*.12),ax=(v,size)=>m*2>=size?size/2:Math.max(m,Math.min(size-m,v));S.centerX=ax(S.centerX,GAME_WIDTH);S.centerZ=ax(S.centerZ,GAME_HEIGHT)}
function placeCam(){const el=.96,c=Math.cos(el),d=S.dist,j=()=>(Math.random()-.5)*S.shake*Settings.shakeMul();const A=S.baz+S.az;clampCenter();cam.position.set(S.centerX+Math.sin(A)*c*d+j(),Math.sin(el)*d+j(),S.centerZ+Math.cos(A)*c*d);cam.lookAt(S.centerX,0,S.centerZ);S.shake=S.shake<.05?0:S.shake*.88}
const ray=new THREE.Raycaster(),gp=new THREE.Plane(new THREE.Vector3(0,1,0),0),v2=new THREE.Vector2(),hit=new THREE.Vector3();
function groundPointAt(e){const r=host.getBoundingClientRect();v2.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(v2,cam);return ray.ray.intersectPlane(gp,hit)?{x:hit.x,y:hit.z}:null}
function groundAt(e){const p=groundPointAt(e);return p?{x:Math.min(GAME_WIDTH,Math.max(0,p.x)),y:Math.min(GAME_HEIGHT,Math.max(0,p.y))}:null}
function rotateCam(dir){S.az=Math.max(-1.2,Math.min(1.2,S.az+dir*.15))}
function clampZoom(z){const mx=cam.aspect<1?1:Math.max(1.2,1/S.mobileCamMul);return Math.min(mx,Math.max(.3,z))}
function applyZoom(){S.zoom=clampZoom(S.zoom);S.dist=S.fitDist*S.zoom;scene.fog.near=S.dist+500;scene.fog.far=S.dist+2600}
function zoomCam(f){S.zoom=clampZoom(S.zoom*f);applyZoom();clampCenter()}
function camSync(){placeCam();cam.updateMatrixWorld(true)}
/* Mantiene el punto del mapa 'anchor' bajo el punto de pantalla (x,y): así el arrastre y el pellizco siguen a los dedos. */
function panKeep(x,y,anchor){const cur=groundPointAt({clientX:x,clientY:y});if(cur&&anchor){S.centerX+=anchor.x-cur.x;S.centerZ+=anchor.y-cur.y;clampCenter();camSync()}return groundPointAt({clientX:x,clientY:y})||anchor}
function startPinch(){if(GameState.placementDragging)clearPlacementPreview();S.pan=null;const[a,b]=[...S.touches.values()];const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;S.pinch={d0:Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),z0:S.zoom,anchor:groundPointAt({clientX:mx,clientY:my})}}
function doPinch(){const[a,b]=[...S.touches.values()];if(!a||!b||!S.pinch)return;const d=Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;S.zoom=S.pinch.z0*S.pinch.d0/d;applyZoom();camSync();S.pinch.anchor=panKeep(mx,my,S.pinch.anchor)}
function dropTouch(e){/* devuelve true si el gesto de pellizco terminó con este dedo */
  if(e.pointerType!=='touch'||!S.touches.has(e.pointerId))return false;S.touches.delete(e.pointerId);
  if(!S.pinch)return false;S.pinch=null;
  const r=[...S.touches.entries()][0];/* si queda un dedo, sigue arrastrando sin seleccionar nada al soltar */
  if(r)S.pan={pointerId:r[0],startX:r[1].x,startY:r[1].y,lastX:r[1].x,lastY:r[1].y,moved:true,hit:groundPointAt({clientX:r[1].x,clientY:r[1].y})};
  try{host.releasePointerCapture(e.pointerId)}catch(_){}return true}
function bindInput(){
  host.style.touchAction='none';
  const ignore=e=>e.target.closest('#msg,#howToPanel,#camControls,#abilityBar,#bossBar,#towerPanel');
  const inside=e=>{const r=host.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};
  host.addEventListener('pointerdown',e=>{if(ignore(e)||!canAct())return;
    if(e.pointerType==='mouse'&&e.button===2){clearSelection();return}
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(e.pointerType==='touch'){S.touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(S.touches.size===2){startPinch();try{host.setPointerCapture(e.pointerId)}catch(_){}return}if(S.touches.size>2)return}
    const p=groundAt(e);if(!p)return;
    if(GameState.selectedSkill){GameState.placementDragging=true;GameState.placementPointerId=e.pointerId;try{host.setPointerCapture(e.pointerId)}catch(_){}drawSkillPreview(p.x,p.y);return}
    if(GameState.selectedTower){GameState.placementDragging=true;GameState.placementPointerId=e.pointerId;try{host.setPointerCapture(e.pointerId)}catch(_){}drawPlacementPreview(p.x,p.y);return}

    // En móvil, un toque selecciona; un arrastre mueve la cámara sin rotarla.
    if(e.pointerType==='touch'){
      S.pan={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,hit:p};
      try{host.setPointerCapture(e.pointerId)}catch(_){}
      return;
    }
    const t=findTowerAt(p.x,p.y);if(t)selectPlacedTower(t);else deselectPlacedTower()});
  host.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'&&S.touches.has(e.pointerId))S.touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(S.pinch){if(S.touches.size>=2)doPinch();return}
    if(S.pan&&e.pointerId===S.pan.pointerId){
      if(Math.hypot(e.clientX-S.pan.startX,e.clientY-S.pan.startY)>8)S.pan.moved=true;
      if(S.pan.moved&&S.pan.hit)S.pan.hit=panKeep(e.clientX,e.clientY,S.pan.hit);
      S.pan.lastX=e.clientX;S.pan.lastY=e.clientY;return;
    }
    if(!(GameState.selectedTower||GameState.selectedSkill)||!canAct())return;if(GameState.placementDragging?e.pointerId!==GameState.placementPointerId:e.pointerType!=='mouse')return;const p=groundAt(e);if(p){if(GameState.selectedSkill)drawSkillPreview(p.x,p.y);else drawPlacementPreview(p.x,p.y)}});
  host.addEventListener('pointerup',e=>{
    if(dropTouch(e))return;
    if(S.pan&&e.pointerId===S.pan.pointerId){
      const wasTap=!S.pan.moved;S.pan=null;
      if(wasTap&&canAct()&&inside(e)){const p=groundAt(e);if(p){const t=findTowerAt(p.x,p.y);if(t)selectPlacedTower(t);else deselectPlacedTower()}}
      try{host.releasePointerCapture(e.pointerId)}catch(_){}return;
    }
    if(!(GameState.selectedTower||GameState.selectedSkill)||!GameState.placementDragging||e.pointerId!==GameState.placementPointerId)return;
    const p=canAct()&&inside(e)?groundAt(e):null;if(p){if(GameState.selectedSkill)castSkillAt(p.x,p.y);else placeTower(p.x,p.y)}clearPlacementPreview();if(GameState.selectedTower)showBuildGrid()});
  host.addEventListener('pointercancel',e=>{if(dropTouch(e))return;if(S.pan&&e.pointerId===S.pan.pointerId)S.pan=null;if(e.pointerId===GameState.placementPointerId){clearPlacementPreview();if(GameState.selectedTower)showBuildGrid()}});
  host.addEventListener('contextmenu',e=>e.preventDefault());
  host.addEventListener('wheel',e=>{e.preventDefault();zoomCam(e.deltaY>0?1.06:.94)},{passive:false});
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(k==='q')rotateCam(-1);if(k==='e')rotateCam(1)});
}
function adaptQuality(raw){if(!S.running||document.hidden){S.acc=S.n=S.bad=0;return}S.acc+=raw;S.n++;
  if(S.acc<1200&&S.n<15)return;const avg=S.acc/S.n;S.acc=S.n=0;S.bad=avg>24?S.bad+1:0;
  if(S.bad>=2&&S.pr>S.prMin){S.bad=0;S.pr=Math.max(S.prMin,+(S.pr-.2).toFixed(2));renderer.setPixelRatio(S.pr);fit()}}
function frame(ts){requestAnimationFrame(frame);const real=ts-(S.last||ts),raw=Math.min(real,50);S.last=ts;
  if(!S.running&&ts-S.lastRender<33)return;S.lastRender=ts;adaptQuality(Math.min(real,250));
  if(S.running){const sm=S.slow>0?.35:1;if(S.slow>0)S.slow-=raw;const dt=raw*GameState.speedMultiplier*sm;S.now+=dt;
    const tm=S.timers;S.timers=[];for(const x of tm){if(x.t<=S.now)x.fn();else S.timers.push(x)}
    updateTowers(S.now);updateEnemies(S.now,dt);checkWaveComplete();updateBossBar(GameState.enemies.find(e=>e.isBoss&&!e.dead));
    const cur=S.fx;S.fx=[];for(const f of cur){f.age+=dt;const p=Math.min(1,f.age/f.life);f.fn(p);if(p>=1){if(f.end)f.end()}else S.fx.push(f)}}
  if(S.sel)S.sel.scale.setScalar(1+.1*Math.sin(ts/150));
  for(const t of GameState.towers)if(t.gem){t.gem.rotation.y=ts/400;t.gem.position.y=t.top+16+Math.sin(ts/350)*2}
  Ambience.update(ts);if(window.V69Animations)V69Animations.update(raw,ts);if(window.V6Visual)V6Visual.update(ts);if(window.V65Visual)V65Visual.update(ts);placeCam();GameState.enemies.forEach(e=>e.bar.quaternion.copy(cam.quaternion));renderer.render(scene,cam)}
let booting=false,worldReady=false;
async function initGame(){
  S.bazInitial=(host.clientWidth||800)/(host.clientHeight||500)<1?Math.PI/2:0;
  S.baz=S.bazInitial;

  if(booting||worldReady)return;booting=true;setLoadState('loading',0);
  let failed=false;
  try{
    if(!renderer){try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(err){const e=new Error('webgl');e.code='webgl';throw e}}
    await Promise.all([loadModels(p=>{if(!failed)setLoadState('loading',p)}),nkLoad()]);
  }catch(err){
    failed=true;console.error(err);booting=false;
    setLoadState('error',0,err&&err.code==='webgl'?'TU NAVEGADOR NO PUEDE MOSTRAR GRÁFICOS 3D (WEBGL).':'NO SE PUDIERON CARGAR LOS MODELOS 3D. Si abriste el archivo directamente, usa un servidor local (ver README).');return}
  const cs=renderer.domElement;cs.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';
  if(getComputedStyle(host).position==='static')host.style.position='relative';host.style.overflow='hidden';
  renderer.setPixelRatio(S.pr);renderer.shadowMap.enabled=true;host.prepend(cs);
  buildWorld();bindInput();fit();Settings.applyGfx();new ResizeObserver(fit).observe(host);updateHUD();requestAnimationFrame(frame);
  worldReady=true;booting=false;setLoadState('ready');
  // Carga diferida: la decoración 3D del mapa no bloquea el inicio de la partida.
  loadMapKit();
}
