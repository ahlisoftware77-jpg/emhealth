import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Jalur bebas akses (public)
  const isPublicPath = pathname === "/login";

  // Ambil token auth dari cookies atau periksa session di client-side guard jika menggunakan localStorage
  // Karena app menyimpan state & token di Zustand / localStorage, Next.js middleware standard
  // tidak selalu memiliki akses ke localStorage, sehingga disarankan membuat AuthGuard di client component juga.
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
