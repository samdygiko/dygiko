import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import FooterCTA from "@/components/FooterCTA";
import FloatingButtons from "@/components/FloatingButtons";
import { posts, formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog — Web Design & SEO Insights | Dygiko",
  description:
    "Expert advice on web design, SEO, Google Business Profile, and growing your business online. Practical guides for UK businesses.",
  alternates: {
    canonical: "https://www.dygiko.com/blog",
  },
  openGraph: {
    title: "Blog — Web Design & SEO Insights | Dygiko",
    description:
      "Expert advice on web design, SEO, Google Business Profile, and growing your business online.",
    url: "https://www.dygiko.com/blog",
    siteName: "Dygiko",
    type: "website",
    images: [{ url: "/dygiko-logo-400.png", width: 400, height: 400, alt: "Dygiko" }],
  },
};

export default function BlogPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-[#b0ff00] mb-4">
              <span className="eyebrow-dot w-1.5 h-1.5 rounded-full bg-[#b0ff00] inline-block" />
              Insights
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Web design &amp; business growth
            </h1>
            <p className="mt-4 text-white/50 text-lg max-w-xl">
              Practical guides on websites, SEO, and getting found online.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.06]">
            {posts.map((post) => (
              <article key={post.slug} className="py-10 group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex items-center gap-3 text-xs text-white/30 mb-3">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold text-white group-hover:text-[#b0ff00] transition-colors duration-200 mb-3">
                    {post.title}
                  </h2>
                  <p className="text-white/50 text-sm leading-relaxed max-w-2xl mb-4">
                    {post.excerpt}
                  </p>
                  <span className="text-sm text-[#b0ff00] font-medium">
                    Read more →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <FooterCTA />
      <FloatingButtons />
    </>
  );
}
