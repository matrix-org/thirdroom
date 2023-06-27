import { vec3, quat, mat4 } from "gl-matrix";

export const Axes = {
  X: vec3.fromValues(1, 0, 0),
  Y: vec3.fromValues(0, 1, 0),
  Z: vec3.fromValues(0, 0, 1),
};
const { sin, cos } = Math;
const EulerOrder = ["XYZ", "YZX", "ZXY", "XZY", "YXZ", "ZYX"];

export const setQuaternionFromEuler = (quaternion: quat, rotation: vec3) => {
  const [x, y, z, o] = rotation;
  const order = EulerOrder[o] || "XYZ";

  const c1 = cos(x / 2);
  const c2 = cos(y / 2);
  const c3 = cos(z / 2);

  const s1 = sin(x / 2);
  const s2 = sin(y / 2);
  const s3 = sin(z / 2);

  switch (order) {
    case "XYZ":
      quaternion[0] = s1 * c2 * c3 + c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 - s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 + s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case "YXZ":
      quaternion[0] = s1 * c2 * c3 + c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 - s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 - s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 + s1 * s2 * s3;
      break;

    case "ZXY":
      quaternion[0] = s1 * c2 * c3 - c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 + s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 + s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case "ZYX":
      quaternion[0] = s1 * c2 * c3 - c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 + s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 - s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 + s1 * s2 * s3;
      break;

    case "YZX":
      quaternion[0] = s1 * c2 * c3 + c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 + s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 - s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case "XZY":
      quaternion[0] = s1 * c2 * c3 - c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 - s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 + s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 + s1 * s2 * s3;
      break;
  }
};

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function setEulerFromTransformMatrix(rotation: vec3, matrix: mat4) {
  const order = EulerOrder[rotation[3]] || "XYZ";

  // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
  const te = matrix;

  const m11 = te[0];
  const m12 = te[4];
  const m13 = te[8];
  const m21 = te[1];
  const m22 = te[5];
  const m23 = te[9];
  const m31 = te[2];
  const m32 = te[6];
  const m33 = te[10];

  switch (order) {
    case "XYZ":
      rotation[1] = Math.asin(clamp(m13, -1, 1));

      if (Math.abs(m13) < 0.9999999) {
        rotation[0] = Math.atan2(-m23, m33);
        rotation[2] = Math.atan2(-m12, m11);
      } else {
        rotation[0] = Math.atan2(m32, m22);
        rotation[2] = 0;
      }

      break;

    case "YXZ":
      rotation[0] = Math.asin(-clamp(m23, -1, 1));

      if (Math.abs(m23) < 0.9999999) {
        rotation[1] = Math.atan2(m13, m33);
        rotation[2] = Math.atan2(m21, m22);
      } else {
        rotation[1] = Math.atan2(-m31, m11);
        rotation[2] = 0;
      }

      break;

    case "ZXY":
      rotation[0] = Math.asin(clamp(m32, -1, 1));

      if (Math.abs(m32) < 0.9999999) {
        rotation[1] = Math.atan2(-m31, m33);
        rotation[2] = Math.atan2(-m12, m22);
      } else {
        rotation[1] = 0;
        rotation[2] = Math.atan2(m21, m11);
      }

      break;

    case "ZYX":
      rotation[1] = Math.asin(-clamp(m31, -1, 1));

      if (Math.abs(m31) < 0.9999999) {
        rotation[0] = Math.atan2(m32, m33);
        rotation[2] = Math.atan2(m21, m11);
      } else {
        rotation[0] = 0;
        rotation[2] = Math.atan2(-m12, m22);
      }

      break;

    case "YZX":
      rotation[2] = Math.asin(clamp(m21, -1, 1));

      if (Math.abs(m21) < 0.9999999) {
        rotation[0] = Math.atan2(-m23, m22);
        rotation[1] = Math.atan2(-m31, m11);
      } else {
        rotation[0] = 0;
        rotation[1] = Math.atan2(m13, m33);
      }

      break;

    case "XZY":
      rotation[2] = Math.asin(-clamp(m12, -1, 1));

      if (Math.abs(m12) < 0.9999999) {
        rotation[0] = Math.atan2(m32, m22);
        rotation[1] = Math.atan2(m13, m11);
      } else {
        rotation[0] = Math.atan2(-m23, m33);
        rotation[1] = 0;
      }

      break;
  }

  return rotation;
}
export const tempMat4 = mat4.create();
export const tempVec3 = vec3.create();
export const tempQuat = quat.create();
export const defaultUp = vec3.set(vec3.create(), 0, 1, 0);

export function setEulerFromQuaternion(rotation: Float32Array | vec3, quaternion: Float32Array | quat) {
  mat4.fromQuat(tempMat4, quaternion);
  setEulerFromTransformMatrix(rotation, tempMat4);
}

export const RAD2DEG = 180 / Math.PI;
export const DEG2RAD = Math.PI / 180;

export function getDirection(out: vec3, matrix: mat4): vec3 {
  vec3.set(out, matrix[8], matrix[9], matrix[10]);
  return vec3.normalize(out, out);
}
/*
notes on calculating forward/up/right:

  forward.x =  cos(pitch) * sin(yaw);
  forward.y = -sin(pitch);
  forward.z =  cos(pitch) * cos(yaw);

  right.x =  cos(yaw);
  right.y =  0;
  right.z = -sin(yaw);

  up = cross(forward, right);

  equivalent:
  up.x = sin(pitch) * sin(yaw);
  up.y = cos(pitch);
  up.z = sin(pitch) * cos(yaw);
*/

export const getPitch = ([x, y, z, w]: quat) => Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * x * x - 2 * z * z);
export const getYaw = ([x, y, z, w]: quat) => Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * y * y - 2 * z * z);
export const getRoll = ([x, y, z, w]: quat) => Math.asin(2 * x * y + 2 * z * w);

export function getForwardVector(out: vec3, pitch: number, roll: number) {
  return vec3.set(out, -Math.cos(pitch) * Math.sin(roll), Math.sin(pitch), -Math.cos(pitch) * Math.cos(roll));
}

export function getRightVector(out: vec3, roll: number) {
  return vec3.set(out, Math.cos(roll), 0, -Math.sin(roll));
}

export function domPointToVec3(out: vec3, point: DOMPointReadOnly): vec3 {
  out[0] = point.x;
  out[1] = point.y;
  out[2] = point.z;
  return out;
}

export function domPointToQuat(out: quat, point: DOMPointReadOnly): quat {
  out[0] = point.x;
  out[1] = point.y;
  out[2] = point.z;
  out[3] = point.w;
  return out;
}

export interface DOMPointReadOnlyLike {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export function vec3ToDOMPoint(vec: vec3): DOMPointReadOnlyLike {
  return {
    x: vec[0],
    y: vec[1],
    z: vec[2],
    w: 1,
  };
}

export function quatToDOMPoint(quat: quat): DOMPointReadOnlyLike {
  return {
    x: quat[0],
    y: quat[1],
    z: quat[2],
    w: quat[3],
  };
}
