import { getModule } from "../../module/module.common";
import { getLocalResources, RenderNode, RenderScene } from "../RenderResources";
import { RenderContext, RendererModule } from "../renderer.render";

export function UpdateWorldVisibilitySystem(ctx: RenderContext) {
  const nodes = getLocalResources(ctx, RenderNode);
  const { nodeOptimizationsEnabled } = getModule(ctx, RendererModule);

  // Don't do isStatic optimization if the editor is loaded
  const ignoreStatic = !nodeOptimizationsEnabled;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (!node.isStatic && !ignoreStatic) {
      node.object3DVisible = false;
    }
  }

  const worldResource = ctx.worldResource;

  if (worldResource.environment) {
    updateSceneVisibility(worldResource.environment.privateScene, ignoreStatic);
    updateSceneVisibility(worldResource.environment.publicScene, ignoreStatic);
  }

  let nextNode = worldResource.firstNode;

  while (nextNode) {
    updateNodeVisibility(nextNode, true, ignoreStatic);
    nextNode = nextNode.nextSibling;
  }

  updateSceneVisibility(worldResource.persistentScene, ignoreStatic);
}

function updateSceneVisibility(scene: RenderScene, ignoreStatic: boolean) {
  let curChild = scene.firstNode;

  while (curChild) {
    updateNodeVisibility(curChild, true, ignoreStatic);
    curChild = curChild.nextSibling;
  }
}

function updateNodeVisibility(node: RenderNode, parentVisibility: boolean, ignoreStatic: boolean) {
  if (node.isStatic && !ignoreStatic) {
    return;
  }

  node.object3DVisible = node.visible && parentVisibility;

  let curChild = node.firstChild;

  while (curChild) {
    updateNodeVisibility(curChild, node.object3DVisible, ignoreStatic);
    curChild = curChild.nextSibling;
  }
}
