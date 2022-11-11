declare namespace WebSG {
  export class Light {
    constructor(type: number);
    name: string;
    type: number;
    readonly color: Float32Array;
    intensity: number;
    range: number;
    castShadow: boolean;
    innerConeAngle: number;
    outerConeAngle: number;
  }

  export function getLightByName(name: string): Light | undefined;

  export class Material {
    constructor(type: number);
    name: string;
    type: number;
    doubleSided: boolean;
    alphaCutoff: number;
    alphaMode: number;
    readonly baseColorFactor: Float32Array;
    metallicFactor: number;
    roughnessFactor: number;
    normalTextureScale: number;
    occlusionTextureStrength: number;
    emissiveStrength: number;
    readonly emissiveFactor: Float32Array;
    ior: number;
    transmissionFactor: number;
    thicknessFactor: number;
    attenuationDistance: number;
    readonly attenuationColor: Float32Array;
  }

  export function getMaterialByName(name: string): Material | undefined;
}

declare const onupdate: ((dt: number) => void) | undefined;
