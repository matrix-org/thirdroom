export enum AssetType {
  Image = "m.image",
  Audio = "m.audio",
  Video = "m.video",
  Script = "org.matrix.msc4032.world.script",
  Model = "org.matrix.msc4032.world.model",
  Avatar = "org.matrix.msc4032.world.avatar",
  Scene = "org.matrix.msc4032.world.scene",
  Object = "org.matrix.msc4032.world.object",
  Prefab = "org.matrix.msc4032.world.prefab",
}

export type ThumbnailInfo = {
  w?: number;
  h?: number;
  mimetype?: string;
  size?: number;
};

export type ScriptInfo = {
  mimetype?: string;
  size?: number;
};

export type Attribution = {
  author_name: string;
  author_url?: string;
  title?: string;
  source_url?: string;
  license?: string;
};

export type ObjectInfo = {
  vertices?: number;
  textures?: number;
  materials?: number;
  animations?: boolean;
  audio?: boolean;
  boundingBox?: {
    min?: number[];
    max?: number[];
  };
};

export type BaseAssetInfo = {
  mimetype?: string;
  size?: number;
};

export type ImageAssetInfo = BaseAssetInfo & {
  w?: number;
  h?: number;
  thumbnail_url?: string;
  thumbnail_info?: ThumbnailInfo;
};

export type AudioAssetInfo = BaseAssetInfo & {
  duration?: number;
};

export type VideoAssetInfo = BaseAssetInfo & {
  duration?: number;
  w?: number;
  h?: number;
  thumbnail_url?: string;
  thumbnail_info?: ThumbnailInfo;
};

export type ScriptAssetInfo = BaseAssetInfo;

export type ModelAssetInfo = BaseAssetInfo &
  ObjectInfo & {
    thumbnail_url?: string;
    thumbnail_info?: ThumbnailInfo;
  };

export type AvatarAssetInfo = BaseAssetInfo &
  ObjectInfo & {
    thumbnail_url?: string;
    thumbnail_info?: ThumbnailInfo;
    script_info?: ScriptInfo;
    script_url?: string;
  };

export type SceneAssetInfo = BaseAssetInfo &
  ObjectInfo & {
    thumbnail_url?: string;
    thumbnail_info?: ThumbnailInfo;
    script_info?: ScriptInfo;
    script_url?: string;
  };

export type ObjectAssetInfo = BaseAssetInfo &
  ObjectInfo & {
    thumbnail_url?: string;
    thumbnail_info?: ThumbnailInfo;
    script_info?: ScriptInfo;
    script_url?: string;
  };

export type PrefabAssetInfo = {
  thumbnail_url?: string;
  thumbnail_info?: ThumbnailInfo;
};

export type AssetInfo<T extends AssetType> = T extends AssetType.Image
  ? ImageAssetInfo
  : T extends AssetType.Audio
  ? AudioAssetInfo
  : T extends AssetType.Video
  ? VideoAssetInfo
  : T extends AssetType.Script
  ? ScriptAssetInfo
  : T extends AssetType.Model
  ? ModelAssetInfo
  : T extends AssetType.Avatar
  ? AvatarAssetInfo
  : T extends AssetType.Scene
  ? SceneAssetInfo
  : T extends AssetType.Object
  ? ObjectAssetInfo
  : T extends AssetType.Prefab
  ? PrefabAssetInfo
  : never;

export type Asset<T extends AssetType> = {
  title: string;
  description?: string;
  url: string;
  asset_type: T;
  attribution?: Attribution[];
  info?: AssetInfo<T>;
};
