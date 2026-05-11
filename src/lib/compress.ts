/**
 * Client-side image compression — converts a File to a base64 JPEG
 * with a maximum dimension. Mirrors the PhotoUploader compression
 * that used to live in src/components/PhotoUploader.tsx.
 */
export async function compressImage(
  file: File,
  maxPx = 1024,
  quality = 0.85
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
