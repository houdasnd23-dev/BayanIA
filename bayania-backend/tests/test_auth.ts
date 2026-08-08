// --- Installation (une seule fois) ---
// npm init playwright@latest
// (choisis TypeScript, dossier "tests" ou "e2e")
//
// --- Lancer les tests ---
// npx playwright test auth.spec.ts

import { test, expect } from "@playwright/test";

const BASE_URL = "https://bayan-ia-eight.vercel.app";

test.describe("Parcours authentification", () => {
  test("un visiteur peut voir la page de login", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("login avec mauvais identifiants affiche une erreur", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("input[type='email']", "inexistant@example.com");
    await page.fill("input[type='password']", "mauvaispassword");
    await page.click("button[type='submit']");

    // Adapte le sélecteur au message d'erreur réel de ton app
    await expect(page.getByText(/incorrect|erreur|invalide/i)).toBeVisible({ timeout: 5000 });
  });

  test("login avec bons identifiants redirige vers le dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("input[type='email']", "houda.test@example.com");
    await page.fill("input[type='password']", "le_bon_mot_de_passe");
    await page.click("button[type='submit']");

    // Adapte l'URL attendue après connexion
    await page.waitForURL(/dashboard|admin|accueil/, { timeout: 5000 });
  });

  test("aucune requête réseau ne renvoie le mot de passe en clair", async ({ page }) => {
    const leaks: string[] = [];

    page.on("response", async (response) => {
      if (response.url().includes("/users/me") || response.url().includes("/auth/")) {
        try {
          const body = await response.text();
          if (body.includes("mot_de_passe") && !body.includes('"mot_de_passe":null')) {
            leaks.push(response.url());
          }
        } catch {
          // réponse non-JSON, on ignore
        }
      }
    });

    await page.goto(`${BASE_URL}/login`);
    await page.fill("input[type='email']", "houda.test@example.com");
    await page.fill("input[type='password']", "le_bon_mot_de_passe");
    await page.click("button[type='submit']");
    await page.waitForTimeout(2000);

    expect(leaks).toHaveLength(0);
  });
});