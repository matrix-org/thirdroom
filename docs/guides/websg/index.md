# Web Scene Graph Overview

The Web Scene Graph API (WebSG) makes it possible to program portable virtual worlds. It is a WebAssembly and JavaScript API for scene graph manipulation in a sandboxed environment. WebSG is designed to mirror the data structures defined by the glTF 2.0 specification and is intended to be used to add runtime behavior to these scenes. Just as the HTML DOM API added the ability for developers to interact with and manipulate HTML websites, the WebSG API allows you to interact with and manipulate 3D scenes.

Third Room is the first implementation of this API, but it is intended for use in any context where sandboxed scripting of 3D environments is desired.

## Example

The following is a JavaScript program using the WebSG API which finds a light in the provided scene and changes its color every frame:

```js
world.onload = () => {
  const directionalLight = world.findLightByName("DirectionalLight");

  world.onupdate = (dt, time) => {
    directionalLight.color[0] = (Math.sin(time) + 1) / 2;
  };
};
```

The same program can be written in C and compiled as a standalone WASM module:

```c
#include <math.h>
#include "websg.h"

Light *directionalLight;

export void websg_load() {
  directionalLight = websg_world_find_light_by_name("DirectionalLight");
}

export void websg_update(float_t dt, float_t time) {
  websg_light_set_color_element(directionalLight, 0, (sin(time) + 1.0) / 2.0)
}
```

More examples are available in the [examples](https://github.com/matrix-org/thirdroom/tree/main/examples/) directory.

## JavaScript API Bindings

The WebSG JavaScript API is a thin wrapper around the WebAssembly API and uses the QuickJS JavaScript engine to execute Javascript code in a WebAssembly context.

[Read the JavaScript API Docs Here](../../websg-js/)

## WebSG C Headers

The C header files for the WebSG API are available [here](https://github.com/matrix-org/thirdroom/tree/main/src/engine/scripting/emscripten/src).

- websg.h: The main header file for the WebSG API
- websg-networking.h: Networking functions
- thirdroom.h: ThirdRoom specific extensions
- matrix.h: Matrix specific extensions

We'll be adding more documentation for C and other language bindings in the future. We're currently focused
on fully documenting the JS bindings and stabilizing the API. If you're interested in helping flesh out documentation for other languages, please reach out on [Matrix](https://matrix.to/#/#thirdroom-dev:matrix.org).

## Usage in Third Room

There are two ways to add a script to a world:

1. Open the in-world editor with tilde (`) and start editing the world's script
2. Upload the JavaScript or WebAssembly file on the world's settings page

If you're just getting started, we recommend checking out the [getting started tutorial series](./basketball/part-1) where you'll learn how to make a simple basketball game using the WebSG API.

## Usage in Other Applications

We're focused on building out a browser-based client in JavaScript, but we've seen a lot of interest in building out alternate clients in Godot, Unity, and Unreal. If you're interested in building a Third Room client or integrating the WebSG API into your own application, please reach out on [Matrix](https://matrix.to/#/#thirdroom-dev:matrix.org). There you'll find other like-minded people interested in building out the WebSG ecosystem.
