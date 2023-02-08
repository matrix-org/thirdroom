import { vec3, quat, mat4 } from "gl-matrix";

import { getYaw, RAD2DEG } from "../component/math";
import { RemoteNode } from "../resource/RemoteResources";
import { teleportEntity } from "./teleportEntity";

const _p = vec3.create();
const _q = quat.create();

export function spawnEntity(
  spawnPoints: RemoteNode[],
  node: RemoteNode,
  spawnPointIndex = Math.round(Math.random() * (spawnPoints.length - 1))
) {
  const spawnWorldMatrix = spawnPoints[spawnPointIndex].worldMatrix;
  const spawnPosition = mat4.getTranslation(_p, spawnWorldMatrix);
  spawnPosition[1] += 1;
  const spawnQuaternion = mat4.getRotation(_q, spawnWorldMatrix);
  const yRotation = getYaw(spawnQuaternion);
  quat.fromEuler(spawnQuaternion, 0, (yRotation + Math.PI) * RAD2DEG, 0);
  teleportEntity(node, spawnPosition, spawnQuaternion);
}
