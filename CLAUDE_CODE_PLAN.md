# Claude Docs Site — Claude Code Build Plan

A Next.js documentation site that auto-renders `.md` files from a `content/` folder hierarchy into a polished, searchable, readable UI.

---

## Project Overview

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS  
**Content model:** `content/<Category>/<article>.md` → rendered as docs pages  
**Key features:** Full-text search, dark/light mode, copy-on-code-blocks, per-article table of contents  
**Hosting target:** Agnostic (outputs static-exportable build; works on Vercel, Netlify, or Node server)

---

## Folder Structure (Final Target)

```
/
├── content/                        ← HUMAN-EDITABLE: drop .md files here
│   ├── tutorials/
│   │   └── getting-started.md
│   └── useful_tools/
│       └── example-tool.md
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout (sidebar + header)
│   │   ├── page.tsx                ← Homepage / landing
│   │   └── docs/
│   │       └── [...slug]/
│   │           └── page.tsx        ← Dynamic doc page renderer
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── ArticleRenderer.tsx
│   │   ├── TableOfContents.tsx
│   │   ├── SearchModal.tsx
│   │   ├── CopyCodeButton.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── content.ts              ← File system traversal + MD parsing
│   │   └── search-index.ts         ← Build-time search index generation
│   └── types/
│       └── content.ts
├── public/
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Task 1 — Project Scaffold

**Goal:** Initialize a clean Next.js 14 project with all dependencies installed.

### Steps

1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` in the project root.

2. Install additional dependencies:
   ```
   npm install gray-matter remark remark-gfm remark-html rehype-highlight rehype-slug rehype-autolink-headings next-themes fuse.js
   ```
   - `gray-matter` — parse YAML frontmatter from `.md` files
   - `remark` + `remark-gfm` — Markdown to HTML pipeline with GitHub-flavored extras
   - `rehype-highlight` — syntax highlighting in code blocks
   - `rehype-slug` + `rehype-autolink-headings` — anchor IDs on headings (needed for TOC)
   - `next-themes` — dark/light mode without flash
   - `fuse.js` — client-side fuzzy search

3. Install dev dependencies:
   ```
   npm install -D @types/node
   ```

4. Create the `content/` directory at the project root with two sample subdirectories:
   - `content/tutorials/getting-started.md` — a sample file with frontmatter (`title`, `description`) and demo content including a code block
   - `content/useful_tools/overview.md` — another sample file

   Sample frontmatter format every `.md` file should use:
   ```md
   ---
   title: Getting Started with Claude
   description: A practical introduction to using Claude for support systems.
   order: 1
   ---
   ```
   `order` is optional; controls sort order within a category. Defaults to alphabetical.

---

## Task 2 — Content Library (`src/lib/content.ts`)

**Goal:** A server-side module that reads the `content/` folder and exposes structured data to the app.

### Functions to implement

```typescript
// Returns all categories (top-level folders) with their articles
getAllCategories(): Category[]

// Returns a flat list of all articles (used for search index + sitemap)
getAllArticles(): Article[]

// Returns parsed HTML + metadata for a single article by slug
getArticle(slug: string[]): ArticleDetail | null
```

### Types (`src/types/content.ts`)

```typescript
type Article = {
  slug: string[]          // e.g. ["tutorials", "getting-started"]
  title: string
  description: string
  order: number
  category: string
}

type Category = {
  name: string            // folder name, e.g. "tutorials" → display as "Tutorials"
  articles: Article[]
}

type ArticleDetail = Article & {
  contentHtml: string     // rendered HTML string
  headings: Heading[]     // extracted for TOC
}

type Heading = {
  id: string
  text: string
  level: number           // 2 or 3 (h2, h3)
}
```

### Implementation notes

- Use Node.js `fs` and `path` to walk `content/` — this only runs server-side in Next.js
- Sort categories alphabetically; sort articles by `order` frontmatter, then alphabetically
- **Display name formatting:** add a `formatName(raw: string): string` utility that converts folder/file names to human-readable labels — replace underscores with spaces, then title-case each word (e.g. `useful_tools` → "Useful Tools", `claude_code` → "Claude Code"). Use this everywhere names are displayed in the UI; never expose raw filesystem names.
- Use `unified().use(remark).use(remarkGfm).use(remarkRehype).use(rehypeSlug).use(rehypeAutolinkHeadings).use(rehypeHighlight).use(rehypeStringify)` pipeline to produce HTML
- Extract headings from the parsed HTML (h2, h3 only) for the TOC — parse the HTML string with a simple regex or use `hast` utilities during the pipeline
- Memoize results where possible since this runs at request time (or use `generateStaticParams` for static export)

---

## Task 3 — Next.js Routing

**Goal:** Set up the App Router routes.

### Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page — hero + category cards grid |
| `/docs/[...slug]` | `src/app/docs/[...slug]/page.tsx` | Dynamic doc renderer |

