import {
  GAME_STATE,
  LANES,
  PLAYER_BASE_Y,
  STORAGE_KEY,
  BEAR_SPAWN_BASE_INTERVAL,
  PLAYER_START_SPEED,
  PLAYER_START_TARGET_SPEED,
} from "./constants.js";
import {
  renderer,
  scene,
  camera,
  resizeRenderer,
  resetLaneMarkers,
  updateLaneMarkers,
} from "./scene.js";
import {
  createCityScenery,
  resetScenery,
  updateScenery,
} from "./environment.js";
import {
  createPlayerCar,
  triggerJump,
  movePlayer,
  updatePlayer,
} from "./player.js";
import {
  spawnEnemy,
  spawnBear,
  clearEnemies,
  clearBears,
  updateEnemies,
  updateBears,
} from "./spawners.js";
import {
  updateScorePopups,
  updateDebrisPieces,
  clearEffects,
} from "./effects.js";
import {
  updateHud,
  showOverlay,
  hideOverlay,
  startButton,
  initializeUiText,
} from "./ui.js";
import {
  bindKeyboardControls,
  bindTouchControls,
} from "./controls.js";
import { STRINGS } from "./strings.js";

const playerCar = createPlayerCar();
scene.add(playerCar);

const state = {
  gameState: GAME_STATE.READY,
  player: {
    mesh: playerCar,
    laneIndex: 1,
    targetX: LANES[1],
    speed: PLAYER_START_SPEED,
    targetSpeed: PLAYER_START_TARGET_SPEED,
    jump: {
      active: false,
      velocity: 0,
    },
    jumpCooldown: 0,
  },
  enemies: [],
  bears: [],
  scorePopups: [],
  debrisPieces: [],
  spawnTimer: 0,
  spawnInterval: 1.4,
  bearTimer: 0,
  bearInterval: BEAR_SPAWN_BASE_INTERVAL,
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY)) || 0,
  lastTime: performance.now(),
};

createCityScenery();
resizeRenderer();
updateHud(state);

initializeUiText(STRINGS);

showOverlay({
  title: "Street Sprint 3D",
  body: STRINGS.introBody,
  buttonLabel: STRINGS.startButton,
});

window.addEventListener("resize", resizeRenderer);

function updateScore(delta) {
  state.score += state.player.speed * delta * 4.5;
  updateHud(state);
}

function resetGame() {
  state.player.laneIndex = 1;
  state.player.targetX = LANES[1];
  state.player.mesh.position.set(LANES[1], PLAYER_BASE_Y, 0);
  state.player.mesh.rotation.set(0, 0, 0);
  state.player.mesh.position.y = PLAYER_BASE_Y;
  state.player.speed = PLAYER_START_SPEED;
  state.player.targetSpeed = PLAYER_START_TARGET_SPEED;
  state.player.jump.active = false;
  state.player.jump.velocity = 0;
  state.player.jumpCooldown = 0;

  state.spawnTimer = 0;
  state.spawnInterval = 1.4;
  state.bearTimer = 0;
  state.bearInterval = BEAR_SPAWN_BASE_INTERVAL;
  state.score = 0;
  state.lastTime = performance.now();

  clearEnemies(state);
  clearBears(state);
  clearEffects(state);
  resetLaneMarkers();
  resetScenery();
  updateHud(state);
}

function startGame() {
  if (state.gameState === GAME_STATE.RUNNING) {
    return;
  }
  resetGame();
  hideOverlay();
  state.gameState = GAME_STATE.RUNNING;
  state.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  if (state.gameState === GAME_STATE.GAME_OVER) {
    return;
  }
  state.gameState = GAME_STATE.GAME_OVER;
  let bodyText = `${STRINGS.scorePrefix}: ${Math.floor(
    state.score
  )}\n${STRINGS.gameOverPromptSuffix}`;

  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    localStorage.setItem(STORAGE_KEY, state.best);
    updateHud(state);
    bodyText += `\n${STRINGS.highScoreUpdate}`;
  }

  showOverlay({
    title: "Game Over",
    body: bodyText,
    buttonLabel: STRINGS.retryButton,
  });
}

function handleJumpAction() {
  if (state.gameState === GAME_STATE.RUNNING) {
    triggerJump(state);
  } else {
    startGame();
  }
}

function handleStart() {
  if (state.gameState !== GAME_STATE.RUNNING) {
    startGame();
  }
}

function update(delta) {
  updatePlayer(state, delta);
  updateScenery(delta, state.player);
  updateLaneMarkers(delta, state.player);
  updateEnemies(state, delta, endGame);
  updateBears(state, delta);
  updateScorePopups(state, delta);
  updateDebrisPieces(state, delta);

  if (state.gameState !== GAME_STATE.RUNNING) {
    return;
  }

  updateScore(delta);

  state.spawnTimer += delta;
  const adaptiveInterval = Math.max(
    0.65,
    state.spawnInterval - state.score * 0.0007
  );
  if (state.spawnTimer > adaptiveInterval) {
    spawnEnemy(state);
    state.spawnTimer = 0;
  }

  state.bearTimer += delta;
  if (state.bearTimer > state.bearInterval) {
    spawnBear(state);
    state.bearTimer = 0;
    const intervalVariance = 2.6 + Math.random() * 3;
    const scoreFactor = Math.max(0, 1.2 - state.score * 0.0006);
    state.bearInterval =
      BEAR_SPAWN_BASE_INTERVAL * scoreFactor + intervalVariance;
  }
}

function render() {
  renderer.render(scene, camera);
}

function gameLoop(timestamp) {
  if (state.gameState !== GAME_STATE.RUNNING) {
    return;
  }

  const deltaMs = timestamp - state.lastTime;
  state.lastTime = timestamp;
  const delta = Math.min(deltaMs, 60) / 1000;

  resizeRenderer();
  update(delta);
  render();

  requestAnimationFrame(gameLoop);
}

bindKeyboardControls({
  onMoveLeft: () => movePlayer(state, -1),
  onMoveRight: () => movePlayer(state, 1),
  onJumpAction: handleJumpAction,
  onStart: handleStart,
});

bindTouchControls({
  onMoveLeft: () => movePlayer(state, -1),
  onMoveRight: () => movePlayer(state, 1),
  onJumpAction: handleJumpAction,
});

startButton.addEventListener("click", handleStart);
