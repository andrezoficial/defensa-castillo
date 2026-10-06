/* V27 — Economía y Progresión: decisiones de recompensa por oleada. */
(function(){
  const V={};
  const ensure=()=>{ GameState.v27=GameState.v27||{goldBoost:0,damageBoost:0,rangeBoost:0,rewardOpen:false}; return GameState.v27; };
  function inject(){
    if(document.getElementById('v27Reward'))return;
    const el=document.createElement('div'); el.id='v27Reward'; el.className='v27-reward'; el.innerHTML=`<div class="v27-card"><div class="v27-kicker">RECOMPENSA DE OLEADA</div><h2 id="v27Title">Elige tu ventaja</h2><p id="v27Sub">Tu decisión afectará la siguiente fase de la defensa.</p><div id="v27Choices" class="v27-choices"></div><small id="v27Auto">Elección automática en 8 s</small></div>`;
    document.body.appendChild(el);
  }
  function choices(){
    const s=ensure(), w=GameState.wave;
    return [
      {id:'gold',icon:'✦',name:'Tesoro',desc:`+${30+w*4} oro inmediato`,pick:()=>{const g=30+w*4;GameState.gold+=g;GameState.goldEarned+=g;showRewardToast(`✦ +${g} oro extra`);}},
      {id:'damage',icon:'⚔',name:'Furia',desc:'+10% daño durante la próxima oleada',pick:()=>{s.damageBoost=1;showRewardToast('⚔ Daño +10% · próxima oleada');}},
      {id:'range',icon:'◎',name:'Alcance',desc:'+12% alcance durante la próxima oleada',pick:()=>{s.rangeBoost=1;showRewardToast('◎ Alcance +12% · próxima oleada');}}
    ];
  }
  function open(onPicked){
    inject(); const s=ensure(); s.rewardOpen=true; s.onPicked=onPicked||null; GameState.paused=true; S.running=false;
    const box=document.getElementById('v27Choices'); box.innerHTML='';
    choices().forEach(c=>{const b=document.createElement('button');b.className='v27-choice';b.innerHTML=`<span>${c.icon}</span><b>${c.name}</b><small>${c.desc}</small>`;b.onclick=()=>pick(c);box.appendChild(b)});
    document.getElementById('v27Reward').classList.add('open');
    let n=8; const auto=document.getElementById('v27Auto'); auto.textContent=`Elección automática en ${n} s`;
    s.timer=setInterval(()=>{n--;auto.textContent=`Elección automática en ${Math.max(0,n)} s`;if(n<=0){clearInterval(s.timer);pick(choices()[0]);}},1000);
  }
  function pick(c){
    const s=ensure(); if(!s.rewardOpen)return; if(s.timer)clearInterval(s.timer); c.pick(); s.rewardOpen=false; GameState.paused=false; S.running=true; document.getElementById('v27Reward').classList.remove('open'); updateHUD(); Save.write(); if(typeof s.onPicked==='function')s.onPicked();s.onPicked=null;
  }
  V.waveReward=open; V.isOpen=()=>ensure().rewardOpen;
  V.mult={damage:()=>ensure().damageBoost?1.10:1,range:()=>ensure().rangeBoost?1.12:1};
  V.consume=()=>{const s=ensure();s.damageBoost=0;s.rangeBoost=0;};
  window.EconomyV27=V;
})();
