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

function makePBR(scene, color, roughness = 0.45, metallic = 0.5, opts = {}) {
  const mat = new PBRMetallicRoughnessMaterial('mat_' + Math.random(), scene);
  mat.baseColor = hexToColor3(color);
  mat.roughness = roughness;
  mat.metallic = metallic;
  if (opts.clearCoat) mat.clearCoat = { isEnabled: true, intensity: opts.clearCoat };
  if (opts.clearCoatRoughness !== undefined) {
    if (!mat.clearCoat) mat.clearCoat = { isEnabled: true };
    mat.clearCoat.roughness = opts.clearCoatRoughness;
  }
  if (opts.anisotropy) mat.anisotropy = { isEnabled: true, intensity: opts.anisotropy.axis, axis: opts.anisotropy.axis || new Vector3(1, 0, 0) };
  if (opts.subSurface) mat.subSurface = { isEnabled: true, refractionIntensity: opts.subSurface };
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

function createProceduralPanelTexture(scene, color, opts = {}) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const baseColor = typeof color === 'string' ? color : '#888';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const lineColor = opts.lineColor || 'rgba(0,0,0,0.08)';
  const gridSize = opts.gridSize || 32;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  for (let x = 0; x <= size; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  if (opts.rivets) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = gridSize / 2; x <= size; x += gridSize) {
      for (let y = gridSize / 2; y <= size; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (opts.panelLines) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    const inset = size * 0.05;
    ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
  }

  const tex = new Texture('data:' + canvas.toDataURL('image/png'), scene);
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.uScale = opts.repeatX || 1;
  tex.vScale = opts.repeatY || 1;
  return tex;
}

function makePanelPBR(scene, baseColor, roughness = 0.5, metallic = 0.6, panelOpts = {}) {
  const mat = makePBR(scene, baseColor, roughness, metallic, panelOpts);
  try {
    const tex = createProceduralPanelTexture(scene, null, { gridSize: 24, rivets: true, panelLines: true, repeatX: 2, repeatY: 1 });
    mat.baseTexture = tex;
  } catch (e) { }
  return mat;
}

export function buildDroid(cfg, scene) {
  const root = new TransformNode('droid', scene);

  const bodyColor = cfg.colors.body;
  const headColor = cfg.colors.head;
  const baseColor = cfg.colors.base;
  const accentColor = cfg.colors.accent || '#2255aa';

  const bodyMat = makePBR(scene, bodyColor, 0.45, 0.5, { clearCoat: 0.15, anisotropy: 0.3 });
  try {
    const texColor = loadTex(scene, 'assets/textures/brushed_metal/MetalPlates007_2K-JPG_Color.jpg', 2, 1);
    const texNormal = loadTex(scene, 'assets/textures/brushed_metal/MetalPlates007_2K-JPG_NormalGL.jpg', 2, 1);
    const texRough = loadTex(scene, 'assets/textures/brushed_metal/MetalPlates007_2K-JPG_Roughness.jpg', 2, 1);
    const texMetal = loadTex(scene, 'assets/textures/brushed_metal/MetalPlates007_2K-JPG_Metalness.jpg', 2, 1);
    bodyMat.baseTexture = texColor;
    bodyMat.normalTexture = texNormal;
    bodyMat.roughnessTexture = texRough;
    bodyMat.metallicTexture = texMetal;
  } catch (e) { }

  const headMat = makePBR(scene, headColor, 0.4, 0.4, { clearCoat: 0.2 });
  const baseMat = makePBR(scene, baseColor, 0.7, 0.6);
  const accentMat = makePBR(scene, accentColor, 0.35, 0.6, { clearCoat: 0.3, clearCoatRoughness: 0.2 });
  const glowMat = makeStandard(scene, '#44ddff', { emissive: '#44ddff', emissiveIntensity: 0.6 });
  const frontGlowMat = makeStandard(scene, '#44ffaa', { emissive: '#22cc88', emissiveIntensity: 0.9 });
  const darkMat = makeStandard(scene, '#222222', { roughness: 0.8, metallic: 0.2 });
  const chromeMat = makePBR(scene, '#cccccc', 0.15, 0.85, { clearCoat: 0.5 });
  const panelMat = makePanelPBR(scene, '#334488', 0.4, 0.55);
  const carbonMat = makePBR(scene, '#1a1a1a', 0.85, 0.05);

  let bodyRadius, bodyHeight;
  switch (cfg.body) {
    case 'heavy': bodyRadius = 0.65; bodyHeight = 0.9; break;
    case 'slim': bodyRadius = 0.40; bodyHeight = 1.3; break;
    case 'sleek': bodyRadius = 0.50; bodyHeight = 1.1; break;
    case 'hover_body': bodyRadius = 0.60; bodyHeight = 0.5; break;
    case 'mech': bodyRadius = 0.55; bodyHeight = 1.0; break;
    case 'sphere': bodyRadius = 0.55; bodyHeight = 1.1; break;
    case 'insect': bodyRadius = 0.50; bodyHeight = 1.05; break;
    case 'tank': bodyRadius = 0.70; bodyHeight = 0.75; break;
    case 'quad': bodyRadius = 0.60; bodyHeight = 0.85; break;
    case 'astromech_body': bodyRadius = 0.45; bodyHeight = 0.8; break;
    case 'protocol_body': bodyRadius = 0.42; bodyHeight = 1.0; break;
    case 'assassin': bodyRadius = 0.32; bodyHeight = 1.5; break;
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

  function createPolyhedron(name, type, size, mat, parent, y, castShadow = true) {
    const m = MeshBuilder.CreatePolyhedron(name, { type, size }, scene);
    m.material = mat;
    return addMesh(m, parent, y, castShadow);
  }

  function createLathe(name, shape, mat, parent, y, castShadow = true) {
    const m = MeshBuilder.CreateLathe(name, { shape, radius: 1, tessellation: 24 }, scene);
    m.material = mat;
    return addMesh(m, parent, y, castShadow);
  }

  function createTube(name, path, radius, tess, mat, parent, y, castShadow = false) {
    const m = MeshBuilder.CreateTube(name, { path, radius, tessellation: tess }, scene);
    m.material = mat;
    return addMesh(m, parent, y, castShadow);
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
      const finShape = [
        new Vector3(0, 0, 0),
        new Vector3(bodyRadius * 0.15, bodyHeight * 0.08, 0),
        new Vector3(bodyRadius * 0.18, bodyHeight * 0.2, 0),
        new Vector3(bodyRadius * 0.12, bodyHeight * 0.32, 0),
        new Vector3(0, bodyHeight * 0.35, 0),
      ];
      for (let side = -1; side <= 1; side += 2) {
        const fin = MeshBuilder.CreateLathe('fin_' + side, { shape: finShape, radius: 0.3, tessellation: 8, closed: true }, scene);
        fin.material = accentMat;
        addMesh(fin, bodyGroup, bodyHeight * 0.4);
        fin.position.x = side * bodyRadius * 0.85;
        fin.rotation.z = side * Math.PI / 6;
      }
      break;
    }
    case 'hover_body': {
      createCylinder('disc', bodyRadius, bodyRadius * 1.1, bodyHeight, 32, bodyMat, bodyGroup, bodyHeight / 2 + 0.15);
      const hoverGlowMat = makeStandard(scene, '#44aaff', { emissive: '#2266cc', emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
      const hg = createTorus('hoverGlow', bodyRadius * 0.9 * 2, 0.03, 32, hoverGlowMat, bodyGroup, 0.15);
      hg.rotation.x = Math.PI / 2;
      createCylinder('topDisc', bodyRadius * 0.5, bodyRadius * 0.6, 0.08, 24, accentMat, bodyGroup, bodyHeight + 0.19, false);

      const fanBladeMat = makeStandard(scene, '#335566', { emissive: '#224466', emissiveIntensity: 0.3 });
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const blade = createBox('fanBlade', bodyRadius * 0.35, 0.015, 0.06, fanBladeMat, bodyGroup, bodyHeight + 0.22, false);
        blade.position.set(Math.cos(a) * bodyRadius * 0.25, 0, Math.sin(a) * bodyRadius * 0.25);
        blade.rotation.y = -a;
      }
      break;
    }
    case 'mech': {
      const mechBody = createBox('mechBody', bodyRadius * 1.6, bodyHeight, bodyRadius * 1.2, bodyMat, bodyGroup, bodyHeight / 2);
      for (let i = -1; i <= 1; i += 2) {
        const sp = createBox('shoulder', 0.08, bodyHeight * 0.5, bodyRadius * 0.8, accentMat, bodyGroup, bodyHeight * 0.5);
        sp.position.x = i * (bodyRadius * 0.85);
      }
      createBox('frontArmor', bodyRadius * 1.2, bodyHeight * 0.3, 0.05, panelMat, bodyGroup, bodyHeight * 0.3).position.z = bodyRadius * 0.6;

      const ventMat = makeStandard(scene, '#111111', { emissive: '#331111', emissiveIntensity: 0.2 });
      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
          const v = createBox('vent', 0.04, 0.04, 0.06, ventMat, bodyGroup, bodyHeight * 0.5 + j * 0.1);
          v.position.set(i * bodyRadius * 0.4, 0, bodyRadius * 0.61);
        }
      }

      const grillMat = makeStandard(scene, '#0a0a0a', { emissive: '#441111', emissiveIntensity: 0.15 });
      for (let i = -2; i <= 2; i++) {
        createBox('grill', bodyRadius * 1.0, 0.015, 0.02, grillMat, bodyGroup, bodyHeight * 0.3).position.set(0, i * 0.04, bodyRadius * 0.61);
      }
      break;
    }
    case 'heavy': {
      createCylinder('heavy', bodyRadius, bodyRadius * 1.15, bodyHeight, 8, bodyMat, bodyGroup, bodyHeight / 2);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const plate = createBox('plate', bodyRadius * 0.6, bodyHeight * 0.75, 0.06, accentMat, bodyGroup, bodyHeight * 0.5);
        plate.position.set(Math.cos(a) * (bodyRadius * 1.05), 0, Math.sin(a) * (bodyRadius * 1.05));
        plate.rotation.y = -a + Math.PI / 2;
      }
      const beltMat = makeStandard(scene, '#1a1a1a', { roughness: 0.9 });
      createTorus('belt', bodyRadius * 2.1, 0.04, 16, beltMat, bodyGroup, bodyHeight * 0.15).rotation.x = Math.PI / 2;
      createTorus('belt2', bodyRadius * 2.1, 0.04, 16, beltMat, bodyGroup, bodyHeight * 0.85).rotation.x = Math.PI / 2;
      break;
    }
    case 'slim': {
      createCylinder('slim', bodyRadius * 0.85, bodyRadius, bodyHeight, 20, bodyMat, bodyGroup, bodyHeight / 2);
      const pipeMat = makePBR(scene, '#d47a55', 0.1, 0.9);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const pipe = MeshBuilder.CreateCylinder('pipe', { diameter: 0.03, height: bodyHeight * 0.8, tessellation: 8 }, scene);
        pipe.material = pipeMat;
        addMesh(pipe, bodyGroup, bodyHeight * 0.5, false);
        pipe.position.set(Math.cos(a) * (bodyRadius * 0.95), 0, Math.sin(a) * (bodyRadius * 0.95));
      }
      const conduitMat = makePBR(scene, '#553322', 0.5, 0.4);
      const conduitPath = [
        new Vector3(-bodyRadius * 0.6, 0, bodyRadius * 0.5),
        new Vector3(-bodyRadius * 0.8, bodyHeight * 0.2, bodyRadius * 0.3),
        new Vector3(-bodyRadius * 0.8, bodyHeight * 0.5, 0),
        new Vector3(-bodyRadius * 0.8, bodyHeight * 0.8, -bodyRadius * 0.3),
        new Vector3(-bodyRadius * 0.6, bodyHeight, -bodyRadius * 0.5),
      ];
      createTube('conduitL', conduitPath, 0.015, 8, conduitMat, bodyGroup, -bodyHeight * 0.3, false);
      const conduitPathR = conduitPath.map(p => new Vector3(-p.x, p.y, p.z));
      createTube('conduitR', conduitPathR, 0.015, 8, conduitMat, bodyGroup, -bodyHeight * 0.3, false);
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
      const geoMat = makeStandard(scene, '#224488', { emissive: '#112244', emissiveIntensity: 0.2, transparent: true, opacity: 0.3 });
      const geo = createPolyhedron('geoCore', 1, sr * 0.5, geoMat, bodyGroup, bodyHeight / 2, false);
      geo.rotation.y = Math.PI / 4;
      break;
    }
    case 'insect': {
      const segH = bodyHeight * 0.18;
      for (let s = 0; s < 3; s++) {
        const segR = bodyRadius * (0.8 - s * 0.1);
        createCylinder('seg', segR, segR, segH, 20, bodyMat, bodyGroup, segH * (s + 0.5));
        if (s < 2) createCylinder('joint', segR * 0.25, segR * 0.25, 0.04, 8, darkMat, bodyGroup, segH * (s + 1.0));
        const ridge = MeshBuilder.CreateCylinder('ridge', { diameterTop: 0, diameterBottom: segR * 0.3, height: segR * 0.2, tessellation: 4 }, scene);
        ridge.material = accentMat;
        addMesh(ridge, bodyGroup, segH * (s + 0.5) + segH * 0.35);
        ridge.rotation.z = Math.PI;
      }
      for (let i = -1; i <= 1; i += 2) {
        for (let s = 0; s < 3; s++) {
          const spine = MeshBuilder.CreateCylinder('spine', { diameterTop: 0.01, diameterBottom: bodyRadius * 0.05, height: bodyRadius * 0.25, tessellation: 8 }, scene);
          spine.material = accentMat;
          addMesh(spine, bodyGroup, segH * (s + 0.5));
          spine.position.set(i * (bodyRadius + 0.12), -bodyRadius * 0.1, 0);
          spine.rotation.z = i * Math.PI / 5;
        }
      }
      const wingMat = makeStandard(scene, '#4477aa', { emissive: '#224466', emissiveIntensity: 0.2, transparent: true, opacity: 0.4 });
      for (let side = -1; side <= 1; side += 2) {
        const wingPath = [
          new Vector3(0, 0, 0),
          new Vector3(side * 0.15, 0.02, bodyRadius * 0.3),
          new Vector3(side * 0.25, 0.01, bodyRadius * 0.5),
          new Vector3(side * 0.15, -0.01, bodyRadius * 0.4),
          new Vector3(0, 0, 0),
        ];
        const wingLathe = MeshBuilder.CreateLathe('wing_' + side, { shape: wingPath, radius: 0.1, tessellation: 16, closed: true }, scene);
        wingLathe.material = wingMat;
        addMesh(wingLathe, bodyGroup, bodyHeight * 0.7, false);
        wingLathe.position.x = side * bodyRadius * 0.3;
        wingLathe.rotation.y = side * Math.PI / 8;
      }
      break;
    }
    case 'tank': {
      const tankMat = makePBR(scene, bodyColor, 0.7, 0.8, { clearCoat: 0.1 });
      const hull = createBox('hull', bodyRadius * 1.8, bodyHeight * 0.6, bodyRadius * 1.6, tankMat, bodyGroup, bodyHeight * 0.3);
      hull.position.y = bodyHeight * 0.3;
      const turretBase = createCylinder('turretRing', bodyRadius * 0.7, bodyRadius * 0.8, 0.08, 20, accentMat, bodyGroup, bodyHeight * 0.65);
      const turretDish = MeshBuilder.CreateSphere('turretDish', { diameter: bodyRadius * 1.0 * 2, segments: 20, slice: 0.55 }, scene);
      turretDish.material = bodyMat;
      addMesh(turretDish, bodyGroup, bodyHeight * 0.75);

      const armorPlates = [
        [bodyRadius * 0.9, bodyHeight * 0.35, 0],
        [-bodyRadius * 0.9, bodyHeight * 0.35, 0],
        [0, bodyHeight * 0.35, bodyRadius * 0.8],
      ];
      for (const p of armorPlates) {
        createBox('armorPlate', 0.08, bodyHeight * 0.4, bodyRadius * 0.3, panelMat, bodyGroup, p[1]).position.set(p[0], 0, p[2]);
      }

      const barrelMat = makePBR(scene, '#222222', 0.3, 0.8);
      const barrel = MeshBuilder.CreateCylinder('mainBarrel', { diameterTop: 0.04, diameterBottom: 0.07, height: 0.5, tessellation: 12 }, scene);
      barrel.material = barrelMat;
      addMesh(barrel, bodyGroup, bodyHeight * 0.78, false);
      barrel.position.z = bodyRadius * 0.7;
      barrel.rotation.x = Math.PI / 2;
      createTorus('barrelRing', 0.08, 0.012, 12, chromeMat, bodyGroup, bodyHeight * 0.78).position.z = bodyRadius * 0.7 + 0.25;
      break;
    }
    case 'quad': {
      createCylinder('quadBody', bodyRadius * 0.8, bodyRadius * 1.0, bodyHeight * 0.7, 8, bodyMat, bodyGroup, bodyHeight * 0.35);
      const quadExoMat = makePBR(scene, bodyColor, 0.5, 0.6);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const mount = createBox('mount', 0.1, 0.06, 0.1, accentMat, bodyGroup, bodyHeight * 0.05);
        mount.position.set(Math.cos(a) * bodyRadius * 0.9, 0, Math.sin(a) * bodyRadius * 0.9);
      }
      const ringMat = makeStandard(scene, '#1a2a3a', { emissive: '#0a1a2a', emissiveIntensity: 0.2 });
      createTorus('quadRing', bodyRadius * 1.7, 0.025, 24, ringMat, bodyGroup, bodyHeight * 0.2).rotation.x = Math.PI / 2;
      createTorus('quadRing2', bodyRadius * 1.7, 0.025, 24, ringMat, bodyGroup, bodyHeight * 0.5).rotation.x = Math.PI / 2;
      break;
    }
    case 'astromech_body': {
      const abh = bodyHeight;
      const abr = bodyRadius;
      createCylinder('astroBarrel', abr, abr, abh, 28, bodyMat, bodyGroup, abh / 2);
      const bluePanelMat = makePanelPBR(scene, '#2266bb', 0.35, 0.65);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const p = createBox('astroPanel', abr * 0.55, abh * 0.25, 0.04, bluePanelMat, bodyGroup, abh * 0.5);
        p.position.set(Math.cos(a) * abr * 0.92, 0, Math.sin(a) * abr * 0.92);
        p.rotation.y = -a + Math.PI / 2;
      }
      for (let j = 0; j < 3; j++) {
        createTorus('astroBelt', abr * 1.9, 0.012, 28, accentMat, bodyGroup, abh * (0.15 + j * 0.35)).rotation.x = Math.PI / 2;
      }
      const ventMat = makeStandard(scene, '#0a0a0a', { emissive: '#220000', emissiveIntensity: 0.15 });
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 4; j++) {
          createBox('astroVent', 0.04, 0.012, 0.04, ventMat, bodyGroup, abh * 0.3 + i * 0.2, false).position.z = abr * 0.93;
        }
      }
      const utilityMat = makePBR(scene, '#334455', 0.5, 0.5);
      for (let side = -1; side <= 1; side += 2) {
        createBox('utilityArm', 0.04, 0.03, 0.08, utilityMat, bodyGroup, abh * 0.35, false).position.set(side * abr * 0.9, 0, abr * 0.5);
      }
      root.metadata = root.metadata || {};
      root.metadata.astroBodyGroup = bodyGroup;
      break;
    }
    case 'protocol_body': {
      const pbw = bodyRadius * 1.5, pbh = bodyHeight, pbd = bodyRadius * 1.0;
      const goldMat = makePBR(scene, '#d4b060', 0.12, 0.9, { clearCoat: 0.6, clearCoatRoughness: 0.1 });
      createBox('protoTorso', pbw, pbh, pbd, goldMat, bodyGroup, pbh / 2);
      const chestPlate = createBox('protoChest', pbw * 0.7, pbh * 0.25, 0.03, panelMat, bodyGroup, pbh * 0.65);
      chestPlate.position.z = pbd / 2 + 0.02;
      const indicatorMat = makeStandard(scene, '#44ff44', { emissive: '#22cc22', emissiveIntensity: 0.7 });
      for (let i = 0; i < 3; i++) {
        createSphere('protoLight', 0.025, 8, indicatorMat, bodyGroup, pbh * 0.55 - i * 0.05, false).position.set(i * 0.06 - 0.06, 0, pbd / 2 + 0.03);
      }
      const wireMat = makeStandard(scene, '#554422', { roughness: 0.3 });
      for (let side = -1; side <= 1; side += 2) {
        const wirePath = [
          new Vector3(side * pbw * 0.4, 0, pbd * 0.4),
          new Vector3(side * pbw * 0.5, pbh * 0.15, pbd * 0.3),
          new Vector3(side * pbw * 0.55, pbh * 0.4, pbd * 0.2),
          new Vector3(side * pbw * 0.5, pbh * 0.65, pbd * 0.1),
          new Vector3(side * pbw * 0.4, pbh * 0.8, pbd * 0.15),
        ];
        createTube('protoWire_' + side, wirePath, 0.008, 6, wireMat, bodyGroup, 0, false);
      }
      for (let i = 0; i < 4; i++) {
        createBox('abdomenRidge', pbw * 0.5, 0.02, 0.03, darkMat, bodyGroup, pbh * 0.15 + i * 0.08).position.z = pbd * 0.35;
      }
      break;
    }
    case 'assassin': {
      const arb = bodyRadius, arh = bodyHeight;
      const assMat = makePBR(scene, '#333333', 0.6, 0.85, { anisotropy: 0.5 });
      createCylinder('assSpine', arb * 0.35, arb * 0.4, arh * 0.8, 16, assMat, bodyGroup, arh * 0.4);
      for (let s = 0; s < 4; s++) {
        const segY = arh * 0.15 + s * arh * 0.18;
        const segR = arb * (0.8 - s * 0.1);
        createCylinder('assSeg_' + s, segR, segR * 1.1, arh * 0.06, 16, darkMat, bodyGroup, segY);
        if (s < 3) {
          const jointR = segR * 0.4;
          createSphere('assJoint_' + s, jointR * 2, 10, chromeMat, bodyGroup, segY + arh * 0.06, false);
        }
      }
      const pistonMat = makePBR(scene, '#998877', 0.1, 0.9);
      for (let side = -1; side <= 1; side += 2) {
        for (let p = 0; p < 3; p++) {
          const py = arh * 0.2 + p * arh * 0.2;
          const piston = MeshBuilder.CreateCylinder('piston_' + side + '_' + p, { diameter: 0.015, height: arb * 0.4, tessellation: 8 }, scene);
          piston.material = pistonMat;
          addMesh(piston, bodyGroup, py, false);
          piston.position.set(side * arb * 0.6, 0, 0);
          piston.rotation.z = side * Math.PI / 3;
        }
      }
      const eyeMat = makeStandard(scene, '#ff1100', { emissive: '#ff1100', emissiveIntensity: 1.5 });
      createSphere('assEye', 0.04, 8, eyeMat, bodyGroup, arh * 0.8, false).position.set(0, 0, arb * 0.5);
      break;
    }
    default: {
      const capH = bodyHeight * 0.15;
      createCylinder('topCap', bodyRadius, bodyRadius, capH, 24, bodyMat, bodyGroup, bodyHeight - capH / 2);
      createCylinder('botCap', bodyRadius, bodyRadius, capH, 24, bodyMat, bodyGroup, capH / 2);
      const coreMat = makeStandard(scene, '#33aaff', { emissive: '#1166dd', emissiveIntensity: 2.0 });
      const core = createCylinder('core', bodyRadius * 0.45, bodyRadius * 0.45, bodyHeight - capH * 2, 16, coreMat, bodyGroup, bodyHeight / 2, false);
      root.metadata = root.metadata || {};
      root.metadata.thrusterCore = core;
      const strutMat = accentMat;
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const strut = MeshBuilder.CreateCylinder('strut', { diameter: 0.05, height: bodyHeight - capH, tessellation: 10 }, scene);
        strut.material = strutMat;
        addMesh(strut, bodyGroup, bodyHeight / 2);
        strut.position.set(Math.cos(a) * (bodyRadius - 0.02), 0, Math.sin(a) * (bodyRadius - 0.02));
      }
      break;
    }
  }

  // Side panels (common across body types)
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
  const ring = createTorus('ring1', ringDiam, 0.015, 28, accentMat, bodyGroup, bodyHeight * 0.25);
  ring.rotation.x = Math.PI / 2;
  const ring2 = createTorus('ring2', ringDiam, 0.015, 28, accentMat, bodyGroup, bodyHeight * 0.75);
  ring2.rotation.x = Math.PI / 2;

  // === HEAD ===
  const headGroup = new TransformNode('head', scene);
  headGroup.parent = root;
  const headY = bodyHeight + 0.05;

  switch (cfg.head) {
    case 'dome': {
      const dome = MeshBuilder.CreateSphere('dome', { diameter: bodyRadius * 0.85 * 2, segments: 28, slice: 0.5 }, scene);
      dome.material = headMat;
      addMesh(dome, headGroup, headY);
      const eye = MeshBuilder.CreateCylinder('eye', { diameterTop: 0.1, diameterBottom: 0.14, height: 0.06, tessellation: 16 }, scene);
      eye.material = frontGlowMat;
      addMesh(eye, headGroup, headY + 0.02, false);
      eye.position.z = bodyRadius * 0.78;
      eye.rotation.x = Math.PI / 3;
      createTorus('eyeRing', 0.12, 0.01, 14, chromeMat, headGroup, headY + 0.02).position.z = bodyRadius * 0.78;
      createBox('visor', bodyRadius * 0.5, 0.03, 0.08, makeStandard(scene, '#111122', { roughness: 0.1 }), headGroup, headY + 0.08).position.z = bodyRadius * 0.6;
      createSphere('rearDot', 0.05, 8, makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.6 }), headGroup, headY + 0.1, false).position.z = -bodyRadius * 0.6;

      const ringArray = createTorus('domeRing', bodyRadius * 0.8 * 2, 0.008, 24, accentMat, headGroup, headY + 0.05);
      ringArray.rotation.x = Math.PI / 3;
      break;
    }
    case 'sensor': {
      const sw = bodyRadius * 0.7, sh = 0.22, sd = bodyRadius * 0.5;
      createBox('sensor', sw, sh, sd, headMat, headGroup, headY + 0.11);
      for (let i = -1; i <= 1; i += 2) {
        const lens = MeshBuilder.CreateCylinder('lens', { diameter: 0.11, height: 0.05, tessellation: 16 }, scene);
        lens.material = frontGlowMat;
        addMesh(lens, headGroup, headY + 0.11, false);
        lens.position.set(i * 0.18, 0, sd / 2 + 0.025);
        lens.rotation.x = Math.PI / 2;
        createTorus('rim', 0.11, 0.008, 14, chromeMat, headGroup, headY + 0.11).position.set(i * 0.18, 0, sd / 2 + 0.045);
      }
      createCylinder('top', sw * 0.3, sw * 0.35, 0.04, 10, darkMat, headGroup, headY + sh / 2 + 0.03, false);
      const rearLens = MeshBuilder.CreateCylinder('rearLens', { diameter: 0.07, height: 0.03, tessellation: 10 }, scene);
      rearLens.material = makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.5 });
      addMesh(rearLens, headGroup, headY + 0.11, false);
      rearLens.position.z = -sd / 2 - 0.02;
      rearLens.rotation.x = Math.PI / 2;
      break;
    }
    case 'antenna': {
      createSphere('antHead', bodyRadius * 0.45 * 2, 24, headMat, headGroup, headY + 0.05);
      createTorus('antBand', bodyRadius * 0.42 * 2, 0.015, 24, accentMat, headGroup, headY + 0.05).rotation.x = Math.PI / 2;
      createCylinder('rod', 0.025, 0.03, 0.35, 10, darkMat, headGroup, headY + 0.28, false);
      createSphere('tip', 0.11, 12, frontGlowMat, headGroup, headY + 0.45, false);
      const dish = MeshBuilder.CreateSphere('dish', { diameter: bodyRadius * 0.25 * 2, segments: 14, slice: 0.45 }, scene);
      dish.material = chromeMat;
      addMesh(dish, headGroup, headY + 0.15, false);
      dish.position.x = bodyRadius * 0.4;
      dish.rotation.z = -Math.PI / 6;
      createSphere('frontDot', 0.04, 8, frontGlowMat, headGroup, headY + 0.1, false).position.z = bodyRadius * 0.42;
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
      createSphere('rearDot', 0.04, 8, makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.5 }), headGroup, headY + 0.09, false).position.z = -bodyRadius * 0.31;

      const hornMat = makePBR(scene, accentColor, 0.2, 0.7);
      for (let side = -1; side <= 1; side += 2) {
        const hornPath = [
          new Vector3(0, 0, 0),
          new Vector3(side * 0.1, 0.05, 0),
          new Vector3(side * 0.18, 0.12, 0),
          new Vector3(side * 0.22, 0.2, 0),
          new Vector3(side * 0.15, 0.25, 0),
        ];
        const horn = MeshBuilder.CreateTube('horn_' + side, { path: hornPath, radius: 0.015, tessellation: 8 }, scene);
        horn.material = hornMat;
        addMesh(horn, headGroup, headY + 0.15, false);
        horn.position.z = bodyRadius * 0.2;
      }
      break;
    }
    case 'box': {
      createBox('boxHead', bodyRadius * 1.1, 0.3, bodyRadius * 0.8, headMat, headGroup, headY + 0.15);
      createBox('facePlate', bodyRadius * 0.9, 0.2, 0.04, panelMat, headGroup, headY + 0.15).position.z = bodyRadius * 0.41;
      for (let i = -1; i <= 1; i += 2) {
        createSphere('eye', 0.08, 10, frontGlowMat, headGroup, headY + 0.18, false).position.set(i * 0.12, 0, bodyRadius * 0.42);
        createTorus('eyeRim', 0.09, 0.008, 12, chromeMat, headGroup, headY + 0.18).position.set(i * 0.12, 0, bodyRadius * 0.43);
      }
      createBox('mouth', bodyRadius * 0.4, 0.025, 0.03, makeStandard(scene, '#222222', { emissive: '#331111', emissiveIntensity: 0.3 }), headGroup, headY + 0.08).position.z = bodyRadius * 0.42;
      for (let i = -1; i <= 1; i += 2) {
        createCylinder('ant', 0.012, 0.015, 0.2, 8, darkMat, headGroup, headY + 0.4, false).position.x = i * 0.2;
        createSphere('antTip', 0.04, 8, glowMat, headGroup, headY + 0.5, false).position.x = i * 0.2;
      }
      createSphere('rearLight', 0.04, 8, makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.5 }), headGroup, headY + 0.15, false).position.z = -bodyRadius * 0.41;

      const cheekMat = makeStandard(scene, '#2244aa', { emissive: '#112266', emissiveIntensity: 0.3 });
      for (let side = -1; side <= 1; side += 2) {
        createBox('cheek', 0.06, 0.08, 0.04, cheekMat, headGroup, headY + 0.12).position.set(side * bodyRadius * 0.5, 0, bodyRadius * 0.35);
      }
      break;
    }
    case 'turret': {
      createCylinder('turretBase', bodyRadius * 0.5, bodyRadius * 0.55, 0.12, 20, darkMat, headGroup, headY + 0.06);
      const turretDome = MeshBuilder.CreateSphere('turretDome', { diameter: bodyRadius * 0.4 * 2, segments: 20, slice: 0.55 }, scene);
      turretDome.material = headMat;
      addMesh(turretDome, headGroup, headY + 0.12);
      createCylinder('barrel', 0.035, 0.04, 0.4, 12, chromeMat, headGroup, headY + 0.2).position.z = bodyRadius * 0.55;
      createCylinder('muzzle', 0.045, 0.035, 0.06, 12, darkMat, headGroup, headY + 0.2).position.z = bodyRadius * 0.55 + 0.2;
      createTorus('muzzleGlow', 0.08, 0.006, 12, frontGlowMat, headGroup, headY + 0.2).position.z = bodyRadius * 0.55 + 0.23;
      createSphere('sight', 0.05, 10, frontGlowMat, headGroup, headY + 0.35, false).position.z = bodyRadius * 0.25;
      createTorus('turretRing', bodyRadius * 0.42 * 2, 0.01, 20, accentMat, headGroup, headY + 0.12).rotation.x = Math.PI / 2;
      root.metadata = root.metadata || {};
      root.metadata.turretBarrel = headGroup.getChildren().find(c => c.name === 'barrel');
      break;
    }
    case 'cyclops': {
      const dome = MeshBuilder.CreateSphere('cyclopsDome', { diameter: bodyRadius * 0.9 * 2, segments: 28, slice: 0.55 }, scene);
      dome.material = headMat;
      addMesh(dome, headGroup, headY + 0.08);
      const eyeMat = makeStandard(scene, '#ff2200', { emissive: '#ff4400', emissiveIntensity: 2.2 });
      const eye = MeshBuilder.CreateSphere('cyclopsEye', { diameter: bodyRadius * 0.45 * 2, segments: 24 }, scene);
      eye.material = eyeMat;
      addMesh(eye, headGroup, headY + 0.1, false);
      eye.position.z = bodyRadius * 0.18;
      createTorus('eyeRing', bodyRadius * 0.48 * 2, 0.02, 24, chromeMat, headGroup, headY + 0.1).position.z = bodyRadius * 0.18;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI * 2) / 4 + Math.PI / 4;
        const plate = createBox('eyePlate', bodyRadius * 0.12, bodyRadius * 0.08, 0.03, accentMat, headGroup, headY + 0.1);
        plate.position.set(Math.cos(a) * bodyRadius * 0.48, Math.sin(a) * 0.02, bodyRadius * 0.12);
      }
      for (let i = -1; i <= 1; i += 2) {
        createSphere('sideEye', 0.06, 10, frontGlowMat, headGroup, headY + 0.1, false).position.set(i * bodyRadius * 0.4, 0, bodyRadius * 0.0);
      }
      break;
    }
    case 'crown': {
      createTorus('crownBase', bodyRadius * 0.8 * 2, 0.03, 24, accentMat, headGroup, headY + 0.05).rotation.x = Math.PI / 2;
      createCylinder('crownDome', bodyRadius * 0.35, bodyRadius * 0.3, 0.14, 20, headMat, headGroup, headY + 0.12);
      const spikeMat = makePBR(scene, headColor, 0.25, 0.8);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const spike = MeshBuilder.CreateCylinder('spike', { diameterTop: 0, diameterBottom: bodyRadius * 0.1, height: bodyRadius * 0.4, tessellation: 10 }, scene);
        spike.material = spikeMat;
        addMesh(spike, headGroup, headY + 0.28, false);
        spike.position.set(Math.cos(a) * bodyRadius * 0.42, 0, Math.sin(a) * bodyRadius * 0.42);
        createSphere('spikeTip', 0.03, 8, glowMat, headGroup, headY + 0.48, false).position.set(Math.cos(a) * bodyRadius * 0.42, 0, Math.sin(a) * bodyRadius * 0.42);
      }
      createSphere('crownJewel', bodyRadius * 0.1 * 2, 14, frontGlowMat, headGroup, headY + 0.12, false).position.z = bodyRadius * 0.35;
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
        const eyeMesh = MeshBuilder.CreateCylinder('eye', { diameter: 0.1, height: 0.025, tessellation: 12 }, scene);
        eyeMesh.material = eyeMat;
        addMesh(eyeMesh, eyeG, 0, false);
        eyeMesh.rotation.x = Math.PI / 2;
        createTorus('eyeRim', 0.11, 0.01, 12, chromeMat, eyeG, 0).position.z = 0.015;
      }
      createCylinder('rearHub', bodyRadius * 0.12, bodyRadius * 0.15, 0.07, 10, darkMat, headGroup, headY + 0.07, false);
      break;
    }
    case 'goggle': {
      const goggleMat = makePBR(scene, headColor, 0.3, 0.7, { clearCoat: 0.4 });
      const band = createBox('goggleBand', bodyRadius * 1.2, 0.12, bodyRadius * 0.7, goggleMat, headGroup, headY + 0.06);
      const lensMat = makeStandard(scene, '#44aaff', { emissive: '#2266cc', emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });
      for (let side = -1; side <= 1; side += 2) {
        const lensRing = createTorus('goggleLensRing', 0.18, 0.02, 16, chromeMat, headGroup, headY + 0.08);
        lensRing.position.x = side * 0.14;
        lensRing.position.z = bodyRadius * 0.36;
        const lens = MeshBuilder.CreateSphere('goggleLens', { diameter: 0.15, segments: 16 }, scene);
        lens.material = lensMat;
        addMesh(lens, headGroup, headY + 0.08, false);
        lens.position.set(side * 0.14, 0, bodyRadius * 0.36);
        lens.scaling.z = 0.5;
      }
      createBox('goggleBridge', 0.06, 0.04, 0.04, chromeMat, headGroup, headY + 0.08).position.z = bodyRadius * 0.36;
      createSphere('goggleRear', 0.04, 8, makeStandard(scene, '#ff3344', { emissive: '#cc1122', emissiveIntensity: 0.4 }), headGroup, headY + 0.06, false).position.z = -bodyRadius * 0.36;
      break;
    }
    case 'halo': {
      createSphere('haloHead', bodyRadius * 0.5 * 2, 24, headMat, headGroup, headY + 0.04);
      const haloMat = makeStandard(scene, '#44aaff', { emissive: '#4488ff', emissiveIntensity: 0.8, transparent: true, opacity: 0.7 });
      const haloRing = createTorus('haloRing', bodyRadius * 1.0 * 2, 0.015, 24, haloMat, headGroup, headY + 0.2);
      haloRing.rotation.x = Math.PI / 2;
      const haloGlow = makeStandard(scene, '#4488ff', { emissive: '#4488ff', emissiveIntensity: 0.3, transparent: true, opacity: 0.3 });
      const haloGlowRing = createTorus('haloGlow', bodyRadius * 1.05 * 2, 0.04, 24, haloGlow, headGroup, headY + 0.2);
      haloGlowRing.rotation.x = Math.PI / 2;
      createSphere('haloCore', 0.06, 10, frontGlowMat, headGroup, headY + 0.04, false).position.z = bodyRadius * 0.32;
      break;
    }
    case 'astromech': {
      const dome = MeshBuilder.CreateSphere('astroDome', { diameter: bodyRadius * 0.85 * 2, segments: 32, slice: 0.5 }, scene);
      dome.material = chromeMat;
      addMesh(dome, headGroup, headY);
      createTorus('astroDomeRing', bodyRadius * 0.82 * 2, 0.008, 28, accentMat, headGroup, headY + 0.02).rotation.x = Math.PI / 4;
      const bluePanel = makeStandard(scene, '#2255bb', { emissive: '#1133aa', emissiveIntensity: 0.5 });
      createBox('astroBluePanel', bodyRadius * 0.3, 0.04, 0.08, bluePanel, headGroup, headY + 0.08).position.set(-bodyRadius * 0.2, 0, bodyRadius * 0.7);
      const mainEye = createCylinder('astroMainEye', 0.04, 0.06, 0.04, 12, frontGlowMat, headGroup, headY + 0.02, false);
      mainEye.position.z = bodyRadius * 0.78;
      mainEye.rotation.x = Math.PI / 3;
      createTorus('astroMainRim', 0.08, 0.008, 12, chromeMat, headGroup, headY + 0.02).position.z = bodyRadius * 0.78;
      const sensorColors = ['#ff4444', '#44ff44', '#4488ff', '#ffff44'];
      for (let i = 0; i < 4; i++) {
        const sa = -Math.PI / 5 + (i * Math.PI * 2 / 18);
        const sx = Math.sin(sa) * bodyRadius * 0.52;
        const sz = Math.cos(sa) * bodyRadius * 0.7;
        const lMat = makeStandard(scene, sensorColors[i], { emissive: sensorColors[i], emissiveIntensity: 0.6 });
        createSphere('astroSensor_' + i, 0.035, 8, lMat, headGroup, headY + 0.05, false).position.set(sx, 0, sz);
      }
      const rearDataPort = createBox('astroPort', 0.05, 0.04, 0.06, darkMat, headGroup, headY + 0.05, false);
      rearDataPort.position.z = -bodyRadius * 0.6;
      break;
    }
    case 'protocol': {
      const protoGoldMat = makePBR(scene, '#d4b060', 0.12, 0.9, { clearCoat: 0.6, clearCoatRoughness: 0.1 });
      const head = MeshBuilder.CreateSphere('protoHead', { diameter: bodyRadius * 0.8 * 2, segments: 28 }, scene);
      head.material = protoGoldMat;
      addMesh(head, headGroup, headY + 0.02);
      head.scaling.y = 0.8;
      head.scaling.z = 0.75;
      const protoEyeMat = makeStandard(scene, '#ffcc44', { emissive: '#ffcc44', emissiveIntensity: 1.2 });
      for (let side = -1; side <= 1; side += 2) {
        const eye = MeshBuilder.CreateCylinder('protoEye_' + side, { diameter: 0.12, height: 0.025, tessellation: 16 }, scene);
        eye.material = protoEyeMat;
        addMesh(eye, headGroup, headY + 0.06, false);
        eye.position.set(side * 0.09, 0, bodyRadius * 0.55);
        eye.rotation.x = Math.PI / 2;
        createTorus('protoEyeRim_' + side, 0.13, 0.012, 16, darkMat, headGroup, headY + 0.06).position.set(side * 0.09, 0, bodyRadius * 0.56);
      }
      const mouthMat = makeStandard(scene, '#332200', { emissive: '#110000', emissiveIntensity: 0.15 });
      for (let i = -1; i <= 1; i++) {
        createBox('protoMouth_' + i, 0.08, 0.012, 0.01, mouthMat, headGroup, headY - 0.02).position.set(i * 0.08, 0, bodyRadius * 0.55);
      }
      for (let side = -1; side <= 1; side += 2) {
        const ear = createCylinder('protoEar_' + side, 0.04, 0.06, 0.1, 12, protoGoldMat, headGroup, headY + 0.02, false);
        ear.position.set(side * bodyRadius * 0.65, 0, 0);
        ear.rotation.z = Math.PI / 2;
        createTorus('protoEarRing_' + side, 0.1, 0.01, 12, accentMat, headGroup, headY + 0.02).position.set(side * bodyRadius * 0.68, 0, 0);
      }
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
        const w = MeshBuilder.CreateCylinder('wheel', { diameter: 0.16, height: 0.12, tessellation: 16 }, scene);
        w.material = wheelMat;
        addMesh(w, baseGroup, 0.06);
        w.position.set(p[0], 0, p[2]);
        w.rotation.z = Math.PI / 2;
        wheelsList.push(w);
        createCylinder('hub', 0.03, 0.03, 0.13, 8, chromeMat, baseGroup, 0.06, false).position.set(p[0], 0, p[2]);

        const spokeMat = makePBR(scene, '#333333', 0.5, 0.7);
        for (let s = 0; s < 5; s++) {
          const sa = (s * Math.PI * 2) / 5;
          const spoke = createBox('spoke', 0.015, 0.06, 0.005, spokeMat, baseGroup, 0.06, false);
          spoke.position.set(p[0] + Math.sin(sa) * 0.04, 0, p[2] + Math.cos(sa) * 0.04);
          spoke.rotation.y = sa;
        }
      }
      root.metadata = root.metadata || {};
      root.metadata.wheels = wheelsList;
      const legMat = makePBR(scene, baseColor, 0.6, 0.5);
      for (const p of positions) {
        createCylinder('leg', 0.035, 0.055, 0.22, 10, legMat, baseGroup, 0.17, false).position.set(p[0], 0, p[2]);
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
          const roller = MeshBuilder.CreateCylinder('roller', { diameter: 0.08, height: trackW + 0.01, tessellation: 12 }, scene);
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
        const treadMat = makeStandard(scene, '#2a2a2a', { roughness: 0.8 });
        for (let i = -5; i <= 5; i++) {
          createBox('tread', trackW + 0.03, 0.03, 0.015, treadMat, baseGroup, trackH * 0.85, false).position.set(side * (bodyRadius + 0.07), 0, i * trackD / 11);
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
        createCylinder('pad', 0.13, 0.16, 0.06, 16, hoverMat, baseGroup, 0.04, false).position.set(p[0], 0, p[2]);
        const glow = createCylinder('glow', 0.11, 0.14, 0.03, 16, glowMatH, baseGroup, 0.005, false);
        glow.position.set(p[0], 0, p[2]);
        hoverGlows.push(glow);
        createTorus('padRing', 0.28, 0.008, 16, chromeMat, baseGroup, 0.05, false).position.set(p[0], 0, p[2]);
      }
      root.metadata = root.metadata || {};
      root.metadata.hoverGlows = hoverGlows;
      break;
    }
    case 'spider': {
      createCylinder('spiderMount', bodyRadius * 0.35, bodyRadius * 0.5, 0.08, 16, baseMat, baseGroup, 0.04);
      const legMat = makePBR(scene, baseColor, 0.6, 0.5);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const legG = new TransformNode('leg_' + i, scene);
        legG.parent = baseGroup;
        legG.position.set(Math.cos(a) * bodyRadius * 0.3, -0.04, Math.sin(a) * bodyRadius * 0.3);
        legG.rotation.y = a;
        createCylinder('upJoint', 0.04, 0.05, 0.05, 10, darkMat, legG, 0.02);
        const upLeg = MeshBuilder.CreateCylinder('upLeg', { diameterTop: 0.04, diameterBottom: 0.06, height: 0.22, tessellation: 10 }, scene);
        upLeg.material = legMat;
        addMesh(upLeg, legG, 0.04);
        upLeg.position.z = 0.1;
        upLeg.rotation.x = Math.PI / 4;
        const loLeg = MeshBuilder.CreateCylinder('loLeg', { diameterTop: 0.03, diameterBottom: 0.05, height: 0.28, tessellation: 10 }, scene);
        loLeg.material = legMat;
        addMesh(loLeg, legG, 0.05);
        loLeg.position.z = 0.32;
        loLeg.rotation.x = -Math.PI / 7;
        const foot = MeshBuilder.CreateCylinder('foot', { diameterTop: 0.06, diameterBottom: 0.08, height: 0.02, tessellation: 10 }, scene);
        foot.material = darkMat;
        addMesh(foot, legG, 0.04);
        foot.position.z = 0.48;
        createSphere('kneeJoint', 0.045, 8, chromeMat, legG, 0.04).position.z = 0.18;
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
        createTorus('tread', ballR * 3.9, 0.01, 28, treadMat, baseGroup, ballR + i * ballR * 0.55);
      }
      createCylinder('ballConn', bodyRadius * 0.3, bodyRadius * 0.35, 0.08, 16, accentMat, baseGroup, ballR * 2 + 0.04);
      break;
    }
    case 'legs': {
      const hipMat = makePBR(scene, baseColor, 0.5, 0.6);
      createCylinder('hipMount', bodyRadius * 0.3, bodyRadius * 0.4, 0.06, 16, hipMat, baseGroup, 0.03);
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const legRoot = new TransformNode('bipedLeg_' + i, scene);
        legRoot.parent = baseGroup;
        legRoot.position.set(side * bodyRadius * 0.3, -0.02, 0);
        legRoot.rotation.y = side * Math.PI / 8;

        const thighMat = makePBR(scene, baseColor, 0.6, 0.5);
        const thigh = MeshBuilder.CreateCylinder('thigh', { diameterTop: 0.05, diameterBottom: 0.07, height: 0.25, tessellation: 10 }, scene);
        thigh.material = thighMat;
        addMesh(thigh, legRoot, 0.13);
        thigh.rotation.x = 0.15;
        thigh.position.z = 0.05;

        const shinMat = makePBR(scene, baseColor, 0.65, 0.4);
        const shin = MeshBuilder.CreateCylinder('shin', { diameterTop: 0.04, diameterBottom: 0.06, height: 0.28, tessellation: 10 }, scene);
        shin.material = shinMat;
        addMesh(shin, legRoot, 0.3);
        shin.rotation.x = -0.2;
        shin.position.z = 0.28;

        createSphere('knee', 0.05, 8, chromeMat, legRoot, 0.12).position.z = 0.15;
        createBox('foot', 0.08, 0.025, 0.12, darkMat, legRoot, 0.42).position.z = 0.4;
      }
      break;
    }
    case 'rotors': {
      const rotorMat = makePBR(scene, baseColor, 0.3, 0.7);
      createCylinder('rotorHub', bodyRadius * 0.2, bodyRadius * 0.25, 0.05, 16, rotorMat, baseGroup, 0.025);
      const bladeMat = makePBR(scene, '#222222', 0.7, 0.3);
      const rotorBlades = [];
      for (let ring = 0; ring < 2; ring++) {
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + ring * Math.PI / 4;
          const blade = createBox('rotorBlade', 0.4, 0.015, 0.04, bladeMat, baseGroup, 0.05 + ring * 0.04, false);
          blade.position.set(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25);
          blade.rotation.y = -a;
          rotorBlades.push(blade);
        }
      }
      root.metadata = root.metadata || {};
      root.metadata.rotorBlades = rotorBlades;
      break;
    }
    case 'droideka': {
      const dkr = bodyRadius * 0.75;
      const core = MeshBuilder.CreateSphere('dkCore', { diameter: dkr * 1.8, segments: 24 }, scene);
      core.material = baseMat;
      addMesh(core, baseGroup, dkr * 0.7);
      const shieldMat = makeStandard(scene, '#664422', { emissive: '#332200', emissiveIntensity: 0.15, transparent: true, opacity: 0.55 });
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const shield = MeshBuilder.CreateSphere('dkShield_' + i, { diameter: dkr * 2.8, segments: 20, slice: 0.35 }, scene);
        shield.material = shieldMat;
        addMesh(shield, baseGroup, dkr * 0.7, false);
        shield.position.set(Math.cos(a) * dkr * 0.6, Math.sin(a) * 0.15, Math.sin(a) * dkr * 0.5);
        shield.rotation.z = -a;
        shield.rotation.y = a + Math.PI / 2;
      }
      const dkGlowMat = makeStandard(scene, '#ff4400', { emissive: '#ff4400', emissiveIntensity: 1.0, transparent: true, opacity: 0.8 });
      createTorus('dkGlow', dkr * 1.7, 0.03, 24, dkGlowMat, baseGroup, dkr * 0.7).rotation.x = Math.PI / 2;
      for (let side = -1; side <= 1; side += 2) {
        const blaster = createCylinder('dkBlaster_' + side, 0.03, 0.04, 0.25, 10, chromeMat, baseGroup, dkr * 0.5, false);
        blaster.position.set(side * dkr * 0.6, 0, dkr * 0.3);
        blaster.rotation.x = Math.PI / 2;
        blaster.rotation.z = side * Math.PI / 5;
        createTorus('dkBlasterRing_' + side, 0.06, 0.008, 10, accentMat, baseGroup, dkr * 0.5).position.set(side * dkr * 0.65, 0, dkr * 0.48);
      }
      const dkShields = [];
      baseGroup.getChildMeshes().forEach(m => { if (m.name && m.name.startsWith('dkShield_')) dkShields.push(m); });
      root.metadata = root.metadata || {};
      root.metadata.dkShields = dkShields;
      root.metadata.dkCore = baseGroup.getChildMeshes().find(m => m.name === 'dkCore');
      break;
    }
  }

  // === ACCESSORY ===
  const accMat = makePBR(scene, accentColor, 0.4, 0.6, { clearCoat: 0.25 });

  switch (cfg.accessory) {
    case 'arm': {
      createSphere('shoulder', 0.12, 12, chromeMat, null, 0, false).position.set(bodyRadius * 0.85, bodyHeight * 0.55, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      createCylinder('arm', 0.025, 0.03, 0.3, 10, accMat, null, 0, false).position.set(bodyRadius * 0.85 + 0.15, bodyHeight * 0.45, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      root.getChildren()[root.getChildren().length - 1].rotation.z = Math.PI / 4;
      createSphere('elbow', 0.07, 10, chromeMat, null, 0, false).position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.35, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      createCylinder('forearm', 0.02, 0.025, 0.2, 10, accMat, null, 0, false).position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.25, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      createBox('claw', 0.06, 0.015, 0.04, chromeMat, null, 0, false).position.set(bodyRadius * 0.85 + 0.26, bodyHeight * 0.15, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      break;
    }
    case 'shield': {
      const orb = MeshBuilder.CreateIcoSphere('shieldOrb', { radius: 0.12, subdivisions: 2 }, scene);
      orb.material = makeStandard(scene, '#44aaff', { emissive: '#2266cc', emissiveIntensity: 0.6, transparent: true, opacity: 0.8 });
      addMesh(orb, null, 0, false);
      orb.parent = root;
      orb.position.set(0, bodyHeight * 0.5, -bodyRadius * 0.85);
      createCylinder('mount', 0.03, 0.04, 0.15, 10, darkMat, null, 0, false).position.set(0, bodyHeight * 0.5, -bodyRadius * 0.7);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      root.getChildren()[root.getChildren().length - 1].rotation.x = Math.PI / 2;
      const shieldMat = makeStandard(scene, '#88ccff', { emissive: '#4488cc', emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
      createTorus('shieldRing', 0.36, 0.012, 24, shieldMat, null, 0, false).position.set(0, bodyHeight * 0.5, -bodyRadius * 0.85);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      break;
    }
    case 'jetpack': {
      const jetpackFlames = [];
      for (let side = -1; side <= 1; side += 2) {
        createCylinder('pod', 0.06, 0.08, 0.3, 12, accMat, null, 0).position.set(side * (bodyRadius * 0.7), bodyHeight * 0.5, -bodyRadius * 0.3);
        root.getChildren()[root.getChildren().length - 1].parent = root;
        createCylinder('nozzle', 0.04, 0.06, 0.08, 12, chromeMat, null, 0, false).position.set(side * (bodyRadius * 0.7), bodyHeight * 0.32, -bodyRadius * 0.3);
        root.getChildren()[root.getChildren().length - 1].parent = root;
        const flameMat = makeStandard(scene, '#44aaff', { emissive: '#2266ff', emissiveIntensity: 1.0, transparent: true, opacity: 0.8 });
        const flame = MeshBuilder.CreateCylinder('jpFlame', { diameterTop: 0, diameterBottom: 0.1, height: 0.15, tessellation: 10 }, scene);
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
      createCylinder('radarArm', 0.02, 0.025, 0.22, 8, darkMat, null, 0, false).position.set(bodyRadius * 0.5, bodyHeight + 0.11, 0);
      root.getChildren()[root.getChildren().length - 1].parent = root;
      const radarHead = new TransformNode('radarHead', scene);
      radarHead.parent = root;
      radarHead.position.set(bodyRadius * 0.5, bodyHeight + 0.22, 0);
      const dish = MeshBuilder.CreateSphere('radarDish', { diameter: 0.28, segments: 16, slice: 0.45 }, scene);
      dish.material = accMat;
      addMesh(dish, radarHead, 0, false);
      dish.rotation.x = -Math.PI / 4;
      createCylinder('feed', 0.008, 0.008, 0.1, 6, glowMat, radarHead, -0.06, false).position.z = 0.08;
      createSphere('radarTip', 0.04, 8, glowMat, radarHead, 0, false).position.z = 0.12;
      root.metadata = root.metadata || {};
      root.metadata.radarHead = radarHead;
      break;
    }
    case 'cannon': {
      const cannonG = new TransformNode('cannon', scene);
      cannonG.parent = root;
      cannonG.position.set(bodyRadius * 0.7, bodyHeight * 0.65, 0);
      createCylinder('cannonMount', 0.06, 0.08, 0.14, 10, darkMat, cannonG, 0.07);
      const barrel = MeshBuilder.CreateCylinder('cannonBarrel', { diameterTop: 0.08, diameterBottom: 0.12, height: 0.45, tessellation: 12 }, scene);
      barrel.material = chromeMat;
      addMesh(barrel, cannonG, 0.08);
      barrel.rotation.x = Math.PI / 3;
      barrel.position.z = 0.18;
      createTorus('barrelRing', 0.14, 0.01, 12, accentMat, cannonG, 0.08).position.z = 0.22;
      createCylinder('muzzle', 0.1, 0.08, 0.06, 10, darkMat, cannonG, 0.08).position.z = 0.35;
      for (let i = 0; i < 3; i++) {
        createTorus('coil', 0.16, 0.006, 14, frontGlowMat, cannonG, 0.04 + i * 0.02).position.z = 0.04 + i * 0.06;
      }
      break;
    }
    case 'drone': {
      const droneN = new TransformNode('drone', scene);
      droneN.parent = root;
      droneN.position.set(bodyRadius * 1.0, bodyHeight + 0.25, 0);
      const droneBody = MeshBuilder.CreateIcoSphere('droneBody', { radius: 0.07, subdivisions: 2 }, scene);
      droneBody.material = accentMat;
      addMesh(droneBody, droneN, 0, false);
      createTorus('droneRing', 0.16, 0.007, 20, chromeMat, droneN, 0);
      createSphere('droneLight', 0.035, 8, glowMat, droneN, 0, false);

      const droneWingMat = makeStandard(scene, '#335577', { emissive: '#224466', emissiveIntensity: 0.2, transparent: true, opacity: 0.5 });
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const dw = createBox('droneWing', 0.12, 0.01, 0.03, droneWingMat, droneN, 0, false);
        dw.position.set(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12);
        dw.rotation.y = -a;
      }
      root.metadata = root.metadata || {};
      root.metadata.droneNode = droneN;
      break;
    }
    case 'grapple': {
      const grappleMat = makePBR(scene, accentColor, 0.2, 0.8);
      const grappleG = new TransformNode('grapple', scene);
      grappleG.parent = root;
      grappleG.position.set(0, bodyHeight * 0.45, bodyRadius * 0.9);
      createCylinder('grappleMount', 0.03, 0.04, 0.08, 10, darkMat, grappleG, 0.04);
      createCylinder('grappleArm', 0.02, 0.03, 0.2, 10, grappleMat, grappleG, 0.14);
      grappleG.getChildren()[grappleG.getChildren().length - 1].rotation.x = Math.PI / 3;
      grappleG.getChildren()[grappleG.getChildren().length - 1].position.z = 0.08;
      createSphere('grappleTip', 0.04, 8, frontGlowMat, grappleG, 0.2).position.z = 0.16;
      createTorus('grappleRing', 0.06, 0.008, 10, chromeMat, grappleG, 0.2).position.z = 0.18;
      break;
    }
    case 'wing': {
      const wingMat = makePBR(scene, accentColor, 0.3, 0.5);
      const wingTransMat = makeStandard(scene, '#446688', { emissive: '#224466', emissiveIntensity: 0.15, transparent: true, opacity: 0.6 });
      for (let side = -1; side <= 1; side += 2) {
        const wingG = new TransformNode('wing_' + side, scene);
        wingG.parent = root;
        wingG.position.set(side * bodyRadius * 0.3, bodyHeight * 0.6, -bodyRadius * 0.2);
        wingG.rotation.y = side * Math.PI / 4;

        const mainWing = createBox('mainWing', 0.35, 0.02, 0.15, wingMat, wingG, 0, false);
        mainWing.position.set(side * 0.15, 0, 0);
        createBox('wingTip', 0.12, 0.015, 0.08, wingTransMat, wingG, 0, false).position.set(side * 0.33, 0, 0);
        createSphere('wingLight', 0.025, 6, glowMat, wingG, 0, false).position.set(side * 0.38, 0, 0);
      }
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
  let speed = cfg.base === 'tracks' ? 4.8 : cfg.base === 'wheels' ? 6.5 : cfg.base === 'spider' ? 5.2 : cfg.base === 'ball' ? 5.0 : cfg.base === 'legs' ? 4.5 : cfg.base === 'rotors' ? 5.8 : cfg.base === 'droideka' ? 6.2 : 5.6;
  let turnSpeed = cfg.head === 'sensor' ? 0.075 : cfg.head === 'antenna' ? 0.065 : cfg.head === 'turret' ? 0.055 : cfg.head === 'cyclops' ? 0.058 : cfg.head === 'crown' ? 0.072 : cfg.head === 'tri_eye' ? 0.082 : cfg.head === 'goggle' ? 0.07 : cfg.head === 'halo' ? 0.078 : cfg.head === 'astromech' ? 0.072 : cfg.head === 'protocol' ? 0.065 : 0.068;
  let armor = cfg.body === 'heavy' ? 4 : cfg.body === 'mech' ? 5 : cfg.body === 'standard' ? 3 : cfg.body === 'hover_body' ? 2 : cfg.body === 'insect' ? 4 : cfg.body === 'sphere' ? 3 : cfg.body === 'tank' ? 6 : cfg.body === 'quad' ? 4 : cfg.body === 'astromech_body' ? 3 : cfg.body === 'protocol_body' ? 2 : cfg.body === 'assassin' ? 1 : 2;

  switch (cfg.head) {
    case 'visor': turnSpeed += 0.01; break;
    case 'box': armor += 1; break;
    case 'turret': turnSpeed -= 0.008; armor += 1; break;
    case 'crown': speed += 0.5; break;
    case 'tri_eye': turnSpeed += 0.005; break;
    case 'cyclops': armor += 1; break;
    case 'goggle': turnSpeed += 0.006; break;
    case 'halo': speed += 0.3; break;
    case 'astromech': turnSpeed += 0.008; speed += 0.3; break;
    case 'protocol': armor += 2; speed -= 0.3; break;
  }
  switch (cfg.accessory) {
    case 'arm': armor += 1; break;
    case 'shield': armor += 2; speed -= 0.6; break;
    case 'jetpack': speed += 0.8; armor -= 1; break;
    case 'radar': turnSpeed += 0.012; break;
    case 'cannon': armor += 1; speed -= 0.4; break;
    case 'drone': turnSpeed += 0.008; speed += 0.3; break;
    case 'grapple': turnSpeed += 0.005; armor += 1; break;
    case 'wing': speed += 0.5; turnSpeed += 0.004; break;
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
