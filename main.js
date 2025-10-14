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
const PLAYER_MAX_SPEED = 84;
const GRAVITY = 25;
const PLAYER_ACCEL_RATE = 1.05; // ease factor controlling how quickly the player speeds up

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

const sceneryGroup = new THREE.Group();
scene.add(sceneryGroup);

const wildlifeGroup = new THREE.Group();
scene.add(wildlifeGroup);

const effectsGroup = new THREE.Group();
scene.add(effectsGroup);

const SCENERY_SEGMENT_LENGTH = 28;
const SCENERY_SEGMENT_COUNT = 14;
const SCENERY_SCROLL_FACTOR = 0.62;
const SCENERY_RESET_Z = 48;
const SCENERY_LOOP_LENGTH = SCENERY_SEGMENT_LENGTH * SCENERY_SEGMENT_COUNT;

const BEAR_SPAWN_BASE_INTERVAL = 6.5;
const BEAR_SCORE_REWARD = 260;
const BEAR_DESPAWN_Z = 28;

const buildingPalettes = [
  { base: 0x1f2937, accent: 0xfcd34d },
  { base: 0x0f172a, accent: 0x38bdf8 },
  { base: 0x312e81, accent: 0xc084fc },
  { base: 0x7c2d12, accent: 0xf97316 },
  { base: 0x3f6212, accent: 0xa3e635 },
  { base: 0x334155, accent: 0x93c5fd },
  { base: 0x1e293b, accent: 0x38bdf8 },
];

const treeLeafPalette = [0x047857, 0x059669, 0x0f766e, 0x10b981];

const scenerySegments = [];

function createBlockBuilding(width, height, depth, palette) {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: palette.base,
    roughness: 0.78,
    metalness: 0.28,
  });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    bodyMaterial
  );
  body.position.y = height / 2;
  body.castShadow = false;
  body.receiveShadow = true;
  group.add(body);

  const roofHeight = Math.max(0.35, height * 0.14);
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: palette.accent,
    roughness: 0.35,
    metalness: 0.55,
  });
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.92, roofHeight, depth * 0.92),
    roofMaterial
  );
  roof.position.y = height + roofHeight / 2;
  roof.castShadow = false;
  roof.receiveShadow = true;
  group.add(roof);

  if (Math.random() < 0.7) {
    const bandHeight = Math.max(0.24, height * 0.16);
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: palette.accent,
      emissive: palette.accent,
      emissiveIntensity: 0.45,
      roughness: 0.28,
      metalness: 0.4,
    });
    const sideBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, bandHeight, depth * 0.86),
      bandMaterial
    );
    sideBand.position.set(width / 2 + 0.06, height * 0.55, 0);
    group.add(sideBand);

    const oppositeBand = sideBand.clone();
    oppositeBand.position.x = -width / 2 - 0.06;
    group.add(oppositeBand);
  }

  group.userData.height = height + roofHeight;
  return group;
}

function createTreeBlock() {
  const group = new THREE.Group();
  const trunkHeight = 0.8 + Math.random() * 0.45;
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.82,
    metalness: 0.08,
  });
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, trunkHeight, 0.42),
    trunkMaterial
  );
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = false;
  trunk.receiveShadow = true;
  group.add(trunk);

  let yCursor = trunkHeight;
  const canopyLayers = 2 + Math.floor(Math.random() * 2);
  for (let layerIndex = 0; layerIndex < canopyLayers; layerIndex += 1) {
    const layerSize = 1.35 - layerIndex * 0.26;
    const layerHeight = 0.88 - layerIndex * 0.12;
    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: treeLeafPalette[Math.floor(Math.random() * treeLeafPalette.length)],
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x022c22,
      emissiveIntensity: 0.12,
    });
    const layer = new THREE.Mesh(
      new THREE.BoxGeometry(layerSize, layerHeight, layerSize),
      canopyMaterial
    );
    yCursor += layerHeight / 2;
    layer.position.y = yCursor;
    yCursor += layerHeight / 2;
    layer.castShadow = false;
    layer.receiveShadow = true;
    group.add(layer);
  }

  group.userData.height = yCursor;
  return group;
}

