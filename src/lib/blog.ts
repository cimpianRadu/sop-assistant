import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type BlogLocale = "ro" | "en";

export type BlogPostFrontmatter = {
  title: string;
  description: string;
  date: string; // ISO YYYY-MM-DD (original publish date)
  updatedAt?: string; // ISO YYYY-MM-DD (last meaningful content update; falls back to `date`)
  locale: BlogLocale;
  keywords?: string[];
  author?: string;
  cover?: string;
  readingTime?: string;
};

export type BlogPostMeta = BlogPostFrontmatter & {
  slug: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

const CONTENT_ROOT = path.join(process.cwd(), "content", "blog");

function localeDir(locale: BlogLocale) {
  return path.join(CONTENT_ROOT, locale);
}

async function readMdx(filePath: string): Promise<{ data: BlogPostFrontmatter; content: string }> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  return {
    data: parsed.data as BlogPostFrontmatter,
    content: parsed.content,
  };
}

/**
 * List all blog posts for a given locale, newest first.
 * Returns metadata only (frontmatter + slug), not the body content.
 */
export async function getAllPosts(locale: BlogLocale): Promise<BlogPostMeta[]> {
  const dir = localeDir(locale);

  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }

  const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

  const posts = await Promise.all(
    mdxFiles.map(async (file): Promise<BlogPostMeta> => {
      const filePath = path.join(dir, file);
      const { data } = await readMdx(filePath);
      const slug = file.replace(/\.mdx$/, "");
      return {
        slug,
        ...data,
        // Ensure locale matches even if frontmatter is missing it
        locale,
      };
    }),
  );

  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

/**
 * Load one post by slug for a given locale. Returns null if not found.
 */
export async function getPostBySlug(
  locale: BlogLocale,
  slug: string,
): Promise<BlogPost | null> {
  const filePath = path.join(localeDir(locale), `${slug}.mdx`);
  try {
    const { data, content } = await readMdx(filePath);
    return {
      slug,
      ...data,
      locale,
      content,
    };
  } catch {
    return null;
  }
}

/**
 * Format a YYYY-MM-DD date for display in the given locale.
 * Always pass the locale to avoid SSR/CSR hydration mismatches.
 */
export function formatPostDate(isoDate: string, locale: BlogLocale): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
