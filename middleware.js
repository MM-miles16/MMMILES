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

  // Add lock cleanup for checkout page access
  if (pathname.startsWith("/checkout")) {
    // Trigger lock cleanup when accessing checkout (non-blocking)
    try {
      const cleanupPromise = fetch(`${request.nextUrl.origin}/api/locks/cleanup`, {
        method: 'POST',
        headers: {
          'Authorization': request.headers.get('authorization') || '',
        },
      });
      // Don't await - let it run in background
      cleanupPromise.catch(err => {
        console.warn('Background lock cleanup failed:', err);
      });
    } catch (err) {
      console.warn('Failed to trigger lock cleanup:', err);
    }
  }

  // Continue normally
  return NextResponse.next();
}

// Apply middleware only to the /search route and /checkout
export const config = {
  matcher: ["/search/:path*", "/checkout/:path*"],
};
