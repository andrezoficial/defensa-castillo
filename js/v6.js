/* Defensa del Castillo V6 — capa visual y de presentación.
 * No reemplaza el motor: añade atmósfera, minimapa, alertas y pulido dinámico.
 */
(function(){
  'use strict';
  let root, mini, ctx, lastTs=0, lastWave=-1, lastBoss=false, ambienceBuilt=false, embers=[], mist=[];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hex=(n)=>'#'+n.toString(16).padStart(6,'0');

  function setupDOM(){
    if(root) return;
    root=document.createElement('div'); root.id='v6Layer'; root.setAttribute('aria-hidden','true');
    root.innerHTML=`
      <div class="v6-sky"></div><div class="v6-vignette"></div>
      <div class="v6-season"><span id="v6SeasonIcon">☀</span><b id="v6SeasonName">VALLE DEL ALBA</b><small id="v6SeasonHint">EL REINO RESPIRA</small></div>
      <div class="v6-wave-intro"><span id="v6WaveIcon">⚔</span><b id="v6WaveTitle">OLEADA</b><small id="v6WaveSub">Las tropas enemigas se aproximan</small></div>
      <div class="v6-boss-alert"><span>♛</span><div><b id="v6BossTitle">JEFE</b><small id="v6BossSub">Una presencia oscura entra en el campo</small></div></div>
      <div class="v6-minimap"><div class="v6-mini-head"><span>MAPA TÁCTICO</span><b id="v6MiniWave">01</b></div><canvas id="v6MiniCanvas" width="180" height="108"></canvas><div class="v6-mini-legend"><i class="ally"></i> TORRES <i class="enemy"></i> ENEMIGOS <i class="castle"></i> CASTILLO</div></div>
      <div class="v6-corner-glow left"></div><div class="v6-corner-glow right"></div>`;
    document.getElementById('gameHost').appendChild(root);
    mini=document.getElementById('v6MiniCanvas'); ctx=mini.getContext('2d');
  }

  function theme(){
    const map=(typeof CURRENT_MAP!=='undefined')?CURRENT_MAP:null;
    const id=map&&map.id||'valle';
    const themes={
      valle:{icon:'☀',name:'VALLE DEL ALBA',hint:'CIELO CLARO · VIENTO SUAVE',a:'#d9e7c3',b:'#8db8ce'},
      paso:{icon:'◐',name:'PASO DEL ECLIPSE',hint:'CIELO CARGADO · SOMBRAS LARGAS',a:'#aaa9c7',b:'#4f536d'},
      bosque:{icon:'☾',name:'BOSQUE MALDITO',hint:'NIEBLA VIVA · LUCES ERRANTES',a:'#7ca68a',b:'#253f32'},
      fortaleza:{icon:'☾',name:'FORTALEZA DEL ECLIPSE',hint:'NOCHE PROFUNDA · ANTORCHAS',a:'#8d8db0',b:'#1d2030'}
    };
    const t=themes[id]||themes.valle;
    root.style.setProperty('--v6-a',t.a); root.style.setProperty('--v6-b',t.b);
    document.getElementById('v6SeasonIcon').textContent=t.icon;
    document.getElementById('v6SeasonName').textContent=t.name;
    document.getElementById('v6SeasonHint').textContent=t.hint;
  }

  function buildParticles(){
    if(ambienceBuilt || typeof scene==='undefined' || typeof THREE==='undefined') return;
    ambienceBuilt=true;
    const group=new THREE.Group(); group.name='V6Atmosphere'; scene.add(group); S.v6Atmosphere=group;
    const count=S.lowPower?28:55;
    for(let i=0;i<count;i++){
      const m=new THREE.Mesh(new THREE.SphereGeometry(.9+(i%3)*.35,6,6),new THREE.MeshBasicMaterial({color:i%4===0?0xffd783:0xc8e7ff,transparent:true,opacity:.28,depthWrite:false}));
      m.position.set(Math.random()*800,18+Math.random()*100,Math.random()*500); m.userData={speed:.3+Math.random()*.8,phase:Math.random()*6.28}; group.add(m); embers.push(m);
    }
    const mistCount=S.lowPower?5:9;
    for(let i=0;i<mistCount;i++){
      const g=new THREE.Mesh(new THREE.PlaneGeometry(150+Math.random()*90,35+Math.random()*30),new THREE.MeshBasicMaterial({color:0xdde8df,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide}));
      g.rotation.x=-Math.PI/2; g.position.set(Math.random()*800,1.5,Math.random()*500); g.userData={speed:(Math.random()-.5)*.16,phase:Math.random()*6.28}; group.add(g); mist.push(g);
    }
  }

  // La luz, el cielo y la niebla los gestiona ambience.js (paletas por mapa y oleada).
  // Antes esta capa los volvía a pisar cada fotograma: el fondo y la niebla tenían colores distintos y la
  // niebla empezaba en 700 con la cámara a ~740, tapando casi todo el mapa (sobre todo en vertical).
  function visualLighting(ts){
    const wave=(typeof GameState!=='undefined'?GameState.wave:0);
    const p=clamp((wave%15)/14,0,1);
    const night=(typeof CURRENT_MAP!=='undefined' && CURRENT_MAP.id==='fortaleza')?1:0;
    const dusk=.18 + p*.24 + night*.3;
    root.style.setProperty('--v6-dusk',String(dusk));
    embers.forEach((m,i)=>{m.material.opacity=(night?.42:.18)+Math.sin(ts/900+m.userData.phase)*.08});
  }

  function updateAtmosphere(ts,k){
    embers.forEach(m=>{m.position.y+=m.userData.speed*.025*(GameState.speedMultiplier||1)*k;m.position.x+=Math.sin(ts/1700+m.userData.phase)*.018*k;if(m.position.y>130)m.position.y=15; if(m.position.x>820)m.position.x=-10});
    mist.forEach(m=>{m.position.x+=m.userData.speed*k;if(m.position.x>900)m.position.x=-100;if(m.position.x<-120)m.position.x=850;m.position.z+=Math.sin(ts/2400+m.userData.phase)*.018*k});
  }

  function minimap(){
    if(!ctx||typeof PATH_POINTS==='undefined') return;
    const w=mini.width,h=mini.height; ctx.clearRect(0,0,w,h);
    ctx.fillStyle='rgba(8,13,15,.76)';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(230,190,100,.10)';ctx.lineWidth=1;for(let x=0;x<w;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=27){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    const mx=x=>x/800*w, my=y=>y/500*h;
    ctx.beginPath();PATH_POINTS.forEach((p,i)=>{const x=mx(p.x),y=my(p.y);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});ctx.strokeStyle='#caa466';ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
    ctx.beginPath();PATH_POINTS.forEach((p,i)=>{const x=mx(p.x),y=my(p.y);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});ctx.strokeStyle='rgba(236,211,164,.45)';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#e7bd5b';ctx.fillRect(mx(775)-5.5,my(150)-5.5,11,11);ctx.strokeStyle='#fff0bd';ctx.strokeRect(mx(775)-5.5,my(150)-5.5,11,11);
    if(typeof GameState!=='undefined'){
      GameState.towers.forEach(t=>{if(!t||!t.x)return;ctx.beginPath();ctx.arc(mx(t.x),my(t.y),3.2,0,Math.PI*2);ctx.fillStyle=t.type==='slow'?'#9fe0ff':t.type==='area'?'#ff9b45':'#f1d38b';ctx.fill()});
      GameState.enemies.forEach(e=>{if(e.dead)return;ctx.beginPath();ctx.arc(mx(e.x),my(e.y),e.isBoss?4:2,0,Math.PI*2);ctx.fillStyle=e.isBoss?'#ff5848':e.key==='healer'?'#64e6a1':e.key==='wraith'?'#9edbff':'#e66f58';ctx.fill()});
      document.getElementById('v6MiniWave').textContent=String(GameState.wave).padStart(2,'0');
    }
  }

  function wavePresentation(){
    const wave=GameState.wave;
    if(wave===lastWave) return;
    if(wave>0){
      const box=root.querySelector('.v6-wave-intro');
      document.getElementById('v6WaveTitle').textContent=`OLEADA ${wave}`;
      document.getElementById('v6WaveSub').textContent=(wave%BOSS_WAVE_INTERVAL===0)?'UNA PRESENCIA GIGANTE SE ACERCA':'LAS FUERZAS ENEMIGAS ENTRAN EN EL CAMPO';
      box.classList.remove('show');void box.offsetWidth;box.classList.add('show');
    }
    lastWave=wave;
  }

  function bossPresentation(){
    const boss=GameState.enemies.some(e=>e.isBoss&&!e.dead);
    if(boss&&!lastBoss){
      const e=GameState.enemies.find(x=>x.isBoss&&!x.dead);const box=root.querySelector('.v6-boss-alert');
      document.getElementById('v6BossTitle').textContent=(e&&e.name||'JEFE').toUpperCase();
      document.getElementById('v6BossSub').textContent='LAS MURALLAS TEMBLAN · PREPÁRATE';
      box.classList.remove('show');void box.offsetWidth;box.classList.add('show');
      document.getElementById('gameHost').classList.add('v6-boss-mode');
    }
    if(!boss&&lastBoss)document.getElementById('gameHost').classList.remove('v6-boss-mode');
    lastBoss=boss;
  }

  function init(){setupDOM();theme();buildParticles();}
  function update(ts){
    if(!root) init();
    if(typeof S==='undefined'||!S.sun) return;
    const k=Math.min(3,(ts-(lastTs||ts))/16.667);lastTs=ts;
    visualLighting(ts);updateAtmosphere(ts,k);minimap();wavePresentation();bossPresentation();
  }
  window.V6Visual={init,update};
})();
