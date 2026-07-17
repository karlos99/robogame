import * as THREE from 'three';

const texLoader = new THREE.TextureLoader();
const texCache = {};

function loadTex(path, repeatX = 1, repeatY = 1) {
  if (texCache[path]) return texCache[path];
  const tex = texLoader.load(path);
  tex.wrapT = tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  texCache[path] = tex;
  return tex;
}

export function buildDroid(cfg) {
  const group = new THREE.Group();

  const bodyColor = new THREE.Color(cfg.colors.body);
  const headColor = new THREE.Color(cfg.colors.head);
  const baseColor = new THREE.Color(cfg.colors.base);
  const accentColor = new THREE.Color(cfg.colors.accent || '#2255aa');

  let bodyTexColor, bodyTexNormal, bodyTexRough, bodyTexMetal;
  try {
    bodyTexColor = loadTex('assets/textures/brushed_metal/MetalPlates007_2K-JPG_Color.jpg', 2, 1);
    bodyTexNormal = loadTex('assets/textures/brushed_metal/MetalPlates007_2K-JPG_NormalGL.jpg', 2, 1);
    bodyTexRough = loadTex('assets/textures/brushed_metal/MetalPlates007_2K-JPG_Roughness.jpg', 2, 1);
    bodyTexMetal = loadTex('assets/textures/brushed_metal/MetalPlates007_2K-JPG_Metalness.jpg', 2, 1);
  } catch (e) { /* fallback to color-only */ }

  let wheelTexColor, wheelTexNormal, wheelTexRough;
  try {
    wheelTexColor = loadTex('assets/textures/rubber/Asphalt014_2K-JPG_Color.jpg', 2, 2);
    wheelTexNormal = loadTex('assets/textures/rubber/Asphalt014_2K-JPG_NormalGL.jpg', 2, 2);
    wheelTexRough = loadTex('assets/textures/rubber/Asphalt014_2K-JPG_Roughness.jpg', 2, 2);
  } catch (e) { /* fallback */ }

  const bodyMatOpts = { color: bodyColor, roughness: 0.45, metalness: 0.5 };
  if (bodyTexColor) { bodyMatOpts.map = bodyTexColor; bodyMatOpts.normalMap = bodyTexNormal; bodyMatOpts.roughnessMap = bodyTexRough; bodyMatOpts.metalnessMap = bodyTexMetal; }
  const bodyMat = new THREE.MeshStandardMaterial(bodyMatOpts);

  const headMat = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.4, metalness: 0.4, envMapIntensity: 0.8 });
  const baseMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7, metalness: 0.6 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.35, metalness: 0.6 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x44ddff, emissive: 0x44ddff, emissiveIntensity: 0.6 });
  const frontGlowMat = new THREE.MeshStandardMaterial({ color: 0x44ffaa, emissive: 0x22cc88, emissiveIntensity: 0.9 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.2 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.85 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x334488, roughness: 0.4, metalness: 0.55 });

  let bodyRadius, bodyHeight;
  switch (cfg.body) {
    case 'heavy': bodyRadius = 0.65; bodyHeight = 0.9; break;
    case 'slim':  bodyRadius = 0.40; bodyHeight = 1.3; break;
    case 'sleek': bodyRadius = 0.50; bodyHeight = 1.1; break;
    case 'hover_body': bodyRadius = 0.60; bodyHeight = 0.5; break;
    case 'mech': bodyRadius = 0.55; bodyHeight = 1.0; break;
    default:      bodyRadius = 0.55; bodyHeight = 1.0; break;
  }

  switch (cfg.body) {
    case 'sleek': {
      const topR = bodyRadius * 0.7;
      const botR = bodyRadius;
      const sleekGeo = new THREE.CylinderGeometry(topR, botR, bodyHeight, 24);
      const sleekMesh = new THREE.Mesh(sleekGeo, bodyMat);
      sleekMesh.position.y = bodyHeight / 2;
      sleekMesh.castShadow = true;
      group.add(sleekMesh);

      const stripeGeo = new THREE.BoxGeometry(bodyRadius * 1.05, 0.03, 0.04);
      for (let i = 0; i < 3; i++) {
        const stripe = new THREE.Mesh(stripeGeo, accentMat);
        stripe.position.set(0, bodyHeight * (0.2 + i * 0.25), bodyRadius * 0.7);
        group.add(stripe);
      }
      break;
    }
    case 'hover_body': {
      const discGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 1.1, bodyHeight, 24);
      const discMesh = new THREE.Mesh(discGeo, bodyMat);
      discMesh.position.y = bodyHeight / 2 + 0.15;
      discMesh.castShadow = true;
      group.add(discMesh);

      const hoverGlowMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x2266cc, emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
      const hoverGlow = new THREE.Mesh(
        new THREE.TorusGeometry(bodyRadius * 0.9, 0.03, 8, 24),
        hoverGlowMat
      );
      hoverGlow.position.y = 0.15;
      hoverGlow.rotation.x = Math.PI / 2;
      group.add(hoverGlow);

      const topDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(bodyRadius * 0.5, bodyRadius * 0.6, 0.08, 16),
        accentMat
      );
      topDisc.position.y = bodyHeight + 0.19;
      group.add(topDisc);
      break;
    }
    case 'mech': {
      const mechGeo = new THREE.BoxGeometry(bodyRadius * 1.6, bodyHeight, bodyRadius * 1.2);
      const mechMesh = new THREE.Mesh(mechGeo, bodyMat);
      mechMesh.position.y = bodyHeight / 2;
      mechMesh.castShadow = true;
      group.add(mechMesh);

      for (let i = -1; i <= 1; i += 2) {
        const shoulderPlate = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, bodyHeight * 0.5, bodyRadius * 0.8),
          accentMat
        );
        shoulderPlate.position.set(i * (bodyRadius * 0.85), bodyHeight * 0.5, 0);
        group.add(shoulderPlate);
      }

      const frontArmor = new THREE.Mesh(
        new THREE.BoxGeometry(bodyRadius * 1.2, bodyHeight * 0.3, 0.05),
        panelMat
      );
      frontArmor.position.set(0, bodyHeight * 0.3, bodyRadius * 0.6);
      group.add(frontArmor);

      for (let i = -1; i <= 1; i += 2) {
        const vent = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.04, 0.06),
          darkMat
        );
        vent.position.set(i * bodyRadius * 0.4, bodyHeight * 0.7, bodyRadius * 0.61);
        group.add(vent);
      }
      break;
    }
    case 'heavy': {
      // Hexagonal blocky armor plate
      const heavyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 1.15, bodyHeight, 6);
      const heavyMesh = new THREE.Mesh(heavyGeo, bodyMat);
      heavyMesh.position.y = bodyHeight / 2;
      heavyMesh.castShadow = true;
      group.add(heavyMesh);

      // Add extra armor plates on sides
      const plateGeo = new THREE.BoxGeometry(bodyRadius * 0.6, bodyHeight * 0.75, 0.06);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const plate = new THREE.Mesh(plateGeo, accentMat);
        plate.position.set(Math.cos(angle) * (bodyRadius * 1.05), bodyHeight * 0.5, Math.sin(angle) * (bodyRadius * 1.05));
        plate.rotation.y = -angle + Math.PI / 2;
        plate.castShadow = true;
        group.add(plate);
      }
      break;
    }
    case 'slim': {
      const slimGeo = new THREE.CylinderGeometry(bodyRadius * 0.85, bodyRadius, bodyHeight, 16);
      const slimMesh = new THREE.Mesh(slimGeo, bodyMat);
      slimMesh.position.y = bodyHeight / 2;
      slimMesh.castShadow = true;
      group.add(slimMesh);

      // Vertical copper radiators / pipes
      const pipeGeo = new THREE.CylinderGeometry(0.015, 0.015, bodyHeight * 0.8, 8);
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0xd47a55, metalness: 0.9, roughness: 0.1 });
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.set(Math.cos(angle) * (bodyRadius * 0.95), bodyHeight * 0.5, Math.sin(angle) * (bodyRadius * 0.95));
        group.add(pipe);
      }
      break;
    }
    default: { // standard
      const capH = bodyHeight * 0.15;
      const topCap = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius, bodyRadius, capH, 20), bodyMat);
      topCap.position.y = bodyHeight - capH / 2;
      topCap.castShadow = true;
      group.add(topCap);

      const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius, bodyRadius, capH, 20), bodyMat);
      bottomCap.position.y = capH / 2;
      bottomCap.castShadow = true;
      group.add(bottomCap);

      // Inner glowing core
      const coreGeo = new THREE.CylinderGeometry(bodyRadius * 0.45, bodyRadius * 0.45, bodyHeight - capH * 2, 12);
      const coreMat = new THREE.MeshStandardMaterial({ color: 0x33aaff, emissive: 0x1166dd, emissiveIntensity: 2.0 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = bodyHeight / 2;
      group.add(core);
      group.userData.thrusterCore = core;

      // 3 Outer metal struts
      const strutGeo = new THREE.CylinderGeometry(0.025, 0.025, bodyHeight - capH, 8);
      for (let i = 0; i < 3; i++) {
        const strut = new THREE.Mesh(strutGeo, accentMat);
        const angle = (i * Math.PI * 2) / 3;
        strut.position.set(
          Math.cos(angle) * (bodyRadius - 0.02),
          bodyHeight / 2,
          Math.sin(angle) * (bodyRadius - 0.02)
        );
        strut.castShadow = true;
        group.add(strut);
      }
      break;
    }
  }

  const panelGeo = new THREE.BoxGeometry(bodyRadius * 0.35, bodyHeight * 0.12, 0.04);
  for (let i = -1; i <= 1; i += 2) {
    const p = new THREE.Mesh(panelGeo, panelMat);
    p.position.set(i * bodyRadius * 0.65, bodyHeight * 0.5, 0);
    group.add(p);
  }

  const frontPanelGeo = new THREE.BoxGeometry(bodyRadius * 0.6, bodyHeight * 0.08, 0.03);
  const frontPanel = new THREE.Mesh(frontPanelGeo, frontGlowMat);
  frontPanel.position.set(0, bodyHeight * 0.35, bodyRadius * 0.98);
  group.add(frontPanel);

  const rearPanelGeo = new THREE.BoxGeometry(bodyRadius * 0.4, bodyHeight * 0.06, 0.03);
  const rearPanelMat = new THREE.MeshStandardMaterial({ color: 0xcc2233, emissive: 0x881122, emissiveIntensity: 0.5 });
  const rearPanel = new THREE.Mesh(rearPanelGeo, rearPanelMat);
  rearPanel.position.set(0, bodyHeight * 0.4, -bodyRadius * 0.98);
  group.add(rearPanel);

  const headlightGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
  for (let i = -1; i <= 1; i += 2) {
    const hl = new THREE.Mesh(headlightGeo, frontGlowMat);
    hl.position.set(i * bodyRadius * 0.35, bodyHeight * 0.55, bodyRadius * 0.99);
    group.add(hl);
  }

  const headlightBeamGeo = new THREE.ConeGeometry(0.15, 0.6, 8, 1, true);
  const headlightBeamMat = new THREE.MeshStandardMaterial({ color: 0x44ffaa, emissive: 0x22cc88, emissiveIntensity: 0.2, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
  const headlightBeam = new THREE.Mesh(headlightBeamGeo, headlightBeamMat);
  headlightBeam.position.set(0, bodyHeight * 0.55, bodyRadius * 0.99 + 0.3);
  headlightBeam.rotation.x = Math.PI / 2;
  group.add(headlightBeam);

  const ringGeo = new THREE.TorusGeometry(bodyRadius * 0.95, 0.015, 8, 24);
  const ring = new THREE.Mesh(ringGeo, accentMat);
  ring.position.y = bodyHeight * 0.25;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const ring2 = new THREE.Mesh(ringGeo, accentMat);
  ring2.position.y = bodyHeight * 0.75;
  ring2.rotation.x = Math.PI / 2;
  group.add(ring2);

  const headGroup = new THREE.Group();
  const headY = bodyHeight + 0.05;

  switch (cfg.head) {
    case 'dome': {
      const domeGeo = new THREE.SphereGeometry(bodyRadius * 0.85, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const dome = new THREE.Mesh(domeGeo, headMat);
      dome.position.y = headY;
      dome.castShadow = true;
      headGroup.add(dome);

      const eyeGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.06, 12);
      const eye = new THREE.Mesh(eyeGeo, frontGlowMat);
      eye.position.set(0, headY + 0.02, bodyRadius * 0.78);
      eye.rotation.x = Math.PI / 3;
      headGroup.add(eye);

      const eyeRingGeo = new THREE.TorusGeometry(0.06, 0.01, 6, 12);
      const eyeRing = new THREE.Mesh(eyeRingGeo, chromeMat);
      eyeRing.position.set(0, headY + 0.02, bodyRadius * 0.78);
      eyeRing.rotation.x = Math.PI / 3;
      headGroup.add(eyeRing);

      const visorGeo = new THREE.BoxGeometry(bodyRadius * 0.5, 0.03, 0.08);
      const visorMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1, metalness: 0.9 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, headY + 0.08, bodyRadius * 0.6);
      headGroup.add(visor);

      const rearDotGeo = new THREE.SphereGeometry(0.025, 8, 6);
      const rearDotMat = new THREE.MeshStandardMaterial({ color: 0xff3344, emissive: 0xcc1122, emissiveIntensity: 0.6 });
      const rearDot = new THREE.Mesh(rearDotGeo, rearDotMat);
      rearDot.position.set(0, headY + 0.1, -bodyRadius * 0.6);
      headGroup.add(rearDot);
      break;
    }
    case 'sensor': {
      const sw = bodyRadius * 0.7, sh = 0.22, sd = bodyRadius * 0.5;
      const sensorGeo = new THREE.BoxGeometry(sw, sh, sd);
      const sensor = new THREE.Mesh(sensorGeo, headMat);
      sensor.position.y = headY + 0.11;
      sensor.castShadow = true;
      headGroup.add(sensor);

      const lensGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 12);
      for (let i = -1; i <= 1; i += 2) {
        const lens = new THREE.Mesh(lensGeo, frontGlowMat);
        lens.position.set(i * 0.18, headY + 0.11, sd / 2 + 0.025);
        lens.rotation.x = Math.PI / 2;
        headGroup.add(lens);

        const rimGeo = new THREE.TorusGeometry(0.055, 0.008, 6, 12);
        const rim = new THREE.Mesh(rimGeo, chromeMat);
        rim.position.set(i * 0.18, headY + 0.11, sd / 2 + 0.045);
        headGroup.add(rim);
      }

      const topGeo = new THREE.CylinderGeometry(sw * 0.3, sw * 0.35, 0.04, 8);
      const top = new THREE.Mesh(topGeo, darkMat);
      top.position.y = headY + sh / 2 + 0.03;
      headGroup.add(top);

      const rearLensGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8);
      const rearLensMat = new THREE.MeshStandardMaterial({ color: 0xff3344, emissive: 0xcc1122, emissiveIntensity: 0.5 });
      const rearLens = new THREE.Mesh(rearLensGeo, rearLensMat);
      rearLens.position.set(0, headY + 0.11, -sd / 2 - 0.02);
      rearLens.rotation.x = Math.PI / 2;
      headGroup.add(rearLens);
      break;
    }
    case 'antenna': {
      const sphereGeo = new THREE.SphereGeometry(bodyRadius * 0.45, 20, 14);
      const sphereMesh = new THREE.Mesh(sphereGeo, headMat);
      sphereMesh.position.y = headY + 0.05;
      sphereMesh.castShadow = true;
      headGroup.add(sphereMesh);

      const bandGeo = new THREE.TorusGeometry(bodyRadius * 0.42, 0.015, 8, 20);
      const band = new THREE.Mesh(bandGeo, accentMat);
      band.position.y = headY + 0.05;
      band.rotation.x = Math.PI / 2;
      headGroup.add(band);

      const rodGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.35, 8);
      const rod = new THREE.Mesh(rodGeo, darkMat);
      rod.position.set(0, headY + 0.28, 0);
      headGroup.add(rod);

      const tipGeo = new THREE.SphereGeometry(0.055, 10, 8);
      const tip = new THREE.Mesh(tipGeo, frontGlowMat);
      tip.position.set(0, headY + 0.45, 0);
      headGroup.add(tip);

      const dishGeo = new THREE.SphereGeometry(bodyRadius * 0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45);
      const dish = new THREE.Mesh(dishGeo, chromeMat);
      dish.position.set(bodyRadius * 0.4, headY + 0.15, 0);
      dish.rotation.z = -Math.PI / 6;
      headGroup.add(dish);

      const frontDotGeo = new THREE.SphereGeometry(0.02, 6, 4);
      const frontDot = new THREE.Mesh(frontDotGeo, frontGlowMat);
      frontDot.position.set(0, headY + 0.1, bodyRadius * 0.42);
      headGroup.add(frontDot);
      break;
    }
    case 'visor': {
      const visorBase = new THREE.Mesh(
        new THREE.BoxGeometry(bodyRadius * 1.4, 0.18, bodyRadius * 0.6),
        headMat
      );
      visorBase.position.y = headY + 0.09;
      visorBase.castShadow = true;
      headGroup.add(visorBase);

      const visorSlit = new THREE.Mesh(
        new THREE.BoxGeometry(bodyRadius * 1.2, 0.06, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1, metalness: 0.9 })
      );
      visorSlit.position.set(0, headY + 0.09, bodyRadius * 0.31);
      headGroup.add(visorSlit);

      const visorGlow = new THREE.Mesh(
        new THREE.BoxGeometry(bodyRadius * 1.1, 0.04, 0.03),
        frontGlowMat
      );
      visorGlow.position.set(0, headY + 0.09, bodyRadius * 0.33);
      headGroup.add(visorGlow);

      for (let i = -1; i <= 1; i += 2) {
        const lug = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), chromeMat);
        lug.position.set(i * bodyRadius * 0.65, headY + 0.09, 0);
        headGroup.add(lug);
      }

      const topRidge = new THREE.Mesh(
        new THREE.BoxGeometry(bodyRadius * 0.3, 0.04, bodyRadius * 0.5),
        accentMat
      );
      topRidge.position.set(0, headY + 0.2, 0);
      headGroup.add(topRidge);

      const rearDot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xff3344, emissive: 0xcc1122, emissiveIntensity: 0.5 }));
      rearDot.position.set(0, headY + 0.09, -bodyRadius * 0.31);
      headGroup.add(rearDot);
      break;
    }
    case 'box': {
      const boxHead = new THREE.Mesh(
        new THREE.BoxGeometry(bodyRadius * 1.1, 0.3, bodyRadius * 0.8),
        headMat
      );
      boxHead.position.y = headY + 0.15;
      boxHead.castShadow = true;
      headGroup.add(boxHead);

      const facePlate = new THREE.Mesh(
        new THREE.BoxGeometry(bodyRadius * 0.9, 0.2, 0.04),
        panelMat
      );
      facePlate.position.set(0, headY + 0.15, bodyRadius * 0.41);
      headGroup.add(facePlate);

      for (let i = -1; i <= 1; i += 2) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), frontGlowMat);
        eye.position.set(i * 0.12, headY + 0.18, bodyRadius * 0.42);
        headGroup.add(eye);

        const eyeRim = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 10), chromeMat);
        eyeRim.position.set(i * 0.12, headY + 0.18, bodyRadius * 0.43);
        headGroup.add(eyeRim);
      }

      const mouth = new THREE.Mesh(
        new THREE.BoxGeometry(bodyRadius * 0.4, 0.025, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x331111, emissiveIntensity: 0.3 })
      );
      mouth.position.set(0, headY + 0.08, bodyRadius * 0.42);
      headGroup.add(mouth);

      for (let i = -1; i <= 1; i += 2) {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.2, 6), darkMat);
        ant.position.set(i * 0.2, headY + 0.4, 0);
        headGroup.add(ant);

        const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), glowMat);
        antTip.position.set(i * 0.2, headY + 0.5, 0);
        headGroup.add(antTip);
      }

      const rearLight = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xff3344, emissive: 0xcc1122, emissiveIntensity: 0.5 }));
      rearLight.position.set(0, headY + 0.15, -bodyRadius * 0.41);
      headGroup.add(rearLight);
      break;
    }
    case 'turret': {
      const turretBase = new THREE.Mesh(
        new THREE.CylinderGeometry(bodyRadius * 0.5, bodyRadius * 0.55, 0.12, 16),
        darkMat
      );
      turretBase.position.y = headY + 0.06;
      turretBase.castShadow = true;
      headGroup.add(turretBase);

      const turretDome = new THREE.Mesh(
        new THREE.SphereGeometry(bodyRadius * 0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
        headMat
      );
      turretDome.position.y = headY + 0.12;
      turretDome.castShadow = true;
      headGroup.add(turretDome);

      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.04, 0.4, 10),
        chromeMat
      );
      barrel.position.set(0, headY + 0.2, bodyRadius * 0.55);
      barrel.rotation.x = Math.PI / 2;
      barrel.castShadow = true;
      headGroup.add(barrel);

      const muzzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.035, 0.06, 10),
        darkMat
      );
      muzzle.position.set(0, headY + 0.2, bodyRadius * 0.55 + 0.2);
      muzzle.rotation.x = Math.PI / 2;
      headGroup.add(muzzle);

      const muzzleGlow = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.006, 6, 10),
        frontGlowMat
      );
      muzzleGlow.position.set(0, headY + 0.2, bodyRadius * 0.55 + 0.23);
      headGroup.add(muzzleGlow);

      const sight = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), frontGlowMat);
      sight.position.set(0, headY + 0.35, bodyRadius * 0.25);
      headGroup.add(sight);

      const ringGeo2 = new THREE.TorusGeometry(bodyRadius * 0.42, 0.01, 8, 16);
      const turretRing = new THREE.Mesh(ringGeo2, accentMat);
      turretRing.position.y = headY + 0.12;
      turretRing.rotation.x = Math.PI / 2;
      headGroup.add(turretRing);
      break;
    }
  }
  group.add(headGroup);

  const baseGroup = new THREE.Group();

  const wheelMatOpts = { color: 0x1a1a1a, roughness: 0.95 };
  if (wheelTexColor) { wheelMatOpts.map = wheelTexColor; wheelMatOpts.normalMap = wheelTexNormal; wheelMatOpts.roughnessMap = wheelTexRough; }

  switch (cfg.base) {
    case 'wheels': {
      const wGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
      const wheelMat = new THREE.MeshStandardMaterial(wheelMatOpts);
      const positions = [
        [0, 0.06, bodyRadius * 1.1],
        [-bodyRadius * 0.7, 0.06, -bodyRadius * 0.9],
        [bodyRadius * 0.7, 0.06, -bodyRadius * 0.9]
      ];
      const wheelsList = [];
      for (const p of positions) {
        const w = new THREE.Mesh(wGeo, wheelMat);
        w.position.set(p[0], p[1], p[2]);
        w.rotation.z = Math.PI / 2;
        w.castShadow = true;
        baseGroup.add(w);
        wheelsList.push(w);

        const hubGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.13, 6);
        const hub = new THREE.Mesh(hubGeo, chromeMat);
        hub.position.set(p[0], p[1], p[2]);
        hub.rotation.z = Math.PI / 2;
        baseGroup.add(hub);
      }
      group.userData.wheels = wheelsList;

      const legMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6, metalness: 0.5 });
      const legGeo = new THREE.CylinderGeometry(0.035, 0.055, 0.22, 8);
      for (const p of positions) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(p[0], 0.17, p[2]);
        baseGroup.add(leg);
      }
      break;
    }
    case 'tracks': {
      const trackW = 0.13, trackH = 0.16, trackD = bodyRadius * 1.7;
      const trackMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7, metalness: 0.5 });
      const rollersList = [];
      for (let side = -1; side <= 1; side += 2) {
        const tGeo = new THREE.BoxGeometry(trackW, trackH, trackD);
        const t = new THREE.Mesh(tGeo, trackMat);
        t.position.set(side * (bodyRadius + 0.07), trackH / 2, 0);
        t.castShadow = true;
        baseGroup.add(t);

        const rollerGeo = new THREE.CylinderGeometry(0.04, 0.04, trackW + 0.01, 10);
        const rollerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        for (let i = -2; i <= 2; i++) {
          const roller = new THREE.Mesh(rollerGeo, rollerMat);
          roller.position.set(side * (bodyRadius + 0.07), 0.04, i * trackD / 5);
          roller.rotation.x = Math.PI / 2;
          baseGroup.add(roller);
          rollersList.push(roller);
        }

        const beltMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
        for (let i = -2; i <= 2; i++) {
          const belt = new THREE.Mesh(new THREE.BoxGeometry(trackW + 0.02, 0.025, 0.04), beltMat);
          belt.position.set(side * (bodyRadius + 0.07), trackH - 0.01, i * trackD / 5);
          baseGroup.add(belt);
        }
      }
      group.userData.rollers = rollersList;
      break;
    }
    case 'hovers': {
      const hoverMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.4, metalness: 0.7 });
      const glowMatH = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x2266cc, emissiveIntensity: 0.6, transparent: true, opacity: 0.8 });
      const positions = [
        [0, 0, bodyRadius * 1.0],
        [-bodyRadius * 0.6, 0, -bodyRadius * 0.8],
        [bodyRadius * 0.6, 0, -bodyRadius * 0.8]
      ];
      const hoverGlows = [];
      for (const p of positions) {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.06, 12), hoverMat);
        pad.position.set(p[0], 0.04, p[2]);
        baseGroup.add(pad);

        const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.03, 12), glowMatH);
        glow.position.set(p[0], 0.005, p[2]);
        baseGroup.add(glow);
        hoverGlows.push(glow);

        const ringGeo2 = new THREE.TorusGeometry(0.14, 0.008, 6, 12);
        const ring = new THREE.Mesh(ringGeo2, chromeMat);
        ring.position.set(p[0], 0.05, p[2]);
        ring.rotation.x = Math.PI / 2;
        baseGroup.add(ring);
      }
      group.userData.hoverGlows = hoverGlows;
      break;
    }
  }
  group.add(baseGroup);

  const accessoryGroup = new THREE.Group();
  const accColor = cfg.colors.accent || '#2255aa';
  const accMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accColor), roughness: 0.4, metalness: 0.6 });

  switch (cfg.accessory) {
    case 'arm': {
      const shoulderGeo = new THREE.SphereGeometry(0.06, 10, 8);
      const shoulder = new THREE.Mesh(shoulderGeo, chromeMat);
      shoulder.position.set(bodyRadius * 0.85, bodyHeight * 0.55, 0);
      accessoryGroup.add(shoulder);

      const armGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.3, 8);
      const arm = new THREE.Mesh(armGeo, accMat);
      arm.position.set(bodyRadius * 0.85 + 0.15, bodyHeight * 0.45, 0);
      arm.rotation.z = Math.PI / 4;
      accessoryGroup.add(arm);

      const elbowGeo = new THREE.SphereGeometry(0.035, 8, 6);
      const elbow = new THREE.Mesh(elbowGeo, chromeMat);
      elbow.position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.35, 0);
      accessoryGroup.add(elbow);

      const forearmGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.2, 8);
      const forearm = new THREE.Mesh(forearmGeo, accMat);
      forearm.position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.25, 0);
      accessoryGroup.add(forearm);

      const clawGeo = new THREE.BoxGeometry(0.06, 0.015, 0.04);
      const claw = new THREE.Mesh(clawGeo, chromeMat);
      claw.position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.15, 0);
      accessoryGroup.add(claw);

      const claw2 = new THREE.Mesh(clawGeo, chromeMat);
      claw2.position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.15, 0);
      claw2.rotation.x = Math.PI / 6;
      accessoryGroup.add(claw2);
      break;
    }
    case 'shield': {
      const orbGeo = new THREE.IcosahedronGeometry(0.12, 1);
      const orbMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x2266cc, emissiveIntensity: 0.6, transparent: true, opacity: 0.8 });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(0, bodyHeight * 0.5, -bodyRadius * 0.85);
      accessoryGroup.add(orb);

      const mountGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.15, 8);
      const mount = new THREE.Mesh(mountGeo, darkMat);
      mount.position.set(0, bodyHeight * 0.5, -bodyRadius * 0.7);
      mount.rotation.x = Math.PI / 2;
      accessoryGroup.add(mount);

      const shieldRingGeo = new THREE.TorusGeometry(0.18, 0.012, 8, 20);
      const shieldRingMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x4488cc, emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
      const shieldRing = new THREE.Mesh(shieldRingGeo, shieldRingMat);
      shieldRing.position.set(0, bodyHeight * 0.5, -bodyRadius * 0.85);
      accessoryGroup.add(shieldRing);
      break;
    }
    case 'jetpack': {
      const jetpackFlames = [];
      for (let side = -1; side <= 1; side += 2) {
        const podGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 10);
        const pod = new THREE.Mesh(podGeo, accMat);
        pod.position.set(side * (bodyRadius * 0.7), bodyHeight * 0.5, -bodyRadius * 0.3);
        pod.castShadow = true;
        accessoryGroup.add(pod);

        const nozzleGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.08, 10);
        const nozzle = new THREE.Mesh(nozzleGeo, chromeMat);
        nozzle.position.set(side * (bodyRadius * 0.7), bodyHeight * 0.32, -bodyRadius * 0.3);
        accessoryGroup.add(nozzle);

        const flameGeo = new THREE.ConeGeometry(0.05, 0.15, 8);
        const flameMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x2266ff, emissiveIntensity: 1.0, transparent: true, opacity: 0.8 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(side * (bodyRadius * 0.7), bodyHeight * 0.22, -bodyRadius * 0.3);
        flame.rotation.x = Math.PI;
        accessoryGroup.add(flame);
        jetpackFlames.push(flame);
      }

      const strapGeo = new THREE.BoxGeometry(bodyRadius * 1.4, 0.03, 0.03);
      const strap = new THREE.Mesh(strapGeo, darkMat);
      strap.position.set(0, bodyHeight * 0.5, -bodyRadius * 0.3);
      accessoryGroup.add(strap);
      group.userData.jetpackFlames = jetpackFlames;
      break;
    }
    case 'radar': {
      const radarArmGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.22, 6);
      const radarArm = new THREE.Mesh(radarArmGeo, darkMat);
      radarArm.position.set(bodyRadius * 0.5, bodyHeight + 0.11, 0);
      accessoryGroup.add(radarArm);

      const radarHead = new THREE.Group();
      radarHead.position.set(bodyRadius * 0.5, bodyHeight + 0.22, 0);

      const dishGeo = new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45);
      const dish = new THREE.Mesh(dishGeo, accMat);
      dish.rotation.x = -Math.PI / 4;
      radarHead.add(dish);

      const feedGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 4);
      const feed = new THREE.Mesh(feedGeo, glowMat);
      feed.position.set(0, -0.06, 0.08);
      feed.rotation.x = -Math.PI / 4;
      radarHead.add(feed);

      const tipGeo = new THREE.SphereGeometry(0.02, 6, 4);
      const tip = new THREE.Mesh(tipGeo, glowMat);
      tip.position.set(0, 0, 0.12);
      radarHead.add(tip);

      accessoryGroup.add(radarHead);
      group.userData.radarHead = radarHead;
      break;
    }
  }
  group.add(accessoryGroup);

  const fwdIndicator = new THREE.Group();
  const fwdMat = new THREE.MeshStandardMaterial({
    color: 0x33ffaa,
    emissive: 0x00ff88,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const fwdTriangle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 4), fwdMat);
  fwdTriangle.rotation.x = -Math.PI / 2;
  fwdTriangle.position.set(0, 0.12, bodyRadius + 0.32);
  fwdIndicator.add(fwdTriangle);

  const fwdLine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.2), fwdMat);
  fwdLine.position.set(0, 0.12, bodyRadius + 0.08);
  fwdIndicator.add(fwdLine);
  group.add(fwdIndicator);

  let speed = cfg.base === 'tracks' ? 4.8 : cfg.base === 'wheels' ? 6.5 : 5.6;
  let turnSpeed = cfg.head === 'sensor' ? 0.075 : cfg.head === 'antenna' ? 0.065 : cfg.head === 'turret' ? 0.055 : 0.068;
  let armor = cfg.body === 'heavy' ? 4 : cfg.body === 'mech' ? 5 : cfg.body === 'standard' ? 3 : cfg.body === 'hover_body' ? 2 : 2;

  switch (cfg.head) {
    case 'visor': turnSpeed += 0.01; break;
    case 'box': armor += 1; break;
    case 'turret': turnSpeed -= 0.008; armor += 1; break;
  }

  switch (cfg.accessory) {
    case 'arm': armor += 1; break;
    case 'shield': armor += 2; speed -= 0.6; break;
    case 'jetpack': speed += 0.8; armor -= 1; break;
    case 'radar': turnSpeed += 0.012; break;
  }
  speed = Math.max(1, speed);
  armor = Math.max(1, armor);

  Object.assign(group.userData, {
    speed,
    turnSpeed: Math.min(turnSpeed, 0.14),
    armor,
    hitboxRadius: bodyRadius * 0.9,
    accessory: cfg.accessory || 'none',
    baseType: cfg.base
  });

  return group;
}
