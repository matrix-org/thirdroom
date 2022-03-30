import { GameState } from "../GameWorker"
import { swapReadBuffer } from "../TripleBuffer"

export const inputReadSystem = ({ input }: GameState) => {
  swapReadBuffer(input.tripleBuffer)
}
