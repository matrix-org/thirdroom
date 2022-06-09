import { pipe } from "bitecs";

import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { WorkerMessageType } from "../WorkerMessage";
import { defineModule, getModule, Thread } from "../module/module.common";
import { enteredOwnedPlayerQuery } from "../network/network.game";
import { AudioMessageType } from "./audio.common";
import {
  commitToTripleBufferView,
  createTripleBufferBackedObjectBufferView,
  TripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { worldMatrixObjectBufferSchema } from "../component/transform.common";
import { worldMatrixObjectBuffer } from "../component/transform";

interface GameAudioState {
  sharedAudioTransforms: TripleBufferBackedObjectBufferView<typeof worldMatrixObjectBufferSchema, ArrayBuffer>;
}

export const AudioModule = defineModule<GameState, GameAudioState>({
  name: "audio",
  create(ctx, { sendMessage }) {
    const sharedAudioTransforms = createTripleBufferBackedObjectBufferView(
      worldMatrixObjectBufferSchema,
      worldMatrixObjectBuffer,
      ctx.gameToMainTripleBufferFlags
    );

    sendMessage(Thread.Main, AudioMessageType.InitializeAudioTransforms, {
      sharedAudioTransforms,
    });

    return { sharedAudioTransforms };
  },
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
  const { sharedAudioTransforms } = getModule(ctx, AudioModule);
  commitToTripleBufferView(sharedAudioTransforms);
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
