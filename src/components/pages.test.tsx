import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}));
import { createInitialState, handleAskResult } from "@/domain/app-state";
import { LocaleProvider } from "@/i18n/locale-context";
import { HomePage } from "./HomePage";
import { NodeDetailPage } from "./NodeDetailPage";
import { LearningMapPage } from "./LearningMapPage";

function renderWithLocale(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("pages", () => {
  it("renders homepage start form", () => {
    renderWithLocale(<HomePage onStart={() => undefined} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/learn the recursive way/i);
    expect(screen.getByPlaceholderText("What do you want to learn?")).toBeInTheDocument();
  });

  it("renders node detail with ask mode switch and node-scoped ad-hoc Q&A sidebar", () => {
    const base = createInitialState("Transformer");
    const state = {
      ...base,
      nodes: base.nodes.map((node) =>
        node.id === base.activeNodeId
          ? {
              ...node,
              justAskEntries: [
                {
                  id: "ja_1",
                  question: "How does attention relate to embeddings?",
                  answer: "Attention uses embeddings as contextual signals.",
                  createdAt: "2026-04-27T00:00:00.000Z"
                },
                {
                  id: "ja_2",
                  question: "Who introduced the Transformer?",
                  answer: "The Transformer was introduced in Attention Is All You Need.",
                  createdAt: "2026-04-27T00:01:00.000Z"
                }
              ]
            }
          : node
      )
    };
    renderWithLocale(<NodeDetailPage state={state} onStateChange={() => undefined} />);
    expect(screen.getAllByRole("button", { name: "Create child node" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Just ask" })).toBeInTheDocument();
    const sidebar = screen.getByRole("complementary", { name: "Just ask log" });
    expect(sidebar).toBeInTheDocument();
    expect(within(sidebar).getAllByRole("button")).toHaveLength(2);
    fireEvent.click(within(sidebar).getByRole("button", { name: /How does attention/ }));
    expect(within(sidebar).getByRole("button", { name: /Current.*How does attention/s })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Just ask log/ })).not.toBeInTheDocument();
  });

  it("sends the web search option with node questions", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async () => {
      return new Response('{"done":true,"full":"Answer"}\n', {
        status: 200,
        headers: { "Content-Type": "application/x-ndjson" }
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    try {
      const state = createInitialState("Transformer");
      renderWithLocale(<NodeDetailPage state={state} onStateChange={() => undefined} />);

      fireEvent.click(screen.getByRole("button", { name: "Web search" }));
      fireEvent.click(screen.getByRole("button", { name: "Just ask" }));
      fireEvent.change(screen.getByLabelText("Ask a question"), {
        target: { value: "What changed recently?" }
      });
      fireEvent.click(screen.getByRole("button", { name: "Submit to just ask" }));

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const args = vi.mocked(fetchMock).mock.calls[0] as unknown as [string, RequestInit];
      const body = JSON.parse(String(args[1].body)) as { webSearch?: boolean };
      expect(body.webSearch).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("renders the node-detail learning trace as a compact scrollable path list", () => {
    let state = createInitialState("Transformer");
    state = handleAskResult(state, {
      mode: "create_child_node",
      question: "What is self-attention?",
      output: {
        title: "Self-attention",
        answer: "Self-attention compares tokens with each other.",
      }
    });
    state = handleAskResult(state, {
      mode: "create_child_node",
      question: "What are Q/K/V projections?",
      output: {
        title: "Q/K/V projections",
        answer: "Q/K/V are learned projections used by attention.",
      }
    });

    renderWithLocale(<NodeDetailPage state={state} onStateChange={() => undefined} />);

    const preview = screen.getByRole("list", { name: "Path from root to this node" });
    expect(within(preview).getAllByRole("listitem")).toHaveLength(3);
    expect(within(preview).getByRole("link", { name: "Transformer" })).toBeInTheDocument();
    expect(within(preview).getByRole("link", { name: "Self-attention" })).toBeInTheDocument();
    expect(within(preview).getByRole("link", { name: "Q/K/V projections" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.queryByRole("toolbar", { name: "Trace preview zoom" })).not.toBeInTheDocument();
  });

  it("renders the full-session tree view", () => {
    const state = createInitialState("Transformer");
    renderWithLocale(<LearningMapPage state={state} onStateChange={() => undefined} />);
    expect(screen.getByRole("heading", { level: 1, name: "Transformer" })).toBeInTheDocument();
    expect(screen.getAllByText("Unmastered").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Answer preview")).toHaveTextContent(/Start learning Transformer/);
  });
});
