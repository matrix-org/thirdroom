import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { AudioDataResource } from "../resource/schema";
import { toArrayBuffer } from "../utils/arraybuffer";
import { AudioModule } from "./audio.main";

const MAX_AUDIO_BYTES = 640_000;

const audioExtensionToMimeType: { [key: string]: string } = {
  mp3: "audio/mpeg",
  aac: "audio/mpeg",
  opus: "audio/ogg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  mp4: "audio/mp4",
  webm: "audio/webm",
};

// TODO: Read fetch response headers
function getAudioMimeType(uri: string) {
  const extension = uri.split(".").pop() || "";
  return audioExtensionToMimeType[extension] || "audio/mpeg";
}

export class MainThreadAudioDataResource extends defineLocalResourceClass<typeof AudioDataResource, IMainThreadContext>(
  AudioDataResource
) {
  data: AudioBuffer | HTMLAudioElement | MediaStream | undefined;

  async load(ctx: IMainThreadContext) {
    const audio = getModule(ctx, AudioModule);

    let buffer: ArrayBuffer;
    let mimeType: string;

    if (this.bufferView) {
      buffer = toArrayBuffer(this.bufferView.buffer.data, this.bufferView.byteOffset, this.bufferView.byteLength);
      mimeType = this.mimeType;
    } else {
      const url = new URL(this.uri, window.location.href);

      if (url.protocol === "mediastream:") {
        this.data = audio.mediaStreams.get(url.pathname);
        return;
      }

      const response = await fetch(url.href);

      const contentType = response.headers.get("Content-Type");

      if (contentType) {
        mimeType = contentType;
      } else {
        mimeType = getAudioMimeType(this.uri);
      }

      buffer = await response.arrayBuffer();
    }

    if (buffer.byteLength > MAX_AUDIO_BYTES) {
      const objectUrl = URL.createObjectURL(new Blob([buffer], { type: mimeType }));

      const audioEl = new Audio();

      await new Promise((resolve, reject) => {
        audioEl.oncanplaythrough = resolve;
        audioEl.onerror = reject;
        audioEl.src = objectUrl;
      });

      this.data = audioEl;
    } else {
      this.data = await audio.context.decodeAudioData(buffer);
    }
  }
}
