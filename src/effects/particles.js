import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { GPUParticleSystem } from '@babylonjs/core/Particles/gpuParticleSystem';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { PointLight } from '@babylonjs/core/Lights/pointLight';

export function createStarfield(scene, count = 2000, radius = 80) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.5 + Math.random() * 0.5);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 5;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.5 + Math.random() * 1.5;

    const temp = Math.random();
    if (temp < 0.15) {
      colors[i * 4] = 0.7; colors[i * 4 + 1] = 0.8; colors[i * 4 + 2] = 1.0;
    } else if (temp < 0.25) {
      colors[i * 4] = 1.0; colors[i * 4 + 1] = 0.9; colors[i * 4 + 2] = 0.7;
    } else {
      colors[i * 4] = 0.9; colors[i * 4 + 1] = 0.9; colors[i * 4 + 2] = 1.0;
    }
    colors[i * 4 + 3] = 0.8;
  }

  const customMesh = new AbstractMesh('starfield', scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.colors = colors;
  vertexData.applyToMesh(customMesh);

  const mat = new StandardMaterial('starMat', scene);
  mat.disableLighting = true;
  mat.emissiveColor = new Color3(1, 1, 1);
  mat.pointsCloud = true;
  mat.pointSize = 2.0;
  mat.useAlphaFromDiffuseTexture = false;
  mat.alpha = 0.8;
  mat.backFaceCulling = false;

  customMesh.material = mat;
  customMesh.isPickable = false;
  customMesh.isVisible = true;

  return {
    mesh: customMesh,
    update(time) {
      const colorsArr = customMesh.getVerticesData('color');
      if (!colorsArr) return;
      for (let i = 0; i < count; i++) {
        const twinkle = Math.sin(time * 2.0 + positions[i * 3] * 0.5 + positions[i * 3 + 2] * 0.3) * 0.3 + 0.7;
        colorsArr[i * 4 + 3] = twinkle * 0.8;
      }
      customMesh.updateVerticesData('color', colorsArr);
    },
  };
}

export function createDustParticles(scene, count = 200, bounds = 30) {
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * bounds;
    positions[i * 3 + 1] = Math.random() * 4 + 0.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * bounds;
    velocities.push({
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.005,
      z: (Math.random() - 0.5) * 0.01,
    });
  }

  const customMesh = new AbstractMesh('dust', scene);
  const vertexData = new VertexData();
  const colors = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    colors[i * 4] = 0.53; colors[i * 4 + 1] = 0.53; colors[i * 4 + 2] = 0.8;
    colors[i * 4 + 3] = 0.3;
  }
  vertexData.positions = positions;
  vertexData.colors = colors;
  vertexData.applyToMesh(customMesh);

  const mat = new StandardMaterial('dustMat', scene);
  mat.disableLighting = true;
  mat.emissiveColor = new Color3(0.53, 0.53, 0.8);
  mat.pointsCloud = true;
  mat.pointSize = 1.5;
  mat.backFaceCulling = false;
  mat.alpha = 0.3;

  customMesh.material = mat;
  customMesh.isPickable = false;

  return {
    mesh: customMesh,
    update() {
      const posArr = customMesh.getVerticesData('position');
      if (!posArr) return;
      for (let i = 0; i < count; i++) {
        posArr[i * 3] += velocities[i].x;
        posArr[i * 3 + 1] += velocities[i].y;
        posArr[i * 3 + 2] += velocities[i].z;
        if (Math.abs(posArr[i * 3]) > bounds / 2) velocities[i].x *= -1;
        if (posArr[i * 3 + 1] < 0.2 || posArr[i * 3 + 1] > 4.2) velocities[i].y *= -1;
        if (Math.abs(posArr[i * 3 + 2]) > bounds / 2) velocities[i].z *= -1;
      }
      customMesh.updateVerticesData('position', posArr);
    },
  };
}

const explosions = [];
const dustPuffs = [];

function hexToColor3(hex) {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  return new Color3(r, g, b);
}

export function spawnExplosion(scene, pos, colorHex = 0xffaa44) {
  const col = hexToColor3(colorHex);

  const pointLight = new PointLight('explosionLight', new Vector3(pos.x, pos.y, pos.z), scene);
  pointLight.diffuse = col;
  pointLight.intensity = 4;
  pointLight.range = 8;

  const count = 25;
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y + 0.1;
    positions[i * 3 + 2] = pos.z;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 0.06 + Math.random() * 0.1;
    velocities.push({
      x: speed * Math.sin(phi) * Math.cos(theta),
      y: speed * Math.cos(phi) * 0.5 + 0.08,
      z: speed * Math.sin(phi) * Math.sin(theta),
    });
  }

  const sparkMesh = new AbstractMesh('sparks', scene);
  const sparkColors = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    sparkColors[i * 4] = col.r;
    sparkColors[i * 4 + 1] = col.g;
    sparkColors[i * 4 + 2] = col.b;
    sparkColors[i * 4 + 3] = 1.0;
  }
  const vd = new VertexData();
  vd.positions = positions;
  vd.colors = sparkColors;
  vd.applyToMesh(sparkMesh);
  const sparkMat = new StandardMaterial('sparkMat', scene);
  sparkMat.disableLighting = true;
  sparkMat.emissiveColor = col;
  sparkMat.pointsCloud = true;
  sparkMat.pointSize = 4;
  sparkMat.backFaceCulling = false;
  sparkMesh.material = sparkMat;
  sparkMesh.isPickable = false;

  const shardCount = 6;
  const shards = [];
  for (let i = 0; i < shardCount; i++) {
    const shard = MeshBuilder.CreateBox('shard', { size: 0.12 }, scene);
    shard.position = new Vector3(pos.x, pos.y, pos.z);
    const sm = new StandardMaterial('shardMat', scene);
    sm.diffuseColor = new Color3(0.27, 0.27, 0.27);
    sm.roughness = 0.7;
    sm.metallic = 0.4;
    shard.material = sm;
    shard.isPickable = false;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.04 + Math.random() * 0.06;
    shards.push({
      mesh: shard,
      vel: new Vector3(Math.cos(angle) * speed, 0.05 + Math.random() * 0.06, Math.sin(angle) * speed),
      rot: new Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2),
    });
  }

  explosions.push({
    light: pointLight,
    lightMaxIntensity: 4,
    sparkMesh,
    sparkColors,
    velocities,
    shards,
    life: 1.0,
    decay: 0.04,
  });
}

