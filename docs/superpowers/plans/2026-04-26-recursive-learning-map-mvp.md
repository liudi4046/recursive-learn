# Recursive Learning Map MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a usable MVP where a learner starts a topic, asks recursive questions, and every question becomes a navigable node in a full-screen learning map.

**Architecture:** Build a small Next.js TypeScript app with a client-side node store for MVP session persistence and a server-side AI route for structured node generation. Keep core learning-tree behavior in pure domain modules so context scoping and node creation are testable without the UI.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, Playwright, Zod, nanoid, OpenAI Node SDK structured outputs.

---

## File Structure

- `package.json`: scripts and dependencies for Next.js, tests, and OpenAI integration.
- `tsconfig.json`: TypeScript config with `@/*` alias.
- `vitest.config.ts`: unit and component test config.
- `playwright.config.ts`: end-to-end test config.
- `src/app/layout.tsx`: root layout and metadata.
- `src/app/page.tsx`: main MVP page.
- `src/app/globals.css`: product styling.
- `src/app/api/generate-node/route.ts`: server endpoint that returns AI-generated node content.
- `src/domain/types.ts`: canonical topic, node, status, node type, and AI output types.
- `src/domain/tree.ts`: pure tree operations: create root, add child, update status, path lookup, stats.
- `src/domain/context.ts`: pure AI context builder that only includes root, ancestors, current node, and the new question.
- `src/domain/ai-schema.ts`: Zod schema for AI node output.
- `src/domain/mock-ai.ts`: deterministic mock generator for tests and local fallback.
- `src/lib/storage.ts`: browser localStorage persistence.
- `src/lib/api.ts`: client wrapper for `/api/generate-node`.
- `src/components/LearningShell.tsx`: main product shell.
- `src/components/TopicLauncher.tsx`: topic input and root creation.
- `src/components/NodeReader.tsx`: current node display and status controls.
- `src/components/QuestionComposer.tsx`: question input and quick prompts.
- `src/components/LearningMapModal.tsx`: full-screen map container.
- `src/components/LearningTree.tsx`: visual tree diagram.
- `src/components/StatsPanel.tsx`: node counts and current depth.
- `src/test/factories.ts`: reusable test fixtures.
- `src/**/*.test.ts`: unit tests.
- `src/**/*.test.tsx`: component tests.
- `e2e/learning-flow.spec.ts`: Playwright happy-path tests.
- `.env.example`: documented model and API key variables.

## Task 1: Scaffold App And Test Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Write the project files**

Create `package.json`:

```json
{
  "name": "recursive-learn",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
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
    "eslint": "latest",
    "eslint-config-next": "latest",
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
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
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
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
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
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
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
  title: "Recursive Learn",
  description: "Recursive AI learning map MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return <main>Recursive Learn MVP</main>;
}
```

Create `src/app/globals.css`:

```css
:root {
  --bg: #f7f8f5;
  --panel: #ffffff;
  --ink: #1f2933;
  --muted: #697586;
  --line: #d9dfd4;
  --green: #2f6f55;
  --green-soft: #dceee5;
  --blue: #315a8a;
  --blue-soft: #dbe7f6;
  --yellow: #f2c94c;
  --yellow-soft: #fff4cc;
  --red: #a8423f;
  --red-soft: #f7dddd;
  --shadow: 0 18px 45px rgba(31, 41, 51, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
textarea {
  font: inherit;
}
```

Create `.gitignore`:

```gitignore
.next/
node_modules/
coverage/
test-results/
playwright-report/
.env
*.log
```

Create `.env.example`:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AI_PROVIDER=mock
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and install exits with code 0.

- [ ] **Step 3: Run initial checks**

Run:

```bash
npm run test
npm run build
```

Expected: Vitest reports no tests found or exits cleanly after setup; Next build succeeds and renders the initial page.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts playwright.config.ts .gitignore .env.example src
git commit -m "chore: scaffold recursive learn app"
```

## Task 2: Domain Types And Tree Operations

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/tree.ts`
- Create: `src/test/factories.ts`
- Create: `src/domain/tree.test.ts`

- [ ] **Step 1: Write failing tree tests**

Create `src/domain/tree.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { addChildNode, createRootNode, getNodePath, getStats, updateNodeStatus } from "./tree";
import { makeTopic } from "@/test/factories";

describe("learning tree", () => {
  it("creates a root node for a topic", () => {
    const topic = makeTopic({ title: "Transformer" });
    const root = createRootNode(topic, {
      title: "Transformer",
      answer: ["Start with self-attention."],
      summary: "A root explanation for Transformer.",
      type: "concept",
      parentRelation: "Root topic",
      suggestedQuestions: ["What is self-attention?"]
    });

    expect(root.parentId).toBeNull();
    expect(root.topicId).toBe(topic.id);
    expect(root.status).toBe("learning");
    expect(root.question).toBe("I want to learn Transformer");
  });

  it("adds every user question as a child of the active node", () => {
    const topic = makeTopic({ id: "topic_1", title: "Transformer" });
    const root = createRootNode(topic, {
      title: "Transformer",
      answer: ["Root"],
      summary: "Root summary",
      type: "concept",
      parentRelation: "Root topic",
      suggestedQuestions: []
    });

    const child = addChildNode({
      parent: root,
      question: "Use an analogy",
      aiOutput: {
        title: "Use an analogy",
        answer: ["Attention is like choosing which notes to read first."],
        summary: "An analogy for attention.",
        type: "analogy",
        parentRelation: "Re-explains the parent node.",
        suggestedQuestions: []
      }
    });

    expect(child.parentId).toBe(root.id);
    expect(child.question).toBe("Use an analogy");
    expect(child.type).toBe("analogy");
  });

  it("returns only the ancestor path for a selected node", () => {
    const topic = makeTopic({ id: "topic_1", title: "Transformer" });
    const root = createRootNode(topic, {
      title: "Transformer",
      answer: ["Root"],
      summary: "Root summary",
      type: "concept",
      parentRelation: "Root topic",
      suggestedQuestions: []
    });
    const child = addChildNode({
      parent: root,
      question: "Self-attention?",
      aiOutput: {
        title: "Self-attention",
        answer: ["Child"],
        summary: "Child summary",
        type: "concept",
        parentRelation: "Explains root.",
        suggestedQuestions: []
      }
    });
    const sibling = addChildNode({
      parent: root,
      question: "Softmax?",
      aiOutput: {
        title: "Softmax",
        answer: ["Sibling"],
        summary: "Sibling summary",
        type: "why",
        parentRelation: "Explains root.",
        suggestedQuestions: []
      }
    });

    expect(getNodePath([root, child, sibling], child.id).map((node) => node.title)).toEqual([
      "Transformer",
      "Self-attention"
    ]);
  });

  it("updates status without changing content", () => {
    const topic = makeTopic({ title: "Transformer" });
    const root = createRootNode(topic, {
      title: "Transformer",
      answer: ["Root"],
      summary: "Root summary",
      type: "concept",
      parentRelation: "Root topic",
      suggestedQuestions: []
    });

    const updated = updateNodeStatus(root, "learned");

    expect(updated.status).toBe("learned");
    expect(updated.answer).toEqual(["Root"]);
  });

  it("computes learning statistics", () => {
    const topic = makeTopic({ id: "topic_1", title: "Transformer" });
    const root = createRootNode(topic, {
      title: "Transformer",
      answer: ["Root"],
      summary: "Root summary",
      type: "concept",
      parentRelation: "Root topic",
      suggestedQuestions: []
    });
    const child = updateNodeStatus(
      addChildNode({
        parent: root,
        question: "Q/K/V?",
        aiOutput: {
          title: "Q/K/V",
          answer: ["Child"],
          summary: "Child summary",
          type: "concept",
          parentRelation: "Explains attention.",
          suggestedQuestions: []
        }
      }),
      "review"
    );

    expect(getStats([root, child], child.id)).toEqual({
      total: 2,
      learned: 0,
      review: 1,
      stuck: 0,
      currentDepth: 2
    });
  });
});
```

