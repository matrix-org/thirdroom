# MX_portal

## Contributors

- Robert Long, The Matrix.org Foundation

## Status

DEPRECATED. Use [OMI_link](https://github.com/omigroup/gltf-extensions/tree/main/extensions/2.0/OMI_link) instead.

## Dependencies

Written against the glTF 2.0 spec.

## Overview

This extension allows for specifying the character controller to be used in an environment.

## glTF Schema Updates

Usage of the extension must be listed in the `extensionsUsed` array:

```json
"extensionsUsed": [
  "MX_character_controller"
]
```

The `MX_portal` extension can be added to any `node` property.

```json
"nodes": [
  {
    "extensions": {
      "MX_portal": {
        "uri": "matrix:r/terra-1:thirdroom.io"
      },
      "OMI_collider": {
        ...
      }
    }
  }
]
```

The `MX_portal` extension can be added to any `node` with a `OMI_collider` extension. The collider will be used with a raycaster on the character controller. The uri property supports `http://` `https://` and `matrix:` protocols. Interacting with the portal navigates your client to the resource referenced by the `uri`.

### JSON Schema

[node.MX_portal.schema.json](./schema/node.MX_portal.schema.json)

## Known Implementations

- [Third Room](https://thirdroom.io)
- [Third Room Unity Exporter](https://github.com/matrix-org/thirdroom-unity-exporter)
