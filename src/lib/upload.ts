import "server-only";
import { supabaseAdmin, DISH_PHOTOS_BUCKET } from "@/lib/supabaseClient";

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

  const filename = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(DISH_PHOTOS_BUCKET)
    .upload(filename, bytes, { contentType: file.type, upsert: false });
  if (error) throw new UploadError(error.message);

  const { data } = supabaseAdmin.storage.from(DISH_PHOTOS_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
