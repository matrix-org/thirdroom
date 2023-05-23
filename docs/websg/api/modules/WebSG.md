[WebSG API](../README.md) / WebSG

# Namespace: WebSG

WebSG Documentation

**`See`**

[Documentation](https://github.com/matrix-org/thirdroom/tree/main/docs)

## Table of contents

### Enumerations

- [AccessorComponentType](../enums/WebSG.AccessorComponentType.md)
- [AccessorType](../enums/WebSG.AccessorType.md)
- [ElementPositionType](../enums/WebSG.ElementPositionType.md)
- [ElementType](../enums/WebSG.ElementType.md)
- [FlexAlign](../enums/WebSG.FlexAlign.md)
- [FlexDirection](../enums/WebSG.FlexDirection.md)
- [FlexJustify](../enums/WebSG.FlexJustify.md)
- [FlexWrap](../enums/WebSG.FlexWrap.md)
- [MeshPrimitiveAttribute](../enums/WebSG.MeshPrimitiveAttribute.md)
- [MeshPrimitiveMode](../enums/WebSG.MeshPrimitiveMode.md)

### Classes

- [Accessor](../classes/WebSG.Accessor.md)
- [Collider](../classes/WebSG.Collider.md)
- [Collision](../classes/WebSG.Collision.md)
- [CollisionIterator](../classes/WebSG.CollisionIterator.md)
- [CollisionListener](../classes/WebSG.CollisionListener.md)
- [Component](../classes/WebSG.Component.md)
- [ComponentStore](../classes/WebSG.ComponentStore.md)
- [Image](../classes/WebSG.Image.md)
- [Interactable](../classes/WebSG.Interactable.md)
- [Light](../classes/WebSG.Light.md)
- [Material](../classes/WebSG.Material.md)
- [Matrix4](../classes/WebSG.Matrix4.md)
- [Mesh](../classes/WebSG.Mesh.md)
- [MeshPrimitive](../classes/WebSG.MeshPrimitive.md)
- [Node](../classes/WebSG.Node.md)
- [NodeIterator](../classes/WebSG.NodeIterator.md)
- [PhysicsBody](../classes/WebSG.PhysicsBody.md)
- [Quaternion](../classes/WebSG.Quaternion.md)
- [RGB](../classes/WebSG.RGB.md)
- [RGBA](../classes/WebSG.RGBA.md)
- [ReadonlyMatrix4](../classes/WebSG.ReadonlyMatrix4.md)
- [Scene](../classes/WebSG.Scene.md)
- [Texture](../classes/WebSG.Texture.md)
- [UIButton](../classes/WebSG.UIButton.md)
- [UICanvas](../classes/WebSG.UICanvas.md)
- [UIElement](../classes/WebSG.UIElement.md)
- [UIElementIterator](../classes/WebSG.UIElementIterator.md)
- [UIText](../classes/WebSG.UIText.md)
- [Vector2](../classes/WebSG.Vector2.md)
- [Vector3](../classes/WebSG.Vector3.md)
- [Vector4](../classes/WebSG.Vector4.md)
- [World](../classes/WebSG.World.md)

### Interfaces

- [AccessorFromProps](../interfaces/WebSG.AccessorFromProps.md)
- [BoxMeshProps](../interfaces/WebSG.BoxMeshProps.md)
- [ColliderProps](../interfaces/WebSG.ColliderProps.md)
- [ExtensionItem](../interfaces/WebSG.ExtensionItem.md)
- [Extensions](../interfaces/WebSG.Extensions.md)
- [InboundMatrixEvent](../interfaces/WebSG.InboundMatrixEvent.md)
- [LightProps](../interfaces/WebSG.LightProps.md)
- [MaterialProps](../interfaces/WebSG.MaterialProps.md)
- [Matrix](../interfaces/WebSG.Matrix.md)
- [MeshPrimitiveAttributeItem](../interfaces/WebSG.MeshPrimitiveAttributeItem.md)
- [MeshPrimitiveAttributesList](../interfaces/WebSG.MeshPrimitiveAttributesList.md)
- [MeshPrimitiveProps](../interfaces/WebSG.MeshPrimitiveProps.md)
- [MeshPrimitivePropsList](../interfaces/WebSG.MeshPrimitivePropsList.md)
- [MeshPrimitiveTarget](../interfaces/WebSG.MeshPrimitiveTarget.md)
- [MeshPrimitiveTargetsList](../interfaces/WebSG.MeshPrimitiveTargetsList.md)
- [MeshProps](../interfaces/WebSG.MeshProps.md)
- [Network](../interfaces/WebSG.Network.md)
- [NodeProps](../interfaces/WebSG.NodeProps.md)
- [OrbitOptions](../interfaces/WebSG.OrbitOptions.md)
- [OutboundMatrixEvent](../interfaces/WebSG.OutboundMatrixEvent.md)
- [PhysicsBodyProps](../interfaces/WebSG.PhysicsBodyProps.md)
- [SceneProps](../interfaces/WebSG.SceneProps.md)
- [ThirdRoom](../interfaces/WebSG.ThirdRoom.md)
- [UIButtonProps](../interfaces/WebSG.UIButtonProps.md)
- [UICanvasBase](../interfaces/WebSG.UICanvasBase.md)
- [UICanvasProps](../interfaces/WebSG.UICanvasProps.md)
- [UIElementBase](../interfaces/WebSG.UIElementBase.md)
- [UIElementProps](../interfaces/WebSG.UIElementProps.md)
- [UITextProps](../interfaces/WebSG.UITextProps.md)
- [UnlitMaterialProps](../interfaces/WebSG.UnlitMaterialProps.md)

### Type Aliases

- [AlphaMode](WebSG.md#alphamode)
- [InteractableProps](WebSG.md#interactableprops)
- [InteractableType](WebSG.md#interactabletype)
- [LightType](WebSG.md#lighttype)

### Variables

- [AlphaMode](WebSG.md#alphamode-1)
- [ColliderType](WebSG.md#collidertype)
- [InteractableType](WebSG.md#interactabletype-1)
- [PhysicsBodyType](WebSG.md#physicsbodytype)

## Type Aliases

### AlphaMode

Ƭ **AlphaMode**: ``"OPAQUE"`` \| ``"BLEND"`` \| ``"MASK"``

AlphaMode is a union type representing the available alpha modes.

#### Defined in

[packages/websg-types/types/websg.d.ts:306](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L306)

[packages/websg-types/types/websg.d.ts:311](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L311)

___

### InteractableProps

Ƭ **InteractableProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `type` | [`InteractableType`](WebSG.md#interactabletype-1) |

#### Defined in

[packages/websg-types/types/websg.d.ts:174](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L174)

___

### InteractableType

Ƭ **InteractableType**: ``1`` \| ``2``

#### Defined in

[packages/websg-types/types/websg.d.ts:168](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L168)

[packages/websg-types/types/websg.d.ts:169](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L169)

___

### LightType

Ƭ **LightType**: `Object`

LightType is an object containing the string constants for the available types of lights.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `Directional` | ``"directional"`` |
| `Point` | ``"point"`` |
| `Spot` | ``"spot"`` |

#### Defined in

[packages/websg-types/types/websg.d.ts:223](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L223)

## Variables

### AlphaMode

• **AlphaMode**: `Object`

AlphaMode is an object containing the string constants for the available alpha modes.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `BLEND` | ``"BLEND"`` |
| `MASK` | ``"MASK"`` |
| `OPAQUE` | ``"OPAQUE"`` |

#### Defined in

[packages/websg-types/types/websg.d.ts:306](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L306)

[packages/websg-types/types/websg.d.ts:311](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L311)

___

### ColliderType

• `Const` **ColliderType**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `Box` | ``"box"`` |

#### Defined in

[src/engine/scripting/websg-api.d.ts:499](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L499)

___

### InteractableType

• **InteractableType**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `Grabbable` | ``2`` |
| `Interactable` | ``1`` |

#### Defined in

[packages/websg-types/types/websg.d.ts:168](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L168)

[packages/websg-types/types/websg.d.ts:169](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L169)

___

### PhysicsBodyType

• `Const` **PhysicsBodyType**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `Kinematic` | ``"kinematic"`` |

#### Defined in

[src/engine/scripting/websg-api.d.ts:503](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L503)
