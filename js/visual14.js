/* V14 — MAPA VIVO
   Decoración ambiental ligera. No modifica gameplay, IA, daño ni economía. */
(function(){
'use strict';
let scene=null,S=null,items=[],water=[],birds=[],fireflies=[],smoke=[],flags=[],grass=[],npcs=[],sunBase=null,fogBase=null;
const low=()=>!!(S&&S.lowPower);
function mat(color,opacity=1){return new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false,side:THREE.DoubleSide});}
function makeFlag(x,z,flip){
  const g=new THREE.Group();
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.35,28,8),new THREE.MeshLambertMaterial({color:0x4a3020})); pole.position.y=14; pole.castShadow=true;
  const cloth=new THREE.Mesh(new THREE.PlaneGeometry(18,9),mat(flip?0x8b2635:0xb58b32,.92)); cloth.position.set(8.5,22,0); cloth.rotation.y=flip?Math.PI:0; cloth.userData.phase=Math.random()*6;
  g.add(pole,cloth);g.position.set(x,0,z);scene.add(g);flags.push({cloth,phase:Math.random()*6});
}
function makeWater(){
 if(!window.CURRENT_MAP||CURRENT_MAP.id!=='valle')return;
 const pts=[[610,500],[635,470],[652,445],[680,420],[710,402],[742,392],[800,388]];
 for(let i=0;i<pts.length-1;i++){
   const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),ang=Math.atan2(-dz,dx);
   const m=new THREE.Mesh(new THREE.PlaneGeometry(L,10),mat(0x77c7d9,.28));m.rotation.set(-Math.PI/2,ang,0);m.position.set((a[0]+b[0])/2,.68,(a[1]+b[1])/2);m.userData.phase=i*.8;scene.add(m);water.push(m);
 }
}
function makeSmoke(x,z){
 const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);const n=low()?3:5;
 for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(4+Math.random()*3,7,7),mat(0xd7d2c6,.11));m.position.set((Math.random()-.5)*7,18+i*7,(Math.random()-.5)*7);m.userData={baseX:m.position.x,baseZ:m.position.z,phase:Math.random()*6,idx:i};group.add(m)}
 smoke.push(group);
}
function makeBirds(){
 const n=low()?3:7;const geo=new THREE.BufferGeometry();
 for(let i=0;i<n;i++){
   const g=new THREE.Group(),wing1=new THREE.Mesh(new THREE.BoxGeometry(8,.45,.7),mat(0x28343a,.72)),wing2=wing1.clone();
   wing1.position.x=-4;wing2.position.x=4;g.add(wing1,wing2);g.position.set(80+Math.random()*650,150+Math.random()*90,50+Math.random()*400);scene.add(g);
   birds.push({g,phase:Math.random()*6,speed:.012+Math.random()*.008,amp:5+Math.random()*6});
 }
}
function makeFireflies(){
 const n=low()?20:55,geo=new THREE.SphereGeometry(.9,5,5),m=mat(0xffe7a1,.7);
 for(let i=0;i<n;i++){const o=new THREE.Mesh(geo,m);o.position.set(20+Math.random()*760,4+Math.random()*12,20+Math.random()*460);o.userData={x:o.position.x,z:o.position.z,p:Math.random()*6};scene.add(o);fireflies.push(o)}
}
function makeAmbientDust(){
 const n=low()?18:45,geo=new THREE.SphereGeometry(.6,5,5),m=mat(0xe8d8ae,.16);
 for(let i=0;i<n;i++){const o=new THREE.Mesh(geo,m);o.position.set(20+Math.random()*760,12+Math.random()*80,20+Math.random()*460);o.userData={p:Math.random()*6};scene.add(o);items.push(o)}
}

