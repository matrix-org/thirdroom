import { pipe } from "bitecs";

import { renderableBuffer } from "../component/buffers";
import { enteredOwnedPlayerQuery } from "../component/Player";
import { GameState } from "../GameThread";
import { copyToWriteBuffer, swapWriteBuffer } from "../TripleBuffer";
import { WorkerMessageType } from "../WorkerMessage";

export const sendAudioPeerEntityMessage = (peerId: string, eid: number) => {
  postMessage({
    type: WorkerMessageType.SetAudioPeerEntity,
    peerId,
    eid,
  });
};

export const audioTripleBufferSystem = (gameState: GameState) => {
  const {
    audio: { tripleBuffer },
  } = gameState;
  copyToWriteBuffer(tripleBuffer, renderableBuffer);
  swapWriteBuffer(tripleBuffer);
  return gameState;
};

export const sendPlayerEntitiesToMain = (gameState: GameState) => {
  const newOwnedPlayers = enteredOwnedPlayerQuery(gameState.world);
  for (let i = 0; i < newOwnedPlayers.length; i++) {
    const eid = newOwnedPlayers[i];
    postMessage({
      type: WorkerMessageType.SetAudioListener,
      eid,
    });
  }
  // todo: add Player component to new player entities coming in through the network
  // const newRemotePlayers = enteredRemotePlayerQuery(gameState.world);
  // for (let i = 0; i < newRemotePlayers.length; i++) {
  //   const eid = newRemotePlayers[i];
  //   const nid = Networked.networkId[eid];
  //   const peerIdIndex = getPeerIdFromNetworkId(nid);
  //   console.log("#sendPlayerEntitiesToMain() - WorkerMessageType.SetAudioPeerEntity");
  //   sendAudioPeerEntityMessage(peerId, eid);
  // }
};

export const gameAudioSystem: (gameState: GameState) => GameState = pipe(
  audioTripleBufferSystem,
  sendPlayerEntitiesToMain
);
