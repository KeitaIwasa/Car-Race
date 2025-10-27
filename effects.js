import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

import { SCORE_POPUP_DURATION } from "./constants.js";
import { effectsGroup } from "./scene.js";

export function createScorePopup(amount, impactPosition, state) {
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
    duration: SCORE_POPUP_DURATION,
    elapsed: 0,
    baseScale,
  });
}

export function spawnBearDebris(impactPosition, state) {
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

export function updateScorePopups(state, delta) {
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

export function updateDebrisPieces(state, delta) {
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

export function clearEffects(state) {
  state.scorePopups.forEach((popup) => {
    effectsGroup.remove(popup.mesh);
  });
  state.debrisPieces.forEach((piece) => {
    effectsGroup.remove(piece.mesh);
  });
  state.scorePopups = [];
  state.debrisPieces = [];
}
