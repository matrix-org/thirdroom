[websg-types](../README.md) / [Exports](../modules.md) / [WebSG](../modules/WebSG.md) / UIText

# Class: UIText

[WebSG](../modules/WebSG.md).UIText

Class representing a text element within a user interface.

## Hierarchy

- [`UIElementBase`](../interfaces/WebSG.UIElementBase.md)

- [`UIElement`](WebSG.UIElement.md)

  ↳ **`UIText`**

  ↳↳ [`UIButton`](WebSG.UIButton.md)

## Table of contents

### Constructors

- [constructor](WebSG.UIText.md#constructor)

### Properties

- [backgroundColor](WebSG.UIText.md#backgroundcolor)
- [borderColor](WebSG.UIText.md#bordercolor)
- [borderRadius](WebSG.UIText.md#borderradius)
- [borderWidth](WebSG.UIText.md#borderwidth)
- [color](WebSG.UIText.md#color)
- [margin](WebSG.UIText.md#margin)
- [padding](WebSG.UIText.md#padding)
- [parent](WebSG.UIText.md#parent)
- [type](WebSG.UIText.md#type)

### Accessors

- [alignContent](WebSG.UIText.md#aligncontent)
- [alignItems](WebSG.UIText.md#alignitems)
- [alignSelf](WebSG.UIText.md#alignself)
- [bottom](WebSG.UIText.md#bottom)
- [flexBasis](WebSG.UIText.md#flexbasis)
- [flexDirection](WebSG.UIText.md#flexdirection)
- [flexGrow](WebSG.UIText.md#flexgrow)
- [flexShrink](WebSG.UIText.md#flexshrink)
- [flexWrap](WebSG.UIText.md#flexwrap)
- [fontFamily](WebSG.UIText.md#fontfamily)
- [fontSize](WebSG.UIText.md#fontsize)
- [fontStyle](WebSG.UIText.md#fontstyle)
- [fontWeight](WebSG.UIText.md#fontweight)
- [height](WebSG.UIText.md#height)
- [justifyContent](WebSG.UIText.md#justifycontent)
- [left](WebSG.UIText.md#left)
- [maxHeight](WebSG.UIText.md#maxheight)
- [maxWidth](WebSG.UIText.md#maxwidth)
- [minHeight](WebSG.UIText.md#minheight)
- [minWidth](WebSG.UIText.md#minwidth)
- [position](WebSG.UIText.md#position)
- [right](WebSG.UIText.md#right)
- [top](WebSG.UIText.md#top)
- [value](WebSG.UIText.md#value)
- [width](WebSG.UIText.md#width)

### Methods

- [addChild](WebSG.UIText.md#addchild)
- [children](WebSG.UIText.md#children)
- [getChild](WebSG.UIText.md#getchild)
- [removeChild](WebSG.UIText.md#removechild)
- [setBorderColor](WebSG.UIText.md#setbordercolor)
- [setColor](WebSG.UIText.md#setcolor)
- [setValue](WebSG.UIText.md#setvalue)

## Constructors

### constructor

• **new UIText**()

#### Inherited from

[UIElement](WebSG.UIElement.md).[constructor](WebSG.UIElement.md#constructor)

## Properties

### backgroundColor

• `Readonly` **backgroundColor**: [`RGBA`](WebSG.RGBA.md)

Readonly RGBA object representing the background color of the UI element.

#### Inherited from

[UIElement](WebSG.UIElement.md).[backgroundColor](WebSG.UIElement.md#backgroundcolor)

#### Defined in

[packages/websg-types/types/websg.d.ts:1594](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1594)

___

### borderColor

• `Readonly` **borderColor**: [`RGBA`](WebSG.RGBA.md)

Readonly RGBA object representing the border color of the UI element.

#### Inherited from

[UIElement](WebSG.UIElement.md).[borderColor](WebSG.UIElement.md#bordercolor)

#### Defined in

[packages/websg-types/types/websg.d.ts:1600](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1600)

___

### borderRadius

• `Readonly` **borderRadius**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the border radius of the UI element.

#### Inherited from

[UIElement](WebSG.UIElement.md).[borderRadius](WebSG.UIElement.md#borderradius)

#### Defined in

[packages/websg-types/types/websg.d.ts:1624](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1624)

___

### borderWidth

• `Readonly` **borderWidth**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the border width of the UI element.

#### Inherited from

[UIElement](WebSG.UIElement.md).[borderWidth](WebSG.UIElement.md#borderwidth)

#### Defined in

[packages/websg-types/types/websg.d.ts:1618](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1618)

___

### color

• `Readonly` **color**: [`RGBA`](WebSG.RGBA.md)

Readonly property representing the color of the text as an RGBA object.

#### Defined in

[packages/websg-types/types/websg.d.ts:1738](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1738)

___

### margin

• `Readonly` **margin**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the margin of the UI element.

#### Inherited from

[UIElement](WebSG.UIElement.md).[margin](WebSG.UIElement.md#margin)

#### Defined in

[packages/websg-types/types/websg.d.ts:1612](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1612)

___

### padding

• `Readonly` **padding**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the padding of the UI element.

#### Inherited from

[UIElement](WebSG.UIElement.md).[padding](WebSG.UIElement.md#padding)

#### Defined in

[packages/websg-types/types/websg.d.ts:1606](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1606)

___

### parent

• **parent**: ``null`` \| [`UIElement`](WebSG.UIElement.md)

#### Inherited from

[UIElement](WebSG.UIElement.md).[parent](WebSG.UIElement.md#parent)

#### Defined in

[src/engine/scripting/websg-api.d.ts:457](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L457)

___

### type

• **type**: `string`

#### Inherited from

[UIElement](WebSG.UIElement.md).[type](WebSG.UIElement.md#type)

#### Defined in

[src/engine/scripting/websg-api.d.ts:458](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L458)

## Accessors

### alignContent

• `get` **alignContent**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-content property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-content value of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1382](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1382)

___

### alignItems

• `get` **alignItems**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-items property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-items value of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1394](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1394)

___

### alignSelf

• `get` **alignSelf**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-self property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-self value of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1406](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1406)

___

### bottom

• `get` **bottom**(): `number`

Gets the bottom position of the UI element.

#### Returns

`number`

The bottom position value of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1358](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1358)

___

### flexBasis

• `get` **flexBasis**(): `number`

Gets the flex basis property of the UI element.

#### Returns

`number`

The flex basis property value.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1442](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1442)

___

### flexDirection

• `get` **flexDirection**(): [`FlexDirection`](../enums/WebSG.FlexDirection.md)

Gets the flex-direction property of the UI element.

#### Returns

[`FlexDirection`](../enums/WebSG.FlexDirection.md)

The flex-direction value of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1418](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1418)

___

### flexGrow

• `get` **flexGrow**(): `number`

Gets the flex grow property of the UI element.

#### Returns

`number`

The flex grow property value.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1454](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1454)

___

### flexShrink

• `get` **flexShrink**(): `number`

Gets the flex shrink property of the UI element.

#### Returns

`number`

The flex shrink property value.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1466](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1466)

___

### flexWrap

• `get` **flexWrap**(): [`FlexWrap`](../enums/WebSG.FlexWrap.md)

Gets the flex wrap property of the UI element.

#### Returns

[`FlexWrap`](../enums/WebSG.FlexWrap.md)

The flex wrap property value.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1430](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1430)

___

### fontFamily

• `get` **fontFamily**(): `string`

Gets the font family used for the text.

#### Returns

`string`

The font family.

#### Defined in

[packages/websg-types/types/websg.d.ts:1690](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1690)

• `set` **fontFamily**(`value`): `void`

Sets the font family used for the text.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The new font family. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:1696](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1696)

___

### fontSize

• `get` **fontSize**(): `number`

Gets the font size of the text in pixels.

#### Returns

`number`

The font size.

#### Defined in

[packages/websg-types/types/websg.d.ts:1714](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1714)

• `set` **fontSize**(`value`): `void`

Sets the font size of the text in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new font size. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:1720](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1720)

___

### fontStyle

• `get` **fontStyle**(): `string`

Gets the font style used for the text.

#### Returns

`string`

The font style.

#### Defined in

[packages/websg-types/types/websg.d.ts:1726](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1726)

• `set` **fontStyle**(`value`): `void`

Sets the font style used for the text.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The new font style. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:1732](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1732)

___

### fontWeight

• `get` **fontWeight**(): `string`

Gets the font weight used for the text.

#### Returns

`string`

The font weight.

#### Defined in

[packages/websg-types/types/websg.d.ts:1702](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1702)

• `set` **fontWeight**(`value`): `void`

Sets the font weight used for the text.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The new font weight. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:1708](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1708)

___

### height

• `get` **height**(): `number`

Gets the height of the UI element.

#### Returns

`number`

The height of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1502](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1502)

___

### justifyContent

• `get` **justifyContent**(): [`FlexJustify`](../enums/WebSG.FlexJustify.md)

Gets the justify content property of the UI element.

#### Returns

[`FlexJustify`](../enums/WebSG.FlexJustify.md)

The justify content property value.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1478](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1478)

___

### left

• `get` **left**(): `number`

Gets the left position of the UI element.

#### Returns

`number`

The left position value of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1370](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1370)

___

### maxHeight

• `get` **maxHeight**(): `number`

Gets the maximum height of the UI element.

#### Returns

`number`

The maximum height of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1550](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1550)

___

### maxWidth

• `get` **maxWidth**(): `number`

Gets the maximum width of the UI element.

#### Returns

`number`

The maximum width of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1538](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1538)

___

### minHeight

• `get` **minHeight**(): `number`

Gets the minimum height of the UI element.

#### Returns

`number`

The minimum height of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1526](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1526)

___

### minWidth

• `get` **minWidth**(): `number`

Gets the minimum width of the UI element.

#### Returns

`number`

The minimum width of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1514](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1514)

___

### position

• `get` **position**(): [`ElementPositionType`](../enums/WebSG.ElementPositionType.md)

Gets the position of the UI element.

#### Returns

[`ElementPositionType`](../enums/WebSG.ElementPositionType.md)

The position type of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1322](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1322)

___

### right

• `get` **right**(): `number`

Gets the right position of the UI element.

#### Returns

`number`

The right position value of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1346](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1346)

___

### top

• `get` **top**(): `number`

Gets the top position of the UI element.

#### Returns

`number`

The top position value of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1334](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1334)

___

### value

• `get` **value**(): `string`

Gets the text content of the UIText element.

#### Returns

`string`

The text content.

#### Defined in

[packages/websg-types/types/websg.d.ts:1678](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1678)

• `set` **value**(`value`): `void`

Sets the text content of the UIText element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The new text content. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:1684](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1684)

___

### width

• `get` **width**(): `number`

Gets the width of the UI element.

#### Returns

`number`

The width of the UI element.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:1490](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1490)

## Methods

### addChild

▸ **addChild**(`element`): [`UIText`](WebSG.UIText.md)

Adds a child UI element to the current element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | [`UIElement`](WebSG.UIElement.md) | The child UI element to add. |

#### Returns

[`UIText`](WebSG.UIText.md)

The current UI element for chaining.

#### Inherited from

[UIElement](WebSG.UIElement.md).[addChild](WebSG.UIElement.md#addchild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1556](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1556)

___

### children

▸ **children**(): [`UIElementIterator`](WebSG.UIElementIterator.md)

Returns an iterator for the children of the current UI element.

#### Returns

[`UIElementIterator`](WebSG.UIElementIterator.md)

An iterator for the children of the current UI element.

#### Inherited from

[UIElement](WebSG.UIElement.md).[children](WebSG.UIElement.md#children)

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

#### Inherited from

[UIElement](WebSG.UIElement.md).[getChild](WebSG.UIElement.md#getchild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1570](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1570)

___

### removeChild

▸ **removeChild**(`element`): [`UIText`](WebSG.UIText.md)

Removes a child UI element from the current element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | [`UIElement`](WebSG.UIElement.md) | The child UI element to remove. |

#### Returns

[`UIText`](WebSG.UIText.md)

The current UI element for chaining.

#### Inherited from

[UIElement](WebSG.UIElement.md).[removeChild](WebSG.UIElement.md#removechild)

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

[UIElement](WebSG.UIElement.md).[setBorderColor](WebSG.UIElement.md#setbordercolor)

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

[UIElement](WebSG.UIElement.md).[setColor](WebSG.UIElement.md#setcolor)

#### Defined in

[src/engine/scripting/websg-api.d.ts:423](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L423)

___

### setValue

▸ **setValue**(`value`): [`UIText`](WebSG.UIText.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

[`UIText`](WebSG.UIText.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:483](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L483)
