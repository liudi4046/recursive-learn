# Root Node Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Create new root node` flow to `/maps` without removing the current `Topic` data model.

**Architecture:** Add a domain helper that appends a topic/root-node pair to existing `AppState`, then have the maps index page render a compact form that calls that helper and routes to the new map. Keep the future Topic-removal migration out of this change.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, Testing Library.

---

### Task 1: App State Helper

**Files:**
- Modify: `src/domain/app-state.ts`
- Test: `src/domain/app-state.test.ts`

- [x] **Step 1: Write the failing test**

Add a test that imports `createRootNode` and verifies that it appends a second topic/root, preserves existing nodes, and activates the new root.

- [x] **Step 2: Run the focused test**

Run: `npm test -- src/domain/app-state.test.ts`

Expected: fail because `createRootNode` is not exported yet.

- [x] **Step 3: Implement the helper**

Add `createRootNode(state: AppState, title: string): AppState` in `src/domain/app-state.ts`. It should trim the title, reject an empty title by returning the original state, reuse `createTopicWithRoot`, append the new topic and node, set `activeTopicId`, set `activeNodeId`, and clear `createChildStreamUi`.

- [x] **Step 4: Run the focused test**

Run: `npm test -- src/domain/app-state.test.ts`

Expected: pass.

### Task 2: Maps Page Form

**Files:**
- Modify: `src/app/maps/page.tsx`

- [x] **Step 1: Update page behavior**

Render the same page shell whether or not roots exist. Add a controlled input with placeholder `What do you want to learn?` and a primary button labelled `Create new root node`. On submit, trim the input, ignore empty submissions, update state with `createRootNode`, and navigate to `/maps/${newActiveTopicId}`.

- [x] **Step 2: Preserve list behavior**

Keep existing root cards below the form. In the zero-root case, show `Create your first root node to start a learning tree.` below the form instead of linking users back to Home.

### Task 3: Page Tests

**Files:**
- Create: `src/app/maps/page.test.tsx`

- [x] **Step 1: Add page tests**

Mock `useAppState` and `useRouter`. Verify that `/maps` renders the creation input with existing roots, renders it with empty state, ignores empty submission, and creates/navigates on non-empty submission.

- [x] **Step 2: Run focused tests**

Run: `npm test -- src/domain/app-state.test.ts src/app/maps/page.test.tsx`

Expected: pass.

### Task 4: Full Verification

**Files:**
- No code changes.

- [x] **Step 1: Run full tests**

Run: `npm test`

Expected: pass, or report unrelated existing failures with exact details.
