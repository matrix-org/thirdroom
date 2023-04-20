[Exports](../modules.md) / [WebSG](../modules/websg) / UIButton

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

[packages/websg-types/types/websg.d.ts:1594](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1594)

---

### borderColor

• `Readonly` **borderColor**: [`RGBA`](WebSG.RGBA.md)

Readonly RGBA object representing the border color of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[borderColor](WebSG.UIText.md#bordercolor)

#### Defined in

[packages/websg-types/types/websg.d.ts:1600](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1600)

---

### borderRadius

• `Readonly` **borderRadius**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the border radius of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[borderRadius](WebSG.UIText.md#borderradius)

#### Defined in

[packages/websg-types/types/websg.d.ts:1624](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1624)

---

### borderWidth

• `Readonly` **borderWidth**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the border width of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[borderWidth](WebSG.UIText.md#borderwidth)

#### Defined in

[packages/websg-types/types/websg.d.ts:1618](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1618)

---

### color

• `Readonly` **color**: [`RGBA`](WebSG.RGBA.md)

Readonly property representing the color of the text as an RGBA object.

#### Inherited from

[UIText](WebSG.UIText.md).[color](WebSG.UIText.md#color)

#### Defined in

[packages/websg-types/types/websg.d.ts:1738](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1738)

---

### margin

• `Readonly` **margin**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the margin of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[margin](WebSG.UIText.md#margin)

#### Defined in

[packages/websg-types/types/websg.d.ts:1612](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1612)

---

### padding

• `Readonly` **padding**: [`Vector4`](WebSG.Vector4.md)

Readonly Vector4 object representing the padding of the UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[padding](WebSG.UIText.md#padding)

#### Defined in

[packages/websg-types/types/websg.d.ts:1606](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1606)

---

### parent

• **parent**: `null` \| [`UIElement`](WebSG.UIElement.md)

#### Inherited from

[UIText](WebSG.UIText.md).[parent](WebSG.UIText.md#parent)

#### Defined in

[src/engine/scripting/websg-api.d.ts:457](https://github.com/matrix-org/thirdroom/blob/1005fb3d/src/engine/scripting/websg-api.d.ts#L457)

---

### type

• **type**: `string`

#### Inherited from

[UIText](WebSG.UIText.md).[type](WebSG.UIText.md#type)

#### Defined in

[src/engine/scripting/websg-api.d.ts:458](https://github.com/matrix-org/thirdroom/blob/1005fb3d/src/engine/scripting/websg-api.d.ts#L458)

## Accessors

### alignContent

• `get` **alignContent**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-content property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-content value of the UI element.

#### Inherited from

UIElement.alignContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1376](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1376)

• `set` **alignContent**(`value`): `void`

Sets the align-content property of the UI element.

#### Parameters

| Name    | Type                                       | Description                                     |
| :------ | :----------------------------------------- | :---------------------------------------------- |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-content value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.alignContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1382](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1382)

---

### alignItems

• `get` **alignItems**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-items property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-items value of the UI element.

#### Inherited from

UIElement.alignItems

#### Defined in

[packages/websg-types/types/websg.d.ts:1388](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1388)

• `set` **alignItems**(`value`): `void`

Sets the align-items property of the UI element.

#### Parameters

| Name    | Type                                       | Description                                   |
| :------ | :----------------------------------------- | :-------------------------------------------- |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-items value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.alignItems

#### Defined in

[packages/websg-types/types/websg.d.ts:1394](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1394)

---

### alignSelf

• `get` **alignSelf**(): [`FlexAlign`](../enums/WebSG.FlexAlign.md)

Gets the align-self property of the UI element.

#### Returns

[`FlexAlign`](../enums/WebSG.FlexAlign.md)

The align-self value of the UI element.

#### Inherited from

UIElement.alignSelf

#### Defined in

[packages/websg-types/types/websg.d.ts:1400](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1400)

• `set` **alignSelf**(`value`): `void`

Sets the align-self property of the UI element.

#### Parameters

| Name    | Type                                       | Description                                  |
| :------ | :----------------------------------------- | :------------------------------------------- |
| `value` | [`FlexAlign`](../enums/WebSG.FlexAlign.md) | The new align-self value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.alignSelf

#### Defined in

[packages/websg-types/types/websg.d.ts:1406](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1406)

---

### bottom

• `get` **bottom**(): `number`

Gets the bottom position of the UI element.

#### Returns

`number`

The bottom position value of the UI element.

#### Inherited from

UIElement.bottom

#### Defined in

[packages/websg-types/types/websg.d.ts:1352](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1352)

• `set` **bottom**(`value`): `void`

Sets the bottom position of the UI element.

#### Parameters

| Name    | Type     | Description                                       |
| :------ | :------- | :------------------------------------------------ |
| `value` | `number` | The new bottom position value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.bottom

#### Defined in

[packages/websg-types/types/websg.d.ts:1358](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1358)

---

### flexBasis

• `get` **flexBasis**(): `number`

Gets the flex basis property of the UI element.

#### Returns

`number`

The flex basis property value.

#### Inherited from

UIElement.flexBasis

#### Defined in

[packages/websg-types/types/websg.d.ts:1436](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1436)

• `set` **flexBasis**(`value`): `void`

Sets the flex basis property of the UI element.

#### Parameters

| Name    | Type     | Description                        |
| :------ | :------- | :--------------------------------- |
| `value` | `number` | The new flex basis property value. |

#### Returns

`void`

#### Inherited from

UIElement.flexBasis

#### Defined in

[packages/websg-types/types/websg.d.ts:1442](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1442)

---

### flexDirection

• `get` **flexDirection**(): [`FlexDirection`](../enums/WebSG.FlexDirection.md)

Gets the flex-direction property of the UI element.

#### Returns

[`FlexDirection`](../enums/WebSG.FlexDirection.md)

The flex-direction value of the UI element.

#### Inherited from

UIElement.flexDirection

#### Defined in

[packages/websg-types/types/websg.d.ts:1412](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1412)

• `set` **flexDirection**(`value`): `void`

Sets the flex-direction property of the UI element.

#### Parameters

| Name    | Type                                               | Description                                      |
| :------ | :------------------------------------------------- | :----------------------------------------------- |
| `value` | [`FlexDirection`](../enums/WebSG.FlexDirection.md) | The new flex-direction value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.flexDirection

#### Defined in

[packages/websg-types/types/websg.d.ts:1418](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1418)

---

### flexGrow

• `get` **flexGrow**(): `number`

Gets the flex grow property of the UI element.

#### Returns

`number`

The flex grow property value.

#### Inherited from

UIElement.flexGrow

#### Defined in

[packages/websg-types/types/websg.d.ts:1448](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1448)

• `set` **flexGrow**(`value`): `void`

Sets the flex grow property of the UI element.

#### Parameters

| Name    | Type     | Description                       |
| :------ | :------- | :-------------------------------- |
| `value` | `number` | The new flex grow property value. |

#### Returns

`void`

#### Inherited from

UIElement.flexGrow

#### Defined in

[packages/websg-types/types/websg.d.ts:1454](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1454)

---

### flexShrink

• `get` **flexShrink**(): `number`

Gets the flex shrink property of the UI element.

#### Returns

`number`

The flex shrink property value.

#### Inherited from

UIElement.flexShrink

#### Defined in

[packages/websg-types/types/websg.d.ts:1460](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1460)

• `set` **flexShrink**(`value`): `void`

Sets the flex shrink property of the UI element.

#### Parameters

| Name    | Type     | Description                         |
| :------ | :------- | :---------------------------------- |
| `value` | `number` | The new flex shrink property value. |

#### Returns

`void`

#### Inherited from

UIElement.flexShrink

#### Defined in

[packages/websg-types/types/websg.d.ts:1466](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1466)

---

### flexWrap

• `get` **flexWrap**(): [`FlexWrap`](../enums/WebSG.FlexWrap.md)

Gets the flex wrap property of the UI element.

#### Returns

[`FlexWrap`](../enums/WebSG.FlexWrap.md)

The flex wrap property value.

#### Inherited from

UIElement.flexWrap

#### Defined in

[packages/websg-types/types/websg.d.ts:1424](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1424)

• `set` **flexWrap**(`value`): `void`

Sets the flex wrap property of the UI element.

#### Parameters

| Name    | Type                                     | Description                       |
| :------ | :--------------------------------------- | :-------------------------------- |
| `value` | [`FlexWrap`](../enums/WebSG.FlexWrap.md) | The new flex wrap property value. |

#### Returns

`void`

#### Inherited from

UIElement.flexWrap

#### Defined in

[packages/websg-types/types/websg.d.ts:1430](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1430)

---

### fontFamily

• `get` **fontFamily**(): `string`

Gets the font family used for the text.

#### Returns

`string`

The font family.

#### Inherited from

UIButtonProps.fontFamily

#### Defined in

[packages/websg-types/types/websg.d.ts:1690](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1690)

• `set` **fontFamily**(`value`): `void`

Sets the font family used for the text.

#### Parameters

| Name    | Type     | Description          |
| :------ | :------- | :------------------- |
| `value` | `string` | The new font family. |

#### Returns

`void`

#### Inherited from

UIButtonProps.fontFamily

#### Defined in

[packages/websg-types/types/websg.d.ts:1696](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1696)

---

### fontSize

• `get` **fontSize**(): `number`

Gets the font size of the text in pixels.

#### Returns

`number`

The font size.

#### Inherited from

UIButtonProps.fontSize

#### Defined in

[packages/websg-types/types/websg.d.ts:1714](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1714)

• `set` **fontSize**(`value`): `void`

Sets the font size of the text in pixels.

#### Parameters

| Name    | Type     | Description        |
| :------ | :------- | :----------------- |
| `value` | `number` | The new font size. |

#### Returns

`void`

#### Inherited from

UIButtonProps.fontSize

#### Defined in

[packages/websg-types/types/websg.d.ts:1720](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1720)

---

### fontStyle

• `get` **fontStyle**(): `string`

Gets the font style used for the text.

#### Returns

`string`

The font style.

#### Inherited from

UIButtonProps.fontStyle

#### Defined in

[packages/websg-types/types/websg.d.ts:1726](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1726)

• `set` **fontStyle**(`value`): `void`

Sets the font style used for the text.

#### Parameters

| Name    | Type     | Description         |
| :------ | :------- | :------------------ |
| `value` | `string` | The new font style. |

#### Returns

`void`

#### Inherited from

UIButtonProps.fontStyle

#### Defined in

[packages/websg-types/types/websg.d.ts:1732](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1732)

---

### fontWeight

• `get` **fontWeight**(): `string`

Gets the font weight used for the text.

#### Returns

`string`

The font weight.

#### Inherited from

UIButtonProps.fontWeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1702](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1702)

• `set` **fontWeight**(`value`): `void`

Sets the font weight used for the text.

#### Parameters

| Name    | Type     | Description          |
| :------ | :------- | :------------------- |
| `value` | `string` | The new font weight. |

#### Returns

`void`

#### Inherited from

UIButtonProps.fontWeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1708](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1708)

---

### height

• `get` **height**(): `number`

Gets the height of the UI element.

#### Returns

`number`

The height of the UI element.

#### Inherited from

UIElement.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1496](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1496)

• `set` **height**(`value`): `void`

Sets the height of the UI element.

#### Parameters

| Name    | Type     | Description                       |
| :------ | :------- | :-------------------------------- |
| `value` | `number` | The new height of the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1502](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1502)

---

### held

• `get` **held**(): `boolean`

Returns true if the button is held, otherwise false.

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:1082](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1082)

---

### justifyContent

• `get` **justifyContent**(): [`FlexJustify`](../enums/WebSG.FlexJustify.md)

Gets the justify content property of the UI element.

#### Returns

[`FlexJustify`](../enums/WebSG.FlexJustify.md)

The justify content property value.

#### Inherited from

UIElement.justifyContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1472](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1472)

• `set` **justifyContent**(`value`): `void`

Sets the justify content property of the UI element.

#### Parameters

| Name    | Type                                           | Description                             |
| :------ | :--------------------------------------------- | :-------------------------------------- |
| `value` | [`FlexJustify`](../enums/WebSG.FlexJustify.md) | The new justify content property value. |

#### Returns

`void`

#### Inherited from

UIElement.justifyContent

#### Defined in

[packages/websg-types/types/websg.d.ts:1478](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1478)

---

### label

• `get` **label**(): `string`

Gets the button label text.

#### Returns

`string`

#### Inherited from

UIButtonProps.label

#### Defined in

[packages/websg-types/types/websg.d.ts:1062](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1062)

---

### left

• `get` **left**(): `number`

Gets the left position of the UI element.

#### Returns

`number`

The left position value of the UI element.

#### Inherited from

UIElement.left

#### Defined in

[packages/websg-types/types/websg.d.ts:1364](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1364)

• `set` **left**(`value`): `void`

Sets the left position of the UI element.

#### Parameters

| Name    | Type     | Description                                     |
| :------ | :------- | :---------------------------------------------- |
| `value` | `number` | The new left position value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.left

#### Defined in

[packages/websg-types/types/websg.d.ts:1370](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1370)

---

### maxHeight

• `get` **maxHeight**(): `number`

Gets the maximum height of the UI element.

#### Returns

`number`

The maximum height of the UI element.

#### Inherited from

UIElement.maxHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1544](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1544)

• `set` **maxHeight**(`value`): `void`

Sets the maximum height of the UI element.

#### Parameters

| Name    | Type     | Description                               |
| :------ | :------- | :---------------------------------------- |
| `value` | `number` | The new maximum height of the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.maxHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1550](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1550)

