import { DoubleSide, ShaderMaterial, Vector2 } from "three";

function makeFragmentShader(cameraType: string) {
  return `#include <packing>
  varying vec4 vPosition;
  varying vec4 projTexCoord;
  uniform sampler2D depthTexture;
  uniform vec2 cameraNearFar;
  void main() {
    float depth = unpackRGBAToDepth(texture2DProj( depthTexture, projTexCoord ));
    float viewZ = - ${cameraType}DepthToViewZ( depth, cameraNearFar.x, cameraNearFar.y );
    float depthTest = (-vPosition.z > viewZ) ? 1.0 : 0.0;
    gl_FragColor = vec4(0.0, depthTest, 1.0, 1.0);
  }`;
}

export class DepthMaskMaterial extends ShaderMaterial {
  private _cameraType: string;

  constructor(cameraType: string) {
    super({
      side: DoubleSide,
      uniforms: {
        depthTexture: { value: null },
        cameraNearFar: { value: new Vector2(0.5, 0.5) },
        textureMatrix: { value: null },
      },

      vertexShader: `#include <morphtarget_pars_vertex>
      #include <skinning_pars_vertex>
      varying vec4 projTexCoord;
      varying vec4 vPosition;
      uniform mat4 textureMatrix;
      void main() {
        #include <skinbase_vertex>
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        #include <project_vertex>
        vPosition = mvPosition;
        vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
        projTexCoord = textureMatrix * worldPosition;
      }`,

      fragmentShader: makeFragmentShader(cameraType),
    });

    this._cameraType = cameraType;
  }

  get cameraType(): string {
    return this._cameraType;
  }

  set cameraType(value: string) {
    if (value !== this._cameraType) {
      this.fragmentShader = makeFragmentShader(value);
      this.needsUpdate = true;
      this._cameraType = value;
    }
  }
}
