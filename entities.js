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
  group.userData.bodyMesh = body;

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
  group.userData.frontLight = frontLight;

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

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(1.16, 1.82, 0.92),
    furMaterial
  );
  torso.position.y = 1.24;
  group.add(torso);

  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 1.12, 0.62),
    new THREE.MeshStandardMaterial({
      color: 0x8d6e58,
      roughness: 0.7,
      metalness: 0.05,
    })
  );
  belly.position.set(0, 1.12, 0.34);
  group.add(belly);

  const shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(1.26, 0.66, 0.88),
    furMaterial
  );
  shoulder.position.set(0, 1.78, 0.14);
  group.add(shoulder);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.84, 0.88),
    furMaterial
  );
  head.position.set(0, 2.24, 0.32);
  group.add(head);

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.36, 0.56),
    new THREE.MeshStandardMaterial({
      color: 0xd1b199,
      roughness: 0.6,
      metalness: 0.02,
    })
  );
  snout.position.set(0, 2.06, 0.86);
  group.add(snout);

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.16, 0.22),
    new THREE.MeshStandardMaterial({
      color: 0x1d1b1b,
      roughness: 0.5,
      metalness: 0.3,
    })
  );
  nose.position.set(0, 2.12, 1.05);
  group.add(nose);

  const earGeometry = new THREE.BoxGeometry(0.32, 0.26, 0.18);
  const innerEarMaterial = new THREE.MeshStandardMaterial({
    color: 0xe3c4ab,
    roughness: 0.65,
    metalness: 0.05,
  });
  const leftEar = new THREE.Mesh(earGeometry, furMaterial);
  leftEar.position.set(-0.34, 2.62, 0.18);
  group.add(leftEar);
  const rightEar = leftEar.clone();
  rightEar.position.x = 0.34;
  group.add(rightEar);

  const leftInnerEar = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.18, 0.1),
    innerEarMaterial
  );
  leftInnerEar.position.set(-0.34, 2.62, 0.28);
  group.add(leftInnerEar);
  const rightInnerEar = leftInnerEar.clone();
  rightInnerEar.position.x = 0.34;
  group.add(rightInnerEar);

  const limbMaterial = furMaterial.clone();
  limbMaterial.roughness = 0.85;

  const legGeometry = new THREE.BoxGeometry(0.46, 1.08, 0.54);
  [-0.38, 0.38].forEach((x) => {
    const leg = new THREE.Mesh(legGeometry, limbMaterial);
    leg.position.set(x, 0.54, 0.06);
    group.add(leg);

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.18, 0.62),
      limbMaterial
    );
    foot.position.set(0, -0.45, 0.18);
    leg.add(foot);
  });

  const armGeometry = new THREE.BoxGeometry(0.36, 1.26, 0.34);
  [-0.82, 0.82].forEach((x) => {
    const arm = new THREE.Mesh(armGeometry, limbMaterial);
    arm.position.set(x, 1.46, 0.38);
    arm.rotation.z = x < 0 ? 0.28 : -0.28;
    arm.rotation.x = -0.18;
    group.add(arm);

    const paw = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.24, 0.4),
      limbMaterial
    );
    paw.position.set(0, -0.62, 0.12);
    arm.add(paw);
  });

  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.16, 0.1),
    furMaterial
  );
  brow.position.set(0, 2.32, 0.68);
  group.add(brow);

  group.scale.setScalar(1.08);

  const baseY = 0.22;
  group.userData.baseY = baseY;
  group.position.y = group.userData.baseY;
  return group;
}

export function createPoliceCar(options = {}) {
  const { facingBackward = true } = options;
  const car = createCarBody(0xffffff, { facingBackward });

  const bodyMesh = car.userData.bodyMesh;
  if (bodyMesh) {
    bodyMesh.material = bodyMesh.material.clone();
    bodyMesh.material.color.setHex(0xffffff);
    bodyMesh.material.metalness = 0.62;
    bodyMesh.material.roughness = 0.38;

    const lowerMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.7,
      roughness: 0.28,
    });

    const lowerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.48, 0.28, 2.72),
      lowerMaterial
    );
    lowerPanel.position.set(0, 0.34, 0);
    lowerPanel.castShadow = true;
    lowerPanel.receiveShadow = true;
    car.add(lowerPanel);

    const hoodPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.44, 0.18, 1.24),
      lowerMaterial
    );
    hoodPanel.position.set(0, 0.78, 0.62);
    hoodPanel.castShadow = true;
    hoodPanel.receiveShadow = true;
    car.add(hoodPanel);
  }

  const barBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.12, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x0b1020, metalness: 0.8, roughness: 0.2 })
  );
  barBase.position.set(0, 1.1, -0.1);
  car.add(barBase);

  const matRed = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    emissive: 0xff0000,
    emissiveIntensity: 0.18,
  });
  const matBlue = new THREE.MeshStandardMaterial({
    color: 0x4dabff,
    emissive: 0x0080ff,
    emissiveIntensity: 0.18,
  });

  const leftLamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.18), matRed);
  leftLamp.position.set(-0.22, 0, 0);
  barBase.add(leftLamp);

  const rightLamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.18), matBlue);
  rightLamp.position.set(0.22, 0, 0);
  barBase.add(rightLamp);

  const redPoint = new THREE.PointLight(0xff3b3b, 0.0, 12, 2);
  redPoint.position.set(-0.22, 0.06, 0);
  barBase.add(redPoint);

  const bluePoint = new THREE.PointLight(0x4dabff, 0.0, 12, 2);
  bluePoint.position.set(0.22, 0.06, 0);
  barBase.add(bluePoint);

  car.userData.sirenMaterials = [matRed, matBlue];
  car.userData.sirenLights = [redPoint, bluePoint];

  const frontLight = car.userData.frontLight;
  if (frontLight && frontLight.material) {
    frontLight.material = frontLight.material.clone();
    frontLight.material.color.setHex(0xf8fbff);
    frontLight.material.emissive.setHex(0xffffff);
    frontLight.material.emissiveIntensity = 1.4;

    const headlampLeft = new THREE.PointLight(0xf8fbff, 3.2, 34, 2);
    headlampLeft.position.set(-0.42, 0.44, 1.32);
    car.add(headlampLeft);

    const headlampRight = headlampLeft.clone();
    headlampRight.position.x = 0.42;
    car.add(headlampRight);

    car.userData.policeHeadlights = [headlampLeft, headlampRight];
  }

  return car;
}
