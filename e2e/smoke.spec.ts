import { expect, test } from '@playwright/test';

// Pas de mot de passe litteral dans le depot.
function requireSeedPassword(): string {
  const value = process.env.SEED_PASSWORD;
  if (!value) throw new Error('SEED_PASSWORD est requis pour executer les tests e2e');
  return value;
}

async function login(
  page: import('@playwright/test').Page,
  identifier: string,
  password = requireSeedPassword(),
) {
  await page.goto('/login');
  await page.getByLabel('Matricule ou Email').fill(identifier);
  // exact: sinon le libellé matche aussi le bouton « Afficher le mot de passe ».
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

// Le titre de page est rendu à la fois dans l'en-tête applicatif et dans le
// contenu: les assertions de titre sont donc portées sur <main>.
const main = (page: import('@playwright/test').Page) => page.getByRole('main');

test('admin dashboard 360 fonctionne avec les données seedées', async ({ page }, testInfo) => {
  await login(page, 'A0001');

  await expect(page).toHaveURL(/\/admin\/dashboard/);

  // Les onglets 360 vivent sur /admin/analytics; /admin/dashboard est la page KPI.
  await page.goto('/admin/analytics');
  await expect(page.getByRole('tab', { name: "Vue d'ensemble" })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Analyse régionale' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Recherche individuelle' })).toBeVisible();

  await page.getByRole('tab', { name: 'Recherche individuelle' }).click();
  // La liste est paginée: on passe par la recherche, ce qui vérifie aussi
  // qu'elle filtre bien sur les données seedées.
  await main(page)
    .getByRole('textbox', { name: /Rechercher par matricule/i })
    .fill('T1210');
  await expect(main(page).getByRole('button', { name: /T1210/ })).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('admin-dashboard.png'), fullPage: true });
});

test('dashboard manager et page axes réagissent aux vraies données', async ({ page }, testInfo) => {
  await login(page, 'S1110');

  await expect(page).toHaveURL(/\/cds\/dashboard/);
  await expect(main(page).getByText('Score moyen équipe')).toBeVisible();
  await expect(main(page).getByText('Cadre d’évaluation actif')).toBeVisible();

  await page.goto('/axes-amelioration');
  await expect(main(page).getByRole('heading', { name: 'Recommandations', exact: true })).toBeVisible();
  await expect(main(page).getByText('Top axes').first()).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('manager-axes.png'), fullPage: true });
});

test('dashboard individuel et amélioration personnelle sont cohérents', async ({ page }, testInfo) => {
  await login(page, 'T1210');

  await expect(page).toHaveURL(/\/tmo\/dashboard/);
  await expect(main(page).getByText('Recommandations').first()).toBeVisible();
  await expect(main(page).getByText('Scores par type')).toBeVisible();

  await page.goto('/axes-amelioration');
  await expect(main(page).getByRole('heading', { name: 'Mes axes d’amélioration' })).toBeVisible();
  await expect(main(page).getByRole('heading', { name: 'Recommandations', exact: true })).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('individual-axes.png'), fullPage: true });
});
