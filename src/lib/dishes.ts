import "server-only";
import { supabasePublic, supabaseAdmin } from "@/lib/supabaseClient";
import type { Category, Dish, MenuData } from "@/lib/types";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

type DishRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  price_unit: string | null;
  photo_url: string | null;
  sold_out: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function toCategory(row: CategoryRow): Category {
  return { id: row.id, slug: row.slug, name: row.name, sortOrder: row.sort_order };
}

function toDish(row: DishRow): Dish {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: row.price,
    priceUnit: row.price_unit,
    photoUrl: row.photo_url,
    soldOut: row.sold_out,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabasePublic
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as CategoryRow[]).map(toCategory);
}

export async function getDishes(): Promise<Dish[]> {
  const { data, error } = await supabasePublic
    .from("dishes")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as DishRow[]).map(toDish);
}

export async function getMenu(): Promise<MenuData> {
  const [categories, dishes] = await Promise.all([getCategories(), getDishes()]);
  return { categories, dishes };
}

export async function getDishById(id: string): Promise<Dish | null> {
  const { data, error } = await supabasePublic.from("dishes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toDish(data as DishRow) : null;
}

export type DishInput = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string | null;
  photoUrl: string | null;
};

async function nextSortOrder(table: "dishes" | "categories"): Promise<number> {
  const { data } = await supabaseAdmin
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

export async function createDish(input: DishInput): Promise<Dish> {
  const { data, error } = await supabaseAdmin
    .from("dishes")
    .insert({
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      // `price` is an integer column (so'm has no subunit in practice); the
      // action layer only checks Number.isFinite + > 0, so a fractional
      // value (e.g. from a stray decimal point) would otherwise reach
      // Postgres and throw "invalid input syntax for type integer".
      price: Math.round(input.price),
      price_unit: input.priceUnit,
      photo_url: input.photoUrl,
      sold_out: false,
      sort_order: await nextSortOrder("dishes"),
    })
    .select()
    .single();
  if (error) throw error;
  return toDish(data as DishRow);
}

export type DishUpdate = Partial<DishInput> & { soldOut?: boolean };

export async function updateDish(id: string, patch: DishUpdate): Promise<Dish | null> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.categoryId !== undefined) payload.category_id = patch.categoryId;
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.price !== undefined) payload.price = Math.round(patch.price);
  if (patch.priceUnit !== undefined) payload.price_unit = patch.priceUnit;
  if (patch.photoUrl !== undefined) payload.photo_url = patch.photoUrl;
  if (patch.soldOut !== undefined) payload.sold_out = patch.soldOut;

  const { data, error } = await supabaseAdmin
    .from("dishes")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? toDish(data as DishRow) : null;
}

// Returns the deleted row's photo so the caller can clear it out of storage.
// Reading it back from the DELETE rather than with a separate SELECT first keeps
// this a single round trip and, more importantly, means the URL returned is the
// one that was actually deleted — not one that a concurrent edit had already
// replaced between the two queries.
export async function deleteDish(
  id: string
): Promise<{ deleted: boolean; photoUrl: string | null }> {
  const { data, error } = await supabaseAdmin
    .from("dishes")
    .delete()
    .eq("id", id)
    .select("id, photo_url");
  if (error) throw error;
  const row = data?.[0] as { photo_url: string | null } | undefined;
  return { deleted: Boolean(row), photoUrl: row?.photo_url ?? null };
}

export type CategoryInput = { name: string };

// Uzbek Latin uses an apostrophe-like modifier for "o'" and "g'" (o'zbek,
// bog'). People type it with whichever glyph their keyboard produces —
// straight apostrophe, curly quotes, backtick, or the "proper" Unicode
// modifier letters (ʻ U+02BB, ʼ U+02BC) — and all of them should elide the
// same way so the same word always yields the same slug.
const ELIDABLE_APOSTROPHES = /['`‘’ʻʼ]/g;

// Minimal Cyrillic -> Latin map for the Uzbek alphabet, so a category name
// typed in Cyrillic still produces a meaningful slug instead of collapsing
// to nothing (see below). Multi-char digraphs must be listed before their
// single-char prefixes since we replace on this map in order.
const CYRILLIC_TO_LATIN: [RegExp, string][] = [
  [/ц/g, "ts"],
  [/ё/g, "yo"],
  [/ю/g, "yu"],
  [/я/g, "ya"],
  [/ш/g, "sh"],
  [/ч/g, "ch"],
  [/ў/g, "o'"],
  [/қ/g, "q"],
  [/ғ/g, "g'"],
  [/ҳ/g, "h"],
  [/й/g, "y"],
  [/а/g, "a"],
  [/б/g, "b"],
  [/в/g, "v"],
  [/г/g, "g"],
  [/д/g, "d"],
  [/е/g, "e"],
  [/ж/g, "j"],
  [/з/g, "z"],
  [/и/g, "i"],
  [/к/g, "k"],
  [/л/g, "l"],
  [/м/g, "m"],
  [/н/g, "n"],
  [/о/g, "o"],
  [/п/g, "p"],
  [/р/g, "r"],
  [/с/g, "s"],
  [/т/g, "t"],
  [/у/g, "u"],
  [/ф/g, "f"],
  [/х/g, "x"],
  [/ъ/g, ""],
  [/ь/g, ""],
  [/э/g, "e"],
];

function cyrillicToLatin(text: string): string {
  let out = text;
  for (const [pattern, replacement] of CYRILLIC_TO_LATIN) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function slugify(name: string): string {
  return cyrillicToLatin(name.toLowerCase())
    .replace(ELIDABLE_APOSTROPHES, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const base = slugify(input.name) || "toifa";
  const { data: existing } = await supabaseAdmin.from("categories").select("slug").like("slug", `${base}%`);
  const taken = new Set((existing ?? []).map((r) => r.slug));
  let slug = base;
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({ name: input.name, slug, sort_order: await nextSortOrder("categories") })
    .select()
    .single();
  if (error) throw error;
  return toCategory(data as CategoryRow);
}

export async function deleteCategory(
  id: string
): Promise<{ deleted: boolean; photoUrls: string[] }> {
  // The confirmation dialog in the UI tells the manager that deleting a category
  // also deletes its dishes, so make that true here rather than assuming the
  // database enforces it via an ON DELETE CASCADE foreign key. If it doesn't,
  // deleting a non-empty category would otherwise fail outright with an opaque
  // foreign-key violation instead of doing what was promised.
  const { data: removedDishes, error: dishesError } = await supabaseAdmin
    .from("dishes")
    .delete()
    .eq("category_id", id)
    .select("photo_url");
  if (dishesError) throw dishesError;

  const { data, error } = await supabaseAdmin.from("categories").delete().eq("id", id).select("id");
  if (error) throw error;

  // Every photo that belonged to a dish in this category, so the caller can take
  // them out of the bucket too. Deleting four dishes used to leave four JPEGs
  // behind with nothing left pointing at them.
  const photoUrls = ((removedDishes ?? []) as { photo_url: string | null }[])
    .map((row) => row.photo_url)
    .filter((url): url is string => Boolean(url));

  return { deleted: (data?.length ?? 0) > 0, photoUrls };
}
