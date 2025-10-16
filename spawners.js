import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

import { scene, wildlifeGroup } from "./scene.js";
import {
  BEAR_DESPAWN_Z,
  ENEMY_PALETTE,
  LANES,
  PLAYER_BASE_Y,
  POLICE_DESIRED_GAP,
  WRONG_WAY_SPAWN_INTERVAL,
} from "./constants.js";
import { createCarBody, createPassenger, createBear, createPoliceCar } from "./entities.js";

export function spawnEnemy(state) {
  const lane = Math.floor(Math.random() * LANES.length);
  const allowWrongWay =
    state.score > 320 && state.wrongWayTimer >= WRONG_WAY_SPAWN_INTERVAL;
  const wrongWayChance = allowWrongWay ? 0.22 : 0.1;
  const isWrongWay =
    Math.random() < wrongWayChance && allowWrongWay;
  const spawnZ = isWrongWay
    ? -95 - Math.random() * 24
    : -140 - Math.random() * 40;

  for (const enemy of state.enemies) {
    if (
      enemy.laneIndex === lane &&
      Math.abs(enemy.mesh.position.z - spawnZ) < 24
    ) {
      return;
    }
  }

  const mesh = createCarBody(
    ENEMY_PALETTE[Math.floor(Math.random() * ENEMY_PALETTE.length)],
    {
      facingBackward: isWrongWay,
      passenger: isWrongWay ? createPassenger() : null,
    }
  );
  mesh.position.set(LANES[lane], PLAYER_BASE_Y, spawnZ);
  scene.add(mesh);

  if (isWrongWay) {
    const headlight = new THREE.PointLight(0xfff7cf, 1.6, 16, 2);
    headlight.position.set(0, 0.7, 1.4);
    mesh.add(headlight);
  }

  const forwardSpeed = 12 + Math.random() * 6;
  const wrongWaySpeed = 26 + Math.random() * 6;

  const enemyObj = {
    mesh,
    laneIndex: lane,
    direction: isWrongWay ? -1 : 1,
    speed: isWrongWay ? wrongWaySpeed : forwardSpeed,
    passed: false,
  };
  state.enemies.push(enemyObj);
  if (isWrongWay) {
    state.wrongWayTimer = 0;
  }

  // 逆走車の後ろを 1/4 の確率で警察が追尾
  if (isWrongWay && Math.random() < 0.25) {
    spawnPoliceChaser(state, enemyObj);
  }
}

export function spawnBear(state) {
  const lane = Math.floor(Math.random() * LANES.length);
  const spawnZ = -120 - Math.random() * 80;

  for (const enemy of state.enemies) {
    if (
      enemy.laneIndex === lane &&
      Math.abs(enemy.mesh.position.z - spawnZ) < 20
    ) {
      return;
    }
  }

  for (const bear of state.bears) {
    if (
      bear.laneIndex === lane &&
      Math.abs(bear.mesh.position.z - spawnZ) < 18
    ) {
      return;
    }
  }

  const mesh = createBear();
  mesh.position.set(
    LANES[lane],
    mesh.userData.baseY ?? 0.2,
    spawnZ
  );
  mesh.userData.bobOffset = Math.random() * Math.PI * 2;
  wildlifeGroup.add(mesh);

  state.bears.push({
    mesh,
    laneIndex: lane,
    bobPhase: Math.random() * Math.PI * 2,
    collided: false,
    armRaiseProgress: 0,
  });
}

export function clearEnemies(state) {
  state.enemies.forEach((enemy) => {
    scene.remove(enemy.mesh);
  });
  state.enemies = [];
}

export function clearBears(state) {
  state.bears.forEach((bear) => {
    wildlifeGroup.remove(bear.mesh);
  });
  state.bears = [];
}

export function updateEnemies(state, delta, onGameOver) {
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    const relativeSpeed =
      enemy.direction === -1
        ? state.player.speed + enemy.speed
        : state.player.speed - enemy.speed;
    enemy.mesh.position.z += relativeSpeed * delta;

    // Police siren blink and chase behavior
    if (enemy.isPolice) {
      // Siren animation
      enemy.sirenTimer = (enemy.sirenTimer || 0) + delta;
      const cycle = 0.18; // seconds per half-blink
      const phase = Math.floor((enemy.sirenTimer % (cycle * 2)) / cycle);
      const mats = enemy.mesh.userData.sirenMaterials;
      const lights = enemy.mesh.userData.sirenLights;
      if (mats && mats.length === 2) {
        const onIntensity = 0.9;
        const offIntensity = 0.12;
        if (phase === 0) {
          mats[0].emissiveIntensity = onIntensity;
          mats[1].emissiveIntensity = offIntensity;
        } else {
          mats[0].emissiveIntensity = offIntensity;
          mats[1].emissiveIntensity = onIntensity;
        }
      }
      if (lights && lights.length === 2) {
        const on = phase === 0 ? [1.0, 0.0] : [0.0, 1.0];
        lights[0].intensity = on[0] * 1.2;
        lights[1].intensity = on[1] * 1.2;
      }

      // Chase target if present
      if (enemy.chaseTarget && state.enemies.indexOf(enemy.chaseTarget) !== -1) {
        const target = enemy.chaseTarget;
        const gap = target.mesh.position.z - enemy.mesh.position.z; // positive if police behind
        const desired = POLICE_DESIRED_GAP; // desired gap distance
        const maxBoost = 6.5;
        const base = enemy.baseSpeed || enemy.speed;
        if (gap > desired + 2) {
          enemy.speed = Math.min(base + maxBoost, target.speed + 3.2);
        } else if (gap < desired - 1.2) {
          enemy.speed = Math.max(16, target.speed * 0.86);
        } else {
          enemy.speed = Math.max(16, target.speed * 0.98);
        }
        // keep lane aligned with target
        enemy.laneIndex = target.laneIndex;
        enemy.mesh.position.x += (target.mesh.position.x - enemy.mesh.position.x) * 0.28;
      } else if (enemy.chaseTarget) {
        // Target disappeared; stop chasing but keep moving wrong-way at base speed
        enemy.chaseTarget = null;
        enemy.speed = enemy.baseSpeed || enemy.speed;
      }
    }

    const dx = Math.abs(
      enemy.mesh.position.x - state.player.mesh.position.x
    );
    const zPos = enemy.mesh.position.z;

    if (
      dx < 1.05 &&
      zPos > -2.4 &&
      zPos < 2.2 &&
      state.player.mesh.position.y <= PLAYER_BASE_Y + 0.25
    ) {
      onGameOver();
      return;
    }

    if (!enemy.passed && zPos > 1.5) {
      enemy.passed = true;
    }

    if (zPos > 24) {
      scene.remove(enemy.mesh);
      state.enemies.splice(i, 1);
      continue;
    }

    if (zPos < -200) {
      scene.remove(enemy.mesh);
      state.enemies.splice(i, 1);
    }
  }
}