Create `src/test/factories.ts`:

```ts
import type { Topic } from "@/domain/types";

export function makeTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: "topic_test",
    title: "Transformer",
    goal: "Understand the core ideas",
    level: "beginner",
    createdAt: "2026-04-26T00:00:00.000Z",
    updatedAt: "2026-04-26T00:00:00.000Z",
    ...overrides
  };
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/tree.test.ts
```

Expected: FAIL because `src/domain/types.ts` and `src/domain/tree.ts` do not exist.

- [ ] **Step 3: Add domain types and tree implementation**

Create `src/domain/types.ts`:

```ts
export type NodeStatus = "learning" | "learned" | "review" | "stuck";

export type LearningNodeType =
  | "concept"
  | "why"
  | "comparison"
  | "example"
  | "analogy"
  | "prerequisite"
  | "exercise"
  | "summary"
  | "simplification";

export type Topic = {
  id: string;
  title: string;
  goal: string;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  updatedAt: string;
};

export type AiNodeOutput = {
  title: string;
  type: LearningNodeType;
  answer: string[];
  summary: string;
  parentRelation: string;
  suggestedQuestions: string[];
};

export type LearningNode = {
  id: string;
  parentId: string | null;
  topicId: string;
  title: string;
  question: string;
  answer: string[];
  summary: string;
  status: NodeStatus;
  type: LearningNodeType;
  parentRelation: string;
  suggestedQuestions: string[];
  createdAt: string;
  updatedAt: string;
};

export type LearningStats = {
  total: number;
  learned: number;
  review: number;
  stuck: number;
  currentDepth: number;
};
```

Create `src/domain/tree.ts`:

```ts
import { nanoid } from "nanoid";
import type { AiNodeOutput, LearningNode, LearningStats, NodeStatus, Topic } from "./types";

function nowIso() {
  return new Date().toISOString();
}

export function createRootNode(topic: Topic, aiOutput: AiNodeOutput): LearningNode {
  const now = nowIso();
  return {
    id: `node_${nanoid(10)}`,
    parentId: null,
    topicId: topic.id,
    title: aiOutput.title,
    question: `I want to learn ${topic.title}`,
    answer: aiOutput.answer,
    summary: aiOutput.summary,
    status: "learning",
    type: aiOutput.type,
    parentRelation: aiOutput.parentRelation,
    suggestedQuestions: aiOutput.suggestedQuestions,
    createdAt: now,
    updatedAt: now
  };
}

export function addChildNode(input: {
  parent: LearningNode;
  question: string;
  aiOutput: AiNodeOutput;
}): LearningNode {
  const now = nowIso();
  return {
    id: `node_${nanoid(10)}`,
    parentId: input.parent.id,
    topicId: input.parent.topicId,
    title: input.aiOutput.title,
    question: input.question,
    answer: input.aiOutput.answer,
    summary: input.aiOutput.summary,
    status: "learning",
    type: input.aiOutput.type,
    parentRelation: input.aiOutput.parentRelation,
    suggestedQuestions: input.aiOutput.suggestedQuestions,
    createdAt: now,
    updatedAt: now
  };
}

export function updateNodeStatus(node: LearningNode, status: NodeStatus): LearningNode {
  return {
    ...node,
    status,
    updatedAt: nowIso()
  };
}

export function getNodePath(nodes: LearningNode[], nodeId: string): LearningNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const path: LearningNode[] = [];
  let cursor = byId.get(nodeId);

  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  return path;
}

export function getStats(nodes: LearningNode[], activeNodeId: string): LearningStats {
  return {
    total: nodes.length,
    learned: nodes.filter((node) => node.status === "learned").length,
    review: nodes.filter((node) => node.status === "review").length,
    stuck: nodes.filter((node) => node.status === "stuck").length,
    currentDepth: getNodePath(nodes, activeNodeId).length
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/tree.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain src/test
git commit -m "feat: add learning tree domain model"
```

## Task 3: Context Builder

**Files:**
- Create: `src/domain/context.ts`
- Create: `src/domain/context.test.ts`

- [ ] **Step 1: Write failing context tests**

Create `src/domain/context.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildAiContext } from "./context";
import { addChildNode, createRootNode } from "./tree";
import { makeTopic } from "@/test/factories";

describe("buildAiContext", () => {
  it("includes root, ancestors, current node, and question", () => {
    const topic = makeTopic({ id: "topic_1", title: "Transformer" });
    const root = createRootNode(topic, {
      title: "Transformer",
      type: "concept",
      answer: ["Root answer"],
      summary: "Root summary",
      parentRelation: "Root",
      suggestedQuestions: []
    });
    const child = addChildNode({
      parent: root,
      question: "Self-attention?",
      aiOutput: {
        title: "Self-attention",
        type: "concept",
        answer: ["Self-attention answer"],
        summary: "Self-attention summary",
        parentRelation: "Explains root",
        suggestedQuestions: []
      }
    });

    const context = buildAiContext({
      topic,
      nodes: [root, child],
      currentNodeId: child.id,
      question: "Q/K/V 是什么？"
    });

    expect(context.topicTitle).toBe("Transformer");
    expect(context.path).toEqual([
      { id: root.id, title: "Transformer", summary: "Root summary" },
      { id: child.id, title: "Self-attention", summary: "Self-attention summary" }
    ]);
    expect(context.currentNode.answer).toEqual(["Self-attention answer"]);
    expect(context.question).toBe("Q/K/V 是什么？");
  });

  it("excludes sibling and child branches by default", () => {
    const topic = makeTopic({ id: "topic_1", title: "Transformer" });
    const root = createRootNode(topic, {
      title: "Transformer",
      type: "concept",
      answer: ["Root answer"],
      summary: "Root summary",
      parentRelation: "Root",
      suggestedQuestions: []
    });
    const branchA = addChildNode({
      parent: root,
      question: "Q/K/V?",
      aiOutput: {
        title: "Q/K/V",
        type: "concept",
        answer: ["QKV answer"],
        summary: "QKV summary",
        parentRelation: "Explains attention",
        suggestedQuestions: []
      }
    });
    const branchB = addChildNode({
      parent: root,
      question: "Softmax?",
      aiOutput: {
        title: "Softmax",
        type: "why",
        answer: ["Softmax answer"],
        summary: "Softmax summary",
        parentRelation: "Explains attention",
        suggestedQuestions: []
      }
    });
    const branchAChild = addChildNode({
      parent: branchA,
      question: "Dot product?",
      aiOutput: {
        title: "Dot product",
        type: "why",
        answer: ["Dot product answer"],
        summary: "Dot product summary",
        parentRelation: "Explains QKV",
        suggestedQuestions: []
      }
    });

    const context = buildAiContext({
      topic,
      nodes: [root, branchA, branchB, branchAChild],
      currentNodeId: root.id,
      question: "为什么要 mask？"
    });

    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain("QKV summary");
    expect(serialized).not.toContain("Softmax summary");
    expect(serialized).not.toContain("Dot product summary");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/context.test.ts
```

