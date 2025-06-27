/*
<ai_context>
Contains middleware for the app. Currently just passes through all requests.
</ai_context>
*/

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // No authentication middleware - all routes are public
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
}
