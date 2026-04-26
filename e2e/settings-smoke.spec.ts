import { expect, test } from "@playwright/test";

test("settings page shows DeepSeek options", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("DeepSeek API key")).toBeVisible();
  await expect(page.getByText("DeepSeek V4 Flash", { exact: true })).toBeVisible();
  await expect(page.getByText("DeepSeek V4 Pro", { exact: true })).toBeVisible();
});
