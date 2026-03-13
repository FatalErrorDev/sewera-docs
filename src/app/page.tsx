import Link from "next/link";
import { getAllCategories } from "@/lib/content";
import { formatName } from "@/lib/format";

export default function HomePage() {
  const categories = getAllCategories();
  const firstArticle = categories[0]?.articles[0];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative pt-8 pb-4">
        <div
          className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Claude Documentation
        </h1>
        <p className="mt-4 max-w-xl text-lg text-foreground/60">
          Practical guides for building AI-powered support systems with Claude,
          Lovable, and Claude Code.
        </p>
        {firstArticle && (
          <Link
            href={`/docs/${firstArticle.slug.join("/")}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get started
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        )}
      </section>

      {/* Category cards */}
      <section>
        <h2 className="mb-6 text-lg font-semibold">Browse by category</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((cat) => {
            const first = cat.articles[0];
            return (
              <Link
                key={cat.name}
                href={first ? `/docs/${first.slug.join("/")}` : "/"}
                className="group rounded-xl border border-foreground/10 p-5 transition-colors hover:border-accent/30 hover:bg-accent/5"
              >
                <h3 className="font-semibold transition-colors group-hover:text-accent">
                  {formatName(cat.name)}
                </h3>
                <p className="mt-1 text-sm text-foreground/50">
                  {cat.articles.length} article
                  {cat.articles.length !== 1 && "s"}
                </p>
                {first && (
                  <p className="mt-3 text-sm text-foreground/40">
                    Start with: {first.title}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
