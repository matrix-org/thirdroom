import { vec3, quat, mat4 } from "gl-matrix";

import { Axes, isolateQuaternionAxis } from "../component/transform";
import { RemoteNode } from "../resource/resource.game";
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
  const spawnQuaternion = mat4.getRotation(_q, spawnWorldMatrix);
  spawnPosition[1] += 1.6;
  isolateQuaternionAxis(spawnQuaternion, Axes.Y);

  teleportEntity(node, spawnPosition, spawnQuaternion);
}
