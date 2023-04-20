[websg-types](../README.md) / [Exports](../modules.md) / MatrixWidgetAPIErrorResponse

# Interface: MatrixWidgetAPIErrorResponse

MatrixWidgetAPIErrorResponse interface represents an error response to a Matrix widget API request.

## Hierarchy

- [`MatrixWidgetAPIResponse`](MatrixWidgetAPIResponse.md)

  ↳ **`MatrixWidgetAPIErrorResponse`**

## Table of contents

### Properties

- [action](MatrixWidgetAPIErrorResponse.md#action)
- [api](MatrixWidgetAPIErrorResponse.md#api)
- [data](MatrixWidgetAPIErrorResponse.md#data)
- [requestId](MatrixWidgetAPIErrorResponse.md#requestid)
- [response](MatrixWidgetAPIErrorResponse.md#response)
- [widgetId](MatrixWidgetAPIErrorResponse.md#widgetid)

## Properties

### action

• **action**: `string`

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[action](MatrixWidgetAPIResponse.md#action)

#### Defined in

[packages/websg-types/types/websg.d.ts:2145](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2145)

___

### api

• **api**: ``"fromWidget"`` \| ``"toWidget"``

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[api](MatrixWidgetAPIResponse.md#api)

#### Defined in

[packages/websg-types/types/websg.d.ts:2143](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2143)

___

### data

• **data**: `unknown`

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[data](MatrixWidgetAPIResponse.md#data)

#### Defined in

[packages/websg-types/types/websg.d.ts:2147](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2147)

___

### requestId

• **requestId**: `string`

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[requestId](MatrixWidgetAPIResponse.md#requestid)

#### Defined in

[packages/websg-types/types/websg.d.ts:2144](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2144)

___

### response

• **response**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `error` | { `message`: `string`  } |
| `error.message` | `string` |

#### Overrides

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[response](MatrixWidgetAPIResponse.md#response)

#### Defined in

[packages/websg-types/types/websg.d.ts:2161](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2161)

___

### widgetId

• **widgetId**: `string`

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[widgetId](MatrixWidgetAPIResponse.md#widgetid)

#### Defined in

[packages/websg-types/types/websg.d.ts:2146](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2146)
