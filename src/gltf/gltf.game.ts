import { RemoteAccessor } from "../engine/accessor/accessor.game";
import { RemoteAudioSource } from "../engine/audio/audio.game";
import { RemoteBufferView } from "../engine/bufferView/bufferView.game";
import { RemoteCamera } from "../engine/camera/camera.game";
import { GameState } from "../engine/GameTypes";
import { RemoteLight } from "../engine/light/light.game";
import { RemoteMaterial } from "../engine/material/material.game";
import { Thread } from "../engine/module/module.common";
import { RemoteSampler } from "../engine/sampler/sampler.game";
import { RemoteScene } from "../engine/scene/scene.game";
import { RemoteTexture } from "../engine/texture/texture.game";

interface GLTFResource {
  scene: RemoteScene;
  scenes: RemoteScene[];
  cameras: RemoteCamera[];
  accessors: RemoteAccessor<any, any>[];
  bufferViews: RemoteBufferView<Thread>[];
  buffers: ArrayBuffer[];
  meshes: RemoteMesh[];
  lights: RemoteLight[];
  textures: RemoteTexture[];
  samplers: RemoteSampler[];
  materials: RemoteMaterial[];
  audioSources: RemoteAudioSource[];
  audioEmitters: RemoteAudioEmitters[];
}

export async function loadGLTF(ctx: GameState, uri: string): Promise<GLTFResource> {
  return Promise.reject(new Error("Not implemented"));
}

export function addGLTFLoaderComponent(ctx: GameState, eid: number, uri: string) {}