function makeGrass(){
 const n=low()?28:70;
 const bladeGeo=new THREE.ConeGeometry(.9,5.5,4); bladeGeo.translate(0,2.7,0);
 for(let i=0;i<n;i++){
   const x=35+Math.random()*700,z=35+Math.random()*420;
   if(typeof distToPath==='function'&&distToPath(x,z)<48) continue;
   if(x>690&&z<260) continue;
   const g=new THREE.Group();
   for(let j=0;j<2;j++){
     const m=new THREE.Mesh(bladeGeo,mat(j?0x6f9f46:0x86b94f,.72));
     m.position.x=(j-.5)*1.4;m.rotation.z=(j-.5)*.55;m.rotation.y=j*.9;g.add(m);
   }
   g.position.set(x,.05,z);g.scale.setScalar(.75+Math.random()*.7);scene.add(g);
   grass.push({g,phase:Math.random()*6.28,amp:.035+Math.random()*.035});
 }
}
function makeNPCs(){
 const n=low()?3:6;
 const routes=[
   [[120,110],[220,145],[300,100]],[[430,380],[520,350],[610,400]],[[170,400],[250,430],[320,390]],
   [[560,120],[620,150],[570,190]],[[350,90],[410,120],[460,85]],[[90,250],[150,280],[110,320]]
 ];
 for(let i=0;i<n;i++){
   const root=new THREE.Group(), body=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.8,7,6),mat(i%2?0x4f6f9b:0x8b5b38));
   const head=new THREE.Mesh(new THREE.SphereGeometry(2.5,7,6),mat(0xd7a27b));head.position.y=5.8;
   const pack=new THREE.Mesh(new THREE.BoxGeometry(2.8,3.5,1.5),mat(0x3d3025));pack.position.set(0,3,-1.8);
   root.add(body,head,pack);root.position.set(routes[i][0][0],0,routes[i][0][1]);scene.add(root);
   npcs.push({g:root,route:routes[i],seg:0,t:0,speed:.00018+Math.random()*.00008,phase:Math.random()*6.28});
 }
}
function updateNPCs(ts){
 const t=ts;
 npcs.forEach((n,i)=>{
   const a=n.route[n.seg],b=n.route[(n.seg+1)%n.route.length];
   n.t+=n.speed*(S.running?1:.22)*(t-(n.last||t));n.last=t;
   if(n.t>=1){n.t=0;n.seg=(n.seg+1)%n.route.length;}
   const q=n.t, x=a[0]+(b[0]-a[0])*q,z=a[1]+(b[1]-a[1])*q;
   n.g.position.x=x;n.g.position.z=z;n.g.position.y=.15+Math.abs(Math.sin(t*.006+n.phase))*.35;
   n.g.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
   n.g.scale.y=.98+.035*Math.sin(t*.012+n.phase);
 });
}

function init(sc,state){scene=sc;S=state;if(!scene||scene.userData.v14)return;scene.userData.v14=true;
  makeWater(); makeBirds(); makeFireflies(); makeAmbientDust(); makeGrass(); makeNPCs();
  makeFlag(735,135,false); makeFlag(785,155,true); makeSmoke(700,135); makeSmoke(748,178);
  sunBase=S.sun?S.sun.intensity:1; fogBase=scene.fog?{near:scene.fog.near,far:scene.fog.far}:null;
}
function update(ts){if(!scene||!S)return;const t=ts*.001;
  updateNPCs(ts);
  // Ciclo solar extremadamente sutil: conserva la lectura del mapa y evita parpadeos.
  if(S.sun){S.sun.intensity=sunBase*(.96+.08*Math.sin(t*.018));S.sun.position.x=180+Math.sin(t*.018)*45;S.sun.position.z=360+Math.cos(t*.018)*35;}
  grass.forEach(g=>{g.g.rotation.z=Math.sin(t*1.15+g.phase)*g.amp;g.g.rotation.x=Math.cos(t*.9+g.phase)*g.amp*.65;});
  if(scene.fog&&fogBase){const pulse=.035*Math.sin(t*.08);scene.fog.near=fogBase.near*(1+pulse);scene.fog.far=fogBase.far*(1+pulse*.7);}
  water.forEach((m,i)=>{m.material.opacity=.20+.08*Math.sin(t*1.5+m.userData.phase);m.position.y=.68+.18*Math.sin(t*1.1+m.userData.phase);});
  flags.forEach((f,i)=>{f.cloth.rotation.z=Math.sin(t*2.2+f.phase)*.07;f.cloth.scale.x=1+.035*Math.sin(t*2.7+f.phase);});
  birds.forEach((b,i)=>{b.g.position.x+=b.speed*(S.running?1:.25);b.g.position.z+=Math.sin(t*1.4+b.phase)*.08;b.g.position.y+=Math.sin(t*2+b.phase)*.12;if(b.g.position.x>840)b.g.position.x=40;b.g.rotation.y=Math.sin(t*.7+b.phase)*.18;});
  fireflies.forEach((o,i)=>{const u=o.userData;o.position.y=7+Math.sin(t*1.7+u.p)*5;o.position.x=u.x+Math.sin(t*.45+u.p)*5;o.position.z=u.z+Math.cos(t*.5+u.p)*5;o.material.opacity=.35+.35*(.5+.5*Math.sin(t*2.1+u.p));});
  items.forEach((o,i)=>{o.position.y+=Math.sin(t*.35+i)*.012;});
  smoke.forEach((g,gi)=>g.children.forEach((m,i)=>{const u=m.userData;m.position.x=u.baseX+Math.sin(t*.45+u.phase)*3;m.position.z=u.baseZ+Math.cos(t*.38+u.phase)*3;m.position.y=18+i*7+((t*3+i*4)%20);m.scale.setScalar(.7+.35*Math.sin(t*.7+u.phase));m.material.opacity=.05+.06*(1-i/g.children.length);}));
}
window.V14Visual={init,update};
})();
