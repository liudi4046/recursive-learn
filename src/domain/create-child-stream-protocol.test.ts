import { describe, expect, it } from "vitest";
import {
  CreateChildProtocolStreamParser,
  buildCreateChildMockProtocolString
} from "./create-child-stream-protocol";
import { mockCreateNode } from "./mock-ai";
import { buildAskContext } from "./context";
import { createTopicWithRoot } from "./learning-tree";

describe("CreateChildProtocolStreamParser", () => {
  it("invokes onTitle when the title line is complete, before any body token", () => {
    const titles: string[] = [];
    const p = new CreateChildProtocolStreamParser((t) => titles.push(t));
    const head = "---ML-TITLE---\n总结短句\n";
    expect(p.append(head)).toBe("");
    expect(titles).toEqual(["总结短句"]);
    const tail =
      "---ML-BODY---\nx\n---ML-META---\n" +
      JSON.stringify({ conceptCandidate: null, relatedConceptCandidates: [] });
    let body = "";
    for (const ch of tail) body += p.append(ch);
    expect(body).toBe("x\n");
    expect(p.finish().title).toBe("总结短句");
  });

  it("streams body only after marker and parses finish()", () => {
    const s =
      "---ML-TITLE---\nMy Title\n---ML-BODY---\nHello world.\n---ML-META---\n" +
      JSON.stringify({ conceptCandidate: "C", relatedConceptCandidates: [] });
    const p = new CreateChildProtocolStreamParser();
    let out = "";
    for (const ch of s) {
      out += p.append(ch);
    }
    expect(out).toBe("Hello world.\n");
    const result = p.finish();
    expect(result.title).toBe("My Title");
    expect(result.answer).toBe("Hello world.");
  });

  it("strips mistaken 「标题」： prefix from the title line", () => {
    const s =
      "---ML-TITLE---\n「标题」：解释LLM局限需验证\n---ML-BODY---\nbody\n---ML-META---\n{}";
    const p = new CreateChildProtocolStreamParser();
    for (const ch of s) p.append(ch);
    expect(p.finish().title).toBe("解释LLM局限需验证");
  });

  it("onTitle receives normalized title when model adds a label prefix", () => {
    const titles: string[] = [];
    const p = new CreateChildProtocolStreamParser((t) => titles.push(t));
    p.append("---ML-TITLE---\n「标题」：总结短句\n");
    expect(titles).toEqual(["总结短句"]);
  });

  it("handles chunks split across markers", () => {
    const s =
      "---ML-TI" + "TLE---\nT\n---ML" + "-BODY---\nab\n" + "---ML-META" + "---\n" +
      JSON.stringify({});
    const p = new CreateChildProtocolStreamParser();
    let body = "";
    for (const part of s.match(/[\s\S]{1,3}/g) ?? []) {
      body += p.append(part);
    }
    expect(body).toBe("ab\n");
    const result = p.finish();
    expect(result.title).toBe("T");
    expect(result.answer).toBe("ab");
  });
});

describe("buildCreateChildMockProtocolString", () => {
  it("round-trips through the protocol parser", async () => {
    const session = createTopicWithRoot("T", "root");
    const context = buildAskContext({
      mapRoot: { title: session.nodes[0].title },
      nodes: session.nodes,
      activeNodeId: session.activeNodeId,
      question: "What is attention?",
      mode: "create_child_node"
    });
    const out = await mockCreateNode(context);
    const protocol = buildCreateChildMockProtocolString(out);
    const p = new CreateChildProtocolStreamParser();
    for (const ch of protocol) p.append(ch);
    expect(p.finish()).toEqual(out);
  });
});
