import { addComponent } from "bitecs";

import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { AVATAR_HEIGHT } from "../player/common";
import { addNametag } from "../player/nametags.game";
import { Player } from "../player/Player";
import { RemoteNode, RemoteAudioEmitter, RemoteAudioSource, RemoteAudioData } from "../resource/RemoteResources";
import { getRemoteResource } from "../resource/resource.game";
import { AudioEmitterType } from "../resource/schema";
import { NetworkModule } from "./network.game";

export function addPlayerFromPeer(ctx: GameState, eid: number, peerId: string) {
  const network = getModule(ctx, NetworkModule);

  addComponent(ctx.world, Player, eid);

  const peerNode = getRemoteResource<RemoteNode>(ctx, eid)!;

  peerNode.audioEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
    type: AudioEmitterType.Positional,
    sources: [
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-01.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-02.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-03.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-04.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, {
          uri: `mediastream:${peerId}`,
        }),
        autoPlay: true,
      }),
    ],
  });

  peerNode.name = peerId;

  // if not our own avatar, add nametag
  if (peerId !== network.peerId) {
    addNametag(ctx, AVATAR_HEIGHT + AVATAR_HEIGHT / 3, peerNode, peerId);
  }
}
