import Link from "next/link";
import { getAllCategories } from "@/lib/content";
import { formatName } from "@/lib/format";

export default function HomePage() {
  const categories = getAllCategories();
  const firstArticle = categories[0]?.articles[0];

  return (
    <main>
      {/* Hero */}
      <section
        className="hero-grid-bg"
        style={{
          minHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          position: "relative",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        {/* Top-left label */}
        <span
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-faint)",
          }}
        >
          {"// sewera documentation"}
        </span>

        {/* Hero text */}
        <h1
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          THE FUTURE
          <br />
          OF BUILDING
          <br />
          IS HUMAN +
          <br />
          AI<span className="cursor-blink" style={{ color: "var(--accent)" }}>_</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--text-muted)",
            marginTop: "24px",
          }}
        >
          {"→ practical guides for claude, lovable & claude code"}
        </p>

        {/* CTA */}
        {firstArticle && (
          <Link
            href={`/docs/${firstArticle.slug.join("/")}`}
            className="cta-button"
          >
            Get Started
          </Link>
        )}
      </section>

      {/* Category cards grid */}
      <section style={{ padding: "80px 64px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1px",
            background: "var(--border-default)",
          }}
        >
          {categories.map((cat) => {
            const first = cat.articles[0];
            return (
              <Link
                key={cat.name}
                href={first ? `/docs/${first.slug.join("/")}` : "/"}
                className="category-card"
              >
                {/* Category name */}
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--accent)",
                  }}
                >
                  {formatName(cat.name)}
                </p>

                {/* Article count */}
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "3rem",
                    fontWeight: 300,
                    color: "var(--text-faint)",
                    lineHeight: 1.2,
                    margin: "8px 0",
                  }}
                >
                  {String(cat.articles.length).padStart(2, "0")}
                </p>

                {/* First 3 article titles */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {cat.articles.slice(0, 3).map((article) => (
                    <li
                      key={article.slug.join("/")}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        padding: "2px 0",
                      }}
                    >
                      <span style={{ color: "var(--accent)", marginRight: "6px" }}>
                        {"→"}
                      </span>
                      {article.title}
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
