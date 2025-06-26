import { test, expect } from "@playwright/test";

test("includes 'Nordcraft' in title", async ({ page }) => {
  await page.goto("/projects/toddle_e2e/branches/main");
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Nordcraft/);

  // set the viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });
});

test("can change standard style properties", async ({ page }) => {
  await page.goto("/projects/toddle_e2e/branches/main/components/HomePage?rightpanel=style&selection=nodes.wz0B5AQwNmG5sc0BSRfvD");

  const canvasElement = await page.frameLocator("#toddle-canvas").getByTestId("0.0.0");
  const stylePanelWidthInput = page.getByTestId("0.0[default].1.0[default].0[default].0[default].1[default].0.3.0.1.2.1.0.0.0.0.1.0[Content].0.0.0.0[default].0[default].0[default].2");

  // Focus input and type a new width
  await stylePanelWidthInput.fill("600px");

  // Store changes permanently when clicking outside the input (change-event)
  await page.click("body");

  // Get canvas element (iframe) and check that the width has been updated
  await expect(canvasElement).toHaveCSS("width", "600px");
});
