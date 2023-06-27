import { Vector3, InstancedMesh, Box3, Matrix4 } from "three";

import { RenderContext } from "../renderer.render";
import { getLocalResources, RenderNode, RenderScene } from "../RenderResources";
import { createPool, obtainFromPool, releaseToPool } from "../../utils/Pool";
import { getReflectionProbes, ReflectionProbe } from "../ReflectionProbe";

const boundingBox = new Box3();
const boundingBoxSize = new Vector3();
const instanceWorldMatrix = new Matrix4();
const instanceReflectionProbeParams = new Vector3();

export function UpdateNodeReflectionsSystem(ctx: RenderContext) {
  const scene = ctx.worldResource.environment?.publicScene;

  if (!scene) {
    return;
  }

  const nodes = getLocalResources(ctx, RenderNode);
  const reflectionProbes = getReflectionProbes(ctx);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (!node.meshPrimitiveObjects) {
      continue;
    }

    for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
      const primitive = node.meshPrimitiveObjects[i];

      if (primitive.userData.reflectionsNeedUpdate === false) {
        continue;
      }

      if (node.isStatic && !node.needsUpdate) {
        primitive.userData.reflectionsNeedUpdate = false;
      }

      if ("isInstancedMesh" in primitive) {
        const instancedMesh = primitive as InstancedMesh;
        const instanceReflectionProbeParamsAttribute = instancedMesh.geometry.getAttribute(
          "instanceReflectionProbeParams"
        );

        for (let i = 0; i < instancedMesh.count; i++) {
          instancedMesh.getMatrixAt(i, instanceWorldMatrix);
          instanceWorldMatrix.premultiply(instancedMesh.matrixWorld);

          if (!primitive.geometry.boundingBox) {
            primitive.geometry.computeBoundingBox();
          }

          // computeBoundingBox will set geometry.boundingBox
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          boundingBox.copy(primitive.geometry.boundingBox!);
          boundingBox.expandByScalar(0.01);

          // Apply the instance's transform to the bounding box
          boundingBox.applyMatrix4(instanceWorldMatrix);

          setReflectionProbeParams(boundingBox, scene, reflectionProbes, instanceReflectionProbeParams);

          // Set the instance's reflectionProbeParams
          instanceReflectionProbeParamsAttribute.setXYZ(
            i,
            instanceReflectionProbeParams.x,
            instanceReflectionProbeParams.y,
            instanceReflectionProbeParams.z
          );
        }

        // Reupload reflection probe params buffer
        instanceReflectionProbeParamsAttribute.needsUpdate = true;
      } else {
        boundingBox.setFromObject(primitive);
        boundingBox.expandByScalar(0.01);
        const reflectionProbeParams = primitive.userData.reflectionProbeParams as Vector3;
        setReflectionProbeParams(boundingBox, scene, reflectionProbes, reflectionProbeParams);
      }
    }
  }
}

interface Intersection {
  textureArrayIndex: number;
  intersectionVolume: number;
}

const tempIntersectionBox = new Box3();
const intersectionSize = new Vector3();
const intersections: Intersection[] = [];

const intersectionPool = createPool(() => ({ textureArrayIndex: 0, intersectionVolume: 0 }));

const intersectionComparator = (a: Intersection, b: Intersection) => b.intersectionVolume - a.intersectionVolume;

function setReflectionProbeParams(
  primitiveBoundingBox: Box3,
  scene: RenderScene,
  reflectionProbes: ReflectionProbe[],
  reflectionProbeParams: Vector3
) {
  reflectionProbeParams.set(0, 0, 0);
  intersections.length = 0;

  // Accumulate all intersecting reflection probe volumes
  for (let i = 0; i < reflectionProbes.length; i++) {
    const reflectionProbe = reflectionProbes[i];

    if (primitiveBoundingBox.intersectsBox(reflectionProbe.box)) {
      tempIntersectionBox.copy(primitiveBoundingBox);
      tempIntersectionBox.intersect(reflectionProbe.box);
      tempIntersectionBox.getSize(intersectionSize);
      const intersectionVolume = intersectionSize.x * intersectionSize.y * intersectionSize.z;
      const intersection = obtainFromPool(intersectionPool);
      intersection.textureArrayIndex = reflectionProbe.resource.textureArrayIndex;
      intersection.intersectionVolume = intersectionVolume;
      intersections.push(intersection);
    }
  }

  // Sort intersections in descending order (largest intersection volume first)
  intersections.sort(intersectionComparator);

  primitiveBoundingBox.getSize(boundingBoxSize);
  const boundingBoxVolume = boundingBoxSize.x * boundingBoxSize.y * boundingBoxSize.z;

  // Set the primitive's reflection probe parameters
  // x: first probe's texture array index
  // y: second probe's texture array index
  // z: mix factor between first and second probes (0 = 100% first probe, 1 = 100% second probe)
  reflectionProbeParams.set(
    (intersections.length > 0 ? intersections[0].textureArrayIndex : scene.reflectionProbe?.textureArrayIndex) || 0,
    (intersections.length > 1 ? intersections[1].textureArrayIndex : scene.reflectionProbe?.textureArrayIndex) || 0,
    intersections.length === 0
      ? 0
      : intersections.length === 1
      ? 1 - intersections[0].intersectionVolume / boundingBoxVolume
      : 1 -
          intersections[0].intersectionVolume /
            (intersections[0].intersectionVolume + intersections[1].intersectionVolume) || 0
  );

  for (let i = 0; i < intersections.length; i++) {
    const intersection = intersections[i];
    releaseToPool(intersectionPool, intersection);
  }
}
