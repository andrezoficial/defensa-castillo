/* V34 — MAPA MUNDIAL / CAMPAÑA
 * Convierte los mapas existentes en una experiencia de campaña visual.
 * No sustituye la lógica de mapas, progreso, economía ni combate.
 */
(function(){
  'use strict';
  const KEY='defensa-castillo-v34-intro';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
  const order=['valle','paso','bosque','fortaleza'];
  const icon={valle:'🌄',paso:'🌘',bosque:'🌲',fortaleza:'🏰'};
  const tier={valle:'I',paso:'II',bosque:'III',fortaleza:'IV'};
  const difficulty={valle:'NORMAL',paso:'DIFÍCIL',bosque:'ÉLITE',fortaleza:'LEGENDARIA'};
  const reward={valle:'×1',paso:'×1.5',bosque:'×2',fortaleza:'×2.5'};
  let campaign=null;

  function data(){return window.Progress&&Progress.data?Progress.data():{stars:{},crowns:0,upg:{}}}
  function unlocked(m){return !m.unlock || (data().stars[m.unlock]||0)>=1}

  function build(){
    if(campaign) return campaign;
    campaign=document.createElement('div'); campaign.id='v34Campaign'; campaign.setAttribute('aria-hidden','true');
    campaign.innerHTML=`
      <div class="v34-world-bg"></div><div class="v34-world-noise"></div>
      <div class="v34-world-card">
        <div class="v34-world-head"><div><small>LAS TIERRAS DEL ECLIPSE</small><h2>MAPA DE CAMPAÑA</h2><p>Conquista cada territorio, consigue estrellas y abre el camino hacia la Fortaleza del Eclipse.</p></div><button class="v34-close" type="button" aria-label="Cerrar">×</button></div>
        <div class="v34-progress"><span><b id="v34Done">0</b> / 4 territorios conquistados</span><i><em id="v34Bar"></em></i><strong id="v34Stars">0 / 12 ★</strong></div>
        <div id="v34Route" class="v34-route"></div>
        <div class="v34-foot"><span>★ Las estrellas se conservan por mapa</span><button id="v34Continue" type="button">CONTINUAR CAMPAÑA →</button></div>
      </div>`;
    document.body.appendChild(campaign);
    $('.v34-close',campaign).addEventListener('click',close);
    $('#v34Continue',campaign).addEventListener('click',()=>{const m=MAPS[CURRENT_MAP.id]; close(); if(typeof sfx!=='undefined')sfx.click(); showToast('⚔ '+m.name+' · prepara tus defensas');});
    campaign.addEventListener('pointerdown',e=>{if(e.target===campaign)close()});
    return campaign;
  }

  function render(){
    build();
    const d=data(), route=$('#v34Route',campaign);
    let done=0,totalStars=0;
    route.innerHTML=order.map((id,i)=>{
      const m=MAPS[id], open=unlocked(m), s=d.stars[id]||0, current=id===CURRENT_MAP.id;
      if(s>=1)done++; totalStars+=s;
      const next=i<order.length-1?MAPS[order[i+1]]:null;
      return `<div class="v34-node-wrap ${open?'open':'locked'} ${current?'current':''} ${s>=1?'cleared':''}">
        ${i?'<div class="v34-link '+(open?'lit':'')+'"></div>':''}
        <button class="v34-node" data-map="${id}" ${open?'':'disabled'}>
          <span class="v34-tier">${tier[id]}</span><span class="v34-icon">${icon[id]}</span>
          <span class="v34-name">${esc(m.name)}</span><span class="v34-stars">${stars(s)}</span>
          <span class="v34-diff">${difficulty[id]} · CORONAS ${reward[id]}</span>
          <small>${esc(m.desc)}</small>
          <b class="v34-state">${current?'JUGANDO':s>=1?'CONQUISTADO':open?'DESPLEGAR':'🔒 '+(m.unlock?MAPS[m.unlock].name:'')}</b>
        </button>
      </div>`;
    }).join('');
    $('#v34Done',campaign).textContent=done; $('#v34Stars',campaign).textContent=`${totalStars} / 12 ★`; $('#v34Bar',campaign).style.width=`${done/4*100}%`;
    route.querySelectorAll('[data-map]').forEach(btn=>btn.addEventListener('click',()=>select(btn.dataset.map)));
  }

  function select(id){
    const m=MAPS[id]; if(!m||!unlocked(m)) return;
    if(id===CURRENT_MAP.id){close(); showToast('⚔ '+m.name+' · mapa actual'); return;}
    try{localStorage.setItem(MAP_KEY,id)}catch(e){return}
    close();
    if(typeof sfx!=='undefined')sfx.click();
    setTimeout(()=>location.reload(),120);
  }

  function open(){render(); campaign.style.display='grid'; campaign.classList.remove('hide'); void campaign.offsetWidth; campaign.classList.add('show'); campaign.setAttribute('aria-hidden','false');}
  function close(){if(!campaign)return; campaign.classList.remove('show'); campaign.classList.add('hide'); campaign.setAttribute('aria-hidden','true'); setTimeout(()=>{if(campaign)campaign.style.display='none'},260)}
  function showToast(msg){if(window.showRewardToast)showRewardToast(msg);else if(window.V23Experience&&V23Experience.toast)V23Experience.toast(msg);}

  function patchRealm(){
    const btn=$('#realmBtn'); if(!btn||btn.__v34)return;
    btn.__v34=true;
    btn.addEventListener('click',function(ev){ev.stopImmediatePropagation(); open()},true);
  }

  function addCampaignBadge(){
    const chip=$('#bestChip'); if(!chip)return;
    chip.textContent='V34 · CAMPAÑA MUNDIAL'; chip.classList.add('v34-chip');
  }

  function init(){
    if(!window.MAPS||!window.Progress)return setTimeout(init,80);
    build(); addCampaignBadge(); patchRealm();
    window.V34Campaign={version:'34.0',open,close,render,mobileSafe:true};
  }
  init();
})();
