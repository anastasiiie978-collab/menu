import "server-only";
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { Category, Dish, MenuData } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "dishes.json");

async function readMenuData(): Promise<MenuData> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as MenuData;
  } catch {
    return { categories: [], dishes: [] };
  }
}

async function writeMenuData(data: MenuData) {
  const tmpFile = `${DATA_FILE}.tmp`;
  await writeFile(tmpFile, JSON.stringify(data, null, 2) + "\n", "utf-8");
  await rename(tmpFile, DATA_FILE);
}

export async function getCategories(): Promise<Category[]> {
  const data = await readMenuData();
  return [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getDishes(): Promise<Dish[]> {
  const data = await readMenuData();
  return [...data.dishes].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getMenu(): Promise<MenuData> {
  const data = await readMenuData();
  return {
    categories: [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    dishes: [...data.dishes].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getDishById(id: string): Promise<Dish | null> {
  const data = await readMenuData();
  return data.dishes.find((d) => d.id === id) ?? null;
}

export type DishInput = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string | null;
  photoUrl: string | null;
};

export async function createDish(input: DishInput): Promise<Dish> {
  const data = await readMenuData();
  const now = new Date().toISOString();
  const maxSort = data.dishes.reduce((max, d) => Math.max(max, d.sortOrder), 0);
  const dish: Dish = {
    id: crypto.randomUUID(),
    ...input,
    soldOut: false,
    sortOrder: maxSort + 1,
    createdAt: now,
    updatedAt: now,
  };
  data.dishes.push(dish);
  await writeMenuData(data);
  return dish;
}

export type DishUpdate = Partial<DishInput> & { soldOut?: boolean };

export async function updateDish(id: string, patch: DishUpdate): Promise<Dish | null> {
  const data = await readMenuData();
  const dish = data.dishes.find((d) => d.id === id);
  if (!dish) return null;
  Object.assign(dish, patch, { updatedAt: new Date().toISOString() });
  await writeMenuData(data);
  return dish;
}

export async function deleteDish(id: string): Promise<boolean> {
  const data = await readMenuData();
  const index = data.dishes.findIndex((d) => d.id === id);
  if (index === -1) return false;
  data.dishes.splice(index, 1);
  await writeMenuData(data);
  return true;
}
