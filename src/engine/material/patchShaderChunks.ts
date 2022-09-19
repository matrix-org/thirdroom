import { ShaderChunk } from "three";

export default function patchShaderChunks() {
  /**
   * Reserve uv2 for lightmaps by remapping AO to use the first uv set.
   *
   * TODO: Make uv set indices for each texture configurable via defines so that glTFs
   * can define texCoord on a per-texture basis.
   **/

  // These preprocessor strings are the same for the next 3 replacements so reuse them
  const uv2SearchString = "#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )";
  const uv2ReplacementString = "#if defined( USE_LIGHTMAP )";

  // Only define vUv2 in the vertex shader if we're using a lightmap
  ShaderChunk.uv2_pars_vertex = ShaderChunk.uv2_pars_vertex.replace(uv2SearchString, uv2ReplacementString);

  // Only define vUv2 in the fragment shader if we're using a lightmap
  ShaderChunk.uv2_pars_fragment = ShaderChunk.uv2_pars_fragment.replace(uv2SearchString, uv2ReplacementString);

  // Only transform uv2 when we're using a lightmap
  ShaderChunk.uv2_vertex = ShaderChunk.uv2_vertex.replace(uv2SearchString, uv2ReplacementString);

  // Use lightMapTransform for the uniform name instead of uv2Transform so we can set it ourselves instead
  // of the WebGLRenderer always using the aoMap's texture transform
  ShaderChunk.uv2_pars_vertex = ShaderChunk.uv2_pars_vertex.replace(
    "uniform mat3 uv2Transform;",
    `
    #ifdef USE_INSTANCING
      attribute vec2 lightMapOffset;
      attribute vec2 lightMapScale;
    #else
      uniform mat3 lightMapTransform;
    #endif
    `
  );

  ShaderChunk.uv2_vertex = ShaderChunk.uv2_vertex.replace(
    "vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;",
    `
    #ifdef USE_INSTANCING
      vUv2 = uv2 * lightMapScale + lightMapOffset;
    #else
      vUv2 = ( lightMapTransform * vec3( uv2, 1 ) ).xy;
    #endif
    `
  );

  // Use vUv for aoMap
  ShaderChunk.aomap_fragment = ShaderChunk.aomap_fragment.replace(
    "texture2D( aoMap, vUv2 )",
    "texture2D( aoMap, vUv )"
  );

  // Disable envMap irradiance contribution when using a lightmap
  ShaderChunk.lights_fragment_maps = ShaderChunk.lights_fragment_maps.replace(
    "#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )",
    "#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV ) && !defined(USE_LIGHTMAP)"
  );

  // Decode Unity's RGBM lightmaps which are encoded in non-linear space
  // https://blog.karthisoftek.com/a?ID=00700-75580c91-4379-46bf-8797-cfdad5dcbc6f
  ShaderChunk.lights_fragment_maps = ShaderChunk.lights_fragment_maps.replace(
    "vec4 lightMapTexel = texture2D( lightMap, vUv2 );",
    `
    vec4 lightMapTexel = texture2D( lightMap, vUv2 );
    lightMapTexel.rgb = 34.49 * pow(lightMapTexel.a, 2.2) * lightMapTexel.rgb;
    lightMapTexel.a = 1.0;
    `
  );

  // Add envMap2 and envMapMix for supporting reflection probes and blending between them
  ShaderChunk.uv2_pars_vertex = ShaderChunk.uv2_pars_vertex.replace(
    "#if defined( USE_LIGHTMAP )",
    `
    #if defined( USE_ENVMAP ) && defined( USE_INSTANCING ) && defined( USE_REFLECTION_PROBES )
      attribute vec3 instanceReflectionProbeParams;
      varying vec3 vInstanceReflectionProbeParams;
    #endif

    #if defined( USE_LIGHTMAP )
    `
  );

  ShaderChunk.uv2_vertex = ShaderChunk.uv2_vertex.replace(
    "#if defined( USE_LIGHTMAP )",
    `
    #if defined( USE_ENVMAP ) && defined( USE_INSTANCING ) && defined( USE_REFLECTION_PROBES )
      vInstanceReflectionProbeParams = instanceReflectionProbeParams;
    #endif

    #if defined( USE_LIGHTMAP )
    `
  );

  ShaderChunk.envmap_common_pars_fragment = ShaderChunk.envmap_common_pars_fragment.replace(
    "uniform sampler2D envMap;",
    `uniform sampler2D envMap;

    #ifdef USE_REFLECTION_PROBES
      uniform mediump sampler2DArray reflectionProbesMap;
      uniform vec3 reflectionProbeSampleParams;

      #ifdef USE_INSTANCING
        varying vec3 vInstanceReflectionProbeParams;
      #else
        uniform vec3 reflectionProbeParams;
      #endif
    #endif
    `
  );

  // getIBLIrradiance
  ShaderChunk.envmap_physical_pars_fragment = ShaderChunk.envmap_physical_pars_fragment.replace(
    "vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );",
    `
    #ifdef USE_REFLECTION_PROBES
      #ifdef USE_INSTANCING
        vec4 envMapColor = mix(
          textureCubeUVArray( reflectionProbesMap, vInstanceReflectionProbeParams.x, reflectionProbeSampleParams, worldNormal, 1.0 ),
          textureCubeUVArray( reflectionProbesMap, vInstanceReflectionProbeParams.y, reflectionProbeSampleParams, worldNormal, 1.0 ),
          vInstanceReflectionProbeParams.z
        );
      #else
        vec4 envMapColor = mix(
          textureCubeUVArray( reflectionProbesMap, reflectionProbeParams.x, reflectionProbeSampleParams, worldNormal, 1.0 ),
          textureCubeUVArray( reflectionProbesMap, reflectionProbeParams.y, reflectionProbeSampleParams, worldNormal, 1.0 ),
          reflectionProbeParams.z
        );
      #endif
    #else
      vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
    #endif
    `
  );

  // getIBLRadiance
  ShaderChunk.envmap_physical_pars_fragment = ShaderChunk.envmap_physical_pars_fragment.replace(
    "vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );",
    `
    #ifdef USE_REFLECTION_PROBES
      #ifdef USE_INSTANCING
        vec4 envMapColor = mix(
          textureCubeUVArray( reflectionProbesMap, vInstanceReflectionProbeParams.x, reflectionProbeSampleParams, reflectVec, roughness ),
          textureCubeUVArray( reflectionProbesMap, vInstanceReflectionProbeParams.y, reflectionProbeSampleParams, reflectVec, roughness ),
          vInstanceReflectionProbeParams.z
        );
      #else
        vec4 envMapColor = mix(
          textureCubeUVArray( reflectionProbesMap, reflectionProbeParams.x, reflectionProbeSampleParams, reflectVec, roughness ),
          textureCubeUVArray( reflectionProbesMap, reflectionProbeParams.y, reflectionProbeSampleParams, reflectVec, roughness ),
          reflectionProbeParams.z
        );
      #endif
    #else
      vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
    #endif
    `
  );

  // Cascaded Shadow Maps (CSM)
  ShaderChunk.lights_fragment_begin = ShaderChunk.lights_fragment_begin.replace(
    "#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )",
    `#if ( NUM_DIR_LIGHTS > 0) && defined( RE_Direct ) && defined( USE_CSM ) && defined( CSM_CASCADES )

      DirectionalLight directionalLight;

      #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
        DirectionalLightShadow directionalLightShadow;

        float linearDepth = (vViewPosition.z) / (shadowFar - cameraNear);

        vec2 cascade;
        float cascadeCenter;
        float closestEdge;
        float margin;
        float csmx;
        float csmy;

        #pragma unroll_loop_start
        for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
          directionalLight = directionalLights[ i ];
          getDirectionalLightInfo( directionalLight, geometry, directLight );

          #if ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
            // NOTE: Depth gets larger away from the camera.
            // cascade.x is closer, cascade.y is further
            cascade = CSM_cascades[ i ];
            cascadeCenter = ( cascade.x + cascade.y ) / 2.0;
            closestEdge = linearDepth < cascadeCenter ? cascade.x : cascade.y;
            margin = 0.25 * pow( closestEdge, 2.0 );
            csmx = cascade.x - margin / 2.0;
            csmy = cascade.y + margin / 2.0;

            if( linearDepth >= csmx && ( linearDepth < csmy || UNROLLED_LOOP_INDEX == CSM_CASCADES - 1 ) ) {
              float dist = min( linearDepth - csmx, csmy - linearDepth );
              float ratio = clamp( dist / margin, 0.0, 1.0 );
              vec3 prevColor = directLight.color;
              directionalLightShadow = directionalLightShadows[ i ];
              directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
              bool shouldFadeLastCascade = UNROLLED_LOOP_INDEX == CSM_CASCADES - 1 && linearDepth > cascadeCenter;
              directLight.color = mix( prevColor, directLight.color, shouldFadeLastCascade ? ratio : 1.0 );
              ReflectedLight prevLight = reflectedLight;
              RE_Direct( directLight, geometry, material, reflectedLight );
              bool shouldBlend = UNROLLED_LOOP_INDEX != CSM_CASCADES - 1 || UNROLLED_LOOP_INDEX == CSM_CASCADES - 1 && linearDepth < cascadeCenter;
              float blendRatio = shouldBlend ? ratio : 1.0;
              reflectedLight.directDiffuse = mix( prevLight.directDiffuse, reflectedLight.directDiffuse, blendRatio );
              reflectedLight.directSpecular = mix( prevLight.directSpecular, reflectedLight.directSpecular, blendRatio );
              reflectedLight.indirectDiffuse = mix( prevLight.indirectDiffuse, reflectedLight.indirectDiffuse, blendRatio );
              reflectedLight.indirectSpecular = mix( prevLight.indirectSpecular, reflectedLight.indirectSpecular, blendRatio );
            }
          #endif
        }
        #pragma unroll_loop_end

        #if ( NUM_DIR_LIGHTS > NUM_DIR_LIGHT_SHADOWS)
          // compute the lights not casting shadows (if any)
          #pragma unroll_loop_start
          for ( int i = NUM_DIR_LIGHT_SHADOWS; i < NUM_DIR_LIGHTS; i ++ ) {
            directionalLight = directionalLights[ i ];
            getDirectionalLightInfo( directionalLight, geometry, directLight );
            RE_Direct( directLight, geometry, material, reflectedLight );
          }
          #pragma unroll_loop_end
        #endif

      #endif

    #elif ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
    `
  );

  ShaderChunk.lights_pars_begin =
    `
    #if defined( USE_CSM ) && defined( CSM_CASCADES )
      uniform vec2 CSM_cascades[CSM_CASCADES];
      uniform float cameraNear;
      uniform float shadowFar;
    #endif
    ` + ShaderChunk.lights_pars_begin;
}
