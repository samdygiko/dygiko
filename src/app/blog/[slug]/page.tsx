import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import FooterCTA from "@/components/FooterCTA";
import FloatingButtons from "@/components/FloatingButtons";
import { getPostBySlug, getAllSlugs, formatDate } from "@/lib/posts";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `https://www.dygiko.com/blog/${post.slug}`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url,
      siteName: "Dygiko",
      type: "article",
      publishedTime: post.date,
      images: [{ url: "/dygiko-logo-400.png", width: 400, height: 400, alt: "Dygiko" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: ["/dygiko-logo-400.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Dygiko",
      url: "https://www.dygiko.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Dygiko",
      url: "https://www.dygiko.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.dygiko.com/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main className="min-h-screen pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <a
              href="/blog"
              className="text-sm text-white/30 hover:text-white/60 transition-colors duration-200 mb-8 inline-block"
            >
              ← All posts
            </a>
            <div className="flex items-center gap-3 text-xs text-white/30 mb-4">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span>·</span>
              <span>{post.readingTime}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              {post.title}
            </h1>
          </div>

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-16 border border-white/[0.08] rounded-sm p-8 bg-white/[0.02]">
            <p className="text-white font-semibold text-lg mb-2">
              Ready to get your business online?
            </p>
            <p className="text-white/50 text-sm mb-5">
              Professional websites from £500. Live in 2 days.
            </p>
            <a
              href="/#services"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-sm text-black transition-opacity duration-200 hover:opacity-80"
              style={{ background: "#b0ff00" }}
            >
              View our packages →
            </a>
          </div>
        </div>
      </main>
      <FooterCTA />
      <FloatingButtons />
    </>
  );
}
