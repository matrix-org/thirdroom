# Web Scene Graph API

**NOTE: This is a draft spec of the WebSG API and is subject to change.**

The Web Scene Graph API (WebSG) is a WebAssembly and JavaScript API for scene graph manipulation in a sandboxed environment. It is designed to mirror the data structures defined by the glTF 2.0 specification and is intended to be used to add runtime behavior to these scenes. Just as the HTML DOM API added the ability for developers to interact with and manipulate HTML websites, the WebSG API allows you to interact with and manipulate 3D scenes.

[Third Room](https://thirdroom.io) is the first implementation of this API, but it is intended for use in any context where sandboxed scripting of 3D environments is desired.

## Example

The following is a JavaScript program using the WebSG API which finds a light in the provided scene and changes its color every frame:

```js
const directionalLight = WebSG.getLightByName("DirectionalLight");

let elapsed = 0;

onupdate = (dt) => {
  elapsed += dt;
  directionalLight.color[0] = (Math.sin(elapsed) + 1) / 2;
};
```

The same program can be written in C and compiled as a standalone WASM module:

```c
#include <math.h>
#include "websg.h"

Light *directionalLight;
float_t elapsed = 0;

export void initialize() {
  directionalLight = websg_get_light_by_name("DirectionalLight");
}


export void update(float_t dt) {
  elapsed += dt;
  directionalLight->color[0] = (sin(elapsed) + 1.0) / 2.0;
}
```

These examples (including a compiled version of the C example) are availiable in the [examples](https://github.com/matrix-org/thirdroom/tree/main/examples/) directory.

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

  export function getLightByName(name: string): Light | undefined;
}

declare const onupdate: ((dt: number) => void) | undefined;
```

## C API

```c
typedef enum  {
  Directional,
  Point,
  Spot,
} LightType;

typedef struct Light {
  const char *name;
  LightType type;
  float_t color[3];
  float_t intensity;
  float_t range;
  int cast_shadow;
  float_t inner_cone_angle;
  float_t outer_cone_angle;
} Light;

Light *websg_get_light_by_name(const char *name);
Light *websg_create_light(LightType type);
int websg_set_light_name(Light *light, const char *name);
int websg_dispose_light(Light *light);
```

## Usage in Third Room

Once you've created a world, go into the World Settings page and upload the JavaScript or WebAssembly file. It may currently require a refresh to run.
