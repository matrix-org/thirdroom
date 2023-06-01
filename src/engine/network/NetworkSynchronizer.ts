import { CursorView } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { NetworkModule } from "./network.game";

export type SynchronizerEncoder = (eid: number, cursorView: CursorView) => void;
export type SynchronizerDecoder = (eid: number, cursorView: CursorView) => void;

export interface NetworkSynchronizer {
  id: number;
  decode(eid: number, cursorView: CursorView): void;
  encode(eid: number, cursorView: CursorView): void;
}

export function defineNetworkSynchronizer(
  ctx: GameState,
  id: number,
  encode: SynchronizerEncoder,
  decode: SynchronizerDecoder
): NetworkSynchronizer {
  const network = getModule(ctx, NetworkModule);

  const networkSynchronizer: NetworkSynchronizer = {
    id,
    decode,
    encode,
  };

  network.synchronizers.set(id, networkSynchronizer);

  return networkSynchronizer;
}
