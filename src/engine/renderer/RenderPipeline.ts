import { Camera, HalfFloatType, Layers, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  OutlineEffect,
  DepthOfFieldEffect,
  VignetteEffect,
} from "postprocessing";

import { Layer } from "../node/node.common";

// TODO: Add samples property to official three types package
declare module "three" {
  interface WebGLRenderTargetOptions {
    samples: number;
  }
}

declare module "postprocessing" {
  interface OutlineEffect {
    scene: Scene;
    camera: Camera;
    depthPass: DepthPass;
  }
}

/**
 * The RenderPipeline class is intended to be just one of a few different options for render pipelines
 * for various platforms. This implementation is only focused on desktops with integrated or dedicated GPUs.
 * Further optimizations may be needed for mobile / VR where additional render passes have a higher perf impact.
 */
export class RenderPipeline {
  effectComposer: EffectComposer;
  outlineLayers: Layers;

  curScene?: Scene;
  curCamera?: Camera;

  outlineEffect?: OutlineEffect;
  bloomEffect?: BloomEffect;

  renderPass?: RenderPass;
  effectPass?: EffectPass;

  constructor(private renderer: WebGLRenderer) {
    this.outlineLayers = new Layers();
    this.outlineLayers.set(Layer.EditorSelection);

    this.effectComposer = new EffectComposer(renderer, {
      frameBufferType: HalfFloatType,
      multisampling: 16,
      updateStyle: false,
    });
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height, false);

    if (this.effectComposer) {
      this.effectComposer.setSize(width, height, false);
    }
  }

  render(scene: Scene, camera: PerspectiveCamera | OrthographicCamera, dt: number) {
    if (this.curScene !== scene || this.curCamera !== camera) {
      this.curScene = scene;
      this.curCamera = camera;

      this.effectComposer.reset();

      const renderPass = new RenderPass(scene, camera);

      this.outlineEffect = new OutlineEffect(scene, camera);
      this.outlineEffect.selection.layer = Layer.OutlineEffect;
      const bloomEffect = new BloomEffect({
        luminanceThreshold: 0.85,
      });
      const depthOfFieldEffect = new DepthOfFieldEffect(camera);
      const vignetteEffect = new VignetteEffect({
        eskil: false,
        offset: 0.35,
        darkness: 0.5,
      });

      const outlinePass = new EffectPass(camera, this.outlineEffect);

      const effectPass = new EffectPass(camera, depthOfFieldEffect, bloomEffect, vignetteEffect);

      this.effectComposer.addPass(renderPass);
      this.effectComposer.addPass(outlinePass);
      this.effectComposer.addPass(effectPass);
    }

    if (this.outlineEffect) {
      const outlineEffect = this.outlineEffect;

      outlineEffect.selection.clear();

      scene.traverse((child) => {
        if (child.layers.test(this.outlineLayers)) {
          outlineEffect.selection.add(child);
        }
      });
    }

    this.effectComposer.render(dt);
  }
}
