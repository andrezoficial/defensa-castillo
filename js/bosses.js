// bosses.js — V4.0: jefes por fases.
// Los datos de cada jefe están en config.js (BOSS_DEFS). Aquí vive la lógica de cada fase.
// Al bajar de la fracción de vida de una fase, el jefe queda invulnerable ~1,3 s, avisa y ejecuta sus acciones.

function startBossPhase(e, ph) {
  e.phaseIdx++;
  e.phaseLock = S.now + 1300;
  S.shake = 8;if(window.CombatV25)CombatV25.hit(e,'fire',true);
  S.slow = 350;
  sfx.phase();
  ringFx(e.x, e.y, 0xff5544, 100, 700);
  waveFx(e.x, e.y, 0xffa066, 160, 700);
  burst(e.x, 30, e.y, 0xff6644, 22, 80);
  flashScreen('#ff3020', 0.22, 380);
  showWaveBanner(`♛ FASE ${e.phaseIdx + 1} · ${ph.title}`);
  ph.do.forEach((id) => runBossAction(e, id));
}

function summonFx(x, y) {
  waveFx(x, y, 0xb07aff, 38, 450);
  burst(x, 8, y, 0xb07aff, 8, 40);
}

function summonGroup(e, key, n) {
  for (let i = 0; i < n; i++) {
    later(500 + i * 260, () => {
      if (e.dead) return;
      const x = e.x + rnd(60), y = e.y + rnd(36);
      if (key === 'goblin') spawnMinionAt(x, y, e.wpIndex, e.travel);
      else spawnTypeAt(key, x, y, e.wpIndex, e.travel);
      summonFx(x, y);
    });
  }
}

function runBossAction(e, id) {
  if (id === 'summon') {
    summonGroup(e, 'goblin', 2 + Math.floor(GameState.wave / 5));
  } else if (id === 'elite') {
    summonGroup(e, 'saboteur', 2);
    summonGroup(e, 'healer', 1);
  } else if (id === 'wraiths') {
    summonGroup(e, 'wraith', 3);
  } else if (id === 'enrage') {
    e.enraged = true;
    e.baseSpeed *= 1.45;
    if (e.aura) e.aura.material.color.setHex(0xff3322);
    showRewardToast('♛ ¡El jefe entra en furia!');
  } else if (id === 'shield') {
    e.maxShield = Math.round(e.maxHp * BOSS_SHIELD_FRAC);
    e.shield = e.maxShield;
    if (!e.shieldMesh) {
      e.shieldMesh = new THREE.Mesh(geo('Sphere', 1, 16, 12), tmat(0x6ec3ff, 0.25));
      e.shieldMesh.scale.setScalar(e.bd.size * 0.62);
      e.shieldMesh.position.y = e.bd.size * 0.5;
      e.mesh.add(e.shieldMesh);
    }
    e.shieldMesh.visible = true;
    sfx.shieldUp();
    showRewardToast('♛ ¡Escudo arcano! Rómpelo para dañar al jefe');
  } else if (id === 'stomp') {
    e.stomping = true;
    e.stompT = 2500;
    showRewardToast('♛ ¡El jefe aturdirá tus torres con pisotones!');
  }
}

// Pisotón: aturde las torres cercanas.
function bossStomp(e) {
  sfx.stomp();
  S.shake = Math.max(S.shake, 6);
  waveFx(e.x, e.y, 0xd9a25a, STOMP_RANGE, 520);
  burst(e.x, 6, e.y, 0x8a6a42, 14, 70);
  for (const t of GameState.towers) {
    if (Math.hypot(t.x - e.x, t.y - e.y) < STOMP_RANGE) stunTower(t, STOMP_STUN_MS);
  }
}

function breakShield(e) {
  e.shield = 0;
  if (e.shieldMesh) e.shieldMesh.visible = false;
  sfx.shieldBreak();
  S.shake = Math.max(S.shake, 5);
  waveFx(e.x, e.y, 0x9fd8ff, 90, 450);
  burst(e.x, e.bd ? e.bd.size * 0.5 : 30, e.y, 0x9fd8ff, 16, 75);
}

function shieldHitFx(e) {
  burst(e.x, e.bd ? e.bd.size * 0.5 : 30, e.y, 0x9fd8ff, 3, 30);
}