function createBear() {
  const group = new THREE.Group();

  const furColorOptions = [0x3f2d20, 0x4b3424, 0x5a3a27];
  const furColor =
    furColorOptions[Math.floor(Math.random() * furColorOptions.length)];

  const furMaterial = new THREE.MeshStandardMaterial({
    color: furColor,
    roughness: 0.8,
    metalness: 0.1,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.9, 1.55),
    furMaterial
  );
  body.position.y = 0.55;
  group.add(body);

  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.5, 0.86),
    new THREE.MeshStandardMaterial({
      color: 0x8d6e58,
      roughness: 0.7,
      metalness: 0.05,
    })
  );
  belly.position.set(0, 0.56, 0.38);
  group.add(belly);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.72, 0.82),
    furMaterial
  );
  head.position.set(0, 1.2, 0.68);
  group.add(head);

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.3, 0.48),
    new THREE.MeshStandardMaterial({
      color: 0xd1b199,
      roughness: 0.6,
      metalness: 0.02,
    })
  );
  snout.position.set(0, 1.05, 1.06);
  group.add(snout);

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.14, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x1d1b1b,
      roughness: 0.5,
      metalness: 0.3,
    })
  );
  nose.position.set(0, 1.08, 1.22);
  group.add(nose);

  const earGeometry = new THREE.BoxGeometry(0.28, 0.24, 0.16);
  const innerEarMaterial = new THREE.MeshStandardMaterial({
    color: 0xe3c4ab,
    roughness: 0.65,
    metalness: 0.05,
  });
  const leftEar = new THREE.Mesh(earGeometry, furMaterial);
  leftEar.position.set(-0.32, 1.54, 0.54);
  group.add(leftEar);
  const rightEar = leftEar.clone();
  rightEar.position.x = 0.32;
  group.add(rightEar);

  const leftInnerEar = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 0.08),
    innerEarMaterial
  );
  leftInnerEar.position.set(-0.32, 1.54, 0.62);
  group.add(leftInnerEar);
  const rightInnerEar = leftInnerEar.clone();
  rightInnerEar.position.x = 0.32;
  group.add(rightInnerEar);

  const limbMaterial = furMaterial.clone();
  limbMaterial.roughness = 0.85;

  const legGeometry = new THREE.BoxGeometry(0.34, 0.7, 0.34);
  const foreLegOffsetZ = 0.42;
  const hindLegOffsetZ = -0.48;
  const legPairs = [
    [-0.38, hindLegOffsetZ],
    [0.38, hindLegOffsetZ],
    [-0.42, foreLegOffsetZ],
    [0.42, foreLegOffsetZ],
  ];

  legPairs.forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeometry, limbMaterial);
    leg.position.set(x, 0.35, z);
    group.add(leg);
  });

  const armGeometry = new THREE.BoxGeometry(0.32, 0.76, 0.32);
  const armZ = 0.46;
  [-0.56, 0.56].forEach((x) => {
    const arm = new THREE.Mesh(armGeometry, limbMaterial);
    arm.position.set(x, 0.96, armZ);
    arm.rotation.z = x < 0 ? 0.18 : -0.18;
    group.add(arm);
  });

  group.userData.baseY = 0.2;
  group.position.y = group.userData.baseY;
  return group;
}

