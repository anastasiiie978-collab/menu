import "server-only";
import { supabaseAdmin, DISH_PHOTOS_BUCKET } from "@/lib/supabaseClient";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// `file.type` is a client-supplied MIME string — an authenticated admin
// session could otherwise upload arbitrary bytes with a spoofed
// "image/jpeg" content type into the public bucket. Verify the actual file
// signature (magic bytes) so what we store and serve really is an image.
const SIGNATURE_CHECKS: Record<string, (bytes: Buffer) => boolean> = {
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a,
  "image/webp": (b) =>
    b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
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

  const filename = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (!SIGNATURE_CHECKS[file.type](bytes)) {
    throw new UploadError("Rasm fayli buzilgan yoki noto'g'ri formatda");
  }

  const { error } = await supabaseAdmin.storage
    .from(DISH_PHOTOS_BUCKET)
    .upload(filename, bytes, { contentType: file.type, upsert: false });
  if (error) throw new UploadError(error.message);

  const { data } = supabaseAdmin.storage.from(DISH_PHOTOS_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
