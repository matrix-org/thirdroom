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
  BinaryScriptMessage,
  StringScriptMessage,
  InformXRMode,
}

export const UnreliableNetworkActions = [NetworkAction.UpdateChanged, NetworkAction.UpdateSnapshot];
