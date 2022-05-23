import { GameState } from "../GameWorker";
import { swapReadBuffer } from "../allocator/TripleBuffer";

export const inputReadSystem = ({ input }: GameState) => {
  swapReadBuffer(input.tripleBuffer);
};
