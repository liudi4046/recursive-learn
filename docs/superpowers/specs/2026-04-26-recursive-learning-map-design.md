# Recursive Learning Network MVP Design

## Summary

MapLearn is a recursive AI learning workspace. A learner starts from a topic, reads an AI-generated node, and asks follow-up questions. For each question, the learner chooses whether to create a new child node in the topic learning map or continue the current node without changing the map.

The product has two complementary structures:

- Topic learning maps are tree-shaped paths of learning nodes.
- The knowledge base is a network of reusable concepts across topics.

The MVP should feel like a calm personal knowledge workspace, not a course dashboard.

## Product Principles

- The user controls whether a question creates a node.
- Learning nodes form a tree under a topic.
- Learning node state has only two values: `unmastered` and `mastered`.
- Concepts do not have mastery state.
- Concepts are neutral knowledge entities connected in a network.
- The knowledge base must visually show a concept network, not only cards or lists.
- UI should stay quiet: no learning duration, session summary, streaks, timelines, heavy stats, or recommendation clutter.
- AI context is built from the selected node and relevant concepts, not from the entire history.

## Core Objects

### Topic

A Topic is a learning entry point such as `Transformer`, `BERT`, `Probability Theory`, or `Product Design`.

A Topic owns one learning tree.

```ts
type Topic = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};
```

### LearningNode

A LearningNode is a concrete learning unit inside a topic tree. It may come from a root topic, a user question that creates a child node, or a user question that continues the current node.

Only child-node questions create new LearningNode records. Continue-here questions append an exchange to the active node.

```ts
type NodeStatus = "unmastered" | "mastered";

type LearningNode = {
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

type NodeContentBlock = {
  id: string;
  question: string | null;
  answer: string;
  createdAt: string;
};
```

### Concept

A Concept is a reusable knowledge entity across topics. Concepts do not have `mastered` or `unmastered` state.

```ts
type Concept = {
  id: string;
  name: string;
  description: string | null;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
};
```

### ConceptRelation

A ConceptRelation connects concepts in the knowledge base network.

```ts
type ConceptRelation = {
  id: string;
  sourceConceptId: string;
  targetConceptId: string;
  label: "related" | "part_of" | "uses" | "used_by";
};
```

### LearningNodeConceptLink

A LearningNodeConceptLink records that a node is evidence of a concept appearing in a specific learning context.

```ts
type LearningNodeConceptLink = {
  nodeId: string;
  conceptId: string;
  confidence: "auto" | "confirmed";
};
```

## Concept Linking

When AI generates a child node or continues the current node, the system may infer a concept candidate.

Concept linking should be lightweight:

1. Generate or extract a candidate concept name from the node title, question, or AI response.
2. Search existing concepts locally by normalized name, alias, and optional embedding similarity.
3. Link to a high-confidence match.
4. Create a new Concept when no strong match exists.
5. Keep uncertain cases as auto-linked so future merge and confirmation tools can refine them.

The system must not send the full knowledge base to the model. If AI is used for disambiguation, only a small candidate set, such as top 3 concepts, should be included.

## AI Behavior

### Create Child Node

Input:

- Current topic.
- Path from root to active node.
- Active node content.
- User question.
- Small related concept context when available.

Output:

```ts
type CreateNodeOutput = {
  title: string;
  answer: string;
  conceptCandidate: string | null;
  relatedConceptCandidates: Array<{
    name: string;
    relation: "related" | "part_of" | "uses" | "used_by";
  }>;
};
```

The system creates a new child LearningNode and optionally links or creates Concepts.

### Continue Here

Input:

- Current topic.
- Path from root to active node.
- Active node content.
- User question.
- Small related concept context when available.

Output:

```ts
type ContinueNodeOutput = {
  answer: string;
  conceptCandidate: string | null;
  relatedConceptCandidates: Array<{
    name: string;
    relation: "related" | "part_of" | "uses" | "used_by";
  }>;
};
```

