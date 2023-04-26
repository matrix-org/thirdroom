[websg-types](../README.md) / [Exports](../modules.md) / [WebSG](../modules/WebSG.md) / UIElement

# Class: UIElement

[WebSG](../modules/WebSG.md).UIElement

Class representing a user interface element.

## Hierarchy

- [`UIElementBase`](../interfaces/WebSG.UIElementBase.md)

- [`UIElementProps`](../interfaces/WebSG.UIElementProps.md)

  ↳ **`UIElement`**

  ↳↳ [`UIButton`](WebSG.UIButton.md)

  ↳↳ [`UIText`](WebSG.UIText.md)

## Table of contents

### Constructors

- [constructor](WebSG.UIElement.md#constructor)

### Properties

- [backgroundColor](WebSG.UIElement.md#backgroundcolor)
- [borderColor](WebSG.UIElement.md#bordercolor)
- [borderRadius](WebSG.UIElement.md#borderradius)
- [borderWidth](WebSG.UIElement.md#borderwidth)
- [margin](WebSG.UIElement.md#margin)
- [padding](WebSG.UIElement.md#padding)
- [parent](WebSG.UIElement.md#parent)
- [type](WebSG.UIElement.md#type)

### Accessors

- [alignContent](WebSG.UIElement.md#aligncontent)
- [alignItems](WebSG.UIElement.md#alignitems)
- [alignSelf](WebSG.UIElement.md#alignself)
- [bottom](WebSG.UIElement.md#bottom)
- [flexBasis](WebSG.UIElement.md#flexbasis)
- [flexDirection](WebSG.UIElement.md#flexdirection)
- [flexGrow](WebSG.UIElement.md#flexgrow)
- [flexShrink](WebSG.UIElement.md#flexshrink)
- [flexWrap](WebSG.UIElement.md#flexwrap)
- [height](WebSG.UIElement.md#height)
- [justifyContent](WebSG.UIElement.md#justifycontent)
- [left](WebSG.UIElement.md#left)
- [maxHeight](WebSG.UIElement.md#maxheight)
- [maxWidth](WebSG.UIElement.md#maxwidth)
- [minHeight](WebSG.UIElement.md#minheight)
- [minWidth](WebSG.UIElement.md#minwidth)
- [position](WebSG.UIElement.md#position)
- [right](WebSG.UIElement.md#right)
- [top](WebSG.UIElement.md#top)
- [width](WebSG.UIElement.md#width)

### Methods

- [addChild](WebSG.UIElement.md#addchild)
- [children](WebSG.UIElement.md#children)
- [getChild](WebSG.UIElement.md#getchild)
- [removeChild](WebSG.UIElement.md#removechild)
- [setBorderColor](WebSG.UIElement.md#setbordercolor)
- [setColor](WebSG.UIElement.md#setcolor)

## Constructors

### constructor

• **new UIElement**()

#### Inherited from

UIElementBase.constructor

## Properties

### backgroundColor

• `Readonly` **backgroundColor**: [`RGBA`](WebSG.RGBA.md)

Readonly RGBA object representing the background color of the UI element.

#### Inherited from

[UIElementProps](../interfaces/WebSG.UIElementProps.md).[backgroundColor](../interfaces/WebSG.UIElementProps.md#backgroundcolor)

#### Defined in

[packages/websg-types/types/websg.d.ts:1594](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1594)

___

### borderColor

• `Readonly` **borderColor**: [`RGBA`](WebSG.RGBA.md)

Readonly RGBA object representing the border color of the UI element.

#### Inherited from

[UIElementProps](../interfaces/WebSG.UIElementProps.md).[borderColor](../interfaces/WebSG.UIElementProps.md#bordercolor)

#### Defined in

[packages/websg-types/types/websg.d.ts:1600](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1600)

___

### borderRadius

• `Readonly` **borderRadius**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the border radius of the UI element.

#### Inherited from

[UIElementProps](../interfaces/WebSG.UIElementProps.md).[borderRadius](../interfaces/WebSG.UIElementProps.md#borderradius)

#### Defined in

[packages/websg-types/types/websg.d.ts:1624](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1624)

___

### borderWidth

• `Readonly` **borderWidth**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the border width of the UI element.

#### Inherited from

[UIElementProps](../interfaces/WebSG.UIElementProps.md).[borderWidth](../interfaces/WebSG.UIElementProps.md#borderwidth)

#### Defined in

[packages/websg-types/types/websg.d.ts:1618](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1618)

___

### margin

• `Readonly` **margin**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the margin of the UI element.

#### Inherited from

[UIElementProps](../interfaces/WebSG.UIElementProps.md).[margin](../interfaces/WebSG.UIElementProps.md#margin)

#### Defined in

[packages/websg-types/types/websg.d.ts:1612](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1612)

___

### padding

• `Readonly` **padding**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the padding of the UI element.

#### Inherited from

[UIElementProps](../interfaces/WebSG.UIElementProps.md).[padding](../interfaces/WebSG.UIElementProps.md#padding)

#### Defined in

[packages/websg-types/types/websg.d.ts:1606](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1606)

___

### parent

• **parent**: ``null`` \| [`UIElement`](WebSG.UIElement.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:457](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L457)

___

### type

• **type**: `string`

#### Defined in

[src/engine/scripting/websg-api.d.ts:458](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L458)

## Accessors

### alignContent

• `get` **alignContent**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-content property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-content value of the UI element.

#### Inherited from

UIElementProps.alignContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1376](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1376)

• `set` **alignContent**(`value`): `void`

Sets the align-content property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-content value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.alignContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1382](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1382)

___

### alignItems

• `get` **alignItems**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-items property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-items value of the UI element.

#### Inherited from

UIElementProps.alignItems

#### Defined in

[packages/websg-types/types/websg.d.ts:1388](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1388)

• `set` **alignItems**(`value`): `void`

Sets the align-items property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-items value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.alignItems

#### Defined in

[packages/websg-types/types/websg.d.ts:1394](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1394)

___

### alignSelf

• `get` **alignSelf**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-self property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-self value of the UI element.

#### Inherited from

UIElementProps.alignSelf

#### Defined in

[packages/websg-types/types/websg.d.ts:1400](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1400)

• `set` **alignSelf**(`value`): `void`

Sets the align-self property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-self value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.alignSelf

#### Defined in

[packages/websg-types/types/websg.d.ts:1406](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1406)

___

### bottom

• `get` **bottom**(): `number`

Gets the bottom position of the UI element.

#### Returns

`number`

The bottom position value of the UI element.

#### Inherited from

UIElementProps.bottom

#### Defined in

[packages/websg-types/types/websg.d.ts:1352](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1352)

• `set` **bottom**(`value`): `void`

Sets the bottom position of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new bottom position value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.bottom

#### Defined in

[packages/websg-types/types/websg.d.ts:1358](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1358)

___

### flexBasis

• `get` **flexBasis**(): `number`

Gets the flex basis property of the UI element.

#### Returns

`number`

The flex basis property value.

#### Inherited from

UIElementProps.flexBasis

#### Defined in

[packages/websg-types/types/websg.d.ts:1436](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1436)

• `set` **flexBasis**(`value`): `void`

Sets the flex basis property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new flex basis property value. |

#### Returns

`void`

#### Inherited from

UIElementProps.flexBasis

#### Defined in

[packages/websg-types/types/websg.d.ts:1442](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1442)

___

### flexDirection

• `get` **flexDirection**(): [`FlexDirection`](../enums/WebSG.FlexDirection.md)

Gets the flex-direction property of the UI element.

#### Returns

[`FlexDirection`](../enums/WebSG.FlexDirection.md)

The flex-direction value of the UI element.

#### Inherited from

UIElementProps.flexDirection

#### Defined in

[packages/websg-types/types/websg.d.ts:1412](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1412)

• `set` **flexDirection**(`value`): `void`

Sets the flex-direction property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexDirection`](../enums/WebSG.FlexDirection.md) | The new flex-direction value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.flexDirection

#### Defined in

[packages/websg-types/types/websg.d.ts:1418](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1418)

___

### flexGrow

• `get` **flexGrow**(): `number`

Gets the flex grow property of the UI element.

#### Returns

`number`

The flex grow property value.

#### Inherited from

UIElementProps.flexGrow

#### Defined in

[packages/websg-types/types/websg.d.ts:1448](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1448)

• `set` **flexGrow**(`value`): `void`

Sets the flex grow property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new flex grow property value. |

#### Returns

`void`

#### Inherited from

UIElementProps.flexGrow

#### Defined in

[packages/websg-types/types/websg.d.ts:1454](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1454)

___

### flexShrink

• `get` **flexShrink**(): `number`

Gets the flex shrink property of the UI element.

#### Returns

`number`

The flex shrink property value.

#### Inherited from

UIElementProps.flexShrink

#### Defined in

[packages/websg-types/types/websg.d.ts:1460](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1460)

• `set` **flexShrink**(`value`): `void`

Sets the flex shrink property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new flex shrink property value. |

#### Returns

`void`

#### Inherited from

UIElementProps.flexShrink

#### Defined in

[packages/websg-types/types/websg.d.ts:1466](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1466)

___

### flexWrap

• `get` **flexWrap**(): [`FlexWrap`](../enums/WebSG.FlexWrap.md)

Gets the flex wrap property of the UI element.

#### Returns

[`FlexWrap`](../enums/WebSG.FlexWrap.md)

The flex wrap property value.

#### Inherited from

UIElementProps.flexWrap

#### Defined in

[packages/websg-types/types/websg.d.ts:1424](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1424)

• `set` **flexWrap**(`value`): `void`

Sets the flex wrap property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexWrap`](../enums/WebSG.FlexWrap.md) | The new flex wrap property value. |

#### Returns

`void`

#### Inherited from

UIElementProps.flexWrap

#### Defined in

[packages/websg-types/types/websg.d.ts:1430](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1430)

___

### height

• `get` **height**(): `number`

Gets the height of the UI element.

#### Returns

`number`

The height of the UI element.

#### Inherited from

UIElementProps.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1496](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1496)

• `set` **height**(`value`): `void`

Sets the height of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new height of the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1502](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1502)

___

### justifyContent

• `get` **justifyContent**(): [`FlexJustify`](../enums/WebSG.FlexJustify.md)

Gets the justify content property of the UI element.

#### Returns

[`FlexJustify`](../enums/WebSG.FlexJustify.md)

The justify content property value.

#### Inherited from

UIElementProps.justifyContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1472](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1472)

• `set` **justifyContent**(`value`): `void`

Sets the justify content property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexJustify`](../enums/WebSG.FlexJustify.md) | The new justify content property value. |

#### Returns

`void`

#### Inherited from

UIElementProps.justifyContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1478](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1478)

___

### left

• `get` **left**(): `number`

Gets the left position of the UI element.

#### Returns

`number`

The left position value of the UI element.

#### Inherited from

UIElementProps.left

#### Defined in

[packages/websg-types/types/websg.d.ts:1364](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1364)

• `set` **left**(`value`): `void`

Sets the left position of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new left position value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.left

#### Defined in

[packages/websg-types/types/websg.d.ts:1370](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1370)

___

### maxHeight

• `get` **maxHeight**(): `number`

Gets the maximum height of the UI element.

#### Returns

`number`

The maximum height of the UI element.

#### Inherited from

UIElementProps.maxHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1544](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1544)

• `set` **maxHeight**(`value`): `void`

Sets the maximum height of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new maximum height of the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.maxHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1550](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1550)

___

### maxWidth

• `get` **maxWidth**(): `number`

Gets the maximum width of the UI element.

#### Returns

`number`

The maximum width of the UI element.

#### Inherited from

UIElementProps.maxWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1532](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1532)

• `set` **maxWidth**(`value`): `void`

Sets the maximum width of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new maximum width of the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.maxWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1538](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1538)

___

### minHeight

• `get` **minHeight**(): `number`

Gets the minimum height of the UI element.

#### Returns

`number`

The minimum height of the UI element.

#### Inherited from

UIElementProps.minHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1520](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1520)

• `set` **minHeight**(`value`): `void`

Sets the minimum height of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new minimum height of the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.minHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1526](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1526)

___

### minWidth

• `get` **minWidth**(): `number`

Gets the minimum width of the UI element.

#### Returns

`number`

The minimum width of the UI element.

#### Inherited from

UIElementProps.minWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1508](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1508)

• `set` **minWidth**(`value`): `void`

Sets the minimum width of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new minimum width of the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.minWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1514](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1514)

___

### position

• `get` **position**(): [`ElementPositionType`](../enums/WebSG.ElementPositionType.md)

Gets the position of the UI element.

#### Returns

[`ElementPositionType`](../enums/WebSG.ElementPositionType.md)

The position type of the UI element.

#### Inherited from

UIElementProps.position

#### Defined in

[packages/websg-types/types/websg.d.ts:1316](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1316)

• `set` **position**(`value`): `void`

Sets the position of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`ElementPositionType`](../enums/WebSG.ElementPositionType.md) | The new position type for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.position

#### Defined in

[packages/websg-types/types/websg.d.ts:1322](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1322)

___

### right

• `get` **right**(): `number`

Gets the right position of the UI element.

#### Returns

`number`

The right position value of the UI element.

#### Inherited from

UIElementProps.right

#### Defined in

[packages/websg-types/types/websg.d.ts:1340](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1340)

• `set` **right**(`value`): `void`

Sets the right position of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new right position value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.right

#### Defined in

[packages/websg-types/types/websg.d.ts:1346](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1346)

___

### top

• `get` **top**(): `number`

Gets the top position of the UI element.

#### Returns

`number`

The top position value of the UI element.

#### Inherited from

UIElementProps.top

#### Defined in

[packages/websg-types/types/websg.d.ts:1328](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1328)

• `set` **top**(`value`): `void`

Sets the top position of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new top position value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.top

#### Defined in

[packages/websg-types/types/websg.d.ts:1334](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1334)

___

### width

• `get` **width**(): `number`

Gets the width of the UI element.

#### Returns

`number`

The width of the UI element.

#### Inherited from

UIElementProps.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1484](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1484)

• `set` **width**(`value`): `void`

Sets the width of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new width of the UI element. |

#### Returns

`void`

#### Inherited from

UIElementProps.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1490](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1490)

## Methods

### addChild

▸ **addChild**(`element`): [`UIElement`](WebSG.UIElement.md)

Adds a child UI element to the current element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | [`UIElement`](WebSG.UIElement.md) | The child UI element to add. |

#### Returns

[`UIElement`](WebSG.UIElement.md)

The current UI element for chaining.

#### Inherited from

[UIElementBase](../interfaces/WebSG.UIElementBase.md).[addChild](../interfaces/WebSG.UIElementBase.md#addchild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1556](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1556)

___

### children

▸ **children**(): [`UIElementIterator`](WebSG.UIElementIterator.md)

Returns an iterator for the children of the current UI element.

#### Returns

[`UIElementIterator`](WebSG.UIElementIterator.md)

An iterator for the children of the current UI element.

#### Defined in

[packages/websg-types/types/websg.d.ts:1576](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1576)

___

### getChild

▸ **getChild**(`index`): `undefined` \| [`UIElement`](WebSG.UIElement.md)

Gets the child UI element at the specified index.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index of the child UI element. |

#### Returns

`undefined` \| [`UIElement`](WebSG.UIElement.md)

The child UI element or undefined if the index is out of bounds.

#### Defined in

[packages/websg-types/types/websg.d.ts:1570](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1570)

___

### removeChild

▸ **removeChild**(`element`): [`UIElement`](WebSG.UIElement.md)

Removes a child UI element from the current element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | [`UIElement`](WebSG.UIElement.md) | The child UI element to remove. |

#### Returns

[`UIElement`](WebSG.UIElement.md)

The current UI element for chaining.

#### Defined in

[packages/websg-types/types/websg.d.ts:1563](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1563)

___

### setBorderColor

▸ **setBorderColor**(`color`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `color` | `Float32Array` |

#### Returns

`any`

#### Inherited from

[UIElementBase](../interfaces/WebSG.UIElementBase.md).[setBorderColor](../interfaces/WebSG.UIElementBase.md#setbordercolor)

#### Defined in

[src/engine/scripting/websg-api.d.ts:424](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L424)

___

### setColor

▸ **setColor**(`color`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `color` | `Float32Array` |

#### Returns

`any`

#### Inherited from

[UIElementBase](../interfaces/WebSG.UIElementBase.md).[setColor](../interfaces/WebSG.UIElementBase.md#setcolor)

#### Defined in

[src/engine/scripting/websg-api.d.ts:423](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L423)
