import { describe, expect, it } from "vitest";
import { buildAskContext } from "./context";
import { createChildNode, createTopicWithRoot } from "./learning-tree";

describe("buildAskContext", () => {
  it("includes selected ask mode and only the active path", () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const child = createChildNode(session.nodes[0], {
      title: "Self-attention",
      answer: "Attention answer"
    });
    const sibling = createChildNode(session.nodes[0], {
      title: "Positional Encoding",
      answer: "Position answer"
    });

    const context = buildAskContext({
      mapRoot: { title: session.nodes[0].title },
      nodes: [session.nodes[0], child, sibling],
      activeNodeId: child.id,
      question: "Q/K/V 是什么？",
      mode: "create_child_node"
    });

    expect(context.mode).toBe("create_child_node");
    expect(context.locale).toBe("zh");
    expect(context.path.map((node) => node.title)).toEqual(["Transformer", "Self-attention"]);
    expect(context.pathNodes).toHaveLength(2);
    expect(context.pathNodes[1].title).toBe("Self-attention");
    expect(JSON.stringify(context)).not.toContain("Positional Encoding");
  });

  it("uses English locale when requested", () => {
    const session = createTopicWithRoot("Topic", "Root");
    const context = buildAskContext({
      mapRoot: { title: session.nodes[0].title },
      nodes: session.nodes,
      activeNodeId: session.activeNodeId,
      question: "Hello?",
      mode: "just_ask",
      locale: "en"
    });
    expect(context.locale).toBe("en");
  });
});
