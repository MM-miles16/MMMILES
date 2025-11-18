import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Only run this middleware for /search route
  if (pathname.startsWith("/search")) {
    const city = searchParams.get("city");
    const pickup = searchParams.get("pickupTime");
    const returndate = searchParams.get("returnTime");

    // If any of the required parameters are missing, redirect to home
    if (!city || !pickup || !returndate) {
      const redirectUrl = new URL("/", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Lock cleanup is now handled by database triggers (auto_cleanup_expired_locks)
  // No need to call cleanup API on every page load

  // Continue normally
  return NextResponse.next();
}

// Apply middleware only to the /search route
export const config = {
  matcher: ["/search/:path*"],
};
