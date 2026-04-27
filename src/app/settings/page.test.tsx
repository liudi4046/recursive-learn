import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/domain/app-state";
import { LocaleProvider } from "@/i18n/locale-context";
import { AppStateProvider } from "@/state/app-state-context";
import { createStateBackupJson, clearStoredState, loadState, saveState } from "@/lib/storage";
import SettingsPage from "./page";

function renderSettingsPage() {
  return render(
    <LocaleProvider>
      <AppStateProvider>
        <SettingsPage />
      </AppStateProvider>
    </LocaleProvider>
  );
}

describe("SettingsPage data management", () => {
  beforeEach(async () => {
    indexedDB = new IDBFactory();
    await clearStoredState();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:backup"),
      revokeObjectURL: vi.fn()
    });
  });

  it("exports the current learning data as a JSON backup", async () => {
    await saveState(createInitialState("Physics"));
    renderSettingsPage();

    await userEvent.click(await screen.findByRole("button", { name: "Export JSON" }));

    const blob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0] as Blob | undefined;
    expect(blob).toBeInstanceOf(Blob);
    await expect(blob?.text()).resolves.toContain("Physics");
  });

  it("imports a JSON backup by replacing the current learning data", async () => {
    await saveState(createInitialState("Physics"));
    renderSettingsPage();

    const file = new File([createStateBackupJson(createInitialState("Math"))], "backup.json", {
      type: "application/json"
    });
    await userEvent.upload(await screen.findByLabelText("Import JSON backup"), file);

    await waitFor(async () => {
      await expect(loadState()).resolves.toMatchObject({
        nodes: [expect.objectContaining({ title: "Math" })]
      });
    });
    expect(await screen.findByText("Imported backup.")).toBeInTheDocument();
  });

  it("saves a Tavily API key from settings", async () => {
    renderSettingsPage();

    await userEvent.selectOptions(await screen.findByLabelText("Web search provider"), "tavily");
    await userEvent.type(await screen.findByLabelText("Tavily API key"), "tvly-test-key");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(await screen.findByLabelText("Tavily API key")).toHaveValue("tvly-test-key");
  });
});