Expected: FAIL because `buildAiContext` is not defined.

- [ ] **Step 3: Implement context builder**

Create `src/domain/context.ts`:

```ts
import { getNodePath } from "./tree";
import type { LearningNode, Topic } from "./types";

export type AiContext = {
  topicTitle: string;
  topicGoal: string;
  userLevel: Topic["level"];
  path: Array<{
    id: string;
    title: string;
    summary: string;
  }>;
  currentNode: {
    id: string;
    title: string;
    question: string;
    answer: string[];
    summary: string;
  };
  question: string;
};

export function buildAiContext(input: {
  topic: Topic;
  nodes: LearningNode[];
  currentNodeId: string;
  question: string;
}): AiContext {
  const path = getNodePath(input.nodes, input.currentNodeId);
  const currentNode = path[path.length - 1];

  if (!currentNode) {
    throw new Error(`Cannot build AI context for missing node ${input.currentNodeId}`);
  }

  return {
    topicTitle: input.topic.title,
    topicGoal: input.topic.goal,
    userLevel: input.topic.level,
    path: path.map((node) => ({
      id: node.id,
      title: node.title,
      summary: node.summary
    })),
    currentNode: {
      id: currentNode.id,
      title: currentNode.title,
      question: currentNode.question,
      answer: currentNode.answer,
      summary: currentNode.summary
    },
    question: input.question
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/context.test.ts src/domain/tree.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/context.ts src/domain/context.test.ts
git commit -m "feat: build scoped AI context from active path"
```

## Task 4: AI Output Schema And Mock Generator

**Files:**
- Create: `src/domain/ai-schema.ts`
- Create: `src/domain/mock-ai.ts`
- Create: `src/domain/ai-schema.test.ts`
- Create: `src/domain/mock-ai.test.ts`

- [ ] **Step 1: Write failing schema and mock tests**

Create `src/domain/ai-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { aiNodeOutputSchema } from "./ai-schema";

describe("aiNodeOutputSchema", () => {
  it("accepts a valid structured node output", () => {
    const parsed = aiNodeOutputSchema.parse({
      title: "Q/K/V 是什么",
      type: "concept",
      answer: ["Q、K、V 是三种向量视角。"],
      summary: "Explains Query, Key, and Value.",
      parentRelation: "Explains a subpart of self-attention.",
      suggestedQuestions: ["为什么要点乘？"]
    });

    expect(parsed.title).toBe("Q/K/V 是什么");
  });

  it("rejects missing summary", () => {
    expect(() =>
      aiNodeOutputSchema.parse({
        title: "Q/K/V 是什么",
        type: "concept",
        answer: ["Q、K、V 是三种向量视角。"],
        parentRelation: "Explains a subpart of self-attention.",
        suggestedQuestions: []
      })
    ).toThrow();
  });
});
```

Create `src/domain/mock-ai.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateMockNode } from "./mock-ai";

describe("generateMockNode", () => {
  it("creates deterministic Q/K/V content", async () => {
    const output = await generateMockNode({
      topicTitle: "Transformer",
      topicGoal: "Understand core ideas",
      userLevel: "beginner",
      path: [{ id: "node_1", title: "Self-attention", summary: "Attention summary" }],
      currentNode: {
        id: "node_1",
        title: "Self-attention",
        question: "Self-attention?",
        answer: ["Self-attention answer"],
        summary: "Attention summary"
      },
      question: "Q/K/V 是什么？"
    });

    expect(output.title).toBe("Q/K/V 是什么");
    expect(output.type).toBe("concept");
    expect(output.answer.join(" ")).toContain("Query");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/ai-schema.test.ts src/domain/mock-ai.test.ts
```

Expected: FAIL because schema and mock generator do not exist.

- [ ] **Step 3: Implement schema and deterministic mock**

Create `src/domain/ai-schema.ts`:

```ts
import { z } from "zod";

export const learningNodeTypeSchema = z.enum([
  "concept",
  "why",
  "comparison",
  "example",
  "analogy",
  "prerequisite",
  "exercise",
  "summary",
  "simplification"
]);

export const aiNodeOutputSchema = z.object({
  title: z.string().min(1),
  type: learningNodeTypeSchema,
  answer: z.array(z.string().min(1)).min(1).max(6),
  summary: z.string().min(1),
  parentRelation: z.string().min(1),
  suggestedQuestions: z.array(z.string().min(1)).max(4)
});
```

Create `src/domain/mock-ai.ts`:

```ts
import type { AiContext } from "./context";
import type { AiNodeOutput } from "./types";

export async function generateMockNode(context: AiContext): Promise<AiNodeOutput> {
  const question = context.question.toLowerCase();

  if (question.includes("q/k/v") || question.includes("query") || question.includes("key")) {
    return {
      title: "Q/K/V 是什么",
      type: "concept",
      answer: [
        "在 self-attention 里，Query、Key、Value 是同一个 token 被投影出来的三种视角。",
        "Query 像是在问：我想找什么信息？Key 像是在回答：我有什么特征？Value 是真正被取走的信息。",
        "模型用 Query 和 Key 计算相关性，再用这个相关性加权 Value。"
      ],
      summary: "Explains Query, Key, and Value as three vector roles in attention.",
      parentRelation: `Expands a detail from ${context.currentNode.title}.`,
      suggestedQuestions: ["为什么 Query 和 Key 要点乘？", "Value 为什么单独存在？"]
    };
  }

  if (question.includes("softmax")) {
    return {
      title: "Softmax 为什么有用",
      type: "why",
      answer: [
        "Softmax 会把一组分数转换成总和为 1 的权重。",
        "在 attention 中，它把原始相关性分数变成可用的关注比例。",
        "这让模型可以按比例混合多个 token 的信息。"
      ],
      summary: "Softmax converts attention scores into normalized weights.",
      parentRelation: `Explains how ${context.currentNode.title} turns scores into weights.`,
      suggestedQuestions: ["为什么要缩放 attention scores？", "不用 softmax 会怎样？"]
    };
  }

  return {
    title: context.question.replace(/[？?。.!！]/g, "").slice(0, 28) || "新的学习节点",
    type: "concept",
    answer: [
      `这个问题从「${context.currentNode.title}」延伸出来。`,
      "真实 AI 会根据当前路径和当前节点内容生成解释；mock 模式先保证节点创建和地图交互稳定。",
      `你的问题是：「${context.question}」。`
    ],
    summary: `A generated explanation for ${context.question}.`,
    parentRelation: `Extends ${context.currentNode.title}.`,
    suggestedQuestions: ["能举个例子吗？", "这个和父节点有什么关系？"]
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm run test -- src/domain/ai-schema.test.ts src/domain/mock-ai.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/ai-schema.ts src/domain/mock-ai.ts src/domain/ai-schema.test.ts src/domain/mock-ai.test.ts
git commit -m "feat: add AI node output schema and mock generator"
```

## Task 5: Client Store And Session Persistence

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`
- Create: `src/domain/session.ts`
- Create: `src/domain/session.test.ts`

- [ ] **Step 1: Write failing session and storage tests**

Create `src/domain/session.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createLearningSession, addGeneratedNodeToSession, setActiveNode, setNodeStatus } from "./session";

describe("learning session", () => {
  it("creates a session with a root node", () => {
    const session = createLearningSession("Transformer");

    expect(session.topic.title).toBe("Transformer");
    expect(session.nodes).toHaveLength(1);
    expect(session.activeNodeId).toBe(session.nodes[0].id);
  });

  it("adds generated questions below the active node", () => {
    const session = createLearningSession("Transformer");
    const next = addGeneratedNodeToSession(session, {
      question: "Q/K/V 是什么？",
      aiOutput: {
        title: "Q/K/V 是什么",
        type: "concept",
        answer: ["Answer"],
        summary: "Summary",
        parentRelation: "Explains parent",
        suggestedQuestions: []
      }
    });

    expect(next.nodes).toHaveLength(2);
    expect(next.nodes[1].parentId).toBe(session.activeNodeId);
    expect(next.activeNodeId).toBe(next.nodes[1].id);
  });

  it("can return to an earlier node before asking a sibling question", () => {
    const session = createLearningSession("Transformer");
    const branchA = addGeneratedNodeToSession(session, {
      question: "Q/K/V 是什么？",
      aiOutput: {
        title: "Q/K/V",
        type: "concept",
        answer: ["Answer"],
        summary: "Summary",
        parentRelation: "Explains parent",
        suggestedQuestions: []
      }
    });
    const rootSelected = setActiveNode(branchA, session.activeNodeId);
    const branchB = addGeneratedNodeToSession(rootSelected, {
      question: "Softmax 为什么有用？",
      aiOutput: {
        title: "Softmax",
        type: "why",
        answer: ["Answer"],
        summary: "Summary",
        parentRelation: "Explains parent",
        suggestedQuestions: []
      }
    });

    expect(branchB.nodes[1].parentId).toBe(session.activeNodeId);
    expect(branchB.nodes[2].parentId).toBe(session.activeNodeId);
  });

  it("updates a node status", () => {
    const session = createLearningSession("Transformer");
    const updated = setNodeStatus(session, session.activeNodeId, "learned");

    expect(updated.nodes[0].status).toBe("learned");
  });
});
```

Create `src/lib/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { loadSession, saveSession } from "./storage";
import { createLearningSession } from "@/domain/session";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads a learning session", () => {
    const session = createLearningSession("Transformer");
    saveSession(session);

    expect(loadSession()?.topic.title).toBe("Transformer");
  });

  it("returns null when no session exists", () => {
    expect(loadSession()).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/session.test.ts src/lib/storage.test.ts
```

Expected: FAIL because session and storage modules do not exist.

- [ ] **Step 3: Implement session and storage modules**

Create `src/domain/session.ts`:

```ts
import { nanoid } from "nanoid";
import { addChildNode, createRootNode, updateNodeStatus } from "./tree";
import type { AiNodeOutput, LearningNode, NodeStatus, Topic } from "./types";

export type LearningSession = {
  topic: Topic;
  nodes: LearningNode[];
  activeNodeId: string;
};

const rootOutput: AiNodeOutput = {
  title: "Transformer",
  type: "concept",
  answer: [
    "这个主题会从整体图景开始，再沿着你不懂的概念向下展开。",
    "每一次提问都会成为学习地图上的一个节点。",
    "你可以从任何节点继续提问，系统只会使用当前路径作为默认上下文。"
  ],
  summary: "Root explanation for a new learning topic.",
  parentRelation: "Root topic",
  suggestedQuestions: ["核心概念是什么？", "需要哪些前置知识？"]
};

export function createLearningSession(topicTitle: string): LearningSession {
  const now = new Date().toISOString();
  const topic: Topic = {
    id: `topic_${nanoid(10)}`,
    title: topicTitle,
    goal: "Understand the core ideas",
    level: "beginner",
    createdAt: now,
    updatedAt: now
  };
  const root = createRootNode(topic, { ...rootOutput, title: topicTitle });
  return {
    topic,
    nodes: [root],
    activeNodeId: root.id
  };
}

export function addGeneratedNodeToSession(
  session: LearningSession,
  input: { question: string; aiOutput: AiNodeOutput }
): LearningSession {
  const parent = session.nodes.find((node) => node.id === session.activeNodeId);
  if (!parent) {
    throw new Error(`Active node ${session.activeNodeId} is missing`);
  }
  const child = addChildNode({ parent, question: input.question, aiOutput: input.aiOutput });
  return {
    ...session,
    nodes: [...session.nodes, child],
    activeNodeId: child.id
  };
}

export function setActiveNode(session: LearningSession, nodeId: string): LearningSession {
  if (!session.nodes.some((node) => node.id === nodeId)) {
    throw new Error(`Cannot activate missing node ${nodeId}`);
  }
  return {
    ...session,
    activeNodeId: nodeId
  };
}

export function setNodeStatus(
  session: LearningSession,
  nodeId: string,
  status: NodeStatus
): LearningSession {
  return {
    ...session,
    nodes: session.nodes.map((node) => (node.id === nodeId ? updateNodeStatus(node, status) : node))
  };
}
```

Create `src/lib/storage.ts`:

```ts
import type { LearningSession } from "@/domain/session";

const STORAGE_KEY = "recursive-learn.session.v1";

export function saveSession(session: LearningSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): LearningSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as LearningSession;
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm run test -- src/domain/session.test.ts src/lib/storage.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/session.ts src/domain/session.test.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add learning session persistence"
```

## Task 6: AI Generation API Route

**Files:**
- Create: `src/app/api/generate-node/route.ts`
- Create: `src/lib/api.ts`
- Create: `src/app/api/generate-node/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Create `src/app/api/generate-node/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { createLearningSession } from "@/domain/session";

describe("POST /api/generate-node", () => {
  it("returns structured AI node output from scoped context", async () => {
    const session = createLearningSession("Transformer");
    const response = await POST(
      new Request("http://localhost/api/generate-node", {
        method: "POST",
        body: JSON.stringify({
          topic: session.topic,
          nodes: session.nodes,
          currentNodeId: session.activeNodeId,
          question: "Q/K/V 是什么？"
        })
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.title).toBe("Q/K/V 是什么");
    expect(body.answer.length).toBeGreaterThan(0);
  });

  it("returns 400 for empty questions", async () => {
    const session = createLearningSession("Transformer");
    const response = await POST(
      new Request("http://localhost/api/generate-node", {
        method: "POST",
        body: JSON.stringify({
          topic: session.topic,
          nodes: session.nodes,
          currentNodeId: session.activeNodeId,
          question: ""
        })
      })
    );

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/app/api/generate-node/route.test.ts
```

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement route and client wrapper**

Create `src/app/api/generate-node/route.ts`:

```ts
import { NextResponse } from "next/server";
import { buildAiContext } from "@/domain/context";
import { generateMockNode } from "@/domain/mock-ai";
import { aiNodeOutputSchema } from "@/domain/ai-schema";
import type { LearningNode, Topic } from "@/domain/types";

type GenerateNodeRequest = {
  topic: Topic;
  nodes: LearningNode[];
  currentNodeId: string;
  question: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateNodeRequest;
  const question = body.question.trim();

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const context = buildAiContext({
    topic: body.topic,
    nodes: body.nodes,
    currentNodeId: body.currentNodeId,
    question
  });

  const output = await generateMockNode(context);
  const parsed = aiNodeOutputSchema.parse(output);

  return NextResponse.json(parsed);
}
```

Create `src/lib/api.ts`:

```ts
import { aiNodeOutputSchema } from "@/domain/ai-schema";
import type { LearningSession } from "@/domain/session";
import type { AiNodeOutput } from "@/domain/types";

export async function generateNode(session: LearningSession, question: string): Promise<AiNodeOutput> {
  const response = await fetch("/api/generate-node", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: session.topic,
      nodes: session.nodes,
      currentNodeId: session.activeNodeId,
      question
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate node: ${response.status}`);
  }

  return aiNodeOutputSchema.parse(await response.json());
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm run test -- src/app/api/generate-node/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/generate-node src/lib/api.ts
git commit -m "feat: add node generation API"
```

## Task 7: Main Learning UI

**Files:**
- Create: `src/components/TopicLauncher.tsx`
- Create: `src/components/NodeReader.tsx`
- Create: `src/components/QuestionComposer.tsx`
- Create: `src/components/StatsPanel.tsx`
- Create: `src/components/LearningShell.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/LearningShell.test.tsx`

- [ ] **Step 1: Write failing component test**

Create `src/components/LearningShell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LearningShell } from "./LearningShell";

