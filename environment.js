import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

import {
  SCENERY_SEGMENT_COUNT,
  SCENERY_SEGMENT_LENGTH,
  SCENERY_LOOP_LENGTH,
  SCENERY_RESET_Z,
  SCENERY_SCROLL_FACTOR,
} from "./constants.js";
import { sceneryGroup } from "./scene.js";

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

export const scenerySegments = [];

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
      color:
        treeLeafPalette[Math.floor(Math.random() * treeLeafPalette.length)],
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
        Math.random() < 0.68 ||
        (!buildingPlaced && index === localSlots.length - 1);

      if (shouldPlaceBuilding) {
        buildingPlaced = true;
        const width = 2.2 + Math.random() * 2.8;
        const depth = 2 + Math.random() * 2.4;
        const height = 4.2 + Math.random() * 7.6;
        const palette =
          buildingPalettes[Math.floor(Math.random() * buildingPalettes.length)];
        const building = createBlockBuilding(width, height, depth, palette);
        const xBase =
          side === "left"
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
        tree.position.set(
          lateralOffset,
          0,
          zOffset + (Math.random() - 0.5) * 2
        );
        segment.add(tree);
      }
    });
  });

  if (Math.random() < 0.42) {
    const plazaHeight = 0.18;
    const plaza = new THREE.Mesh(
      new THREE.BoxGeometry(
        3 + Math.random() * 2.4,
        plazaHeight,
        6 + Math.random() * 3
      ),
      new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.92,
      })
    );
    const plazaSide =
      Math.random() < 0.5 ? -9.2 - Math.random() * 1.6 : 9.2 + Math.random() * 1.6;
    plaza.position.set(
      plazaSide,
      plazaHeight / 2,
      (Math.random() - 0.5) * SCENERY_SEGMENT_LENGTH * 0.4
    );
    segment.add(plaza);
  }
}

export function createCityScenery() {
  scenerySegments.length = 0;
  for (let index = 0; index < SCENERY_SEGMENT_COUNT; index += 1) {
    const segment = new THREE.Group();
    segment.position.set(0, 0, -index * SCENERY_SEGMENT_LENGTH - 16);
    populateScenerySegment(segment);
    sceneryGroup.add(segment);
    scenerySegments.push(segment);
  }
}

export function resetScenery() {
  sceneryGroup.position.x = 0;
  scenerySegments.forEach((segment, index) => {
    segment.position.set(0, 0, -index * SCENERY_SEGMENT_LENGTH - 16);
  });
}

export function updateScenery(delta, player) {
  if (!scenerySegments.length || !player) {
    return;
  }
  const playerMesh = player.mesh;
  const parallaxTarget = playerMesh.position.x * 0.12;
  sceneryGroup.position.x += (parallaxTarget - sceneryGroup.position.x) * 0.04;
  const advance = player.speed * delta * SCENERY_SCROLL_FACTOR;
  scenerySegments.forEach((segment) => {
    segment.position.z += advance;
    if (segment.position.z > SCENERY_RESET_Z) {
      segment.position.z -= SCENERY_LOOP_LENGTH;
    }
  });
}
