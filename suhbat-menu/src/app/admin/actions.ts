"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AuthConfigError, checkAdminPassword, verifyAdminSession } from "@/lib/auth";
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
import { saveUploadedPhoto, deleteUploadedPhoto, UploadError } from "@/lib/upload";
import { checkLoginRateLimit, getClientFingerprint, recordLoginAttempt } from "@/lib/rateLimit";
import { setActiveThemeId } from "@/lib/siteSettings";
import { isThemeId } from "@/lib/themes";
import { ACTION_ERRORS, type ActionErrorCode } from "@/lib/actionErrors";

export type FormState = { error?: string } | undefined;

// Sanity caps — generous enough to never block a real dish/category, tight enough to
// catch fat-finger typos (an extra zero on the price, a pasted paragraph as a name).
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_PRICE = 50_000_000;

// Always send the manager back to a clean URL: on failure this surfaces the error
// banner, and on success it clears any stale code left over from a previous attempt.
function backToDashboard(code: ActionErrorCode | null): never {
  redirect(code ? `/admin/dashboard?error=${code}` : "/admin/dashboard");
}

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
  let valid: boolean;
  try {
    valid = await checkAdminPassword(password);
  } catch (err) {
    if (err instanceof AuthConfigError) {
      // A misconfigured hash rejects the correct password exactly like a wrong one,
      // so say something different from "Noto'g'ri parol" — otherwise the manager
      // retypes their password all evening while the answer sits in the server log.
      console.error("Admin login is misconfigured:", err.message);
      return { error: "Server sozlamasida xatolik. Saytni sozlagan kishiga murojaat qiling" };
    }
    throw err;
  }
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

// Shared by create and update, which had drifted into two copies of the same six
// checks — the kind of pair where a later change lands in one and not the other.
function validateDishFields(fields: ReturnType<typeof readDishFields>): string | null {
  const { name, description, categoryId, price } = fields;
  if (!name) return "Taom nomini kiriting";
  if (name.length > MAX_NAME_LENGTH) return `Taom nomi ${MAX_NAME_LENGTH} belgidan oshmasligi kerak`;
  if (description.length > MAX_DESCRIPTION_LENGTH)
    return `Tavsif ${MAX_DESCRIPTION_LENGTH} belgidan oshmasligi kerak`;
  if (!categoryId) return "Toifani tanlang";
  if (!Number.isFinite(price) || price <= 0) return "Narxni to'g'ri kiriting";
  if (price > MAX_PRICE) return "Narx juda katta ko'rinadi. Qaytadan tekshiring";
  return null;
}

export async function createDishAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await verifyAdminSession())) redirect("/admin");

  const fields = readDishFields(formData);
  const invalid = validateDishFields(fields);
  if (invalid) return { error: invalid };
  const { name, description, categoryId, price, priceUnit } = fields;

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
    // The photo reached the bucket a moment ago but the row it belonged to never
    // existed, so nothing will ever reference it. Clean it up rather than leaving
    // a file behind every time the database hiccups.
    await deleteUploadedPhoto(photoUrl);
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

  const fields = readDishFields(formData);
  const invalid = validateDishFields(fields);
  if (invalid) return { error: invalid };
  const { name, description, categoryId, price, priceUnit } = fields;

  const photoFile = formData.get("photo");
  let photoUrl: string | null | undefined = undefined;
  // Captured before the update so the photo being replaced can be removed from
  // storage afterwards; re-photographing a dish used to leave the old JPEG in the
  // bucket with nothing pointing at it.
  let previousPhotoUrl: string | null = null;

  if (photoFile instanceof File && photoFile.size > 0) {
    previousPhotoUrl = (await getDishById(dishId))?.photoUrl ?? null;
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
    if (photoUrl) await deleteUploadedPhoto(photoUrl);
    return { error: "Taomni saqlab bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring" };
  }
  if (!updated) {
    if (photoUrl) await deleteUploadedPhoto(photoUrl);
    return { error: ACTION_ERRORS["dish-missing"] };
  }

  // Only once the row is definitely pointing at the new file.
  if (photoUrl && previousPhotoUrl && previousPhotoUrl !== photoUrl) {
    await deleteUploadedPhoto(previousPhotoUrl);
  }

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

  let code: ActionErrorCode | null = null;
  try {
    const { deleted, photoUrl } = await deleteDish(dishId);
    if (!deleted) {
      // This used to report success for a dish that was already gone, so two
      // managers deleting the same dish both saw it work and neither learned the
      // list they were looking at was stale.
      code = "dish-missing";
    } else {
      await deleteUploadedPhoto(photoUrl);
    }
  } catch {
    code = "dish-delete-failed";
  }

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
  backToDashboard(code);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- formData is required to match the <form action> signature
export async function toggleSoldOutAction(dishId: string, formData: FormData) {
  if (!(await verifyAdminSession())) redirect("/admin");

  // Re-read the current state from the database instead of trusting a value bound at
  // page-render time — otherwise two devices toggling around the same time can race
  // and flip the dish to the wrong final state.
  let code: ActionErrorCode | null = null;
  try {
    const dish = await getDishById(dishId);
    if (!dish) {
      code = "dish-missing";
    } else {
      await updateDish(dishId, { soldOut: !dish.soldOut });
    }
  } catch {
    code = "dish-toggle-failed";
  }

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
  backToDashboard(code);
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

  let code: ActionErrorCode | null = null;
  try {
    const { photoUrls } = await deleteCategory(categoryId);
    // The dishes are gone; their photos would otherwise stay in the bucket
    // forever. Sequential rather than parallel: a category can hold dozens of
    // dishes and there is no rush on cleanup.
    for (const url of photoUrls) await deleteUploadedPhoto(url);
  } catch {
    code = "category-delete-failed";
  }

  revalidatePath("/menu");
  revalidatePath("/admin/dashboard");
  backToDashboard(code);
}

/**
 * Switches the background the whole site renders in.
 *
 * Returns instead of redirecting so the manager stays on the dashboard and sees
 * the new colors arrive around them — the point of the feature is comparing the
 * five, and a redirect per tap would make that a chore.
 */
export async function setThemeAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await verifyAdminSession())) redirect("/admin");

  const themeId = formData.get("themeId");
  if (!isThemeId(themeId)) return { error: "Noma'lum fon rangi tanlandi" };

  try {
    await setActiveThemeId(themeId);
  } catch {
    return {
      error: "Fon rangini saqlab bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring",
    };
  }

  // The theme is applied by the root layout, so every route under it — the
  // landing screen and the public menu included — has to re-render, not just this
  // page.
  revalidatePath("/", "layout");
  return undefined;
}
