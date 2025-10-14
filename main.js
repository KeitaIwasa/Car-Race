import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayBody = document.getElementById("overlay-body");
const startButton = document.getElementById("start-button");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const speedEl = document.getElementById("speed");
const touchLeft = document.getElementById("left-touch");
const touchRight = document.getElementById("right-touch");
const touchJump = document.getElementById("jump-touch");

const GAME_STATE = {
  READY: "ready",
  RUNNING: "running",
  GAME_OVER: "over",
};

const LANES = [-2.6, 0, 2.6];
const PLAYER_BASE_Y = 0.42;
const MARKER_SPACING = 13;
const MARKER_ROWS = 20;
const PLAYER_MAX_SPEED = 74;
const GRAVITY = 25;
const PLAYER_ACCEL_RATE = 1.1; // ease factor controlling how quickly the player speeds up

const STORAGE_KEY = "street-sprint-best";

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050812);
scene.fog = new THREE.Fog(0x050812, 26, 140);

const camera = new THREE.PerspectiveCamera(
  60,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  200
);
camera.position.set(0, 4.5, 8.4);
camera.lookAt(0, 1.6, -20);
scene.add(camera);

const hemiLight = new THREE.HemisphereLight(0x95c8ff, 0x0b0d16, 0.85);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
dirLight.position.set(-12, 18, 6);
scene.add(dirLight);

const roadGroup = new THREE.Group();
scene.add(roadGroup);

function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(24, 320, 1, 1);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x141c2b,
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -120);
  roadGroup.add(ground);
}

function createRoadSurface() {
  const roadGeometry = new THREE.PlaneGeometry(11, 320, 1, 1);
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
    metalness: 0.05,
  });
  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, -120);
  road.receiveShadow = true;
  roadGroup.add(road);
}

function createGuardRails() {
  const geometry = new THREE.BoxGeometry(0.3, 0.6, 320);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff4d6d,
    emissive: 0xff4d6d,
    emissiveIntensity: 0.18,
  });
  const leftRail = new THREE.Mesh(geometry, material);
  leftRail.position.set(-5.8, 0.45, -120);
  roadGroup.add(leftRail);

  const rightRail = leftRail.clone();
  rightRail.position.x = 5.8;
  roadGroup.add(rightRail);
}

createGround();
createRoadSurface();
createGuardRails();

const laneMarkers = [];
function createLaneMarkers() {
  const betweenLaneCount = LANES.length - 1;
  const markerGeometry = new THREE.BoxGeometry(0.22, 0.08, 3.7);
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe0f2ff,
    emissiveIntensity: 0.25,
  });

  laneMarkers.length = 0;
  for (let row = 0; row < MARKER_ROWS; row += 1) {
    for (let i = 0; i < betweenLaneCount; i += 1) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(
        (LANES[i] + LANES[i + 1]) / 2,
        0.05,
        -row * MARKER_SPACING
      );
      scene.add(marker);
      laneMarkers.push(marker);
    }
  }
}

createLaneMarkers();

function createPassenger() {
  const group = new THREE.Group();

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.32, 0.7, 14),
    new THREE.MeshStandardMaterial({
      color: 0x305478,
      roughness: 0.5,
      metalness: 0.05,
    })
  );
  torso.position.y = 0.66;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 18, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffd7ba,
      roughness: 0.35,
    })
  );
  head.position.y = 1.05;
  group.add(head);

  const mustache = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.08, 0.03),
    new THREE.MeshStandardMaterial({
      color: 0x2f2f2f,
      roughness: 0.6,
      metalness: 0,
    })
  );
  mustache.position.set(0, 0.96, 0.18);
  group.add(mustache);

  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.3, 14),
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.15,
    })
  );
  hat.position.y = 1.28;
  group.add(hat);

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14),
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.15,
    })
  );
  brim.position.y = 1.15;
  group.add(brim);

  return group;
}