---

### maxWidth

• `get` **maxWidth**(): `number`

Gets the maximum width of the UI element.

#### Returns

`number`

The maximum width of the UI element.

#### Inherited from

UIElement.maxWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1532](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1532)

• `set` **maxWidth**(`value`): `void`

Sets the maximum width of the UI element.

#### Parameters

| Name    | Type     | Description                              |
| :------ | :------- | :--------------------------------------- |
| `value` | `number` | The new maximum width of the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.maxWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1538](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1538)

---

### minHeight

• `get` **minHeight**(): `number`

Gets the minimum height of the UI element.

#### Returns

`number`

The minimum height of the UI element.

#### Inherited from

UIElement.minHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1520](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1520)

• `set` **minHeight**(`value`): `void`

Sets the minimum height of the UI element.

#### Parameters

| Name    | Type     | Description                               |
| :------ | :------- | :---------------------------------------- |
| `value` | `number` | The new minimum height of the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.minHeight

#### Defined in

[packages/websg-types/types/websg.d.ts:1526](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1526)

---

### minWidth

• `get` **minWidth**(): `number`

Gets the minimum width of the UI element.

#### Returns

`number`

The minimum width of the UI element.

#### Inherited from

UIElement.minWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1508](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1508)

• `set` **minWidth**(`value`): `void`

