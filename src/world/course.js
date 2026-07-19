import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMetallicRoughnessMaterial } from '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { MAP, COLS, ROWS, TILE, W, H, getFloorHeight, getStartPos, getGoalPos } from './maps.js';

const isMobileOrTablet = window.matchMedia('(max-width: 1024px)').matches || window.matchMedia('(hover: none) and (pointer: coarse)').matches;

function hexToColor3(hex) {
  if (typeof hex === 'number') {
    return new Color3(((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255);
  }
  const str = hex.startsWith('#') ? hex : '#' + hex;
  return new Color3(parseInt(str.slice(1, 3), 16) / 255, parseInt(str.slice(3, 5), 16) / 255, parseInt(str.slice(5, 7), 16) / 255);
}

let texturesLoaded = false;
let groundTexColor, groundTexNormal, groundTexRough, groundTexMetal;
let wallTexColor, wallTexNormal, wallTexRough, wallTexAO;
let beaconParts = [];

function disposeTex(t) { if (t) try { t.dispose(); } catch (e) {} }

export function loadTextures(scene) {
  disposeTex(groundTexColor); disposeTex(groundTexNormal); disposeTex(groundTexRough); disposeTex(groundTexMetal);
  disposeTex(wallTexColor); disposeTex(wallTexNormal); disposeTex(wallTexRough); disposeTex(wallTexAO);
  return new Promise(resolve => {
    let loaded = 0;
    const total = 8;
    const check = () => { loaded++; if (loaded >= total) { texturesLoaded = true; resolve(); } };
    const onErr = () => check();

    try {
      groundTexColor = new Texture('assets/textures/metal_plates/MetalPlates001_2K-JPG_Color.jpg', scene);
      groundTexColor.wrapU = groundTexColor.wrapV = Texture.WRAP_ADDRESSMODE;
      groundTexColor.uScale = 2; groundTexColor.vScale = 2;
      groundTexColor.onLoadObservable.addOnce(check);
      groundTexColor.onLoadErrorObservable.addOnce(onErr);
    } catch (e) { onErr(); }

    try {
      groundTexNormal = new Texture('assets/textures/metal_plates/MetalPlates001_2K-JPG_NormalGL.jpg', scene);
      groundTexNormal.wrapU = groundTexNormal.wrapV = Texture.WRAP_ADDRESSMODE;
      groundTexNormal.uScale = 2; groundTexNormal.vScale = 2;
      groundTexNormal.onLoadObservable.addOnce(check);
      groundTexNormal.onLoadErrorObservable.addOnce(onErr);
    } catch (e) { onErr(); }

    try {
      groundTexRough = new Texture('assets/textures/metal_plates/MetalPlates001_2K-JPG_Roughness.jpg', scene);
      groundTexRough.wrapU = groundTexRough.wrapV = Texture.WRAP_ADDRESSMODE;
      groundTexRough.uScale = 2; groundTexRough.vScale = 2;
      groundTexRough.onLoadObservable.addOnce(check);
      groundTexRough.onLoadErrorObservable.addOnce(onErr);
    } catch (e) { onErr(); }

    try {
      groundTexMetal = new Texture('assets/textures/metal_plates/MetalPlates001_2K-JPG_Metalness.jpg', scene);
      groundTexMetal.wrapU = groundTexMetal.wrapV = Texture.WRAP_ADDRESSMODE;
      groundTexMetal.uScale = 2; groundTexMetal.vScale = 2;
      groundTexMetal.onLoadObservable.addOnce(check);
      groundTexMetal.onLoadErrorObservable.addOnce(onErr);
    } catch (e) { onErr(); }

    try {
      wallTexColor = new Texture('assets/textures/sci_fi_panel/Concrete028_2K-JPG_Color.jpg', scene);
      wallTexColor.wrapU = wallTexColor.wrapV = Texture.WRAP_ADDRESSMODE;
      wallTexColor.onLoadObservable.addOnce(check);
      wallTexColor.onLoadErrorObservable.addOnce(onErr);
    } catch (e) { onErr(); }

    try {
      wallTexNormal = new Texture('assets/textures/sci_fi_panel/Concrete028_2K-JPG_NormalGL.jpg', scene);
      wallTexNormal.wrapU = wallTexNormal.wrapV = Texture.WRAP_ADDRESSMODE;
      wallTexNormal.onLoadObservable.addOnce(check);
      wallTexNormal.onLoadErrorObservable.addOnce(onErr);
    } catch (e) { onErr(); }

    try {
      wallTexRough = new Texture('assets/textures/sci_fi_panel/Concrete028_2K-JPG_Roughness.jpg', scene);
      wallTexRough.wrapU = wallTexRough.wrapV = Texture.WRAP_ADDRESSMODE;
      wallTexRough.onLoadObservable.addOnce(check);
      wallTexRough.onLoadErrorObservable.addOnce(onErr);
    } catch (e) { onErr(); }

    try {
      wallTexAO = new Texture('assets/textures/sci_fi_panel/Concrete028_2K-JPG_AmbientOcclusion.jpg', scene);
      wallTexAO.wrapU = wallTexAO.wrapV = Texture.WRAP_ADDRESSMODE;
      wallTexAO.onLoadObservable.addOnce(check);
      wallTexAO.onLoadErrorObservable.addOnce(onErr);
    } catch (e) { onErr(); }
  });
}

function createStreetlight(scene, x, z, colorHex, courseGroup, shadowGen) {
  const col = hexToColor3(colorHex);
  const lightGroup = new TransformNode('streetlight', scene);
  lightGroup.position.set(x, 0, z);

  const poleMat = new PBRMetallicRoughnessMaterial('poleMat', scene);
  poleMat.baseColor = new Color3(0.09, 0.09, 0.09);
  poleMat.roughness = 0.6;
  poleMat.metallic = 0.8;
  const pole = MeshBuilder.CreateCylinder('pole', { diameterTop: 0.06, diameterBottom: 0.1, height: 2.2, tessellation: 8 }, scene);
  pole.material = poleMat;
  pole.position.y = 1.1;
  pole.parent = lightGroup;
  pole.isPickable = false;

  const angleToCenter = Math.atan2(-z, -x);
  const bracket = MeshBuilder.CreateBox('bracket', { width: 0.04, height: 0.04, depth: 0.5 }, scene);
  bracket.material = poleMat;
  bracket.position.set(Math.cos(angleToCenter) * 0.2, 2.15, Math.sin(angleToCenter) * 0.2);
  bracket.rotation.y = -angleToCenter + Math.PI / 2;
  bracket.parent = lightGroup;
  bracket.isPickable = false;

  const bulbMat = new PBRMetallicRoughnessMaterial('bulbMat', scene);
  bulbMat.emissiveColor = col.scale(4);
  bulbMat.roughness = 0.1;
  bulbMat.metallic = 0;
  const bulb = MeshBuilder.CreateSphere('bulb', { diameter: 0.16, segments: 10 }, scene);
  bulb.material = bulbMat;
  bulb.position.set(Math.cos(angleToCenter) * 0.45, 2.1, Math.sin(angleToCenter) * 0.45);
  bulb.parent = lightGroup;
  bulb.isPickable = false;

  const spot = new SpotLight('streetSpot', new Vector3(x + Math.cos(angleToCenter) * 0.45, 2.1, z + Math.sin(angleToCenter) * 0.45), new Vector3(0, -1, 0), Math.PI / 3, 0.5, scene);
  spot.diffuse = col;
  spot.intensity = 8;
  spot.range = 15;
  if (!isMobileOrTablet && shadowGen) {
    spot.shadowEnabled = true;
  } else {
    spot.shadowEnabled = false;
  }

  courseGroup.addChild(lightGroup);
}

export function buildCourse(scene, shadowGen) {
  const course = new TransformNode('course', scene);
  beaconParts = [];

  let groundMat;
  if (texturesLoaded && groundTexColor) {
    groundMat = new PBRMetallicRoughnessMaterial('groundMat', scene);
    groundMat.baseTexture = groundTexColor;
    groundMat.normalTexture = groundTexNormal;
    groundMat.roughnessTexture = groundTexRough;
    if (groundTexMetal) {
      groundMat.metallicTexture = groundTexMetal;
      groundMat.useMetallnessFromMetallicTextureBlue = true;
      groundMat.useRoughnessFromMetallicTextureGreen = false;
      groundMat.useRoughnessFromMetallicTextureAlpha = false;
    }
    groundMat.roughness = 0.85;
    groundMat.metallic = 0.45;
  } else {
    groundMat = new PBRMetallicRoughnessMaterial('groundMat', scene);
    groundMat.baseColor = new Color3(0.06, 0.06, 0.11);
    groundMat.roughness = 0.85;
    groundMat.metallic = 0.45;
  }
  const ground = MeshBuilder.CreateGround('ground', { width: W, height: H }, scene);
  ground.material = groundMat;
  ground.receiveShadows = true;
  ground.isPickable = false;
  ground.parent = course;

  let wallMat;
  if (texturesLoaded && wallTexColor) {
    wallMat = new PBRMetallicRoughnessMaterial('wallMat', scene);
    wallMat.baseTexture = wallTexColor;
    wallMat.normalTexture = wallTexNormal;
    wallMat.roughnessTexture = wallTexRough;
    if (wallTexAO) {
      wallMat.ambientTexture = wallTexAO;
      wallMat.ambientTextureStrength = 0.6;
    }
    wallMat.roughness = 0.8;
    wallMat.metallic = 0.2;
  } else {
    wallMat = new PBRMetallicRoughnessMaterial('wallMat', scene);
    wallMat.baseColor = new Color3(0.16, 0.16, 0.24);
    wallMat.roughness = 0.8;
    wallMat.metallic = 0.2;
  }
  const wallCapMat = new PBRMetallicRoughnessMaterial('wallCapMat', scene);
  wallCapMat.baseColor = new Color3(0.24, 0.24, 0.36);
  wallCapMat.roughness = 0.7;
  wallCapMat.metallic = 0.2;
  const wallStripMat = new PBRMetallicRoughnessMaterial('wallStripMat', scene);
  wallStripMat.emissiveColor = new Color3(0.13, 0.27, 0.67);

  const crateMat = new PBRMetallicRoughnessMaterial('crateMat', scene);
  crateMat.baseColor = new Color3(0.61, 0.48, 0.32);
  crateMat.roughness = 0.8;
  crateMat.metallic = 0.1;
  const crateStripeMat = new PBRMetallicRoughnessMaterial('crateStripeMat', scene);
  crateStripeMat.baseColor = new Color3(0.49, 0.36, 0.21);
  crateStripeMat.roughness = 0.8;
  crateStripeMat.metallic = 0.1;
  const crateCornerMat = new PBRMetallicRoughnessMaterial('crateCornerMat', scene);
  crateCornerMat.baseColor = new Color3(0.2, 0.2, 0.2);
  crateCornerMat.roughness = 0.3;
  crateCornerMat.metallic = 0.8;
  const crateGlowMat = new PBRMetallicRoughnessMaterial('crateGlowMat', scene);
  crateGlowMat.emissiveColor = new Color3(1, 0.67, 0);

  const barrelMat = new PBRMetallicRoughnessMaterial('barrelMat', scene);
  barrelMat.baseColor = new Color3(0.17, 0.24, 0.17);
  barrelMat.roughness = 0.6;
  barrelMat.metallic = 0.4;
  const barrelBandMat = new PBRMetallicRoughnessMaterial('barrelBandMat', scene);
  barrelBandMat.baseColor = new Color3(0.12, 0.17, 0.11);
  barrelBandMat.roughness = 0.7;
  barrelBandMat.metallic = 0.3;
  const barrelRimMat = new PBRMetallicRoughnessMaterial('barrelRimMat', scene);
  barrelRimMat.baseColor = new Color3(0.12, 0.12, 0.12);
  barrelRimMat.roughness = 0.3;
  barrelRimMat.metallic = 0.8;

  const obstacles = [];
  const startPos = getStartPos();
  const goalPos = getGoalPos();

  const crateS = TILE * 0.72;
  const rBarrel = TILE * 0.28;
  const hBarrel = TILE * 0.65;

  const slabMat = new PBRMetallicRoughnessMaterial('slabMat', scene);
  slabMat.baseColor = new Color3(0.12, 0.12, 0.18);
  slabMat.roughness = 0.5;
  slabMat.metallic = 0.4;
  const pillarMat = new PBRMetallicRoughnessMaterial('pillarMat', scene);
  pillarMat.baseColor = new Color3(0.13, 0.13, 0.2);
  pillarMat.roughness = 0.3;
  pillarMat.metallic = 0.7;

  const rampMat = new PBRMetallicRoughnessMaterial('rampMat', scene);
  rampMat.baseColor = new Color3(0.2, 0.2, 0.27);
  rampMat.roughness = 0.6;
  rampMat.metallic = 0.3;
  const railMat = new PBRMetallicRoughnessMaterial('railMat', scene);
  railMat.emissiveColor = new Color3(1, 0.4, 0);

  const stripMat = new PBRMetallicRoughnessMaterial('stripMat', scene);
  stripMat.emissiveColor = new Color3(0.27, 0.53, 0.8);

  function createCrateMesh() {
    const g = new TransformNode('crate', scene);
    const box = MeshBuilder.CreateBox('crateBox', { size: crateS }, scene);
    box.material = crateMat;
    box.position.y = crateS / 2;
    box.parent = g;
    box.isPickable = false;

    const s1 = MeshBuilder.CreateBox('cs1', { width: crateS * 0.06, height: crateS + 0.01, depth: crateS + 0.01 }, scene);
    s1.material = crateStripeMat;
    s1.position.y = crateS / 2;
    s1.parent = g;
    s1.isPickable = false;
    const s2 = MeshBuilder.CreateBox('cs2', { width: crateS + 0.01, height: crateS + 0.01, depth: crateS * 0.06 }, scene);
    s2.material = crateStripeMat;
    s2.position.y = crateS / 2;
    s2.parent = g;
    s2.isPickable = false;

    const cs = 0.08;
    const corners = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dx, dz] of corners) {
      const c = MeshBuilder.CreateBox('corner', { size: cs }, scene);
      c.material = crateCornerMat;
      c.position.set(dx * (crateS / 2 - cs / 2), crateS / 2, dz * (crateS / 2 - cs / 2));
      c.parent = g;
      c.isPickable = false;
    }

    const glow = MeshBuilder.CreateBox('glow', { width: crateS * 0.15, height: crateS * 0.15, depth: crateS * 1.02 }, scene);
    glow.material = crateGlowMat;
    glow.position.y = crateS / 2;
    glow.parent = g;
    glow.isPickable = false;
    return g;
  }

  function createBarrelMesh() {
    const g = new TransformNode('barrel', scene);

  const coreMat = new PBRMetallicRoughnessMaterial('coreMat', scene);
  coreMat.emissiveColor = new Color3(0.2, 0.8, 0.27);
    const plasma = MeshBuilder.CreateCylinder('plasma', { diameter: rBarrel * 1.6, height: hBarrel * 0.95, tessellation: 12 }, scene);
    plasma.material = coreMat;
    plasma.position.y = hBarrel / 2;
    plasma.parent = g;
    plasma.isPickable = false;

    for (let a = 0; a < 4; a++) {
      const angle = (a * Math.PI) / 2;
      const col = MeshBuilder.CreateBox('col', { width: 0.04, height: hBarrel, depth: 0.04 }, scene);
      col.material = barrelMat;
      col.position.set(Math.cos(angle) * (rBarrel + 0.01), hBarrel / 2, Math.sin(angle) * (rBarrel + 0.01));
      col.parent = g;
      col.isPickable = false;
    }

    for (const hFrac of [0.25, 0.5, 0.75]) {
      const band = MeshBuilder.CreateTorus('band', { diameter: rBarrel * 2.1, thickness: 0.04, tessellation: 12 }, scene);
      band.material = barrelBandMat;
      band.position.y = hBarrel * hFrac;
      band.rotation.x = Math.PI / 2;
      band.parent = g;
      band.isPickable = false;
    }

    const topRim = MeshBuilder.CreateTorus('topRim', { diameter: rBarrel * 1.8, thickness: 0.02, tessellation: 12 }, scene);
    topRim.material = barrelRimMat;
    topRim.position.y = hBarrel - 0.01;
    topRim.rotation.x = Math.PI / 2;
    topRim.parent = g;
    topRim.isPickable = false;

    const botRim = MeshBuilder.CreateTorus('botRim', { diameter: rBarrel * 1.8, thickness: 0.02, tessellation: 12 }, scene);
    botRim.material = barrelRimMat;
    botRim.position.y = 0.01;
    botRim.rotation.x = Math.PI / 2;
    botRim.parent = g;
    botRim.isPickable = false;

    return g;
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = MAP[r][c];
      const cx = (c + 0.5) * TILE - W / 2;
      const cz = (r + 0.5) * TILE - H / 2;
      const hw = TILE / 2;

      // Upper platform slabs
      if (v === 5 || v === 9 || v === 6 || v === 7 || v === 8) {
        const slab = MeshBuilder.CreateBox('slab', { width: TILE, height: 0.15, depth: TILE }, scene);
        slab.material = slabMat;
        slab.position.set(cx, 1.425, cz);
        slab.parent = course;
        slab.isPickable = false;
        slab.receiveShadows = true;

        const offsets = [[-TILE / 2 + 0.1, -TILE / 2 + 0.1], [TILE / 2 - 0.1, -TILE / 2 + 0.1], [-TILE / 2 + 0.1, TILE / 2 - 0.1], [TILE / 2 - 0.1, TILE / 2 - 0.1]];
        for (const off of offsets) {
          const pillar = MeshBuilder.CreateCylinder('pillar', { diameter: 0.08, height: 1.35, tessellation: 8 }, scene);
          pillar.material = pillarMat;
          pillar.position.set(cx + off[0], 1.35 / 2, cz + off[1]);
          pillar.parent = course;
          pillar.isPickable = false;
        }
      }

      // Walls
      if (v === 1 || v === 6) {
        const wallGroup = new TransformNode('wallGroup', scene);
        wallGroup.position.set(cx, 0, cz);
        const yOffset = v === 6 ? 1.5 : 0;

        const box = MeshBuilder.CreateBox('wallBox', { width: TILE, height: 2.5, depth: TILE }, scene);
        box.material = wallMat.clone('wallMat_' + r + '_' + c);
        box.position.set(0, yOffset + 1.25, 0);
        box.parent = wallGroup;
        box.receiveShadows = true;

        const cap = MeshBuilder.CreateBox('wallCap', { width: TILE, height: 0.08, depth: TILE }, scene);
        const capMat = wallCapMat.clone('wallCapMat_' + r + '_' + c);
        capMat.alpha = 0;
        cap.material = capMat;
        cap.position.set(0, yOffset + 2.54, 0);
        cap.parent = wallGroup;
        cap.isPickable = false;

        const stripX = MeshBuilder.CreateBox('stripX', { width: TILE + 0.02, height: 0.04, depth: 0.04 }, scene);
        stripX.material = wallStripMat.clone('stripMat_' + r + '_' + c);
        stripX.position.set(0, yOffset + 1.0, hw);
        stripX.parent = wallGroup;
        stripX.isPickable = false;
        const stripX2 = stripX.clone('stripX2');
        stripX2.position.z = -hw;
        stripX2.parent = wallGroup;
        stripX2.isPickable = false;

        course.addChild(wallGroup);
        obstacles.push({ type: 'wall', y: yOffset, x: cx - hw, z: cz - hw, w: TILE, h: TILE, mesh: wallGroup });
      }

      // Crates & Barrels
      if (v === 2 || v === 7) {
        const crateGroup = createCrateMesh();
        crateGroup.position.set(cx, v === 7 ? 1.5 : 0, cz);
        course.addChild(crateGroup);
        obstacles.push({ type: 'crate', y: v === 7 ? 1.5 : 0, x: cx - crateS / 2, z: cz - crateS / 2, w: crateS, h: crateS, mesh: crateGroup, hp: 2, maxHp: 2, gridPos: { r, c } });
      } else if (v === 3 || v === 8) {
        const barrelGroup = createBarrelMesh();
        barrelGroup.position.set(cx, v === 8 ? 1.5 : 0, cz);
        course.addChild(barrelGroup);
        obstacles.push({ type: 'barrel', y: v === 8 ? 1.5 : 0, x: cx, z: cz, r: rBarrel, mesh: barrelGroup, hp: 1, maxHp: 1, gridPos: { r, c } });
      }

      // Ramps
      if (v === 'RU' || v === 'RD' || v === 'RL' || v === 'RR') {
        const rampGroup = new TransformNode('ramp', scene);
        rampGroup.position.set(cx, 0.75, cz);

        if (v === 'RU' || v === 'RD') {
          const L = Math.sqrt(TILE * TILE + 1.5 * 1.5);
          const theta = Math.atan2(1.5, TILE);
          const ramp = MeshBuilder.CreateBox('rampBox', { width: TILE, height: 0.08, depth: L }, scene);
          ramp.material = rampMat;
          ramp.parent = rampGroup;
          ramp.receiveShadows = true;
          ramp.isPickable = false;
          rampGroup.rotation.x = (v === 'RU') ? -theta : theta;

          const halfT = TILE / 2;
          const inset = 0.14;
          const railY = 0.54;
          const postY = 0.29;
          for (const side of [-1, 1]) {
            const sx = side * (halfT - inset);
            for (const zPos of [-L / 2 + 0.15, 0, L / 2 - 0.15]) {
              const post = MeshBuilder.CreateCylinder('post', { diameter: 0.08, height: 0.5, tessellation: 8 }, scene);
              post.material = railMat;
              post.position.set(sx, postY, zPos);
              post.parent = rampGroup;
              post.isPickable = false;
            }
            const railBar = MeshBuilder.CreateBox('railBar', { width: TILE * 0.92, height: 0.04, depth: 0.04 }, scene);
            railBar.material = railMat;
            railBar.position.set(sx, railY, 0);
            railBar.parent = rampGroup;
            railBar.isPickable = false;
          }
        } else {
          const L = Math.sqrt(TILE * TILE + 1.5 * 1.5);
          const theta = Math.atan2(1.5, TILE);
          const ramp = MeshBuilder.CreateBox('rampBox', { width: L, height: 0.08, depth: TILE }, scene);
          ramp.material = rampMat;
          ramp.parent = rampGroup;
          ramp.receiveShadows = true;
          ramp.isPickable = false;
          rampGroup.rotation.z = (v === 'RL') ? -theta : theta;

          const halfT = TILE / 2;
          const inset = 0.14;
          const railY = 0.54;
          const postY = 0.29;
          for (const side of [-1, 1]) {
            const sz = side * (halfT - inset);
            for (const xPos of [-L / 2 + 0.15, 0, L / 2 - 0.15]) {
              const post = MeshBuilder.CreateCylinder('post', { diameter: 0.08, height: 0.5, tessellation: 8 }, scene);
              post.material = railMat;
              post.position.set(xPos, postY, sz);
              post.parent = rampGroup;
              post.isPickable = false;
            }
            const railBar = MeshBuilder.CreateBox('railBar', { width: 0.04, height: 0.04, depth: TILE * 0.92 }, scene);
            railBar.material = railMat;
            railBar.position.set(0, railY, sz);
            railBar.parent = rampGroup;
            railBar.isPickable = false;
          }
        }
        course.addChild(rampGroup);
      }
    }
  }

  // Edge strips
  const edgeMat = new PBRMetallicRoughnessMaterial('edgeMat', scene);
  edgeMat.emissiveColor = new Color3(0.27, 0.53, 0.8);
  const edgePositions = [
    { x: 0, z: -H / 2 + 0.02, ry: 0 },
    { x: 0, z: H / 2 - 0.02, ry: 0 },
    { x: -W / 2 + 0.02, z: 0, ry: Math.PI / 2 },
    { x: W / 2 - 0.02, z: 0, ry: Math.PI / 2 },
  ];
  for (const ep of edgePositions) {
    const strip = MeshBuilder.CreateBox('edgeStrip', { width: W, height: 0.06, depth: 0.04 }, scene);
    strip.material = edgeMat;
    strip.position.set(ep.x, 0.03, ep.z);
    strip.rotation.y = ep.ry;
    strip.parent = course;
    strip.isPickable = false;
  }

  // Streetlights
  const neonColors = [0x00ffff, 0xff00ff, 0x9900ff, 0xffaa00];
  const corners = [
    [-W / 2 + 0.8, -H / 2 + 0.8],
    [W / 2 - 0.8, -H / 2 + 0.8],
    [-W / 2 + 0.8, H / 2 - 0.8],
    [W / 2 - 0.8, H / 2 - 0.8],
  ];
  for (let i = 0; i < 4; i++) {
    createStreetlight(scene, corners[i][0], corners[i][1], neonColors[i], course, shadowGen);
  }

  // Beacon
  const beaconY = goalPos.y || 0;
  const beaconBaseMat = new PBRMetallicRoughnessMaterial('beaconBaseMat', scene);
  beaconBaseMat.emissiveColor = hexToColor3(0xe94560).scale(0.6);
  const beacon = MeshBuilder.CreateCylinder('beacon', { diameter: 1, height: 0.14, tessellation: 16 }, scene);
  beacon.material = beaconBaseMat;
  beacon.position.set(goalPos.x, beaconY + 0.07, goalPos.z);
  beacon.parent = course;
  beacon.isPickable = false;
  beaconParts.push(beacon);

  const beaconRingMat = new PBRMetallicRoughnessMaterial('beaconRingMat', scene);
  beaconRingMat.emissiveColor = hexToColor3(0xe94560).scale(0.8);
  beaconRingMat.alpha = 0.6;
  const beaconRing = MeshBuilder.CreateTorus('beaconRing', { diameter: 1.1, thickness: 0.025, tessellation: 24 }, scene);
  beaconRing.material = beaconRingMat;
  beaconRing.position.set(goalPos.x, beaconY + 0.1, goalPos.z);
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.parent = course;
  beaconRing.isPickable = false;
  beaconParts.push(beaconRing);

  const poleMat = new PBRMetallicRoughnessMaterial('beaconPoleMat', scene);
  poleMat.baseColor = new Color3(0.6, 0.6, 0.6);
  poleMat.roughness = 0.2;
  poleMat.metallic = 0.9;
  const beaconPole = MeshBuilder.CreateCylinder('beaconPole', { diameter: 0.04, height: 1.4, tessellation: 8 }, scene);
  beaconPole.material = poleMat;
  beaconPole.position.set(goalPos.x, beaconY + 0.7, goalPos.z);
  beaconPole.parent = course;
  beaconPole.isPickable = false;

  const beaconTopMat = new PBRMetallicRoughnessMaterial('beaconTopMat', scene);
  beaconTopMat.emissiveColor = hexToColor3(0xff3366).scale(1.2);
  const beaconTop = MeshBuilder.CreateSphere('beaconTop', { diameter: 0.24, segments: 12 }, scene);
  beaconTop.material = beaconTopMat;
  beaconTop.position.set(goalPos.x, beaconY + 1.4, goalPos.z);
  beaconTop.parent = course;
  beaconTop.isPickable = false;
  beaconParts.push(beaconTop);

  const beamMat = new PBRMetallicRoughnessMaterial('beamMat', scene);
  beamMat.emissiveColor = hexToColor3(0xe94560).scale(0.6);
  beamMat.alpha = 0.22;
  const beam = MeshBuilder.CreateCylinder('beam', { diameterTop: 0.08, diameterBottom: 0.44, height: 3.5, tessellation: 12, sideOrientation: 2 }, scene);
  beam.material = beamMat;
  beam.position.set(goalPos.x, beaconY + 3.15, goalPos.z);
  beam.parent = course;
  beam.isPickable = false;
  beaconParts.push(beam);

  const ring1Mat = new PBRMetallicRoughnessMaterial('ring1Mat', scene);
  ring1Mat.emissiveColor = hexToColor3(0xff3388).scale(1);
  const ring1 = MeshBuilder.CreateTorus('portalRing1', { diameter: 0.7, thickness: 0.015, tessellation: 16 }, scene);
  ring1.material = ring1Mat;
  ring1.position.set(goalPos.x, beaconY + 0.7, goalPos.z);
  ring1.parent = course;
  ring1.isPickable = false;
  beaconParts.push(ring1);

  const ring2 = MeshBuilder.CreateTorus('portalRing2', { diameter: 0.56, thickness: 0.012, tessellation: 16 }, scene);
  ring2.material = ring1Mat;
  ring2.position.set(goalPos.x, beaconY + 0.7, goalPos.z);
  ring2.parent = course;
  ring2.isPickable = false;
  beaconParts.push(ring2);

  return { obstacles, startPos, goalPos, courseGroup: course, beaconParts };
}

export function updateBeacon(time) {
  if (!beaconParts.length) return;
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;
  if (beaconParts[0]) beaconParts[0].material.emissiveColor = hexToColor3(0xe94560).scale(0.5 + pulse * 0.5);
  if (beaconParts[1]) {
    beaconParts[1].scaling.set(1 + pulse * 0.15, 1 + pulse * 0.15, 1);
    beaconParts[1].material.alpha = 0.3 + pulse * 0.4;
  }
  if (beaconParts[2]) beaconParts[2].material.emissiveColor = hexToColor3(0xff3366).scale(0.8 + pulse * 0.8);
  if (beaconParts[3]) beaconParts[3].material.alpha = 0.1 + pulse * 0.15;
  if (beaconParts[4]) {
    beaconParts[4].rotation.y = time * 2.0;
    beaconParts[4].rotation.x = time * 0.5;
  }
  if (beaconParts[5]) {
    beaconParts[5].rotation.y = time * -1.5;
    beaconParts[5].rotation.z = time * 0.8;
  }
}
