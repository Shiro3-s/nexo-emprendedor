import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_DOMAIN = "nexoemprendedor.com";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const hostParts = hostname.split(".");
  const isSubdomain = hostParts.length > 2;

  if (isSubdomain) {
    const slug = hostParts[0];

    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", slug);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|img|favicon.ico).*)"],
};