function spawnPoliceChaser(state, targetEnemy) {
  const lane = targetEnemy.laneIndex;
  // Try to place the police car a bit behind the target, avoiding tight overlaps
  let spawnZ = targetEnemy.mesh.position.z - (POLICE_DESIRED_GAP + 2 + Math.random() * 3);
  // Make a quick attempt to avoid crowding same-lane cars (excluding the target)
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const conflict = state.enemies.some(
      (e) => e !== targetEnemy && e.laneIndex === lane && Math.abs(e.mesh.position.z - spawnZ) < 6
    );
    if (!conflict) break;
    spawnZ -= 6 + Math.random() * 4;
  }

  const mesh = createPoliceCar({ facingBackward: true });
  mesh.position.set(LANES[lane], PLAYER_BASE_Y, spawnZ);
  scene.add(mesh);

  const baseSpeed = Math.max(22, targetEnemy.speed * (1.02 + Math.random() * 0.08));
  const police = {
    mesh,
    laneIndex: lane,
    direction: -1,
    speed: baseSpeed,
    baseSpeed,
    passed: false,
    isPolice: true,
    chaseTarget: targetEnemy,
    sirenTimer: 0,
  };
  state.enemies.push(police);
}

export function updateBears(state, delta, onGameOver) {
  for (let i = state.bears.length - 1; i >= 0; i -= 1) {
    const bear = state.bears[i];
    const mesh = bear.mesh;
    bear.bobPhase =
      (bear.bobPhase || mesh.userData.bobOffset || 0) + delta * 2.6;
    mesh.userData.bobOffset = bear.bobPhase;
    const baseY = mesh.userData.baseY ?? 0.2;
    mesh.position.y = baseY + Math.sin(bear.bobPhase) * 0.06;
    mesh.position.z += state.player.speed * delta;

    const raiseStartZ = -90;
    const raiseFullZ = -70;
    const targetRaise =
      bear.collided || mesh.position.z >= raiseFullZ
        ? 1
        : THREE.MathUtils.clamp(
            (mesh.position.z - raiseStartZ) / (raiseFullZ - raiseStartZ),
            0,
            1
          );
    const previousRaise = bear.armRaiseProgress ?? 0;
    const blend = Math.min(1, delta * 6.8);
    const lerpFn = THREE.MathUtils.lerp ?? ((a, b, t) => a + (b - a) * t);
    const rawRaise = previousRaise + (targetRaise - previousRaise) * blend;
    const clamp01 = THREE.MathUtils.clamp ?? ((v, min, max) =>
      Math.max(min, Math.min(max, v))
    );
    const newRaise = clamp01(rawRaise, 0, 1);
    bear.armRaiseProgress = newRaise;
    mesh.userData.armRaiseProgress = newRaise;

    const armPivots = mesh.userData.armPivots;
    if (Array.isArray(armPivots)) {
      for (const pivot of armPivots) {
        const rest = pivot.userData.restRotation;
        const raised = pivot.userData.raiseRotation;
        if (!rest || !raised) {
          continue;
        }
        const x = lerpFn(rest.x, raised.x, newRaise);
        const z = lerpFn(rest.z, raised.z, newRaise);
        pivot.rotation.set(x, 0, z);
      }
    }

    const dx = Math.abs(mesh.position.x - state.player.mesh.position.x);
    const zPos = mesh.position.z;

    const contactWindow = zPos > -1.8 && zPos < 2.6;

    if (!bear.collided && dx < 1.35 && contactWindow) {
      bear.collided = true;
      if (typeof onGameOver === "function") {
        onGameOver();
      }
      return;
    }

    if (zPos > BEAR_DESPAWN_Z) {
      wildlifeGroup.remove(mesh);
      state.bears.splice(i, 1);
    }
  }
}
