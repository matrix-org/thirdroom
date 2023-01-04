# MX_background

## Contributors

- Robert Long, The Matrix.org Foundation

## Status

Draft

## Dependencies

Written against the glTF 2.0 spec.

## Overview

This extension allows for adding equirectangular background textures or skyboxes to glTF scenes

## glTF Schema Updates

Usage of the extension must be listed in the `extensionsUsed` array:

```json
"extensionsUsed": [
  "MX_background"
]
```

The `MX_background` extension can be added to any `scene` property.

```json
"scenes": [
  {
    "extensions": {
      "MX_background": {
        "backgroundTexture": {
          "index": 0
        }
      }
    }
  }
]
```

The `backgroundTexture` property is a TextureInfo object which may include the `index` and `texCoord` properties. `texCoord` is optional and ignored by this extension. The referenced texture is expected to be an RGBM encoded equirectangular cubemap saved as a PNG or BasisU texture.

** NOTE: Third Room doesn't currently implement the backgroundTexture as RGBM. It ignores the alpha channel multiplier and needs to be updated to support it. **

### JSON Schema

[scene.MX_background.schema.json](./schema/scene.MX_background.schema.json)

## Known Implementations

- [Third Room](https://thirdroom.io)
- [Third Room Unity Exporter](https://github.com/matrix-org/thirdroom-unity-exporter)
