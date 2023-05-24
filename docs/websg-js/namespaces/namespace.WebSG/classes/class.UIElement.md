# UIElement

**`Class`**

Class representing a user interface element.

Implements the CSS Flexbox layout model.
https://css-tricks.com/snippets/css/a-guide-to-flexbox/

**Source:** [websg.d.ts:1451](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1451)

## Hierarchy

- [`UIText`](class.UIText.md)

## Constructors

### constructor()

> **new UIElement**(): [`UIElement`](class.UIElement.md)

#### Returns

[`UIElement`](class.UIElement.md)

## Properties

### backgroundColor

> `readonly` **backgroundColor**: [`RGBA`](class.RGBA.md)

Readonly RGBA object representing the background color of the UI element.

**Source:** [websg.d.ts:1708](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1708)

### borderColor

> `readonly` **borderColor**: [`RGBA`](class.RGBA.md)

Readonly RGBA object representing the border color of the UI element.

**Source:** [websg.d.ts:1713](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1713)

### borderRadius

> `readonly` **borderRadius**: [`Vector4`](class.Vector4.md)

Readonly Vector4 object representing the border radius of the UI element.

**Source:** [websg.d.ts:1733](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1733)

### borderWidth

> `readonly` **borderWidth**: [`Vector4`](class.Vector4.md)

Readonly Vector4 object representing the border width of the UI element.

**Source:** [websg.d.ts:1728](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1728)

### margin

> `readonly` **margin**: [`Vector4`](class.Vector4.md)

Readonly Vector4 object representing the margin of the UI element.

**Source:** [websg.d.ts:1723](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1723)

### padding

> `readonly` **padding**: [`Vector4`](class.Vector4.md)

Readonly Vector4 object representing the padding of the UI element.

**Source:** [websg.d.ts:1718](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1718)

## Accessors

### alignContent

> get **alignContent()**: [`FlexAlign`](../type-aliases/type-alias.FlexAlign.md)

**Source:** [websg.d.ts:1510](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1510) [websg.d.ts:1516](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1516)

### alignItems

> get **alignItems()**: [`FlexAlign`](../type-aliases/type-alias.FlexAlign.md)

**Source:** [websg.d.ts:1521](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1521) [websg.d.ts:1527](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1527)

### alignSelf

> get **alignSelf()**: [`FlexAlign`](../type-aliases/type-alias.FlexAlign.md)

**Source:** [websg.d.ts:1532](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1532) [websg.d.ts:1538](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1538)

### bottom

> get **bottom()**: `number`

**Source:** [websg.d.ts:1488](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1488) [websg.d.ts:1494](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1494)

### flexBasis

> get **flexBasis()**: `number`

**Source:** [websg.d.ts:1565](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1565) [websg.d.ts:1571](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1571)

### flexDirection

> get **flexDirection()**: [`FlexDirection`](../type-aliases/type-alias.FlexDirection.md)

**Source:** [websg.d.ts:1543](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1543) [websg.d.ts:1549](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1549)

### flexGrow

> get **flexGrow()**: `number`

**Source:** [websg.d.ts:1576](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1576) [websg.d.ts:1582](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1582)

### flexShrink

> get **flexShrink()**: `number`

**Source:** [websg.d.ts:1587](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1587) [websg.d.ts:1593](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1593)

### flexWrap

> get **flexWrap()**: [`FlexWrap`](../type-aliases/type-alias.FlexWrap.md)

**Source:** [websg.d.ts:1554](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1554) [websg.d.ts:1560](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1560)

### height

> get **height()**: `number`

**Source:** [websg.d.ts:1620](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1620) [websg.d.ts:1626](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1626)

### justifyContent

> get **justifyContent()**: [`FlexJustify`](../type-aliases/type-alias.FlexJustify.md)

**Source:** [websg.d.ts:1598](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1598) [websg.d.ts:1604](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1604)

### left

> get **left()**: `number`

**Source:** [websg.d.ts:1499](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1499) [websg.d.ts:1505](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1505)

### maxHeight

> get **maxHeight()**: `number`

**Source:** [websg.d.ts:1664](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1664) [websg.d.ts:1670](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1670)

### maxWidth

> get **maxWidth()**: `number`

**Source:** [websg.d.ts:1653](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1653) [websg.d.ts:1659](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1659)

### minHeight

> get **minHeight()**: `number`

**Source:** [websg.d.ts:1642](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1642) [websg.d.ts:1648](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1648)

### minWidth

> get **minWidth()**: `number`

**Source:** [websg.d.ts:1631](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1631) [websg.d.ts:1637](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1637)

### parent

> get **parent()**: `undefined` \| [`UIElement`](class.UIElement.md)

**Source:** [websg.d.ts:1698](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1698)

### position

> get **position()**: [`ElementPositionType`](../type-aliases/type-alias.ElementPositionType.md)

**Source:** [websg.d.ts:1455](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1455) [websg.d.ts:1461](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1461)

### right

> get **right()**: `number`

**Source:** [websg.d.ts:1477](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1477) [websg.d.ts:1483](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1483)

### top

> get **top()**: `number`

**Source:** [websg.d.ts:1466](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1466) [websg.d.ts:1472](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1472)

### type

> get **type()**: [`ElementType`](../type-aliases/type-alias.ElementType.md)

**Source:** [websg.d.ts:1703](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1703)

### width

> get **width()**: `number`

**Source:** [websg.d.ts:1609](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1609) [websg.d.ts:1615](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1615)

## Methods

### addChild()

> **addChild**(element: [`UIElement`](class.UIElement.md)): [`UIElement`](class.UIElement.md)

Adds a child UI element to the current element.

**Source:** [websg.d.ts:1676](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1676)

#### Parameters

| Parameter | Type                              | Description                  |
| :-------- | :-------------------------------- | :--------------------------- |
| element   | [`UIElement`](class.UIElement.md) | The child UI element to add. |

#### Returns

[`UIElement`](class.UIElement.md)

### children()

> **children**(): [`UIElementIterator`](class.UIElementIterator.md)

Returns an iterator for the children of the current UI element.

**Source:** [websg.d.ts:1693](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1693)

#### Returns

[`UIElementIterator`](class.UIElementIterator.md)

### getChild()

> **getChild**(index: `number`): `undefined` \| [`UIElement`](class.UIElement.md)

Gets the child UI element at the specified index or undefined if the index is out of bounds.

**Source:** [websg.d.ts:1688](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1688)

#### Parameters

| Parameter | Type     | Description                        |
| :-------- | :------- | :--------------------------------- |
| index     | `number` | The index of the child UI element. |

#### Returns

`undefined` \| [`UIElement`](class.UIElement.md)

### removeChild()

> **removeChild**(element: [`UIElement`](class.UIElement.md)): [`UIElement`](class.UIElement.md)

Removes a child UI element from the current element.

**Source:** [websg.d.ts:1682](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1682)

#### Parameters

| Parameter | Type                              | Description                     |
| :-------- | :-------------------------------- | :------------------------------ |
| element   | [`UIElement`](class.UIElement.md) | The child UI element to remove. |

#### Returns

[`UIElement`](class.UIElement.md)
