/* V33 — Primera experiencia cinematográfica.
 * Capa visual no invasiva: no reemplaza combate, IA, progreso ni tutorial.
 */
(function(){
  'use strict';
  const KEY='defensa-castillo-v33-intro';
  let root=null, timer=0, raf=0, started=false;
  const $=(s)=>document.querySelector(s);
  const esc=(s)=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function build(){
    if(root) return;
    root=document.createElement('div'); root.id='v33Intro'; root.setAttribute('aria-hidden','true');
    root.innerHTML=`
      <div class="v33-backdrop"></div>
      <div class="v33-scan"></div>
      <div class="v33-content">
        <div class="v33-kicker">LAS CRÓNICAS DEL REINO</div>
        <div class="v33-crest">♜</div>
        <h1>DEFENSA DEL CASTILLO</h1>
        <p class="v33-sub">La frontera ha caído. Tu fortaleza es la última línea.</p>
        <div class="v33-heroes">
          <div class="v33-hero"><span>🏹</span><b>ARQUERO</b><small>Precisión · velocidad</small></div>
          <div class="v33-hero"><span>🔮</span><b>HECHICERO</b><small>Control · magia</small></div>
          <div class="v33-hero"><span>🏰</span><b>CASTILLO</b><small>Protege tus vidas</small></div>
        </div>
        <div class="v33-mission"><span>OBJETIVO</span><b>RESISTE 15 OLEADAS</b><small>Construye · mejora · combina · sobrevive</small></div>
        <button class="v33-skip" type="button">SALTAR INTRODUCCIÓN</button>
      </div>
      <div class="v33-tip"><i></i><span>PREPARANDO LAS DEFENSAS…</span></div>`;
    document.body.appendChild(root);
    root.querySelector('.v33-skip').addEventListener('click', finish);
    root.addEventListener('pointerdown',e=>e.stopPropagation());
  }

  function finish(){
    clearTimeout(timer); cancelAnimationFrame(raf);
    if(!root) return;
    root.classList.remove('show'); root.classList.add('hide');
    root.setAttribute('aria-hidden','true');
    try{localStorage.setItem(KEY,'1')}catch(e){}
    setTimeout(()=>{if(root)root.style.display='none'},520);
  }

  function animate(){
    if(!root||!root.classList.contains('show')) return;
    const t=performance.now()/1000;
    root.style.setProperty('--v33-pulse',(0.5+0.5*Math.sin(t*1.7)).toFixed(3));
    raf=requestAnimationFrame(animate);
  }

  function play(opts){
    opts=opts||{};
    build();
    const force=!!opts.force;
    let seen=false; try{seen=localStorage.getItem(KEY)==='1'}catch(e){}
    if(seen&&!force) return false;
    started=true; root.style.display='grid'; root.classList.remove('hide'); void root.offsetWidth; root.classList.add('show'); root.setAttribute('aria-hidden','false');
    const tip=root.querySelector('.v33-tip span');
    const lines=['PREPARANDO LAS DEFENSAS…','LOS HÉROES HAN LLEGADO…','LA PRIMERA OLEADA SE ACERCA…'];
    let i=0; clearTimeout(timer);
    const step=()=>{if(!root.classList.contains('show'))return; if(i<lines.length){tip.textContent=lines[i++];timer=setTimeout(step,820)}else timer=setTimeout(finish,900)};
    step(); cancelAnimationFrame(raf); raf=requestAnimationFrame(animate);
    return true;
  }

  function init(){
    build();
    const original=window.beginGame;
    if(typeof original==='function' && !original.__v33Wrapped){
      const wrapped=function(){
        const first=(()=>{try{return localStorage.getItem(KEY)!=='1'}catch(e){return true}})();
        if(first){
          // La partida comienza inmediatamente; la introducción es una capa visual no bloqueante.
          original.apply(this,arguments);
          setTimeout(()=>play(),120);
        } else original.apply(this,arguments);
      };
      wrapped.__v33Wrapped=true; wrapped.__v33Original=original; window.beginGame=wrapped;
    }
    window.V33Experience={version:'33.0',play,finish,mobileSafe:true};
  }

  // Este script está al final del documento y debe envolver beginGame antes de que main.js registre sus listeners.
  init();
})();
