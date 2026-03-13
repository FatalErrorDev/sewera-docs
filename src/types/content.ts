export type Article = {
  slug: string[];
  title: string;
  description: string;
  order: number;
  category: string;
};

export type Category = {
  name: string;
  articles: Article[];
};

export type ArticleDetail = Article & {
  contentHtml: string;
  headings: Heading[];
};

export type Heading = {
  id: string;
  text: string;
  level: number;
};