vi.mock("@/lib/api", () => ({
  generateNode: vi.fn(async () => ({
    title: "Q/K/V 是什么",
    type: "concept",
    answer: ["Q、K、V 是 attention 中的三组向量。"],
    summary: "Explains Q/K/V.",
    parentRelation: "Explains self-attention.",
    suggestedQuestions: ["为什么要点乘？"]
  }))
}));

describe("LearningShell", () => {
  it("starts a topic and creates a child node for every question", async () => {
    const user = userEvent.setup();
    render(<LearningShell />);

    await user.clear(screen.getByLabelText("学习主题"));
    await user.type(screen.getByLabelText("学习主题"), "Transformer");
    await user.click(screen.getByRole("button", { name: "开始学习" }));

    expect(screen.getByRole("heading", { name: "Transformer" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("输入你的问题"), "Q/K/V 是什么？");
    await user.click(screen.getByRole("button", { name: "提问并记录" }));

    expect(await screen.findByRole("heading", { name: "Q/K/V 是什么" })).toBeInTheDocument();
    expect(screen.getByText("节点总数")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/components/LearningShell.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement main UI components**

Create `src/components/TopicLauncher.tsx`:

```tsx
"use client";

export function TopicLauncher({
  topic,
  onTopicChange,
  onStart
}: {
  topic: string;
  onTopicChange: (topic: string) => void;
  onStart: () => void;
}) {
  return (
    <form
      className="topic-form"
      onSubmit={(event) => {
        event.preventDefault();
        onStart();
      }}
    >
      <label>
        学习主题
        <input value={topic} onChange={(event) => onTopicChange(event.target.value)} />
      </label>
      <button className="btn primary" type="submit">
        开始学习
      </button>
    </form>
  );
}
```

Create `src/components/NodeReader.tsx`:

```tsx
"use client";

import type { LearningNode, NodeStatus } from "@/domain/types";

const statusLabels: Record<NodeStatus, string> = {
  learning: "学习中",
  learned: "已学会",
  review: "待复习",
  stuck: "还不懂"
};

export function NodeReader({
  node,
  breadcrumb,
  onStatusChange
}: {
  node: LearningNode;
  breadcrumb: string;
  onStatusChange: (status: NodeStatus) => void;
}) {
  return (
    <section className="reader">
      <div className="reader-header">
        <div>
          <p className="breadcrumb">{breadcrumb}</p>
          <h1>{node.title}</h1>
        </div>
        <div className="status-actions">
          <button className="btn secondary" onClick={() => onStatusChange("learned")}>学会了</button>
          <button className="btn secondary" onClick={() => onStatusChange("review")}>待复习</button>
          <button className="btn secondary" onClick={() => onStatusChange("stuck")}>还不懂</button>
        </div>
      </div>
      <article className="node-card">
        <div className={`pill ${node.status}`}>{statusLabels[node.status]}</div>
        <div className="answer">
          {node.answer.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="callout">{node.parentRelation}</div>
      </article>
    </section>
  );
}
```

Create `src/components/QuestionComposer.tsx`:

```tsx
"use client";

import { useState } from "react";

const quickPrompts = ["用一个生活类比解释", "给我一个具体例子", "我缺什么前置知识", "给我一道小练习"];

export function QuestionComposer({
  disabled,
  onAsk
}: {
  disabled: boolean;
  onAsk: (question: string) => Promise<void>;
}) {
  const [question, setQuestion] = useState("");

  async function submit(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;
    await onAsk(trimmed);
    setQuestion("");
  }

  return (
    <section className="composer">
      <h2>追问当前节点</h2>
      <label>
        输入你的问题
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
      </label>
      <button className="btn primary" disabled={disabled} onClick={() => submit(question)}>
        {disabled ? "生成中..." : "提问并记录"}
      </button>
      <div className="quick-prompts">
        {quickPrompts.map((prompt) => (
          <button className="btn secondary" disabled={disabled} key={prompt} onClick={() => submit(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
```

Create `src/components/StatsPanel.tsx`:

```tsx
"use client";

import type { LearningStats } from "@/domain/types";

export function StatsPanel({ stats }: { stats: LearningStats }) {
  return (
    <section className="stats">
      <h2>本轮足迹</h2>
      <dl>
        <div><dt>节点总数</dt><dd>{stats.total}</dd></div>
        <div><dt>已学会</dt><dd>{stats.learned}</dd></div>
        <div><dt>待复习</dt><dd>{stats.review}</dd></div>
        <div><dt>当前深度</dt><dd>{stats.currentDepth}</dd></div>
      </dl>
    </section>
  );
}
```

Create `src/components/LearningShell.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getNodePath, getStats } from "@/domain/tree";
import { addGeneratedNodeToSession, createLearningSession, setNodeStatus, type LearningSession } from "@/domain/session";
import type { NodeStatus } from "@/domain/types";
import { generateNode } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/storage";
import { NodeReader } from "./NodeReader";
import { QuestionComposer } from "./QuestionComposer";
import { StatsPanel } from "./StatsPanel";
import { TopicLauncher } from "./TopicLauncher";

export function LearningShell() {
  const [topic, setTopic] = useState("Transformer");
  const [session, setSession] = useState<LearningSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadSession();
    if (stored) setSession(stored);
  }, []);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  const activeNode = session?.nodes.find((node) => node.id === session.activeNodeId) ?? null;
  const path = session && activeNode ? getNodePath(session.nodes, activeNode.id) : [];
  const stats = session && activeNode ? getStats(session.nodes, activeNode.id) : null;

  const breadcrumb = useMemo(() => path.map((node) => node.title).join(" / "), [path]);

  function start() {
    const next = createLearningSession(topic.trim() || "新的学习主题");
    setSession(next);
    setError(null);
  }

  async function ask(question: string) {
    if (!session) return;
    setIsGenerating(true);
    setError(null);
    try {
      const aiOutput = await generateNode(session, question);
      setSession(addGeneratedNodeToSession(session, { question, aiOutput }));
    } catch {
      setError("生成失败，请重试。");
    } finally {
      setIsGenerating(false);
    }
  }

  function changeStatus(status: NodeStatus) {
    if (!session || !activeNode) return;
    setSession(setNodeStatus(session, activeNode.id, status));
  }

  if (!session || !activeNode || !stats) {
    return (
      <main className="empty-shell">
        <div className="brand-mark">R</div>
        <h1>Recursive Learn</h1>
        <p>把每一次不懂变成一张可回看的学习地图。</p>
        <TopicLauncher topic={topic} onTopicChange={setTopic} onStart={start} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <strong>Recursive Learn</strong>
          <span>{session.topic.title}</span>
        </div>
        <button className="btn primary" type="button">打开学习地图</button>
      </header>
      <div className="main-grid">
        <NodeReader node={activeNode} breadcrumb={breadcrumb} onStatusChange={changeStatus} />
        <aside className="side-panel">
          <QuestionComposer disabled={isGenerating} onAsk={ask} />
          {error ? <p className="error">{error}</p> : null}
          <StatsPanel stats={stats} />
        </aside>
      </div>
    </main>
  );
}
```

Modify `src/app/page.tsx`:

```tsx
import { LearningShell } from "@/components/LearningShell";

export default function HomePage() {
  return <LearningShell />;
}
```

Append these styles to `src/app/globals.css`:

```css
.btn {
  min-height: 40px;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 0 14px;
  cursor: pointer;
}

.btn.primary {
  background: var(--green);
  color: white;
}

.btn.secondary {
  background: white;
  color: var(--ink);
  border-color: var(--line);
}

.empty-shell {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
}

.brand-mark {
  width: 44px;
  height: 44px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white;
  font-weight: 800;
}

.topic-form {
  display: grid;
  grid-template-columns: minmax(220px, 420px) auto;
  gap: 10px;
}

label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: 13px;
  text-align: left;
}

input,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 11px;
  color: var(--ink);
  background: white;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  min-height: 72px;
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
  background: #fbfcf8;
}

.topbar div {
  display: grid;
  gap: 3px;
}

.topbar span {
  color: var(--muted);
  font-size: 13px;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
}

.reader,
.side-panel {
  padding: 24px;
}

.side-panel {
  min-height: calc(100vh - 72px);
  border-left: 1px solid var(--line);
  background: #fbfcf8;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.breadcrumb {
  color: var(--muted);
  margin: 0 0 8px;
}

.reader h1 {
  margin: 0;
  font-size: 34px;
  letter-spacing: 0;
}

.status-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-content: flex-start;
}

.node-card,
.composer,
.stats {
  background: white;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 20px;
}

.answer {
  line-height: 1.78;
}

.pill {
  display: inline-flex;
  margin-bottom: 14px;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  background: var(--blue-soft);
  color: var(--blue);
}

.pill.learned {
  color: var(--green);
  background: var(--green-soft);
}

.pill.review {
  color: #8a6a00;
  background: var(--yellow-soft);
}

.pill.stuck {
  color: var(--red);
  background: var(--red-soft);
}

.callout {
  margin-top: 18px;
  padding: 14px;
  border-radius: 8px;
  background: var(--blue-soft);
  color: #25486f;
}

.composer {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
}

.composer h2,
.stats h2 {
  margin: 0;
  font-size: 16px;
}

.quick-prompts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stats dl {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
}

.stats div {
  display: flex;
  justify-content: space-between;
}

.stats dt {
  color: var(--muted);
}

.stats dd {
  margin: 0;
  font-weight: 700;
}

.error {
  color: var(--red);
}

@media (max-width: 860px) {
  .topic-form,
  .main-grid {
    grid-template-columns: 1fr;
  }

  .side-panel {
    min-height: auto;
    border-left: 0;
    border-top: 1px solid var(--line);
  }

  .reader-header {
    display: block;
  }

  .status-actions {
    margin-top: 14px;
  }
}
```

- [ ] **Step 4: Run component test**

Run:

```bash
npm run test -- src/components/LearningShell.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app src/components
git commit -m "feat: build main recursive learning UI"
```

## Task 8: Full-Screen Learning Map

**Files:**
- Create: `src/components/LearningTree.tsx`
- Create: `src/components/LearningMapModal.tsx`
- Modify: `src/components/LearningShell.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/LearningMapModal.test.tsx`

- [ ] **Step 1: Write failing map test**

Create `src/components/LearningMapModal.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LearningMapModal } from "./LearningMapModal";
import { addGeneratedNodeToSession, createLearningSession } from "@/domain/session";

describe("LearningMapModal", () => {
  it("shows the tree and navigates when a node is clicked", async () => {
    const user = userEvent.setup();
    const session = addGeneratedNodeToSession(createLearningSession("Transformer"), {
      question: "Q/K/V 是什么？",
      aiOutput: {
        title: "Q/K/V 是什么",
        type: "concept",
        answer: ["Answer"],
        summary: "Summary",
        parentRelation: "Explains parent",
        suggestedQuestions: []
      }
    });
    const onSelect = vi.fn();

    render(
      <LearningMapModal
        open
        session={session}
        onClose={() => undefined}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByRole("button", { name: "Transformer" }));

    expect(onSelect).toHaveBeenCalledWith(session.nodes[0].id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/components/LearningMapModal.test.tsx
```

Expected: FAIL because map components do not exist.

- [ ] **Step 3: Implement map components and wire shell**

Create `src/components/LearningTree.tsx`:

```tsx
"use client";

import type { LearningNode } from "@/domain/types";

function childrenOf(nodes: LearningNode[], parentId: string | null) {
  return nodes.filter((node) => node.parentId === parentId);
}

export function LearningTree({
  nodes,
  activeNodeId,
  parentId = null,
  onSelect
}: {
  nodes: LearningNode[];
  activeNodeId: string;
  parentId?: string | null;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <ul className={parentId === null ? "diagram-tree" : undefined}>
      {childrenOf(nodes, parentId).map((node) => (
        <li className="map-node" key={node.id}>
          <button
            className={`map-node-button ${node.status} ${node.id === activeNodeId ? "active" : ""}`}
            onClick={() => onSelect(node.id)}
          >
            <span className="map-dot" />
            <span>{node.title}</span>
          </button>
          {childrenOf(nodes, node.id).length > 0 ? (
            <LearningTree nodes={nodes} activeNodeId={activeNodeId} parentId={node.id} onSelect={onSelect} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
```

Create `src/components/LearningMapModal.tsx`:

```tsx
"use client";

import { LearningTree } from "./LearningTree";
import type { LearningSession } from "@/domain/session";

export function LearningMapModal({
  open,
  session,
  onClose,
  onSelect
}: {
  open: boolean;
  session: LearningSession;
  onClose: () => void;
  onSelect: (nodeId: string) => void;
}) {
  if (!open) return null;

  return (
    <section className="map-screen" aria-label="全屏学习地图">
      <header className="map-header">
        <div>
          <p>思考足迹</p>
          <h2>{session.topic.title} 学习地图</h2>
        </div>
        <button className="btn primary" onClick={onClose}>回到学习</button>
      </header>
      <div className="diagram-wrap">
        <div className="diagram-panel">
          <LearningTree
            nodes={session.nodes}
            activeNodeId={session.activeNodeId}
            onSelect={(nodeId) => {
              onSelect(nodeId);
              onClose();
            }}
          />
        </div>
      </div>
    </section>
  );
}
```

Modify `src/components/LearningShell.tsx` by importing map components and `setActiveNode`, adding state, and replacing the topbar button:

```tsx
import { addGeneratedNodeToSession, createLearningSession, setActiveNode, setNodeStatus, type LearningSession } from "@/domain/session";
import { LearningMapModal } from "./LearningMapModal";
```

Inside `LearningShell` state:

```tsx
const [mapOpen, setMapOpen] = useState(false);
```

Replace the topbar button:

```tsx
<button className="btn primary" type="button" onClick={() => setMapOpen(true)}>
  打开学习地图
</button>
```

Render the modal before `</main>`:

```tsx
<LearningMapModal
  open={mapOpen}
  session={session}
  onClose={() => setMapOpen(false)}
  onSelect={(nodeId) => setSession(setActiveNode(session, nodeId))}
/>
```

Append map styles to `src/app/globals.css`:

```css
.map-screen {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: linear-gradient(180deg, rgba(247, 248, 245, 0.98), rgba(238, 243, 236, 0.98));
}

.map-header {
  padding: 22px 28px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(251, 252, 248, 0.94);
}

.map-header p {
  margin: 0 0 5px;
  color: var(--muted);
}

.map-header h2 {
  margin: 0;
  font-size: 28px;
}

.diagram-wrap {
  overflow: auto;
  padding: 28px;
}

.diagram-panel {
  min-height: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(rgba(49, 90, 138, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(49, 90, 138, 0.05) 1px, transparent 1px),
    #ffffff;
  background-size: 28px 28px;
  box-shadow: var(--shadow);
}

.diagram-tree,
.diagram-tree ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.diagram-tree {
  display: flex;
  justify-content: center;
  min-width: max-content;
  padding: 28px 32px 42px;
}

.diagram-tree ul {
  display: flex;
  justify-content: center;
  padding-top: 34px;
  position: relative;
}

.diagram-tree ul::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 34px;
  background: var(--line);
}

.map-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
  position: relative;
}

.map-node-button {
  width: 210px;
  min-height: 54px;
  border: 1px solid rgba(217, 223, 212, 0.9);
  border-radius: 8px;
  background: white;
  color: var(--ink);
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  text-align: left;
  padding: 12px 14px;
  box-shadow: 0 12px 30px rgba(31, 41, 51, 0.09);
  cursor: pointer;
}

.map-node-button.active {
  background: var(--green-soft);
  outline: 1px solid rgba(47, 111, 85, 0.28);
}

.map-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--blue);
}

.map-node-button.learned .map-dot {
  background: var(--green);
}

.map-node-button.review .map-dot {
  background: var(--yellow);
}

.map-node-button.stuck .map-dot {
  background: var(--red);
}
```

- [ ] **Step 4: Run map and shell tests**

Run:

```bash
npm run test -- src/components/LearningMapModal.test.tsx src/components/LearningShell.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components src/app/globals.css
git commit -m "feat: add full-screen learning map"
```

## Task 9: OpenAI Structured Output Adapter

**Files:**
- Create: `src/domain/openai-ai.ts`
- Modify: `src/app/api/generate-node/route.ts`
- Create: `src/domain/openai-ai.test.ts`

Reference: OpenAI's official Structured Outputs guide shows `openai.responses.parse` with `text.format: zodTextFormat(schema, name)` for JavaScript structured outputs.

- [ ] **Step 1: Write adapter selection test**

Create `src/domain/openai-ai.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildPromptMessages } from "./openai-ai";

describe("buildPromptMessages", () => {
  it("serializes only scoped context into the prompt", () => {
    const messages = buildPromptMessages({
      topicTitle: "Transformer",
      topicGoal: "Understand core ideas",
      userLevel: "beginner",
      path: [
        { id: "root", title: "Transformer", summary: "Root summary" },
        { id: "attention", title: "Self-attention", summary: "Attention summary" }
      ],
      currentNode: {
        id: "attention",
        title: "Self-attention",
        question: "Self-attention?",
        answer: ["Current answer"],
        summary: "Attention summary"
      },
      question: "Q/K/V 是什么？"
    });

    expect(messages[0].role).toBe("system");
    expect(messages[1].content).toContain("Self-attention");
    expect(messages[1].content).toContain("Q/K/V 是什么？");
    expect(messages[1].content).not.toContain("sibling");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/openai-ai.test.ts
```

Expected: FAIL because `openai-ai.ts` does not exist.

- [ ] **Step 3: Implement OpenAI adapter**

Create `src/domain/openai-ai.ts`:

```ts
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { aiNodeOutputSchema } from "./ai-schema";
import type { AiContext } from "./context";
import type { AiNodeOutput } from "./types";

export function buildPromptMessages(context: AiContext) {
  return [
    {
      role: "system" as const,
      content:
        "You are a recursive learning assistant. Generate one new learning node from the user's current node and question. Return concise Chinese learning content."
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          topicTitle: context.topicTitle,
          topicGoal: context.topicGoal,
          userLevel: context.userLevel,
          currentPath: context.path,
          currentNode: context.currentNode,
          userQuestion: context.question,
          rules: [
            "Every user question becomes a new node.",
            "Use only the provided current path and current node as context.",
            "Do not assume sibling or child branches are available."
          ]
        },
        null,
        2
      )
    }
  ];
}

export async function generateOpenAiNode(context: AiContext): Promise<AiNodeOutput> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: buildPromptMessages(context),
    text: {
      format: zodTextFormat(aiNodeOutputSchema, "learning_node")
    }
  });

  return aiNodeOutputSchema.parse(response.output_parsed);
}
```

Modify `src/app/api/generate-node/route.ts`:

```ts
import { NextResponse } from "next/server";
import { buildAiContext } from "@/domain/context";
import { generateMockNode } from "@/domain/mock-ai";
import { generateOpenAiNode } from "@/domain/openai-ai";
import { aiNodeOutputSchema } from "@/domain/ai-schema";
import type { LearningNode, Topic } from "@/domain/types";

type GenerateNodeRequest = {
  topic: Topic;
  nodes: LearningNode[];
  currentNodeId: string;
  question: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateNodeRequest;
  const question = body.question.trim();

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const context = buildAiContext({
    topic: body.topic,
    nodes: body.nodes,
    currentNodeId: body.currentNodeId,
    question
  });

  const provider = process.env.AI_PROVIDER || "mock";
  const output = provider === "openai" ? await generateOpenAiNode(context) : await generateMockNode(context);
  const parsed = aiNodeOutputSchema.parse(output);

  return NextResponse.json(parsed);
}
```

- [ ] **Step 4: Run unit and route tests**

Run:

```bash
npm run test -- src/domain/openai-ai.test.ts src/app/api/generate-node/route.test.ts
```

Expected: PASS with `AI_PROVIDER` unset because the route uses mock mode by default.

- [ ] **Step 5: Commit**

```bash
git add src/domain/openai-ai.ts src/domain/openai-ai.test.ts src/app/api/generate-node/route.ts
git commit -m "feat: add OpenAI structured node adapter"
```

## Task 10: End-To-End Learning Flow

**Files:**
- Create: `e2e/learning-flow.spec.ts`
- Modify: `package.json` if Playwright install script needs browser setup notes.

- [ ] **Step 1: Write E2E test**

Create `e2e/learning-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("user creates recursive branches and navigates map", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("学习主题").fill("Transformer");
  await page.getByRole("button", { name: "开始学习" }).click();

  await expect(page.getByRole("heading", { name: "Transformer" })).toBeVisible();

  await page.getByLabel("输入你的问题").fill("Q/K/V 是什么？");
  await page.getByRole("button", { name: "提问并记录" }).click();
  await expect(page.getByRole("heading", { name: "Q/K/V 是什么" })).toBeVisible();

  await page.getByRole("button", { name: "打开学习地图" }).click();
  await expect(page.getByRole("region", { name: "全屏学习地图" })).toBeVisible();
  await page.getByRole("button", { name: "Transformer" }).click();

  await expect(page.getByRole("heading", { name: "Transformer" })).toBeVisible();

  await page.getByLabel("输入你的问题").fill("softmax 为什么有用？");
  await page.getByRole("button", { name: "提问并记录" }).click();
  await expect(page.getByRole("heading", { name: "Softmax 为什么有用" })).toBeVisible();
});
```

- [ ] **Step 2: Install Playwright browsers**

Run:

```bash
npx playwright install chromium
```

Expected: Chromium browser dependencies install successfully.

- [ ] **Step 3: Run E2E test**

Run:

```bash
npm run test:e2e -- --project=chromium
```

Expected: PASS. The test proves that returning to depth 1 and asking another question creates a sibling branch instead of continuing from the previous depth 2 node.

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
git add e2e package.json package-lock.json
git commit -m "test: cover recursive learning flow"
```

## Task 11: README And MVP Usage Notes

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```md
# Recursive Learn

Recursive Learn is an MVP for node-based AI learning. A user enters a topic, reads the current node, asks a question, and every question becomes a child node in a full-screen learning map.

## MVP Behavior

- Every question creates a new node.
- The active node determines where the next node attaches.
- The AI context uses the root-to-current path, not the whole tree.
- The map opens as a full-screen diagram.
- Clicking a map node changes the active learning context.

## Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Tests

```bash
npm run test
npm run build
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

## AI Provider

Mock AI is the default.

To use OpenAI structured outputs:

```bash
cp .env.example .env
```

Set:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

Server-side generation uses structured output validation before the node is saved.
```

- [ ] **Step 2: Verify README commands**

Run:

```bash
npm run test
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add MVP usage notes"
```

## Self-Review

Spec coverage:

- Topic input: Task 7.
- Root node generation: Tasks 2, 5, 7.
- Every question creates a node: Tasks 2, 5, 7, 10.
- Full-screen map: Task 8.
- Clickable map nodes: Task 8 and Task 10.
- Node status marking: Tasks 2 and 7.
- Basic statistics: Tasks 2 and 7.
- Session persistence: Task 5.
- Context scoped to current path: Task 3 and Task 9.
- Structured AI output: Task 4, Task 6, Task 9.
- Error handling: Task 7 covers UI error display; Task 6 covers empty question errors; invalid AI output is handled by Zod validation.

Red-flag scan:

- No unfinished markers or open-ended "add appropriate" instructions.
- Each code-changing step includes concrete code.
- Each verification step includes a command and expected result.

Type consistency:

- `NodeStatus`, `LearningNodeType`, `AiNodeOutput`, `LearningNode`, and `LearningSession` are introduced before use.
- `buildAiContext`, `generateMockNode`, `generateOpenAiNode`, and `generateNode` signatures stay consistent across tasks.
- `setActiveNode` is introduced in Task 5 before map navigation uses it in Task 8.
