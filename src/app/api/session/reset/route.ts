import { NextResponse } from "next/server";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const expired = { path: "/", maxAge: 0 };
  response.cookies.set("authjs.session-token", "", expired);
  response.cookies.set("__Secure-authjs.session-token", "", expired);
  return response;
}
