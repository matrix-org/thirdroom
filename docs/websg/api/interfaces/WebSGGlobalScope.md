[WebSG API](../README.md) / WebSGGlobalScope

# Interface: WebSGGlobalScope

The global scope of a WebSG script. All scripts have access to these global properties.

**`Example`**

In the following example [world.findNodeByName](../classes/WebSG.World.md#findnodebyname) is used to
find [nodes](../classes/WebSG.Node.md) by their name defined in the associated glTF document.

[world.onload](../classes/WebSG.World.md#onload) and [world.onupdate](../classes/WebSG.World.md#onupdate)
are lifecycle methods that are called when the world is loaded and updated on each frame.
```js
world.onload = () => {
  const lightNode = world.findNodeByName("Light");

  const lightSwitch = world.findNodeByName("LightSwitch");
  lightSwitch.addInteractable();

  let lightOn = true;

  world.onupdate = (dt) => {
    if (lightSwitch.interactable.pressed) {
      lightOn = !lightOn;
      lightNode.light.intensity = lightOn ? 20 : 0;
    }
  };
};
```

## Table of contents

### Properties

- [WebSG](WebSGGlobalScope.md#websg)
- [console](WebSGGlobalScope.md#console)
- [matrix](WebSGGlobalScope.md#matrix)
- [network](WebSGGlobalScope.md#network)
- [thirdroom](WebSGGlobalScope.md#thirdroom)
- [world](WebSGGlobalScope.md#world)

## Properties

### WebSG

• `Readonly` **WebSG**: typeof [`WebSG`](../modules/WebSG.md)

Returns the [WebSG](../modules/WebSG.md) namespace with associated classes and constants.

#### Defined in

[packages/websg-types/types/websg.d.ts:2861](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2861)

___

### console

• `Readonly` **console**: `Console`

Returns the Console | console associated with the current script.
Used for logging messages to the browser's console.

#### Defined in

[packages/websg-types/types/websg.d.ts:2832](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2832)

___

### matrix

• `Readonly` **matrix**: [`MatrixWidgetAPI`](MatrixWidgetAPI.md)

Returns the [matrix ](MatrixWidgetAPI.md) instance associated with the current script.
Used for sending and receiving matrix events to and from the associated matrix room.

#### Defined in

[packages/websg-types/types/websg.d.ts:2850](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2850)

___

### network

• `Readonly` **network**: [`Network`](../classes/WebSGNetworking.Network.md)

Returns the [network ](../classes/WebSGNetworking.Network.md) instance associated with the current script.
Used for sending and receiving network messages to and from other peers in the room over WebRTC.

#### Defined in

[packages/websg-types/types/websg.d.ts:2856](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2856)

___

### thirdroom

• `Readonly` **thirdroom**: [`ThirdRoom`](../classes/ThirdRoom-1.md)

Returns the [thirdroom ](../classes/ThirdRoom-1.md) instance associated with the current script.
Used for ThirdRoom-specific properties/methods not available in the WebSG API.

#### Defined in

[packages/websg-types/types/websg.d.ts:2844](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2844)

___

### world

• `Readonly` **world**: [`World`](../classes/WebSG.World.md)

Returns the [world ](../classes/WebSG.World.md) associated with the current script.
Used for accessing the current world's scene graph and other world properties/methods.

#### Defined in

[packages/websg-types/types/websg.d.ts:2838](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2838)
