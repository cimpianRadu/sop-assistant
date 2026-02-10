import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createIntlMiddleware(routing);

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

function localizedPath(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return path;
  return `/${locale}${path}`;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip i18n for API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Step 1: Let next-intl handle locale detection/rewriting
  const i18nResponse = handleI18nRouting(request);

  // If next-intl decided to redirect (locale prefix normalization), return immediately
  if (i18nResponse.redirected || i18nResponse.headers.get("Location")) {
    return i18nResponse;
  }

  // Extract locale determined by next-intl
  const locale =
    i18nResponse.headers.get("x-next-intl-locale") || routing.defaultLocale;
  const cleanPath = stripLocalePrefix(pathname);

  // Step 2: Run Supabase session update
  const { supabase, user, supabaseResponse } = await updateSession(request);

  // Copy next-intl headers to supabase response
  i18nResponse.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value);
  });

  // Public routes (no auth required)
  if (cleanPath === "/" || cleanPath === "/pricing") {
    return supabaseResponse;
  }

  // Allow auth pages for unauthenticated users
  if (cleanPath.startsWith("/auth")) {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role || "operator";
      return NextResponse.redirect(
        new URL(localizedPath(`/${role}/dashboard`, locale), request.url)
      );
    }
    return supabaseResponse;
  }

  // All other routes require authentication
  if (!user) {
    return NextResponse.redirect(
      new URL(localizedPath("/auth/login", locale), request.url)
    );
  }

  // Fetch user profile for role and trial status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_status, trial_ends_at")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "operator";

  // Trial enforcement (exempt: /trial-expired)
  if (cleanPath !== "/trial-expired") {
    const isActive = profile?.subscription_status === "active";
    const isTrialing =
      profile?.subscription_status === "trialing" &&
      profile?.trial_ends_at &&
      new Date(profile.trial_ends_at) > new Date();

    if (!isActive && !isTrialing) {
      return NextResponse.redirect(
        new URL(localizedPath("/trial-expired", locale), request.url)
      );
    }
  }

  // Redirect away from /trial-expired if trial is still valid
  if (cleanPath === "/trial-expired") {
    const isActive = profile?.subscription_status === "active";
    const isTrialing =
      profile?.subscription_status === "trialing" &&
      profile?.trial_ends_at &&
      new Date(profile.trial_ends_at) > new Date();

    if (isActive || isTrialing) {
      return NextResponse.redirect(
        new URL(localizedPath(`/${role}/dashboard`, locale), request.url)
      );
    }
    return supabaseResponse;
  }

  // Role-based route protection
  if (cleanPath.startsWith("/manager") && role !== "manager") {
    return NextResponse.redirect(
      new URL(localizedPath(`/${role}/dashboard`, locale), request.url)
    );
  }

  if (cleanPath.startsWith("/operator") && role !== "operator") {
    return NextResponse.redirect(
      new URL(localizedPath(`/${role}/dashboard`, locale), request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
