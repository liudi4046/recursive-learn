import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { createTopicWithRoot } from "@/domain/learning-tree";

describe("POST /api/ask", () => {
  it("returns create-node output for create child mode", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          topic: session.topic,
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "Q/K/V 是什么？",
          mode: "create_child_node",
          relatedConcepts: []
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.kind).toBe("create_child_node");
    expect(body.output.title).toBe("Q/K/V");
  });

  it("returns continue output for continue here mode", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          topic: session.topic,
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "Explain with an example",
          mode: "continue_here",
          relatedConcepts: []
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.kind).toBe("continue_here");
    expect(body.output.answer).toContain("example");
  });
});
