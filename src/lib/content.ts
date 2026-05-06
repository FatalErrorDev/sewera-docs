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
import { cache } from "react";
import { Article, ArticleDetail, Category, Heading, Subcategory } from "@/types/content";
import { formatName } from "@/lib/format";

const contentDir = path.join(process.cwd(), "content");

function loadConfig(): { categoryOrder: string[] } {
  const configPath = path.join(contentDir, "_config.json");
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return { categoryOrder: raw.categoryOrder || [] };
  }
  return { categoryOrder: [] };
}

function loadMeta(dir: string): { subcategories?: Record<string, string> } {
  const metaPath = path.join(dir, "_meta.json");
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  }
  return {};
}

export function getAllCategories(): Category[] {
  const entries = fs.readdirSync(contentDir, { withFileTypes: true });
  const categories: Category[] = entries
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const catDir = path.join(contentDir, dir.name);
      const catEntries = fs.readdirSync(catDir, { withFileTypes: true });

      const articles = getArticlesInDir(catDir, [dir.name]);
      const catMeta = loadMeta(catDir);
      const subDisplayNames = catMeta.subcategories || {};
      const subcategories: Subcategory[] = catEntries
        .filter((e) => e.isDirectory())
        .map((sub) => {
          const subDir = path.join(catDir, sub.name);
          return {
            name: sub.name,
            displayName: subDisplayNames[sub.name] || formatName(sub.name),
            articles: getArticlesInDir(subDir, [dir.name, sub.name]),
          };
        })
        .filter((sub) => sub.articles.length > 0);

      return { name: dir.name, articles, subcategories };
    });

  const { categoryOrder } = loadConfig();
  categories.sort((a, b) => {
    const ai = categoryOrder.indexOf(a.name);
    const bi = categoryOrder.indexOf(b.name);
    const oa = ai === -1 ? Infinity : ai;
    const ob = bi === -1 ? Infinity : bi;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name);
  });

  return categories;
}

export function getAllArticles(): Article[] {
  return getAllCategories().flatMap((c) => [
    ...c.articles,
    ...c.subcategories.flatMap((s) => s.articles),
  ]);
}

function getArticlesInDir(dir: string, slugPrefix: string[]): Article[] {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  return files
    .map((file) => {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      const slug = file.replace(/\.md$/, "");
      return {
        slug: [...slugPrefix, slug],
        title: data.title || formatName(slug),
        description: data.description || "",
        order: data.order ?? 999,
        category: slugPrefix[0],
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

export const getArticle = cache(async function getArticle(
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
});