function createCarBody(color, options = {}) {
  const { facingBackward = false, passenger } = options;
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.55, 2.7),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.65,
      roughness: 0.4,
    })
  );
  body.position.y = 0.5;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.45, 1.35),
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.08,
    })
  );
  cabin.position.set(0, 0.9, -0.05);
  group.add(cabin);

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff1a1,
    emissiveIntensity: 0.6,
  });
  const frontLight = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.22), accentMaterial);
  frontLight.position.set(0, 0.38, 1.35);
  group.add(frontLight);

  const rearLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    emissive: 0xff1f5b,
    emissiveIntensity: 0.55,
  });
  const rearLight = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.22), rearLightMaterial);
  rearLight.position.set(0, 0.38, -1.35);
  group.add(rearLight);

  const spoiler = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.12, 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    })
  );
  spoiler.position.set(0, 1.02, -1);
  group.add(spoiler);

  if (passenger) {
    passenger.position.set(0.12, 0.86, facingBackward ? 0.45 : -0.45);
    passenger.scale.set(0.9, 0.9, 0.9);
    group.add(passenger);
  }

  if (facingBackward) {
    group.rotation.y = Math.PI;
  }

  return group;
}

const playerCar = createCarBody(0xffc200);
playerCar.position.set(LANES[1], PLAYER_BASE_Y, 0);
scene.add(playerCar);

const state = {
  gameState: GAME_STATE.READY,
  player: {
    mesh: playerCar,
    laneIndex: 1,
    targetX: LANES[1],
    speed: 20,
    targetSpeed: 20,
    jump: {
      active: false,
      velocity: 0,
    },
    jumpCooldown: 0,
  },
  enemies: [],
  spawnTimer: 0,
  spawnInterval: 1.4,
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY)) || 0,
  lastTime: performance.now(),
};

function updateHud() {
  scoreEl.textContent = Math.floor(state.score).toString();
  bestEl.textContent = state.best.toString();
  speedEl.textContent = `${Math.round(state.player.speed * 3.2)} km/h`;
}

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) {
    return;
  }
  const pixelRatio = Math.min(window.devicePixelRatio, 1.8);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

resizeRenderer();
window.addEventListener("resize", resizeRenderer);

function triggerJump() {
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

function clearEnemies() {
  state.enemies.forEach((enemy) => {
    scene.remove(enemy.mesh);
  });
  state.enemies = [];
}

function resetLaneMarkers() {
  const columns = LANES.length - 1;
  laneMarkers.forEach((marker, index) => {
    const row = Math.floor(index / columns);
    marker.position.set(
      (LANES[index % columns] + LANES[(index % columns) + 1]) / 2,
      0.05,
      -row * MARKER_SPACING
    );
  });
}

function resetGame() {
  state.player.laneIndex = 1;
  state.player.targetX = LANES[1];
  state.player.mesh.position.set(LANES[1], PLAYER_BASE_Y, 0);
  state.player.mesh.rotation.set(0, 0, 0);
  state.player.mesh.position.y = PLAYER_BASE_Y;
  state.player.speed = 20;
  state.player.targetSpeed = 22;
  state.player.jump.active = false;
  state.player.jump.velocity = 0;
  state.player.jumpCooldown = 0;
  state.spawnTimer = 0;
  state.spawnInterval = 1.4;
  state.score = 0;
  state.lastTime = performance.now();
  clearEnemies();
  resetLaneMarkers();
  updateHud();
}

function startGame() {
  resetGame();
  overlay.classList.add("hidden");
  state.gameState = GAME_STATE.RUNNING;
  requestAnimationFrame(gameLoop);
}

function endGame() {
  state.gameState = GAME_STATE.GAME_OVER;
  overlayTitle.textContent = "Game Over";
  overlayBody.textContent = `スコア: ${Math.floor(state.score)}\nもう一度挑戦しますか？`;
  startButton.textContent = "リトライ";
  overlay.classList.remove("hidden");

  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    localStorage.setItem(STORAGE_KEY, state.best);
    updateHud();
    overlayBody.textContent += "\n最高スコア更新！";
  }
}

const enemyPalette = [0x4361ee, 0x4895ef, 0x4cc9f0, 0xff006e, 0xff924c, 0xb5179e];

