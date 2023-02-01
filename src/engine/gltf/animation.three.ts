// MIT Licensed
// Copyright © 2010-2022 three.js authors
// Source: https://github.com/mrdoob/three.js/blob/00d3363e2d8a6d43dfdb75e50e3ff553b3c2f932/examples/jsm/loaders/GLTFLoader.js

import {
  InterpolateLinear,
  InterpolateDiscrete,
  NumberKeyframeTrack,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
  SkinnedMesh,
  AnimationClip,
  Interpolant,
  Quaternion,
  KeyframeTrack,
} from "three";

import { getAccessorArrayView } from "../accessor/accessor.common";
import { RemoteAnimation } from "../resource/RemoteResources";
import { AnimationSamplerInterpolation, AnimationChannelTargetPath } from "../resource/schema";
import { GLTFLoaderContext } from "./gltf.game";

const GLTFToThreeInterpolation = {
  [AnimationSamplerInterpolation.CUBICSPLINE]: undefined,
  [AnimationSamplerInterpolation.LINEAR]: InterpolateLinear,
  [AnimationSamplerInterpolation.STEP]: InterpolateDiscrete,
};

const GLTFToThreeAnimationPath = {
  [AnimationChannelTargetPath.Scale]: "scale",
  [AnimationChannelTargetPath.Translation]: "position",
  [AnimationChannelTargetPath.Rotation]: "quaternion",
  [AnimationChannelTargetPath.Weights]: "morphTargetInfluences",
};

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
  interpolate_(i1: number, t0: number, t: number, t1: number) {
    const result = super.interpolate_(i1, t0, t, t1);

    _q.fromArray(result).normalize().toArray(result);

    return result;
  }
}

export function loadGLTFAnimationClip(loaderCtx: GLTFLoaderContext, animation: RemoteAnimation): AnimationClip {
  const tracks: KeyframeTrack[] = [];

  for (const channel of animation.channels) {
    const sampler = channel.sampler;
    const targetNode = channel.targetNode;
    const targetObj = loaderCtx.nodeToObject3D.get(channel.targetNode);

    if (!targetObj) {
      throw new Error(`Couldn't find target object for ${targetNode.name}`);
    }

    targetObj.updateMatrix();
    targetObj.matrixAutoUpdate = true;

    let TypedKeyframeTrack;

    switch (channel.targetPath) {
      case AnimationChannelTargetPath.Weights:
        TypedKeyframeTrack = NumberKeyframeTrack;
        break;

      case AnimationChannelTargetPath.Rotation:
        TypedKeyframeTrack = QuaternionKeyframeTrack;
        break;

      case AnimationChannelTargetPath.Translation:
      case AnimationChannelTargetPath.Scale:
      default:
        TypedKeyframeTrack = VectorKeyframeTrack;
        break;
    }

    const targetName = targetObj.name ? targetObj.name : targetObj.uuid;

    const interpolation = GLTFToThreeInterpolation[sampler.interpolation];

    const targetNames = [];

    if (channel.targetPath === AnimationChannelTargetPath.Weights) {
      targetObj.traverse((object) => {
        if (object instanceof SkinnedMesh && object.morphTargetInfluences) {
          targetNames.push(object.name ? object.name : object.uuid);
        }
      });
    } else {
      targetNames.push(targetName);
    }

    let outputArray = getAccessorArrayView(sampler.output);

    if (sampler.output.normalized) {
      const scale = getNormalizedComponentScale(outputArray.constructor);
      const scaled = new Float32Array(outputArray.length);

      for (let j = 0, jl = outputArray.length; j < jl; j++) {
        scaled[j] = outputArray[j] * scale;
      }

      outputArray = scaled;
    }

    for (let j = 0, jl = targetNames.length; j < jl; j++) {
      const inputArray = getAccessorArrayView(sampler.input);

      const track = new TypedKeyframeTrack(
        targetNames[j] + "." + GLTFToThreeAnimationPath[channel.targetPath],
        inputArray as unknown as any[],
        outputArray as unknown as any[],
        interpolation
      );

      if (sampler.interpolation === AnimationSamplerInterpolation.CUBICSPLINE) {
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

  return new AnimationClip(animation.name, undefined, tracks);
}
