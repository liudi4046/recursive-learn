import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/domain/app-state";
import type { AppState } from "@/domain/app-state";
import { LocaleProvider } from "@/i18n/locale-context";
import MapsIndexPage from "./page";

function renderMapsIndex() {
  return render(
    <LocaleProvider>
      <MapsIndexPage />
    </LocaleProvider>
  );
}

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  appState: {
    rehydrated: true,
    state: null as AppState | null,
    setState: vi.fn()
  }
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}));

vi.mock("@/state/app-state-context", () => ({
  useAppState: () => mocks.appState
}));

function emptyState(): AppState {
  return {
    nodes: [],
    activeMapRootId: "",
    activeNodeId: "",
    createChildStreamUi: null
  };
}

describe("maps index page", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.appState.setState.mockReset();
    mocks.appState.rehydrated = true;
    mocks.appState.state = null;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"done":true,"full":"Root answer"}\n', {
        status: 200,
        headers: { "Content-Type": "application/x-ndjson" }
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a root-node creation form when roots already exist", () => {
    mocks.appState.state = createInitialState("Transformer");

    renderMapsIndex();

    expect(screen.getByRole("heading", { name: "Your root nodes" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What do you want to learn?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create new root node" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Transformer/ })).toBeInTheDocument();
  });

  it("renders the same creation form in the empty state", () => {
    mocks.appState.state = emptyState();

    renderMapsIndex();

    expect(screen.getByPlaceholderText("What do you want to learn?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create new root node" })).toBeInTheDocument();
    expect(screen.getByText("Create your first root node to start recursive learning.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Start from home/i })).not.toBeInTheDocument();
  });

  it("does not create a root node for empty input", () => {
    mocks.appState.state = createInitialState("Transformer");
    renderMapsIndex();

    fireEvent.click(screen.getByRole("button", { name: "Create new root node" }));

    expect(mocks.appState.setState).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("creates a root node and navigates to its detail page", async () => {
    mocks.appState.state = createInitialState("Transformer");
    renderMapsIndex();

    fireEvent.change(screen.getByPlaceholderText("What do you want to learn?"), {
      target: { value: "Diffusion Models" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create new root node" }));

    expect(mocks.appState.setState).toHaveBeenCalledTimes(1);
    const next = mocks.appState.setState.mock.calls[0][0] as AppState;
    expect(next.nodes).toHaveLength(2);
    const second = next.nodes[1]!;
    expect(second.title).toBe("Diffusion Models");
    expect(second).toMatchObject({
      mapRootId: second.id,
      parentNodeId: null,
      title: "Diffusion Models",
      contentBlocks: [expect.objectContaining({ answer: "" })]
    });
    expect(next.createChildStreamUi).toEqual({
      childId: next.activeNodeId,
      phase: "thinking",
      streamPurpose: "create_child"
    });
    expect(mocks.push).toHaveBeenCalledWith(`/nodes/${next.activeNodeId}`);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
  });

  it("sends webSearch when the internet search toggle is on", async () => {
    mocks.appState.state = createInitialState("Transformer");
    renderMapsIndex();

    fireEvent.click(screen.getByRole("button", { name: "Web search" }));
    fireEvent.change(screen.getByPlaceholderText("What do you want to learn?"), {
      target: { value: "Quantum computing" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create new root node" }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const f = vi.mocked(globalThis.fetch);
    const args = f.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(args[1].body)) as { webSearch?: boolean };
    expect(body.webSearch).toBe(true);
  });
});