export function spawnDriftDust(scene, pos, colorHex = 0x8888aa) {
  const col = hexToColor3(colorHex);
  const count = 3;
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.2;
    positions[i * 3 + 1] = pos.y + 0.05;
    positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.2;
    velocities.push({
      x: (Math.random() - 0.5) * 0.012,
      y: Math.random() * 0.008 + 0.004,
      z: (Math.random() - 0.5) * 0.012,
    });
  }

  const puffMesh = new AbstractMesh('puff', scene);
  const puffColors = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    puffColors[i * 4] = col.r;
    puffColors[i * 4 + 1] = col.g;
    puffColors[i * 4 + 2] = col.b;
    puffColors[i * 4 + 3] = 0.35;
  }
  const vd = new VertexData();
  vd.positions = positions;
  vd.colors = puffColors;
  vd.applyToMesh(puffMesh);
  const puffMat = new StandardMaterial('puffMat', scene);
  puffMat.disableLighting = true;
  puffMat.emissiveColor = col;
  puffMat.pointsCloud = true;
  puffMat.pointSize = 4;
  puffMat.backFaceCulling = false;
  puffMat.alpha = 0.35;
  puffMesh.material = puffMat;
  puffMesh.isPickable = false;

  dustPuffs.push({
    mesh: puffMesh,
    colors: puffColors,
    velocities,
    life: 1.0,
    decay: 0.06,
  });
}

export function updateDynamicParticles(scene) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.life -= exp.decay;

    if (exp.life <= 0) {
      if (exp.light) exp.light.dispose();
      exp.sparkMesh.dispose();
      for (const s of exp.shards) s.mesh.dispose();
      explosions.splice(i, 1);
      continue;
    }

    if (exp.light) exp.light.intensity = exp.life * exp.lightMaxIntensity;

    const posArr = exp.sparkMesh.getVerticesData('position');
    if (posArr) {
      const count = posArr.length / 3;
      for (let j = 0; j < count; j++) {
        const vel = exp.velocities[j];
        posArr[j * 3] += vel.x;
        posArr[j * 3 + 1] += vel.y;
        posArr[j * 3 + 2] += vel.z;
        vel.y -= 0.004;
        vel.x *= 0.97;
        vel.y *= 0.97;
        vel.z *= 0.97;
      }
      exp.sparkMesh.updateVerticesData('position', posArr);
    }

    const colArr = exp.sparkMesh.getVerticesData('color');
    if (colArr) {
      const count = colArr.length / 4;
      for (let j = 0; j < count; j++) {
        colArr[j * 4 + 3] = exp.life;
      }
      exp.sparkMesh.updateVerticesData('color', colArr);
    }

    for (const s of exp.shards) {
      s.mesh.position.addInPlace(s.vel);
      s.mesh.rotation.x += s.rot.x;
      s.mesh.rotation.y += s.rot.y;
      s.mesh.rotation.z += s.rot.z;
      s.vel.y -= 0.004;
      if (s.mesh.position.y < 0.06) {
        s.mesh.position.y = 0.06;
        s.vel.y = -s.vel.y * 0.35;
        s.vel.x *= 0.7;
        s.vel.z *= 0.7;
      }
    }
  }

  for (let i = dustPuffs.length - 1; i >= 0; i--) {
    const puff = dustPuffs[i];
    puff.life -= puff.decay;

    if (puff.life <= 0) {
      puff.mesh.dispose();
      dustPuffs.splice(i, 1);
      continue;
    }

    const posArr = puff.mesh.getVerticesData('position');
    if (posArr) {
      const count = posArr.length / 3;
      for (let j = 0; j < count; j++) {
        posArr[j * 3] += puff.velocities[j].x;
        posArr[j * 3 + 1] += puff.velocities[j].y;
        posArr[j * 3 + 2] += puff.velocities[j].z;
      }
      puff.mesh.updateVerticesData('position', posArr);
    }

    const colArr = puff.mesh.getVerticesData('color');
    if (colArr) {
      const count = colArr.length / 4;
      for (let j = 0; j < count; j++) {
        colArr[j * 4 + 3] = puff.life * 0.35;
      }
      puff.mesh.updateVerticesData('color', colArr);
    }
  }
}

export function disposeEnvironment() {
  for (const e of explosions) {
    if (e.light) e.light.dispose();
    e.sparkMesh.dispose();
    for (const s of e.shards) s.mesh.dispose();
  }
  explosions.length = 0;
  for (const p of dustPuffs) {
    p.mesh.dispose();
  }
  dustPuffs.length = 0;
}
