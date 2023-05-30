# MX_lightmap

## Contributors

- Robert Long, The Matrix.org Foundation

## Status

Draft

## Dependencies

Written against the glTF 2.0 spec.

## Overview

This extension allows for adding lightmaps to nodes with meshes.

## glTF Schema Updates

Usage of the extension must be listed in the `extensionsUsed` array:

```json
"extensionsUsed": [
  "MX_lightmap"
]
```

The `MX_lightmap` extension can be added to any `node` property with a `mesh`.

```json
"nodes": [
  {
    "mesh": 0,
    "extensions": {
      "MX_lightmap": {
        "lightMapTexture": {
          "index": 0,
          "texCoord": 1
        },
        "scale": [0.5, 0.5],
        "offset": [0.5, 0.5],
        "intensity": 1.0
      }
    }
  }
]
```

`lightMapTexture` is a `TextureInfo` object. The `texCoord` should always be set to `1` (the second UV set). If it is not provided, it will be automatically set to `1`, however for forwards compatibility, it should always be set. The lightmap should be RGBM encoded and use a format that supports alpha (PNG/BASISU).

The lightmap texture's color is decoded with the following shader code:

```glsl
vec4 lightMapTexel = texture2D( lightMap, vUv2 );
lightMapTexel.rgb = 34.49 * pow(lightMapTexel.a, 2.2) * lightMapTexel.rgb;
lightMapTexel.a = 1.0;
```

`scale` and `offset` are the meshes' UV scale and offset into the provided `lightMapTexture` if they are not defined they are assumed to be `(1, 1)` and `(0, 0)` respectively.

`intensity` is a multiplier which determines how emissive the lightmap is.

When used with the `EXT_mesh_gpu_instancing` extension:

```json
"nodes": [
  {
    "mesh": 0,
    "extensions": {
      "MX_lightmap": {
        "lightMapTexture": {
          "index": 0,
          "texCoord": 1
        },
        "intensity": 1.0
      },
      "EXT_mesh_gpu_instancing": {
        "attributes": {
          "TRANSLATION": 0,
          "ROTATION": 1,
          "SCALE": 2,
          "_LIGHTMAP_SCALE": 3,
          "_LIGHTMAP_OFFSET": 4
        }
      }
    }
  }
]
```

`_LIGHTMAP_SCALE` and `_LIGHTMAP_OFFSET` are references to accessors containing Vec2 elements for each instance's UV scale / offset into the referenced `lightMapTexture`. The `scale` and `offset` properties on the `MX_lightmap` object will be ignored if provided.

### JSON Schema

[node.MX_lightmap.schema.json](./schema/node.MX_lightmap.schema.json)

## Known Implementations

- [Third Room](https://thirdroom.io)
- [Third Room Unity Exporter](https://github.com/matrix-org/thirdroom-unity-exporter)
