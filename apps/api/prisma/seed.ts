import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const prisma = new PrismaClient();

const pg = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT || 5432),
  database: process.env.PG_DATABASE || 'sabc_business',
  user: process.env.PG_USER || 'sabc',
  password: process.env.PG_PASSWORD || '***REMOVED***',
});

async function pgQueryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  const result = await pg.query(sql, params);
  return (result.rows[0] as T | undefined) ?? null;
}

async function ensureBranche(id: string, nom: string, description: string) {
  const existing = await prisma.branche.findFirst({
    where: {
      OR: [{ id_branche: id }, { nom_branche: nom }],
    },
  });

  if (existing) {
    return prisma.branche.update({
      where: { id_branche: existing.id_branche },
      data: { nom_branche: nom, description },
    });
  }

  return prisma.branche.create({
    data: { id_branche: id, nom_branche: nom, description },
  });
}

async function ensureRegion(id: string, nom: string, estTaniere: boolean) {
  const existing = await prisma.region.findFirst({
    where: {
      OR: [{ id_region: id }, { nom_region: nom }],
    },
  });

  if (existing) {
    return prisma.region.update({
      where: { id_region: existing.id_region },
      data: { nom_region: nom, est_taniere: estTaniere },
    });
  }

  return prisma.region.create({
    data: { id_region: id, nom_region: nom, est_taniere: estTaniere },
  });
}

async function ensureRole(data: {
  id_role: string;
  nom_role: string;
  description: string;
  id_branche: string;
  niveau_taniere: number;
  niveau_non_taniere: number;
  peut_auto_evaluer: boolean;
  peut_evaluer_pairs: boolean;
  peut_evaluer_subordonnes: boolean;
  peut_cross_branch: boolean;
  role_principal_equivalent: string;
  peut_remplacer_roles: string;
  portee_geographique: string;
}) {
  const existing = await prisma.role.findFirst({
    where: {
      OR: [{ id_role: data.id_role }, { nom_role: data.nom_role }],
    },
  });

  if (existing) {
    return prisma.role.update({
      where: { id_role: existing.id_role },
      data,
    });
  }

  return prisma.role.create({ data });
}

