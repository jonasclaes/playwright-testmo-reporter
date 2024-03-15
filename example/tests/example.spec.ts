import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test("get started link", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Click the get started link.
  await page.getByRole("link", { name: "Get started" }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(
    page.getByRole("heading", { name: "Installation" }),
  ).toBeVisible();
});

test("substepping", async ({ page }) => {
  await page.goto("https://jonasclaes.be/");

  await test.step("Accept cookies", async () => {
    await page.getByRole("button", { name: "Accept All" }).click();
  });

  await test.step("Go to a project", async () => {
    await page.getByRole("link", { name: "Projects", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

    await test.step('Click on the "The Update Framework" project', async () => {
      await page
        .getByRole("link", { name: "The Update Framework" })
        .first()
        .click();

      await expect(
        page.getByRole("heading", { name: "The Update Framework" }),
      ).toBeVisible();
    });
  });
});
