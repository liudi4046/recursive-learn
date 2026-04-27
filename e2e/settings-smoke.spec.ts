import { expect, test } from "@playwright/test";

test("settings page shows LLM options and only the selected provider’s API key field", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("LLM provider")).toBeVisible();
  await expect(page.getByLabel("Model name")).toBeVisible();
  await expect(page.getByLabel("DeepSeek API key")).toBeVisible();
  await expect(page.getByLabel("OpenAI API key")).not.toBeVisible();
  await page.getByLabel("LLM provider").selectOption("openai");
  await expect(page.getByLabel("OpenAI API key")).toBeVisible();
  await expect(page.getByLabel("DeepSeek API key")).not.toBeVisible();
});
