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
  UpdateNetworkId,
  ClientPosition,
  BinaryScriptMessage,
  StringScriptMessage,
  InformXRMode,
}

export const UnreliableNetworkActions = [
  NetworkAction.UpdateChanged,
  NetworkAction.UpdateSnapshot,
  NetworkAction.ClientPosition,
];
