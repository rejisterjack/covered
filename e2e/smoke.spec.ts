import { expect, test } from "@playwright/test";

test("home feed loads and navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Covered" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New" })).toBeVisible();

  await page.getByRole("link", { name: "Ranks" }).click();
  await expect(
    page.getByRole("heading", { name: "Leaderboard" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Post" }).click();
  await expect(
    page.getByRole("heading", { name: /Post a bill|Sign in to post/ }),
  ).toBeVisible();
});

test("legal pages are reachable", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms" })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
});
