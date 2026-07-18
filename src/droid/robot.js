import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { PBRMetallicRoughnessMaterial } from '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial';

function hexToColor3(hex) {
  if (typeof hex === 'number') {
    const r = ((hex >> 16) & 0xff) / 255;
    const g = ((hex >> 8) & 0xff) / 255;
    const b = (hex & 0xff) / 255;
    return new Color3(r, g, b);
  }
  const str = hex.startsWith('#') ? hex : '#' + hex;
  const r = parseInt(str.slice(1, 3), 16) / 255;
  const g = parseInt(str.slice(3, 5), 16) / 255;
  const b = parseInt(str.slice(5, 7), 16) / 255;
  return new Color3(r, g, b);
}

const texCache = {};

export function clearTexCache() {
  for (const k in texCache) delete texCache[k];
}

function loadTex(scene, path, repeatX = 1, repeatY = 1) {
  if (texCache[path]) return texCache[path];
  const tex = new Texture(path, scene);
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.uScale = repeatX;
  tex.vScale = repeatY;
  texCache[path] = tex;
  return tex;
}

function makePBR(scene, color, roughness = 0.45, metallic = 0.5) {
  const mat = new PBRMetallicRoughnessMaterial('mat_' + Math.random(), scene);
  mat.baseColor = hexToColor3(color);
  mat.roughness = roughness;
  mat.metallic = metallic;
  return mat;
}

function makeStandard(scene, color, opts = {}) {
  const mat = new StandardMaterial('mat_' + Math.random(), scene);
  mat.diffuseColor = hexToColor3(color);
  if (opts.emissive) mat.emissiveColor = hexToColor3(opts.emissive);
  if (opts.emissiveIntensity !== undefined) mat.emissiveColor.scaleInPlace(opts.emissiveIntensity);
  mat.specularColor = new Color3(0.1, 0.1, 0.1);
  mat.specularPower = 64;
  if (opts.emissiveIntensity !== undefined) {
    const ec = mat.emissiveColor;
    const ei = opts.emissiveIntensity;
    mat.emissiveColor = new Color3(ec.r * ei, ec.g * ei, ec.b * ei);
  }
  if (opts.transparent) {
    mat.alpha = opts.opacity || 1;
    mat.backFaceCulling = false;
  }
  if (opts.wireframe) mat.wireframe = true;
  if (opts.disableLighting) mat.disableLighting = true;
  return mat;
}

