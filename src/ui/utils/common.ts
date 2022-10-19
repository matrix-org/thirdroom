export function getImageDimension(file: File): Promise<{
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