async function seedCore() {
  const brancheCommerciale = await ensureBranche('BR-01', 'Commercial', 'Branche commerciale');
  const regionLittoral = await ensureRegion('RG-01', 'Littoral', true);

  const roles = [
    {
      id_role: 'RL-00',
      nom_role: 'ADMIN',
      id_branche: brancheCommerciale.id_branche,
      niveau_taniere: 0,
      niveau_non_taniere: 0,
      peut_evaluer_subordonnes: true,
      peut_cross_branch: true,
      portee_geographique: 'national',
    },
    {
      id_role: 'RL-01',
      nom_role: 'DR',
      id_branche: brancheCommerciale.id_branche,
      niveau_taniere: 1,
      niveau_non_taniere: 1,
      peut_evaluer_subordonnes: true,
      peut_cross_branch: true,
      portee_geographique: 'region',
    },
    {
      id_role: 'RL-05',
      nom_role: 'CDS',
      id_branche: brancheCommerciale.id_branche,
      niveau_taniere: 2,
      niveau_non_taniere: 2,
      peut_evaluer_subordonnes: true,
      peut_cross_branch: false,
      portee_geographique: 'region',
    },
    {
      id_role: 'RL-03',
      nom_role: 'CSC',
      id_branche: brancheCommerciale.id_branche,
      niveau_taniere: 3,
      niveau_non_taniere: 3,
      peut_evaluer_subordonnes: false,
      peut_cross_branch: false,
      portee_geographique: 'district',
    },
  ];

  for (const role of roles) {
    await ensureRole({
      description: `Rôle ${role.nom_role}`,
      peut_auto_evaluer: true,
      peut_evaluer_pairs: true,
      role_principal_equivalent: role.nom_role,
      peut_remplacer_roles: '',
      ...role,
    });
  }

  // Fixed bcrypt hash for ***REMOVED*** to keep the seed independent from native bcrypt bindings.
  const password = '$2y$10$2nVpiclaWIzl5fpH/hyg.u3u1XV1MTbasLFOvT/x3m9waZ/1u8cuK';

  const users = [
    {
      matricule: 'A0001',
      nom: 'Admin',
      prenom: 'Systeme',
      email: 'admin@sabc.local',
      role: 'ADMIN',
      role_nom: 'ADMIN',
      niveau_hierarchique: 0,
      manager_matricule: null,
      est_admin: true,
    },
    {
      matricule: 'D0001',
      nom: 'Directeur',
      prenom: 'Region',
      email: 'dr.littoral@sabc.local',
      role: 'DR',
      role_nom: 'DR',
      niveau_hierarchique: 1,
      manager_matricule: 'A0001',
      est_admin: false,
    },
    {
      matricule: 'S0001',
      nom: 'Chef',
      prenom: 'Service',
      email: 'cds.littoral@sabc.local',
      role: 'CDS',
      role_nom: 'CDS',
      niveau_hierarchique: 2,
      manager_matricule: 'D0001',
      est_admin: false,
    },
    {
      matricule: 'C0001',
      nom: 'Chef',
      prenom: 'Secteur',
      email: 'csc.littoral@sabc.local',
      role: 'CSC',
      role_nom: 'CSC',
      niveau_hierarchique: 3,
      manager_matricule: 'S0001',
      est_admin: false,
    },
  ];

  for (const user of users) {
    await prisma.utilisateur.upsert({
      where: { matricule: user.matricule },
      update: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        password,
        role: user.role,
        role_nom: user.role_nom,
        manager_matricule: user.manager_matricule,
        niveau_hierarchique: user.niveau_hierarchique,
        est_admin: user.est_admin,
      },
      create: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: null,
        password,
        role: user.role,
        manager_matricule: user.manager_matricule,
        niveau_hierarchique: user.niveau_hierarchique,
        id_region: regionLittoral.id_region,
        id_branche: brancheCommerciale.id_branche,
        est_actif: true,
        est_admin: user.est_admin,
        est_indisponible: false,
        statut: 'Actif',
        region_nom: regionLittoral.nom_region,
        role_nom: user.role_nom,
        type_region: 'taniere',
        roles_support_json: '[]',
        matricule: user.matricule,
      },
    });
  }
}