### `src/app/docs/[...slug]/page.tsx`

- Implement `generateStaticParams()` — call `getAllArticles()` and return all slugs. This enables static export.
- Implement `generateMetadata()` — return `title` and `description` from frontmatter for each page.
- Render `<ArticleRenderer>` with the parsed content.
- Render `<TableOfContents>` with extracted headings.
- URLs will be clean: `/docs/tutorials/getting-started`, `/docs/useful_tools/notion`
- If `getArticle()` returns `null`, call `notFound()`.

### `src/app/layout.tsx`

- Wrap everything in `<ThemeProvider>` from `next-themes` (attribute="class")
- Include `<Sidebar>` on the left (collapsible on mobile)
- Include `<Header>` at the top (contains search trigger + theme toggle)
- Main content area on the right, max readable width (~720px), centered

---

## Task 4 — Core UI Components

**Goal:** Build all UI components. Prioritize clean, readable design — NOT a generic template look.

### Design direction

- **Theme:** Dark-first with a high-quality light mode. Dark: near-black background (`#0d0d0d`), off-white text, accent color deep violet/indigo (`#6366f1`). Light: warm white (`#fafaf9`), near-black text, same accent.
- **Typography:** Use `Geist` (already bundled with Next.js) for UI chrome. Use `Geist Mono` for code. Article body uses a slightly larger line-height (1.75) for readability.
- **Sidebar:** Fixed left, 260px wide. Category names as uppercase labels. Article links as clean list items. Active item highlighted with accent color left border.
- **No generic purple gradient hero.** Homepage should feel editorial.

### `src/components/Sidebar.tsx`

- Receives `categories: Category[]` as prop (fetched server-side in layout)
- Renders category headers (non-clickable, styled as section labels)
- Renders article links using Next.js `<Link>` → `/docs/[...slug]`
- Highlights current active article using `usePathname()`
- Mobile: hidden by default, slide-in drawer toggled from header hamburger
- Desktop: always visible, fixed position

### `src/components/Header.tsx`

- Left: site logo/name ("Claude Docs" or configurable via `next.config`)
- Right: search icon button (opens `<SearchModal>`), `<ThemeToggle>`
- Mobile: hamburger menu button on the left to toggle sidebar
- Sticky at top, subtle bottom border

### `src/components/ThemeToggle.tsx`

- Uses `next-themes` `useTheme()` hook
- Sun/moon icon toggle (use inline SVGs, no icon library dependency)
- Smooth transition, no flash on load (handled by `next-themes`)

### `src/components/ArticleRenderer.tsx`

- Accepts `contentHtml: string`
- Renders via `dangerouslySetInnerHTML` (safe — content is human-authored .md files)
- Wraps in a `<article>` tag with `prose` Tailwind class
- Applies custom Tailwind `prose` overrides in `tailwind.config.ts` for dark mode
- Injects `<CopyCodeButton>` into every `<pre><code>` block — do this via a `useEffect` that querySelectorAll's after mount

### `src/components/CopyCodeButton.tsx`

- A small "Copy" button injected into code blocks
- On click: copies `innerText` of the adjacent `<code>` element to clipboard
- Shows "Copied!" for 2 seconds then reverts
- Positioned absolute top-right of the `<pre>` block
- `<pre>` must have `position: relative` (add this in global CSS)

### `src/components/TableOfContents.tsx`

- Accepts `headings: Heading[]`
- Renders a sticky right-column nav (visible on screens ≥ 1280px)
- Highlights the currently-in-view heading using `IntersectionObserver`
- Smooth-scrolls to anchor on click
- Labeled "On this page" at the top

### `src/components/SearchModal.tsx`

- Triggered by clicking search icon in header or pressing `Cmd+K` / `Ctrl+K`
- Full-screen overlay with centered search input
- Uses `fuse.js` for fuzzy client-side search
- Search index: flat array of `{ title, description, slug, category }` — load from a generated JSON file (see Task 5)
- Results shown as clickable cards grouped by category
- Press `Escape` to close
- Navigate results with arrow keys, select with `Enter`

---

## Task 5 — Search Index Generation

**Goal:** Pre-build a search index JSON file so the client doesn't need server access.

### Approach

Create `src/lib/search-index.ts` with a function `buildSearchIndex()` that:
1. Calls `getAllArticles()`
2. Returns a JSON-serializable array of search records

In `next.config.ts`, use a build plugin or a custom script that writes the index to `public/search-index.json` at build time.

**Simpler alternative (recommended for Claude Code):** Use a Next.js Route Handler at `src/app/api/search-index/route.ts` that calls `getAllArticles()` server-side and returns JSON. The `<SearchModal>` fetches this once on first open and caches it in component state. This avoids any build script complexity.

---

## Task 6 — Styling & Tailwind Configuration

**Goal:** Configure Tailwind for the design system and dark mode.

### `tailwind.config.ts`

