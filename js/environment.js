import * as THREE from 'three';

export function createStarfield(count = 2000, radius = 80) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

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
      colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
    } else if (temp < 0.25) {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7;
    } else {
      colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vSize;
      uniform float time;
      void main() {
        vColor = color;
        vSize = size;
        float twinkle = sin(time * 2.0 + position.x * 0.5 + position.z * 0.3) * 0.3 + 0.7;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * twinkle * (200.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.0, 0.5, d);
        gl_FragColor = vec4(vColor, alpha * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geo, mat);
  return {
    points,
    update(time) {
      mat.uniforms.time.value = time;
    }
  };
}

export function createDustParticles(count = 200, bounds = 30) {
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * bounds;
    positions[i * 3 + 1] = Math.random() * 4 + 0.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * bounds;
    velocities.push({
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.005,
      z: (Math.random() - 0.5) * 0.01
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x8888cc,
    size: 0.06,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geo, mat);

  return {
    points,
    update() {
      const pos = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;
        if (Math.abs(pos[i * 3]) > bounds / 2) velocities[i].x *= -1;
        if (pos[i * 3 + 1] < 0.2 || pos[i * 3 + 1] > 4.2) velocities[i].y *= -1;
        if (Math.abs(pos[i * 3 + 2]) > bounds / 2) velocities[i].z *= -1;
      }
      geo.attributes.position.needsUpdate = true;
    }
  };
}

const explosions = [];
const dustPuffs = [];

export function spawnExplosion(scene, pos, colorHex = 0xffaa44) {
  // 1. PointLight for explosion flash
  const light = new THREE.PointLight(colorHex, 4, 8);
  light.position.copy(pos);
  scene.add(light);

  // 2. Spark particles
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
      y: speed * Math.cos(phi) * 0.5 + 0.08, // lift upward
      z: speed * Math.sin(phi) * Math.sin(theta)
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: colorHex,
    size: 0.16,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // 3. Physical shards/debris
  const shardCount = 6;
  const shards = [];
  const shardGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.7,
    metalness: 0.4
  });

  for (let i = 0; i < shardCount; i++) {
    const shard = new THREE.Mesh(shardGeo, shardMat);
    shard.position.copy(pos);
    shard.castShadow = true;
    shard.receiveShadow = true;
    scene.add(shard);

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.04 + Math.random() * 0.06;
    shards.push({
      mesh: shard,
      vel: new THREE.Vector3(
        Math.cos(angle) * speed,
        0.05 + Math.random() * 0.06,
        Math.sin(angle) * speed
      ),
      rot: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      )
    });
  }

  explosions.push({
    light,
    lightMaxIntensity: 4,
    points,
    geo,
    velocities,
    shards,
    life: 1.0,
    decay: 0.04
  });
}

export function spawnDriftDust(scene, pos, colorHex = 0x8888aa) {
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
      z: (Math.random() - 0.5) * 0.012
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: colorHex,
    size: 0.18,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  dustPuffs.push({
    points,
    geo,
    velocities,
    life: 1.0,
    decay: 0.06
  });
}

export function updateDynamicParticles(scene) {
  // Update explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.life -= exp.decay;

    if (exp.life <= 0) {
      scene.remove(exp.light);
      scene.remove(exp.points);
      exp.geo.dispose();
      exp.points.material.dispose();
      
      for (const s of exp.shards) {
        scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
      }
      explosions.splice(i, 1);
      continue;
    }

    exp.light.intensity = exp.life * exp.lightMaxIntensity;

    const posArr = exp.geo.attributes.position.array;
    const count = posArr.length / 3;
    for (let j = 0; j < count; j++) {
      const vel = exp.velocities[j];
      posArr[j * 3] += vel.x;
      posArr[j * 3 + 1] += vel.y;
      posArr[j * 3 + 2] += vel.z;

      vel.y -= 0.004; // gravity
      vel.x *= 0.97;
      vel.y *= 0.97;
      vel.z *= 0.97;
    }
    exp.geo.attributes.position.needsUpdate = true;
    exp.points.material.opacity = exp.life;

    for (const s of exp.shards) {
      s.mesh.position.add(s.vel);
      s.mesh.rotation.x += s.rot.x;
      s.mesh.rotation.y += s.rot.y;
      s.mesh.rotation.z += s.rot.z;

      s.vel.y -= 0.004; // gravity
      
      // Floor bounce
      if (s.mesh.position.y < 0.06) {
        s.mesh.position.y = 0.06;
        s.vel.y = -s.vel.y * 0.35; // bounce bounce
        s.vel.x *= 0.7;
        s.vel.z *= 0.7;
      }
    }
  }

  // Update dust puffs
  for (let i = dustPuffs.length - 1; i >= 0; i--) {
    const puff = dustPuffs[i];
    puff.life -= puff.decay;

    if (puff.life <= 0) {
      scene.remove(puff.points);
      puff.geo.dispose();
      puff.points.material.dispose();
      dustPuffs.splice(i, 1);
      continue;
    }

    const posArr = puff.geo.attributes.position.array;
    const count = posArr.length / 3;
    for (let j = 0; j < count; j++) {
      const vel = puff.velocities[j];
      posArr[j * 3] += vel.x;
      posArr[j * 3 + 1] += vel.y;
      posArr[j * 3 + 2] += vel.z;
    }
    puff.geo.attributes.position.needsUpdate = true;
    
    puff.points.material.opacity = puff.life * 0.35;
    puff.points.material.size = (1.8 - puff.life) * 0.22;
  }
}

