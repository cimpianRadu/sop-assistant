import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/shared/tracked-link";
import { TrackedExternalLink } from "@/components/shared/tracked-external-link";
import { GA_EVENTS } from "@/lib/analytics/events";
import { CALENDLY_DEMO_URL } from "@/lib/external-links";
import {
  getAllPosts,
  getPostBySlug,
  formatPostDate,
  type BlogLocale,
} from "@/lib/blog";

type Params = { locale: string; slug: string };

export async function generateStaticParams() {
  const locales: BlogLocale[] = ["ro", "en"];
  const allParams: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    const posts = await getAllPosts(locale);
    for (const post of posts) {
      allParams.push({ locale, slug: post.slug });
    }
  }

  return allParams;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const blogLocale = (locale === "ro" ? "ro" : "en") as BlogLocale;
  const post = await getPostBySlug(blogLocale, slug);

  if (!post) {
    return { title: "Not found" };
  }

  const canonicalPath =
    locale === "ro" ? `/blog/${slug}` : `/${locale}/blog/${slug}`;
  const canonicalUrl = `https://sopia.xyz${canonicalPath}`;

  return {
    // Root layout template appends "| Sopia" automatically — pass plain title here.
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: post.author ? [{ name: post.author }] : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale,
      url: canonicalUrl,
      siteName: "Sopia",
      images: post.cover
        ? [
            {
              url: `https://sopia.xyz${post.cover}`,
              width: 1600,
              height: 900,
              alt: post.title,
            },
          ]
        : undefined,
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.cover ? [`https://sopia.xyz${post.cover}`] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const blogLocale = (locale === "ro" ? "ro" : "en") as BlogLocale;
  const post = await getPostBySlug(blogLocale, slug);

  if (!post) {
    notFound();
  }

  const isRo = blogLocale === "ro";
  const canonicalUrl = `https://sopia.xyz${
    locale === "ro" ? `/blog/${slug}` : `/${locale}/blog/${slug}`
  }`;
  const coverUrl = post.cover ? `https://sopia.xyz${post.cover}` : undefined;

  // Article schema — primary signal for AI assistants (Claude, ChatGPT,
  // Perplexity, Gemini) and Google rich results. Keep this in sync with the
  // <metadata> block above.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    inLanguage: blogLocale === "ro" ? "ro-RO" : "en-GB",
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author || "Sopia",
      url: "https://sopia.xyz",
    },
    publisher: {
      "@type": "Organization",
      name: "Sopia",
      url: "https://sopia.xyz",
      logo: {
        "@type": "ImageObject",
        url: "https://sopia.xyz/icon.svg",
      },
    },
    image: coverUrl ? [coverUrl] : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: post.keywords?.join(", "),
  };

  return (
    <article>
      {/* JSON-LD: surfaces the article cleanly to Google + AI assistants */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Hero with cover */}
      <header className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft className="size-3.5" />
          {isRo ? "Toate articolele" : "All articles"}
        </Link>

        <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2 flex-wrap">
          <time dateTime={post.date}>
            {formatPostDate(post.date, blogLocale)}
          </time>
          {post.readingTime && (
            <>
              <span aria-hidden>·</span>
              <span>{post.readingTime}</span>
            </>
          )}
          {post.author && (
            <>
              <span aria-hidden>·</span>
              <span>{post.author}</span>
            </>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-5">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {post.description}
        </p>
      </header>

      {/* Cover */}
      {post.cover && (
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl mb-8 sm:mb-12">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl pb-12 sm:pb-16">
        <div
          className="
            prose prose-neutral dark:prose-invert
            max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            prose-li:leading-relaxed
            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:not-italic
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-img:rounded-xl
          "
        >
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>
      </div>

      {/* Bottom CTA — soft, branded, sopia-style */}
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl pb-16 sm:pb-20">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/8 via-primary/3 to-background p-6 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            {isRo
              ? "Vrei să vezi cum arată Sopia pentru afacerea ta?"
              : "Want to see what Sopia looks like for your business?"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
            {isRo
              ? "14 zile gratuit, fără card. Sau programează o demonstrație de 30 de minute cu echipa fondatoare."
              : "14 days free, no card. Or book a 30-minute demo with the founding team."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <TrackedLink
              href="/auth/signup"
              event={GA_EVENTS.START_TRIAL_CLICK}
              eventParams={{ source: "blog_article_cta", slug }}
            >
              <Button size="lg" className="w-full sm:w-auto gap-1.5">
                {isRo ? "Începe gratuit" : "Start free"}
                <ArrowRight className="size-4" />
              </Button>
            </TrackedLink>
            <TrackedExternalLink
              href={CALENDLY_DEMO_URL}
              event={GA_EVENTS.BOOK_DEMO_CLICK}
              eventParams={{ source: "blog_article_cta", slug }}
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto gap-1.5"
              >
                <Calendar className="size-4" />
                {isRo ? "Programează demo" : "Book a demo"}
              </Button>
            </TrackedExternalLink>
          </div>
        </div>
      </div>
    </article>
  );
}
