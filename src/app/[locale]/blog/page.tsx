import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { getAllPosts, formatPostDate, type BlogLocale } from "@/lib/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isRo = locale === "ro";
  const title = isRo ? "Blog Sopia" : "Sopia Blog";
  const description = isRo
    ? "Ghiduri practice despre digitalizarea procedurilor, HACCP, conformitate ANSVSA și execuția zilnică în cafenele și restaurante."
    : "Practical guides on digital procedures, paperless HACCP, FSA compliance, and daily execution for small food businesses.";

  const canonicalPath = isRo ? "/blog" : `/${locale}/blog`;
  const canonicalUrl = `https://sopia.xyz${canonicalPath}`;

  return {
    // Root layout template appends "| Sopia" automatically — pass plain title here.
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ro: "https://sopia.xyz/blog",
        en: "https://sopia.xyz/en/blog",
        "x-default": "https://sopia.xyz/blog",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: canonicalUrl,
      siteName: "Sopia",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const blogLocale = (locale === "ro" ? "ro" : "en") as BlogLocale;
  const posts = await getAllPosts(blogLocale);

  const isRo = blogLocale === "ro";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
      {/* Header */}
      <div className="max-w-2xl mb-10 sm:mb-14">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          {isRo ? "Blog Sopia" : "Sopia Blog"}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {isRo
            ? "Ghiduri concrete despre cum transformi proceduri pe hârtie în execuție zilnică pe care echipa o respectă."
            : "Practical guides on turning paper procedures into daily execution your team actually follows."}
        </p>
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            {isRo
              ? "În curând. Primele articole apar săptămâna asta."
              : "Coming soon. First articles drop this week."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {post.cover ? (
                <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.cover}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary/15 via-primary/5 to-background" />
              )}

              <div className="p-5 sm:p-6">
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                  <time dateTime={post.date}>
                    {formatPostDate(post.date, blogLocale)}
                  </time>
                  {post.readingTime && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{post.readingTime}</span>
                    </>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-semibold leading-snug mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {post.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  {isRo ? "Citește" : "Read"}
                  <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
