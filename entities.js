import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

export function createPassenger() {
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

export function createCarBody(color, options = {}) {
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
  const frontLight = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.12, 0.22),
    accentMaterial
  );
  frontLight.position.set(0, 0.38, 1.35);
  group.add(frontLight);

  const rearLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    emissive: 0xff1f5b,
    emissiveIntensity: 0.55,
  });
  const rearLight = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.12, 0.22),
    rearLightMaterial
  );
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

export function createBear() {
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
