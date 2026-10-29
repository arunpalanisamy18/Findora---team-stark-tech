# Findora — Reusable Agent Workflow

This workflow establishes a repeatable process for building professional frontend websites. It is designed to be reused across future projects.

## Phase 1: Environment Inspection

Before any work begins:

1. Confirm workspace contents: `Get-ChildItem -Force` (PowerShell)
2. Verify terminal access: `node --version`, `npm --version`
3. Check browser availability: Microsoft Edge, Google Chrome
4. Check for existing git repository: `git status`
5. Identify available AI tool capabilities (rules, skills, MCP)

## Phase 2: Reference Analysis & Design Specification

1. Study reference websites (e.g., eqrev.com) using fetch/browser tools
2. Document: composition, typography, color, spacing, CTAs, interactive elements
3. Create `DESIGN_SPEC.md` with:
   - Visual identity (colors, type scale, spacing, grid)
   - Art direction constraints (what to prefer / avoid)
   - Component conventions
   - Responsive breakpoints

## Phase 3: Reusable Rules & Workflow Documentation

1. Create `AGENTS.md` — persistent agent working rules
2. Create `WORKFLOW.md` — this reusable workflow
3. Create `README.md` — project setup and reuse instructions
4. Verify Cline's supported rule mechanism (`.clinerules` vs Markdown)

## Phase 4: Project Scaffolding (Approval Required)

1. Scaffold Vite + React: `npm create vite@latest . -- --template react`
2. Install dependencies: `npm install` then specific packages
3. Configure Tailwind CSS v4 with `@tailwindcss/vite`
4. Install: `tailwindcss`, `@tailwindcss/vite`, `lucide-react`
5. Initialize Git inside workspace only
6. **Ask for approval before installing packages or initializing Git**

## Phase 5: Design System & Implementation

1. Define design tokens in `src/style.css` (Tailwind v4 `@layer base/components/utilities`)
2. Build sections incrementally (Navigation → Hero → Product preview → etc.)
3. Use semantic HTML and accessible ARIA attributes
4. Implement working frontend interactions (search, filters, forms)
5. Use fictional sample data, clearly labelled

## Phase 6: Browser QA & Iteration

1. Start dev server: `npm run dev`
2. Open in browser: Edge or Chrome
3. Inspect: desktop viewport, mobile viewport, full page scroll
4. Check: overflow, clipping, line breaks, spacing, typography, contrast
5. Test: navigation, filters, forms, mobile interactions, keyboard focus
6. Inspect console errors and failed network requests
7. Fix defects, re-inspect, repeat

## Phase 7: Build Verification & Documentation

1. Run production build: `npm run build`
2. Fix any build errors
3. Update `README.md` with accurate setup and commands
4. Document known limitations
5. Commit all changes to Git

## Gate Checklist (Before Marking Complete)

- [ ] Design specification exists (`DESIGN_SPEC.md`)
- [ ] Persistent rules exist (`AGENTS.md`)
- [ ] Workflow documentation exists (`WORKFLOW.md`)
- [ ] Frontend runs successfully (`npm run dev`)
- [ ] Landing page has coherent visual identity
- [ ] Responsive behavior checked (desktop + mobile)
- [ ] Core demonstration interactions work
- [ ] Accessibility basics checked (focus, contrast, semantics)
- [ ] No obvious visual defects remain
- [ ] Production build succeeds (`npm run build`)
- [ ] Documentation accurately describes implementation
- [ ] Unverified checks or limitations explicitly reported