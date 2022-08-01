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

  // Use vUv for aoMap
  ShaderChunk.aomap_fragment = ShaderChunk.aomap_fragment.replace(
    "texture2D( aoMap, vUv2 )",
    "texture2D( aoMap, vUv )"
  );
}
