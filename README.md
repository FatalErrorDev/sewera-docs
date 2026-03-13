# Claude Docs

A Next.js documentation site that auto-renders `.md` files from a `content/` folder hierarchy into a polished, searchable, readable UI.

## Adding Content

Drop Markdown files into the `content/` directory, organized by category:

```
content/
├── tutorials/
│   ├── 01-getting-started.md
│   └── 02-claude-and-lovable.md
└── useful_tools/
    └── prompt-templates.md
```

Each `.md` file should include YAML frontmatter:

```md
---
title: My Article Title
description: A short description of the article.
order: 1
---

# Article content here...
```

- **title** (required) — displayed in the sidebar and page header
- **description** (optional) — shown on category cards and in search results
- **order** (optional) — controls sort order within a category; defaults to alphabetical

### Folder naming

Use lowercase with underscores for category and article filenames (e.g. `useful_tools/`, `claude_code.md`). The UI automatically renders them as human-friendly labels ("Useful Tools", "Claude Code").

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building for Production

```bash
npm run build
npm start
```

## Deploying to Vercel

Push to GitHub and connect the repo in the Vercel dashboard. It works out of the box.

## Deploying to a Node Server

```bash
npm run build
```

Copy the `.next/standalone` directory to your server, then run:

```bash
node server.js
```

To deploy as a static export instead, change `output` to `'export'` in `next.config.ts` and add `images: { unoptimized: true }`.