The system appends a content block to the active node. It does not create a new LearningNode and does not change the topic tree shape.

## Pages

### 1. Homepage

Purpose: start learning quickly.

Content:

- MapLearn logo.
- Top navigation: Learning Map, Knowledge Base, Search, Account.
- Headline: `Turn your questions into a learning map.`
- Short subtitle.
- Topic input.
- `Start learning` button.
- Visual preview of a tree-shaped learning map.

Exclude:

- Pricing.
- Templates.
- Course marketing blocks.
- Learning time or progress metrics.

### 2. Node Detail Page

Purpose: primary reading and questioning page.

Content:

- Breadcrumb path.
- Node title.
- Two-state node status toggle: `Unmastered` / `Mastered`.
- Main node content.
- Question input.
- A lightweight segmented control:
  - `Create child node`
  - `Continue here`
- Primary action matching the selected mode.
- Right-side compact learning map preview.
- `Open full map` button.

Behavior:

- `Create child node` creates a new child node and navigates to it.
- `Continue here` appends the AI answer to the current node and stays on the same node.

Exclude:

- One-sentence summary.
- Recommended next questions.
- Node ID.
- Created time.
- Session statistics.
- Concept mastery status.
- Excess tags.

### 3. Learning Map Page

Purpose: show a topic's tree-shaped learning path.

Content:

- Topic title.
- Node search.
- Status filter: All / Unmastered / Mastered.
- Dot-grid map canvas.
- Tree layout with parent-child connectors.
- Selected-node side panel.

Node card content:

- Node title.
- Node status.

Selected-node side panel:

- Node title.
- Status toggle.
- Parent node.
- Child node count.
- `Open node` button.
- Optional linked concept name.

The learning map must stay tree-shaped. Cross-topic concept relationships belong in the Knowledge Base.

### 4. Knowledge Base Page

Purpose: show the user's cross-topic concept network.

Content:

- Page title: Knowledge Base.
- Search concepts.
- Concept network canvas as the main surface.
- Concepts as graph nodes.
- Labeled relationship lines such as `uses`, `part of`, `related`, and `used by`.
- Selected-concept side panel.
- Optional mini-map or zoom controls.

Selected-concept side panel:

- Concept name.
- Appears-in-topics count.
- Linked-learning-nodes count.
- Related concept list with relation labels.
- `Open concept` button.

Exclude:

- Concept mastery state.
- Concept status badges.
- Card-only knowledge base layout.
- Heavy analytics.

### 5. Concept Detail Page

Purpose: show one concept's cross-topic context.

Content:

- Back to Knowledge Base.
- Concept name.
- Short description.
- Appears in topics.
- Linked learning nodes with full paths.
- Related concepts.
- Local network preview centered on the concept.
- Basic metadata such as aliases can appear in a quiet side panel.

Exclude:

- Mastered / unmastered controls.
- Progress metrics.
- Learning duration.
- Session summary.

## Search

Search can be a simple global surface for:

- Topics.
- Learning nodes.
- Concepts.

Results should be grouped by type. MVP search can be keyword-based.

## Context Strategy

When the user asks from a node, AI receives:

- Current Topic.
- Path from root to active node.
- Active node content.
- User question.
- Small related concept context when available.
- User-selected mode: `create_child_node` or `continue_here`.

AI does not receive by default:

- Entire topic tree.
- Full knowledge base.
- Sibling branches.
- Other topics.
- All historical questions.

## MVP Scope

Includes:

- Homepage.
- Node detail page.
- Learning map page.
- Knowledge base network page.
- Concept detail page.
- Topic creation.
- Root node creation.
- Create-child-node mode.
- Continue-here mode.
- Node status toggle.
- Concept linking and creation by lightweight local search.
- Concept relation network visualization.

Excludes:

- User accounts beyond a visual account menu entry.
- Collaboration.
- Public sharing.
- Billing.
- Learning time tracking.
- Session summaries.
- Recommended next questions.
- Concept mastery.
- Full automatic map restructuring.
