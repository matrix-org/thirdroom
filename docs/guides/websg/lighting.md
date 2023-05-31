# Lighting

WebSG supports the following types of realtime lights:

- Point Lights
- Spot Lights
- Directional Lights

Third Room also supports Reflection Probes and Light Maps which are baked in Unity and exported in
the glTF file. Currently there is no way to create or modify reflection probes from the WebSG API.
Check out the Third Room Unity Exporter docs for more information [here](../unity/).

## Point Lights

```js
const light = world.createLight({
  type: WebSG.LightType.Point, // "point"
  color: [1, 1, 1],
  intensity: 1,
  range: 10,
});

light.color.set([1, 1, 1]);
light.color.r = 1;
light.color.g = 1;
light.color.b = 1;
light.intensity = 1;
light.range = 10;

node.light = light;
node.castShadow = true;
```

## Directional Lights

```js
const light = world.createLight({
  type: WebSG.LightType.Directional, // "directional"
  color: [1, 1, 1],
  intensity: 1,
});

light.color.set([1, 1, 1]);
light.color.r = 1;
light.color.g = 1;
light.color.b = 1;
light.intensity = 1;

node.light = light;
node.castShadow = true;
```

## Spot Lights

```js
const light = world.createLight({
  type: WebSG.LightType.Spot, // "spot"
  color: [1, 1, 1],
  intensity: 1,
  range: 10,
  innerConeAngle: Math.PI / 4,
  outerConeAngle: Math.PI,
});

light.color.set([1, 1, 1]);
light.color.r = 1;
light.color.g = 1;
light.color.b = 1;
light.intensity = 1;
light.range = 10;
light.innerConeAngle = Math.PI / 4;
light.outerConeAngle = Math.PI;

node.light = light;
node.castShadow = true;
```
