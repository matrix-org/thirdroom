import {
  Color,
  DepthTexture,
  DoubleSide,
  LinearFilter,
  MeshDepthMaterial,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  RGBADepthPacking,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  sRGBEncoding,
  Texture,
  UniformsUtils,
  UnsignedShortType,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";

import { addLayer, Layer } from "../node/node.common";

class EdgeDetectionPass {
  public clearColor: Color = new Color(0x000000);
  public clearAlpha = 0;
  private fullScreenQuad: FullScreenQuad;
  private texSize: Vector2 = new Vector2();
  private renderTarget: WebGLRenderTarget;
  private downsampleRatio = 2;

  constructor(texture: Texture, mainDepthTexture: DepthTexture, width: number, height: number) {
    this.renderTarget = new WebGLRenderTarget(width / this.downsampleRatio, height / this.downsampleRatio);

    const material = new ShaderMaterial({
      uniforms: {
        depthTexture: { value: texture },
        mainDepthTexture: { value: mainDepthTexture },
        texSize: { value: this.texSize },
        visibleEdgeColor: { value: new Vector3(1.0, 0, 0) },
        hiddenEdgeColor: { value: new Vector3(1.0, 1.0, 1.0) },
        downsampleRatio: { value: this.downsampleRatio },
      },

      vertexShader: `varying vec2 vUv;

				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,

      fragmentShader: `#include <packing>
        varying vec2 vUv;

				uniform sampler2D depthTexture;
        uniform sampler2D mainDepthTexture;
				uniform vec2 texSize;
				uniform vec3 visibleEdgeColor;
				uniform vec3 hiddenEdgeColor;
        uniform float downsampleRatio;

				void main() {
					vec2 invSize = 1.0 / texSize;
					vec4 uvOffset = vec4(1.0, 0.0, 0.0, 1.0) * vec4(invSize, invSize);

					float d1 = unpackRGBAToDepth(texture2D(depthTexture, vUv + uvOffset.xy));
					float d2 = unpackRGBAToDepth(texture2D(depthTexture, vUv - uvOffset.xy));
					float d3 = unpackRGBAToDepth(texture2D(depthTexture, vUv + uvOffset.yw));
					float d4 = unpackRGBAToDepth(texture2D(depthTexture, vUv - uvOffset.yw));
          
          float m1 = d1 > 0.0 ? 1.0 : 0.0;
          float m2 = d2 > 0.0 ? 1.0 : 0.0;
          float m3 = d3 > 0.0 ? 1.0 : 0.0;
          float m4 = d4 > 0.0 ? 1.0 : 0.0;

          float md1 = texture2D(mainDepthTexture, vUv + (uvOffset.xy * vec2(downsampleRatio))).r;
					float md2 = texture2D(mainDepthTexture, vUv - (uvOffset.xy * vec2(downsampleRatio))).r;
					float md3 = texture2D(mainDepthTexture, vUv + (uvOffset.yw * vec2(downsampleRatio))).r;
					float md4 = texture2D(mainDepthTexture, vUv - (uvOffset.yw * vec2(downsampleRatio))).r;

          float v1 = d1 < md1 ? 1.0 : 0.0;
          float v2 = d2 < md2 ? 1.0 : 0.0;
          float v3 = d3 < md3 ? 1.0 : 0.0;
          float v4 = d4 < md4 ? 1.0 : 0.0;
          
          vec4 mainDepth = texture2D(mainDepthTexture, vUv);
					float diff1 = (m1 - m2) * 0.5;
					float diff2 = (m3 - m4) * 0.5;
					float d = length(vec2(diff1, diff2));
					float a1 = min(v1, v2);
					float a2 = min(v3, v4);
					float visibilityFactor = min(a1, a2);
					vec3 edgeColor = 1.0 - visibilityFactor > 0.001 ? visibleEdgeColor : hiddenEdgeColor;
					gl_FragColor = vec4(visibleEdgeColor, 1.0) * vec4(d);
				}`,
    });

    this.fullScreenQuad = new FullScreenQuad(material);
  }

  get texture() {
    return this.renderTarget.texture;
  }

  setSize(width: number, height: number) {
    this.renderTarget.setSize(width / this.downsampleRatio, height / this.downsampleRatio);
    this.texSize.set(width / this.downsampleRatio, height / this.downsampleRatio);
  }

  render(renderer: WebGLRenderer) {
    renderer.setRenderTarget(this.renderTarget);
    renderer.setClearColor(this.clearColor, this.clearAlpha);
    renderer.clear(true, true, false);
    this.fullScreenQuad.render(renderer);
  }
}

class CombinePass {
  public clearColor: Color = new Color(0x000000);
  public clearAlpha = 0;
  private fullScreenQuad: FullScreenQuad;

  constructor(edgeTexture: Texture, mainTexture: Texture) {
    const material = new ShaderMaterial({
      uniforms: {
        edgeTexture: { value: edgeTexture },
        mainTexture: { value: mainTexture },
      },
      vertexShader: `varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }`,
      fragmentShader: `varying vec2 vUv;
        uniform sampler2D mainTexture;
				uniform sampler2D edgeTexture;

        void main() {
          vec4 mainColor = texture2D(mainTexture, vUv);
					vec4 edgeColor = texture2D(edgeTexture, vUv);
          gl_FragColor = LinearTosRGB(mainColor + edgeColor);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });

    this.fullScreenQuad = new FullScreenQuad(material);
  }

  render(renderer: WebGLRenderer) {
    renderer.setRenderTarget(null);
    renderer.setClearColor(this.clearColor, this.clearAlpha);
    renderer.clear(true, true, false);
    this.fullScreenQuad.render(renderer);
  }
}

class TexturePass {
  public clearColor: Color = new Color(0x000000);
  public clearAlpha = 0;
  private fullScreenQuad: FullScreenQuad;

  constructor(texture: Texture) {
    const uniforms = UniformsUtils.clone(CopyShader.uniforms);

    uniforms.tDiffuse.value = texture;

    const material = new ShaderMaterial({
      uniforms,
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    this.fullScreenQuad = new FullScreenQuad(material);
  }

  render(renderer: WebGLRenderer, renderTarget: WebGLRenderTarget | null) {
    renderer.setRenderTarget(renderTarget);
    renderer.setClearColor(this.clearColor, this.clearAlpha);
    renderer.clear(true, true, false);
    this.fullScreenQuad.render(renderer);
  }
}

/**
 * The RenderPipeline class is intended to be just one of a few different options for render pipelines
 * for various platforms. This implementation is only focused on desktops with integrated or dedicated GPUs.
 * Further optimizations may be needed for mobile / VR where additional render passes have a higher perf impact.
 */
export class RenderPipeline {
  public clearColor: Color = new Color(0x000000);
  public clearAlpha = 0;

  private selectionDepthMaterial: MeshDepthMaterial;
  private depthClearColor: Color = new Color(0x000000);
  private depthClearAlpha = 0;
  private selectionDepthRenderTarget: WebGLRenderTarget;

  private mainDepthTexture: DepthTexture;
  private mainRenderTarget: WebGLRenderTarget;

  private edgeDetectionPass: EdgeDetectionPass;
  private combinePass: CombinePass;
  private outputPass: TexturePass;

  constructor(private renderer: WebGLRenderer) {
    const rendererSize = renderer.getSize(new Vector2());

    this.selectionDepthMaterial = new MeshDepthMaterial({
      depthPacking: RGBADepthPacking,
      blending: NoBlending,
      side: DoubleSide,
    });

    this.selectionDepthRenderTarget = new WebGLRenderTarget(rendererSize.width, rendererSize.height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
    });

    this.mainDepthTexture = new DepthTexture(rendererSize.width, rendererSize.height);
    this.mainDepthTexture.type = UnsignedShortType;

    this.mainRenderTarget = new WebGLRenderTarget(rendererSize.width, rendererSize.height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      encoding: sRGBEncoding,
      depthBuffer: true,
      depthTexture: this.mainDepthTexture,
    });

    //this.depthMaskPass = new DepthMaskPass(this.selectionDepthRenderTarget.texture);
    this.edgeDetectionPass = new EdgeDetectionPass(
      this.selectionDepthRenderTarget.texture,
      this.mainDepthTexture,
      rendererSize.width,
      rendererSize.height
    );

    this.combinePass = new CombinePass(this.edgeDetectionPass.texture, this.mainRenderTarget.texture);

    this.outputPass = new TexturePass(this.edgeDetectionPass.texture);
  }

  setSize(width: number, height: number) {
    this.selectionDepthRenderTarget.setSize(width, height);
    this.edgeDetectionPass.setSize(width, height);
    this.mainRenderTarget.setSize(width, height);
    this.renderer.setSize(width, height, false);
  }

  render(scene: Scene, camera: PerspectiveCamera | OrthographicCamera) {
    const renderer = this.renderer;

    const background = scene.background;
    const mask = camera.layers.mask;

    scene.background = null;
    renderer.shadowMap.autoUpdate = false;
    camera.layers.mask = addLayer(0, Layer.EditorSelection);
    scene.overrideMaterial = this.selectionDepthMaterial;
    renderer.setRenderTarget(this.selectionDepthRenderTarget);
    renderer.setClearColor(this.depthClearColor, this.depthClearAlpha);
    renderer.clear(true, true, false);
    renderer.render(scene, camera);

    camera.layers.mask = mask;
    scene.overrideMaterial = null;
    scene.background = background;

    renderer.setRenderTarget(this.mainRenderTarget);
    renderer.setClearColor(this.clearColor, this.clearAlpha);
    renderer.clear(true, true, false);
    renderer.shadowMap.autoUpdate = true;
    renderer.render(scene, camera);

    //this.depthMaskPass.render(camera, renderer, null);
    this.edgeDetectionPass.render(renderer);
    this.combinePass.render(renderer);
    //this.outputPass.render(renderer, null);

    /**
     * Depth Pass
     */

    // Avoid rendering background or shadows to the depth material
    // scene.background = null;
    // renderer.shadowMap.needsUpdate = false;

    //camera.layers.mask = addLayer(0, Layer.EditorSelection);

    // Use the MeshDepthMaterial for all meshes
    //scene.overrideMaterial = this.depthMaterial;

    // Set depth render target
    //renderer.setRenderTarget(this.depthRenderTarget);

    // Clear color and depth buffers
    //renderer.setClearColor(this.depthClearColor, this.depthClearAlpha);
    //renderer.clear(true, true, false);

    // Render to depth render target
    //renderer.render(scene, camera);

    /**
     * Depth Mask Pass
     */

    // this.depthMaskMaterial.cameraType = camera.type;
    // scene.overrideMaterial = this.depthMaskMaterial;

    /**
     * Outline Pass
     */

    /**
     * Blur Pass
     */

    /**
     * Render Pass
     */
    // camera.layers.mask = layers;
    // scene.background = background;
    // scene.overrideMaterial = null;
    // renderer.shadowMap.needsUpdate = true;
    // renderer.setClearColor(this.clearColor);
    // renderer.setClearAlpha(this.clearAlpha);
    // renderer.setRenderTarget(null);
    // renderer.clear(true, true, true);

    // renderer.render(scene, camera);
  }
}
