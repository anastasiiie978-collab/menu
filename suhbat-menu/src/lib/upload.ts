import "server-only";
import { supabaseAdmin, supabaseUrl, DISH_PHOTOS_BUCKET } from "@/lib/supabaseClient";

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
  if (error) {
    // Every other failure path in the admin panel surfaces a fixed Uzbek
    // message; this was the one place that put the raw Supabase Storage SDK
    // error (English, e.g. "The resource already exists" / "Payload too
    // large") directly in front of the manager. Log the real reason for
    // debugging and show the same friendly message the rest of the app uses.
    console.error("Photo upload to storage failed:", error);
    throw new UploadError("Rasmni yuklab bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring");
  }

  const { data } = supabaseAdmin.storage.from(DISH_PHOTOS_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Removes a dish photo from the storage bucket.
 *
 * Nothing used to call anything like this: deleting a dish deleted its row and
 * left the JPEG in the bucket forever, and replacing a photo orphaned the old one
 * the same way. On a menu that gets re-photographed a few times a year that is a
 * bucket which only ever grows, and Supabase bills for it.
 *
 * `photoUrl` is whatever is stored on the dish row, so it is treated as untrusted
 * shape rather than assumed: anything that is not a public URL for this project's
 * own bucket is ignored rather than turned into a delete. Callers invoke this
 * *after* the database row is gone, and a failure here is logged, not thrown —
 * an orphaned file is untidy, a delete that reports failure after already
 * succeeding is worse.
 */
export async function deleteUploadedPhoto(photoUrl: string | null | undefined): Promise<void> {
  if (!photoUrl) return;

  const marker = `/storage/v1/object/public/${DISH_PHOTOS_BUCKET}/`;
  let objectPath: string;
  try {
    const url = new URL(photoUrl);
    // Same-project check. A dish that still carries a legacy `/uploads/dishes/…`
    // path from before the Supabase migration must not be interpreted as a
    // bucket key.
    if (url.hostname !== new URL(supabaseUrl).hostname) return;
    if (!url.pathname.startsWith(marker)) return;
    objectPath = decodeURIComponent(url.pathname.slice(marker.length));
  } catch {
    return;
  }

  if (!objectPath || objectPath.includes("..")) return;

  const { error } = await supabaseAdmin.storage.from(DISH_PHOTOS_BUCKET).remove([objectPath]);
  if (error) {
    console.error(`Could not remove orphaned photo "${objectPath}" from storage:`, error);
  }
}