Sets the minimum width of the UI element.

#### Parameters

| Name    | Type     | Description                              |
| :------ | :------- | :--------------------------------------- |
| `value` | `number` | The new minimum width of the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.minWidth

#### Defined in

[packages/websg-types/types/websg.d.ts:1514](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1514)

---

### position

• `get` **position**(): [`ElementPositionType`](../enums/WebSG.ElementPositionType.md)

Gets the position of the UI element.

#### Returns

[`ElementPositionType`](../enums/WebSG.ElementPositionType.md)

The position type of the UI element.

#### Inherited from

UIElement.position

#### Defined in

[packages/websg-types/types/websg.d.ts:1316](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1316)

• `set` **position**(`value`): `void`

Sets the position of the UI element.

#### Parameters

| Name    | Type                                                           | Description                               |
| :------ | :------------------------------------------------------------- | :---------------------------------------- |
| `value` | [`ElementPositionType`](../enums/WebSG.ElementPositionType.md) | The new position type for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.position

#### Defined in

[packages/websg-types/types/websg.d.ts:1322](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1322)

---

### pressed

• `get` **pressed**(): `boolean`

Returns true if the button is pressed, otherwise false.

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:1075](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1075)

---

### released

• `get` **released**(): `boolean`

Returns true if the button is released, otherwise false.

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:1089](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1089)

