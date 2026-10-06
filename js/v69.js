/* Defensa del Castillo V6.9 — controlador de animación de personajes.
 * Usa clips GLB reales cuando el asset los trae y, si no existen, aplica un
 * fallback procedural ligero para conservar movimiento y personalidad visual.
 */
(function(){
  'use strict';
  const mixers=new Set(), controllers=new Set();
  // Estados que usan clips reales del GLB (el resto usa el movimiento procedural de reserva).
  // archer y wizard: idle en bucle + attack de una sola pasada que vuelve a idle (ver play/update).
  const REAL={zombie:['idle','walk'],wyvern:['idle','walk'],wyvernboss:['idle','walk'],solani:['idle'],orc:['walk'],orcrun:['walk'],darkknight:['idle','walk'],
    archer:['attack'],wizard:[],elder_ogre:['idle','walk','attack','death'],dragon:['idle','walk','attack','death']};
  // velocidad del clip por modelo: el orco camina a 38 u/s, así que su ciclo se frena para que los pies no patinen
  const SPEED={orc:.45,orcrun:.74,darkknight:.27,elder_ogre:.72,dragon:.9}; // darkknight: clip 'walk' reasignado del orco; 27 u/s con escala 108 // orcrun = mismo orc.glb con el clip 'run' (Balista Veloz, 90 u/s)
  const realOf=k=>REAL[k]||['idle','walk','attack','hit','death','phase'];
  const TOWER=k=>k==='archer'||k==='wizard';
  const reduced=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // el jefe dragón usa el clip 'flaping' (aleteo en sitio, bucle limpio) tanto parado como en marcha
  const KEYALIAS={
    wyvernboss:{idle:['flaping'],walk:['flaping']},
    orcrun:{idle:['run'],walk:['run']},
    darkknight:{idle:['walk'],walk:['walk']},
    elder_ogre:{idle:['idle'],walk:['walkforward','moveleft','moveright','runforward'],attack:['attack_powerattack','attack_movingleft','attack_movingright'],death:['recoil','stagger']},
    dragon:{idle:['stand'],walk:['walk','fly2'],attack:['attack01','attack02'],death:['die']}
  };
  const clipName=(clips,state,key)=>{
    if(!clips||!clips.length)return null;
    const aliases={idle:['idle','idol','breath','stand'],walk:['walk','run','move'],attack:['attack','shoot','cast','hit'],hit:['hit','hurt','damage'],death:['death','die'],phase:['roar','special','attack']};
    const wanted=((KEYALIAS[key]&&KEYALIAS[key][state])||aliases[state]||[state]).map(x=>x.toLowerCase());
    return clips.find(c=>wanted.some(w=>c.name.toLowerCase().includes(w)))||clips[0];
  };
  // Un grupo retirado de la escena conserva su padre inmediato, así que hay que subir hasta la raíz.
  const inScene=o=>{for(;o;o=o.parent)if(o.isScene)return true;return false};
  const ZC={};
  function zombieClips(root,clips,zv){
    const key=zv==null?'x':zv;if(ZC[key])return ZC[key];
    const names=new Set();root.traverse(o=>names.add(o.name));
    return ZC[key]=clips.map(cl=>new THREE.AnimationClip(cl.name,cl.duration,cl.tracks.filter(t=>names.has(t.name.slice(0,t.name.indexOf('.'))))));
  }
  function attach(group,modelKey){
    if(!group||!group.children.length)return group;
    const source=window.MODELS&&window.MODELS[modelKey];
    let clips=source&&source.animations||[];
    // el zombi trae 10 esqueletos y cada instancia conserva uno: se descartan las pistas de los demás
    if(modelKey==='zombie'&&clips.length)clips=zombieClips(group.children[0],clips,group.userData.zv);
    const mixer=clips.length&&THREE.AnimationMixer?new THREE.AnimationMixer(group.children[0]):null;
    const actions={};
    // solo se crean acciones para los clips que el juego usa de verdad (el wyvern trae 5 clips y solo se usan idle y walk)
    const used=REAL[modelKey]?[...new Set(REAL[modelKey].map(s=>clipName(clips,s,modelKey)).filter(Boolean))]:clips;
    if(mixer){used.forEach(c=>{actions[c.name]=mixer.clipAction(c)});mixers.add(mixer)}
    const c={group,key:modelKey,mixer,clips,actions,state:'idle',nextState:'idle',t:Math.random()*10,age:0,seen:false,off:{y:0,rx:0,ry:0,rz:0},flash:0,attack:0,death:0,phase:0,baseScale:group.scale.clone(),reduced:reduced()};
    group.userData.v69=c;controllers.add(c);
    play(c,/^orc/.test(modelKey)?'walk':'idle',true); // el orco no tiene clip idle: arranca ya caminando (evita la pose en T)
    return group;
  }
  function play(c,state,force,ms){
    if(!c||(!force&&c.state===state))return;
    c.state=state;c.t=0;c.back=0;
    const clip=realOf(c.key).includes(state)?clipName(c.clips,state,c.key):null;
    if(c.mixer&&clip){
      const tw=TOWER(c.key),once=state==='death'||(tw&&state==='attack');
      Object.values(c.actions).forEach(a=>{if(a!==c.actions[clip.name])a.fadeOut(.12)});
      const a=c.actions[clip.name];a.reset().fadeIn(tw&&state==='attack'?.08:.12);
      a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);a.clampWhenFinished=state==='death';
      let ts=SPEED[c.key]||1;
      if(tw&&state==='attack'){
        // el clip de ataque se acelera para caber entre dos disparos (y vuelve a idle al terminar)
        ts=ms>0?Math.min(4,Math.max(1,clip.duration*1000/(ms*.92))):1.5;
        c.back=clip.duration/ts;
      }
      a.setEffectiveTimeScale(ts);
      a.play();
      // torres en idle: desfasar el clip para que no se muevan todas a la vez
      if(tw&&state==='idle')a.time=Math.random()*clip.duration;
    }
  }
  function trigger(group,state,ms){const c=group&&group.userData&&group.userData.v69;if(!c)return;play(c,state,true,ms);if(state==='attack')c.attack=.22;if(state==='hit')c.flash=.16;if(state==='death')c.death=.7;if(state==='phase')c.phase=.9}
  function state(group,state){const c=group&&group.userData&&group.userData.v69;if(c)play(c,state,false)}
  function update(dt,ts){
    const d=Math.min(dt,50)/1000;
    mixers.forEach(m=>m.update(d));
    controllers.forEach(c=>{
      c.age+=d;
      if(inScene(c.group))c.seen=true;
      else if(c.seen||c.age>2){ // ya no está en la escena: liberar controlador y mezclador
        controllers.delete(c);
        if(c.mixer){c.mixer.stopAllAction();mixers.delete(c.mixer)}
        return;
      }
      c.t+=d;c.attack=Math.max(0,c.attack-d);c.flash=Math.max(0,c.flash-d);c.death=Math.max(0,c.death-d);c.phase=Math.max(0,c.phase-d);
      if(TOWER(c.key)&&c.state==='attack'&&c.back>0&&(c.back-=d)<=0)play(c,'idle',true);
      if(c.mixer&&realOf(c.key).includes(c.state))return;
      // Fallback para GLB sin clips: movimiento suave por estado.
      // Se calculan desplazamientos absolutos y se aplica solo la diferencia con el fotograma anterior,
      // así nada se acumula (antes los enemigos y torres derivaban con el tiempo).
      const g=c.group,s=c.baseScale,o=c.off;
      let ny=0,nrx=0,nry=0,nrz=0,k=1;
      if(c.state==='death'){
        const p=Math.max(0,c.death/.7);
        nrz=.22*(1-p);ny=-4.9*(1-p);
        g.scale.set(s.x*(.96+.04*p),s.y*p,s.z*(.96+.04*p));
      }else{
        if(!c.reduced){
          const walk=c.state==='walk';
          ny=(walk?Math.abs(Math.sin(ts*.012+c.t))*1.25:Math.sin(ts*.002+c.t)*.45)*.35;
          nrz=walk?Math.sin(ts*.012+c.t)*.035:Math.sin(ts*.0017+c.t)*.012;
          if(c.attack>0){const p=c.attack/.22,w=Math.sin((1-p)*Math.PI);nrx=-w*.09;k*=1+w*.045}
          if(c.flash>0)k*=1.025;
          if(c.phase>0){const p=c.phase/.9,w=Math.sin((1-p)*Math.PI);k*=1+w*.09;nry=w*.25}
        }
        g.scale.set(s.x*k,s.y*k,s.z*k);
      }
      g.position.y+=ny-o.y;g.rotation.x+=nrx-o.rx;g.rotation.y+=nry-o.ry;g.rotation.z+=nrz-o.rz;
      o.y=ny;o.rx=nrx;o.ry=nry;o.rz=nrz;
    });
  }
  function diagnostics(){
    const total=[...controllers].length,real=[...controllers].filter(c=>c.clips.length).length;
    return {characters:total,realAnimated:real,proceduralFallback:total-real};
  }
  window.V69Animations={attach,trigger,state,update,diagnostics};
})();
