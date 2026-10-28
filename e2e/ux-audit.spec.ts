import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const auditRoot = process.env.UX_AUDIT_DIR ?? join(process.cwd(), 'artifacts', 'ux-audit', 'before');

function requireSeedPassword(): string {
  const value = process.env.SEED_PASSWORD;
  if (!value) throw new Error('SEED_PASSWORD est requis pour executer l’audit UX');
  return value;
}

async function capture(page: Page, relativePath: string) {
  const path = join(auditRoot, relativePath);
  mkdirSync(join(path, '..'), { recursive: true });
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
}

async function login(page: Page, identifier: string) {
  await page.goto('/login');
  await page.getByLabel('Matricule ou Email').fill(identifier);
  await page.getByLabel('Mot de passe', { exact: true }).fill(requireSeedPassword());
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
}

async function visit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

async function findDuplicateIds(page: Page) {
  return page.evaluate(() => {
    const counts = new Map<string, number>();
    document.querySelectorAll<HTMLElement>('[id]').forEach((element) => {
      if (!element.id) return;
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([id]) => id);
  });
}

test('connexion — référence desktop', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Créer un compte/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Utiliser le compte/i })).toHaveCount(0);
  await capture(page, '00-login-desktop.png');
});

test('connexion — référence mobile', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  await capture(page, '01-login-mobile.png');
  await context.close();
});

const roles = [
  ['ADMIN', 'A0001'],
  ['DR', 'D1010'],
  ['CDTT', 'X0002'],
  ['CSC', 'C0007'],
  ['RTM', 'M0008'],
  ['CDV', 'V0005'],
  ['TMO', 'T1210'],
  ['CDS', 'S1110'],
  ['AS', 'A0016'],
  ['SS', 'P0014'],
  ['SRMO', 'O0012'],
] as const;

for (const [role, identifier] of roles) {
  test(`tableau de bord et navigation — ${role}`, async ({ page }, testInfo) => {
    await login(page, identifier);
    const layout = page.locator('body');
    await expect(layout).toContainText(/Tableau de bord|Pilotage|Bonjour|Bienvenue/i);

    const metrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      h1Count: document.querySelectorAll('h1').length,
      h1Texts: Array.from(document.querySelectorAll('h1')).map((element) => element.textContent?.trim()),
      route: window.location.pathname,
    }));
    await testInfo.attach(`${role}-layout.json`, {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    });
    expect(metrics.h1Count).toBeGreaterThan(0);
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(await findDuplicateIds(page)).toEqual([]);

    if (role === 'CDTT' || role === 'TMO') {
      const evaluationsToggle = page.getByRole('button', { name: /Déplier Évaluations/i });
      if (await evaluationsToggle.isVisible().catch(() => false)) await evaluationsToggle.click();
      const validationLink = page.getByRole('link', { name: /À valider/i });
      if (role === 'CDTT') await expect(validationLink).toBeVisible();
      if (role === 'TMO') await expect(validationLink).toHaveCount(0);
    }

    if (role === 'CDS') {
      await expect(
        page.locator('main').getByRole('link', { name: /Vue équipe|Évaluations équipe/i }),
      ).toHaveCount(0);
    }

    await capture(page, `roles/02-dashboard-${role.toLowerCase()}.png`);
  });
}

