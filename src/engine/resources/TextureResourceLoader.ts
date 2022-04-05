import { Texture } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from "./RemoteResourceManager";
import { ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";
import { GameState } from "../GameWorker";

export const TEXTURE_RESOURCE = "texture";

export enum TextureType {
  RGBE = "rgbe",
}

interface ITextureDef extends ResourceDefinition {
  type: "texture";
  textureType: TextureType;
  url: string;
}

interface RGBETexture extends ITextureDef {
  textureType: TextureType.RGBE;
}

export type TextureDef = RGBETexture;

export function TextureResourceLoader(manager: ResourceManager): ResourceLoader<TextureDef, Texture> {
  const rgbeLoader = new RGBELoader();

  return {
    type: TEXTURE_RESOURCE,
    async load(def) {
      let texture: Texture;

      switch (def.textureType) {
        case TextureType.RGBE:
          texture = await rgbeLoader.loadAsync(def.url);
          break;
        default:
          throw new Error(`Unknown texture type ${(def as unknown as any).textureType}`);
      }

      return {
        name: def.name,
        resource: texture,
      };
    },
  };
}

export function TextureRemoteResourceLoader(state: GameState): RemoteResourceLoader {
  return {
    type: TEXTURE_RESOURCE,
  };
}

export function loadRemoteTexture(manager: RemoteResourceManager, textureDef: TextureDef): number {
  return loadRemoteResource(manager, textureDef);
}
