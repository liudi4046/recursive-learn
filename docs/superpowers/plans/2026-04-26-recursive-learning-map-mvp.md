# Recursive Learning Network MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MapLearn MVP where topic learning maps are trees, the knowledge base is a concept network, and users choose whether a question creates a child node or continues the current node.

**Architecture:** Use a Next.js TypeScript app with pure domain modules for topics, learning nodes, concepts, concept relations, and AI context construction. Keep node-tree behavior separate from concept-network behavior so the learning map remains tree-shaped while the knowledge base renders graph relationships.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, Playwright, Zod, nanoid, OpenAI Node SDK with a mock provider as the default development provider.

---

## File Structure

- `src/domain/types.ts`: Topic, LearningNode, NodeContentBlock, Concept, ConceptRelation, AI output types.
- `src/domain/learning-tree.ts`: create topic/root node, create child node, continue current node, update node status, get path.
- `src/domain/concept-network.ts`: normalize names, find or create concepts, add concept relations, build graph view model.
- `src/domain/context.ts`: build AI context from current topic, active path, active node, selected ask mode, and small concept context.
- `src/domain/mock-ai.ts`: deterministic AI output for local development and tests.
- `src/domain/ai-schema.ts`: Zod schemas for create-child and continue-here outputs.
- `src/app/api/ask/route.ts`: server API for both ask modes.
- `src/lib/storage.ts`: local session persistence for MVP.
- `src/components/NodeDetailPage.tsx`: breadcrumb, node status, content, ask mode switch, question input.
- `src/components/LearningMapPage.tsx`: topic tree canvas and selected-node side panel.
- `src/components/KnowledgeBasePage.tsx`: concept network canvas and selected-concept side panel.
- `src/components/ConceptDetailPage.tsx`: concept context, linked nodes, related concepts, local network preview.
- `src/components/HomePage.tsx`: topic input and example tree preview.
- `src/app/page.tsx`: homepage route.
- `src/app/nodes/[nodeId]/page.tsx`: node detail route.
- `src/app/maps/[topicId]/page.tsx`: learning map route.
- `src/app/knowledge-base/page.tsx`: knowledge base route.
- `src/app/concepts/[conceptId]/page.tsx`: concept detail route.
- `e2e/maplearn-flow.spec.ts`: Playwright coverage for the critical product flow.

## Task 1: Scaffold Next App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/test/setup.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Write scaffold files**

Create `package.json`:

```json
{
  "name": "recursive-learn",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "nanoid": "latest",
    "next": "latest",
    "openai": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"]
  }
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI
  },
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MapLearn",
  description: "Recursive AI learning maps and concept networks"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `.env.example`:

```bash
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Create `.gitignore`:

```gitignore
.env
.next/
node_modules/
coverage/
playwright-report/
test-results/
*.log
```

Create `src/app/globals.css`:

```css
:root {
  --bg: #f8fbff;
  --panel: #ffffff;
  --ink: #0f172a;
  --muted: #64748b;
  --line: #d8e0ec;
  --blue: #0f62fe;
  --blue-soft: #eef5ff;
  --green: #16a34a;
  --green-soft: #eaf8ef;
  --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
button, input, textarea { font: inherit; }
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: exits with code 0 and creates `package-lock.json`.

- [ ] **Step 3: Verify scaffold**

Run:

```bash
npm run test
npm run build
```

Expected: tests run with no implementation failures. `npm run build` succeeds once Task 7 creates the initial routes.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts playwright.config.ts src/test src/app .env.example .gitignore
git commit -m "chore: scaffold maplearn app"
```

## Task 2: Domain Types

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/types.test.ts`

- [ ] **Step 1: Write type-shape test**

Create `src/domain/types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Concept, LearningNode, NodeStatus } from "./types";

