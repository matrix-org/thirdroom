[WebSG API](../README.md) / MatrixWidgetAPIErrorResponse

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

[packages/websg-types/types/websg.d.ts:2285](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2285)

___

### api

• **api**: ``"fromWidget"`` \| ``"toWidget"``

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[api](MatrixWidgetAPIResponse.md#api)

#### Defined in

[packages/websg-types/types/websg.d.ts:2283](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2283)

___

### data

• **data**: `unknown`

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[data](MatrixWidgetAPIResponse.md#data)

#### Defined in

[packages/websg-types/types/websg.d.ts:2287](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2287)

___

### requestId

• **requestId**: `string`

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[requestId](MatrixWidgetAPIResponse.md#requestid)

#### Defined in

[packages/websg-types/types/websg.d.ts:2284](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2284)

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

[packages/websg-types/types/websg.d.ts:2301](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2301)

___

### widgetId

• **widgetId**: `string`

#### Inherited from

[MatrixWidgetAPIResponse](MatrixWidgetAPIResponse.md).[widgetId](MatrixWidgetAPIResponse.md#widgetid)

#### Defined in

[packages/websg-types/types/websg.d.ts:2286](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2286)
