import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PBRMetallicRoughnessMaterial } from '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial';
import { Color3 } from '@babylonjs/core/Maths/math';

// Preset models (place .glb files in public/assets/models/)
const MODEL_PRESETS = [
  { name: 'Scout Mech',    file: 'mech_scout.glb',    scale: 0.8,  desc: 'Light recon mech' },
  { name: 'Heavy Assault', file: 'mech_assault.glb',  scale: 0.85, desc: 'Heavy combat mech' },
  { name: 'Speeder Bot',   file: 'bot_speeder.glb',   scale: 0.7,  desc: 'Fast pursuit bot' },
  { name: 'Cargo Drone',   file: 'drone_cargo.glb',   scale: 0.75, desc: 'Utility cargo drone' },
];

let lastLoadedModel = null;

export function getModelPresets() {
  return MODEL_PRESETS;
}

export async function loadPresetModel(preset, scene) {
  const filePath = 'assets/models/' + preset.file;
  return loadModelFromPath(filePath, scene, preset.scale);
}

export async function loadModelFromPath(filePath, scene, scale = 1.0) {
  if (lastLoadedModel) {
    lastLoadedModel.dispose();
    lastLoadedModel = null;
  }

  try {
    const result = await SceneLoader.ImportMeshAsync('', '/', filePath, scene);
    const rootNode = new TransformNode('importedModel', scene);

    result.meshes.forEach((mesh, i) => {
      mesh.parent = rootNode;
      mesh.isPickable = false;
      mesh.receiveShadows = true;
      if (mesh.material) {
        mesh.material.backFaceCulling = true;
      }
    });

    rootNode.scaling.setAll(scale);
    lastLoadedModel = rootNode;
    return rootNode;
  } catch (err) {
    console.warn('Model load failed, falling back to procedural build:', err.message);
    return null;
  }
}

export function tintModelColors(modelRoot, bodyColor, headColor, accentColor) {
  if (!modelRoot) return;
  const hexToC3 = (hex) => {
    if (typeof hex === 'number') return new Color3(((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255);
    const str = hex.startsWith('#') ? hex : '#' + hex;
    return new Color3(parseInt(str.slice(1, 3), 16) / 255, parseInt(str.slice(3, 5), 16) / 255, parseInt(str.slice(5, 7), 16) / 255);
  };

  modelRoot.getChildMeshes().forEach((mesh, i) => {
    if (mesh.material && mesh.material instanceof PBRMetallicRoughnessMaterial) {
      const mat = mesh.material;
      if (!mat._origColor) mat._origColor = mat.baseColor.clone();
      const orig = mat._origColor;
      if (i % 3 === 0) {
        mat.baseColor = Color3.Lerp(orig, hexToC3(bodyColor), 0.35);
      } else if (i % 3 === 1) {
        mat.baseColor = Color3.Lerp(orig, hexToC3(headColor), 0.35);
      } else {
        mat.baseColor = Color3.Lerp(orig, hexToC3(accentColor), 0.25);
      }
    }
  });
}

export function disposeImportedModel() {
  if (lastLoadedModel) {
    lastLoadedModel.dispose();
    lastLoadedModel = null;
  }
}
