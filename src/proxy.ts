import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readAdminSession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readAdminSession();
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
