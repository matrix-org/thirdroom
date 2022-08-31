import {
  Camera,
  Layers,
  LinearFilter,
  OrthographicCamera,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  sRGBEncoding,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader";

import { Layer } from "../node/node.common";
import { SMAAPass } from "./SMAAPass";

/**
 * The RenderPipeline class is intended to be just one of a few different options for render pipelines
 * for various platforms. This implementation is only focused on desktops with integrated or dedicated GPUs.
 * Further optimizations may be needed for mobile / VR where additional render passes have a higher perf impact.
 */
export class RenderPipeline {
  effectComposer: EffectComposer;
  renderPass: RenderPass;
  outlinePass: OutlinePass;
  bloomPass: UnrealBloomPass;
  gammaCorrectionPass: ShaderPass;
  smaaPass: SMAAPass;
  outlineLayers: Layers;

  constructor(private renderer: WebGLRenderer) {
    const rendererSize = renderer.getSize(new Vector2());

    const target = new WebGLRenderTarget(rendererSize.width, rendererSize.height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      encoding: sRGBEncoding,
    });

    const scene = new Scene();
    const camera = new Camera();

    this.effectComposer = new EffectComposer(renderer, target);
    this.renderPass = new RenderPass(scene, camera);
    this.outlinePass = new OutlinePass(rendererSize, scene, camera);
    this.bloomPass = new UnrealBloomPass(rendererSize, 0.5, 0.4, 0.9);
    this.gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    this.smaaPass = new SMAAPass(rendererSize.width, rendererSize.height);

    this.effectComposer.addPass(this.renderPass);
    this.effectComposer.addPass(this.outlinePass);
    this.effectComposer.addPass(this.bloomPass);
    this.effectComposer.addPass(this.gammaCorrectionPass);
    this.effectComposer.addPass(this.smaaPass);

    this.outlineLayers = new Layers();
    this.outlineLayers.set(Layer.EditorSelection);
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.effectComposer.setSize(width, height);
  }

  render(scene: Scene, camera: PerspectiveCamera | OrthographicCamera, dt: number) {
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;
    this.outlinePass.renderScene = scene;
    this.outlinePass.renderCamera = camera;

    this.outlinePass.selectedObjects.length = 0;

    scene.traverse((child) => {
      if (child.layers.test(this.outlineLayers)) {
        this.outlinePass.selectedObjects.push(child);
      }
    });

    this.effectComposer.render(dt);
  }
}
