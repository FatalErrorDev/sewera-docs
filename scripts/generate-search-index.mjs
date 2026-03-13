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

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const category = entry.name;
  const catDir = path.join(contentDir, category);
  const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".md")).sort();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(catDir, file), "utf-8");
    const { data } = matter(raw);
    const slug = file.replace(/\.md$/, "");
    articles.push({
      slug: [category, slug],
      title: data.title || formatName(slug),
      description: data.description || "",
      category,
    });
  }
}

fs.writeFileSync(outPath, JSON.stringify(articles));
console.log(`Generated search index with ${articles.length} articles → public/search-index.json`);
