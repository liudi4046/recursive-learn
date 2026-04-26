import { expect, test } from "@playwright/test";

const MAPLEARN_STATE_KEY = "maplearn.state.v1";

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, MAPLEARN_STATE_KEY);
});

test("learner can choose create child node or continue here", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Learning topic").fill("Transformer");
  await page.getByRole("button", { name: "Start learning" }).click();
  await expect(page.getByRole("heading", { name: "Transformer" })).toBeVisible();

  await page.getByRole("button", { name: "Create child node" }).nth(0).click();
  await page.getByLabel("Ask a question").fill("Q/K/V 是什么？");
  await page.getByRole("button", { name: "Create child node" }).nth(1).click();
  await expect(page.getByRole("heading", { name: "Q/K/V" })).toBeVisible();

  await page.getByRole("button", { name: "Continue here" }).click();
  await page.getByLabel("Ask a question").fill("Give me an example");
  await page.getByRole("button", { name: "Ask here" }).click();
  await expect(page.getByText("Give me an example")).toBeVisible();
});
