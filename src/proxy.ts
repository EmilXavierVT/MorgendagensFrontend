import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_PREFIXES = ["/api/auth/", "/api/request/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (BACKEND_PREFIXES.some(p => pathname.startsWith(p))) {
    const target = new URL(pathname, "https://morgendagens.project-ice.dk");
    return NextResponse.rewrite(target);
  }
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/request/:path*"],
};
