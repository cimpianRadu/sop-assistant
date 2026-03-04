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

  // Invite pages are accessible to everyone (page handles auth internally)
  if (cleanPath.startsWith("/invite")) {
    return supabaseResponse;
  }

  // Allow auth pages for unauthenticated users
  if (cleanPath.startsWith("/auth")) {
    if (user) {
      // Logged in — check if they have an org
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
    return supabaseResponse;
  }

  // All other routes require authentication
  if (!user) {
    return NextResponse.redirect(
      new URL(localizedPath("/auth/login", locale), request.url)
    );
  }

  // Onboarding: requires auth but no org
  if (cleanPath.startsWith("/onboarding")) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (membership) {
      // Already has org — redirect to dashboard
      return NextResponse.redirect(
        new URL(
          localizedPath(`/${membership.role}/dashboard`, locale),
          request.url
        )
      );
    }
    return supabaseResponse;
  }

  // Fetch org membership and org details
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, organizations(subscription_status, trial_ends_at)")
    .eq("user_id", user.id)
    .single();

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
  };

  // Trial enforcement (exempt: /trial-expired)
  if (cleanPath !== "/trial-expired") {
    const isActive = org?.subscription_status === "active";
    const isTrialing =
      org?.subscription_status === "trialing" &&
      org?.trial_ends_at &&
      new Date(org.trial_ends_at) > new Date();

    if (!isActive && !isTrialing) {
      return NextResponse.redirect(
        new URL(localizedPath("/trial-expired", locale), request.url)
      );
    }
  }

  // Redirect away from /trial-expired if trial is still valid
  if (cleanPath === "/trial-expired") {
    const isActive = org?.subscription_status === "active";
    const isTrialing =
      org?.subscription_status === "trialing" &&
      org?.trial_ends_at &&
      new Date(org.trial_ends_at) > new Date();

    if (isActive || isTrialing) {
      return NextResponse.redirect(
        new URL(
          localizedPath(`/${role}/dashboard`, locale),
          request.url
        )
      );
    }
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
