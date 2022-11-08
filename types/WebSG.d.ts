declare namespace WebSG {
  export class Light {
    constructor();
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
}

declare const onupdate: ((dt: number) => void) | undefined;
