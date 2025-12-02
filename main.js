import {
  GAME_STATE,
  LANES,
  PLAYER_BASE_Y,
  LEVELS,
  DEFAULT_LEVEL_ID,
  BEAR_SPAWN_BASE_INTERVAL,
  PLAYER_START_SPEED,
  PLAYER_START_TARGET_SPEED,
  WRONG_WAY_SPAWN_INTERVAL,
  COIN_SPAWN_MIN_INTERVAL,
  COIN_SPAWN_MAX_INTERVAL,
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
  spawnCoin,
  clearCoins,
  updateCoins,
} from "./collectibles.js";
import {
  updateScorePopups,
  updateDebrisPieces,
  clearEffects,
} from "./effects.js";
import {
  updateHud,
  showOverlay,
  hideOverlay,
  initializeUiText,
  renderLevelSelectors,
  updateLevelBests,
  highlightActiveLevel,
  resetBestButton,
} from "./ui.js";
import {
  bindKeyboardControls,
  bindTouchControls,
} from "./controls.js";
import { STRINGS } from "./strings.js";
import {
  initializeViewportLayout,
  syncViewportLayout,
} from "./viewport.js";

const LEVEL_LIST = Object.values(LEVELS);
const LEVEL_BY_ID = LEVEL_LIST.reduce((acc, level) => {
  acc[level.id] = level;
  return acc;
}, {});

function loadBestScores() {
  const scores = {};
  LEVEL_LIST.forEach((level) => {
    const stored = Number(localStorage.getItem(level.storageKey));
    scores[level.id] = Number.isFinite(stored) ? stored : 0;
  });
  return scores;
}

const bestByLevel = loadBestScores();
const initialLevel =
  LEVEL_BY_ID[DEFAULT_LEVEL_ID] || LEVEL_LIST[0];

const playerCar = createPlayerCar();
scene.add(playerCar);

const initialSpeedMultiplier =
  initialLevel?.speedMultiplier ?? 1;

const state = {
  gameState: GAME_STATE.READY,
  selectedLevelId: initialLevel?.id,
  levelSpeedMultiplier: initialSpeedMultiplier,
  player: {
    mesh: playerCar,
    laneIndex: 1,
    targetX: LANES[1],
    speed: PLAYER_START_SPEED * initialSpeedMultiplier,
    targetSpeed:
      PLAYER_START_TARGET_SPEED * initialSpeedMultiplier,
    jump: {
      active: false,
      velocity: 0,
    },
    jumpCooldown: 0,
  },
  enemies: [],
  bears: [],
  coins: [],
  scorePopups: [],
  debrisPieces: [],
  spawnDistance: 0,
  spawnInterval: 1.4,
  bearTimer: 0,
  bearInterval: BEAR_SPAWN_BASE_INTERVAL,
  wrongWayTimer: WRONG_WAY_SPAWN_INTERVAL,
  score: 0,
  elapsedTime: 0,
  bestByLevel: { ...bestByLevel },
  best: bestByLevel[initialLevel?.id] || 0,
  lastTime: performance.now(),
  coinTimer: 0,
  nextCoinInterval: 0,
};

function selectLevel(levelId) {
  const nextLevel = LEVEL_BY_ID[levelId] || initialLevel;
  state.selectedLevelId = nextLevel.id;
  state.levelSpeedMultiplier = nextLevel.speedMultiplier;
  state.best = state.bestByLevel[nextLevel.id] || 0;
  highlightActiveLevel(nextLevel.id);
  updateLevelBests(state.bestByLevel);
  updateHud(state);
}

function rollCoinInterval() {
  return (
    COIN_SPAWN_MIN_INTERVAL +
    Math.random() *
      (COIN_SPAWN_MAX_INTERVAL - COIN_SPAWN_MIN_INTERVAL)
  );
}

state.nextCoinInterval = rollCoinInterval();

createCityScenery();
syncViewportLayout();
resizeRenderer();
updateHud(state);

initializeUiText(STRINGS);

renderLevelSelectors(LEVEL_LIST, (levelId) => {
  startGame(levelId);
});

