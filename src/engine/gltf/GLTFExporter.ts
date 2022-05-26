import { Object3D } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

import { GLTFEntityDescription } from ".";
import { getModule } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../RenderWorker";
import { ExportGLTFMessage } from "../WorkerMessage";

function inflateObject3D(state: RenderThreadState, entity: GLTFEntityDescription): Object3D {
  const renderModule = getModule(state, RendererModule);
  const renderable = entity.components.find(({ type }) => type === "renderable");

  let object: Object3D;

  if (renderable) {
    object = renderModule.resourceManager.store.get(renderable.resourceId)!.resource as Object3D;
  } else {
    object = new Object3D();
  }

  for (const component of entity.components) {
    if (component.type === "transform") {
      object.position.fromArray(component.position);
      object.quaternion.fromArray(component.quaternion);
      object.scale.fromArray(component.scale);
    }
  }

  if (entity.children) {
    for (const child of entity.children) {
      object.add(inflateObject3D(state, child));
    }
  }

  return object;
}

export async function exportSceneAsGLTF(state: RenderThreadState, message: ExportGLTFMessage) {
  const renderModule = getModule(state, RendererModule);
  const scene = inflateObject3D(state, message.scene);

  const gltfExporter = new GLTFExporter();

  const buffer = await gltfExporter.parseAsync(scene, {
    binary: true,
    onlyVisible: false,
    embedImages: true,
  });

  for (const renderable of renderModule.renderables) {
    if (renderable.object) {
      renderModule.scene.add(renderable.object);
    }
  }

  return buffer;
}
