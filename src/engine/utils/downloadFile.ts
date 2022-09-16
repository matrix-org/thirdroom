export function downloadFile(buffer: ArrayBuffer | string, fileName: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType });
  const el = document.createElement("a");
  el.style.display = "none";
  document.body.appendChild(el);
  el.href = URL.createObjectURL(blob);
  el.download = fileName;
  el.click();
  document.body.removeChild(el);
}
