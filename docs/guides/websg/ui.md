# User Interface

`WebSG` comes with an API for creating and managing user interfaces in the 3D world. This includes things like buttons, text, images, and layout containers. UI properties are based off of the flexbox layout concept.

## UICanvas

The `UICanvas` object represents a canvas onto which UI elements can be drawn. It has properties for its size and methods for adding and removing UI elements.

```typescript
// Create a new UICanvas object
const canvas = world.createUICanvas({
  size: [8, 6], // size represents the 3D plane's size in meters
  width: 800, // width is in pixels
  height: 600, // height is in pixels
});
```

## Size vs width/height

The `size` property of a `UICanvas` or `UIElement` is a `Vector2` representing the 3D in-world size of the object in meters. The separate `width` and `height` properties represent the width and height of the canvas in pixels.

```typescript
// Set the size of a UICanvas
const canvas = world.createUICanvas({
  size: [8, 6],
  width: 800,
  height: 600,
});

// Set the width and height of a UIElement
const element = world.createUIElement({
  width: 100,
  height: 50,
});
```

## Redraw

The `redraw` method of a `UICanvas` is used to trigger a redraw of the canvas. This is necessary to call when the object or its contents have changed.

```typescript
canvas.redraw();
```

## UIElement

The `UIElement` object represents a generic user interface element. It has properties for its size, position, and visibility, and methods for adding and removing child elements.

```typescript
// Create a new UIElement object
const element = world.createUIElement({
  width: 100,
  height: 50,
  padding: [15, 15, 15, 15], // top, right, bottom, left
  margin: [15, 15, 15, 15], // top, right, bottom, left
});
```

## UIButton

The `UIButton` object represents a button in the user interface. It inherits from `UIElement` and has additional properties like `label`.

```typescript
// Create a new UIButton object
const button = world.createUIButton({
  label: "Click me",
});
```

## UIText

The `UIText` object represents a text element in the user interface. It inherits from `UIElement` and has additional properties like `text` and `font`.

```typescript
// Create a new UIText object
const text = world.createUIText({
  text: "Hello, world!",
  fontSize: 12, // in pixels
});
```

## Flexbox

Flexbox, or the Flexible Box Layout, is a layout model in CSS that is designed to provide a more efficient way to lay out, align, and distribute space among items in a container. `WebSG` uses the flexbox model to lay out its child elements.

```typescript
// Create a new UIFlexContainer object
const canvas = world.createUICanvas({
  direction: "row",
  justifyContent: "space-between",
});

// Add some child elements to the container
const element1 = world.createUIElement({ width: 10, height: 10 });
const element2 = world.createUIElement({ width: 10, height: 10 });
canvas.addChild(element1);
canvas.addChild(element2);
```
