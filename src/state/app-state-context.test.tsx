import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider, useAppState } from "./app-state-context";
import { clearStoredState, LEGACY_STATE_STORAGE_KEY, saveState } from "@/lib/storage";
import { createInitialState } from "@/domain/app-state";

const memory: Record<string, string> = {};

function mockLocalStorage() {
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (k in memory ? memory[k] : null),
    setItem: (k: string, v: string) => {
      memory[k] = v;
    },
    removeItem: (k: string) => {
      delete memory[k];
    },
    clear: () => {
      for (const k of Object.keys(memory)) delete memory[k];
    }
  } as Storage);
}

function Probe() {
  const { rehydrated, state } = useAppState();
  if (!rehydrated) return <div>loading</div>;
  if (!state) return <div>no-session</div>;
  const root = state.nodes.find((n) => n.id === state.activeMapRootId);
  return <div>map:{root?.title}</div>;
}

describe("AppStateProvider", () => {
  beforeEach(() => {
    indexedDB = new IDBFactory();
    for (const k of Object.keys(memory)) delete memory[k];
    mockLocalStorage();
  });

  afterEach(async () => {
    await clearStoredState();
    for (const k of Object.keys(memory)) delete memory[k];
  });

  it("rehydrates persisted state from IndexedDB", async () => {
    const saved = createInitialState("Physics");
    await saveState(saved);

    render(
      <AppStateProvider>
        <Probe />
      </AppStateProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("map:Physics")).toBeInTheDocument();
    });
  });

  it("rehydrates and migrates legacy localStorage state", async () => {
    const saved = createInitialState("Music");
    memory[LEGACY_STATE_STORAGE_KEY] = JSON.stringify(saved);

    render(
      <AppStateProvider>
        <Probe />
      </AppStateProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("map:Music")).toBeInTheDocument();
    });
    expect(memory[LEGACY_STATE_STORAGE_KEY]).toBeUndefined();
  });

  it("starts with no session when storage is empty", async () => {
    render(
      <AppStateProvider>
        <Probe />
      </AppStateProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("no-session")).toBeInTheDocument();
    });
  });
});
