declare namespace WebSG {
  export class Light {
    constructor(type: number);
    name: string;
    readonly type: number;
    readonly color: Float32Array;
    intensity: number;
    range: number;
    castShadow: boolean;
    innerConeAngle: number;
    outerConeAngle: number;
  }

  export function getLightByName(name: string): Light | undefined;

  export class BufferView {}

  export class Image {
    constructor(uri: string, flipY?: boolean);
    constructor(bufferView: BufferView, mimeType: string, flipY?: boolean);
    name: string;
    readonly uri?: string;
    readonly bufferView?: string;
    readonly mimeType?: string;
    readonly flipY: boolean;
  }

  export class Sampler {}

  export function getImageByName(name: string): Image | undefined;

  export class Texture {
    constructor(source: Image, sampler?: Sampler, encoding?: number);
    name: string;
    readonly source: Image;
    readonly sampler?: Sampler;
    readonly encoding: number;
  }

  export function getTextureByName(name: string): Texture | undefined;

  export class Material {
    constructor(type: number);
    name: string;
    readonly type: number;
    doubleSided: boolean;
    alphaCutoff: number;
    alphaMode: number;
    readonly baseColorFactor: Float32Array;
    baseColorTexture?: Texture;
    metallicFactor: number;
    roughnessFactor: number;
    metallicRoughnessTexture?: Texture;
    normalTextureScale: number;
    normalTexture?: Texture;
    occlusionTextureStrength: number;
    occlusionTexture?: Texture;
    emissiveStrength: number;
    readonly emissiveFactor: Float32Array;
    emissiveTexture?: Texture;
    ior: number;
    transmissionFactor: number;
    transmissionTexture?: Texture;
    thicknessFactor: number;
    thicknessTexture?: Texture;
    attenuationDistance: number;
    readonly attenuationColor: Float32Array;
  }

  export function getMaterialByName(name: string): Material | undefined;
}

declare const onupdate: ((dt: number) => void) | undefined;
