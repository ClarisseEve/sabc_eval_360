import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page, identifier: string, password = '***REMOVED***') {
  await page.goto('/login');
  await page.getByLabel('Matricule ou Email').fill(identifier);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

test('admin dashboard 360 fonctionne avec les données seedées', async ({ page }, testInfo) => {
  await login(page, 'A0001');

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByRole('tab', { name: "Vue d'ensemble" })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Analyse régionale' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Recherche individuelle' })).toBeVisible();

  await page.getByRole('tab', { name: 'Recherche individuelle' }).click();
  await expect(page.getByText('Recherche individuelle')).toBeVisible();
  await expect(page.getByText('T1230')).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('admin-dashboard.png'), fullPage: true });
});

test('dashboard manager et page axes réagissent aux vraies données', async ({ page }, testInfo) => {
  await login(page, 'S1110');

  await expect(page).toHaveURL(/\/cds\/dashboard/);
  await expect(page.getByText('Score moyen équipe')).toBeVisible();
  await expect(page.getByText('Cadre d’évaluation actif')).toBeVisible();

  await page.goto('/axes-amelioration');
  await expect(page.getByText('Recommandations')).toBeVisible();
  await expect(page.getByText('Top axes')).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('manager-axes.png'), fullPage: true });
});

test('dashboard individuel et amélioration personnelle sont cohérents', async ({ page }, testInfo) => {
  await login(page, 'T1230');

  await expect(page).toHaveURL(/\/tmo\/dashboard/);
  await expect(page.getByText('Recommandations')).toBeVisible();
  await expect(page.getByText('Scores par type')).toBeVisible();

  await page.goto('/axes-amelioration');
  await expect(page.getByText('Mes axes d’amélioration')).toBeVisible();
  await expect(page.getByText('Recommandations')).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('individual-axes.png'), fullPage: true });
});
