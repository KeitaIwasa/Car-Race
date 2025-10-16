import { collectiblesGroup } from "./scene.js";
import { LANES, COIN_SCORE_VALUE, COIN_MAX_ACTIVE } from "./constants.js";
import { createCoin } from "./entities.js";
import { createScorePopup } from "./effects.js";
import { updateHud } from "./ui.js";

const COIN_BOB_SPEED = 3.6;
const COIN_BOB_HEIGHT = 0.12;
const COIN_DESPAWN_Z = 24;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function isLaneClear(state, laneIndex, spawnZ) {
  const enemyConflict = state.enemies?.some(
    (enemy) =>
      enemy.laneIndex === laneIndex &&
      Math.abs(enemy.mesh.position.z - spawnZ) < 18
  );
  if (enemyConflict) {
    return false;
  }

  const bearConflict = state.bears?.some(
    (bear) =>
      bear.laneIndex === laneIndex &&
      Math.abs(bear.mesh.position.z - spawnZ) < 18
  );
  if (bearConflict) {
    return false;
  }

  const coinConflict = state.coins?.some(
    (coin) =>
      coin.laneIndex === laneIndex &&
      Math.abs(coin.mesh.position.z - spawnZ) < 12
  );
  if (coinConflict) {
    return false;
  }

  return true;
}

export function spawnCoin(state) {
  if (!state) {
    return false;
  }
  if (state.coins && state.coins.length >= COIN_MAX_ACTIVE) {
    return false;
  }

  const laneIndices = shuffle(
    Array.from({ length: LANES.length }, (_, index) => index)
  );
  const spawnZ = -120 - Math.random() * 50;

  for (const laneIndex of laneIndices) {
    if (!isLaneClear(state, laneIndex, spawnZ)) {
      continue;
    }

    const mesh = createCoin();
    const baseY = mesh.userData.baseY ?? 0.72;
    mesh.position.set(LANES[laneIndex], baseY, spawnZ);
    mesh.userData.bobPhase = Math.random() * Math.PI * 2;
    collectiblesGroup.add(mesh);

    state.coins.push({
      mesh,
      laneIndex,
      bobPhase: mesh.userData.bobPhase,
    });
    return true;
  }
  return false;
}

export function updateCoins(state, delta) {
  if (!state || !state.coins) {
    return;
  }
  const player = state.player;
  if (!player || !player.mesh) {
    return;
  }
  for (let i = state.coins.length - 1; i >= 0; i -= 1) {
    const coin = state.coins[i];
    const mesh = coin.mesh;
    if (!mesh) {
      state.coins.splice(i, 1);
      continue;
    }

    const baseY = mesh.userData.baseY ?? 0.72;
    coin.bobPhase = (coin.bobPhase || 0) + delta * COIN_BOB_SPEED;
    mesh.position.y = baseY + Math.sin(coin.bobPhase) * COIN_BOB_HEIGHT;
    mesh.rotation.y += (mesh.userData.spinSpeed || 6) * delta;
    mesh.position.z += player.speed * delta;

    const dx = Math.abs(mesh.position.x - player.mesh.position.x);
    const dy = Math.abs(mesh.position.y - player.mesh.position.y);
    const dz = mesh.position.z;
    const contactWindow = dz > -1.8 && dz < 2.6;
    if (contactWindow && dx < 1.05 && dy < 1.2) {
      const impactPosition = mesh.position.clone();
      collectiblesGroup.remove(mesh);
      state.coins.splice(i, 1);
      state.score += COIN_SCORE_VALUE;
      createScorePopup(COIN_SCORE_VALUE, impactPosition, state);
      updateHud(state);
      continue;
    }

    if (dz > COIN_DESPAWN_Z) {
      collectiblesGroup.remove(mesh);
      state.coins.splice(i, 1);
    }
  }
}

export function clearCoins(state) {
  if (!state || !state.coins) {
    return;
  }
  state.coins.forEach((coin) => {
    if (coin.mesh) {
      collectiblesGroup.remove(coin.mesh);
    }
  });
  state.coins = [];
}