updateLevelBests(state.bestByLevel);
highlightActiveLevel(state.selectedLevelId);

showOverlay({
  title: "Street Sprint 3D",
  body: STRINGS.introBody,
});

initializeViewportLayout(resizeRenderer);

function resetGame() {
  state.player.laneIndex = 1;
  state.player.targetX = LANES[1];
  state.player.mesh.position.set(LANES[1], PLAYER_BASE_Y, 0);
  state.player.mesh.rotation.set(0, 0, 0);
  state.player.mesh.position.y = PLAYER_BASE_Y;
  state.player.speed =
    PLAYER_START_SPEED * state.levelSpeedMultiplier;
  state.player.targetSpeed =
    PLAYER_START_TARGET_SPEED * state.levelSpeedMultiplier;
  state.player.jump.active = false;
  state.player.jump.velocity = 0;
  state.player.jumpCooldown = 0;

  state.spawnDistance = 0;
  state.spawnInterval = 1.4;
  state.bearTimer = 0;
  state.bearInterval = BEAR_SPAWN_BASE_INTERVAL;
  state.wrongWayTimer = WRONG_WAY_SPAWN_INTERVAL;
  state.score = 0;
  state.elapsedTime = 0;
  state.lastTime = performance.now();
  state.coinTimer = 0;
  state.nextCoinInterval = rollCoinInterval();

  clearEnemies(state);
  clearBears(state);
  clearCoins(state);
  clearEffects(state);
  resetLaneMarkers();
  resetScenery();
  updateHud(state);
}

function startGame(levelId = state.selectedLevelId) {
  if (state.gameState === GAME_STATE.RUNNING) {
    return;
  }
  selectLevel(levelId);
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
  const activeLevel =
    LEVEL_BY_ID[state.selectedLevelId] || initialLevel;
  let bodyText = `${STRINGS.scorePrefix}: ${Math.floor(
    state.score
  )}\n${STRINGS.gameOverPromptSuffix}`;

  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    state.bestByLevel[activeLevel.id] = state.best;
    localStorage.setItem(activeLevel.storageKey, state.best);
    updateHud(state);
    updateLevelBests(state.bestByLevel);
    bodyText += `\n${STRINGS.highScoreUpdate}`;
  }

  showOverlay({
    title: "Game Over",
    body: bodyText,
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
  state.elapsedTime += delta;
  updatePlayer(state, delta);
  updateScenery(delta, state.player);
  updateLaneMarkers(delta, state.player);
  updateEnemies(state, delta, endGame);
  updateBears(state, delta, endGame);
  updateScorePopups(state, delta);
  updateDebrisPieces(state, delta);

  if (state.gameState !== GAME_STATE.RUNNING) {
    return;
  }

  updateCoins(state, delta);

  state.coinTimer += delta;
  if (state.coinTimer >= state.nextCoinInterval) {
    const spawned = spawnCoin(state);
    const nextInterval = rollCoinInterval();
    state.nextCoinInterval = nextInterval;
    state.coinTimer = spawned ? 0 : nextInterval * 0.6;
  }

  // 距離ベースで敵車の生成間隔を管理
  state.spawnDistance += state.player.speed * delta;
  state.wrongWayTimer += delta;
  const referenceSpeed =
    PLAYER_START_SPEED * state.levelSpeedMultiplier;
  const baseDistance = state.spawnInterval * referenceSpeed;
  const minDistance = 0.65 * referenceSpeed;
  const scoreDistanceFactor = 0.0007 * referenceSpeed;
  const adaptiveDistance = Math.max(
    minDistance,
    baseDistance - state.score * scoreDistanceFactor
  );
  if (state.spawnDistance > adaptiveDistance) {
    spawnEnemy(state);
    state.spawnDistance = 0;
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

function resetHighScores() {
  LEVEL_LIST.forEach((level) => {
    state.bestByLevel[level.id] = 0;
    localStorage.removeItem(level.storageKey);
  });
  state.best = 0;
  updateHud(state);
  updateLevelBests(state.bestByLevel);
}

if (resetBestButton) {
  resetBestButton.addEventListener("click", resetHighScores);
}
