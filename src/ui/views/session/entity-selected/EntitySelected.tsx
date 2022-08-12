import classNames from "classnames";

import "./EntitySelected.css";

interface ISelectedProps {
  entityId?: number;
  networkId?: number;
  peerId?: string;
}

export function EntitySelected({ entityId, networkId, peerId }: ISelectedProps) {
  return (
    <div className={classNames("EntitySelected", {})}>
      <div>{entityId ? `EntityId: ${entityId}` : ""}</div>
      <div>{networkId ? `NetworkId: ${networkId}` : ""}</div>
      <div>{peerId ? `PeerId: ${peerId}` : ""}</div>
    </div>
  );
}
