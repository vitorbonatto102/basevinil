import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { passwordGate } from "./lib/site-password";

export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const gatedResponse = await passwordGate(request, password);
  return gatedResponse ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png|apple-touch-icon.png|og.jpg).*)"],
};
