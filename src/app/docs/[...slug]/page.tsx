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
    <div className="flex items-start gap-0">
      <div className="min-w-0 flex-1">
        <div className="mb-6">
          <p className="text-sm font-medium text-accent uppercase tracking-wide">
            {formatName(article.category)}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
            {article.title}
          </h1>
          {article.description && (
            <p className="mt-2 text-text-secondary">{article.description}</p>
          )}
        </div>
        <ArticleRenderer contentHtml={article.contentHtml} />
      </div>
      <TableOfContents headings={article.headings} />
    </div>
  );
}
