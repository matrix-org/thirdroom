import { EquirectangularReflectionMapping, Scene, Texture } from "three";

import { getReadObjectBufferView, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader, waitForLocalResource } from "../resource/resource.render";
import { SceneResourceType, sceneSchema, SharedSceneResource } from "./scene.common";

interface LocalSceneResource {
  scene: Scene;
  sharedScene: TripleBufferBackedObjectBufferView<typeof sceneSchema, ArrayBuffer>;
}

type SceneModuleState = {
  sceneResources: Map<number, LocalSceneResource>;
};

export const SceneModule = defineModule<RenderThreadState, SceneModuleState>({
  name: "scene",
  create() {
    return {
      sceneResources: new Map(),
    };
  },
  init(ctx) {
    const disposables = [registerResourceLoader(ctx, SceneResourceType, onLoadScene)];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadScene(
  ctx: RenderThreadState,
  id: ResourceId,
  { eid, initialProps, sharedScene }: SharedSceneResource
): Promise<Scene> {
  const sceneModule = getModule(ctx, SceneModule);

  const scene = new Scene();

  sceneModule.sceneResources.set(eid, {
    scene,
    sharedScene,
  });

  if (initialProps) {
    const promises: Promise<void>[] = [];

    if (initialProps.background) {
      promises.push(
        waitForLocalResource<Texture>(ctx, initialProps.background).then((texture) => {
          scene.background = texture;
        })
      );
    }

    if (initialProps.environment) {
      promises.push(
        waitForLocalResource<Texture>(ctx, initialProps.environment).then((texture) => {
          // TODO: Move to texture loader
          if (texture) {
            texture.mapping = EquirectangularReflectionMapping;
          }

          scene.environment = texture;
        })
      );
    }

    await Promise.all(promises);
  }

  return scene;
}

export function SceneUpdateSystem(ctx: RenderThreadState) {
  const { sceneResources } = getModule(ctx, SceneModule);

  for (const [, { scene, sharedScene }] of sceneResources) {
    const props = getReadObjectBufferView(sharedScene);

    if (!props.needsUpdate[0]) {
      continue;
    }

    // TODO: Handle this better than this racy way
    if (props.background[0] !== 0) {
      waitForLocalResource<Texture>(ctx, props.background[0]).then((texture) => {
        scene.background = texture;
      });
    }

    if (props.environment[0] !== 0) {
      waitForLocalResource<Texture>(ctx, props.environment[0]).then((texture) => {
        // TODO: Move to texture loader
        if (texture) {
          texture.mapping = EquirectangularReflectionMapping;
        }

        scene.environment = texture;
      });
    }
  }
}
