// One-time migration: pushes data/dishes.json + local /public/uploads/dishes photos
// into the Supabase project. Safe to re-run (skips categories/dishes that already
// exist by slug/name, and skips photo uploads that already exist in the bucket).
//
// Run with: node --env-file=.env.local scripts/migrate-to-supabase.mjs
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const CONTENT_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const BUCKET = "dish-photos";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — run with node --env-file=.env.local");
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const dataFile = path.join(process.cwd(), "data", "dishes.json");
const raw = await readFile(dataFile, "utf-8");
const { categories, dishes } = JSON.parse(raw);

console.log(`Migrating ${categories.length} categories and ${dishes.length} dishes...`);

const categoryIdMap = new Map();
for (const category of categories) {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", category.slug)
    .maybeSingle();

  if (existing) {
    categoryIdMap.set(category.id, existing.id);
    console.log(`  category "${category.name}" already exists, reusing`);
    continue;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ slug: category.slug, name: category.name, sort_order: category.sortOrder })
    .select("id")
    .single();
  if (error) throw new Error(`category "${category.name}": ${error.message}`);
  categoryIdMap.set(category.id, data.id);
  console.log(`  created category "${category.name}"`);
}

let uploaded = 0;
let inserted = 0;
let failed = 0;

for (const dish of dishes) {
  try {
    let photoUrl = null;
    if (dish.photoUrl) {
      const filename = path.basename(dish.photoUrl);
      const localPath = path.join(process.cwd(), "public", "uploads", "dishes", filename);
      const ext = path.extname(filename).toLowerCase();
      const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

      const bytes = await readFile(localPath);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, bytes, { contentType, upsert: true });
      if (uploadError) throw new Error(`photo upload: ${uploadError.message}`);

      photoUrl = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
      uploaded += 1;
    }

    const categoryId = categoryIdMap.get(dish.categoryId);
    if (!categoryId) throw new Error(`no mapped category for categoryId "${dish.categoryId}"`);

    const { error: insertError } = await supabase.from("dishes").insert({
      category_id: categoryId,
      name: dish.name,
      description: dish.description ?? "",
      price: dish.price,
      price_unit: dish.priceUnit,
      photo_url: photoUrl,
      sold_out: dish.soldOut ?? false,
      sort_order: dish.sortOrder,
    });
    if (insertError) throw new Error(`insert: ${insertError.message}`);

    inserted += 1;
    console.log(`  [${inserted}/${dishes.length}] ${dish.name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAILED "${dish.name}": ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`\nDone. ${inserted} dishes inserted, ${uploaded} photos uploaded, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
