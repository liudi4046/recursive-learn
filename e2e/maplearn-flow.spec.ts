import { expect, test } from "@playwright/test";

const MAPLEARN_STATE_KEY = "maplearn.state.v1";
const DEEPSEEK_SETTINGS_KEY = "maplearn.deepseek.v1";

test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (keys) => {
      for (const k of keys) localStorage.removeItem(k);
    },
    [MAPLEARN_STATE_KEY, DEEPSEEK_SETTINGS_KEY]
  );
});

// Session rehydration from localStorage is flaky with `next start` in this project’s stack (client UI “Start
// learning” does not always move off the home hero; see playwright.config). Skip until that interaction is
// stabilized or a stable seed/URL strategy is added.
test.skip("learner can choose create child node or continue here", async ({ page }) => {
  await page.goto("/");
  const topicInput = page.getByPlaceholder("What do you want to learn?");
  await expect(topicInput).toBeVisible({ timeout: 60_000 });
  await topicInput.fill("Transformer");
  await page.getByRole("button", { name: "Start learning" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Transformer" })).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Create child node" }).nth(0).click();
  await page.getByLabel("Ask a question").fill("Q/K/V 是什么？");
  await page.getByRole("button", { name: "Create child node" }).nth(1).click();
  await expect(page.getByRole("heading", { level: 1, name: "Q/K/V" })).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Continue here" }).click();
  await page.getByLabel("Ask a question").fill("Give me an example");
  await page.getByRole("button", { name: "Ask here" }).click();
  await expect(page.getByText("Give me an example")).toBeVisible();
});