test('administration — écrans structurants', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page, 'A0001');

  const screens = [
    ['/admin/utilisateurs', '03-admin-utilisateurs.png'],
    ['/admin/evaluations/regles', '04-admin-regles.png'],
    ['/admin/evaluations/templates', '05-admin-modeles.png'],
    ['/admin/evaluations/periodes', '06-admin-periodes.png'],
    ['/admin/analytics', '07-admin-analytics.png'],
    ['/admin/reports', '08-admin-rapports.png'],
    ['/admin/structure', '09-admin-structure.png'],
  ] as const;

  for (const [path, screenshot] of screens) {
    await visit(page, path);
    if (path === '/admin/reports') {
      await expect(page.getByRole('link', { name: 'Rapports' })).toHaveAttribute('aria-current', 'page');
      await expect(page.getByRole('button', { name: /Nouveau rapport/i })).toHaveCount(1);
    }
    await capture(page, `admin/${screenshot}`);
  }

  await visit(page, '/admin/roles/permissions');
  await expect(page).toHaveURL(/\/admin\/evaluations\/regles$/);
  await visit(page, '/admin/evaluations/templates/assignations');
  await expect(page).toHaveURL(/\/admin\/evaluations\/templates$/);

  await visit(page, '/admin/roles/create');
  expect(await findDuplicateIds(page)).toEqual([]);

  await visit(page, '/admin/dashboard');
  const collapseButton = page.getByRole('button', { name: /réduire|sidebar|menu/i }).first();
  if (await collapseButton.isVisible().catch(() => false)) {
    await collapseButton.click();
    await capture(page, 'admin/10-sidebar-reduite.png');
  }

  const notificationsButton = page.getByRole('button', { name: 'Notifications' });
  await notificationsButton.click();
  await capture(page, 'admin/11-notifications.png');
});

test('manager — file d’actions et validation', async ({ page }) => {
  await login(page, 'M0008');

  const dashboardExamineButton = page
    .locator('main')
    .getByRole('button', { name: /^Examiner l'évaluation de /i })
    .first();
  await expect(dashboardExamineButton).toBeVisible();
  await dashboardExamineButton.click();
  await expect(page).toHaveURL(/\/evaluations\/validate\?id=/);
  await expect(page.getByRole('dialog')).toContainText("Validation de l'évaluation");
  await page.getByRole('dialog').getByRole('button', { name: 'Fermer', exact: true }).first().click();

  await visit(page, '/evaluations/pending');
  await expect(page.getByText('Soumises', { exact: true })).toHaveCount(0);
  await capture(page, 'manager/12-evaluations-a-completer.png');

  await visit(page, '/evaluations/validate');
  const examineButton = page.getByRole('button', { name: /^Examiner l'évaluation de /i }).first();
  await expect(examineButton).toBeVisible();
  await capture(page, 'manager/13-evaluations-a-valider.png');
  await examineButton.click();
  await expect(page.getByRole('dialog')).toContainText("Validation de l'évaluation");
  await capture(page, 'manager/13b-modale-validation.png');
  await page.getByRole('dialog').getByRole('button', { name: 'Fermer', exact: true }).first().click();

  await visit(page, '/equipe/subordonnes');
  await capture(page, 'manager/14-equipe.png');
});

test('évaluateur — formulaire long et état initial', async ({ page }) => {
  await login(page, 'S1110');
  await visit(page, '/evaluations/pending');

  const resumeButton = page.getByRole('button', { name: /Reprendre/i }).first();
  if (await resumeButton.isVisible().catch(() => false)) {
    await resumeButton.click();
    await expect(page).toHaveURL(/\/evaluations\/[^/]+\/edit$/);
    await expect(page.getByRole('heading', { name: /Éditer une évaluation/i })).toBeVisible();
    await expect(page.getByText('100%', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Soumettre l'évaluation/i })).toBeDisabled();
    await capture(page, 'evaluation/15-formulaire-initial.png');
  } else {
    await capture(page, 'evaluation/15-file-sans-brouillon.png');
  }
});

test('application authentifiée — viewport mobile', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await login(page, 'S1110');

  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    mainWidth: document.querySelector('main')?.getBoundingClientRect().width ?? null,
    sidebarWidth: document.querySelector('aside')?.getBoundingClientRect().width ?? null,
  }));
  await testInfo.attach('mobile-layout.json', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.mainWidth).not.toBeNull();
  expect(metrics.mainWidth ?? 0).toBeGreaterThanOrEqual(380);

  await capture(page, 'mobile/16-dashboard-manager.png');
  await page.getByRole('button', { name: 'Ouvrir le menu de navigation' }).click();
  await expect(page.getByRole('complementary', { name: 'Navigation principale' })).toBeVisible();
  await capture(page, 'mobile/18-menu-navigation.png');
  await page.getByRole('button', { name: 'Fermer le menu de navigation' }).click();
  await visit(page, '/evaluations/pending');
  await capture(page, 'mobile/17-file-evaluations.png');
  await context.close();
});
