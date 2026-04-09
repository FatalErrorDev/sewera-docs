import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");
const outPath = path.join(process.cwd(), "public", "search-index.json");

function formatName(raw) {
  return raw
    .replace(/^\d+-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const entries = fs.readdirSync(contentDir, { withFileTypes: true });
const articles = [];

function collectArticles(dir, slugPrefix) {
  const dirEntries = fs.readdirSync(dir, { withFileTypes: true });

  for (const e of dirEntries) {
    if (e.isFile() && e.name.endsWith(".md")) {
      const raw = fs.readFileSync(path.join(dir, e.name), "utf-8");
      const { data } = matter(raw);
      const slug = e.name.replace(/\.md$/, "");
      articles.push({
        slug: [...slugPrefix, slug],
        title: data.title || formatName(slug),
        description: data.description || "",
        category: slugPrefix[0],
      });
    } else if (e.isDirectory()) {
      collectArticles(path.join(dir, e.name), [...slugPrefix, e.name]);
    }
  }
}

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  collectArticles(path.join(contentDir, entry.name), [entry.name]);
}

fs.writeFileSync(outPath, JSON.stringify(articles));
console.log(`Generated search index with ${articles.length} articles → public/search-index.json`);
