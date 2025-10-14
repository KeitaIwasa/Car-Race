import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

import { scene, wildlifeGroup } from "./scene.js";
import {
  BEAR_DESPAWN_Z,
  BEAR_SCORE_REWARD,
  ENEMY_PALETTE,
  LANES,
  PLAYER_BASE_Y,
} from "./constants.js";
import { createCarBody, createPassenger, createBear } from "./entities.js";
import { createScorePopup, spawnBearDebris } from "./effects.js";
import { updateHud } from "./ui.js";

export function spawnEnemy(state) {
  const lane = Math.floor(Math.random() * LANES.length);
  const allowWrongWay = state.score > 320;
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
  state.enemies.push({
    mesh,
    laneIndex: lane,
    direction: isWrongWay ? -1 : 1,
    speed: isWrongWay ? wrongWaySpeed : forwardSpeed,
    passed: false,
  });
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
    collected: false,
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
      const sameLane = Math.abs(
        enemy.mesh.position.x - state.player.mesh.position.x
      ) < 1.6;
      const airborne =
        state.player.mesh.position.y > PLAYER_BASE_Y + 0.22;
      let reward = enemy.direction === -1 ? 160 : 80;
      if (sameLane && airborne) {
        reward += enemy.direction === -1 ? 200 : 90;
      } else if (sameLane && !airborne) {
        reward -= 30;
      }
      state.score += Math.max(20, reward);
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

export function updateBears(state, delta) {
  for (let i = state.bears.length - 1; i >= 0; i -= 1) {
    const bear = state.bears[i];
    const mesh = bear.mesh;
    bear.bobPhase =
      (bear.bobPhase || mesh.userData.bobOffset || 0) + delta * 2.6;
    mesh.userData.bobOffset = bear.bobPhase;
    const baseY = mesh.userData.baseY ?? 0.2;
    mesh.position.y = baseY + Math.sin(bear.bobPhase) * 0.06;
    mesh.position.z += state.player.speed * delta;

    const dx = Math.abs(mesh.position.x - state.player.mesh.position.x);
    const zPos = mesh.position.z;

    const contactWindow =
      zPos > -1.8 &&
      zPos < 2.6 &&
      state.player.mesh.position.y <= PLAYER_BASE_Y + 0.32;

    if (!bear.collected && dx < 1.2 && contactWindow) {
      bear.collected = true;
      const impactPosition = mesh.position.clone();
      state.score += BEAR_SCORE_REWARD;
      updateHud(state);
      createScorePopup(BEAR_SCORE_REWARD, impactPosition, state);
      spawnBearDebris(impactPosition, state);
      wildlifeGroup.remove(mesh);
      state.bears.splice(i, 1);
      continue;
    }

    if (zPos > BEAR_DESPAWN_Z) {
      wildlifeGroup.remove(mesh);
      state.bears.splice(i, 1);
    }
  }
}
