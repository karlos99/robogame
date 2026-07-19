import '@babylonjs/core/Engines/engine';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial';
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Meshes/meshSimplification';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Rendering/geometryBufferRendererSceneComponent';
import '@babylonjs/core/Rendering/IBLShadows/iblShadowsRenderPipeline';
import '@babylonjs/core/Rendering/GlobalIllumination/giRSMManager';

import { App } from './app.js';

document.addEventListener('DOMContentLoaded', () => App.init());
