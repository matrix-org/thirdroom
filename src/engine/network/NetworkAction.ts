export enum NetworkAction {
  Create,
  Delete,
  UpdateChanged,
  UpdateSnapshot,
  FullChanged,
  FullSnapshot,
  Prefab,
  InformPlayerNetworkId,
  NewPeerSnapshot,
  RemoveOwnershipMessage,
  Command,
  UpdateCamera,
  UpdateNetworkId,
  ClientPosition,
  ScriptMessage,
  InformXRMode,
}

export const UnreliableNetworkActions = [
  NetworkAction.UpdateChanged,
  NetworkAction.UpdateSnapshot,
  NetworkAction.UpdateCamera,
  NetworkAction.ClientPosition,
];
