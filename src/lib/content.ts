import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { Article, ArticleDetail, Category, Heading } from "@/types/content";

const contentDir = path.join(process.cwd(), "content");

export function formatName(raw: string): string {
  return raw
    .replace(/^\d+-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAllCategories(): Category[] {
  const entries = fs.readdirSync(contentDir, { withFileTypes: true });
  const categories: Category[] = entries
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const articles = getArticlesInCategory(dir.name);
      return { name: dir.name, articles };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

export function getAllArticles(): Article[] {
  return getAllCategories().flatMap((c) => c.articles);
}

function getArticlesInCategory(category: string): Article[] {
  const catDir = path.join(contentDir, category);
  const files = fs
    .readdirSync(catDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  return files
    .map((file) => {
      const filePath = path.join(catDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      const slug = file.replace(/\.md$/, "");
      return {
        slug: [category, slug],
        title: data.title || formatName(slug),
        description: data.description || "",
        order: data.order ?? 999,
        category,
      };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /<h([23])\s+id="([^"]*)"[^>]*>(.*?)<\/h[23]>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[3].replace(/<[^>]*>/g, "").trim();
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      text,
    });
  }
  return headings;
}

export async function getArticle(
  slug: string[]
): Promise<ArticleDetail | null> {
  const filePath = path.join(contentDir, ...slug) + ".md";
  if (!fs.existsSync(filePath)) {
    // Try with the slug as-is (category/article)
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(content);

  const contentHtml = result.toString();
  const headings = extractHeadings(contentHtml);
  const category = slug[0];
  const fileSlug = slug[slug.length - 1];

  return {
    slug,
    title: data.title || formatName(fileSlug),
    description: data.description || "",
    order: data.order ?? 999,
    category,
    contentHtml,
    headings,
  };
}
