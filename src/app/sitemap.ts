import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://sopia.xyz";

  const publicPages = ["/", "/pricing", "/terms", "/privacy"];
  const locales = ["", "/en"];

  return publicPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}${locale}${page === "/" && locale ? "" : page}`,
      lastModified: new Date(),
      changeFrequency: page === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: page === "/" ? 1 : 0.5,
    }))
  );
}