function populateScenerySegment(segment) {
  const localSlots = [
    -SCENERY_SEGMENT_LENGTH * 0.42,
    -SCENERY_SEGMENT_LENGTH * 0.12,
    SCENERY_SEGMENT_LENGTH * 0.22,
  ];

  ["left", "right"].forEach((side) => {
    let buildingPlaced = false;
    localSlots.forEach((slot, index) => {
      const zOffset = slot + (Math.random() - 0.5) * 3.4;
      const shouldPlaceBuilding =
        Math.random() < 0.68 || (!buildingPlaced && index === localSlots.length - 1);

      if (shouldPlaceBuilding) {
        buildingPlaced = true;
        const width = 2.2 + Math.random() * 2.8;
        const depth = 2 + Math.random() * 2.4;
        const height = 4.2 + Math.random() * 7.6;
        const palette = buildingPalettes[Math.floor(Math.random() * buildingPalettes.length)];
        const building = createBlockBuilding(width, height, depth, palette);
        const xBase = side === "left"
          ? -10.4 - Math.random() * 1.6
          : 10.4 + Math.random() * 1.6;
        building.position.set(xBase, 0, zOffset);
        if (side === "right") {
          building.rotation.y = Math.PI;
        }
        segment.add(building);

        if (Math.random() < 0.52) {
          const vergeTree = createTreeBlock();
          const vergeX =
            side === "left"
              ? -7.6 - Math.random() * 0.7
              : 7.6 + Math.random() * 0.7;
          vergeTree.position.set(
            vergeX,
            0,
            zOffset + (Math.random() - 0.5) * 2.2
          );
          segment.add(vergeTree);
        }

        if (Math.random() < 0.45) {
          const podiumHeight = 0.25 + Math.random() * 0.15;
          const podiumZ = zOffset + (Math.random() - 0.5) * 1.2;
          const podium = new THREE.Mesh(
            new THREE.BoxGeometry(width * 1.08, podiumHeight, depth * 1.1),
            new THREE.MeshStandardMaterial({
              color: 0x374151,
              roughness: 0.85,
              metalness: 0.12,
            })
          );
          podium.position.set(xBase, podiumHeight / 2, podiumZ);
          segment.add(podium);
          building.position.y = podiumHeight;
          building.position.z = podiumZ;
        }
      } else {
        const tree = createTreeBlock();
        const lateralOffset =
          side === "left"
            ? -7.4 - Math.random() * 0.9
            : 7.4 + Math.random() * 0.9;
        tree.position.set(lateralOffset, 0, zOffset + (Math.random() - 0.5) * 2);
        segment.add(tree);
      }
    });
  });

  if (Math.random() < 0.42) {
    const plazaHeight = 0.18;
    const plaza = new THREE.Mesh(
      new THREE.BoxGeometry(3 + Math.random() * 2.4, plazaHeight, 6 + Math.random() * 3),
      new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.92,
      })
    );
    const plazaSide = Math.random() < 0.5 ? -9.2 - Math.random() * 1.6 : 9.2 + Math.random() * 1.6;
    plaza.position.set(plazaSide, plazaHeight / 2, (Math.random() - 0.5) * SCENERY_SEGMENT_LENGTH * 0.4);
    segment.add(plaza);
  }
}

function createCityScenery() {
  scenerySegments.length = 0;
  for (let index = 0; index < SCENERY_SEGMENT_COUNT; index += 1) {
    const segment = new THREE.Group();
    segment.position.set(0, 0, -index * SCENERY_SEGMENT_LENGTH - 16);
    populateScenerySegment(segment);
    sceneryGroup.add(segment);
    scenerySegments.push(segment);
  }
}

function resetScenery() {
  sceneryGroup.position.x = 0;
  scenerySegments.forEach((segment, index) => {
    segment.position.set(0, 0, -index * SCENERY_SEGMENT_LENGTH - 16);
  });
}

createCityScenery();

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

function clearBears() {
  state.bears.forEach((bear) => {
    wildlifeGroup.remove(bear.mesh);
  });
  state.bears = [];
}

function clearEffects() {
  state.scorePopups.forEach((popup) => {
    effectsGroup.remove(popup.mesh);
  });
  state.debrisPieces.forEach((piece) => {
    effectsGroup.remove(piece.mesh);
  });
  state.scorePopups = [];
  state.debrisPieces = [];
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
  state.bearTimer = 0;
  state.bearInterval = BEAR_SPAWN_BASE_INTERVAL;
  state.score = 0;
  state.lastTime = performance.now();
  clearEnemies();
  clearBears();
  clearEffects();
  resetLaneMarkers();
  resetScenery();
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

function spawnBear() {
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
  mesh.position.set(LANES[lane], mesh.userData.baseY ?? 0.2, spawnZ);
  mesh.userData.bobOffset = Math.random() * Math.PI * 2;
  wildlifeGroup.add(mesh);

  state.bears.push({
    mesh,
    laneIndex: lane,
    bobPhase: Math.random() * Math.PI * 2,
    collected: false,
  });
}

function createScorePopup(amount, impactPosition) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "bold 72px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const text = `+${amount}`;
  context.lineWidth = 8;
  context.strokeStyle = "rgba(15,23,42,0.75)";
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillStyle = "#fbbf24";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const baseScale = new THREE.Vector2(2.4, 1.2);
  sprite.scale.set(baseScale.x, baseScale.y, 1);
  const basePosition = impactPosition.clone().add(new THREE.Vector3(0, 1.4, 0));
  sprite.position.copy(basePosition);
  effectsGroup.add(sprite);

  state.scorePopups.push({
    mesh: sprite,
    basePosition,
    duration: 1.2,
    elapsed: 0,
    baseScale,
  });
}

