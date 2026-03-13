import { getAllArticles } from "@/lib/content";
import { NextResponse } from "next/server";

export async function GET() {
  const articles = getAllArticles().map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    category: a.category,
  }));
  return NextResponse.json(articles);
}
