import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAIN_HOST = "findbottomlessmimosas.com";
const OWNER_HOST = "my.findbottomlessmimosas.com";
const STATE_SUBDOMAIN_REGEX = /^([a-z]{2})\.findbottomlessmimosas\.com$/;

/** Local dev: use host header to simulate (e.g. fl.localhost:3000, my.localhost:3000) */
function getHostContext(hostname: string): "www" | "my" | { type: "state"; stateCode: string } | null {
  const base = hostname.split(":")[0].toLowerCase();
  if (base === MAIN_HOST || base === "localhost" || base === "127.0.0.1") return "www";
  if (base === OWNER_HOST || base === "my.localhost" || base === "my") return "my";
  const stateMatch = base.match(STATE_SUBDOMAIN_REGEX) ?? base.match(/^([a-z]{2})\.localhost$/);
  if (stateMatch) return { type: "state", stateCode: stateMatch[1].toLowerCase() };
  return null;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;
  const context = getHostContext(hostname);

  // API routes, _next, static files: no rewrite
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (context === "www") {
    // Main domain: rewrite to /www/* so (www) route group is used
    const internalPath = pathname === "/" ? "/www" : `/www${pathname}`;
    return NextResponse.rewrite(new URL(internalPath, request.url));
  }

  if (context === "my") {
    // Owner portal: / → redirect to /venues; else rewrite to /my/*
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL("/venues", request.url));
    }
    const internalPath = pathname.startsWith("/") ? `/my${pathname}` : `/my/${pathname}`;
    return NextResponse.rewrite(new URL(internalPath, request.url));
  }

  if (context && context.type === "state") {
    // State subdomain: rewrite to /state/{stateCode}/*
    const stateCode = context.stateCode;
    const internalPath = pathname === "/" ? `/state/${stateCode}` : `/state/${stateCode}${pathname}`;
    return NextResponse.rewrite(new URL(internalPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
