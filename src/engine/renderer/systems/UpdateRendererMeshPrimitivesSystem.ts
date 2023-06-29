import { getDefaultMaterialForMeshPrimitive } from "../materials";
import { RenderContext } from "../renderer.render";
import { getLocalResource, getLocalResources, RenderMaterial, RenderMeshPrimitive } from "../RenderResources";

/* Updates */

export function UpdateRendererMeshPrimitivesSystem(ctx: RenderContext) {
  const meshPrimitives = getLocalResources(ctx, RenderMeshPrimitive);

  for (let i = 0; i < meshPrimitives.length; i++) {
    const meshPrimitive = meshPrimitives[i];
    const nextMaterialResourceId = meshPrimitive.material?.eid || 0;
    const nextMaterialResource = getLocalResource<RenderMaterial>(ctx, nextMaterialResourceId);

    const newMaterialObj = nextMaterialResource
      ? nextMaterialResource.getMaterialForMeshPrimitive(ctx, meshPrimitive)
      : getDefaultMaterialForMeshPrimitive(ctx, meshPrimitive);

    if (newMaterialObj !== meshPrimitive.materialObj) {
      if (meshPrimitive.material) {
        meshPrimitive.material.disposeMeshPrimitiveMaterial(meshPrimitive.materialObj);
      }

      meshPrimitive.materialObj = newMaterialObj;
    }

    if (
      (meshPrimitive.materialObj as any).aoMap &&
      meshPrimitive.geometryObj.attributes.uv2 === undefined &&
      meshPrimitive.geometryObj.attributes.uv !== undefined
    ) {
      meshPrimitive.geometryObj.setAttribute("uv2", meshPrimitive.geometryObj.attributes.uv);
    }
  }
}
