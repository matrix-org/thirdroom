import { pipe } from "bitecs";

import { renderableBuffer } from "../component/buffers";
import { NOOP } from "../config.common";
import { GameState, IInitialGameThreadState } from "../GameTypes";
import { copyToWriteBuffer, swapWriteBuffer, TripleBufferState } from "../allocator/TripleBuffer";
import { WorkerMessageType } from "../WorkerMessage";
import { defineModule, getModule } from "../module/module.common";
import { enteredOwnedPlayerQuery } from "../network/network.game";

interface GameAudioState {
  tripleBuffer: TripleBufferState;
}

export const AudioModule = defineModule<GameState, IInitialGameThreadState, GameAudioState>({
  create: ({ audioTripleBuffer }) => ({
    tripleBuffer: audioTripleBuffer,
  }),
  init() {},
});

/**
 * API
 */

export const playAudio = (filepath: string, eid: number = NOOP) =>
  postMessage({
    type: WorkerMessageType.PlayAudio,
    filepath,
    eid,
  });

export const sendAudioPeerEntityMessage = (peerId: string, eid: number) =>
  postMessage({
    type: WorkerMessageType.SetAudioPeerEntity,
    peerId,
    eid,
  });

/**
 * Systems
 */

export const AudioTripleBufferSystem = (ctx: GameState) => {
  const { tripleBuffer } = getModule(ctx, AudioModule);
  copyToWriteBuffer(tripleBuffer, renderableBuffer);
  swapWriteBuffer(tripleBuffer);
  return ctx;
};

export const SetPlayerListenerSystem = (ctx: GameState) => {
  const newOwnedPlayers = enteredOwnedPlayerQuery(ctx.world);
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
  return ctx;
};

export const AudioSystem: (gameState: GameState) => GameState = pipe(SetPlayerListenerSystem, AudioTripleBufferSystem);
