import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

import { canvas } from "./ui.js";
import { LANES, MARKER_ROWS, MARKER_SPACING } from "./constants.js";

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

const scene = new THREE.Scene();
const daySkyColor = 0x87ceeb;
scene.background = new THREE.Color(daySkyColor);
scene.fog = new THREE.Fog(daySkyColor, 80, 220);

const camera = new THREE.PerspectiveCamera(
  60,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  200
);
camera.position.set(0, 4.5, 8.4);
camera.lookAt(0, 1.6, -20);
scene.add(camera);

const hemiLight = new THREE.HemisphereLight(0xdff1ff, 0xf6e6d2, 0.95);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
dirLight.position.set(-12, 18, 6);
scene.add(dirLight);

const roadGroup = new THREE.Group();
scene.add(roadGroup);

const sceneryGroup = new THREE.Group();
scene.add(sceneryGroup);

const wildlifeGroup = new THREE.Group();
scene.add(wildlifeGroup);

const effectsGroup = new THREE.Group();
scene.add(effectsGroup);

const collectiblesGroup = new THREE.Group();
scene.add(collectiblesGroup);

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

createGround();
createRoadSurface();
createGuardRails();
createLaneMarkers();

export function resizeRenderer() {
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

export function resetLaneMarkers() {
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

export function updateLaneMarkers(delta, player) {
  const advance = player.speed * delta;
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

export {
  renderer,
  scene,
  camera,
  laneMarkers,
  roadGroup,
  sceneryGroup,
  wildlifeGroup,
  effectsGroup,
  collectiblesGroup,
};
