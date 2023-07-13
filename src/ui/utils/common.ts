export function getImageDimension(file: Blob): Promise<{
  w: number;
  h: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      resolve({
        w: img.width,
        h: img.height,
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

export function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 KB";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

export function getPercentage(total: number, value: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const host = document.body;
    const copyInput = document.createElement("input");
    copyInput.style.position = "fixed";
    copyInput.style.opacity = "0";
    copyInput.value = text;
    host.append(copyInput);

    copyInput.select();
    copyInput.setSelectionRange(0, 99999);
    document.execCommand("Copy");
    copyInput.remove();
  }
}

export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function loadImageUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const image = document.createElement("img");
    image.onload = () => {
      resolve(url);
    };
    image.src = url;
  });
}

export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

export function loadVideoElement(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;

    video.onloadeddata = () => {
      resolve(video);
      video.pause();
    };
    video.onerror = (e) => {
      reject(e);
    };

    video.src = url;
    video.load();
    video.play();
  });
}

export function getThumbnailDimensions(width: number, height: number): [number, number] {
  const MAX_WIDTH = 800;
  const MAX_HEIGHT = 600;
  let targetWidth = width;
  let targetHeight = height;
  if (targetHeight > MAX_HEIGHT) {
    targetWidth = Math.floor(targetWidth * (MAX_HEIGHT / targetHeight));
    targetHeight = MAX_HEIGHT;
  }
  if (targetWidth > MAX_WIDTH) {
    targetHeight = Math.floor(targetHeight * (MAX_WIDTH / targetWidth));
    targetWidth = MAX_WIDTH;
  }
  return [targetWidth, targetHeight];
}

export function getThumbnail(
  img: HTMLImageElement | SVGImageElement | HTMLVideoElement,
  width: number,
  height: number,
  thumbnailMimeType?: string
): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      resolve(undefined);
      return;
    }
    context.drawImage(img, 0, 0, width, height);

    canvas.toBlob((thumbnail) => {
      resolve(thumbnail ?? undefined);
    }, thumbnailMimeType ?? "image/jpeg");
  });
}

export function linkifyText(body: string) {
  const msgParts = [];

  const LINK_REGEX = /\b((https?:\/\/\S+)|(#\S+:\S+))[^\s.,!?)\]]/g;
  const links = body.match(LINK_REGEX);
  if (!links) {
    msgParts.push(document.createTextNode(body));
    return msgParts;
  }

  let bodyStr = body;
  for (let index = 0; index < links.length; index += 1) {
    const link = links[index];
    const linkIndex = bodyStr.indexOf(link);
    msgParts.push(document.createTextNode(bodyStr.slice(0, linkIndex)));

    const linkEl = document.createElement("a");
    linkEl.href = link.startsWith("#") ? `https://matrix.to/#/${link}` : link;
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";
    linkEl.textContent = link;
    msgParts.push(linkEl);

    bodyStr = bodyStr.slice(linkIndex + link.length);
  }

  msgParts.push(document.createTextNode(bodyStr));
  return msgParts;
}

export function userToEngineChannel(channel: number): number {
  return (1 / 255) * channel;
}
export function engineToUserChannel(channel: number): number {
  return Math.round(channel * 255);
}
export function userToEngineAlpha(channel: number): number {
  return (1 / 100) * channel;
}
export function engineToUserAlpha(channel: number): number {
  return Math.round(channel * 100);
}

export function convertRGB(rgb: Float32Array, convertChannel?: (channel: number) => number): Float32Array {
  return new Float32Array([
    convertChannel?.(rgb[0]) ?? rgb[0],
    convertChannel?.(rgb[1]) ?? rgb[1],
    convertChannel?.(rgb[2]) ?? rgb[2],
  ]);
}
export function convertRGBA(
  rgba: Float32Array,
  convertChannel?: (channel: number) => number,
  convertAlpha?: (channel: number) => number
): Float32Array {
  return new Float32Array([
    convertChannel?.(rgba[0]) ?? rgba[0],
    convertChannel?.(rgba[1]) ?? rgba[1],
    convertChannel?.(rgba[2]) ?? rgba[2],
    convertAlpha?.(rgba[3]) ?? rgba[3],
  ]);
}

export function inputFocused(): boolean {
  return document.activeElement?.tagName.toLowerCase() === "input";
}

export function saveData(blob: Blob, fileName: string) {
  const a = document.createElement("a");
  const url = window.URL.createObjectURL(blob);
  document.body.appendChild(a);
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function clamp(value: number, min?: number, max?: number): number {
  if (typeof min === "number" && value < min) return min;
  if (typeof max === "number" && value > max) return max;
  return value;
}

export function camelizeVariableName(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/([^a-zA-Z0-9_$])+/g, "");
}
