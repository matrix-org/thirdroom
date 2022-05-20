import { GameState } from "../GameThread";
import { swapReadBuffer } from "../TripleBuffer";

export const inputReadSystem = ({ input }: GameState) => {
  swapReadBuffer(input.tripleBuffer);
};
