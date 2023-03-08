import { ShaderMaterial, Vector2, Vector3, WebGLRenderer } from "three";

/**
 * Adapted From: https://github.com/PatrickNausha/ThreeJS-Demos
 *
 * MIT License
 *
 * Copyright (c) 2021 Patrick Nausha
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 **/

const vertexShader = /* glsl */ `
#include <common>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform mat3 normalWorldMatrix;
uniform mat4 inverseViewMatrix;
uniform float time;
uniform float wiggleStrength;
uniform float wigglePeriod;
uniform float wiggleDuration;

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

  float viewSpaceY = (modelViewMatrix * vec4(position, 1.0)).y;
  float wiggleFactor = 0.0;
  if (fract(time / wigglePeriod) > 1.0 - wiggleDuration) {
    wiggleFactor = wiggleStrength;
  }
  float jitterScale = 25.0;
  float jitterSpeed = 80.0;
  float x = viewSpaceY * jitterScale + time * jitterSpeed;
  vec4 noiseShift = inverseViewMatrix * vec4(wiggleFactor * sin(x / 3.0) * sin(x / 13.0), 0.0, 0.0, 0.0);
  transformed = noiseShift.xyz / 7.0 + transformed;

  #include <project_vertex>
  #include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

  vNormal = normalize(transformedNormal);
}
`;

const fragmentShader = /* glsl */ `

#define PI 3.141592653589793
uniform float scanLineScale;
uniform float scanLineIntensity;
uniform float filmGrainIntensity;
uniform float time;
uniform float exposure;
uniform vec3 color;
uniform float opacity;
uniform vec2 resolution;
uniform float lightingIntensity;
uniform bool smoothStepLighting;
uniform float opacityJitterStrength;
uniform float opacityJitterSpeed;

#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying vec3 vNormal;

// Psuedo-random generator from https://thebookofshaders.com/10/
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
float getVerticalNoise(float verticalNoiseFrameRate, float verticalNoiseSpeed, float verticalNoiseScale) {
  float v = gl_FragCoord.y / resolution.y * verticalNoiseScale;
  float theta = (v + floor(time * verticalNoiseFrameRate) * verticalNoiseSpeed);
  float verticalNoiseStrength = 1.5;
  return pow(100.0, sin(theta) * sin(theta / 3.0) * sin(theta / 13.0)) / 100.0 * verticalNoiseStrength;
}

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>

  // Some basic Lambertian-ish reflectance.
  vec3 lightDirection = normalize(vec3(0.7, 0.5, 1.0));
  float diffuse = max(dot(vNormal, lightDirection), 0.0);
  if (smoothStepLighting)
    diffuse = smoothstep(0.0, 1.0, diffuse);
  diffuse *= lightingIntensity;
  // Use a "spikey" sine equation shifted by time for some moving glowing noise bars.
  float scanLineMultiplier = mix(1.0 - scanLineIntensity, 1.0, abs(sin(gl_FragCoord.y * scanLineScale * PI * 0.25)));
  float verticalNoise = getVerticalNoise(12.0, 2.0, 80.0) + getVerticalNoise(8.0, 1.0, 26.0);
  float brightness = diffuse + verticalNoise;
  
  float filmGrain = (2.0 * random(gl_FragCoord.xy / resolution + fract(time)) - 1.0) * filmGrainIntensity;
  vec3 fragColor = ((mix(color.xyz, vec3(0.1, 0.2, 1.0), brightness) * exposure) + filmGrain) * scanLineMultiplier;
  float theta = time * opacityJitterSpeed;
  float opacityJitter = (sin(theta) / 2.0 + 1.0) * opacityJitterStrength;
  gl_FragColor = vec4(fragColor, opacity - opacityJitter);
}
`;

export class HologramMaterial extends ShaderMaterial {
  isHologramMaterial = true;

  constructor(resolution: Vector2) {
    super({
      transparent: true,
      uniforms: {
        time: { value: 1.0 },
        scanLineScale: { value: 1.0 },
        scanLineIntensity: { value: 0.75 },
        color: { value: new Vector3(0.07, 0.07, 0.15) },
        lightingIntensity: { value: 3.5 },
        filmGrainIntensity: { value: 0.15 },
        resolution: { value: new Vector2().copy(resolution) },
        opacity: { value: 0.8 },
        opacityJitterStrength: { value: 0.05 },
        opacityJitterSpeed: { value: 40 },
        smoothStepLighting: { value: true },
        exposure: { value: 2.0 },
        wiggleStrength: { value: 2.0 },
        wigglePeriod: { value: 3.0 },
        wiggleDuration: { value: 0.1 },
      },
      vertexShader,
      fragmentShader,
      wireframe: true,
    });
  }

  update(time: number, renderer: WebGLRenderer) {
    this.uniforms.time.value = time;
    renderer.getSize(this.uniforms.resolution.value);
  }
}
