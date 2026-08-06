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
}

async function visit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

test('connexion — référence desktop', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
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

    await capture(page, `roles/02-dashboard-${role.toLowerCase()}.png`);
  });
}

test('administration — écrans structurants', async ({ page }) => {
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
    await capture(page, `admin/${screenshot}`);
  }

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
  await login(page, 'S1110');

  await visit(page, '/evaluations/pending');
  await capture(page, 'manager/12-evaluations-a-completer.png');

  await visit(page, '/evaluations/validate');
  await capture(page, 'manager/13-evaluations-a-valider.png');

  await visit(page, '/equipe/subordonnes');
  await capture(page, 'manager/14-equipe.png');
});

test('évaluateur — formulaire long et état initial', async ({ page }) => {
  await login(page, 'S1110');
  await visit(page, '/evaluations/pending');

  const resumeButton = page.getByRole('button', { name: /Reprendre/i }).first();
  if (await resumeButton.isVisible().catch(() => false)) {
    await resumeButton.click();
    await page.waitForLoadState('networkidle');
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

  await capture(page, 'mobile/16-dashboard-manager.png');
  await visit(page, '/evaluations/pending');
  await capture(page, 'mobile/17-file-evaluations.png');
  await context.close();
});
