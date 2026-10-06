/* V16 — GUERRA VIVA
   Capa visual independiente: asedios, fuego, humo, proyectiles y señales de batalla.
   No altera IA, daño, economía, oleadas ni selección. */
(function(){
'use strict';
let scene=null,S=null,ready=false,shots=[],embers=[],fires=[],debris=[],nextShot=0,nextEvent=0;
const low=()=>!!(S&&S.lowPower);
function basic(c,o=1){return new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o,depthWrite:false});}
function flame(x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,0,z);
 const core=new THREE.Mesh(new THREE.SphereGeometry(4*scale,8,8),basic(0xffb52e,.72));core.position.y=9*scale;
 const tip=new THREE.Mesh(new THREE.ConeGeometry(3.2*scale,12*scale,7),basic(0xff5a22,.55));tip.position.y=15*scale;
 g.add(core,tip);scene.add(g);fires.push({g,core,tip,p:Math.random()*6});
 if(!low()){const light=new THREE.PointLight(0xff8a32,1.15,75);light.position.y=12*scale;g.add(light)}
}
function ember(x,z){const m=new THREE.Mesh(new THREE.SphereGeometry(.75,5,5),basic(0xffc45b,.8));m.position.set(x,8+Math.random()*13,z);scene.add(m);embers.push({m,x,z,p:Math.random()*6,v:.7+Math.random()*1.4});}
function impact(x,z,big=false){
 const ring=new THREE.Mesh(new THREE.RingGeometry(4,6,24),basic(big?0xffc04d:0xff7d35,.72));ring.rotation.x=-Math.PI/2;ring.position.set(x,.9,z);scene.add(ring);
 const smoke=new THREE.Mesh(new THREE.SphereGeometry(big?7:4,8,8),basic(0x5d5148,.22));smoke.position.set(x,4,z);scene.add(smoke);
 const life=performance.now();debris.push({ring,smoke,x,z,big,life,dur:big?850:600});
}
function launch(){
 if(!scene||!S)return;
 const cat=[[330,270],[455,275]]; const c=cat[Math.floor(Math.random()*cat.length)];
 const tx=560+Math.random()*150,tz=230+Math.random()*180;
 const m=new THREE.Mesh(new THREE.SphereGeometry(low()?2.1:2.7,7,7),basic(0x201814));m.position.set(c[0],16,c[1]);scene.add(m);
 shots.push({m,x0:c[0],z0:c[1],tx,tz,start:performance.now(),dur:950+Math.random()*350});
}
function battleEvent(){
 if(!scene||!S||!S.running)return;
 const x=520+Math.random()*210,z=210+Math.random()*210;
 impact(x,z,Math.random()<.28);
 if(!low())for(let i=0;i<5;i++){const e=new THREE.Mesh(new THREE.SphereGeometry(1.1,5,5),basic(0xd58a45,.75));e.position.set(x+(Math.random()-.5)*10,3+Math.random()*7,z+(Math.random()-.5)*10);scene.add(e);debris.push({ring:e,smoke:null,x:e.position.x,z:e.position.z,big:false,life:performance.now(),dur:420+Math.random()*300,ember:true})}
}
function init(sc,state){scene=sc;S=state;if(ready||!scene)return;ready=true;
 const pts=[[700,135],[748,178],[715,155]];pts.forEach((p,i)=>flame(p[0],p[1],i===2?.65:.8));
 if(!low()){for(let i=0;i<14;i++)ember(700+Math.random()*55,130+Math.random()*60)}
 nextShot=performance.now()+3500;nextEvent=performance.now()+5000;
}
function update(ts){if(!scene||!S)return;if(!ready)init(scene,S);const t=ts*.001;
 fires.forEach(f=>{const s=.9+.16*Math.sin(t*9+f.p),q=.88+.1*Math.sin(t*7+f.p);f.core.scale.set(s,1.15+(.2*Math.sin(t*8+f.p)),s);f.tip.scale.set(q,1+.25*Math.sin(t*10+f.p),q);});
 embers.forEach((e,i)=>{e.m.position.y+=Math.sin(t*2+e.p)*.035+e.v*.02;e.m.position.x=e.x+Math.sin(t*.8+e.p)*2;e.m.position.z=e.z+Math.cos(t*.7+e.p)*2;e.m.material.opacity=.3+.45*(.5+.5*Math.sin(t*4+e.p));if(e.m.position.y>30)e.m.position.y=7});
 shots.forEach((s,i)=>{const p=Math.min(1,(ts-s.start)/s.dur);const x=s.x0+(s.tx-s.x0)*p,z=s.z0+(s.tz-s.z0)*p,y=16+Math.sin(Math.PI*p)*85;s.m.position.set(x,y,z);s.m.rotation.x+=.12;s.m.rotation.z+=.17;if(p>=1){scene.remove(s.m);impact(s.tx,s.tz,false);shots.splice(i,1)}});
 debris.slice().forEach(d=>{const p=Math.min(1,(ts-d.life)/d.dur);if(d.ember){d.ring.position.y+=.08;d.ring.scale.setScalar(1-p);d.ring.material.opacity=.75*(1-p)}else{d.ring.scale.setScalar(1+3*p);d.ring.material.opacity=.7*(1-p);if(d.smoke){d.smoke.position.y=4+16*p;d.smoke.scale.setScalar(.8+1.4*p);d.smoke.material.opacity=.22*(1-p)}}if(p>=1){scene.remove(d.ring);if(d.smoke)scene.remove(d.smoke);debris.splice(debris.indexOf(d),1)}});
 if(S.running&&!document.hidden){if(ts>nextShot){nextShot=ts+(low()?9000:5500)+Math.random()*5000;if(Math.random()<.72)launch()}if(ts>nextEvent){nextEvent=ts+(low()?15000:8500)+Math.random()*8000;if(Math.random()<.75)battleEvent()}}
}
window.V16Visual={init,update};
})();
