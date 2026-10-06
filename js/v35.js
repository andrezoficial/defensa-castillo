/* V35 — CAMPAÑA VIVA
 * Identidad narrativa, objetivos y eventos ligeros por territorio.
 * No sustituye combate, progreso ni IA; funciona como capa de experiencia.
 */
(function(){
  'use strict';
  const MAP_DATA={
    valle:{chapter:'I',motto:'EL PRIMER MURO',story:'El Alba vuelve a iluminar las murallas, pero una primera horda ya marcha hacia el reino.',objective:'Sobrevive y demuestra que el castillo está preparado.',secondary:'Conserva al menos 50% de las vidas.',events:[['5','La primera embestida','Los enemigos pesados entran en escena.'],['10','Señales en el horizonte','La presión aumenta: combina magia y proyectiles.'],['15','El guardián del Alba','El jefe final de esta etapa entra en combate.']],reward:'Corona del Alba'},
    paso:{chapter:'II',motto:'EL CAMINO SOMBRÍO',story:'El Eclipse cubre el paso. Los enemigos conocen rutas ocultas y atacan con mayor fuerza.',objective:'Supera las oleadas usando posiciones defensivas inteligentes.',secondary:'Termina con al menos 70% de las vidas.',events:[['5','Marcha de élite','Una formación protegida avanza por el paso.'],['10','La sombra se divide','Aparecen amenazas rápidas y saboteadores.'],['15','Señor del Eclipse','El comandante oscuro reclama el camino.']],reward:'Medalla del Eclipse'},
    bosque:{chapter:'III',motto:'EL BOSQUE MALDITO',story:'Las raíces esconden enemigos y la niebla reduce el tiempo para reaccionar.',objective:'Domina la defensa combinada contra amenazas especiales.',secondary:'Derrota al jefe sin perder más de 5 vidas.',events:[['5','La arboleda despierta','La horda llega protegida por criaturas de apoyo.'],['10','Niebla de guerra','Sanadores y saboteadores aparecen juntos.'],['15','La bestia de las raíces','Un jefe enfurecido protege el bosque.']],reward:'Reliquia del Bosque'},
    fortaleza:{chapter:'IV',motto:'LA ÚLTIMA LÍNEA',story:'La Fortaleza del Eclipse es el último bastión. Todo lo aprendido será puesto a prueba.',objective:'Resiste la campaña completa y protege la última muralla.',secondary:'Consigue la máxima cantidad de estrellas posible.',events:[['5','Asalto coordinado','Las fuerzas enemigas atacan con varios roles.'],['10','Alerta legendaria','Las élites aceleran el asedio.'],['15','El Señor del Eclipse','La batalla decisiva comienza.']],reward:'Corona de la Fortaleza'}
  };
  const key='defensa-castillo-v35-events';
  const $=(s,r=document)=>r.querySelector(s);
  let modal, missionBtn, lastWave=-1;
  function cfg(){return MAP_DATA[window.CURRENT_MAP?.id]||MAP_DATA.valle}
  function seen(){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return {}}}
  function mark(id){const x=seen();x[id]=1;try{localStorage.setItem(key,JSON.stringify(x))}catch(e){}}
  function showToast(msg){if(window.showRewardToast)window.showRewardToast(msg);else if(window.V23Experience?.toast)V23Experience.toast(msg)}
  function build(){
    if(modal)return;
    modal=document.createElement('div');modal.id='v35MissionModal';modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="v35-backdrop"></div><section class="v35-card" role="dialog" aria-label="Misión de campaña">
      <button class="v35-close" type="button">×</button><div class="v35-kicker">CAMPAÑA VIVA · TERRITORIO ${cfg().chapter}</div>
      <div class="v35-hero"><span class="v35-icon">${icon()}</span><div><small>${esc(window.CURRENT_MAP?.name||'Territorio')}</small><h2>${esc(cfg().motto)}</h2><p>${esc(cfg().story)}</p></div></div>
      <div class="v35-grid"><div><small>OBJETIVO PRINCIPAL</small><b>${esc(cfg().objective)}</b></div><div><small>OBJETIVO SECUNDARIO</small><b>${esc(cfg().secondary)}</b></div><div><small>RECOMPENSA DE ETAPA</small><b>🏆 ${esc(cfg().reward)}</b></div></div>
      <h3>EVENTOS DE LA CAMPAÑA</h3><div class="v35-events">${cfg().events.map(e=>`<div><span>OLEADA ${e[0]}</span><b>${esc(e[1])}</b><small>${esc(e[2])}</small></div>`).join('')}</div>
      <button class="v35-primary" type="button">⚔ CONTINUAR DEFENSA</button></section>`;
    document.body.appendChild(modal);$('.v35-close',modal).onclick=close;$('.v35-primary',modal).onclick=close;modal.addEventListener('pointerdown',e=>{if(e.target===modal||e.target.classList.contains('v35-backdrop'))close()});
  }
  function icon(){return ({valle:'🌄',paso:'🌘',bosque:'🌲',fortaleza:'🏰'}[window.CURRENT_MAP?.id]||'🏰')}
  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function open(){build(); modal.style.display='grid';const card=modal.querySelector('.v35-card');card.classList.remove('hide');void card.offsetWidth;card.classList.add('show');modal.setAttribute('aria-hidden','false')}
  function close(){if(!modal)return;const card=modal.querySelector('.v35-card');card.classList.remove('show');card.classList.add('hide');modal.setAttribute('aria-hidden','true');setTimeout(()=>modal.style.display='none',220)}
  function addButton(){
    const host=$('#v23Mission'); if(!host||missionBtn)return;
    missionBtn=document.createElement('button');missionBtn.id='v35MissionBtn';missionBtn.type='button';missionBtn.innerHTML='📜 MISIÓN';missionBtn.title='Ver misión de campaña';missionBtn.onclick=open;host.insertAdjacentElement('afterend',missionBtn)
  }
  function updateMission(){
    const text=$('#v23MissionText'), prog=$('#v23MissionProgress');if(!text)return;
    const w=window.GameState?.wave||0;const next=cfg().events.find(e=>Number(e[0])>w);
    text.textContent=next?`${cfg().objective} · ${next[1]}`:cfg().objective;
    prog.textContent=Math.min(100,Math.round(w/15*100))+'%';
  }
  function eventTick(){
    const g=window.GameState;if(!g||!g.started)return;
    const w=g.wave||0;if(w===lastWave)return;lastWave=w;updateMission();
    const ev=cfg().events.find(e=>Number(e[0])===w);if(ev){const id=(window.CURRENT_MAP?.id||'valle')+'-'+w;if(!seen()[id]){mark(id);showToast(`📜 ${ev[1]} · ${ev[2]}`);}}
  }
  function init(){
    if(!window.CURRENT_MAP||!window.GameState){setTimeout(init,120);return}
    build();addButton();updateMission();
    window.V35Campaign={version:'35.0',open,close,config:()=>({...cfg()}),mobileSafe:true};
    setInterval(eventTick,300);
  }
  init();
})();
