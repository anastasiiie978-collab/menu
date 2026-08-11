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
      price: input.price,
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
  if (patch.price !== undefined) payload.price = patch.price;
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

export async function deleteDish(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from("dishes").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export type CategoryInput = { name: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['‘’]/g, "")
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

export async function deleteCategory(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from("categories").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
