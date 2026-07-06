import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Telegram delivers webhook updates with no Clerk session; the route itself
  // authenticates via the X-Telegram-Bot-Api-Secret-Token header.
  "/api/telegram/webhook(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const authObj = await auth();

  if (req.nextUrl.pathname === "/") {
    if (!authObj.userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    const path = authObj.orgId ? `/organization/${authObj.orgId}` : "/select-org";
    return NextResponse.redirect(new URL(path, req.url));
  }

  if (authObj.userId && isPublicRoute(req)) {
    let path = "/select-org";
    if (authObj.orgId) {
      path = `/organization/${authObj.orgId}`;
    }
    return NextResponse.redirect(new URL(path, req.url));
  }

  if (!authObj.userId && !isPublicRoute(req)) {
    return authObj.redirectToSignIn({ returnBackUrl: req.url });
  }

  if (authObj.userId && !authObj.orgId && req.nextUrl.pathname !== "/select-org") {
    return NextResponse.redirect(new URL("/select-org", req.url));
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)", "/__clerk/:path*"],
};
