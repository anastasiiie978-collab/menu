import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "dishes");
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class UploadError extends Error {}

export async function saveUploadedPhoto(file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new UploadError("Rasm hajmi 5 MB dan oshmasligi kerak");
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new UploadError("Faqat JPG, PNG yoki WEBP rasm yuklang");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/dishes/${filename}`;
}
