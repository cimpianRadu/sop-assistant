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

  // Skip i18n for API routes and auth callback
  if (pathname.startsWith("/api") || pathname === "/auth/callback") {
    return NextResponse.next();
  }

  // SEO + crawler endpoints — must be reachable without auth or i18n rewrites.
  // Without this, GoogleBot/ClaudeBot get redirected to /auth/login and the
  // site is effectively un-crawlable.
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/sitemap-") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json"
  ) {
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

  // Public routes (no auth required). Includes marketing + blog so crawlers
  // and unauthenticated visitors can read public content.
  if (
    cleanPath === "/" ||
    cleanPath === "/pricing" ||
    cleanPath === "/terms" ||
    cleanPath === "/privacy" ||
    cleanPath === "/demo" ||
    cleanPath === "/procedure-ai-supervisor" ||
    cleanPath === "/blog" ||
    cleanPath.startsWith("/blog/")
  ) {
    return supabaseResponse;
  }

  // Invite pages are accessible to everyone (page handles auth internally)
  if (cleanPath.startsWith("/invite")) {
    return supabaseResponse;
  }

  // Allow auth pages for unauthenticated users
  if (cleanPath.startsWith("/auth")) {
    // Reset password page requires an authenticated session (from the email link)
    if (cleanPath === "/auth/reset-password" && user) {
      return supabaseResponse;
    }

    if (!user) return supabaseResponse;

    // Logged in — single query to check org membership
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.redirect(
        new URL(localizedPath("/onboarding", locale), request.url)
      );
    }

    return NextResponse.redirect(
      new URL(
        localizedPath(`/${membership.role}/dashboard`, locale),
        request.url
      )
    );
  }

  // All other routes require authentication
  if (!user) {
    return NextResponse.redirect(
      new URL(localizedPath("/auth/login", locale), request.url)
    );
  }

  // Single query for membership + org details + soft-delete check
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, organizations(subscription_status, trial_ends_at, current_period_end), profiles!org_members_user_id_fkey(is_deleted)")
    .eq("user_id", user.id)
    .single();

  // Check if account is soft-deleted
  const profileData = membership?.profiles as unknown as { is_deleted: boolean } | null;
  if (profileData?.is_deleted) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(localizedPath("/auth/login", locale), request.url)
    );
  }

  // Onboarding: requires auth but no org
  if (cleanPath.startsWith("/onboarding")) {
    if (membership) {
      return NextResponse.redirect(
        new URL(
          localizedPath(`/${membership.role}/dashboard`, locale),
          request.url
        )
      );
    }
    return supabaseResponse;
  }

  // No org membership — redirect to onboarding
  if (!membership) {
    return NextResponse.redirect(
      new URL(localizedPath("/onboarding", locale), request.url)
    );
  }

  const role = membership.role;
  const org = membership.organizations as unknown as {
    subscription_status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  };

  const status = org?.subscription_status;
  const isActive = status === "active";
  const isTrialing =
    status === "trialing" &&
    org?.trial_ends_at &&
    new Date(org.trial_ends_at) > new Date();
  const isCancelledWithAccess =
    status === "cancelled" &&
    org?.current_period_end &&
    new Date(org.current_period_end) > new Date();

  // These statuses can still use the app
  const hasAccess = isActive || isTrialing || isCancelledWithAccess;

  // Blocked pages: /trial-expired (expired trial), /subscription-ended (lapsed paid)
  const blockedPages = ["/trial-expired", "/subscription-ended"];
  const isOnBlockedPage = blockedPages.includes(cleanPath);

  // Subscription enforcement (exempt: blocked pages + /pricing + /profile + /insights)
  if (
    !isOnBlockedPage &&
    cleanPath !== "/pricing" &&
    cleanPath !== "/profile" &&
    cleanPath !== "/insights"
  ) {
    if (!hasAccess) {
      // Expired trial → /trial-expired; everything else → /subscription-ended
      const destination = status === "expired" || status === "trialing"
        ? "/trial-expired"
        : "/subscription-ended";
      return NextResponse.redirect(
        new URL(localizedPath(destination, locale), request.url)
      );
    }
  }

  // Redirect away from blocked pages if user has access
  if (isOnBlockedPage && hasAccess) {
    return NextResponse.redirect(
      new URL(
        localizedPath(`/${role}/dashboard`, locale),
        request.url
      )
    );
  }

  if (isOnBlockedPage) {
    return supabaseResponse;
  }

  // Role-based route protection
  if (cleanPath.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(
      new URL(localizedPath(`/${role}/dashboard`, locale), request.url)
    );
  }

  // Admins can access manager routes
  if (cleanPath.startsWith("/manager") && role !== "manager" && role !== "admin") {
    return NextResponse.redirect(
      new URL(localizedPath(`/${role}/dashboard`, locale), request.url)
    );
  }

  if (cleanPath.startsWith("/operator") && role !== "operator" && role !== "manager" && role !== "admin") {
    return NextResponse.redirect(
      new URL(localizedPath(`/${role}/dashboard`, locale), request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov|m4v)$).*)",
  ],
};
