import { NextResponse } from "next/server";
import { isApiPath, isProtectedPath, SIGN_IN_PATH } from "./access";

export interface ProxyRequest {
  auth: { user?: { id?: string } } | null;
  nextUrl: URL;
}

export function applyAccess(request: ProxyRequest): Response | undefined {
  const { pathname, search } = request.nextUrl;
  if (!isProtectedPath(pathname) || request.auth?.user) {
    return undefined;
  }
  if (isApiPath(pathname)) {
    return NextResponse.json(
      { error: { code: "unauthenticated", message: "Sign in to use the assistant." } },
      { status: 401 },
    );
  }
  const target = new URL(SIGN_IN_PATH, request.nextUrl);
  target.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(target);
}
