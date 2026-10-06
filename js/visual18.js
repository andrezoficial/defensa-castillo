/* V18 — FORTALEZA HEROICA
   Feedback visual del daño: castillo que reacciona, impactos, fuego por vida baja,
   defensores que responden y entrada cinematográfica del jefe. Todo es aditivo y ligero.
*/
(function(){'use strict';
  let scene=null,S=null,ready=false,prevLives=null,prevBosses=new Set(),impactSeq=0;
  const fires=[],embers=[],bossIntros=[];
  const W=775,Z=150;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function M(c,o=1,em=0){return new THREE.MeshStandardMaterial({color:c,roughness:.72,metalness:.08,transparent:o<1,opacity:o,emissive:c,emissiveIntensity:em||(.04)})}
  function addFire(x,z,scale){
    const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale||1);
    const base=new THREE.Mesh(new THREE.ConeGeometry(4.5,10,7),M(0xff6a1a,.72,.18));base.position.y=7;g.add(base);
    const core=new THREE.Mesh(new THREE.ConeGeometry(2.4,8,7),M(0xffd45a,.85,.45));core.position.y=11;g.add(core);
    const l=new THREE.PointLight(0xff7b28,0,62);l.position.y=12;g.add(l);scene.add(g);
    fires.push({g,base,core,l,seed:Math.random()*10,active:0});
  }
  function impact(x,y,z,side){
    const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=side?Math.PI/2:0;
    const scorch=new THREE.Mesh(new THREE.CircleGeometry(5+Math.random()*4,12),M(0x17120f,.55,.02));scorch.rotation.x=-Math.PI/2;
    // front-wall impact: a flattened dark mark plus a hot core and fragments
    const ring=new THREE.Mesh(new THREE.RingGeometry(5,7.5,18),new THREE.MeshBasicMaterial({color:0xffc06a,transparent:true,opacity:.75,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;g.add(scorch,ring);scene.add(g);
    for(let i=0;i<6;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),M(0x6d5140));p.position.set((Math.random()-.5)*7,Math.random()*7,(Math.random()-.5)*3);g.add(p);}
    addFx(650,q=>{ring.scale.setScalar(1+q*1.8);ring.material.opacity=.75*(1-q);g.position.y=y+Math.sin(q*Math.PI)*3},()=>{scene.remove(g);ring.material.dispose();scorch.material.dispose();impactSeq--});
    impactSeq++;
  }
  function bossIntro(e,time){
    if(!e||prevBosses.has(e.id))return;
    prevBosses.add(e.id);bossIntros.push({e,age:0,life:2600,seed:Math.random()*6});
    waveFx(e.x,e.y,0xffb52e,70,1200,2.2);waveFx(e.x,e.y,0xff4b36,35,850,3);
    if(window.flashScreen)flashScreen('#ffd36a',.16,280);
    if(window.flashLight)flashLight(e.x,e.y,0xff9a38,3.2,650);
    for(let i=0;i<22;i++){
      const a=Math.random()*Math.PI*2,r=18+Math.random()*30;
      spark(e.x+Math.cos(a)*r,8+Math.random()*22,e.y+Math.sin(a)*r,Math.random()<.55?0xffc35b:0xff4d35,600+Math.random()*700,1+Math.random());
    }
    try{if(window.sfx&&sfx.boss)sfx.boss()}catch(_){ }
  }
  function defenderReact(strong){
    const ds=(S&&S.fortressDefenders)||[];if(!ds.length)return;
    ds.forEach((q,i)=>{const g=q.g,base=g.rotation.z;addFx(strong?720:430,p=>{
      const k=Math.sin(p*Math.PI*5)*(1-p);g.rotation.z=base+k*(strong?.12:.065)*(i%2?-1:1);g.rotation.y=Math.sin(p*Math.PI*3)*(strong?.1:.045);
    },()=>{g.rotation.z=base;g.rotation.y=0})});
  }
  function castleShake(strong){
    const c=S&&S.castleRoot;if(!c)return;
    const bx=c.position.x,bz=c.position.z,rot=c.rotation.z;
    addFx(strong?650:380,p=>{const k=Math.sin(p*Math.PI*10)*(1-p);c.position.x=bx+k*(strong?3.8:2.1);c.position.z=bz+k*(strong?2.4:1.3);c.rotation.z=rot+k*(strong?.014:.008)},()=>{c.position.x=bx;c.position.z=bz;c.rotation.z=rot});
  }
  function damagePulse(lost,time){
    const severe=lost>=2||GameState.lives<=Math.max(2,(GameState.maxLives||20)*.28);
    castleShake(severe);defenderReact(severe);
    const spots=[
      [W-68,14+Math.random()*13,Z-43,false],[W-10+Math.random()*20,18+Math.random()*10,Z-46,false],
      [W+58,15+Math.random()*15,Z-30,false],[W+55,18+Math.random()*12,Z+26,false]
    ];
    const count=severe?2:1;
    for(let i=0;i<count&&impactSeq<8;i++){const p=spots[Math.floor(Math.random()*spots.length)];impact(p[0],p[1],p[2],p[3]);smoke(p[0],p[2],4+Math.random()*3)}
    if(window.flashScreen)flashScreen(severe?'#ff3c24':'#ffc06a',severe?.07:.035,160);
    if(window.Settings&&Settings.buzz)Settings.buzz(severe?28:14);
  }
  function updateFires(t,ratio){
    const low=ratio<=.52,critical=ratio<=.28;
    fires.forEach((f,i)=>{
      const on=low?(critical?1:.68):0;f.active+=(on-f.active)*.08;
      const s=.8+.18*Math.sin(t*9+f.seed);f.base.scale.set(s,1+.2*Math.sin(t*12+f.seed),s);f.core.scale.setScalar(.8+.24*Math.sin(t*15+f.seed));f.l.intensity=(1.0+(.9*(critical?1:.35)))*f.active;
      f.g.visible=f.active>.02;
      if(f.active>.45&&Math.random()<.06){rise(f.g.position.x+(Math.random()-.5)*4,12,f.g.position.z+(Math.random()-.5)*4,0x55504a,650,26);}
    });
  }
  function updateBossIntros(dt,t){
    for(let i=bossIntros.length-1;i>=0;i--){const b=bossIntros[i];b.age+=dt;const e=b.e;if(!e||e.dead){bossIntros.splice(i,1);continue}
      const p=clamp(b.age/b.life,0,1),riseK=Math.min(1,b.age/650),pulse=.9+.18*Math.sin(t*12);
      e.mesh.scale.setScalar((e.sc||1)*S.u*(.35+.65*riseK)*pulse);
      if(b.age<1100&&Math.random()<.16) spark(e.x+(Math.random()-.5)*25,8+Math.random()*25,e.y+(Math.random()-.5)*25,0xffb52e,360,1.1);
      if(b.age>=b.life)bossIntros.splice(i,1);
    }
  }
  function init(sc,state){if(ready)return;scene=sc;S=state;ready=true;prevLives=GameState.lives;
    // Incendios ligeros en puntos de la fortaleza; permanecen ocultos hasta que la vida baja.
    [[718,108,1],[832,108,.9],[718,192,.85],[832,192,1]].forEach(p=>addFire(p[0],p[1],p[2]));
    if(S.castleRoot)S.castleRoot.userData.heroicFortress=true;
  }
  function update(ts){if(!scene||!S)return;if(!ready)init(scene,S);const t=ts*.001;
    const max=Math.max(1,GameState.maxLives||INITIAL_LIVES||20),ratio=clamp(GameState.lives/max,0,1);
    if(prevLives==null)prevLives=GameState.lives;
    if(GameState.lives<prevLives){damagePulse(prevLives-GameState.lives,ts);prevLives=GameState.lives}else if(GameState.lives>prevLives)prevLives=GameState.lives;
    updateFires(t,ratio);
    const bosses=(GameState.enemies||[]).filter(e=>e&&!e.dead&&e.isBoss);bosses.forEach(e=>bossIntro(e,t));
    // Retira ids de jefes ya terminados para no acumularlos indefinidamente.
    if(prevBosses.size>12){const live=new Set(bosses.map(e=>e.id));prevBosses.forEach(id=>{if(!live.has(id))prevBosses.delete(id)})}
    updateBossIntros(Math.min(50,ts-(S.v18Last||ts)),t);S.v18Last=ts;
    const c=S.castleRoot;if(c&&!S.v18DamageShake){const pulse=ratio<.3?.012:ratio<.55?.006:0;c.userData.heroicPulse=pulse;if(pulse)c.rotation.y=Math.sin(t*5)*pulse;else c.rotation.y=0}
  }
  window.V18Visual={init,update};
})();
