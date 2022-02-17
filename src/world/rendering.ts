import { World } from "./World";
import {
  WebGLRenderer,
  WebGLRendererParameters,
  PerspectiveCamera,
  Scene,
  ACESFilmicToneMapping,
  sRGBEncoding,
} from "three";
import { getObject3D } from "./three";

export function RenderingModule(
  world: World,
  options: WebGLRendererParameters
) {
  const renderer = new WebGLRenderer(options);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = sRGBEncoding;
  renderer.setPixelRatio(window.devicePixelRatio);

  world.renderer = renderer;
  world.resizeViewport = true;

  if (!options.canvas) {
    document.body.appendChild(world.renderer.domElement);
  }

  const canvasParentStyle = world.renderer.domElement.parentElement!.style;
  canvasParentStyle.position = "relative";

  const canvasStyle = world.renderer.domElement.style;
  canvasStyle.position = "absolute";
  canvasStyle.width = "100%";
  canvasStyle.height = "100%";

  world.resizeViewport = true;

  function onResize() {
    world.resizeViewport = true;
  }

  window.addEventListener("resize", onResize);

  function RenderingSystem(world: World) {
    const scene = getObject3D<Scene>(world, world.sceneEid);
    const camera = getObject3D<PerspectiveCamera>(world, world.cameraEid);

    if (world.resizeViewport) {
      const canvasParent = world.renderer.domElement
        .parentElement as HTMLElement;

      if (camera.isPerspectiveCamera) {
        camera.aspect = canvasParent.clientWidth / canvasParent.clientHeight;
        camera.updateProjectionMatrix();
      }

      world.renderer.setSize(
        canvasParent.clientWidth,
        canvasParent.clientHeight,
        false
      );

      world.resizeViewport = false;
    }

    world.renderer.render(scene, camera);

    return world;
  }

  return {
    RenderingSystem,
    setAnimationLoop: (callback: () => void) => {
      world.renderer.setAnimationLoop(callback);
    },
    dispose: () => {
      world.renderer.dispose();
      window.removeEventListener("resize", onResize);
    },
  };
}
