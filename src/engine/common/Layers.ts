export enum Layer {
  Default,
  EditorSelection,
}

export function addLayer(layers: number, layer: Layer): number {
  return layers | (1 << layer);
}

export function removeLayer(layers: number, layer: Layer): number {
  return layers & ~(1 << layer);
}

export function isInLayer(layers: number, layer: Layer): boolean {
  return (layers & (1 << layer)) !== 0;
}
