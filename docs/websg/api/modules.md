[Exports](modules.md)

# WebSG Exports

## Table of contents

### Namespaces

- [WebSG](modules/WebSG.md)

### Interfaces

- [Console](interfaces/Console.md)
- [MatrixWidgetAPI](interfaces/MatrixWidgetAPI.md)
- [MatrixWidgetAPIErrorResponse](interfaces/MatrixWidgetAPIErrorResponse.md)
- [MatrixWidgetAPIRequest](interfaces/MatrixWidgetAPIRequest.md)
- [MatrixWidgetAPIResponse](interfaces/MatrixWidgetAPIResponse.md)
- [ThirdRoom](interfaces/ThirdRoom.md)
- [WebSGNetworking](interfaces/WebSGNetworking.md)

### Type Aliases

- [MatrixAPIMessage](modules.md#matrixapimessage)

### Variables

- [onenterworld](modules.md#onenterworld)
- [onloadworld](modules.md#onloadworld)
- [onupdateworld](modules.md#onupdateworld)

## Type Aliases

### MatrixAPIMessage

Ƭ **MatrixAPIMessage**: [`MatrixWidgetAPIRequest`](interfaces/MatrixWidgetAPIRequest.md) \| [`MatrixWidgetAPIResponse`](interfaces/MatrixWidgetAPIResponse.md) \| [`MatrixWidgetAPIErrorResponse`](interfaces/MatrixWidgetAPIErrorResponse.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2168](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2168)

## Variables

### onenterworld

• **onenterworld**: () => `any` \| `null`

Called when the user enters the world.

**`Global`**

onenterworld

#### Defined in

[packages/websg-types/types/websg.d.ts:2033](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2033)

---

### onloadworld

• **onloadworld**: () => `any` \| `null`

Called when the world is loaded.

**`Global`**

onloadworld

#### Defined in

[packages/websg-types/types/websg.d.ts:2027](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2027)

---

### onupdateworld

• **onupdateworld**: (`dt`: `number`, `time`: `number`) => `any` \| `null`

Called when the world is updated.

**`Global`**

onupdateworld

**`Param`**

The time since the last update in seconds.

**`Param`**

The total time since the start of the world in seconds.

#### Defined in

[packages/websg-types/types/websg.d.ts:2041](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2041)
