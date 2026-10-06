/* V15 — MUNDO DINÁMICO
 * Eventos ambientales ligeros: tormentas, relámpagos, viento y ambiente nocturno.
 * Capa visual independiente; no toca IA, daño, economía ni reglas.
 */
(function(){
'use strict';
let root=null, scene=null, S=null, flash=0, nextStorm=0, storm=0, lastWave=-1, reduced=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function setup(){
 if(root)return;
 root=document.createElement('div');root.id='v15Layer';root.setAttribute('aria-hidden','true');
 root.innerHTML='<div class="v15-clouds"></div><div class="v15-rain"></div><div class="v15-flash"></div><div class="v15-event"><span id="v15Icon">☁</span><b id="v15Title">EL CIELO CAMBIA</b><small id="v15Sub">EL VIENTO SE LEVANTA</small></div>';
 document.getElementById('gameHost').appendChild(root);
 reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function announce(icon,title,sub){
 const e=root.querySelector('.v15-event');
 document.getElementById('v15Icon').textContent=icon;document.getElementById('v15Title').textContent=title;document.getElementById('v15Sub').textContent=sub;
 e.classList.remove('show');void e.offsetWidth;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2200);
}
function lightning(ts){
 if(reduced||!root)return;
 if(flash>0){flash-=Math.min(1,(ts-(flash._last||ts))/16.667);flash._last=ts;root.classList.add('v15-lightning');root.style.setProperty('--v15-flash',String(clamp(flash,0,.9)));if(flash<=0)root.classList.remove('v15-lightning');}
}
function strike(ts){
 flash=.82;flash._last=ts;root.classList.add('v15-lightning');root.style.setProperty('--v15-flash','.82');
 if(S&&S.shake!==undefined)S.shake=Math.max(S.shake,1.5);
 setTimeout(()=>{if(Math.random()<.28){flash=.45;flash._last=performance.now();}},90);
}
function updateStorm(ts){
 const wave=typeof GameState!=='undefined'?GameState.wave:0;
 const map=typeof CURRENT_MAP!=='undefined'?CURRENT_MAP.id:'valle';
 const boss=typeof GameState!=='undefined'&&GameState.enemies&&GameState.enemies.some(e=>e.isBoss&&!e.dead);
 const phase=(wave%15)/15;
 const night=map==='fortaleza'||wave>=15;
 const target=map==='bosque'?.16:(map==='fortaleza'?.32:(wave>=10?.13:.035));
 storm+=(target-storm)*.025;
 root.style.setProperty('--v15-storm',storm.toFixed(3));root.style.setProperty('--v15-night',night?'1':'0');
 if(wave!==lastWave){
   if(wave>0&&wave%10===0)announce('☁','EL TIEMPO CAMBIA','EL VIENTO Y LAS NUBES SE INTENSIFICAN');
   lastWave=wave;
 }
 if(boss&&storm<.42){storm=.42;root.style.setProperty('--v15-storm','.42');}
 if(!reduced&&storm>.08&&ts>nextStorm){nextStorm=ts+7000+Math.random()*11000;if(Math.random()<.58){strike(ts);}}
 root.style.setProperty('--v15-wind',(0.35+storm*1.8).toFixed(2));
}
function init(sc,state){scene=sc;S=state;setup();nextStorm=performance.now()+5000+Math.random()*5000;}
function update(ts){if(!root)init(scene,S);if(!root)return;updateStorm(ts);lightning(ts);}
window.V15Visual={init,update};
})();
