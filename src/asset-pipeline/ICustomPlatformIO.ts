import { PlatformIO } from "@gltf-transform/core";

export type ICustomPlatformIO = {
  resolve(base: string, path: string): string;
  readURI: {
    (uri: string, type: "view"): Promise<Uint8Array>;
    (uri: string, type: "text"): Promise<string>;
  };
  dirname: (uri: string) => string;
} & PlatformIO;