---

### right

• `get` **right**(): `number`

Gets the right position of the UI element.

#### Returns

`number`

The right position value of the UI element.

#### Inherited from

UIElement.right

#### Defined in

[packages/websg-types/types/websg.d.ts:1340](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1340)

• `set` **right**(`value`): `void`

Sets the right position of the UI element.

#### Parameters

| Name    | Type     | Description                                      |
| :------ | :------- | :----------------------------------------------- |
| `value` | `number` | The new right position value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.right

#### Defined in

[packages/websg-types/types/websg.d.ts:1346](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1346)

---

### top

• `get` **top**(): `number`

Gets the top position of the UI element.

#### Returns

`number`

The top position value of the UI element.

#### Inherited from

UIElement.top

#### Defined in

[packages/websg-types/types/websg.d.ts:1328](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1328)

• `set` **top**(`value`): `void`

Sets the top position of the UI element.

#### Parameters

| Name    | Type     | Description                                    |
| :------ | :------- | :--------------------------------------------- |
| `value` | `number` | The new top position value for the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.top

#### Defined in

[packages/websg-types/types/websg.d.ts:1334](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1334)

---

### value

• `get` **value**(): `string`

Gets the text content of the UIText element.

#### Returns

`string`

The text content.

#### Inherited from

UIButtonProps.value

#### Defined in

[packages/websg-types/types/websg.d.ts:1678](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1678)

• `set` **value**(`value`): `void`

Sets the text content of the UIText element.

#### Parameters

| Name    | Type     | Description           |
| :------ | :------- | :-------------------- |
| `value` | `string` | The new text content. |

#### Returns

`void`

#### Inherited from

UIButtonProps.value

#### Defined in

[packages/websg-types/types/websg.d.ts:1684](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1684)

---

### width

• `get` **width**(): `number`

Gets the width of the UI element.

