// Client-side image resize/compression before upload.
// Reduces upload time, storage cost, and page weight.

export interface ResizeOptions {
  maxWidth?: number;   // default 1600
  maxHeight?: number;  // default 1600
  quality?: number;    // 0..1 — default 0.85
  mimeType?: string;   // default "image/jpeg" (use "image/png" to keep transparency)
}

export async function resizeImage(file: File, opts: ResizeOptions = {}): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    mimeType = file.type === "image/png" ? "image/png" : "image/jpeg",
  } = opts;

  // Skip non-images and SVGs (vector — no need to resize)
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  const bitmap = await loadBitmap(file);
  const { width: w, height: h } = scaleToFit(bitmap.width, bitmap.height, maxWidth, maxHeight);

  // If already smaller than target and JPEG, keep original (no recompress).
  if (bitmap.width <= maxWidth && bitmap.height <= maxHeight && file.type === mimeType && file.size < 400_000) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, mimeType, quality),
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.(png|jpe?g|webp|gif|bmp|tiff?)$/i, mimeType === "image/png" ? ".png" : ".jpg");
  return new File([blob], newName || "image.jpg", { type: mimeType });
}

function scaleToFit(w: number, h: number, maxW: number, maxH: number) {
  const r = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * r), height: Math.round(h * r) };
}

async function loadBitmap(file: File): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file); } catch { /* fall through */ }
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