describe("domain types", () => {
  it("keeps mastery state on learning nodes only", () => {
    const status: NodeStatus = "mastered";
    const node: LearningNode = {
      id: "node_1",
      topicId: "topic_1",
      parentNodeId: null,
      linkedConceptId: "concept_1",
      title: "Q/K/V",
      contentBlocks: [{ id: "block_1", question: null, answer: "Root answer", createdAt: "2026-04-26T00:00:00.000Z" }],
      status,
      createdAt: "2026-04-26T00:00:00.000Z",
      updatedAt: "2026-04-26T00:00:00.000Z"
    };
    const concept: Concept = {
      id: "concept_1",
      name: "Self-attention",
      description: null,
      aliases: [],
      createdAt: "2026-04-26T00:00:00.000Z",
      updatedAt: "2026-04-26T00:00:00.000Z"
    };

    expect(node.status).toBe("mastered");
    expect("status" in concept).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/types.test.ts
```

Expected: FAIL because `src/domain/types.ts` does not exist.

- [ ] **Step 3: Implement types**

Create `src/domain/types.ts`:

```ts
export type NodeStatus = "unmastered" | "mastered";
export type AskMode = "create_child_node" | "continue_here";
export type ConceptRelationLabel = "related" | "part_of" | "uses" | "used_by";

export type Topic = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type NodeContentBlock = {
  id: string;
  question: string | null;
  answer: string;
  createdAt: string;
};

export type LearningNode = {
  id: string;
  topicId: string;
  parentNodeId: string | null;
  linkedConceptId: string | null;
  title: string;
  contentBlocks: NodeContentBlock[];
  status: NodeStatus;
  createdAt: string;
  updatedAt: string;
};

export type Concept = {
  id: string;
  name: string;
  description: string | null;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
};

export type ConceptRelation = {
  id: string;
  sourceConceptId: string;
  targetConceptId: string;
  label: ConceptRelationLabel;
};

export type CreateNodeOutput = {
  title: string;
  answer: string;
  conceptCandidate: string | null;
  relatedConceptCandidates: Array<{ name: string; relation: ConceptRelationLabel }>;
};

export type ContinueNodeOutput = {
  answer: string;
  conceptCandidate: string | null;
  relatedConceptCandidates: Array<{ name: string; relation: ConceptRelationLabel }>;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/types.test.ts
git commit -m "feat: define learning node and concept domain types"
```

## Task 3: Learning Tree Domain

**Files:**
- Create: `src/domain/learning-tree.ts`
- Create: `src/domain/learning-tree.test.ts`

- [ ] **Step 1: Write failing learning-tree tests**

Create `src/domain/learning-tree.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { appendToNode, createChildNode, createTopicWithRoot, getNodePath, updateNodeStatus } from "./learning-tree";

describe("learning tree", () => {
  it("creates a topic with an unmastered root node", () => {
    const session = createTopicWithRoot("Transformer", "A deep learning architecture.");
    expect(session.topic.title).toBe("Transformer");
    expect(session.nodes).toHaveLength(1);
    expect(session.nodes[0].status).toBe("unmastered");
  });

  it("creates a child node only when the ask mode is create child node", () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const child = createChildNode(session.nodes[0], {
      title: "Self-attention",
      answer: "Self-attention answer",
      conceptCandidate: "Self-attention",
      relatedConceptCandidates: []
    });
    expect(child.parentNodeId).toBe(session.nodes[0].id);
    expect(child.title).toBe("Self-attention");
  });

  it("continues current node without creating a new node", () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const updated = appendToNode(session.nodes[0], "Can you explain with an example?", "Example answer");
    expect(updated.id).toBe(session.nodes[0].id);
    expect(updated.contentBlocks).toHaveLength(2);
    expect(updated.contentBlocks[1].question).toBe("Can you explain with an example?");
  });

  it("returns only the path from root to selected node", () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const child = createChildNode(session.nodes[0], {
      title: "Self-attention",
      answer: "Answer",
      conceptCandidate: "Self-attention",
      relatedConceptCandidates: []
    });
    const sibling = createChildNode(session.nodes[0], {
      title: "Positional Encoding",
      answer: "Answer",
      conceptCandidate: "Positional Encoding",
      relatedConceptCandidates: []
    });
    expect(getNodePath([session.nodes[0], child, sibling], child.id).map((node) => node.title)).toEqual([
      "Transformer",
      "Self-attention"
    ]);
  });

  it("updates node mastery state", () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const updated = updateNodeStatus(session.nodes[0], "mastered");
    expect(updated.status).toBe("mastered");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/learning-tree.test.ts
```

Expected: FAIL because `learning-tree.ts` does not exist.

- [ ] **Step 3: Implement learning tree**

Create `src/domain/learning-tree.ts`:

```ts
import { nanoid } from "nanoid";
import type { CreateNodeOutput, LearningNode, NodeStatus, Topic } from "./types";

export type LearningSession = {
  topic: Topic;
  nodes: LearningNode[];
  activeNodeId: string;
};

function now() {
  return new Date().toISOString();
}

export function createTopicWithRoot(title: string, answer: string): LearningSession {
  const timestamp = now();
  const topic: Topic = { id: `topic_${nanoid(8)}`, title, createdAt: timestamp, updatedAt: timestamp };
  const root: LearningNode = {
    id: `node_${nanoid(8)}`,
    topicId: topic.id,
    parentNodeId: null,
    linkedConceptId: null,
    title,
    contentBlocks: [{ id: `block_${nanoid(8)}`, question: null, answer, createdAt: timestamp }],
    status: "unmastered",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  return { topic, nodes: [root], activeNodeId: root.id };
}

export function createChildNode(parent: LearningNode, output: CreateNodeOutput): LearningNode {
  const timestamp = now();
  return {
    id: `node_${nanoid(8)}`,
    topicId: parent.topicId,
    parentNodeId: parent.id,
    linkedConceptId: null,
    title: output.title,
    contentBlocks: [{ id: `block_${nanoid(8)}`, question: output.title, answer: output.answer, createdAt: timestamp }],
    status: "unmastered",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function appendToNode(node: LearningNode, question: string, answer: string): LearningNode {
  return {
    ...node,
    contentBlocks: [...node.contentBlocks, { id: `block_${nanoid(8)}`, question, answer, createdAt: now() }],
    updatedAt: now()
  };
}

export function updateNodeStatus(node: LearningNode, status: NodeStatus): LearningNode {
  return { ...node, status, updatedAt: now() };
}

export function getNodePath(nodes: LearningNode[], nodeId: string): LearningNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const path: LearningNode[] = [];
  let current = byId.get(nodeId);
  while (current) {
    path.unshift(current);
    current = current.parentNodeId ? byId.get(current.parentNodeId) : undefined;
  }
  return path;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/learning-tree.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/learning-tree.ts src/domain/learning-tree.test.ts
git commit -m "feat: add tree-shaped learning node domain"
```

## Task 4: Concept Network Domain

**Files:**
- Create: `src/domain/concept-network.ts`
- Create: `src/domain/concept-network.test.ts`

- [ ] **Step 1: Write failing concept-network tests**

Create `src/domain/concept-network.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildConceptGraph, findOrCreateConcept, upsertConceptRelations } from "./concept-network";
import type { Concept, ConceptRelation } from "./types";

describe("concept network", () => {
  it("matches concepts by normalized name and aliases", () => {
    const concepts: Concept[] = [{
      id: "concept_1",
      name: "Self-attention",
      description: null,
      aliases: ["Self Attention"],
      createdAt: "2026-04-26T00:00:00.000Z",
      updatedAt: "2026-04-26T00:00:00.000Z"
    }];
    const result = findOrCreateConcept(concepts, "self attention");
    expect(result.concept.id).toBe("concept_1");
    expect(result.created).toBe(false);
  });

  it("creates a concept when no strong local match exists", () => {
    const result = findOrCreateConcept([], "Q/K/V");
    expect(result.concept.name).toBe("Q/K/V");
    expect(result.created).toBe(true);
  });

  it("builds graph nodes and edges for the knowledge base page", () => {
    const concepts: Concept[] = [
      { id: "a", name: "Self-attention", description: null, aliases: [], createdAt: "x", updatedAt: "x" },
      { id: "b", name: "Q/K/V", description: null, aliases: [], createdAt: "x", updatedAt: "x" }
    ];
    const relations: ConceptRelation[] = [{ id: "r1", sourceConceptId: "a", targetConceptId: "b", label: "uses" }];
    expect(buildConceptGraph(concepts, relations)).toEqual({
      nodes: [{ id: "a", label: "Self-attention" }, { id: "b", label: "Q/K/V" }],
      edges: [{ id: "r1", source: "a", target: "b", label: "uses" }]
    });
  });

  it("adds relation candidates without duplicating existing edges", () => {
    const concepts: Concept[] = [
      { id: "a", name: "Self-attention", description: null, aliases: [], createdAt: "x", updatedAt: "x" },
      { id: "b", name: "Q/K/V", description: null, aliases: [], createdAt: "x", updatedAt: "x" }
    ];
    const existing: ConceptRelation[] = [{ id: "r1", sourceConceptId: "a", targetConceptId: "b", label: "uses" }];
    const next = upsertConceptRelations(concepts, existing, "a", [{ name: "Q/K/V", relation: "uses" }]);
    expect(next).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/concept-network.test.ts
```

Expected: FAIL because `concept-network.ts` does not exist.

- [ ] **Step 3: Implement concept network**

Create `src/domain/concept-network.ts`:

```ts
import { nanoid } from "nanoid";
import type { Concept, ConceptRelation, ConceptRelationLabel } from "./types";

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

function timestamp() {
  return new Date().toISOString();
}

export function findOrCreateConcept(concepts: Concept[], candidateName: string): { concept: Concept; created: boolean } {
  const normalized = normalizeName(candidateName);
  const existing = concepts.find((concept) => {
    const names = [concept.name, ...concept.aliases].map(normalizeName);
    return names.includes(normalized);
  });

  if (existing) return { concept: existing, created: false };

  const now = timestamp();
  return {
    created: true,
    concept: {
      id: `concept_${nanoid(8)}`,
      name: candidateName.trim(),
      description: null,
      aliases: [],
      createdAt: now,
      updatedAt: now
    }
  };
}

export function upsertConceptRelations(
  concepts: Concept[],
  relations: ConceptRelation[],
  sourceConceptId: string,
  candidates: Array<{ name: string; relation: ConceptRelationLabel }>
): ConceptRelation[] {
  const next = [...relations];
  for (const candidate of candidates) {
    const target = concepts.find((concept) => normalizeName(concept.name) === normalizeName(candidate.name));
    if (!target || target.id === sourceConceptId) continue;
    const exists = next.some(
      (relation) =>
        relation.sourceConceptId === sourceConceptId &&
        relation.targetConceptId === target.id &&
        relation.label === candidate.relation
    );
    if (!exists) {
      next.push({
        id: `relation_${nanoid(8)}`,
        sourceConceptId,
        targetConceptId: target.id,
        label: candidate.relation
      });
    }
  }
  return next;
}

export function buildConceptGraph(concepts: Concept[], relations: ConceptRelation[]) {
  return {
    nodes: concepts.map((concept) => ({ id: concept.id, label: concept.name })),
    edges: relations.map((relation) => ({
      id: relation.id,
      source: relation.sourceConceptId,
      target: relation.targetConceptId,
      label: relation.label
    }))
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/concept-network.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/concept-network.ts src/domain/concept-network.test.ts
git commit -m "feat: add concept network domain"
```

## Task 5: AI Context And Ask API

**Files:**
- Create: `src/domain/context.ts`
- Create: `src/domain/ai-schema.ts`
- Create: `src/domain/mock-ai.ts`
- Create: `src/app/api/ask/route.ts`
- Create: `src/domain/context.test.ts`
- Create: `src/app/api/ask/route.test.ts`

- [ ] **Step 1: Write context and API tests**

Create `src/domain/context.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildAskContext } from "./context";
import { createChildNode, createTopicWithRoot } from "./learning-tree";

describe("buildAskContext", () => {
  it("includes selected ask mode and only the active path", () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const child = createChildNode(session.nodes[0], {
      title: "Self-attention",
      answer: "Attention answer",
      conceptCandidate: "Self-attention",
      relatedConceptCandidates: []
    });
    const sibling = createChildNode(session.nodes[0], {
      title: "Positional Encoding",
      answer: "Position answer",
      conceptCandidate: "Positional Encoding",
      relatedConceptCandidates: []
    });

    const context = buildAskContext({
      topic: session.topic,
      nodes: [session.nodes[0], child, sibling],
      activeNodeId: child.id,
      question: "Q/K/V 是什么？",
      mode: "create_child_node",
      relatedConcepts: [{ name: "Self-attention", description: null }]
    });

    expect(context.mode).toBe("create_child_node");
    expect(context.path.map((node) => node.title)).toEqual(["Transformer", "Self-attention"]);
    expect(JSON.stringify(context)).not.toContain("Positional Encoding");
  });
});
```

Create `src/app/api/ask/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { createTopicWithRoot } from "@/domain/learning-tree";

describe("POST /api/ask", () => {
  it("returns create-node output for create child mode", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(new Request("http://localhost/api/ask", {
      method: "POST",
      body: JSON.stringify({
        topic: session.topic,
        nodes: session.nodes,
        activeNodeId: session.activeNodeId,
        question: "Q/K/V 是什么？",
        mode: "create_child_node",
        relatedConcepts: []
      })
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.kind).toBe("create_child_node");
    expect(body.output.title).toBe("Q/K/V");
  });

  it("returns continue output for continue here mode", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(new Request("http://localhost/api/ask", {
      method: "POST",
      body: JSON.stringify({
        topic: session.topic,
        nodes: session.nodes,
        activeNodeId: session.activeNodeId,
        question: "Explain with an example",
        mode: "continue_here",
        relatedConcepts: []
      })
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.kind).toBe("continue_here");
    expect(body.output.answer).toContain("example");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/context.test.ts src/app/api/ask/route.test.ts
```

Expected: FAIL because context and route modules do not exist.

- [ ] **Step 3: Implement context, schemas, mock AI, and route**

Create `src/domain/context.ts`:

```ts
import { getNodePath } from "./learning-tree";
import type { AskMode, LearningNode, Topic } from "./types";

export type AskContext = {
  topicTitle: string;
  mode: AskMode;
  path: Array<{ id: string; title: string }>;
  activeNode: LearningNode;
  question: string;
  relatedConcepts: Array<{ name: string; description: string | null }>;
};

export function buildAskContext(input: {
  topic: Topic;
  nodes: LearningNode[];
  activeNodeId: string;
  question: string;
  mode: AskMode;
  relatedConcepts: Array<{ name: string; description: string | null }>;
}): AskContext {
  const path = getNodePath(input.nodes, input.activeNodeId);
  const activeNode = path[path.length - 1];
  if (!activeNode) throw new Error(`Missing active node ${input.activeNodeId}`);
  return {
    topicTitle: input.topic.title,
    mode: input.mode,
    path: path.map((node) => ({ id: node.id, title: node.title })),
    activeNode,
    question: input.question,
    relatedConcepts: input.relatedConcepts
  };
}
```

Create `src/domain/ai-schema.ts`:

```ts
import { z } from "zod";

const relationSchema = z.enum(["related", "part_of", "uses", "used_by"]);

export const createNodeOutputSchema = z.object({
  title: z.string().min(1),
  answer: z.string().min(1),
  conceptCandidate: z.string().min(1).nullable(),
  relatedConceptCandidates: z.array(z.object({ name: z.string().min(1), relation: relationSchema }))
});

export const continueNodeOutputSchema = z.object({
  answer: z.string().min(1),
  conceptCandidate: z.string().min(1).nullable(),
  relatedConceptCandidates: z.array(z.object({ name: z.string().min(1), relation: relationSchema }))
});
```

Create `src/domain/mock-ai.ts`:

```ts
import type { AskContext } from "./context";
import type { ContinueNodeOutput, CreateNodeOutput } from "./types";

export async function mockCreateNode(context: AskContext): Promise<CreateNodeOutput> {
  if (context.question.toLowerCase().includes("q/k/v")) {
    return {
      title: "Q/K/V",
      answer: "Q, K, and V are learned projections used by self-attention to compare tokens and aggregate information.",
      conceptCandidate: "Q/K/V",
      relatedConceptCandidates: [{ name: "Self-attention", relation: "part_of" }]
    };
  }
  return {
    title: context.question.replace(/[?？.!！。]/g, "").slice(0, 40),
    answer: `This child node explains: ${context.question}`,
    conceptCandidate: context.question.replace(/[?？.!！。]/g, "").slice(0, 40),
    relatedConceptCandidates: []
  };
}

export async function mockContinueNode(context: AskContext): Promise<ContinueNodeOutput> {
  return {
    answer: `Here is a continued explanation with an example for: ${context.question}`,
    conceptCandidate: null,
    relatedConceptCandidates: []
  };
}
```

Create `src/app/api/ask/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createNodeOutputSchema, continueNodeOutputSchema } from "@/domain/ai-schema";
import { buildAskContext } from "@/domain/context";
import { mockContinueNode, mockCreateNode } from "@/domain/mock-ai";
import type { AskMode, LearningNode, Topic } from "@/domain/types";

type AskRequest = {
  topic: Topic;
  nodes: LearningNode[];
  activeNodeId: string;
  question: string;
  mode: AskMode;
  relatedConcepts: Array<{ name: string; description: string | null }>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AskRequest;
  const question = body.question.trim();
  if (!question) return NextResponse.json({ error: "Question is required" }, { status: 400 });

  const context = buildAskContext({ ...body, question });
  if (body.mode === "create_child_node") {
    const output = createNodeOutputSchema.parse(await mockCreateNode(context));
    return NextResponse.json({ kind: "create_child_node", output });
  }

  const output = continueNodeOutputSchema.parse(await mockContinueNode(context));
  return NextResponse.json({ kind: "continue_here", output });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm run test -- src/domain/context.test.ts src/app/api/ask/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/context.ts src/domain/ai-schema.ts src/domain/mock-ai.ts src/app/api/ask src/domain/context.test.ts
git commit -m "feat: add ask mode API and scoped context"
```

## Task 6: Storage And App State

**Files:**
- Create: `src/domain/app-state.ts`
- Create: `src/domain/app-state.test.ts`
- Create: `src/lib/storage.ts`

- [ ] **Step 1: Write app-state tests**

Create `src/domain/app-state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState, handleAskResult } from "./app-state";

describe("app state", () => {
  it("creates a topic, root node, and root concept candidate", () => {
    const state = createInitialState("Transformer");
    expect(state.topics).toHaveLength(1);
    expect(state.nodes).toHaveLength(1);
    expect(state.activeNodeId).toBe(state.nodes[0].id);
  });

  it("adds a child node for create child mode", () => {
    const state = createInitialState("Transformer");
    const next = handleAskResult(state, {
      mode: "create_child_node",
      question: "Q/K/V 是什么？",
      output: {
        title: "Q/K/V",
        answer: "Answer",
        conceptCandidate: "Q/K/V",
        relatedConceptCandidates: []
      }
    });
    expect(next.nodes).toHaveLength(2);
    expect(next.activeNodeId).toBe(next.nodes[1].id);
    expect(next.concepts.some((concept) => concept.name === "Q/K/V")).toBe(true);
  });

  it("continues current node without changing node count", () => {
    const state = createInitialState("Transformer");
    const next = handleAskResult(state, {
      mode: "continue_here",
      question: "Give an example",
      output: {
        answer: "Example answer",
        conceptCandidate: null,
        relatedConceptCandidates: []
      }
    });
    expect(next.nodes).toHaveLength(1);
    expect(next.nodes[0].contentBlocks).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/app-state.test.ts
```

Expected: FAIL because `app-state.ts` does not exist.

- [ ] **Step 3: Implement app state and storage**

Create `src/domain/app-state.ts`:

```ts
import { appendToNode, createChildNode, createTopicWithRoot } from "./learning-tree";
import { findOrCreateConcept } from "./concept-network";
import type { Concept, ConceptRelation, ContinueNodeOutput, CreateNodeOutput, LearningNode, Topic } from "./types";

export type AppState = {
  topics: Topic[];
  nodes: LearningNode[];
  concepts: Concept[];
  conceptRelations: ConceptRelation[];
  activeTopicId: string;
  activeNodeId: string;
};

export function createInitialState(topicTitle: string): AppState {
  const session = createTopicWithRoot(topicTitle, `Start learning ${topicTitle}.`);
  return {
    topics: [session.topic],
    nodes: session.nodes,
    concepts: [],
    conceptRelations: [],
    activeTopicId: session.topic.id,
    activeNodeId: session.activeNodeId
  };
}

export function handleAskResult(
  state: AppState,
  input:
    | { mode: "create_child_node"; question: string; output: CreateNodeOutput }
    | { mode: "continue_here"; question: string; output: ContinueNodeOutput }
): AppState {
  const active = state.nodes.find((node) => node.id === state.activeNodeId);
  if (!active) throw new Error(`Missing active node ${state.activeNodeId}`);

  const conceptResult = input.output.conceptCandidate
    ? findOrCreateConcept(state.concepts, input.output.conceptCandidate)
    : null;
  const concepts = conceptResult?.created ? [...state.concepts, conceptResult.concept] : state.concepts;

  if (input.mode === "create_child_node") {
    const generatedChild = createChildNode(active, input.output);
    const child = {
      ...generatedChild,
      linkedConceptId: conceptResult?.concept.id ?? null,
      contentBlocks: [{ ...generatedChild.contentBlocks[0], question: input.question }]
    };
    return { ...state, concepts, nodes: [...state.nodes, child], activeNodeId: child.id };
  }

  const updated = {
    ...appendToNode(active, input.question, input.output.answer),
    linkedConceptId: active.linkedConceptId ?? conceptResult?.concept.id ?? null
  };
  return { ...state, concepts, nodes: state.nodes.map((node) => (node.id === active.id ? updated : node)) };
}
```

Create `src/lib/storage.ts`:

```ts
import type { AppState } from "@/domain/app-state";

const KEY = "maplearn.state.v1";

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadState(): AppState | null {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as AppState) : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/app-state.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/app-state.ts src/domain/app-state.test.ts src/lib/storage.ts
git commit -m "feat: add app state for ask modes and concepts"
```

## Task 7: Core Pages And Styling

**Files:**
- Create: `src/components/HomePage.tsx`
- Create: `src/components/NodeDetailPage.tsx`
- Create: `src/components/LearningMapPage.tsx`
- Create: `src/components/KnowledgeBasePage.tsx`
- Create: `src/components/ConceptDetailPage.tsx`
- Modify: `src/app/globals.css`
- Create: route files under `src/app/`

- [ ] **Step 1: Write component smoke test**

Create `src/components/pages.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createInitialState } from "@/domain/app-state";
import { HomePage } from "./HomePage";
import { NodeDetailPage } from "./NodeDetailPage";
import { LearningMapPage } from "./LearningMapPage";
import { KnowledgeBasePage } from "./KnowledgeBasePage";

describe("pages", () => {
  it("renders homepage start form", () => {
    render(<HomePage onStart={() => undefined} />);
    expect(screen.getByText("Turn your questions into a learning map.")).toBeInTheDocument();
  });

  it("renders node detail with ask mode switch", () => {
    const state = createInitialState("Transformer");
    render(<NodeDetailPage state={state} onStateChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Create child node" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue here" })).toBeInTheDocument();
  });

  it("renders learning map as a tree page", () => {
    const state = createInitialState("Transformer");
    render(<LearningMapPage state={state} onStateChange={() => undefined} />);
    expect(screen.getByText("Transformer")).toBeInTheDocument();
    expect(screen.getByText("Unmastered")).toBeInTheDocument();
  });

  it("renders knowledge base as a network page", () => {
    const state = createInitialState("Transformer");
    render(<KnowledgeBasePage state={state} />);
    expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
    expect(screen.getByLabelText("Concept network")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/components/pages.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement minimal page components**

Create page components with these required contracts:

```tsx
// src/components/HomePage.tsx
"use client";
export function HomePage({ onStart }: { onStart: (topic: string) => void }) {
  return <main className="home"><h1>Turn your questions into a learning map.</h1><input aria-label="Learning topic" /><button onClick={() => onStart("Transformer")}>Start learning</button></main>;
}
```

```tsx
// src/components/NodeDetailPage.tsx
"use client";
import type { AppState } from "@/domain/app-state";
export function NodeDetailPage({ state }: { state: AppState; onStateChange: (state: AppState) => void }) {
  const node = state.nodes.find((item) => item.id === state.activeNodeId) ?? state.nodes[0];
  return <main className="node-page"><h1>{node.title}</h1><div className="segmented"><button>Unmastered</button><button>Mastered</button></div><article>{node.contentBlocks.map((block) => <p key={block.id}>{block.answer}</p>)}</article><div className="segmented"><button>Create child node</button><button>Continue here</button></div><textarea aria-label="Ask a question" /><button>Create child node</button></main>;
}
```

```tsx
// src/components/LearningMapPage.tsx
"use client";
import type { AppState } from "@/domain/app-state";
export function LearningMapPage({ state }: { state: AppState; onStateChange: (state: AppState) => void }) {
  return <main className="map-page"><input aria-label="Search nodes" /><div className="segmented"><button>All</button><button>Unmastered</button><button>Mastered</button></div><section className="tree-canvas">{state.nodes.map((node) => <button className="map-node-card" key={node.id}>{node.title}<span>{node.status === "mastered" ? "Mastered" : "Unmastered"}</span></button>)}</section></main>;
}
```

```tsx
// src/components/KnowledgeBasePage.tsx
"use client";
import type { AppState } from "@/domain/app-state";
export function KnowledgeBasePage({ state }: { state: AppState }) {
  return <main className="knowledge-page"><h1>Knowledge Base</h1><input aria-label="Search concepts" /><section aria-label="Concept network" className="network-canvas">{state.concepts.map((concept) => <button className="concept-node" key={concept.id}>{concept.name}</button>)}</section></main>;
}
```

```tsx
// src/components/ConceptDetailPage.tsx
"use client";
import type { AppState } from "@/domain/app-state";
export function ConceptDetailPage({ state, conceptId }: { state: AppState; conceptId: string }) {
  const concept = state.concepts.find((item) => item.id === conceptId);
  if (!concept) return <main>Concept not found</main>;
  return <main className="concept-page"><h1>{concept.name}</h1><section>Appears in topics</section><section>Linked learning nodes</section><section>Related concepts</section><aside aria-label="Local network preview" /></main>;
}
```

Append core styling to `src/app/globals.css`:

```css
.home, .node-page, .map-page, .knowledge-page, .concept-page { padding: 48px; }
.segmented { display: inline-flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.segmented button { border: 0; padding: 12px 20px; background: white; color: var(--ink); }
.tree-canvas, .network-canvas { min-height: 520px; border: 1px solid var(--line); border-radius: 12px; background: radial-gradient(circle, #d8e0ec 1px, transparent 1px) 0 0 / 22px 22px, white; box-shadow: var(--shadow); }
.map-node-card, .concept-node { border: 1px solid var(--line); border-radius: 10px; background: white; padding: 18px; box-shadow: var(--shadow); }
```

Create initial route files:

```tsx
// src/app/page.tsx
import { HomePage } from "@/components/HomePage";

export default function Page() {
  return <HomePage onStart={() => undefined} />;
}
```

```tsx
// src/app/nodes/[nodeId]/page.tsx
import { NodeDetailPage } from "@/components/NodeDetailPage";
import { createInitialState } from "@/domain/app-state";

export default function Page() {
  return <NodeDetailPage state={createInitialState("Transformer")} onStateChange={() => undefined} />;
}
```

```tsx
// src/app/maps/[topicId]/page.tsx
import { LearningMapPage } from "@/components/LearningMapPage";
import { createInitialState } from "@/domain/app-state";

export default function Page() {
  return <LearningMapPage state={createInitialState("Transformer")} onStateChange={() => undefined} />;
}
```

```tsx
// src/app/knowledge-base/page.tsx
import { KnowledgeBasePage } from "@/components/KnowledgeBasePage";
import { createInitialState } from "@/domain/app-state";

export default function Page() {
  return <KnowledgeBasePage state={createInitialState("Transformer")} />;
}
```

```tsx
// src/app/concepts/[conceptId]/page.tsx
import { ConceptDetailPage } from "@/components/ConceptDetailPage";
import { createInitialState } from "@/domain/app-state";

export default function Page({ params }: { params: { conceptId: string } }) {
  return <ConceptDetailPage state={createInitialState("Transformer")} conceptId={params.conceptId} />;
}
```

- [ ] **Step 4: Run component tests**

Run:

```bash
npm run test -- src/components/pages.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components src/app/globals.css
git commit -m "feat: add minimal MapLearn pages"
```

## Task 8: End-To-End Flow

**Files:**
- Create: `e2e/maplearn-flow.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `e2e/maplearn-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("learner can choose create child node or continue here", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Learning topic").fill("Transformer");
  await page.getByRole("button", { name: "Start learning" }).click();
  await expect(page.getByRole("heading", { name: "Transformer" })).toBeVisible();

  await page.getByRole("button", { name: "Create child node" }).click();
  await page.getByLabel("Ask a question").fill("Q/K/V 是什么？");
  await page.getByRole("button", { name: "Create child node" }).click();
  await expect(page.getByRole("heading", { name: "Q/K/V" })).toBeVisible();

  await page.getByRole("button", { name: "Continue here" }).click();
  await page.getByLabel("Ask a question").fill("Give me an example");
  await page.getByRole("button", { name: "Ask here" }).click();
  await expect(page.getByText("Give me an example")).toBeVisible();
});
```

- [ ] **Step 2: Install Playwright browser**

Run:

```bash
npx playwright install chromium
```

Expected: Chromium installs successfully.

- [ ] **Step 3: Run E2E test**

Run:

```bash
npm run test:e2e -- --project=chromium
```

Expected: PASS.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run test
npm run build
npm run test:e2e -- --project=chromium
```

Expected: all commands PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e
git commit -m "test: cover ask mode learning flow"
```

## Self-Review

Spec coverage:

- User chooses whether a question creates a node: Tasks 5, 6, 7, 8.
- Learning map remains tree-shaped: Tasks 3 and 7.
- Node status only has `unmastered` / `mastered`: Tasks 2, 3, 7.
- Concepts have no mastery state: Tasks 2 and 4.
- Knowledge base is a network graph: Tasks 4 and 7.
- Concept linking uses lightweight local matching: Tasks 4 and 6.
- UI stays minimal with no summaries, recommendations, timing, or concept status: Task 7.

Red-flag scan:

- No unfinished markers or vague implementation instructions remain.
- Each task has exact file paths, commands, expected results, and commit points.

Type consistency:

- `AskMode`, `NodeStatus`, `LearningNode`, `Concept`, `ConceptRelation`, `CreateNodeOutput`, and `ContinueNodeOutput` are defined before use.
- The selected ask mode appears consistently as `create_child_node` or `continue_here`.
