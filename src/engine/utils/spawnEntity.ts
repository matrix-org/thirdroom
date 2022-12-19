import { vec3, quat, mat4 } from "gl-matrix";

import { GameState } from "../GameTypes";
import { RemoteNodeComponent } from "../node/node.game";
import { teleportEntity } from "./teleportEntity";

const _p = vec3.create();
const _q = quat.create();

const yAxis = vec3.fromValues(0, 1, 0);

export function spawnEntity(
  ctx: GameState,
  spawnPoints: number[],
  eid: number,
  spawnPointIndex = Math.round(Math.random() * (spawnPoints.length - 1))
) {
  const spawnPointEid = spawnPoints[spawnPointIndex];
  const spawnPointNode = RemoteNodeComponent.get(spawnPointEid)!;
  const spawnWorldMatrix = spawnPointNode.worldMatrix;
  const spawnPosition = mat4.getTranslation(_p, spawnWorldMatrix);
  const spawnQuaternion = mat4.getRotation(_q, spawnWorldMatrix);

  spawnPosition[1] += 1.6;

  const yRotation = quat.getAxisAngle(yAxis, spawnQuaternion);
  quat.setAxisAngle(spawnQuaternion, yAxis, yRotation);

  teleportEntity(ctx, eid, spawnPosition, spawnQuaternion);
}
