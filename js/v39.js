/* V39 — Combate táctil avanzado / UX Mobile.
 * Pulido de interacción de un dedo sobre V38: cámara, selección, colocación y feedback.
 * No sustituye la entrada existente; añade una capa segura para móviles.
 */
(function(){
  'use strict';
  const coarse=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||navigator.maxTouchPoints>0;
  const small=Math.min(innerWidth,innerHeight)<=900;
  if(!coarse&&!small){window.MobileV39={version:'39.0',mobile:false};return;}
  document.documentElement.classList.add('mobile-v39');

  function addCameraReset(){
    const host=document.getElementById('camControls');
    if(!host||document.getElementById('camReset'))return;
    const b=document.createElement('button');
    b.id='camReset'; b.className='iconBtn'; b.type='button';
    b.title='Centrar cámara'; b.setAttribute('aria-label','Centrar cámara'); b.textContent='⌂';
    host.insertBefore(b,host.firstChild);
    b.addEventListener('click',function(){
      if(!window.S)return;
      S.centerX=400; S.centerZ=250; S.az=0; S.zoom=1;
      if(typeof applyZoom==='function')applyZoom();
      if(typeof camSync==='function')camSync();
      if(window.MobileV38&&MobileV38.tap)MobileV38.tap();
    });
  }

  function addMobileHint(){
    const game=document.getElementById('gameHost');
    if(!game||document.getElementById('v39TouchHint'))return;
    const d=document.createElement('div');
    d.id='v39TouchHint';
    d.innerHTML='<b>TOCA</b> para seleccionar · <b>ARRASTRA</b> para mover · <b>PELLIZCA</b> para zoom';
    game.appendChild(d);
    let timer=setTimeout(()=>{d.classList.add('hide');setTimeout(()=>d.remove(),500)},5200);
    game.addEventListener('pointerdown',function(e){
      if(e.pointerType!=='touch')return;
      clearTimeout(timer); d.classList.add('hide'); setTimeout(()=>d.remove(),450);
    },{once:true,passive:true});
  }

  function softenTouchButtons(){
    document.querySelectorAll('button').forEach(function(b){
      b.style.touchAction='manipulation';
      b.style.webkitUserSelect='none';
    });
  }

  function boot(){
    addCameraReset();
    addMobileHint();
    softenTouchButtons();
    window.MobileV39={version:'39.0',mobile:true,oneFingerPan:true,pinchZoom:true,cameraReset:true};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
