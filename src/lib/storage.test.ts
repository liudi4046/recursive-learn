import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/domain/app-state";
import {
  clearStoredState,
  exportStateJson,
  importStateJson,
  LEGACY_STATE_STORAGE_KEY,
  loadState,
  saveState
} from "./storage";

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

describe("IndexedDB storage", () => {
  beforeEach(async () => {
    mockLocalStorage();
    for (const k of Object.keys(memory)) delete memory[k];
    indexedDB = new IDBFactory();
    await clearStoredState();
  });

  it("saves and loads app state from IndexedDB", async () => {
    const state = createInitialState("Physics");

    await saveState(state);

    await expect(loadState()).resolves.toMatchObject({
      nodes: [expect.objectContaining({ title: "Physics" })],
      createChildStreamUi: null
    });
  });

  it("migrates the legacy localStorage state once", async () => {
    const legacy = createInitialState("Biology");
    memory[LEGACY_STATE_STORAGE_KEY] = JSON.stringify({ ...legacy, createChildStreamUi: { childId: "x", phase: "thinking" } });

    await expect(loadState()).resolves.toMatchObject({
      nodes: [expect.objectContaining({ title: "Biology" })],
      createChildStreamUi: null
    });
    expect(memory[LEGACY_STATE_STORAGE_KEY]).toBeUndefined();
  });

  it("exports and imports a versioned JSON backup", async () => {
    await saveState(createInitialState("Chemistry"));
    const json = await exportStateJson();

    expect(JSON.parse(json)).toMatchObject({
      version: 1,
      state: {
        nodes: [expect.objectContaining({ title: "Chemistry" })]
      }
    });

    await importStateJson(JSON.stringify({ version: 1, state: createInitialState("Math") }));

    await expect(loadState()).resolves.toMatchObject({
      nodes: [expect.objectContaining({ title: "Math" })]
    });
  });

  it("rejects malformed JSON imports without replacing current data", async () => {
    await saveState(createInitialState("History"));

    await expect(importStateJson("{ nope")).rejects.toThrow("Invalid backup JSON");
    await expect(loadState()).resolves.toMatchObject({
      nodes: [expect.objectContaining({ title: "History" })]
    });
  });
});
