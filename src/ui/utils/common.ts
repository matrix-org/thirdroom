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
