/* Defensa del Castillo V6.5 — dirección de arte avanzada.
 * Capa independiente: clima, ciclo día/noche, animaciones secundarias,
 * banderas, aura de jefe y presentación cinematográfica ligera.
 */
(function(){
  'use strict';
  let root, weather, wpos, wvel, flags=[], last=0, bossWas=false, bossStarted=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);

  function setup(){
    if(root) return;
    root=document.createElement('div'); root.id='v65Layer'; root.setAttribute('aria-hidden','true');
    root.innerHTML='<div class="v65-sky-glow"></div><div class="v65-moon"></div><div class="v65-weather-glass"></div><div class="v65-cinematic"><span id="v65CineIcon">⚔</span><b id="v65CineTitle">LA BATALLA COMIENZA</b><small id="v65CineSub">DEFENSA DEL CASTILLO</small></div>';
    document.getElementById('gameHost').appendChild(root);
  }

  function textureDot(){
    const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');
    const g=x.createRadialGradient(8,8,0,8,8,8);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,16,16);return new THREE.CanvasTexture(c);
  }

  function buildWeather(){
    if(weather||typeof THREE==='undefined'||typeof scene==='undefined')return;
    const count=S.lowPower?55:120;
    wpos=new Float32Array(count*3);wvel=new Float32Array(count*3);
    const id=CURRENT_MAP.id;
    for(let i=0;i<count;i++){
      wpos[i*3]=rand(-30,830);wpos[i*3+1]=rand(8,150);wpos[i*3+2]=rand(-30,530);
      wvel[i*3]=rand(-5,5);wvel[i*3+1]=id==='bosque'?rand(-1,3):id==='valle'?rand(.5,2):rand(-5,-1);wvel[i*3+2]=rand(-5,5);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(wpos,3));
    const rain=id==='paso'||id==='fortaleza';
    weather=new THREE.Points(g,new THREE.PointsMaterial({map:textureDot(),color:rain?0xaec8ff:id==='bosque'?0x9dffb5:0xffe0a0,size:rain?S.lowPower?3:4:S.lowPower?5:7,transparent:true,opacity:rain?.42:.55,depthWrite:false,blending:THREE.AdditiveBlending}));
    weather.frustumCulled=false;scene.add(weather);
    buildFlags();
  }

  function buildFlags(){
    const specs=[{x:746,z:112,c:0xc44d3e},{x:746,z:188,c:0x4c6fbd}];
    specs.forEach(s=>{
      const g=new THREE.Group();g.position.set(s.x,0,s.z);
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,48,8),new THREE.MeshLambertMaterial({color:0x3b291b}));pole.position.y=24;
      const cloth=new THREE.Mesh(new THREE.PlaneGeometry(22,13,6,3),new THREE.MeshLambertMaterial({color:s.c,side:THREE.DoubleSide}));cloth.position.set(11,39,0);cloth.rotation.y=0;cloth.userData.phase=Math.random()*6.28;
      g.add(pole,cloth);scene.add(g);flags.push({g,cloth,phase:cloth.userData.phase});
    });
  }

  function themeClock(ts){
    const wave=typeof GameState!=='undefined'?GameState.wave:0;
    const cycle=(wave%20)/20;
    const night=CURRENT_MAP.id==='fortaleza';
    const dusk=night?0.72:(cycle>.55?clamp((cycle-.55)*2.2,0,.65):0);
    root.style.setProperty('--v65-night',dusk.toFixed(3));
    root.style.setProperty('--v65-sky',String(0.08+dusk*.3));
    const moon=root.querySelector('.v65-moon');if(moon)moon.style.opacity=String(clamp(dusk*1.5,0,.92));
    const glow=root.querySelector('.v65-sky-glow');if(glow)glow.style.transform=`translate(${Math.sin(ts/90000)*5}px,${Math.cos(ts/70000)*3}px)`;
  }

  function animateWorld(ts,k){
    const t=ts/1000;
    if(weather){
      const id=CURRENT_MAP.id,rain=id==='paso'||id==='fortaleza';
      const p=weather.geometry.attributes.position.array;
      for(let i=0;i<p.length;i+=3){
        p[i]+=wvel[i]*.0015*k;p[i+1]+=wvel[i+1]*.0015*k;p[i+2]+=wvel[i+2]*.0015*k;
        if(rain)p[i+1]-=.65*k;
        if(p[i]<-40)p[i]=840;if(p[i]>840)p[i]=-40;if(p[i+2]<-40)p[i+2]=540;if(p[i+2]>540)p[i+2]=-40;
        if(p[i+1]<3)p[i+1]=rain?150:rand(20,140);if(p[i+1]>155)p[i+1]=3;
      }
      weather.geometry.attributes.position.needsUpdate=true;
      weather.rotation.y=Math.sin(t*.035)*.012;
    }
    flags.forEach((f,i)=>{f.cloth.rotation.y=.04*Math.sin(t*2.4+f.phase);f.cloth.position.y=39+Math.sin(t*2.4+f.phase)*.5;});
    if(typeof GameState!=='undefined'){
      GameState.towers.forEach((tw,i)=>{
        if(!tw.visual)return;
        const base=tw.visual.userData.v65BaseY??0;tw.visual.userData.v65BaseY=base;
        if(tw.type==='area')tw.visual.position.y=base+Math.sin(t*1.6+i*.7)*.8;
        if(tw.fig){tw.fig.position.y=0;}
      });
      GameState.enemies.forEach((e,i)=>{
        if(!e.mesh||e.dead)return;
        const bob=e.isBoss?Math.sin(t*1.3+e.seed)*1.2:Math.sin(t*3.1+e.seed)*.45;
        e.mesh.position.y=(e.hov||0)+bob; // conserva el vuelo del espectro (e.hov lo fija el motor)
        if(e.isBoss&&e.aura){const s=1+.08*Math.sin(t*3);e.aura.scale.setScalar((e.bd?.size||84)/84*s);e.aura.material.opacity=.16+.08*Math.sin(t*3);}
      });
    }
  }

  function bossScene(){
    if(typeof GameState==='undefined')return;
    const boss=GameState.enemies.find(e=>e.isBoss&&!e.dead);
    if(boss&&!bossWas){
      bossStarted=performance.now();root.classList.add('v65-boss');
      const cine=root.querySelector('.v65-cinematic');
      document.getElementById('v65CineIcon').textContent='♛';
      document.getElementById('v65CineTitle').textContent=(boss.name||'JEFE').toUpperCase();
      document.getElementById('v65CineSub').textContent='UNA AMENAZA SE ALZA ANTE EL CASTILLO';
      cine.classList.remove('show');void cine.offsetWidth;cine.classList.add('show');clearTimeout(cine._t);cine._t=setTimeout(()=>cine.classList.remove('show'),3000);
      if(typeof S!=='undefined')S.shake=Math.max(S.shake,3);
    }
    if(!boss&&bossWas){root.classList.remove('v65-boss');}
    bossWas=!!boss;
  }

  function init(){setup();buildWeather();}
  function update(ts){if(!root)init();if(typeof S==='undefined'||!S.sun)return;const k=Math.min(3,(ts-(last||ts))/16.667);themeClock(ts);animateWorld(ts,k);bossScene();last=ts;}
  window.V65Visual={init,update};
})();