function spawnBearDebris(impactPosition) {
  const debrisCount = 14 + Math.floor(Math.random() * 6);
  for (let index = 0; index < debrisCount; index += 1) {
    const size = 0.16 + Math.random() * 0.12;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8d6e58,
      emissive: 0x2f1b0e,
      emissiveIntensity: 0.18,
      roughness: 0.72,
      metalness: 0.08,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      0.4 + Math.random() * 0.6,
      (Math.random() - 0.5) * 0.8
    );
    mesh.position.copy(impactPosition).add(offset);
    effectsGroup.add(mesh);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      3.6 + Math.random() * 2.4,
      2 + Math.random() * 4
    );
    const angularVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    );

    state.debrisPieces.push({
      mesh,
      velocity,
      angularVelocity,
      elapsed: 0,
      lifespan: 1.4 + Math.random() * 0.6,
    });
  }
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

function updateScenery(delta) {
  if (!scenerySegments.length) {
    return;
  }
  const parallaxTarget = state.player.mesh.position.x * 0.12;
  sceneryGroup.position.x += (parallaxTarget - sceneryGroup.position.x) * 0.04;
  const advance = state.player.speed * delta * SCENERY_SCROLL_FACTOR;
  scenerySegments.forEach((segment) => {
    segment.position.z += advance;
    if (segment.position.z > SCENERY_RESET_Z) {
      segment.position.z -= SCENERY_LOOP_LENGTH;
    }
  });
}

function updateScorePopups(delta) {
  for (let i = state.scorePopups.length - 1; i >= 0; i -= 1) {
    const popup = state.scorePopups[i];
    popup.elapsed += delta;
    const progress = popup.elapsed / popup.duration;
    const mesh = popup.mesh;
    if (!(mesh && mesh.material)) {
      state.scorePopups.splice(i, 1);
      continue;
    }
    if (progress >= 1) {
      effectsGroup.remove(mesh);
      state.scorePopups.splice(i, 1);
      continue;
    }
    const rise = progress * 1.6;
    mesh.position.copy(popup.basePosition);
    mesh.position.y += rise;
    mesh.material.opacity = 1 - progress;
    const scaleFactor = 1 + progress * 0.35;
    mesh.scale.set(
      popup.baseScale.x * scaleFactor,
      popup.baseScale.y * scaleFactor,
      1
    );
  }
}

function updateDebrisPieces(delta) {
  const debrisGravity = 18;
  for (let i = state.debrisPieces.length - 1; i >= 0; i -= 1) {
    const piece = state.debrisPieces[i];
    const mesh = piece.mesh;
    if (!mesh) {
      state.debrisPieces.splice(i, 1);
      continue;
    }
    piece.elapsed += delta;
    if (piece.elapsed >= piece.lifespan) {
      effectsGroup.remove(mesh);
      state.debrisPieces.splice(i, 1);
      continue;
    }

    piece.velocity.y -= debrisGravity * delta;
    mesh.position.x += piece.velocity.x * delta;
    mesh.position.y = Math.max(
      0.18,
      mesh.position.y + piece.velocity.y * delta
    );
    mesh.position.z += piece.velocity.z * delta + state.player.speed * delta * 0.6;

    mesh.rotation.x += piece.angularVelocity.x * delta;
    mesh.rotation.y += piece.angularVelocity.y * delta;
    mesh.rotation.z += piece.angularVelocity.z * delta;

    const fade = 1 - piece.elapsed / piece.lifespan;
    if (mesh.material) {
      mesh.material.opacity = Math.max(0, fade);
    }
  }
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

function updateBears(delta) {
  for (let i = state.bears.length - 1; i >= 0; i -= 1) {
    const bear = state.bears[i];
    const mesh = bear.mesh;
    bear.bobPhase = (bear.bobPhase || mesh.userData.bobOffset || 0) + delta * 2.6;
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
      updateHud();
      createScorePopup(BEAR_SCORE_REWARD, impactPosition);
      spawnBearDebris(impactPosition);
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

function updateScore(delta) {
  state.score += state.player.speed * delta * 4.5;
  updateHud();
}

function update(delta) {
  updatePlayer(delta);
  updateScenery(delta);
  updateLaneMarkers(delta);
  updateEnemies(delta);
  updateBears(delta);
  updateScorePopups(delta);
  updateDebrisPieces(delta);
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

  state.bearTimer += delta;
  if (state.bearTimer > state.bearInterval) {
    spawnBear();
    state.bearTimer = 0;
    const intervalVariance = 2.6 + Math.random() * 3;
    const scoreFactor = Math.max(0, 1.2 - state.score * 0.0006);
    state.bearInterval = BEAR_SPAWN_BASE_INTERVAL * scoreFactor + intervalVariance;
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
