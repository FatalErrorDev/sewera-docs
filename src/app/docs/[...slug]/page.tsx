import { notFound } from "next/navigation";
import { getArticle, getAllArticles } from "@/lib/content";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { TableOfContents } from "@/components/TableOfContents";
import { formatName } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Claude Docs`,
    description: article.description,
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <div className="flex items-start" style={{ padding: "40px 48px" }}>
      <article className="min-w-0 flex-1" style={{ maxWidth: "72ch" }}>
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--accent)",
            }}
          >
            {formatName(article.category)}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: "1.875rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginTop: "4px",
            }}
          >
            {article.title}
          </h1>
          {article.description && (
            <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
              {article.description}
            </p>
          )}
        </div>
        <ArticleRenderer contentHtml={article.contentHtml} />
      </article>
      <TableOfContents headings={article.headings} />
    </div>
  );
}
