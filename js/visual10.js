/* V10 — COMMERCIAL MEDIEVAL WORLD PASS
   Purely visual layer: no gameplay/state changes. Optimized for mobile.
*/
(function(){
  'use strict';
  if(!window.THREE || typeof buildWorld!=='function') return;

  const V10={root:null, water:[], flames:[], initialized:false};
  const oldBuildWorld=buildWorld;

  function mesh(geo,mat,x,y,z,rx=0,ry=0,rz=0){
    const m=new THREE.Mesh(geo,mat);
    m.position.set(x,y,z);m.rotation.set(rx,ry,rz);
    m.castShadow=false;m.receiveShadow=true;
    return m;
  }
  function mat(color,rough=1,metal=0){
    const m=new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
    return m;
  }
  function addRock(group,x,z,s=1){
    const g=new THREE.DodecahedronGeometry(3.2*s,1);
    const m=mesh(g,mat(0x4b4e4b,.96),x,2.3*s,z);
    m.scale.y=.72;m.rotation.y=(x*0.13+z*0.07);
    group.add(m);
    if(!S.lowPower){
      const moss=mesh(new THREE.DodecahedronGeometry(2.3*s,1),mat(0x52683e,1),x-.7*s,4.0*s,z+.3*s);
      moss.scale.set(1,.22,.85);group.add(moss);
    }
  }
  function addTreeSilhouette(group,x,z,s=1){
    // Lightweight silhouette trees: only 3 meshes each, used as distant scenery.
    const trunk=mesh(new THREE.CylinderGeometry(1.5*s,2.1*s,10*s,7),mat(0x3f2b1e),x,5*s,z);
    const crown=mesh(new THREE.ConeGeometry(7.5*s,16*s,8),mat(0x284d32),x,16*s,z);
    const crown2=mesh(new THREE.ConeGeometry(5.2*s,11*s,8),mat(0x35643b),x,25*s,z);
    group.add(trunk,crown,crown2);
  }
  function addRuin(group,x,z,s=1){
    const stone=mat(0x666660,.98);
    for(let i=0;i<5;i++){
      const a=i*1.256+0.2;
      const px=x+Math.cos(a)*9*s,pz=z+Math.sin(a)*7*s;
      const wall=mesh(new THREE.BoxGeometry(7*s,13*s*(.55+((i*17)%5)/10),3*s),stone,px,5*s,pz,0,a*.5,0);
      group.add(wall);
    }
    const fire=mesh(new THREE.CylinderGeometry(1.7*s,2.2*s,1.1*s,10),mat(0x2c2118),x,1.0*s,z);
    group.add(fire);
    if(!S.lowPower){
      const light=new THREE.PointLight(0xff9a3d,.75,48*s,2);
      light.position.set(x,6*s,z);group.add(light);
      const flame=mesh(new THREE.ConeGeometry(1.5*s,4.5*s,7),new THREE.MeshBasicMaterial({color:0xffb34d,transparent:true,opacity:.9}),x,4*s,z);
      flame.userData.v10Flame=true;group.add(flame);V10.flames.push({m:flame,base:4*s,phase:x*.09+z*.05});
    }
  }
  function addWater(group,x,z,w,d,rot=0){
    const geo=new THREE.PlaneGeometry(w,d,1,1);
    const m=new THREE.MeshStandardMaterial({color:0x3b7890,roughness:.18,metalness:.05,transparent:true,opacity:.72});
    const p=mesh(geo,m,x,.38,z,-Math.PI/2,rot,0);
    p.receiveShadow=true;p.userData.v10Water=true;group.add(p);V10.water.push({m:p,phase:x*.03+z*.02});
    // shoreline
    const ring=mesh(new THREE.RingGeometry(.92,.99,48),new THREE.MeshBasicMaterial({color:0x8eac8d,transparent:true,opacity:.3,side:THREE.DoubleSide}),x,.42,z,-Math.PI/2,0,0);
    ring.scale.set(w/2,d/2,1);group.add(ring);
  }

  function addWorldArt(){
    if(V10.initialized) return;
    V10.initialized=true;
    const g=new THREE.Group();g.name='V10_CommercialWorldArt';scene.add(g);V10.root=g;

    // Terrain zoning: darker meadow islands around the playable road.
    const meadowMat=new THREE.MeshLambertMaterial({color:0x3e663d,transparent:true,opacity:.16,depthWrite:false});
    const zones=[
      [115,92,115,72],[300,430,150,78],[520,82,145,62],[625,400,170,82],
      [455,260,100,55],[155,350,115,62]
    ];
    zones.forEach((z,i)=>{
      const p=mesh(new THREE.CircleGeometry(1,48),meadowMat,z[0],.16,z[1],-Math.PI/2);
      p.scale.set(z[2],z[3],1);p.renderOrder=1;g.add(p);
    });

    // Natural path markers are intentionally omitted here: the core engine owns the route geometry.
    // The landmark/stone clusters stay outside gameplay logic and remain purely decorative.

    // Landmark clusters make the battlefield read as a place, not a blank arena.
    addRuin(g,105,390,.85);
    addRuin(g,615,92,.72);
    addRuin(g,520,420,.68);

    // Water features: one pond and two small channels, kept away from build slots.
    addWater(g,105,95,62,38,-.18);
    addWater(g,655,330,48,27,.32);

    // Distant tree silhouettes reinforce depth at very low geometry cost.
    const trees=[[35,35,5.2],[95,25,4.3],[205,40,4.8],[350,28,4.1],[485,32,5.0],[590,38,4.2],[715,40,4.8],
                 [45,455,5.1],[180,465,4.2],[330,450,4.8],[475,470,4.1],[610,455,5.0],[750,440,4.3]];
    trees.forEach(t=>addTreeSilhouette(g,t[0],t[1],t[2]));

    // Small warm lights around the castle/entrance improve visual hierarchy.
    [[725,135],[725,185],[755,115],[755,205]].forEach((p,i)=>{
      const l=new THREE.PointLight(i%2?0xffc36b:0xff8c4a,.55,70,2);l.position.set(p[0],10,p[1]);g.add(l);
      const orb=mesh(new THREE.SphereGeometry(1.2,8,8),new THREE.MeshBasicMaterial({color:0xffb45a}),p[0],10,p[1]);g.add(orb);
    });

    // Commercial-grade atmospheric lights: soft cool fill + warm key.
    const fill=new THREE.DirectionalLight(0x8fb9ff,.26);fill.position.set(-300,260,-220);fill.target.position.set(400,0,250);g.add(fill,fill.target);
    const warm=new THREE.DirectionalLight(0xffc37b,.18);warm.position.set(500,180,650);warm.target.position.set(400,0,250);g.add(warm,warm.target);

    // A restrained vignette-like haze plane at the horizon.
    const haze=new THREE.Mesh(
      new THREE.PlaneGeometry(2200,650),
      new THREE.MeshBasicMaterial({color:0x9eb7c5,transparent:true,opacity:.045,depthWrite:false})
    );
    haze.rotation.x=-Math.PI/2;haze.position.set(400,2,250);haze.renderOrder=2;g.add(haze);

    requestAnimationFrame(animateArt);
  }

  function animateArt(ts){
    requestAnimationFrame(animateArt);
    const t=ts*.001;
    for(const w of V10.water){
      w.m.material.opacity=.68+Math.sin(t*1.4+w.phase)*.035;
      w.m.position.y=.38+Math.sin(t*1.1+w.phase)*.025;
    }
    for(const f of V10.flames){
      const q=1+Math.sin(t*5+f.phase)*.12;
      f.m.scale.set(q,1+Math.sin(t*7+f.phase)*.16,q);
      f.m.position.y=f.base+Math.sin(t*6+f.phase)*.35;
    }
  }

  buildWorld=function(){
    oldBuildWorld();
    // Color pipeline is already compatible with Three versions used by the project.
    if(window.renderer){
      try{
        renderer.toneMapping=THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure=1.03;
        renderer.shadowMap.type=THREE.PCFSoftShadowMap;
        if('outputColorSpace' in renderer) renderer.outputColorSpace=THREE.SRGBColorSpace;
      }catch(e){}
    }
    addWorldArt();
  };
})();
