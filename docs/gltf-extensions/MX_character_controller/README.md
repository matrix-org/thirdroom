# MX_character_controller

## Contributors

- Robert Long, The Matrix.org Foundation

## Status

Draft

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

The `MX_character_controller` extension can be added to any `scene` property.

```json
"scenes": [
  {
    "extensions": {
      "MX_character_controller": {
        "type": "first-person"
      }
    }
  }
]
```

The character controller `type` can be set to `first-person` or `fly`. Using `first-person` will spawn the player with a first person character controller with gravity and collision. The `fly` value spawns you with a first person flying character controller where you move forward in the direction that you are looking and no gravity is applied. Implementations can choose exactly how this character controller works. It's intended as a hint as to how you might navigate this scene.

### JSON Schema

[scene.MX_character_controller.schema.json](./schema/scene.MX_character_controller.schema.json)

## Known Implementations

- [Third Room](https://thirdroom.io)
- [Third Room Unity Exporter](https://github.com/matrix-org/thirdroom-unity-exporter)
