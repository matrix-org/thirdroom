import {
  Camera,
  Color,
  MeshDepthMaterial,
  NearestFilter,
  RGBADepthPacking,
  Scene,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

/**
 * The RenderPipeline class is intended to be just one of a few different options for render pipelines
 * for various platforms. This implementation is only focused on desktops with integrated or dedicated GPUs.
 * Further optimizations may be needed for mobile / VR where additional render passes have a higher perf impact.
 */
export class RenderPipeline {
  public clearColor: Color = new Color(0x000000);
  public clearAlpha = 0;

  private depthClearColor: Color = new Color(0xffffff);
  private depthClearAlpha = 1;
  private depthRenderTarget: WebGLRenderTarget;
  private depthMaterial: MeshDepthMaterial;

  constructor(private renderer: WebGLRenderer) {
    const rendererSize = renderer.getSize(new Vector2());

    this.depthMaterial = new MeshDepthMaterial({
      depthPacking: RGBADepthPacking,
    });

    this.depthRenderTarget = new WebGLRenderTarget(rendererSize.width, rendererSize.height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
    });
  }

  setSize(width: number, height: number) {
    this.depthRenderTarget.setSize(width, height);
  }

  render(scene: Scene, camera: Camera) {
    const renderer = this.renderer;

    const layers = camera.layers.mask;
    const background = scene.background;

    /**
     * Depth Pass
     */

    // Avoid rendering background or shadows to the depth material
    scene.background = null;
    renderer.shadowMap.needsUpdate = false;

    camera.layers.mask = 2;

    // Use the MeshDepthMaterial for all meshes
    scene.overrideMaterial = this.depthMaterial;

    // Set depth render target
    renderer.setRenderTarget(null);

    // Clear color and depth buffers
    renderer.setClearColor(this.depthClearColor, this.depthClearAlpha);
    renderer.clear(true, true, false);

    // Render to depth render target
    renderer.render(scene, camera);

    // /**
    //  * Render Pass
    //  */
    camera.layers.mask = layers;
    scene.background = background;
    renderer.shadowMap.needsUpdate = true;
    // renderer.setClearColor(this.clearColor);
    // renderer.setClearAlpha(this.clearAlpha);
    // renderer.setRenderTarget(null);
    // renderer.clear(true, true, true);

    // renderer.render(scene, camera);
  }
}
