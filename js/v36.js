/* V36 — EVENTOS DINÁMICOS DE CAMPAÑA
 * Decisiones ligeras, objetivos opcionales, emboscadas y refuerzos.
 * Capa independiente: no reemplaza el motor de combate.
 */
(function(){
  'use strict';
  const EVENTS={
    valle:{
      5:{title:'EMBOSCADA DEL ALBA',text:'Exploradores avisan de una ruta secundaria. ¿Cómo reaccionas?',choices:[['🏰 Refuerza las murallas','Ganas 1 vida.','life',1],['💰 Abre el almacén','Recibes 70 de oro.','gold',70]]},
      10:{title:'CARAVANA PERDIDA',text:'Una caravana ofrece suministros antes del siguiente ataque.',choices:[['💰 Comprar suministros','Recibes 120 de oro.','gold',120],['⚔ Escoltarla','Recibes 60 de oro y 2 enemigos extra.','risk',2]]},
      15:{title:'ÚLTIMO AVISO',text:'El enemigo prepara un asalto final. Elige tu postura.',choices:[['🛡️ Defensa total','Ganas 2 vidas antes del jefe.','life',2],['🔥 Contraataque','+150 oro y 3 refuerzos.','riskGold',3]]}
    },
    paso:{
      5:{title:'RUTA OCULTA',text:'Un explorador descubre un atajo enemigo.',choices:[['🛡️ Bloquear el paso','Ganas 1 vida.','life',1],['⚔️ Preparar una emboscada','Recibes 120 de oro y 2 refuerzos.','riskGold',2]]},
      10:{title:'NOCHE DEL ECLIPSE',text:'La oscuridad cubre el camino. Necesitas decidir rápido.',choices:[['🔮 Encender runas','Recibes 110 de oro.','gold',110],['⚔️ Esperar al enemigo','Recibes 120 de oro y 3 refuerzos.','riskGold',3]]},
      15:{title:'PUERTA OSCURA',text:'El comandante del Eclipse se aproxima.',choices:[['🏰 Cerrar filas','Ganas 2 vidas.','life',2],['🔥 Asalto preventivo','Recibes 120 de oro y 3 refuerzos.','riskGold',3]]}
    },
    bosque:{
      5:{title:'SUSURROS ENTRE RAÍCES',text:'La niebla oculta un campamento enemigo.',choices:[['🌲 Explorar','Recibes 80 de oro.','gold',80],['⚔️ Atacar primero','Recibes 120 de oro y 3 refuerzos.','riskGold',3]]},
      10:{title:'NIEBLA VIVA',text:'El bosque cambia de ritmo. Una decisión puede salvar el castillo.',choices:[['🛡️ Proteger el núcleo','Ganas 1 vida.','life',1],['💰 Saquear el campamento','Recibes 150 de oro.','gold',150]]},
      15:{title:'BESTIA DE LAS RAÍCES',text:'La criatura despierta y exige una última decisión.',choices:[['🛡️ Resistir','Ganas 2 vidas.','life',2],['🔥 Desafiarla','Recibes 120 de oro y 4 refuerzos.','riskGold',4]]}
    },
    fortaleza:{
      5:{title:'ALARMA DE LA FORTALEZA',text:'Las torres detectan un segundo grupo enemigo.',choices:[['🏰 Reparar defensas','Ganas 1 vida.','life',1],['💰 Vaciar reservas','Recibes 130 de oro.','gold',130]]},
      10:{title:'ASALTO LEGENDARIO',text:'El enemigo reúne sus élites.',choices:[['🛡️ Preparar la guarnición','Ganas 2 vidas.','life',2],['🔥 Aceptar el desafío','Recibes 180 de oro y 4 refuerzos.','riskGold',4]]},
      15:{title:'LA ÚLTIMA BATALLA',text:'Todo el reino espera tu decisión.',choices:[['👑 Proteger al reino','Ganas 3 vidas.','life',3],['⚔️ Golpe final','Recibes 220 de oro y 5 refuerzos.','riskGold',5]]}
    }
  };
  let modal=null, pending=null, wrapped=false;
  const $=(s,r=document)=>r.querySelector(s);
  // Eventos vistos: solo durante la partida actual (antes se guardaban en localStorage y no volvían a salir nunca).
  const seen=()=>{const g=window.GameState;return g?(g.v36Seen=g.v36Seen||{}):{}};
  const mark=k=>{seen()[k]=1;};
  const mapId=()=>window.CURRENT_MAP?.id||'valle';
  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function showToast(t){if(window.showRewardToast)window.showRewardToast(t);}
  function build(){
    if(modal)return;
    modal=document.createElement('div');modal.id='v36EventModal';modal.innerHTML=`<div class="v36-backdrop"></div><section class="v36-card" role="dialog" aria-modal="true"><div class="v36-kicker">EVENTO DINÁMICO · CAMPAÑA</div><h2 id="v36Title"></h2><p id="v36Text"></p><div id="v36Choices" class="v36-choices"></div><small class="v36-note">La decisión afecta esta partida y queda registrada.</small></section>`;
    document.body.appendChild(modal);
  }
  function open(ev,w,resolve){
    build(); pending=resolve; $('#v36Title',modal).textContent=ev.title; $('#v36Text',modal).textContent=ev.text;
    const box=$('#v36Choices',modal);box.innerHTML='';
    ev.choices.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.innerHTML=`<b>${esc(c[0])}</b><small>${esc(c[1])}</small>`;b.onclick=()=>{pending=null;close();resolve(c);};box.appendChild(b);});
    modal.style.display='grid';requestAnimationFrame(()=>modal.classList.add('show'));
    showToast(`⚡ Evento de campaña · Oleada ${w}`);
  }
  function close(){if(!modal)return;modal.classList.remove('show');setTimeout(()=>modal.style.display='none',180);}
  // Lee la cantidad de oro prometida en el texto de la opción ("120 de oro", "+150 oro").
  function goldOf(c){const m=String(c[1]).match(/(\d+)\s*(?:de\s+)?oro/i);return m?+m[1]:0;}
  function apply(c){
    const g=window.GameState;if(!g)return;
    if(c[2]==='life'){g.lives=Math.min(g.maxLives||INITIAL_LIVES,g.lives+c[3]);g.lastLives=g.lives;showToast(`🛡️ +${c[3]} vida${c[3]>1?'s':''}`);}
    if(c[2]==='gold'){g.gold+=c[3];g.goldEarned+=c[3];g.lastGold=g.gold;showToast(`💰 +${c[3]} oro`);}
    if(c[2]==='risk'){const o=goldOf(c);if(o){g.gold+=o;g.goldEarned+=o;g.lastGold=g.gold;}g.v36Extra=(g.v36Extra||0)+c[3];showToast(`⚔️ ${o?'+'+o+' oro · ':''}${c[3]} refuerzos preparados`);}
    if(c[2]==='riskGold'){const o=goldOf(c)||120;g.gold+=o;g.goldEarned+=o;g.lastGold=g.gold;g.v36Extra=(g.v36Extra||0)+c[3];showToast(`🔥 +${o} oro · ${c[3]} refuerzos preparados`);}
    if(window.updateHUD)window.updateHUD();
  }
  function eventFor(w){return EVENTS[mapId()]?.[w]||null;}
  function intercept(){
    if(wrapped||typeof window.startWave!=='function')return false;
    const original=window.startWave;
    window.startWave=function(){
      if(pending)return; // hay una decisión abierta
      if(!window.GameState||window.GameState.waveActive)return original();
      const next=(window.GameState.wave||0)+1,ev=eventFor(next),id=mapId()+'-'+next;
      if(ev&&!seen()[id]&&typeof canAct==="function"&&canAct()&&!window.GameState.winPending){mark(id);open(ev,next,c=>{apply(c);original();});return;}
      original();
    };
    wrapped=true;return true;
  }
  function injectReflex(){
    if(!window.GameState||!window.GameState.v36Extra)return;
    const n=window.GameState.v36Extra;window.GameState.v36Extra=0;
    if(typeof window.spawnEnemy!=='function')return;
    for(let i=0;i<n;i++)setTimeout(()=>{if(window.GameState.waveActive)window.spawnEnemy('goblin');},1600+i*420);
  }
  function init(){
    build();
    const timer=setInterval(()=>{if(intercept())clearInterval(timer);},150);
    // El parche de refuerzos se aplica justo después de que una oleada haya arrancado.
    setInterval(injectReflex,700);
    window.CampaignEventsV36={version:'36.0',events:EVENTS,openEvent:(w)=>{const e=eventFor(w);if(e)open(e,w,apply);},mobileSafe:true};
  }
  init();
})();
