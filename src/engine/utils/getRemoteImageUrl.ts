import { RemoteImage } from "../resource/RemoteResources";
import { toArrayBuffer } from "./arraybuffer";

export function getRemoteImageUrl(image: RemoteImage) {
  if (image.uri) {
    return image.uri;
  }

  if (image.bufferView) {
    const bufferView = image.bufferView;
    const buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);
    const blob = new Blob([buffer], { type: image.mimeType });
    return URL.createObjectURL(blob);
  }

  return "";
}
