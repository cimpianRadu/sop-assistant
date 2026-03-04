import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/terms", "/privacy", "/en/", "/en/pricing", "/en/terms", "/en/privacy"],
        disallow: ["/admin", "/manager", "/operator", "/onboarding", "/api", "/auth", "/profile", "/trial-expired"],
      },
    ],
    sitemap: "https://sopia.xyz/sitemap.xml",
  };
}