```typescript
darkMode: 'class',
theme: {
  extend: {
    colors: {
      accent: '#6366f1',
    },
    typography: (theme) => ({
      DEFAULT: {
        css: {
          maxWidth: 'none',
          lineHeight: '1.75',
          'code::before': { content: 'none' },
          'code::after': { content: 'none' },
          code: {
            backgroundColor: theme('colors.zinc.100'),
            borderRadius: '4px',
            padding: '2px 6px',
            fontWeight: '400',
          },
        },
      },
      invert: {
        css: {
          code: {
            backgroundColor: theme('colors.zinc.800'),
          },
        },
      },
    }),
  },
},
plugins: [require('@tailwindcss/typography')],
```

Install: `npm install -D @tailwindcss/typography`

### Global CSS (`src/app/globals.css`)

- CSS variables for accent color, sidebar width, etc.
- Smooth scrolling: `html { scroll-behavior: smooth; }`
- `pre { position: relative; }` — required for the CopyCodeButton overlay
- Scrollbar styling for sidebar (thin, subtle)
- Page transition: simple opacity fade on route change (optional)

---

## Task 7 — Homepage (`src/app/page.tsx`)

**Goal:** A welcoming landing page that orients new users.

### Layout

- **Hero section:** Title ("Claude Documentation"), subtitle ("Practical guides for building AI-powered support systems with Claude, Lovable, and Claude Code."), a CTA button linking to the first article.
- **Category grid:** One card per category. Each card shows the category name, number of articles, and the first article title as a preview. Cards link to the first article in that category.
- No generic gradient background. Use a subtle grid or dot pattern in the hero background (pure CSS).

---

## Task 8 — Sample Content Files

**Goal:** Provide enough real starter content that the site looks complete and demonstrates all features.

### Files to create

**`content/tutorials/01-getting-started.md`**
```
---
title: Getting Started with Claude
description: Your first steps to using Claude effectively for building company support systems.
order: 1
---

# Getting Started with Claude

Brief intro paragraph...

## What You'll Learn

- Item one
- Item two

## Prerequisites

Some text here.

## Your First Prompt

\`\`\`
You are a helpful customer support agent for Acme Corp...
\`\`\`

## Next Steps

Link to next tutorial.
```

**`content/tutorials/02-claude-and-lovable.md`**
```
---
title: Using Claude with Lovable
description: How to combine Claude's AI with Lovable to build web-based support systems fast.
order: 2
---
(Content placeholder)
```

**`content/useful_tools/prompt-templates.md`**
```
---
title: Prompt Templates
description: Ready-to-use Claude prompt templates for common support scenarios.
order: 1
---
(Content placeholder)
```

---

## Task 9 — `next.config.ts`

Configure:
- `output: 'standalone'` — for Node.js server deployment  
- Add a config constant for the site name used in metadata: `const SITE_NAME = 'Claude Docs'`
- Export `SITE_NAME` so components can import it

For static export (Vercel/Netlify), change to `output: 'export'` and add `images: { unoptimized: true }`. Note this in a comment.

---

## Task 10 — README

Create `README.md` at the project root with:

1. **Project description**
2. **How to add content** — explain the `content/` folder structure, frontmatter fields (`title`, `description`, `order`)
3. **Local development** — `npm run dev` → `http://localhost:3000`
4. **Building for production** — `npm run build && npm start`
5. **Deploying to Vercel** — push to GitHub, connect repo in Vercel dashboard, done
6. **Deploying to a Node server** — `npm run build`, copy `.next/standalone` to server, run `node server.js`
7. **Folder naming** — use lowercase with underscores for category and article filenames (e.g. `useful_tools/`, `claude_code.md`). The UI automatically renders them as human-friendly labels ("Useful Tools", "Claude Code").

---

## Implementation Order

Claude Code should implement tasks in this order to avoid blockers:

1. Task 1 (scaffold + deps)
2. Task 2 (content lib — everything depends on this)  
3. Task 6 (Tailwind config — needed before components)
4. Task 3 (routing)
5. Tasks 4 + 5 (components + search, can be parallel)
6. Task 7 (homepage)
7. Task 8 (sample content)
8. Task 9 (next.config)
9. Task 10 (README)

---

## Definition of Done

- [ ] `npm run dev` starts without errors
- [ ] Visiting `/` shows the homepage with category cards
- [ ] Clicking a card navigates to a rendered article
- [ ] Sidebar shows all categories and articles; active item is highlighted
- [ ] Dark/light toggle works without flash
- [ ] Code blocks have a working Copy button
- [ ] TOC appears on the right for articles with h2/h3 headings; active heading is highlighted on scroll
- [ ] `Cmd+K` opens search modal; typing returns fuzzy-matched results; clicking a result navigates correctly
- [ ] Adding a new `.md` file to `content/` and restarting dev server shows it in the sidebar with no other changes required
- [ ] `npm run build` completes without errors