export function buildDroid(cfg, scene) {
  const root = new TransformNode('droid', scene);

  const bodyColor = cfg.colors.body;
  const headColor = cfg.colors.head;
  const baseColor = cfg.colors.base;
  const accentColor = cfg.colors.accent || '#2255aa';

  const bodyMat = makePBR(scene, bodyColor, 0.45, 0.5);
  try {
    const texColor = loadTex(scene, 'assets/textures/brushed_metal/MetalPlates007_2K-JPG_Color.jpg', 2, 1);
    const texNormal = loadTex(scene, 'assets/textures/brushed_metal/MetalPlates007_2K-JPG_NormalGL.jpg', 2, 1);
    const texRough = loadTex(scene, 'assets/textures/brushed_metal/MetalPlates007_2K-JPG_Roughness.jpg', 2, 1);
    const texMetal = loadTex(scene, 'assets/textures/brushed_metal/MetalPlates007_2K-JPG_Metalness.jpg', 2, 1);
    bodyMat.baseTexture = texColor;
    bodyMat.normalTexture = texNormal;
    bodyMat.roughnessTexture = texRough;
    bodyMat.metallicTexture = texMetal;
  } catch (e) { /* fallback to color-only */ }

  const headMat = makePBR(scene, headColor, 0.4, 0.4);
  const baseMat = makePBR(scene, baseColor, 0.7, 0.6);
  const accentMat = makePBR(scene, accentColor, 0.35, 0.6);
  const glowMat = makeStandard(scene, '#44ddff', { emissive: '#44ddff', emissiveIntensity: 0.6 });
  const frontGlowMat = makeStandard(scene, '#44ffaa', { emissive: '#22cc88', emissiveIntensity: 0.9 });
  const darkMat = makeStandard(scene, '#222222', { roughness: 0.8, metallic: 0.2 });
  const chromeMat = makePBR(scene, '#cccccc', 0.15, 0.85);
  const panelMat = makePBR(scene, '#334488', 0.4, 0.55);

  let bodyRadius, bodyHeight;
  switch (cfg.body) {
    case 'heavy': bodyRadius = 0.65; bodyHeight = 0.9; break;
    case 'slim': bodyRadius = 0.40; bodyHeight = 1.3; break;
    case 'sleek': bodyRadius = 0.50; bodyHeight = 1.1; break;
    case 'hover_body': bodyRadius = 0.60; bodyHeight = 0.5; break;
    case 'mech': bodyRadius = 0.55; bodyHeight = 1.0; break;
    case 'sphere': bodyRadius = 0.55; bodyHeight = 1.1; break;
    case 'insect': bodyRadius = 0.50; bodyHeight = 1.05; break;
    default: bodyRadius = 0.55; bodyHeight = 1.0; break;
  }

  function addMesh(mesh, parent, y, castShadow = true) {
    mesh.parent = parent;
    mesh.position.y = y || 0;
    mesh.isPickable = false;
    if (castShadow) mesh.receiveShadows = true;
    return mesh;
  }

  function createCylinder(name, topR, botR, height, tess, mat, parent, y, castShadow = true) {
    const m = MeshBuilder.CreateCylinder(name, { diameterTop: topR * 2, diameterBottom: botR * 2, height, tessellation: tess }, scene);
    m.material = mat;
    return addMesh(m, parent, y, castShadow);
  }

  function createBox(name, w, h, d, mat, parent, y) {
    const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    m.material = mat;
    return addMesh(m, parent, y);
  }

  function createSphere(name, diam, segs, mat, parent, y, castShadow = true) {
    const m = MeshBuilder.CreateSphere(name, { diameter: diam, segments: segs }, scene);
    m.material = mat;
    return addMesh(m, parent, y, castShadow);
  }

  function createTorus(name, diam, thick, tess, mat, parent, y) {
    const m = MeshBuilder.CreateTorus(name, { diameter: diam, thickness: thick, tessellation: tess }, scene);
    m.material = mat;
    return addMesh(m, parent, y);
  }

  // === BODY ===
  const bodyGroup = new TransformNode('body', scene);
  bodyGroup.parent = root;

  switch (cfg.body) {
    case 'sleek': {
      const topR = bodyRadius * 0.7;
      const botR = bodyRadius;
      createCylinder('sleek', topR, botR, bodyHeight, 24, bodyMat, bodyGroup, bodyHeight / 2);
      const stripeGeo = createBox('stripe', bodyRadius * 1.05, 0.03, 0.04, accentMat, null, 0);
      for (let i = 0; i < 3; i++) {
        const s = stripeGeo.clone('stripe_' + i);
        s.parent = bodyGroup;
        s.position.set(0, bodyHeight * (0.2 + i * 0.25), bodyRadius * 0.7);
      }
      stripeGeo.dispose();
      break;
    }
    case 'hover_body': {
      createCylinder('disc', bodyRadius, bodyRadius * 1.1, bodyHeight, 24, bodyMat, bodyGroup, bodyHeight / 2 + 0.15);
      const hoverGlowMat = makeStandard(scene, '#44aaff', { emissive: '#2266cc', emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
      const hg = createTorus('hoverGlow', bodyRadius * 0.9 * 2, 0.03, 24, hoverGlowMat, bodyGroup, 0.15);
      hg.rotation.x = Math.PI / 2;
      createCylinder('topDisc', bodyRadius * 0.5, bodyRadius * 0.6, 0.08, 16, accentMat, bodyGroup, bodyHeight + 0.19, false);
      break;
    }
    case 'mech': {
      createBox('mechBody', bodyRadius * 1.6, bodyHeight, bodyRadius * 1.2, bodyMat, bodyGroup, bodyHeight / 2);
      for (let i = -1; i <= 1; i += 2) {
        const sp = createBox('shoulder', 0.08, bodyHeight * 0.5, bodyRadius * 0.8, accentMat, bodyGroup, bodyHeight * 0.5);
        sp.position.x = i * (bodyRadius * 0.85);
      }
      createBox('frontArmor', bodyRadius * 1.2, bodyHeight * 0.3, 0.05, panelMat, bodyGroup, bodyHeight * 0.3).position.z = bodyRadius * 0.6;
      for (let i = -1; i <= 1; i += 2) {
        const v = createBox('vent', 0.04, 0.04, 0.06, darkMat, bodyGroup, bodyHeight * 0.7);
        v.position.set(i * bodyRadius * 0.4, 0, bodyRadius * 0.61);
      }
      break;
    }
    case 'heavy': {
      createCylinder('heavy', bodyRadius, bodyRadius * 1.15, bodyHeight, 6, bodyMat, bodyGroup, bodyHeight / 2);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const plate = createBox('plate', bodyRadius * 0.6, bodyHeight * 0.75, 0.06, accentMat, bodyGroup, bodyHeight * 0.5);
        plate.position.set(Math.cos(a) * (bodyRadius * 1.05), 0, Math.sin(a) * (bodyRadius * 1.05));
        plate.rotation.y = -a + Math.PI / 2;
      }
      break;
    }
    case 'slim': {
      createCylinder('slim', bodyRadius * 0.85, bodyRadius, bodyHeight, 16, bodyMat, bodyGroup, bodyHeight / 2);
      const pipeMat = makePBR(scene, '#d47a55', 0.1, 0.9);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const pipe = MeshBuilder.CreateCylinder('pipe', { diameter: 0.03, height: bodyHeight * 0.8, tessellation: 8 }, scene);
        pipe.material = pipeMat;
        addMesh(pipe, bodyGroup, bodyHeight * 0.5, false);
        pipe.position.set(Math.cos(a) * (bodyRadius * 0.95), 0, Math.sin(a) * (bodyRadius * 0.95));
      }
      break;
    }
    case 'sphere': {
      const sr = bodyRadius * 0.95;
      const sphere = MeshBuilder.CreateSphere('sphereBody', { diameter: sr * 2, segments: 32 }, scene);
      sphere.material = bodyMat;
      addMesh(sphere, bodyGroup, bodyHeight / 2);
      createTorus('equator', sr * 1.85, 0.025, 32, accentMat, bodyGroup, bodyHeight / 2).rotation.x = Math.PI / 2;
      const meri = createTorus('meridian', sr * 1.85, 0.02, 32, accentMat, bodyGroup, bodyHeight / 2);
      meri.rotation.z = Math.PI / 2;
      createBox('frontPad', sr * 0.6, sr * 0.25, 0.04, panelMat, bodyGroup, bodyHeight / 2).position.z = sr * 0.92;
      for (let i = -1; i <= 1; i += 2) {
        createSphere('sideLight', 0.05, 8, frontGlowMat, bodyGroup, bodyHeight / 2, false).position.set(i * sr * 0.6, 0, sr * 0.3);
      }
      break;
    }
    case 'insect': {
      const segH = bodyHeight * 0.18;
      for (let s = 0; s < 3; s++) {
        const segR = bodyRadius * (0.8 - s * 0.1);
        createCylinder('seg', segR, segR, segH, 16, bodyMat, bodyGroup, segH * (s + 0.5));
        if (s < 2) createCylinder('joint', segR * 0.25, segR * 0.25, 0.04, 8, darkMat, bodyGroup, segH * (s + 1.0));
        const ridge = MeshBuilder.CreateCylinder('ridge', { diameterTop: 0, diameterBottom: segR * 0.3, height: segR * 0.2, tessellation: 4 }, scene);
        ridge.material = accentMat;
        addMesh(ridge, bodyGroup, segH * (s + 0.5) + segH * 0.35);
        ridge.rotation.z = Math.PI;
      }
      for (let i = -1; i <= 1; i += 2) {
        for (let s = 0; s < 3; s++) {
          const spine = MeshBuilder.CreateCylinder('spine', { diameterTop: 0.01, diameterBottom: bodyRadius * 0.05, height: bodyRadius * 0.25, tessellation: 6 }, scene);
          spine.material = accentMat;
          addMesh(spine, bodyGroup, segH * (s + 0.5));
          spine.position.set(i * (bodyRadius + 0.12), -bodyRadius * 0.1, 0);
          spine.rotation.z = i * Math.PI / 5;
        }
      }
      break;
    }
    default: { // standard
      const capH = bodyHeight * 0.15;
      createCylinder('topCap', bodyRadius, bodyRadius, capH, 20, bodyMat, bodyGroup, bodyHeight - capH / 2);
      createCylinder('botCap', bodyRadius, bodyRadius, capH, 20, bodyMat, bodyGroup, capH / 2);
      const coreMat = makeStandard(scene, '#33aaff', { emissive: '#1166dd', emissiveIntensity: 2.0 });
      const core = createCylinder('core', bodyRadius * 0.45, bodyRadius * 0.45, bodyHeight - capH * 2, 12, coreMat, bodyGroup, bodyHeight / 2, false);
      root.metadata = root.metadata || {};
      root.metadata.thrusterCore = core;
      const strutMat = accentMat;
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const strut = MeshBuilder.CreateCylinder('strut', { diameter: 0.05, height: bodyHeight - capH, tessellation: 8 }, scene);
        strut.material = strutMat;
        addMesh(strut, bodyGroup, bodyHeight / 2);
        strut.position.set(Math.cos(a) * (bodyRadius - 0.02), 0, Math.sin(a) * (bodyRadius - 0.02));
      }
      break;
    }
  }

  // Side panels
  for (let i = -1; i <= 1; i += 2) {
    const p = createBox('sidePanel', bodyRadius * 0.35, bodyHeight * 0.12, 0.04, panelMat, bodyGroup, bodyHeight * 0.5);
    p.position.x = i * bodyRadius * 0.65;
  }
  createBox('frontPanel', bodyRadius * 0.6, bodyHeight * 0.08, 0.03, frontGlowMat, bodyGroup, bodyHeight * 0.35).position.z = bodyRadius * 0.98;
  createBox('rearPanel', bodyRadius * 0.4, bodyHeight * 0.06, 0.03, makeStandard(scene, '#cc2233', { emissive: '#881122', emissiveIntensity: 0.5 }), bodyGroup, bodyHeight * 0.4).position.z = -bodyRadius * 0.98;

  // Headlights
  for (let i = -1; i <= 1; i += 2) {
    const hl = createBox('headlight', 0.04, 0.04, 0.02, frontGlowMat, bodyGroup, bodyHeight * 0.55, false);
    hl.position.set(i * bodyRadius * 0.35, 0, bodyRadius * 0.99);
  }

  // Accent rings
  const ringDiam = bodyRadius * 0.95 * 2;
  const ring = createTorus('ring1', ringDiam, 0.015, 24, accentMat, bodyGroup, bodyHeight * 0.25);
  ring.rotation.x = Math.PI / 2;
  const ring2 = createTorus('ring2', ringDiam, 0.015, 24, accentMat, bodyGroup, bodyHeight * 0.75);
  ring2.rotation.x = Math.PI / 2;

  // === HEAD ===
  const headGroup = new TransformNode('head', scene);
  headGroup.parent = root;
  const headY = bodyHeight + 0.05;

  switch (cfg.head) {
    case 'dome': {
      const dome = MeshBuilder.CreateSphere('dome', { diameter: bodyRadius * 0.85 * 2, segments: 24, slice: 0.5 }, scene);
      dome.material = headMat;
      addMesh(dome, headGroup, headY);
      const eye = MeshBuilder.CreateCylinder('eye', { diameterTop: 0.1, diameterBottom: 0.14, height: 0.06, tessellation: 12 }, scene);
      eye.material = frontGlowMat;
      addMesh(eye, headGroup, headY + 0.02, false);
      eye.position.z = bodyRadius * 0.78;
      eye.rotation.x = Math.PI / 3;
      createTorus('eyeRing', 0.12, 0.01, 12, chromeMat, headGroup, headY + 0.02).position.z = bodyRadius * 0.78;
      headGroup.getChildren()[headGroup.getChildren().length - 1].rotation.x = Math.PI / 3;
      createBox('visor', bodyRadius * 0.5, 0.03, 0.08, makeStandard(scene, '#111122', { roughness: 0.1 }), headGroup, headY + 0.08).position.z = bodyRadius * 0.6;
      createSphere('rearDot', 0.05, 8, makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.6 }), headGroup, headY + 0.1, false).position.z = -bodyRadius * 0.6;
      break;
    }
    case 'sensor': {
      const sw = bodyRadius * 0.7, sh = 0.22, sd = bodyRadius * 0.5;
      createBox('sensor', sw, sh, sd, headMat, headGroup, headY + 0.11);
      for (let i = -1; i <= 1; i += 2) {
        const lens = MeshBuilder.CreateCylinder('lens', { diameter: 0.11, height: 0.05, tessellation: 12 }, scene);
        lens.material = frontGlowMat;
        addMesh(lens, headGroup, headY + 0.11, false);
        lens.position.set(i * 0.18, 0, sd / 2 + 0.025);
        lens.rotation.x = Math.PI / 2;
        createTorus('rim', 0.11, 0.008, 12, chromeMat, headGroup, headY + 0.11).position.set(i * 0.18, 0, sd / 2 + 0.045);
      }
      createCylinder('top', sw * 0.3, sw * 0.35, 0.04, 8, darkMat, headGroup, headY + sh / 2 + 0.03, false);
      const rearLens = MeshBuilder.CreateCylinder('rearLens', { diameter: 0.07, height: 0.03, tessellation: 8 }, scene);
      rearLens.material = makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.5 });
      addMesh(rearLens, headGroup, headY + 0.11, false);
      rearLens.position.z = -sd / 2 - 0.02;
      rearLens.rotation.x = Math.PI / 2;
      break;
    }
    case 'antenna': {
      createSphere('antHead', bodyRadius * 0.45 * 2, 20, headMat, headGroup, headY + 0.05);
      createTorus('antBand', bodyRadius * 0.42 * 2, 0.015, 20, accentMat, headGroup, headY + 0.05).rotation.x = Math.PI / 2;
      createCylinder('rod', 0.025, 0.03, 0.35, 8, darkMat, headGroup, headY + 0.28, false);
      createSphere('tip', 0.11, 10, frontGlowMat, headGroup, headY + 0.45, false);
      const dish = MeshBuilder.CreateSphere('dish', { diameter: bodyRadius * 0.25 * 2, segments: 12, slice: 0.45 }, scene);
      dish.material = chromeMat;
      addMesh(dish, headGroup, headY + 0.15, false);
      dish.position.x = bodyRadius * 0.4;
      dish.rotation.z = -Math.PI / 6;
      createSphere('frontDot', 0.04, 6, frontGlowMat, headGroup, headY + 0.1, false).position.z = bodyRadius * 0.42;
      break;
    }
    case 'visor': {
      createBox('visorBase', bodyRadius * 1.4, 0.18, bodyRadius * 0.6, headMat, headGroup, headY + 0.09);
      createBox('visorSlit', bodyRadius * 1.2, 0.06, 0.05, makeStandard(scene, '#111122', { roughness: 0.1 }), headGroup, headY + 0.09).position.z = bodyRadius * 0.31;
      createBox('visorGlow', bodyRadius * 1.1, 0.04, 0.03, frontGlowMat, headGroup, headY + 0.09).position.z = bodyRadius * 0.33;
      for (let i = -1; i <= 1; i += 2) {
        createSphere('lug', 0.06, 8, chromeMat, headGroup, headY + 0.09, false).position.x = i * bodyRadius * 0.65;
      }
      createBox('topRidge', bodyRadius * 0.3, 0.04, bodyRadius * 0.5, accentMat, headGroup, headY + 0.2);
      createSphere('rearDot', 0.04, 6, makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.5 }), headGroup, headY + 0.09, false).position.z = -bodyRadius * 0.31;
      break;
    }
    case 'box': {
      createBox('boxHead', bodyRadius * 1.1, 0.3, bodyRadius * 0.8, headMat, headGroup, headY + 0.15);
      createBox('facePlate', bodyRadius * 0.9, 0.2, 0.04, panelMat, headGroup, headY + 0.15).position.z = bodyRadius * 0.41;
      for (let i = -1; i <= 1; i += 2) {
        createSphere('eye', 0.08, 8, frontGlowMat, headGroup, headY + 0.18, false).position.set(i * 0.12, 0, bodyRadius * 0.42);
        createTorus('eyeRim', 0.09, 0.008, 10, chromeMat, headGroup, headY + 0.18).position.set(i * 0.12, 0, bodyRadius * 0.43);
      }
      createBox('mouth', bodyRadius * 0.4, 0.025, 0.03, makeStandard(scene, '#222222', { emissive: '#331111', emissiveIntensity: 0.3 }), headGroup, headY + 0.08).position.z = bodyRadius * 0.42;
      for (let i = -1; i <= 1; i += 2) {
        createCylinder('ant', 0.012, 0.015, 0.2, 6, darkMat, headGroup, headY + 0.4, false).position.x = i * 0.2;
        createSphere('antTip', 0.04, 6, glowMat, headGroup, headY + 0.5, false).position.x = i * 0.2;
      }
      createSphere('rearLight', 0.04, 6, makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.5 }), headGroup, headY + 0.15, false).position.z = -bodyRadius * 0.41;
      break;
    }
    case 'turret': {
      createCylinder('turretBase', bodyRadius * 0.5, bodyRadius * 0.55, 0.12, 16, darkMat, headGroup, headY + 0.06);
      const turretDome = MeshBuilder.CreateSphere('turretDome', { diameter: bodyRadius * 0.4 * 2, segments: 16, slice: 0.55 }, scene);
      turretDome.material = headMat;
      addMesh(turretDome, headGroup, headY + 0.12);
      createCylinder('barrel', 0.035, 0.04, 0.4, 10, chromeMat, headGroup, headY + 0.2).position.z = bodyRadius * 0.55;
      headGroup.getChildren()[headGroup.getChildren().length - 1].rotation.x = Math.PI / 2;
      createCylinder('muzzle', 0.045, 0.035, 0.06, 10, darkMat, headGroup, headY + 0.2).position.z = bodyRadius * 0.55 + 0.2;
      headGroup.getChildren()[headGroup.getChildren().length - 1].rotation.x = Math.PI / 2;
      createTorus('muzzleGlow', 0.08, 0.006, 10, frontGlowMat, headGroup, headY + 0.2).position.z = bodyRadius * 0.55 + 0.23;
      createSphere('sight', 0.05, 8, frontGlowMat, headGroup, headY + 0.35, false).position.z = bodyRadius * 0.25;
      createTorus('turretRing', bodyRadius * 0.42 * 2, 0.01, 16, accentMat, headGroup, headY + 0.12).rotation.x = Math.PI / 2;
      root.metadata = root.metadata || {};
      root.metadata.turretBarrel = headGroup.getChildren().find(c => c.name === 'barrel');
      break;
    }
    case 'cyclops': {
      const dome = MeshBuilder.CreateSphere('cyclopsDome', { diameter: bodyRadius * 0.9 * 2, segments: 24, slice: 0.55 }, scene);
      dome.material = headMat;
      addMesh(dome, headGroup, headY + 0.08);
      const eyeMat = makeStandard(scene, '#ff2200', { emissive: '#ff4400', emissiveIntensity: 2.2 });
      const eye = MeshBuilder.CreateSphere('cyclopsEye', { diameter: bodyRadius * 0.45 * 2, segments: 20 }, scene);
      eye.material = eyeMat;
      addMesh(eye, headGroup, headY + 0.1, false);
      eye.position.z = bodyRadius * 0.18;
      createTorus('eyeRing', bodyRadius * 0.48 * 2, 0.02, 20, chromeMat, headGroup, headY + 0.1).position.z = bodyRadius * 0.18;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI * 2) / 4 + Math.PI / 4;
        const plate = createBox('eyePlate', bodyRadius * 0.12, bodyRadius * 0.08, 0.03, accentMat, headGroup, headY + 0.1);
        plate.position.set(Math.cos(a) * bodyRadius * 0.48, Math.sin(a) * 0.02, bodyRadius * 0.12);
      }
      for (let i = -1; i <= 1; i += 2) {
        createSphere('sideEye', 0.06, 8, frontGlowMat, headGroup, headY + 0.1, false).position.set(i * bodyRadius * 0.4, 0, bodyRadius * 0.0);
      }
      break;
    }
    case 'crown': {
      createTorus('crownBase', bodyRadius * 0.8 * 2, 0.03, 20, accentMat, headGroup, headY + 0.05).rotation.x = Math.PI / 2;
      createCylinder('crownDome', bodyRadius * 0.35, bodyRadius * 0.3, 0.14, 16, headMat, headGroup, headY + 0.12);
      const spikeMat = makePBR(scene, headColor, 0.25, 0.8);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const spike = MeshBuilder.CreateCylinder('spike', { diameterTop: 0, diameterBottom: bodyRadius * 0.1, height: bodyRadius * 0.4, tessellation: 8 }, scene);
        spike.material = spikeMat;
        addMesh(spike, headGroup, headY + 0.28, false);
        spike.position.set(Math.cos(a) * bodyRadius * 0.42, 0, Math.sin(a) * bodyRadius * 0.42);
        createSphere('spikeTip', 0.03, 6, glowMat, headGroup, headY + 0.48, false).position.set(Math.cos(a) * bodyRadius * 0.42, 0, Math.sin(a) * bodyRadius * 0.42);
      }
      createSphere('crownJewel', bodyRadius * 0.1 * 2, 12, frontGlowMat, headGroup, headY + 0.12, false).position.z = bodyRadius * 0.35;
      break;
    }
    case 'tri_eye': {
      const tri = MeshBuilder.CreateCylinder('triBase', { diameterTop: bodyRadius * 0.65 * 2, diameterBottom: bodyRadius * 0.75 * 2, height: 0.07, tessellation: 3 }, scene);
      tri.material = headMat;
      addMesh(tri, headGroup, headY + 0.03);
      tri.rotation.y = Math.PI / 6;
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const eyeG = new TransformNode('eyeGrp', scene);
        eyeG.parent = headGroup;
        eyeG.position.set(Math.cos(a) * bodyRadius * 0.28, headY + 0.09, Math.sin(a) * bodyRadius * 0.28);
        const eyeColor = ['#00ff44', '#ff4400', '#4488ff'][i];
        const eyeMat = makeStandard(scene, eyeColor, { emissive: eyeColor, emissiveIntensity: 1.5 });
        const eyeMesh = MeshBuilder.CreateCylinder('eye', { diameter: 0.1, height: 0.025, tessellation: 10 }, scene);
        eyeMesh.material = eyeMat;
        addMesh(eyeMesh, eyeG, 0, false);
        eyeMesh.rotation.x = Math.PI / 2;
        createTorus('eyeRim', 0.11, 0.01, 10, chromeMat, eyeG, 0).position.z = 0.015;
      }
      createCylinder('rearHub', bodyRadius * 0.12, bodyRadius * 0.15, 0.07, 8, darkMat, headGroup, headY + 0.07, false);
      break;
    }
  }

  // === BASE ===
  const baseGroup = new TransformNode('base', scene);
  baseGroup.parent = root;

  switch (cfg.base) {
    case 'wheels': {
      const wheelMat = makePBR(scene, '#1a1a1a', 0.95, 0.1);
      const positions = [
        [0, 0.06, bodyRadius * 1.1],
        [-bodyRadius * 0.7, 0.06, -bodyRadius * 0.9],
        [bodyRadius * 0.7, 0.06, -bodyRadius * 0.9],
      ];
      const wheelsList = [];
      for (const p of positions) {
        const w = MeshBuilder.CreateCylinder('wheel', { diameter: 0.16, height: 0.12, tessellation: 12 }, scene);
        w.material = wheelMat;
        addMesh(w, baseGroup, 0.06);
        w.position.set(p[0], 0, p[2]);
        w.rotation.z = Math.PI / 2;
        wheelsList.push(w);
        createCylinder('hub', 0.03, 0.03, 0.13, 6, chromeMat, baseGroup, 0.06, false).position.set(p[0], 0, p[2]);
        baseGroup.getChildren()[baseGroup.getChildren().length - 1].rotation.z = Math.PI / 2;
      }
      root.metadata = root.metadata || {};
      root.metadata.wheels = wheelsList;
      const legMat = makePBR(scene, baseColor, 0.6, 0.5);
      for (const p of positions) {
        createCylinder('leg', 0.035, 0.055, 0.22, 8, legMat, baseGroup, 0.17, false).position.set(p[0], 0, p[2]);
      }
      break;
    }
    case 'tracks': {
      const trackW = 0.13, trackH = 0.16, trackD = bodyRadius * 1.7;
      const trackMat = makePBR(scene, baseColor, 0.7, 0.5);
      const rollersList = [];
      for (let side = -1; side <= 1; side += 2) {
        const t = createBox('track', trackW, trackH, trackD, trackMat, baseGroup, trackH / 2);
        t.position.x = side * (bodyRadius + 0.07);
        const rollerMat = makeStandard(scene, '#111111', { roughness: 0.9 });
        for (let i = -2; i <= 2; i++) {
          const roller = MeshBuilder.CreateCylinder('roller', { diameter: 0.08, height: trackW + 0.01, tessellation: 10 }, scene);
          roller.material = rollerMat;
          addMesh(roller, baseGroup, 0.04, false);
          roller.position.set(side * (bodyRadius + 0.07), 0, i * trackD / 5);
          roller.rotation.x = Math.PI / 2;
          rollersList.push(roller);
        }
        const beltMat = makeStandard(scene, '#1a1a1a', { roughness: 0.95 });
        for (let i = -2; i <= 2; i++) {
          createBox('belt', trackW + 0.02, 0.025, 0.04, beltMat, baseGroup, trackH - 0.01, false).position.set(side * (bodyRadius + 0.07), 0, i * trackD / 5);
        }
      }
      root.metadata = root.metadata || {};
      root.metadata.rollers = rollersList;
      break;
    }
    case 'hovers': {
      const hoverMat = makePBR(scene, baseColor, 0.4, 0.7);
      const glowMatH = makeStandard(scene, '#44aaff', { emissive: '#2266cc', emissiveIntensity: 0.6, transparent: true, opacity: 0.8 });
      const positions = [
        [0, 0, bodyRadius * 1.0],
        [-bodyRadius * 0.6, 0, -bodyRadius * 0.8],
        [bodyRadius * 0.6, 0, -bodyRadius * 0.8],
      ];
      const hoverGlows = [];
      for (const p of positions) {
        createCylinder('pad', 0.13, 0.16, 0.06, 12, hoverMat, baseGroup, 0.04, false).position.set(p[0], 0, p[2]);
        const glow = createCylinder('glow', 0.11, 0.14, 0.03, 12, glowMatH, baseGroup, 0.005, false);
        glow.position.set(p[0], 0, p[2]);
        hoverGlows.push(glow);
        createTorus('padRing', 0.28, 0.008, 12, chromeMat, baseGroup, 0.05, false).position.set(p[0], 0, p[2]);
      }
      root.metadata = root.metadata || {};
      root.metadata.hoverGlows = hoverGlows;
      break;
    }
    case 'spider': {
      createCylinder('spiderMount', bodyRadius * 0.35, bodyRadius * 0.5, 0.08, 12, baseMat, baseGroup, 0.04);
      const legMat = makePBR(scene, baseColor, 0.6, 0.5);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const legG = new TransformNode('leg_' + i, scene);
        legG.parent = baseGroup;
        legG.position.set(Math.cos(a) * bodyRadius * 0.3, -0.04, Math.sin(a) * bodyRadius * 0.3);
        legG.rotation.y = a;
        createCylinder('upJoint', 0.04, 0.05, 0.05, 8, darkMat, legG, 0.02);
        const upLeg = MeshBuilder.CreateCylinder('upLeg', { diameterTop: 0.04, diameterBottom: 0.06, height: 0.22, tessellation: 8 }, scene);
        upLeg.material = legMat;
        addMesh(upLeg, legG, 0.04);
        upLeg.position.z = 0.1;
        upLeg.rotation.x = Math.PI / 4;
        const loLeg = MeshBuilder.CreateCylinder('loLeg', { diameterTop: 0.03, diameterBottom: 0.05, height: 0.28, tessellation: 8 }, scene);
        loLeg.material = legMat;
        addMesh(loLeg, legG, 0.05);
        loLeg.position.z = 0.32;
        loLeg.rotation.x = -Math.PI / 7;
        const foot = MeshBuilder.CreateCylinder('foot', { diameterTop: 0.06, diameterBottom: 0.08, height: 0.02, tessellation: 8 }, scene);
        foot.material = darkMat;
        addMesh(foot, legG, 0.04);
        foot.position.z = 0.48;
      }
      break;
    }
    case 'ball': {
      const ballR = bodyRadius * 1.1;
      const ball = MeshBuilder.CreateSphere('ballBase', { diameter: ballR * 2 * 2, segments: 32 }, scene);
      ball.material = baseMat;
      addMesh(ball, baseGroup, ballR);
      createTorus('ballEquator', ballR * 3.8, 0.02, 32, accentMat, baseGroup, ballR).rotation.x = Math.PI / 2;
      const treadMat = makePBR(scene, '#111111', 0.95, 0.05);
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        createTorus('tread', ballR * 3.9, 0.01, 24, treadMat, baseGroup, ballR + i * ballR * 0.55);
      }
      createCylinder('ballConn', bodyRadius * 0.3, bodyRadius * 0.35, 0.08, 12, accentMat, baseGroup, ballR * 2 + 0.04);
      break;
    }
  }

  // === ACCESSORY ===
  const accMat = makePBR(scene, accentColor, 0.4, 0.6);

  switch (cfg.accessory) {
    case 'arm': {
      createSphere('shoulder', 0.12, 10, chromeMat, null, 0, false).position.set(bodyRadius * 0.85, bodyHeight * 0.55, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      createCylinder('arm', 0.025, 0.03, 0.3, 8, accMat, null, 0, false).position.set(bodyRadius * 0.85 + 0.15, bodyHeight * 0.45, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      root.getChildren()[root.getChildren().length - 1].rotation.z = Math.PI / 4;
      createSphere('elbow', 0.07, 8, chromeMat, null, 0, false).position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.35, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      createCylinder('forearm', 0.02, 0.025, 0.2, 8, accMat, null, 0, false).position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.25, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      createBox('claw', 0.06, 0.015, 0.04, chromeMat, null, 0, false).position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.15, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      break;
    }
    case 'shield': {
      const orb = MeshBuilder.CreateIcoSphere('shieldOrb', { radius: 0.12, subdivisions: 1 }, scene);
      orb.material = makeStandard(scene, '#44aaff', { emissive: '#2266cc', emissiveIntensity: 0.6, transparent: true, opacity: 0.8 });
      addMesh(orb, null, 0, false);
      orb.parent = root;
      orb.position.set(0, bodyHeight * 0.5, -bodyRadius * 0.85);
      createCylinder('mount', 0.03, 0.04, 0.15, 8, darkMat, null, 0, false).position.set(0, bodyHeight * 0.5, -bodyRadius * 0.7);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      root.getChildren()[root.getChildren().length - 1].rotation.x = Math.PI / 2;
      createTorus('shieldRing', 0.36, 0.012, 20, makeStandard(scene, '#88ccff', { emissive: '#4488cc', emissiveIntensity: 0.4, transparent: true, opacity: 0.5 }), null, 0, false).position.set(0, bodyHeight * 0.5, -bodyRadius * 0.85);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      break;
    }
    case 'jetpack': {
      const jetpackFlames = [];
      for (let side = -1; side <= 1; side += 2) {
        createCylinder('pod', 0.06, 0.08, 0.3, 10, accMat, null, 0).position.set(side * (bodyRadius * 0.7), bodyHeight * 0.5, -bodyRadius * 0.3);
        root.getChildren()[root.getChildren().length - 1].parent = root;
        createCylinder('nozzle', 0.04, 0.06, 0.08, 10, chromeMat, null, 0, false).position.set(side * (bodyRadius * 0.7), bodyHeight * 0.32, -bodyRadius * 0.3);
        root.getChildren()[root.getChildren().length - 1].parent = root;
        const flameMat = makeStandard(scene, '#44aaff', { emissive: '#2266ff', emissiveIntensity: 1.0, transparent: true, opacity: 0.8 });
        const flame = MeshBuilder.CreateCylinder('jpFlame', { diameterTop: 0, diameterBottom: 0.1, height: 0.15, tessellation: 8 }, scene);
        flame.material = flameMat;
        addMesh(flame, null, 0, false);
        flame.parent = root;
        flame.position.set(side * (bodyRadius * 0.7), bodyHeight * 0.22, -bodyRadius * 0.3);
        flame.rotation.x = Math.PI;
        jetpackFlames.push(flame);
      }
      createBox('strap', bodyRadius * 1.4, 0.03, 0.03, darkMat, null, 0, false).position.set(0, bodyHeight * 0.5, -bodyRadius * 0.3);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      root.metadata = root.metadata || {};
      root.metadata.jetpackFlames = jetpackFlames;
      break;
    }
    case 'radar': {
      createCylinder('radarArm', 0.02, 0.025, 0.22, 6, darkMat, null, 0, false).position.set(bodyRadius * 0.5, bodyHeight + 0.11, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      const radarHead = new TransformNode('radarHead', scene);
      radarHead.parent = root;
      radarHead.position.set(bodyRadius * 0.5, bodyHeight + 0.22, 0);
      const dish = MeshBuilder.CreateSphere('radarDish', { diameter: 0.28, segments: 14, slice: 0.45 }, scene);
      dish.material = accMat;
      addMesh(dish, radarHead, 0, false);
      dish.rotation.x = -Math.PI / 4;
      createCylinder('feed', 0.008, 0.008, 0.1, 4, glowMat, radarHead, -0.06, false).position.z = 0.08;
      radarHead.getChildren()[radarHead.getChildren().length - 1].rotation.x = -Math.PI / 4;
      createSphere('radarTip', 0.04, 6, glowMat, radarHead, 0, false).position.z = 0.12;
      root.metadata = root.metadata || {};
      root.metadata.radarHead = radarHead;
      break;
    }
    case 'cannon': {
      const cannonG = new TransformNode('cannon', scene);
      cannonG.parent = root;
      cannonG.position.set(bodyRadius * 0.7, bodyHeight * 0.65, 0);
      createCylinder('cannonMount', 0.06, 0.08, 0.14, 8, darkMat, cannonG, 0.07);
      const barrel = MeshBuilder.CreateCylinder('cannonBarrel', { diameterTop: 0.08, diameterBottom: 0.12, height: 0.45, tessellation: 10 }, scene);
      barrel.material = chromeMat;
      addMesh(barrel, cannonG, 0.08);
      barrel.rotation.x = Math.PI / 3;
      barrel.position.z = 0.18;
      createTorus('barrelRing', 0.14, 0.01, 10, accentMat, cannonG, 0.08).position.z = 0.22;
      createCylinder('muzzle', 0.1, 0.08, 0.06, 8, darkMat, cannonG, 0.08).position.z = 0.35;
      for (let i = 0; i < 3; i++) {
        createTorus('coil', 0.16, 0.006, 12, frontGlowMat, cannonG, 0.04 + i * 0.02).position.z = 0.04;
      }
      break;
    }
    case 'drone': {
      const droneN = new TransformNode('drone', scene);
      droneN.parent = root;
      droneN.position.set(bodyRadius * 1.0, bodyHeight + 0.25, 0);
      const droneBody = MeshBuilder.CreateIcoSphere('droneBody', { radius: 0.07, subdivisions: 1 }, scene);
      droneBody.material = accentMat;
      addMesh(droneBody, droneN, 0, false);
      createTorus('droneRing', 0.16, 0.007, 16, chromeMat, droneN, 0);
      createSphere('droneLight', 0.035, 6, glowMat, droneN, 0, false);
      root.metadata = root.metadata || {};
      root.metadata.droneNode = droneN;
      break;
    }
  }

  // Forward indicator
  const fwdMat = makeStandard(scene, '#33ffaa', { emissive: '#00ff88', emissiveIntensity: 2.2, transparent: true, opacity: 0.85 });
  const fwdTriangle = MeshBuilder.CreateCylinder('fwdTri', { diameterTop: 0, diameterBottom: 0.28, height: 0.4, tessellation: 4 }, scene);
  fwdTriangle.material = fwdMat;
  addMesh(fwdTriangle, root, 0.12, false);
  fwdTriangle.position.z = bodyRadius + 0.32;
  fwdTriangle.rotation.x = Math.PI / 2;
  createBox('fwdLine', 0.05, 0.03, 0.2, fwdMat, root, 0.12, false).position.z = bodyRadius + 0.08;

  // Stats
  let speed = cfg.base === 'tracks' ? 4.8 : cfg.base === 'wheels' ? 6.5 : cfg.base === 'spider' ? 5.2 : cfg.base === 'ball' ? 5.0 : 5.6;
  let turnSpeed = cfg.head === 'sensor' ? 0.075 : cfg.head === 'antenna' ? 0.065 : cfg.head === 'turret' ? 0.055 : cfg.head === 'cyclops' ? 0.058 : cfg.head === 'crown' ? 0.072 : cfg.head === 'tri_eye' ? 0.082 : 0.068;
  let armor = cfg.body === 'heavy' ? 4 : cfg.body === 'mech' ? 5 : cfg.body === 'standard' ? 3 : cfg.body === 'hover_body' ? 2 : cfg.body === 'insect' ? 4 : cfg.body === 'sphere' ? 3 : 2;

  switch (cfg.head) {
    case 'visor': turnSpeed += 0.01; break;
    case 'box': armor += 1; break;
    case 'turret': turnSpeed -= 0.008; armor += 1; break;
    case 'crown': speed += 0.5; break;
    case 'tri_eye': turnSpeed += 0.005; break;
    case 'cyclops': armor += 1; break;
  }
  switch (cfg.accessory) {
    case 'arm': armor += 1; break;
    case 'shield': armor += 2; speed -= 0.6; break;
    case 'jetpack': speed += 0.8; armor -= 1; break;
    case 'radar': turnSpeed += 0.012; break;
    case 'cannon': armor += 1; speed -= 0.4; break;
    case 'drone': turnSpeed += 0.008; speed += 0.3; break;
  }
  speed = Math.max(1, speed);
  armor = Math.max(1, armor);

  root.metadata = root.metadata || {};
  root.metadata.speed = speed;
  root.metadata.turnSpeed = Math.min(turnSpeed, 0.14);
  root.metadata.armor = armor;
  root.metadata.hitboxRadius = bodyRadius * 0.9;
  root.metadata.accessory = cfg.accessory || 'none';
  root.metadata.baseType = cfg.base;

  return root;
}
