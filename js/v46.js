/* V46 — High Fidelity Mobile Characters
   Visual-only pass. Keeps V45 bug fixes and gameplay untouched. */
(function(){
  'use strict';
  if(!window.THREE) return;
  window.V46Visual={version:'46-high-fidelity-mobile',scope:'characters-only'};
  function quality(root){
    if(!root||root.userData.v46Quality)return;
    root.userData.v46Quality=true;
    root.traverse(o=>{
      if(!o.isMesh||!o.material)return;
      o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
      const ms=Array.isArray(o.material)?o.material:[o.material];
      ms.forEach(m=>{
        if(!m)return;
        if('flatShading' in m)m.flatShading=false;
        if('roughness' in m)m.roughness=Math.min(.9,Math.max(.38,m.roughness==null?.68:m.roughness));
        if('metalness' in m)m.metalness=Math.min(.55,Math.max(0,m.metalness||0));
        if('envMapIntensity' in m)m.envMapIntensity=.95;
        if(m.map){m.map.anisotropy=Math.max(m.map.anisotropy||1,4);m.map.needsUpdate=true;}
        m.needsUpdate=true;
      });
    });
  }
  function tune(){
    if(!window.renderer)return;
    try{
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.08;
      renderer.shadowMap.enabled=true;
      renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      if('outputColorSpace' in renderer)renderer.outputColorSpace=THREE.SRGBColorSpace;
      const max=Math.min(1.75,window.devicePixelRatio||1);
      const mobile=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
      renderer.setPixelRatio(mobile?Math.min(max,1.5):max);
    }catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tune,{once:true});
  else tune();
  window.addEventListener('resize',tune,{passive:true});
})();
