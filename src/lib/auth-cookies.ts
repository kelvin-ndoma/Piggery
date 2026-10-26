import type { NextResponse } from "next/server";

const KNOWN_AUTH_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
];

function cookieNamesFromRequest(request: Request): string[] {
  const names = new Set(KNOWN_AUTH_COOKIES);
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const name = part.trim().split("=")[0];
    if (name && (name.includes("authjs") || name.includes("next-auth"))) {
      names.add(name);
    }
  }
  return [...names];
}

/** Expire Auth.js cookies with the same flags the library used to set them. */
export function clearAuthCookies(response: NextResponse, request: Request) {
  const secureRequest = new URL(request.url).protocol === "https:";
  for (const name of cookieNamesFromRequest(request)) {
    const prefixed = name.startsWith("__Secure-") || name.startsWith("__Host-");
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: prefixed || secureRequest,
    });
  }
}
