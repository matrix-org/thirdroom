# Web Scene Graph Overview

The Web Scene Graph API (WebSG) is a WebAssembly and JavaScript API for scene graph manipulation in a sandboxed environment. It is designed to mirror the data structures defined by the glTF 2.0 specification and is intended to be used to add runtime behavior to these scenes. Just as the HTML DOM API added the ability for developers to interact with and manipulate HTML websites, the WebSG API allows you to interact with and manipulate 3D scenes.

Third Room is the first implementation of this API, but it is intended for use in any context where sandboxed scripting of 3D environments is desired.

## Example

The following is a JavaScript program using the WebSG API which finds a light in the provided scene and changes its color every frame:

```js
const directionalLight = world.findLightByName("DirectionalLight");

let elapsed = 0;

world.onupdate = (dt, time) => {
  directionalLight.color[0] = (Math.sin(time) + 1) / 2;
};
```

The same program can be written in C and compiled as a standalone WASM module:

```c
#include <math.h>
#include "websg.h"

Light *directionalLight;
float_t elapsed = 0;

export void initialize() {
  directionalLight = websg_world_find_light_by_name("DirectionalLight");
}

export void update(float_t dt, float_t time) {
  directionalLight->color[0] = (sin(time) + 1.0) / 2.0;
}
```

More examples are available in the [examples](https://github.com/matrix-org/thirdroom/tree/main/examples/) directory.

## JS API

```ts
declare namespace WebSG {
  export class Light {
    constructor();
    name: string;
    type: number;
    readonly color: Float32Array;
    intensity: number;
    range: number;
    castShadow: boolean;
    innerConeAngle: number;
    outerConeAngle: number;
  }
}
```

## C API

```c
typedef enum LightType {
  LightType_Directional,
  LightType_Point,
  LightType_Spot,
} LightType;

typedef struct LightSpotProps {
  Extensions extensions;
  void *extras;
  float_t inner_cone_angle;
  float_t outer_cone_angle;
} LightSpotProps;

typedef struct LightProps {
  const char *name;
  Extensions extensions;
  void *extras;
  float_t color[3];
  float_t intensity;
  LightType type;
  float_t range;
  LightSpotProps spot;
} LightProps;

light_id_t websg_world_create_light(LightProps *props);
light_id_t websg_world_find_light_by_name(const char *name, uint32_t length);
int32_t websg_light_get_color(light_id_t light_id, float_t *color);
int32_t websg_light_set_color(light_id_t light_id, float_t *color);
float_t websg_light_get_color_element(light_id_t light_id, uint32_t index);
int32_t websg_light_set_color_element(light_id_t light_id, uint32_t index, float value);
float_t websg_light_get_intensity(light_id_t light_id);
int32_t websg_light_set_intensity(light_id_t light_id, float_t intensity);
```

## Usage in Third Room

There are two ways to add a script to a world:

1. Open the in-world editor with tilde (`) and start editing the world's script
2. Upload the JavaScript or WebAssembly file on the world's settings page
