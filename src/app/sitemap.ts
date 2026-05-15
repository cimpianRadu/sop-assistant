import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sopia.xyz";

  const publicPages = [
    "/",
    "/pricing",
    "/terms",
    "/privacy",
    "/procedure-ai-supervisor",
    "/blog",
  ];
  const locales = ["", "/en"];

  const staticEntries: MetadataRoute.Sitemap = publicPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}${locale}${page === "/" && locale ? "" : page}`,
      lastModified: new Date(),
      changeFrequency: page === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: page === "/" ? 1 : 0.5,
    })),
  );

  // Blog posts — one entry per locale for each post
  const [roPosts, enPosts] = await Promise.all([
    getAllPosts("ro"),
    getAllPosts("en"),
  ]);

  const blogEntries: MetadataRoute.Sitemap = [
    ...roPosts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...enPosts.map((p) => ({
      url: `${baseUrl}/en/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticEntries, ...blogEntries];
}
