# Findora — Agent Working Rules

This file defines the persistent engineering and quality rules for the Findora project. It is read by Cline (and compatible agents) at the start of work sessions to maintain consistency.

## Project Identity

**Findora: A Smart Lost and Found Management System with Verified Claims and Intelligent Item Matching.**

Frontend prototype for a university lost-and-found platform. No backend, database, authentication, image hosting, or AI matching exists yet. All data is fictional sample data clearly labelled as such.

## Core Principles

1. **Inspect before editing.** Always read the repository structure and existing files before making changes.
2. **Plan before coding.** Never generate code without a short plan stating what will change and why.
3. **Verify documentation before using unfamiliar APIs.** Check Vite, React, Tailwind CSS v4, and Lucide docs before using their APIs.
4. **Reuse established components.** Do not duplicate UI patterns that already exist in the codebase.
5. **Avoid unnecessary dependencies.** Only add a package when it solves a specific, well-understood problem.
6. **Inspect the rendered website.** After changes, run the dev server and check the actual browser output.
7. **Fix observed defects.** Do not commit code with visible visual or functional bugs.
8. **Run appropriate checks.** TypeScript check, lint, and production build must pass before considering a task complete.
9. **Report verified results honestly.** Do not claim success based on generated code alone.

## Design Constraints

- Warm white or neutral backgrounds (`#ffffff`, `#f8fafc`)
- Deep charcoal typography (`#0f172a`, `#334155`)
- One restrained accent color: amber/orange (`#d97706`)
- Strong typography and intentional whitespace
- Thin borders (`1px solid #e2e8f0`) and restrained shadows
- No glassmorphism, no floating decorative blobs, no emoji icons, no generic stock photography
- No fake testimonials, invented statistics, or fake partner logos
- No excessive animations or scroll-jacking
- Semantic HTML, visible keyboard focus, sufficient color contrast

## Tech Stack

| Package | Purpose |
|---------|---------|
| Vite | Build tool & dev server |
| React | UI framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling (`@tailwindcss/vite` plugin) |
| lucide-react | Interface icons |

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build (TypeScript check + Vite build)
- `npm run preview` — Preview production build

## File Locations

- `vite.config.ts` — Vite config with `@vitejs/plugin-react` and `@tailwindcss/vite`
- `src/style.css` — Tailwind v4 import + Findora design tokens (base, components, utilities layers)
- `src/main.tsx` — React entry point
- `src/App.tsx` — Root application component
- `AGENTS.md` — This file (agent working rules)
- `WORKFLOW.md` — Reusable agent workflow steps
- `DESIGN_SPEC.md` — Design tokens and visual specification
- `README.md` — Project setup and reuse instructions