# MX_postprocessing

## Contributors

- Robert Long, The Matrix.org Foundation

## Status

Draft

## Dependencies

Written against the glTF 2.0 spec.

## Overview

This extension allows for specifying postprocessing effects that should be used in an environment.

## glTF Schema Updates

Usage of the extension must be listed in the `extensionsUsed` array:

```json
"extensionsUsed": [
  "MX_postprocessing"
]
```

The `MX_postprocessing` extension can be added to any `scene` property.

```json
"scenes": [
  {
    "extensions": {
      "MX_postprocessing": {
        "bloom": {
          "strength": 0.5
        }
      }
    }
  }
]
```

Currently the only supported postprocessing effect is `bloom` which is an optional object that has one optional property `strength`. This value determines the bloom effect's strength. It is currently unbounded.

### JSON Schema

- [scene.MX_postprocessing.schema.json](./schema/scene.MX_postprocessing.schema.json)
- [bloom.schema.json](./schema/bloom.schema.json)

## Known Implementations

- [Third Room](https://thirdroom.io)
- [Third Room Unity Exporter](https://github.com/matrix-org/thirdroom-unity-exporter)
