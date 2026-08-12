"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkAdminPassword, verifyAdminSession } from "@/lib/auth";
import { createAdminSession, deleteAdminSession } from "@/lib/session";
import {
  createDish,
  updateDish,
  deleteDish,
  createCategory,
  deleteCategory,
  getCategories,
  getDishById,
} from "@/lib/dishes";
import { saveUploadedPhoto, UploadError } from "@/lib/upload";
import { checkLoginRateLimit, getClientFingerprint, recordLoginAttempt } from "@/lib/rateLimit";

export type FormState = { error?: string } | undefined;

// Sanity caps — generous enough to never block a real dish/category, tight enough to
// catch fat-finger typos (an extra zero on the price, a pasted paragraph as a name).
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_PRICE = 50_000_000;

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const fingerprint = await getClientFingerprint();

  // Checked before the password is even compared, so a locked-out client can't
  // keep burning guesses (and can't use response timing to probe validity).
  const verdict = await checkLoginRateLimit(fingerprint);
  if (!verdict.allowed) {
    if (verdict.reason === "unavailable") {
      return { error: "Tizimda vaqtincha nosozlik. Birozdan keyin urinib ko'ring" };
    }
    return {
      error: `Juda ko'p urinish. ${verdict.retryAfterMinutes} daqiqadan keyin qayta urinib ko'ring`,
    };
  }

  const password = String(formData.get("password") ?? "");
  const valid = await checkAdminPassword(password);
  await recordLoginAttempt(fingerprint, valid);

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
  if (name.length > MAX_NAME_LENGTH) return { error: `Taom nomi ${MAX_NAME_LENGTH} belgidan oshmasligi kerak` };
  if (description.length > MAX_DESCRIPTION_LENGTH)
    return { error: `Tavsif ${MAX_DESCRIPTION_LENGTH} belgidan oshmasligi kerak` };
  if (!categoryId) return { error: "Toifani tanlang" };
  if (!Number.isFinite(price) || price <= 0) return { error: "Narxni to'g'ri kiriting" };
  if (price > MAX_PRICE) return { error: "Narx juda katta ko'rinadi. Qaytadan tekshiring" };

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

  try {
    await createDish({ categoryId, name, description, price, priceUnit, photoUrl });
  } catch {
    return { error: "Taomni saqlab bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring" };
  }

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
  if (name.length > MAX_NAME_LENGTH) return { error: `Taom nomi ${MAX_NAME_LENGTH} belgidan oshmasligi kerak` };
  if (description.length > MAX_DESCRIPTION_LENGTH)
    return { error: `Tavsif ${MAX_DESCRIPTION_LENGTH} belgidan oshmasligi kerak` };
  if (!categoryId) return { error: "Toifani tanlang" };
  if (!Number.isFinite(price) || price <= 0) return { error: "Narxni to'g'ri kiriting" };
  if (price > MAX_PRICE) return { error: "Narx juda katta ko'rinadi. Qaytadan tekshiring" };

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

  let updated;
  try {
    updated = await updateDish(dishId, patch);
  } catch {
    return { error: "Taomni saqlab bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring" };
  }
  if (!updated) return { error: "Bu taom topilmadi — ehtimol uni boshqa qurilmada allaqachon o'chirib yuborishgan" };

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

// Note: redirect() is intentionally called *after* the try/catch below, never inside
// it — redirect() works by throwing a special error, and a catch-all block here would
// swallow that throw and silently break the redirect instead of navigating.

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- formData is required to match the <form action> signature
export async function deleteDishAction(dishId: string, formData: FormData) {
  if (!(await verifyAdminSession())) redirect("/admin");

  let errorMessage: string | null = null;
  try {
    await deleteDish(dishId);
  } catch {
    errorMessage = "Taomni o'chirib bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring";
  }

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");

  // Always redirect back to a clean URL — on failure this surfaces the error banner,
  // and on success it clears any stale ?error= left over from a previous attempt.
  redirect(errorMessage ? `/admin/dashboard?error=${encodeURIComponent(errorMessage)}` : "/admin/dashboard");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- formData is required to match the <form action> signature
export async function toggleSoldOutAction(dishId: string, formData: FormData) {
  if (!(await verifyAdminSession())) redirect("/admin");

  // Re-read the current state from the database instead of trusting a value bound at
  // page-render time — otherwise two devices toggling around the same time can race
  // and flip the dish to the wrong final state.
  let errorMessage: string | null = null;
  try {
    const dish = await getDishById(dishId);
    if (!dish) {
      errorMessage = "Bu taom topilmadi — ehtimol uni boshqa qurilmada allaqachon o'chirib yuborishgan";
    } else {
      await updateDish(dishId, { soldOut: !dish.soldOut });
    }
  } catch {
    errorMessage = "Taom holatini o'zgartirib bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring";
  }

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");

  // Always redirect back to a clean URL — on failure this surfaces the error banner,
  // and on success it clears any stale ?error= left over from a previous attempt.
  redirect(errorMessage ? `/admin/dashboard?error=${encodeURIComponent(errorMessage)}` : "/admin/dashboard");
}

export async function createCategoryAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await verifyAdminSession())) redirect("/admin");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Toifa nomini kiriting" };
  if (name.length > MAX_NAME_LENGTH) return { error: `Toifa nomi ${MAX_NAME_LENGTH} belgidan oshmasligi kerak` };

  try {
    const existing = await getCategories();
    const isDuplicate = existing.some((c) => c.name.trim().toLowerCase() === name.toLowerCase());
    if (isDuplicate) return { error: "Bu nomdagi toifa allaqachon mavjud" };

    await createCategory({ name });
  } catch {
    return { error: "Toifani saqlab bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring" };
  }

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- formData is required to match the <form action> signature
export async function deleteCategoryAction(categoryId: string, formData: FormData) {
  if (!(await verifyAdminSession())) redirect("/admin");

  let errorMessage: string | null = null;
  try {
    await deleteCategory(categoryId);
  } catch {
    errorMessage = "Toifani o'chirib bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring";
  }

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");

  // Always redirect back to a clean URL — on failure this surfaces the error banner,
  // and on success it clears any stale ?error= left over from a previous attempt.
  redirect(errorMessage ? `/admin/dashboard?error=${encodeURIComponent(errorMessage)}` : "/admin/dashboard");
}
