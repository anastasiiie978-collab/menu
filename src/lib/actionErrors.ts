// Failure messages for the admin actions that navigate instead of returning
// state, kept in a plain module rather than in actions.ts.
//
// Every export of a `"use server"` file becomes a callable server action, so
// putting this lookup there would publish a pointless endpoint whose only job is
// turning a string into another string. It is also imported by the dashboard,
// which is a server component — no reason for that to go through the action
// boundary.
//
// The codes exist because the dashboard used to receive the message itself in
// `?error=`, and rendered it verbatim. React escaped it, so it was never a script
// injection, but it did mean anyone could hand the manager a link to their own
// admin panel that displayed any sentence they wanted in an official-looking
// banner. Unrecognised codes now render nothing at all.
export const ACTION_ERRORS = {
  "dish-delete-failed":
    "Taomni o'chirib bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring",
  "dish-toggle-failed":
    "Taom holatini o'zgartirib bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring",
  "dish-missing":
    "Bu taom topilmadi — ehtimol uni boshqa qurilmada allaqachon o'chirib yuborishgan",
  "category-delete-failed":
    "Toifani o'chirib bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring",
} as const;

export type ActionErrorCode = keyof typeof ACTION_ERRORS;

/** Resolves a `?error=` code to its Uzbek message. Anything unrecognised shows nothing. */
export function actionErrorMessage(code: string | string[] | undefined): string | null {
  const key = Array.isArray(code) ? code[0] : code;
  return key && key in ACTION_ERRORS ? ACTION_ERRORS[key as ActionErrorCode] : null;
}
