[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / UIButton

# Class: UIButton

[WebSG](../modules/WebSG.md).UIButton

Class representing a UIButton element.

## Hierarchy

- [`UIElement`](WebSG.UIElement.md)

- [`UIButtonProps`](../interfaces/WebSG.UIButtonProps.md)

- [`UIElementBase`](../interfaces/WebSG.UIElementBase.md)

- [`UIText`](WebSG.UIText.md)

  ↳ **`UIButton`**

## Table of contents

### Constructors

- [constructor](WebSG.UIButton.md#constructor)

### Properties

- [backgroundColor](WebSG.UIButton.md#backgroundcolor)
- [borderColor](WebSG.UIButton.md#bordercolor)
- [borderRadius](WebSG.UIButton.md#borderradius)
- [borderWidth](WebSG.UIButton.md#borderwidth)
- [color](WebSG.UIButton.md#color)
- [margin](WebSG.UIButton.md#margin)
- [padding](WebSG.UIButton.md#padding)
- [parent](WebSG.UIButton.md#parent)
- [type](WebSG.UIButton.md#type)

### Accessors

- [alignContent](WebSG.UIButton.md#aligncontent)
- [alignItems](WebSG.UIButton.md#alignitems)
- [alignSelf](WebSG.UIButton.md#alignself)
- [bottom](WebSG.UIButton.md#bottom)
- [flexBasis](WebSG.UIButton.md#flexbasis)
- [flexDirection](WebSG.UIButton.md#flexdirection)
- [flexGrow](WebSG.UIButton.md#flexgrow)
- [flexShrink](WebSG.UIButton.md#flexshrink)
- [flexWrap](WebSG.UIButton.md#flexwrap)
- [fontFamily](WebSG.UIButton.md#fontfamily)
- [fontSize](WebSG.UIButton.md#fontsize)
- [fontStyle](WebSG.UIButton.md#fontstyle)
- [fontWeight](WebSG.UIButton.md#fontweight)
- [height](WebSG.UIButton.md#height)
- [held](WebSG.UIButton.md#held)
- [justifyContent](WebSG.UIButton.md#justifycontent)
- [label](WebSG.UIButton.md#label)
- [left](WebSG.UIButton.md#left)
- [maxHeight](WebSG.UIButton.md#maxheight)
- [maxWidth](WebSG.UIButton.md#maxwidth)
- [minHeight](WebSG.UIButton.md#minheight)
- [minWidth](WebSG.UIButton.md#minwidth)
- [position](WebSG.UIButton.md#position)
- [pressed](WebSG.UIButton.md#pressed)
- [released](WebSG.UIButton.md#released)
- [right](WebSG.UIButton.md#right)
- [top](WebSG.UIButton.md#top)
- [value](WebSG.UIButton.md#value)
- [width](WebSG.UIButton.md#width)

### Methods

- [addChild](WebSG.UIButton.md#addchild)
- [children](WebSG.UIButton.md#children)
- [getChild](WebSG.UIButton.md#getchild)
- [isPressed](WebSG.UIButton.md#ispressed)
- [removeChild](WebSG.UIButton.md#removechild)
- [setBorderColor](WebSG.UIButton.md#setbordercolor)
- [setColor](WebSG.UIButton.md#setcolor)
- [setValue](WebSG.UIButton.md#setvalue)

## Constructors

### constructor

• **new UIButton**()

#### Inherited from

[UIText](WebSG.UIText.md).[constructor](WebSG.UIText.md#constructor)

## Properties

### backgroundColor

• `Readonly` **backgroundColor**: [`RGBA`](WebSG.RGBA.md)

Readonly RGBA object representing the background color of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[backgroundColor](WebSG.UIText.md#backgroundcolor)

#### Defined in

[packages/websg-types/types/websg.d.ts:1711](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1711)

___

### borderColor

• `Readonly` **borderColor**: [`RGBA`](WebSG.RGBA.md)

Readonly RGBA object representing the border color of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[borderColor](WebSG.UIText.md#bordercolor)

#### Defined in

[packages/websg-types/types/websg.d.ts:1716](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1716)

___

### borderRadius

• `Readonly` **borderRadius**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the border radius of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[borderRadius](WebSG.UIText.md#borderradius)

#### Defined in

[packages/websg-types/types/websg.d.ts:1736](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1736)

___

### borderWidth

• `Readonly` **borderWidth**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the border width of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[borderWidth](WebSG.UIText.md#borderwidth)

#### Defined in

[packages/websg-types/types/websg.d.ts:1731](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1731)

___

### color

• `Readonly` **color**: [`RGBA`](WebSG.RGBA.md)

Readonly property representing the color of the text as an RGBA object.

#### Inherited from

[UIText](WebSG.UIText.md).[color](WebSG.UIText.md#color)

#### Defined in

[packages/websg-types/types/websg.d.ts:1840](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1840)

___

### margin

• `Readonly` **margin**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the margin of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[margin](WebSG.UIText.md#margin)

#### Defined in

[packages/websg-types/types/websg.d.ts:1726](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1726)

___

### padding

• `Readonly` **padding**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the padding of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[padding](WebSG.UIText.md#padding)

#### Defined in

[packages/websg-types/types/websg.d.ts:1721](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1721)

___

### parent

• **parent**: ``null`` \| [`UIElement`](WebSG.UIElement.md)

#### Inherited from

[UIText](WebSG.UIText.md).[parent](WebSG.UIText.md#parent)

#### Defined in

[src/engine/scripting/websg-api.d.ts:457](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L457)

___

### type

• **type**: `string`

#### Inherited from

[UIText](WebSG.UIText.md).[type](WebSG.UIText.md#type)

#### Defined in

[src/engine/scripting/websg-api.d.ts:458](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L458)

## Accessors

### alignContent

• `get` **alignContent**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-content property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

#### Inherited from

UIElement.alignContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1513](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1513)

• `set` **alignContent**(`value`): `void`

Sets the align-content property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-content value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.alignContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1519](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1519)

___

### alignItems

• `get` **alignItems**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-items property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

#### Inherited from

UIElement.alignItems

#### Defined in

[packages/websg-types/types/websg.d.ts:1524](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1524)

• `set` **alignItems**(`value`): `void`

Sets the align-items property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-items value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.alignItems

#### Defined in

[packages/websg-types/types/websg.d.ts:1530](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1530)

___

### alignSelf

• `get` **alignSelf**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-self property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

#### Inherited from

UIElement.alignSelf

#### Defined in

[packages/websg-types/types/websg.d.ts:1535](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1535)

• `set` **alignSelf**(`value`): `void`

Sets the align-self property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-self value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.alignSelf

#### Defined in

[packages/websg-types/types/websg.d.ts:1541](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1541)

___

### bottom

• `get` **bottom**(): `number`

Gets the bottom position of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.bottom

#### Defined in

[packages/websg-types/types/websg.d.ts:1491](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1491)

• `set` **bottom**(`value`): `void`

Sets the bottom position of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new bottom position value for the UI element in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.bottom

#### Defined in

[packages/websg-types/types/websg.d.ts:1497](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1497)

___

### flexBasis

• `get` **flexBasis**(): `number`

Gets the flex basis property of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.flexBasis

#### Defined in

[packages/websg-types/types/websg.d.ts:1568](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1568)

• `set` **flexBasis**(`value`): `void`

Sets the flex basis property of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new flex basis property value in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.flexBasis

#### Defined in

[packages/websg-types/types/websg.d.ts:1574](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1574)

___

### flexDirection

• `get` **flexDirection**(): [`FlexDirection`](../enums/WebSG.FlexDirection.md)

Gets the flex-direction property of the UI element.

#### Returns

[`FlexDirection`](../enums/WebSG.FlexDirection.md)

#### Inherited from

UIElement.flexDirection

#### Defined in

[packages/websg-types/types/websg.d.ts:1546](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1546)

• `set` **flexDirection**(`value`): `void`

Sets the flex-direction property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexDirection`](../enums/WebSG.FlexDirection.md) | The new flex-direction value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.flexDirection

#### Defined in

[packages/websg-types/types/websg.d.ts:1552](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1552)

___

### flexGrow

• `get` **flexGrow**(): `number`

Gets the flex grow property of the UI element.

#### Returns

`number`

#### Inherited from

UIElement.flexGrow

#### Defined in

[packages/websg-types/types/websg.d.ts:1579](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1579)

• `set` **flexGrow**(`value`): `void`

Sets the flex grow property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new flex grow property value. |

#### Returns

`void`

#### Inherited from

UIElement.flexGrow

#### Defined in

[packages/websg-types/types/websg.d.ts:1585](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1585)

___

### flexShrink

• `get` **flexShrink**(): `number`

Gets the flex shrink property of the UI element.

#### Returns

`number`

#### Inherited from

UIElement.flexShrink

#### Defined in

[packages/websg-types/types/websg.d.ts:1590](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1590)

• `set` **flexShrink**(`value`): `void`

Sets the flex shrink property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new flex shrink property value. |

#### Returns

`void`

#### Inherited from

UIElement.flexShrink

#### Defined in

[packages/websg-types/types/websg.d.ts:1596](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1596)

___

### flexWrap

• `get` **flexWrap**(): [`FlexWrap`](../enums/WebSG.FlexWrap.md)

Gets the flex wrap property of the UI element.

#### Returns

[`FlexWrap`](../enums/WebSG.FlexWrap.md)

#### Inherited from

UIElement.flexWrap

#### Defined in

[packages/websg-types/types/websg.d.ts:1557](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1557)

• `set` **flexWrap**(`value`): `void`

Sets the flex wrap property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexWrap`](../enums/WebSG.FlexWrap.md) | The new flex wrap property value. |

#### Returns

`void`

#### Inherited from

UIElement.flexWrap

#### Defined in

[packages/websg-types/types/websg.d.ts:1563](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1563)

___

### fontFamily

• `get` **fontFamily**(): `string`

Gets the font family used for the text.

#### Returns

`string`

#### Inherited from

UIButtonProps.fontFamily

#### Defined in

[packages/websg-types/types/websg.d.ts:1796](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1796)

• `set` **fontFamily**(`value`): `void`

Sets the font family used for the text.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The new font family. Accepts any valid CSS font-family value. |

#### Returns

`void`

#### Inherited from

UIButtonProps.fontFamily

#### Defined in

[packages/websg-types/types/websg.d.ts:1802](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1802)

___

### fontSize

• `get` **fontSize**(): `number`

Gets the font size of the text in pixels.

#### Returns

`number`

#### Inherited from

UIButtonProps.fontSize

#### Defined in

[packages/websg-types/types/websg.d.ts:1818](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1818)

• `set` **fontSize**(`value`): `void`

Sets the font size of the text in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new font size. Accepts any valid CSS font-size value. |

#### Returns

`void`

#### Inherited from

UIButtonProps.fontSize

#### Defined in

[packages/websg-types/types/websg.d.ts:1824](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1824)

___

### fontStyle

• `get` **fontStyle**(): `string`

Gets the font style used for the text.

#### Returns

`string`

#### Inherited from

UIButtonProps.fontStyle

#### Defined in

[packages/websg-types/types/websg.d.ts:1829](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1829)

• `set` **fontStyle**(`value`): `void`

Sets the font style used for the text.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The new font style. Accepts any valid CSS font-style value. |

#### Returns

`void`

#### Inherited from

UIButtonProps.fontStyle

#### Defined in

[packages/websg-types/types/websg.d.ts:1835](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1835)

___

### fontWeight

• `get` **fontWeight**(): `string`

Gets the font weight used for the text.

#### Returns

`string`

#### Inherited from

UIButtonProps.fontWeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1807](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1807)

• `set` **fontWeight**(`value`): `void`

Sets the font weight used for the text.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The new font weight. Accepts any valid CSS font-weight value. |

#### Returns

`void`

#### Inherited from

UIButtonProps.fontWeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1813](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1813)

___

### height

• `get` **height**(): `number`

Gets the height of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1623](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1623)

• `set` **height**(`value`): `void`

Sets the height of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new height of the UI element in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1629](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1629)

___

### held

• `get` **held**(): `boolean`

Returns true if the button is held during this frame, otherwise false.

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:1183](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1183)

___

### justifyContent

• `get` **justifyContent**(): [`FlexJustify`](../enums/WebSG.FlexJustify.md)

Gets the justify content property of the UI element.

#### Returns

[`FlexJustify`](../enums/WebSG.FlexJustify.md)

#### Inherited from

UIElement.justifyContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1601](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1601)

• `set` **justifyContent**(`value`): `void`

Sets the justify content property of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`FlexJustify`](../enums/WebSG.FlexJustify.md) | The new justify content property value. |

#### Returns

`void`

#### Inherited from

UIElement.justifyContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1607](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1607)

___

### label

• `get` **label**(): `string`

Gets the button label text.

#### Returns

`string`

#### Inherited from

UIButtonProps.label

#### Defined in

[packages/websg-types/types/websg.d.ts:1167](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1167)

• `set` **label**(`value`): `void`

Sets the button label text.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The button label text. |

#### Returns

`void`

#### Inherited from

UIButtonProps.label

#### Defined in

[packages/websg-types/types/websg.d.ts:1173](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1173)

___

### left

• `get` **left**(): `number`

Gets the left position of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.left

#### Defined in

[packages/websg-types/types/websg.d.ts:1502](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1502)

• `set` **left**(`value`): `void`

Sets the left position of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new left position value for the UI element in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.left

#### Defined in

[packages/websg-types/types/websg.d.ts:1508](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1508)

___

### maxHeight

• `get` **maxHeight**(): `number`

Gets the maximum height of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.maxHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1667](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1667)

• `set` **maxHeight**(`value`): `void`

Sets the maximum height of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new maximum height of the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.maxHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1673](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1673)

___

### maxWidth

• `get` **maxWidth**(): `number`

Gets the maximum width of the UI element.

#### Returns

`number`

#### Inherited from

UIElement.maxWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1656](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1656)

• `set` **maxWidth**(`value`): `void`

Sets the maximum width of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new maximum width of the UI element in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.maxWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1662](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1662)

___

### minHeight

• `get` **minHeight**(): `number`

Gets the minimum height of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.minHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1645](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1645)

• `set` **minHeight**(`value`): `void`

Sets the minimum height of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new minimum height of the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.minHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1651](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1651)

___

### minWidth

• `get` **minWidth**(): `number`

Gets the minimum width of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.minWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1634](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1634)

• `set` **minWidth**(`value`): `void`

Sets the minimum width of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new minimum width of the UI element in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.minWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1640](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1640)

___

### position

• `get` **position**(): [`ElementPositionType`](../enums/WebSG.ElementPositionType.md)

Gets the position of the UI element.

#### Returns

[`ElementPositionType`](../enums/WebSG.ElementPositionType.md)

#### Inherited from

UIElement.position

#### Defined in

[packages/websg-types/types/websg.d.ts:1458](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1458)

• `set` **position**(`value`): `void`

Sets the position of the UI element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | [`ElementPositionType`](../enums/WebSG.ElementPositionType.md) | The new position type for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.position

#### Defined in

[packages/websg-types/types/websg.d.ts:1464](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1464)

___

### pressed

• `get` **pressed**(): `boolean`

Returns true if the button was pressed during this frame, otherwise false.

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:1178](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1178)

___

### released

• `get` **released**(): `boolean`

Returns true if the button was released during this frame, otherwise false.

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:1188](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1188)

___

### right

• `get` **right**(): `number`

Gets the right position of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.right

#### Defined in

[packages/websg-types/types/websg.d.ts:1480](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1480)

• `set` **right**(`value`): `void`

Sets the right position of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new right position value for the UI element in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.right

#### Defined in

[packages/websg-types/types/websg.d.ts:1486](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1486)

___

### top

• `get` **top**(): `number`

Gets the top position of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.top

#### Defined in

[packages/websg-types/types/websg.d.ts:1469](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1469)

• `set` **top**(`value`): `void`

Sets the top position of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new top position value for the UI element in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.top

#### Defined in

[packages/websg-types/types/websg.d.ts:1475](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1475)

___

### value

• `get` **value**(): `string`

Gets the text content of the UIText element.

#### Returns

`string`

#### Inherited from

UIButtonProps.value

#### Defined in

[packages/websg-types/types/websg.d.ts:1785](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1785)

• `set` **value**(`value`): `void`

Sets the text content of the UIText element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | The new text content. |

#### Returns

`void`

#### Inherited from

UIButtonProps.value

#### Defined in

[packages/websg-types/types/websg.d.ts:1791](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1791)

___

### width

• `get` **width**(): `number`

Gets the width of the UI element in pixels.

#### Returns

`number`

#### Inherited from

UIElement.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1612](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1612)

• `set` **width**(`value`): `void`

Sets the width of the UI element in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new width of the UI element in pixels. |

#### Returns

`void`

#### Inherited from

UIElement.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1618](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1618)

## Methods

### addChild

▸ **addChild**(`element`): [`UIButton`](WebSG.UIButton.md)

Adds a child UI element to the current element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | [`UIElement`](WebSG.UIElement.md) | The child UI element to add. |

#### Returns

[`UIButton`](WebSG.UIButton.md)

#### Inherited from

[UIText](WebSG.UIText.md).[addChild](WebSG.UIText.md#addchild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1679](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1679)

___

### children

▸ **children**(): [`UIElementIterator`](WebSG.UIElementIterator.md)

Returns an iterator for the children of the current UI element.

#### Returns

[`UIElementIterator`](WebSG.UIElementIterator.md)

#### Inherited from

[UIText](WebSG.UIText.md).[children](WebSG.UIText.md#children)

#### Defined in

[packages/websg-types/types/websg.d.ts:1696](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1696)

___

### getChild

▸ **getChild**(`index`): `undefined` \| [`UIElement`](WebSG.UIElement.md)

Gets the child UI element at the specified index or undefined if the index is out of bounds.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index of the child UI element. |

#### Returns

`undefined` \| [`UIElement`](WebSG.UIElement.md)

#### Inherited from

[UIText](WebSG.UIText.md).[getChild](WebSG.UIText.md#getchild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1691](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1691)

___

### isPressed

▸ **isPressed**(): `boolean`

#### Returns

`boolean`

#### Defined in

[src/engine/scripting/websg-api.d.ts:477](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L477)

___

### removeChild

▸ **removeChild**(`element`): [`UIButton`](WebSG.UIButton.md)

Removes a child UI element from the current element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | [`UIElement`](WebSG.UIElement.md) | The child UI element to remove. |

#### Returns

[`UIButton`](WebSG.UIButton.md)

#### Inherited from

[UIText](WebSG.UIText.md).[removeChild](WebSG.UIText.md#removechild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1685](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1685)

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

[UIText](WebSG.UIText.md).[setBorderColor](WebSG.UIText.md#setbordercolor)

#### Defined in

[src/engine/scripting/websg-api.d.ts:424](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L424)

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

[UIText](WebSG.UIText.md).[setColor](WebSG.UIText.md#setcolor)

#### Defined in

[src/engine/scripting/websg-api.d.ts:423](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L423)

___

### setValue

▸ **setValue**(`value`): [`UIButton`](WebSG.UIButton.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

[`UIButton`](WebSG.UIButton.md)

#### Inherited from

[UIText](WebSG.UIText.md).[setValue](WebSG.UIText.md#setvalue)

#### Defined in

[src/engine/scripting/websg-api.d.ts:483](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L483)
