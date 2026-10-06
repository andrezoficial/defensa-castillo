/* V12 — PREMIUM CHARACTER ART DIRECTION
   Capa visual independiente: identidad de facciones, élites y feedback de animación.
   No modifica estadísticas ni lógica de combate. */
(()=>{
  const ELITE={brute:0x8fd35a,raider:0xe0a34a,ogre:0x6f9b48,saboteur:0x8b7cff,healer:0x55e89a,wraith:0x8bd8ff,boss:0xffc95c};
  const FACTION={goblin:0x9bcf63,brute:0x74b94a,raider:0xc88b36,ogre:0x6e8f4d,swarm:0xd6a63b,saboteur:0x6f63a8,healer:0x58d79b,wraith:0x7dcaff,boss:0xf2b94b};
  const tracked=new WeakSet();
  const premiumMat=(m,key)=>{
    if(!m||m.__v12)return;
    m.__v12=true;
    if(m.color){
      const c=ELITE[key]||FACTION[key]||0xffffff;
      // Acento sutil: conserva las texturas originales y evita pintar el personaje como bloque.
      if(key!=='goblin') m.color.lerp(new THREE.Color(c), key==='boss'?.12:.07);
    }
    if('roughness' in m) m.roughness=Math.min(0.9,Math.max(.48,m.roughness||.65));
    if('metalness' in m && (key==='brute'||key==='raider'||key==='boss'||key==='saboteur')) m.metalness=Math.max(m.metalness||0,.18);
  };
  function addEliteFX(e){
    if(!e.mesh||e.mesh.userData.v12)return;
    e.mesh.userData.v12=true;
    const col=ELITE[e.key]||ELITE.boss;
    e.mesh.traverse(o=>{if(o.isMesh&&o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>premiumMat(m,e.key));}});
    // Halo pequeño en el suelo: refuerza la lectura de la unidad sin tapar el mapa.
    if(e.key!=='goblin'&&e.key!=='swarm'){
      const ring=new THREE.Mesh(new THREE.RingGeometry(Math.max(8,e.hb*.22),Math.max(10,e.hb*.28),24),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:e.isBoss?.34:.16,depthWrite:false,side:THREE.DoubleSide}));
      ring.rotation.x=-Math.PI/2; ring.position.y=.7; ring.renderOrder=3; e.mesh.add(ring); e.__v12Ring=ring;
    }
    if(e.isBoss||e.key==='brute'||e.key==='raider'||e.key==='wraith'){
      const badge=new THREE.Group(); badge.position.y=e.hb+12;
      const outer=new THREE.Mesh(new THREE.RingGeometry(5,6.5,6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.88,depthWrite:false}));
      const core=new THREE.Mesh(new THREE.CircleGeometry(4.2,6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.16,depthWrite:false}));
      outer.rotation.x=core.rotation.x=-Math.PI/2; badge.add(outer,core); badge.userData.v12Badge=true; e.mesh.add(badge); e.__v12Badge=badge;
    }
  }
  function tick(t){
    const gs=window.GameState;
    if(gs&&gs.enemies){
      for(const e of gs.enemies){
        if(!e.mesh||tracked.has(e.mesh)) continue;
        tracked.add(e.mesh); addEliteFX(e);
      }
      for(const e of gs.enemies){
        if(!e.mesh||e.dead)continue;
        const pulse=1+Math.sin(t/240+(e.seed||0))*.035;
        if(e.__v12Ring){e.__v12Ring.scale.setScalar(pulse);e.__v12Ring.material.opacity=(e.isBoss?.28:.12)+Math.max(0,Math.sin(t/260+(e.seed||0)))*.08;}
        if(e.__v12Badge){e.__v12Badge.rotation.y=t/1300+(e.seed||0);e.__v12Badge.position.y=e.hb+11+Math.sin(t/220+(e.seed||0))*1.2;}
      }
    }
    if(window.GameState?.towers){
      for(const tw of GameState.towers){
        if(!tw.fig||tw.fig.userData.v12Tower)continue;
        tw.fig.userData.v12Tower=true;
        tw.fig.traverse(o=>{if(o.isMesh&&o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.color&&'roughness' in m)m.roughness=.58;});}});
      }
    }
    requestAnimationFrame(tick);
  }
  window.CharacterV12={addEliteFX};
  requestAnimationFrame(tick);
})();