async function seedBusiness() {
  const seedEvaluationPeriodeId = '11111111-1111-1111-1111-111111111111';
  const periodeCode = 'N26001';
  await pg.query(
    `INSERT INTO periodes_evaluation
     (code_periode, nom_periode, titre, description, date_debut, date_fin, statut, est_ouverte, est_cloturee,
      nb_evaluations_attendues, nb_evaluations_completees, taux_completion, statistiques_json, created_at, updated_at)
     VALUES
     ($1, $2, $3, $4, CURRENT_DATE - INTERVAL '7 day', CURRENT_DATE + INTERVAL '30 day', 'ouverte', true, false, 2, 0, 0, '{}'::json, NOW(), NOW())
     ON CONFLICT (code_periode) DO UPDATE SET nom_periode = EXCLUDED.nom_periode, titre = EXCLUDED.titre, updated_at = NOW()`,
    [periodeCode, 'Période pilote 2026', 'Période pilote 2026', 'Période seed NestJS'],
  );
  const periode = await pgQueryOne<{ id_periode: number; code_periode: string }>(
    `SELECT id_periode, code_periode FROM periodes_evaluation WHERE code_periode = $1`,
    [periodeCode],
  );
  if (!periode) throw new Error('Impossible de récupérer la période seed');

  const regleNom = 'Règle standard seed';
  const reglePayload = JSON.stringify({
    criteres: [
      { nom: 'Leadership', description: 'Capacité à guider', ponderation: 20, echelle: { min: 1, max: 5 }, categorie: 'Leadership' },
      { nom: 'Communication', description: 'Qualité de communication', ponderation: 20, echelle: { min: 1, max: 5 }, categorie: 'Soft skills' },
      { nom: 'Performance', description: 'Résultats atteints', ponderation: 20, echelle: { min: 1, max: 5 }, categorie: 'Performance' },
      { nom: 'Autonomie', description: 'Capacité à travailler seul', ponderation: 20, echelle: { min: 1, max: 5 }, categorie: 'Autonomie' },
      { nom: 'Innovation', description: 'Proposition d’idées', ponderation: 20, echelle: { min: 1, max: 5 }, categorie: 'Innovation' },
    ],
  });
  await pg.query(
    `INSERT INTO regles_evaluation
     (nom_regle, description, criteres_evaluation_json, est_active, role_evaluateur, role_evalue, type_evaluation, created_at, updated_at)
     VALUES
     ($1, $2, $3, true, 'CDS', 'CSC', 'descendante', NOW(), NOW())
     ON CONFLICT (role_evaluateur, role_evalue, type_evaluation)
     DO UPDATE SET nom_regle = EXCLUDED.nom_regle, description = EXCLUDED.description, criteres_evaluation_json = EXCLUDED.criteres_evaluation_json, updated_at = NOW()`,
    [regleNom, 'Règle seed pour tests manuels', reglePayload],
  );
  const regle = await pgQueryOne<{ id_regle: number }>(
    `SELECT id_regle FROM regles_evaluation WHERE role_evaluateur = 'CDS' AND role_evalue = 'CSC' AND type_evaluation = 'descendante'`,
  );
  if (!regle) throw new Error('Impossible de récupérer la règle seed');

  const templateId = '33333333-3333-3333-3333-333333333333';
  await pg.query(
    `INSERT INTO templates
     (id_template, nom, description, evaluated_role, version, statut, meta_json, created_at, updated_at)
     VALUES
     ($1, $2, $3, $4, $5, 'published', $6::json, NOW(), NOW())
     ON CONFLICT (id_template) DO UPDATE SET nom = EXCLUDED.nom, description = EXCLUDED.description, meta_json = EXCLUDED.meta_json, updated_at = NOW()`,
    [
      templateId,
      'Template standard commercial',
      'Template seed pour tests manuels',
      'CSC',
      1,
      JSON.stringify({
        categorie: 'Commercial',
        sections: [
          {
            titre: 'Management',
            description: 'Bloc management',
            ordre: 1,
            competences: [
              { libelle: 'Leadership', description: 'Leadership', niveau_requis: 4, ordre: 1 },
              { libelle: 'Communication', description: 'Communication', niveau_requis: 4, ordre: 2 },
            ],
          },
          {
            titre: 'Exécution',
            description: 'Bloc exécution',
            ordre: 2,
            competences: [
              { libelle: 'Performance', description: 'Performance', niveau_requis: 4, ordre: 1 },
              { libelle: 'Autonomie', description: 'Autonomie', niveau_requis: 4, ordre: 2 },
              { libelle: 'Innovation', description: 'Innovation', niveau_requis: 3, ordre: 3 },
            ],
          },
        ],
      }),
    ],
  );

  await pg.query(
    `INSERT INTO templates_roles_periodes
     (id_role, id_periode, id_template, est_actif, created_at, updated_at)
     VALUES ($1, $2, $3, true, NOW(), NOW())
     ON CONFLICT (id_role, id_periode) DO UPDATE SET id_template = EXCLUDED.id_template, est_actif = true, updated_at = NOW()`,
    ['CDS', periode.id_periode, templateId],
  );

  await pg.query(
    `INSERT INTO evaluations
     (evaluateur_matricule, evalue_matricule, id_periode, id_regle, date_creation, date_soumission, statut,
      notations_json, commentaire_global, note_globale, type_evaluation, periode_code, created_at, updated_at)
     VALUES
     ($1, $2, $3, $4, CURRENT_DATE, NULL, 'brouillon', $5, 'Seed draft', NULL, 'descendante', $6, NOW(), NOW())
     ON CONFLICT (evaluateur_matricule, evalue_matricule, id_periode, type_evaluation)
     DO UPDATE SET id_regle = EXCLUDED.id_regle, commentaire_global = EXCLUDED.commentaire_global, updated_at = NOW()`,
    ['S0001', 'C0001', seedEvaluationPeriodeId, regle.id_regle, '[]', periode.code_periode],
  );
}

async function main() {
  console.log('Seeding MySQL core...');
  await seedCore();
  console.log('Seeding PostgreSQL business...');
  await seedBusiness();
  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pg.end();
  });
