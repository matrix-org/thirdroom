import {
  Camera,
  FloatType,
  Layers,
  LinearFilter,
  OrthographicCamera,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  sRGBEncoding,
  Texture,
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
import { RenderQuality } from "./renderer.common";

const QualityMSAA = {
  [RenderQuality.Low]: 1,
  [RenderQuality.Medium]: 4,
  [RenderQuality.High]: 8,
  [RenderQuality.Ultra]: 16,
};

const QualityAnisotropy = {
  [RenderQuality.Low]: 4,
  [RenderQuality.Medium]: 4,
  [RenderQuality.High]: 8,
  [RenderQuality.Ultra]: 16,
};

const QualityDirectionalShadowMapSize = {
  [RenderQuality.Low]: undefined,
  [RenderQuality.Medium]: new Vector2(512, 512),
  [RenderQuality.High]: new Vector2(1024, 1024),
  [RenderQuality.Ultra]: new Vector2(2048, 2048),
};

const QualityShadowMapSize = {
  [RenderQuality.Low]: undefined,
  [RenderQuality.Medium]: new Vector2(512, 512),
  [RenderQuality.High]: new Vector2(512, 512),
  [RenderQuality.Ultra]: new Vector2(1024, 1024),
};

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
  outlineLayers: Layers;
  directionalShadowMapSize?: Vector2;
  shadowMapSize?: Vector2;

  constructor(private renderer: WebGLRenderer, private quality: RenderQuality) {
    const rendererSize = renderer.getSize(new Vector2());

    const target = new WebGLRenderTarget(rendererSize.width, rendererSize.height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      encoding: sRGBEncoding,
      samples: QualityMSAA[quality],
      type: FloatType,
    });

    rendererSize.width / rendererSize.height;

    const scene = new Scene();
    const camera = new Camera();

    this.effectComposer = new EffectComposer(renderer, target);
    this.renderPass = new RenderPass(scene, camera);
    this.outlinePass = new OutlinePass(rendererSize, scene, camera);
    this.bloomPass = new UnrealBloomPass(rendererSize, 0.4, 0.4, 0.9);
    this.bloomPass.renderTargetBright.texture.type = FloatType;

    for (const target of this.bloomPass.renderTargetsHorizontal) {
      target.texture.type = FloatType;
    }

    for (const target of this.bloomPass.renderTargetsVertical) {
      target.texture.type = FloatType;
    }

    this.gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

    this.effectComposer.addPass(this.renderPass);
    this.effectComposer.addPass(this.outlinePass);

    if (this.quality >= RenderQuality.High) {
      this.effectComposer.addPass(this.bloomPass);
    }

    this.effectComposer.addPass(this.gammaCorrectionPass);

    this.outlineLayers = new Layers();
    this.outlineLayers.set(Layer.EditorSelection);

    if (this.quality === RenderQuality.Low) {
      this.renderer.setPixelRatio(0.75);
    } else if (this.quality >= RenderQuality.Medium) {
      this.renderer.setPixelRatio(1);
    }

    // Set the texture anisotropy which improves rendering at extreme angles.
    // Note this uses the GPU's maximum anisotropy with an upper limit of 8. We may want to bump this cap up to 16
    // but we should provide a quality setting for GPUs with a high max anisotropy but limited overall resources.
    Texture.DEFAULT_ANISOTROPY = Math.min(renderer.capabilities.getMaxAnisotropy(), QualityAnisotropy[quality]);

    this.renderer.shadowMap.enabled = quality >= RenderQuality.Medium;
    this.directionalShadowMapSize = QualityDirectionalShadowMapSize[quality];
    this.shadowMapSize = QualityShadowMapSize[quality];
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.effectComposer.setSize(width, height);
  }

  render(scene: Scene, camera: PerspectiveCamera | OrthographicCamera, dt: number) {
    if (this.renderer.xr.isPresenting || this.quality === RenderQuality.Low) {
      this.renderer.render(scene, camera);
    } else {
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
}