function spawnEnemy() {
  const lane = Math.floor(Math.random() * LANES.length);
  const allowWrongWay = state.score > 320;
  const wrongWayChance = allowWrongWay ? 0.22 : 0.1;
  const isWrongWay = Math.random() < wrongWayChance && allowWrongWay;
  const spawnZ = isWrongWay ? -95 - Math.random() * 24 : -140 - Math.random() * 40;

  for (const enemy of state.enemies) {
    if (
      enemy.laneIndex === lane &&
      Math.abs(enemy.mesh.position.z - spawnZ) < 24
    ) {
      return;
    }
  }

  const mesh = createCarBody(
    enemyPalette[Math.floor(Math.random() * enemyPalette.length)],
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

  const forwardSpeed = 12 + Math.random() * 6; // constant speed for forward traffic
  const wrongWaySpeed = 26 + Math.random() * 6;
  state.enemies.push({
    mesh,
    laneIndex: lane,
    direction: isWrongWay ? -1 : 1,
    speed: isWrongWay ? wrongWaySpeed : forwardSpeed,
    passed: false,
  });
}

function updatePlayer(delta) {
  state.player.jumpCooldown = Math.max(
    0,
    state.player.jumpCooldown - delta
  );
  state.player.targetSpeed = Math.min(
    PLAYER_MAX_SPEED,
    24 + state.score * 0.015
  );
  state.player.speed +=
    (state.player.targetSpeed - state.player.speed) *
    Math.min(1, delta * PLAYER_ACCEL_RATE);

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

function updateLaneMarkers(delta) {
  const advance = state.player.speed * delta;
  const columns = LANES.length - 1;
  const loopLength = MARKER_SPACING * MARKER_ROWS;

  laneMarkers.forEach((marker, index) => {
    marker.position.z += advance;
    if (marker.position.z > 12) {
      marker.position.z -= loopLength;
    }
    const col = index % columns;
    marker.position.x +=
      ((LANES[col] + LANES[col + 1]) / 2 - marker.position.x) * 0.25;
  });
}

function updateEnemies(delta) {
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
      endGame();
      return;
    }

    if (!enemy.passed && zPos > 1.5) {
      enemy.passed = true;
      const sameLane = Math.abs(
        enemy.mesh.position.x - state.player.mesh.position.x
      ) < 1.6;
      const airborne = state.player.mesh.position.y > PLAYER_BASE_Y + 0.22;
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

function updateScore(delta) {
  state.score += state.player.speed * delta * 4.5;
  updateHud();
}

function update(delta) {
  updatePlayer(delta);
  updateLaneMarkers(delta);
  updateEnemies(delta);
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
    spawnEnemy();
    state.spawnTimer = 0;
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

function movePlayer(direction) {
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

function handleKeyDown(event) {
  if (event.repeat) return;
  switch (event.key) {
    case "ArrowLeft":
    case "a":
    case "A":
      event.preventDefault();
      movePlayer(-1);
      break;
    case "ArrowRight":
    case "d":
    case "D":
      event.preventDefault();
      movePlayer(1);
      break;
    case "Enter":
      if (state.gameState !== GAME_STATE.RUNNING) {
        event.preventDefault();
        startGame();
      }
      break;
    case " ":
      event.preventDefault();
      if (state.gameState === GAME_STATE.RUNNING) {
        triggerJump();
      } else if (state.gameState !== GAME_STATE.RUNNING) {
        startGame();
      }
      break;
    default:
  }
}

function setupTouchControls() {
  if (!touchLeft || !touchRight) {
    return;
  }
  const startMove = (direction) => {
    movePlayer(direction);
  };

  let intervalId;
  const handlePress = (direction) => {
    startMove(direction);
    if (!intervalId) {
      intervalId = setInterval(() => startMove(direction), 190);
    }
  };

  const release = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  [["pointerdown", handlePress], ["pointerup", release], ["pointerleave", release]].forEach(
    ([eventName, handler]) => {
      touchLeft.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (eventName === "pointerdown") handler(-1);
        else handler();
      });
      touchRight.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (eventName === "pointerdown") handler(1);
        else handler();
      });
    }
  );

  if (touchJump) {
    touchJump.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      triggerJump();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
      touchJump.addEventListener(eventName, (event) => {
        event.preventDefault();
      });
    });
  }
}

startButton.addEventListener("click", startGame);
window.addEventListener("keydown", handleKeyDown);
setupTouchControls();

overlayTitle.textContent = "Street Sprint 3D";
overlayBody.textContent =
  "矢印キー（← →）または A / D で車線変更。スペースキー（モバイルは⤴︎ボタン）でジャンプして逆走おじさんカーを飛び越え、ハイスコアを狙いましょう！";
startButton.textContent = "スタート";
overlay.classList.remove("hidden");
updateHud();
