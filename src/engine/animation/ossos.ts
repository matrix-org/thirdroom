import { quat, vec3 } from "gl-matrix";
import { Armature, Bone, Transform as OssosTransform } from "ossos";

import { Transform } from "../component/transform";
import { GLTFNode } from "../gltf/GLTF";

class RefTransform extends OssosTransform {
  constructor(rot: quat, pos: vec3, scl: vec3) {
    super();
    this.rot = rot;
    this.pos = pos;
    this.scl = scl;
  }
}

function _addBoneToArmature(armature: Armature, name: string, rot: quat, pos: vec3, scl: vec3, pidx?: number): Bone {
  const idx = armature.bones.length;
  const bone = new Bone(name, idx);

  armature.bones.push(bone);
  armature.names.set(name, idx);

  bone.local = new RefTransform(rot, pos, scl);

  if (pidx != null && pidx != undefined && pidx != -1) bone.pidx = pidx;

  return bone;
}

export function addBoneToArmature(armature: Armature, jointNode: GLTFNode, eid: number) {
  if (jointNode.matrix) Transform.worldMatrix[eid].set(jointNode.matrix);
  if (jointNode.translation) Transform.position[eid].set(jointNode.translation);
  if (jointNode.rotation) Transform.quaternion[eid].set(jointNode.rotation);
  if (jointNode.scale) Transform.scale[eid].set(jointNode.scale);

  return _addBoneToArmature(
    armature,
    jointNode.name || "",
    Transform.quaternion[eid],
    Transform.position[eid],
    Transform.scale[eid],
    jointNode.parentIndex || undefined
  );
}
