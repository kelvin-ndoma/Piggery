import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth-cookies";

function signOutRedirect(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  clearAuthCookies(response, request);
  return response;
}

export function GET(request: Request) {
  return signOutRedirect(request);
}

export function POST(request: Request) {
  return signOutRedirect(request);
}
