// MIT Licensed
// Copyright © 2010-2022 three.js authors
// Source: https://github.com/mrdoob/three.js/blob/00d3363e2d8a6d43dfdb75e50e3ff553b3c2f932/examples/jsm/loaders/GLTFLoader.js

import {
  InterpolateLinear,
  InterpolateDiscrete,
  Object3D,
  NumberKeyframeTrack,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
  SkinnedMesh,
  AnimationClip,
  Interpolant,
  Quaternion,
} from "three";

import { RemoteAccessor } from "../accessor/accessor.game";
import { GameState } from "../GameTypes";
import { GLTFAnimation, GLTFSampler, GLTFAnimationChannelTarget } from "./GLTF";
import { GLTFResource, loadGLTFAccessor } from "./gltf.game";

const PATH_PROPERTIES = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences",
};

type PATH_PROPERTIES_KEY = keyof typeof PATH_PROPERTIES;

const INTERPOLATION = {
  CUBICSPLINE: undefined,
  LINEAR: InterpolateLinear,
  STEP: InterpolateDiscrete,
};

type INTERPOLATION_KEY = keyof typeof INTERPOLATION;

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {
  constructor(parameterPositions: any, sampleValues: any, sampleSize: number, resultBuffer: any) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }

  copySampleValue_(index: number) {
    // Copies a sample value to the result buffer. See description of glTF
    // CUBICSPLINE values layout in interpolate_() function below.

    const result = this.resultBuffer;
    const values = this.sampleValues;
    const valueSize = this.valueSize;
    const offset = index * valueSize * 3 + valueSize;

    for (let i = 0; i !== valueSize; i++) {
      result[i] = values[offset + i];
    }

    return result;
  }

  interpolate_(i1: number, t0: number, t: number, t1: number) {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;

    const stride2 = stride * 2;
    const stride3 = stride * 3;

    const td = t1 - t0;

    const p = (t - t0) / td;
    const pp = p * p;
    const ppp = pp * p;

    const offset1 = i1 * stride3;
    const offset0 = offset1 - stride3;

    const s2 = -2 * ppp + 3 * pp;
    const s3 = ppp - pp;
    const s0 = 1 - s2;
    const s1 = s3 - pp + p;

    // Layout of keyframe output values for CUBICSPLINE animations:
    //   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
    for (let i = 0; i !== stride; i++) {
      const p0 = values[offset0 + i + stride]; // splineVertex_k
      const m0 = values[offset0 + i + stride2] * td; // outTangent_k * (t_k+1 - t_k)
      const p1 = values[offset1 + i + stride]; // splineVertex_k+1
      const m1 = values[offset1 + i] * td; // inTangent_k+1 * (t_k+1 - t_k)

      result[i] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;
    }

    return result;
  }
}

const _q = new Quaternion();

class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {
  interpolate_(i1: any, t0: any, t: any, t1: any) {
    const result = super.interpolate_(i1, t0, t, t1);

    _q.fromArray(result).normalize().toArray(result);

    return result;
  }
}

function getNormalizedComponentScale(constructor: Function) {
  // Reference:
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

  switch (constructor) {
    case Int8Array:
      return 1 / 127;

    case Uint8Array:
      return 1 / 255;

    case Int16Array:
      return 1 / 32767;

    case Uint16Array:
      return 1 / 65535;

    default:
      throw new Error("Unsupported normalized accessor component type.");
  }
}

export async function loadGLTFAnimationClip(
  ctx: GameState,
  resource: GLTFResource,
  animation: GLTFAnimation,
  index: number,
  indexToObject3D: Map<number, Object3D>
) {
  const nodes: Object3D[] = [];
  const pendingInputAccessors: Promise<RemoteAccessor<any>>[] = [];
  const pendingOutputAccessors: Promise<RemoteAccessor<any>>[] = [];
  const samplers: GLTFSampler[] = [];
  const targets: GLTFAnimationChannelTarget[] = [];

  for (let i = 0, il = animation.channels.length; i < il; i++) {
    const channel = animation.channels[i];
    const sampler = animation.samplers[channel.sampler];
    const target = channel.target;
    const input = animation.parameters !== undefined ? animation.parameters[sampler.input] : sampler.input;
    const output = animation.parameters !== undefined ? animation.parameters[sampler.output] : sampler.output;

    if (target.node !== undefined) {
      const obj3d = indexToObject3D.get(target.node);
      if (obj3d) nodes.push(obj3d);
      else
        throw new Error(
          "glTF animation channel parse error: target node's object3d not found for index " + target.node
        );
    }

    pendingInputAccessors.push(loadGLTFAccessor(ctx, resource, input));
    pendingOutputAccessors.push(loadGLTFAccessor(ctx, resource, output));

    samplers.push(sampler);
    targets.push(target);
  }

  const [inputAccessors, outputAccessors] = await Promise.all([
    Promise.all(pendingInputAccessors),
    Promise.all(pendingOutputAccessors),
  ]);

  const tracks = [];

  for (let i = 0, il = nodes.length; i < il; i++) {
    const node = nodes[i];
    const inputAccessor = inputAccessors[i];
    const outputAccessor = outputAccessors[i];
    const sampler = samplers[i];
    const target = targets[i];

    if (node === undefined) continue;

    node.updateMatrix();
    node.matrixAutoUpdate = true;

    let TypedKeyframeTrack;

    switch (PATH_PROPERTIES[target.path as PATH_PROPERTIES_KEY]) {
      case PATH_PROPERTIES.weights:
        TypedKeyframeTrack = NumberKeyframeTrack;
        break;

      case PATH_PROPERTIES.rotation:
        TypedKeyframeTrack = QuaternionKeyframeTrack;
        break;

      case PATH_PROPERTIES.translation:
      case PATH_PROPERTIES.scale:
      default:
        TypedKeyframeTrack = VectorKeyframeTrack;
        break;
    }

    const targetName = node.name ? node.name : node.uuid;

    const interpolation =
      sampler.interpolation !== undefined
        ? INTERPOLATION[sampler.interpolation as INTERPOLATION_KEY]
        : InterpolateLinear;

    const targetNames = [];

    if (PATH_PROPERTIES[target.path as PATH_PROPERTIES_KEY] === PATH_PROPERTIES.weights) {
      node.traverse(function (object) {
        if (object instanceof SkinnedMesh && object.morphTargetInfluences) {
          targetNames.push(object.name ? object.name : object.uuid);
        }
      });
    } else {
      targetNames.push(targetName);
    }

    let outputArray = outputAccessor.attribute.array;

    if (outputAccessor.attribute.normalized) {
      const scale = getNormalizedComponentScale(outputArray.constructor);
      const scaled = new Float32Array(outputArray.length);

      for (let j = 0, jl = outputArray.length; j < jl; j++) {
        scaled[j] = outputArray[j] * scale;
      }

      outputArray = scaled;
    }

    for (let j = 0, jl = targetNames.length; j < jl; j++) {
      const track = new TypedKeyframeTrack(
        targetNames[j] + "." + PATH_PROPERTIES[target.path as PATH_PROPERTIES_KEY],
        inputAccessor.attribute.array as any[],
        outputArray as any[],
        interpolation
      );

      if (sampler.interpolation === "CUBICSPLINE") {
        (track as any).createInterpolant = function (result: any) {
          const interpolantType =
            this instanceof QuaternionKeyframeTrack ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant;

          return new interpolantType(this.times, this.values, this.getValueSize() / 3, result);
        };

        (track as any).createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
      }

      tracks.push(track);
    }
  }

  const name = animation.name ? animation.name : "animation_" + index;

  return new AnimationClip(name, undefined, tracks);
}
