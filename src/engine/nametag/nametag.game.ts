import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { SharedNametagResource, nametagSchema, NametagTripleBuffer } from "../nametag/nametag.common";
import { ResourceId } from "../resource/resource.common";
import { NametagResourceType } from "./nametag.common";
import { createResource } from "../resource/resource.game";
import { GameAudioModule } from "../audio/audio.game";

export type NametagBufferView = ObjectBufferView<typeof nametagSchema, ArrayBuffer>;

export interface RemoteNametag {
  name: string;
  resourceId: ResourceId;

  bufferView: NametagBufferView;
  tripleBuffer: NametagTripleBuffer;

  get screenX(): number;
  set screenX(value: number);

  get screenY(): number;
  set screenY(value: number);

  get distanceFromCamera(): number;
  set distanceFromCamera(value: number);

  get inFrustum(): boolean;
  set inFrustum(value: boolean);
}

interface NametagProps {
  name: string;
  screenX?: number;
  screenY?: number;
  distanceFromCamera?: number;
  inFrustum?: boolean;
}

export function createRemoteNametag(ctx: GameState, props: NametagProps): RemoteNametag {
  const audioModule = getModule(ctx, GameAudioModule);
  const bufferView = createObjectBufferView(nametagSchema, ArrayBuffer);

  bufferView.screenX[0] = props?.screenX || 0;
  bufferView.screenY[0] = props?.screenY || 0;
  bufferView.distanceFromCamera[0] = props?.distanceFromCamera || 0;
  bufferView.inFrustum[0] = props?.inFrustum ? 1 : 0;

  const tripleBuffer = createObjectTripleBuffer(nametagSchema, ctx.gameToMainTripleBufferFlags);

  const name = props.name;

  const resourceId = createResource<SharedNametagResource>(
    ctx,
    Thread.Main,
    NametagResourceType,
    {
      name,
      tripleBuffer,
    },
    {
      name,
      dispose() {
        // TODO
      },
    }
  );

  const remoteNametag: RemoteNametag = {
    name,
    resourceId,
    bufferView,
    tripleBuffer,
    get screenX(): number {
      return bufferView.screenX[0];
    },
    set screenX(value: number) {
      bufferView.screenX[0] = value;
    },
    get screenY(): number {
      return bufferView.screenY[0];
    },
    set screenY(value: number) {
      bufferView.screenY[0] = value;
    },
    get distanceFromCamera(): number {
      return bufferView.distanceFromCamera[0];
    },
    set distanceFromCamera(value: number) {
      bufferView.distanceFromCamera[0] = value;
    },
    get inFrustum(): boolean {
      return !!bufferView.inFrustum[0];
    },
    set inFrustum(value: boolean) {
      bufferView.inFrustum[0] = value ? 1 : 0;
    },
  };

  audioModule.nametags.push(remoteNametag);

  return remoteNametag;
}

export function updateRemoteNametags(nametags: RemoteNametag[]) {
  for (let i = 0; i < nametags.length; i++) {
    const nametag = nametags[i];
    commitToObjectTripleBuffer(nametag.tripleBuffer, nametag.bufferView);
  }
}
