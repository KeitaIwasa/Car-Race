import { camera } from "./scene.js";
import {
  GAME_STATE,
  GRAVITY,
  LANES,
  PLAYER_ACCEL_RATE,
  PLAYER_BASE_Y,
  PLAYER_SPEED_LOG_FACTOR,
} from "./constants.js";
import { createCarBody } from "./entities.js";
import { updateSpeedometer } from "./ui.js";

export function createPlayerCar() {
  const mesh = createCarBody(0xffc200);
  mesh.position.set(LANES[1], PLAYER_BASE_Y, 0);
  return mesh;
}

export function triggerJump(state) {
  if (
    state.gameState !== GAME_STATE.RUNNING ||
    state.player.jump.active ||
    state.player.jumpCooldown > 0
  ) {
    return;
  }
  state.player.jump.active = true;
  state.player.jump.velocity = 9.6;
  state.player.jumpCooldown = 0.6;
}

export function movePlayer(state, direction) {
  if (state.gameState !== GAME_STATE.RUNNING) {
    return;
  }
  const airborne =
    state.player.jump.active ||
    state.player.mesh.position.y > PLAYER_BASE_Y + 0.05;
  if (airborne) {
    return;
  }
  state.player.laneIndex = Math.max(
    0,
    Math.min(LANES.length - 1, state.player.laneIndex + direction)
  );
  state.player.targetX = LANES[state.player.laneIndex];
}

export function updatePlayer(state, delta) {
  state.player.jumpCooldown = Math.max(
    0,
    state.player.jumpCooldown - delta
  );
  const elapsed = Math.max(0, state.elapsedTime || 0);
  state.player.targetSpeed = Math.log10(elapsed + 10) * PLAYER_SPEED_LOG_FACTOR + 20;
  state.player.speed +=
    (state.player.targetSpeed - state.player.speed) *
    Math.min(1, delta * PLAYER_ACCEL_RATE);
  updateSpeedometer(state);

  const smoothing = Math.min(1, delta * 10);
  const desiredX = state.player.targetX;
  state.player.mesh.position.x +=
    (desiredX - state.player.mesh.position.x) * smoothing;

  const tilt = (state.player.mesh.position.x - desiredX) * -0.06;
  state.player.mesh.rotation.z += (tilt - state.player.mesh.rotation.z) * 0.18;

  if (state.player.jump.active) {
    state.player.jump.velocity -= GRAVITY * delta;
    state.player.mesh.position.y += state.player.jump.velocity * delta;
    state.player.mesh.rotation.x = Math.max(
      -0.22,
      state.player.mesh.rotation.x - 3.6 * delta
    );
    if (state.player.mesh.position.y <= PLAYER_BASE_Y) {
      state.player.mesh.position.y = PLAYER_BASE_Y;
      state.player.mesh.rotation.x = 0;
      state.player.jump.active = false;
      state.player.jump.velocity = 0;
    }
  } else {
    state.player.mesh.rotation.x *= 0.92;
    state.player.mesh.position.y +=
      (PLAYER_BASE_Y - state.player.mesh.position.y) * 0.25;
  }

  camera.position.x +=
    (state.player.mesh.position.x * 0.4 - camera.position.x) * 0.1;
  camera.lookAt(
    state.player.mesh.position.x,
    1.5,
    -18 + state.player.mesh.position.x * 0.05
  );
}
