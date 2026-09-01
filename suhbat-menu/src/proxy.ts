import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// This is a convenience redirect, not the authorization boundary: it keeps a
// logged-out manager from landing on a broken dashboard and a logged-in one from
// staring at the login form. The pages and the server actions each verify the
// session themselves, which is what actually protects the data — see the comment
// in app/admin/dashboard/page.tsx.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isAuthed = session?.admin === true;

  if (pathname.startsWith("/admin/dashboard") && !isAuthed) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname === "/admin" && isAuthed) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
