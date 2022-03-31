import { ComponentType } from "bitecs";

export type MapComponentType<T> = { store: Map<number, T> }

export function defineMapComponent<T, C extends ComponentType<any>>(component: C) {
  (component as unknown as any).store = new Map();
  return component as C & MapComponentType<T>
}