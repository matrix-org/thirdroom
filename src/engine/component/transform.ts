import { gameBuffer, renderableBuffer } from '.';
import { CursorBuffer, addView, addViewAoA } from '../allocator/CursorBuffer'
import { maxEntities } from '../config';

export interface TransformComponent {
  position: Float32Array[];
  rotation: Float32Array[];
  quaternion: Float32Array[];
  scale: Float32Array[];

  localMatrix: Float32Array[];
  worldMatrix: Float32Array[];
  matrixAutoUpdate: Uint8Array;
  worldMatrixNeedsUpdate: Uint8Array;
  interpolate: Uint8Array;

  parent: Uint32Array;
  firstChild: Uint32Array;
  prevSibling: Uint32Array;
  nextSibling: Uint32Array;
}

export const addViewVector3 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 3, n)
export const addViewVector4 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 4, n)
export const addViewMatrix4 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 16, n)

export const createTransformComponent = (gameBuffer: CursorBuffer, renderableBuffer: CursorBuffer, size: number): TransformComponent => ({
  position: addViewVector3(gameBuffer, size),
  scale: addViewVector3(gameBuffer, size),
  rotation: addViewVector3(gameBuffer, size),
  quaternion: addViewVector4(gameBuffer, size),

  localMatrix: addViewMatrix4(gameBuffer, size),
  worldMatrix: addViewMatrix4(renderableBuffer, size),
  matrixAutoUpdate: addView(gameBuffer, Uint8Array, size),
  worldMatrixNeedsUpdate: addView(renderableBuffer, Uint8Array, size),
  interpolate: addView(renderableBuffer, Uint8Array, size),

  parent: addView(gameBuffer, Uint32Array, size),
  firstChild: addView(gameBuffer, Uint32Array, size),
  prevSibling: addView(gameBuffer, Uint32Array, size),
  nextSibling: addView(gameBuffer, Uint32Array, size),
});

export const Transform = createTransformComponent(gameBuffer, renderableBuffer, maxEntities);
