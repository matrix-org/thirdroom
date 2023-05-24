# MatrixWidgetAPIErrorResponse

**`Interface`**

MatrixWidgetAPIErrorResponse interface represents an error response to a Matrix widget API request.

**Source:** [websg.d.ts:2722](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2722)

## Hierarchy

- [`MatrixWidgetAPIResponse`](interface.MatrixWidgetAPIResponse.md).**`MatrixWidgetAPIErrorResponse`**

## Properties

### action

> **action**: `string`

**Source:** [websg.d.ts:2707](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2707)

#### Inherited from

[`MatrixWidgetAPIResponse`](interface.MatrixWidgetAPIResponse.md).[`action`](interface.MatrixWidgetAPIResponse.md#action)

### api

> **api**: "fromWidget" \| "toWidget"

**Source:** [websg.d.ts:2705](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2705)

#### Inherited from

[`MatrixWidgetAPIResponse`](interface.MatrixWidgetAPIResponse.md).[`api`](interface.MatrixWidgetAPIResponse.md#api)

### data

> **data**: `unknown`

**Source:** [websg.d.ts:2709](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2709)

#### Inherited from

[`MatrixWidgetAPIResponse`](interface.MatrixWidgetAPIResponse.md).[`data`](interface.MatrixWidgetAPIResponse.md#data)

### requestId

> **requestId**: `string`

**Source:** [websg.d.ts:2706](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2706)

#### Inherited from

[`MatrixWidgetAPIResponse`](interface.MatrixWidgetAPIResponse.md).[`requestId`](interface.MatrixWidgetAPIResponse.md#requestid)

### response

> **response**: `object`

**Source:** [websg.d.ts:2723](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2723)

#### Type declaration (response)

> > **error**: `object`
>
> **Source:** [websg.d.ts:2724](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2724)
>
> ##### Type declaration (error)
>
> > > **message**: `string`
> >
> > **Source:** [websg.d.ts:2725](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2725)

#### Overrides

[`MatrixWidgetAPIResponse`](interface.MatrixWidgetAPIResponse.md).[`response`](interface.MatrixWidgetAPIResponse.md#response)

### widgetId

> **widgetId**: `string`

**Source:** [websg.d.ts:2708](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2708)

#### Inherited from

[`MatrixWidgetAPIResponse`](interface.MatrixWidgetAPIResponse.md).[`widgetId`](interface.MatrixWidgetAPIResponse.md#widgetid)
