import {
  ImageBitmapLoader,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix3,
  Mesh,
  OneFactor,
  RepeatWrapping,
  ShaderMaterial,
  Texture,
} from "three";

/**
 * Originally Authored by Shahriar Shahrabi
 * https://shahriyarshahrabi.medium.com/shader-studies-matrix-effect-3d2ead3a84c5
 * https://github.com/IRCSS/MatrixVFX
 *
 * Copyright 2020 Shahriar Shahrabi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions: The above copyright notice and this permission notice shall
 * be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

const matrixFontTextureUrl = "/image/matrix-font.png";
const rgbaNoiseTextureUrl = "/image/rgba-noise.png";

const vertexShader = /* glsl */ `

#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>

uniform mat3 normalWorldMatrix;

varying vec4 vWorldPos;
varying vec3 vNormal;

void main() {
  #include <beginnormal_vertex>

  #if defined ( USE_SKINNING )
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
	#endif

  vec3 transformedNormal = objectNormal;

  #ifdef USE_INSTANCING

    // this is in lieu of a per-instance normal-matrix
    // shear transforms in the instance matrix are not supported

    mat3 m = mat3( instanceMatrix );

    transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );

    transformedNormal = m * transformedNormal;

  #endif

  transformedNormal = normalWorldMatrix * transformedNormal;

  #ifdef FLIP_SIDED

    transformedNormal = - transformedNormal;

  #endif

  #ifdef USE_TANGENT

    vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;

    #ifdef FLIP_SIDED

      transformedTangent = - transformedTangent;

    #endif

  #endif

  #include <begin_vertex>
  #include <morphtarget_vertex>
	#include <skinning_vertex>
  #include <project_vertex>
	#include <clipping_planes_vertex>

  vec4 worldPosition = vec4( transformed, 1.0 );

	#ifdef USE_INSTANCING

		worldPosition = instanceMatrix * worldPosition;

	#endif

	vWorldPos = modelMatrix * worldPosition;

  vNormal = normalize(transformedNormal);
}

`;

const fragmentShader = /* glsl */ `

uniform float time;
uniform sampler2D textAtlasTexture;
uniform sampler2D noiseTexture;

varying vec4 vWorldPos;
varying vec3 vNormal;

float text(vec2 fragCoord) {
  vec2 uv = mod(fragCoord, 16.0) * 0.0625;
  vec2 block = fragCoord * 0.0625 - uv;
  uv = uv * 0.8 + 0.1; // scale the letters up a bit
  vec2 noiseTextureResolution = vec2(256.0, 256.0);
  vec2 rand = texture2D(noiseTexture, block / noiseTextureResolution + time * 0.002).xy;
  rand = floor(rand * 16.0);
  uv += rand;
  uv *= 0.0625; // bring back into 0-1 range
  return texture2D(textAtlasTexture, uv).r;
}

vec3 rain(vec2 fragCoord) {
  fragCoord.x = floor(fragCoord.x / 16.0);
  float offset = sin(fragCoord.x * 15.0);
  float speed = cos(fragCoord.x * 3.0) * 0.15 + 0.35;
  float y = fract((fragCoord.y / DROP_LENGTH) + time * speed + offset);
  return vec3(0.1, 1.0, 0.35) / (y * 20.0);
}

vec3 matrixEffect(vec2 fragCoord) {
  return text(fragCoord * vec2(DROP_LENGTH) * SCALE) * rain(fragCoord * vec2(DROP_LENGTH) * SCALE);
}

void main() {
  vec3 colorFront = matrixEffect(vWorldPos.xy + sin(vWorldPos.zz));
  vec3 colorSide = matrixEffect(vWorldPos.zy + sin(vWorldPos.xx));
  vec3 colorTop = matrixEffect(vWorldPos.xz + sin(vWorldPos.yy));
  vec3 norm = normalize(abs(vNormal));
  vec3 blendWeight = vec3(pow(norm.x, SHARPNESS), pow(norm.y, SHARPNESS), pow(norm.z, SHARPNESS));
  blendWeight /= (blendWeight.x + blendWeight.y + blendWeight.z);
  // Clamp to avoid bloom artifacts
  gl_FragColor.rgb = clamp(
    colorFront * blendWeight.z +
    colorSide * blendWeight.x +
    colorTop * blendWeight.y,
    0.0,
    2.0
  );
  gl_FragColor.a = 0.5;
}
`;

export class MatrixMaterial extends ShaderMaterial {
  static async load(loader: ImageBitmapLoader) {
    const [matrixFontImage, rgbaNoiseImage] = await Promise.all([
      loader.loadAsync(matrixFontTextureUrl),
      loader.loadAsync(rgbaNoiseTextureUrl),
    ]);

    const matrixFontTexture = new Texture(matrixFontImage as unknown as HTMLImageElement);
    matrixFontTexture.magFilter = LinearFilter;
    matrixFontTexture.minFilter = LinearMipmapLinearFilter;
    matrixFontTexture.wrapS = RepeatWrapping;
    matrixFontTexture.wrapT = RepeatWrapping;
    matrixFontTexture.flipY = false;
    matrixFontTexture.anisotropy = 16;
    matrixFontTexture.needsUpdate = true;

    const rgbaNoiseTexture = new Texture(rgbaNoiseImage as unknown as HTMLImageElement);
    rgbaNoiseTexture.magFilter = LinearFilter;
    rgbaNoiseTexture.minFilter = LinearMipmapLinearFilter;
    rgbaNoiseTexture.wrapS = RepeatWrapping;
    rgbaNoiseTexture.wrapT = RepeatWrapping;
    rgbaNoiseTexture.flipY = false;
    rgbaNoiseTexture.anisotropy = 16;
    rgbaNoiseTexture.needsUpdate = true;

    return new MatrixMaterial(matrixFontTexture, rgbaNoiseTexture);
  }

  isMatrixMaterial = true;

  constructor(matrixFontTexture: Texture, rgbaNoiseTexture: Texture) {
    super({
      uniforms: {
        time: { value: 0 },
        normalWorldMatrix: { value: new Matrix3() },
        textAtlasTexture: { value: matrixFontTexture },
        noiseTexture: { value: rgbaNoiseTexture },
      },
      defines: {
        DROP_LENGTH: "512.0",
        SCALE: "0.3",
        SHARPNESS: "10.0",
      },
      vertexShader,
      fragmentShader,
      depthWrite: false,
      transparent: true,
      blendSrcAlpha: OneFactor,
      blendDstAlpha: OneFactor,
      opacity: 0.5,
    });
  }

  // Should be called in mesh.onBeforeRender
  update(time: number, mesh: Mesh) {
    const normalWorldMatrix = this.uniforms.normalWorldMatrix.value as Matrix3;
    normalWorldMatrix.getNormalMatrix(mesh.matrixWorld);
    this.uniforms.time.value = time;
  }
}