#### Returns

`number`

The width of the UI element.

#### Inherited from

UIElement.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1484](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1484)

• `set` **width**(`value`): `void`

Sets the width of the UI element.

#### Parameters

| Name    | Type     | Description                      |
| :------ | :------- | :------------------------------- |
| `value` | `number` | The new width of the UI element. |

#### Returns

`void`

#### Inherited from

UIElement.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1490](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1490)

## Methods

### addChild

▸ **addChild**(`element`): [`UIButton`](WebSG.UIButton.md)

Adds a child UI element to the current element.

#### Parameters

| Name      | Type                              | Description                  |
| :-------- | :-------------------------------- | :--------------------------- |
| `element` | [`UIElement`](WebSG.UIElement.md) | The child UI element to add. |

#### Returns

[`UIButton`](WebSG.UIButton.md)

The current UI element for chaining.

#### Inherited from

[UIText](WebSG.UIText.md).[addChild](WebSG.UIText.md#addchild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1556](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1556)

---

### children

▸ **children**(): [`UIElementIterator`](WebSG.UIElementIterator.md)

Returns an iterator for the children of the current UI element.

#### Returns

[`UIElementIterator`](WebSG.UIElementIterator.md)

An iterator for the children of the current UI element.

#### Inherited from

[UIText](WebSG.UIText.md).[children](WebSG.UIText.md#children)

#### Defined in

[packages/websg-types/types/websg.d.ts:1576](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1576)

---

### getChild

▸ **getChild**(`index`): `undefined` \| [`UIElement`](WebSG.UIElement.md)

Gets the child UI element at the specified index.

#### Parameters

| Name    | Type     | Description                        |
| :------ | :------- | :--------------------------------- |
| `index` | `number` | The index of the child UI element. |

#### Returns

`undefined` \| [`UIElement`](WebSG.UIElement.md)

The child UI element or undefined if the index is out of bounds.

#### Inherited from

[UIText](WebSG.UIText.md).[getChild](WebSG.UIText.md#getchild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1570](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1570)

---

### isPressed

▸ **isPressed**(): `boolean`

#### Returns

`boolean`

#### Defined in

[src/engine/scripting/websg-api.d.ts:477](https://github.com/matrix-org/thirdroom/blob/1005fb3d/src/engine/scripting/websg-api.d.ts#L477)

---

### removeChild

▸ **removeChild**(`element`): [`UIButton`](WebSG.UIButton.md)

Removes a child UI element from the current element.

#### Parameters

| Name      | Type                              | Description                     |
| :-------- | :-------------------------------- | :------------------------------ |
| `element` | [`UIElement`](WebSG.UIElement.md) | The child UI element to remove. |

#### Returns

[`UIButton`](WebSG.UIButton.md)

The current UI element for chaining.

#### Inherited from

[UIText](WebSG.UIText.md).[removeChild](WebSG.UIText.md#removechild)

#### Defined in

[packages/websg-types/types/websg.d.ts:1563](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1563)

---

### setBorderColor

▸ **setBorderColor**(`color`): `any`

#### Parameters

| Name    | Type           |
| :------ | :------------- |
| `color` | `Float32Array` |

#### Returns

`any`

#### Inherited from

[UIText](WebSG.UIText.md).[setBorderColor](WebSG.UIText.md#setbordercolor)

#### Defined in

[src/engine/scripting/websg-api.d.ts:424](https://github.com/matrix-org/thirdroom/blob/1005fb3d/src/engine/scripting/websg-api.d.ts#L424)

---

### setColor

▸ **setColor**(`color`): `any`

#### Parameters

| Name    | Type           |
| :------ | :------------- |
| `color` | `Float32Array` |

#### Returns

`any`

#### Inherited from

[UIText](WebSG.UIText.md).[setColor](WebSG.UIText.md#setcolor)

#### Defined in

[src/engine/scripting/websg-api.d.ts:423](https://github.com/matrix-org/thirdroom/blob/1005fb3d/src/engine/scripting/websg-api.d.ts#L423)

---

### setValue

▸ **setValue**(`value`): [`UIButton`](WebSG.UIButton.md)

#### Parameters

| Name    | Type     |
| :------ | :------- |
| `value` | `string` |

#### Returns

[`UIButton`](WebSG.UIButton.md)

#### Inherited from

[UIText](WebSG.UIText.md).[setValue](WebSG.UIText.md#setvalue)

#### Defined in

[src/engine/scripting/websg-api.d.ts:483](https://github.com/matrix-org/thirdroom/blob/1005fb3d/src/engine/scripting/websg-api.d.ts#L483)
