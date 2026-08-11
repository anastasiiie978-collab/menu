"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkAdminPassword, verifyAdminSession } from "@/lib/auth";
import { createAdminSession, deleteAdminSession } from "@/lib/session";
import { createDish, updateDish, deleteDish, createCategory, deleteCategory } from "@/lib/dishes";
import { saveUploadedPhoto, UploadError } from "@/lib/upload";

export type FormState = { error?: string } | undefined;

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const valid = await checkAdminPassword(password);
  if (!valid) {
    return { error: "Noto'g'ri parol" };
  }
  await createAdminSession();
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await deleteAdminSession();
  redirect("/admin");
}

function readDishFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceRaw = String(formData.get("price") ?? "");
  const priceUnit = String(formData.get("priceUnit") ?? "").trim() || null;
  const price = Number(priceRaw);
  return { name, description, categoryId, price, priceUnit };
}

export async function createDishAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await verifyAdminSession())) redirect("/admin");

  const { name, description, categoryId, price, priceUnit } = readDishFields(formData);
  if (!name) return { error: "Taom nomini kiriting" };
  if (!categoryId) return { error: "Toifani tanlang" };
  if (!Number.isFinite(price) || price <= 0) return { error: "Narxni to'g'ri kiriting" };

  let photoUrl: string | null = null;
  const photoFile = formData.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photoFile);
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  await createDish({ categoryId, name, description, price, priceUnit, photoUrl });
  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function updateDishAction(
  dishId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await verifyAdminSession())) redirect("/admin");

  const { name, description, categoryId, price, priceUnit } = readDishFields(formData);
  if (!name) return { error: "Taom nomini kiriting" };
  if (!categoryId) return { error: "Toifani tanlang" };
  if (!Number.isFinite(price) || price <= 0) return { error: "Narxni to'g'ri kiriting" };

  const photoFile = formData.get("photo");
  let photoUrl: string | null | undefined = undefined;
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photoFile);
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  const patch: Parameters<typeof updateDish>[1] = {
    name,
    description,
    categoryId,
    price,
    priceUnit,
  };
  if (photoUrl !== undefined) patch.photoUrl = photoUrl;

  const updated = await updateDish(dishId, patch);
  if (!updated) return { error: "Taom topilmadi" };

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- formData is required to match the <form action> signature
export async function deleteDishAction(dishId: string, formData: FormData) {
  if (!(await verifyAdminSession())) redirect("/admin");
  await deleteDish(dishId);
  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- formData is required to match the <form action> signature
export async function toggleSoldOutAction(dishId: string, current: boolean, formData: FormData) {
  if (!(await verifyAdminSession())) redirect("/admin");
  await updateDish(dishId, { soldOut: !current });
  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
}

export async function createCategoryAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await verifyAdminSession())) redirect("/admin");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Toifa nomini kiriting" };

  await createCategory({ name });
  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- formData is required to match the <form action> signature
export async function deleteCategoryAction(categoryId: string, formData: FormData) {
  if (!(await verifyAdminSession())) redirect("/admin");
  await deleteCategory(categoryId);
  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
}
