import 'dotenv/config';
import { createHash, randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { Pool } from 'pg';

const prisma = new PrismaClient();

// Pas de mot de passe par défaut: ce serait un secret versionné.
if (!process.env.PG_PASSWORD) {
  throw new Error('PG_PASSWORD est requis pour se connecter à PostgreSQL');
}

const pg = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT || 5432),
  database: process.env.PG_DATABASE || 'sabc_business',
  user: process.env.PG_USER || 'sabc',
  password: process.env.PG_PASSWORD,
});

const seedPassword = process.env.SEED_PASSWORD ?? '12345';
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Seed de démonstration refusé en production (ALLOW_DEMO_SEED=true requis)');
}

if (!process.env.SEED_PASSWORD) {
  console.warn('SEED_PASSWORD absent, utilisation de la valeur de secours 12345 pour les comptes de démonstration.');
}
const PASSWORD_HASH = hashSync(seedPassword, 10);
const PERIODE_UUID_NAMESPACE = '2d9d2d7e-2c8f-4d5f-9867-334e13ef17d9';

type RegionSeed = {
  id: string;
  nom: string;
  estTaniere: boolean;
};

type BrancheSeed = {
  id: string;
  nom: string;
  description: string;
};

type RoleSeed = {
  id: string;
  nom: string;
  brancheId: string;
  niveauTaniere: number;
  niveauNonTaniere: number;
  auto: boolean;
  pairs: boolean;
  subordonnes: boolean;
  crossBranch: boolean;
  portee: string;
  description: string;
};

type UserSeed = {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  roleId: string;
  regionId: string;
  brancheId: string;
  managerMatricule: string | null;
  niveau: number;
  estAdmin?: boolean;
  statut?: string;
  estIndisponible?: boolean;
  typeRegion?: string;
};

type CriterionSeed = {
  id: string;
  libelle: string;
  description: string;
  poids: number;
  section: string;
  ordreSection: number;
  niveau: number;
  axis: string;
  tags: string[];
  commentaireSeuil?: number;
};

type RuleSeed = {
  nom: string;
  description: string;
  roleEvaluateur: string;
  roleEvalue: string;
  typeEvaluation: string;
  criteria: CriterionSeed[];
};

type PeriodSeed = {
  id: string;
  code: string;
  nom: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  statut: 'ouverte' | 'fermee' | 'planifiee';
  estOuverte: boolean;
  estCloturee: boolean;
};

type EvaluationSeed = {
  evaluateur: string;
  evalue: string;
  periodeCode: string;
  regleId: string;
  statut: 'brouillon' | 'soumis' | 'valide';
  type: string;
  notes: Array<{ nom: string; note: number; poids: number; commentaire?: string }>;
  commentaireGlobal: string | null;
  validateur?: string | null;
  commentaireValidation?: string | null;
  dateCreation: string;
  dateSoumission?: string | null;
  dateValidation?: string | null;
};

const BRANCHES: BrancheSeed[] = [
  { id: 'BR001', nom: 'Commercial', description: 'Branche commerciale' },
  { id: 'BR002', nom: 'Marketing', description: 'Branche marketing' },
  { id: 'BR003', nom: 'Sponsoring', description: 'Branche sponsoring et evenementiel' },
];

const REGIONS: RegionSeed[] = [
  { id: 'RG001', nom: 'Littoral', estTaniere: true },
  { id: 'RG002', nom: 'Centre', estTaniere: true },
  { id: 'RG003', nom: 'Ouest', estTaniere: false },
  { id: 'RG004', nom: 'Nord-Ouest', estTaniere: false },
  { id: 'RG005', nom: 'Sud-Ouest', estTaniere: true },
  { id: 'RG006', nom: 'Nord', estTaniere: false },
  { id: 'RG007', nom: 'Extreme-Nord', estTaniere: false },
  { id: 'RG008', nom: 'Est', estTaniere: false },
  { id: 'RG009', nom: 'Sud', estTaniere: true },
  { id: 'RG010', nom: 'Adamaoua', estTaniere: false },
];

const ROLES: RoleSeed[] = [
  {
    id: 'R0000',
    nom: 'ADMIN',
    brancheId: 'BR001',
    niveauTaniere: 0,
    niveauNonTaniere: 0,
    auto: false,
    pairs: false,
    subordonnes: true,
    crossBranch: true,
    portee: 'national',
    description: 'Administration globale de la plateforme',
  },
  {
    id: 'R0001',
    nom: 'DR',
    brancheId: 'BR001',
    niveauTaniere: 1,
    niveauNonTaniere: 1,
    auto: false,
    pairs: false,
    subordonnes: true,
    crossBranch: true,
    portee: 'region',
    description: 'Directeur regional',
  },
  {
    id: 'R0002',
    nom: 'CDTT',
    brancheId: 'BR002',
    niveauTaniere: 2,
    niveauNonTaniere: 2,
    auto: false,
    pairs: false,
    subordonnes: true,
    crossBranch: true,
    portee: 'region',
    description: 'Chef de departement trade',
  },
  {
    id: 'R0003',
    nom: 'CSC',
    brancheId: 'BR001',
    niveauTaniere: 4,
    niveauNonTaniere: 4,
    auto: true,
    pairs: true,
    subordonnes: false,
    crossBranch: false,
    portee: 'district',
    description: 'Chef service commercial',
  },
  {
    id: 'R0004',
    nom: 'CDV',
    brancheId: 'BR001',
    niveauTaniere: 3,
    niveauNonTaniere: 3,
    auto: true,
    pairs: true,
    subordonnes: true,
    crossBranch: false,
    portee: 'district',
    description: 'Chef district vente',
  },
  {
    id: 'R0005',
    nom: 'CDS',
    brancheId: 'BR001',
    niveauTaniere: 2,
    niveauNonTaniere: 2,
    auto: true,
    pairs: true,
    subordonnes: true,
    crossBranch: false,
    portee: 'region',
    description: 'Chef de secteur',
  },
  {
    id: 'R0006',
    nom: 'RTM',
    brancheId: 'BR002',
    niveauTaniere: 2,
    niveauNonTaniere: 2,
    auto: true,
    pairs: true,
    subordonnes: true,
    crossBranch: true,
    portee: 'region',
    description: 'Responsable trade marketing regional',
  },
  {
    id: 'R0007',
    nom: 'TMO',
    brancheId: 'BR002',
    niveauTaniere: 4,
    niveauNonTaniere: 4,
    auto: true,
    pairs: true,
    subordonnes: false,
    crossBranch: false,
    portee: 'region',
    description: 'Trade marketing officer',
  },
  {
    id: 'R0008',
    nom: 'SRMO',
    brancheId: 'BR002',
    niveauTaniere: 3,
    niveauNonTaniere: 3,
    auto: true,
    pairs: true,
    subordonnes: false,
    crossBranch: false,
    portee: 'region',
    description: 'Superviseur regional marketing operationnel',
  },
  {
    id: 'R0009',
    nom: 'SS',
    brancheId: 'BR003',
    niveauTaniere: 2,
    niveauNonTaniere: 2,
    auto: true,
    pairs: true,
    subordonnes: true,
    crossBranch: true,
    portee: 'region',
    description: 'Superviseur sponsoring',
  },
  {
    id: 'R0010',
    nom: 'AS',
    brancheId: 'BR003',
    niveauTaniere: 4,
    niveauNonTaniere: 4,
    auto: true,
    pairs: true,
    subordonnes: false,
    crossBranch: false,
    portee: 'region',
    description: 'Assistant sponsoring',
  },
];

// ----- Per-region user distribution -----
const REGION_DISTRIBUTION: Record<string, { role: string; roleId: string; brancheId: string; niveau: number; count: number }[]> = {};

for (const region of REGIONS) {
  // Taniere regions get slightly more staff
  const isTaniere = region.estTaniere;
  REGION_DISTRIBUTION[region.id] = [
    { role: 'DR', roleId: 'R0001', brancheId: 'BR001', niveau: 1, count: 1 },
    { role: 'CDTT', roleId: 'R0002', brancheId: 'BR002', niveau: 2, count: 1 },
    { role: 'CDS', roleId: 'R0005', brancheId: 'BR001', niveau: 2, count: isTaniere ? 2 : 1 },
    { role: 'CDV', roleId: 'R0004', brancheId: 'BR001', niveau: 3, count: isTaniere ? 2 : 1 },
    { role: 'CSC', roleId: 'R0003', brancheId: 'BR001', niveau: 4, count: 1 },
    { role: 'RTM', roleId: 'R0006', brancheId: 'BR002', niveau: 2, count: 1 },
    { role: 'TMO', roleId: 'R0007', brancheId: 'BR002', niveau: 4, count: isTaniere ? 3 : 2 },
    { role: 'SRMO', roleId: 'R0008', brancheId: 'BR002', niveau: 3, count: isTaniere ? 2 : 1 },
    { role: 'SS', roleId: 'R0009', brancheId: 'BR003', niveau: 2, count: 1 },
    { role: 'AS', roleId: 'R0010', brancheId: 'BR003', niveau: 4, count: isTaniere ? 4 : 2 },
  ];
}

// ----- Generate all users programmatically -----

function generateUsers(): UserSeed[] {
  const users: UserSeed[] = [];
  let globalIndex = 1;

  // 1. Admin user (demo account)
  users.push({
    matricule: 'A0001',
    nom: 'Admin',
    prenom: 'Systeme',
    email: 'admin@sabc.local',
    role: 'ADMIN',
    roleId: 'R0000',
    regionId: 'RG001',
    brancheId: 'BR001',
    managerMatricule: null,
    niveau: 0,
    estAdmin: true,
  });

  // Track matricules per role per region for hierarchy assignments
  const regionRoleUsers: Record<string, Record<string, string[]>> = {};

  for (const region of REGIONS) {
    const rIdx = REGIONS.indexOf(region) + 1;
    regionRoleUsers[region.id] = {};
    const distribution = REGION_DISTRIBUTION[region.id];

    for (const entry of distribution) {
      const matricules: string[] = [];

      for (let i = 0; i < entry.count; i++) {
        const idx = globalIndex++;
        // Pad matricule to 5 chars: role prefix letter + 4 digits
        const prefixMap: Record<string, string> = {
          DR: 'D', CDTT: 'X', CDS: 'S', CDV: 'V', CSC: 'C',
          RTM: 'M', TMO: 'T', SRMO: 'O', SS: 'P', AS: 'A',
        };
        const prefix = prefixMap[entry.role] || 'U';
        const matricule = `${prefix}${String(idx).padStart(4, '0')}`;

        // Demo accounts override for specific roles in Littoral
        let email = `user${idx}@sabc.local`;
        let nom = `Agent_${idx}`;
        let prenom = `Prenom_${idx}`;
        let overrideMatricule = matricule;

        // Keep demo accounts working for Littoral first instances
        if (region.id === 'RG001' && i === 0) {
          if (entry.role === 'DR') {
            overrideMatricule = 'D1010';
            email = 'dr.littoral@sabc.local';
            nom = 'Agent_DR_Littoral';
            prenom = 'Demo';
          } else if (entry.role === 'CDS') {
            overrideMatricule = 'S1110';
            email = 'cds.littoral@sabc.local';
            nom = 'Agent_CDS_Littoral';
            prenom = 'Demo';
          } else if (entry.role === 'TMO') {
            overrideMatricule = 'T1210';
            email = 'tmo.littoral@sabc.local';
            nom = 'Agent_TMO_Littoral';
            prenom = 'Demo';
          }
        }

        // Determine manager
        let managerMatricule: string | null = null;
        if (entry.role === 'DR') {
          managerMatricule = 'A0001'; // DR reports to Admin
        } else if (entry.role === 'CDTT') {
          // CDTT reports to DR of the region
          managerMatricule = regionRoleUsers[region.id]['DR']?.[0] ?? 'A0001';
        } else if (['CDS', 'RTM', 'SS'].includes(entry.role)) {
          // CDS, RTM, SS report to DR
          managerMatricule = regionRoleUsers[region.id]['DR']?.[0] ?? 'A0001';
        } else if (entry.role === 'CDV') {
          // CDV reports to DR
          managerMatricule = regionRoleUsers[region.id]['DR']?.[0] ?? 'A0001';
        } else if (entry.role === 'CSC') {
          // CSC reports to CDV (distribute across CDVs)
          const cdvs = regionRoleUsers[region.id]['CDV'] ?? [];
          managerMatricule = cdvs.length > 0 ? cdvs[i % cdvs.length] : (regionRoleUsers[region.id]['DR']?.[0] ?? 'A0001');
        } else if (['TMO', 'SRMO'].includes(entry.role)) {
          // TMO, SRMO report to RTM (distribute across RTMs)
          const rtms = regionRoleUsers[region.id]['RTM'] ?? [];
          managerMatricule = rtms.length > 0 ? rtms[i % rtms.length] : (regionRoleUsers[region.id]['DR']?.[0] ?? 'A0001');
        } else if (entry.role === 'AS') {
          // AS reports to SS (distribute across SSs)
          const sss = regionRoleUsers[region.id]['SS'] ?? [];
          managerMatricule = sss.length > 0 ? sss[i % sss.length] : (regionRoleUsers[region.id]['DR']?.[0] ?? 'A0001');
        }

        const finalMatricule = overrideMatricule !== matricule ? overrideMatricule : matricule;

        users.push({
          matricule: finalMatricule,
          nom,
          prenom,
          email,
          role: entry.role,
          roleId: entry.roleId,
          regionId: region.id,
          brancheId: entry.brancheId,
          managerMatricule,
          niveau: entry.niveau,
        });

        matricules.push(finalMatricule);
      }

      regionRoleUsers[region.id][entry.role] = matricules;
    }
  }

  return users;
}

const USERS: UserSeed[] = generateUsers();

const PERIODS: PeriodSeed[] = [
  {
    id: deterministicUuidFromString('P2601'),
    code: 'P2601',
    nom: 'Cycle 2026 - Semestre 1',
    titre: 'Cycle 2026 - Semestre 1',
    description: 'Periode active de demonstration locale',
    dateDebut: isoDateFromOffset(-15),
    dateFin: isoDateFromOffset(45),
    statut: 'ouverte',
    estOuverte: true,
    estCloturee: false,
  },
  {
    id: deterministicUuidFromString('P2502'),
    code: 'P2502',
    nom: 'Cycle 2025 - Semestre 2',
    titre: 'Cycle 2025 - Semestre 2',
    description: 'Periode precedente pour la progression',
    dateDebut: isoDateFromOffset(-220),
    dateFin: isoDateFromOffset(-130),
    statut: 'fermee',
    estOuverte: false,
    estCloturee: true,
  },
  {
    // Periode planifiee future SANS evaluation rattachee.
    // Permet de demontrer l'edition (autorisee uniquement si statut='planifiee')
    // ET la suppression (autorisee uniquement si aucune evaluation rattachee).
    id: deterministicUuidFromString('P2602'),
    code: 'P2602',
    nom: 'Cycle 2026 - Semestre 2',
    titre: 'Cycle 2026 - Semestre 2',
    description: 'Periode planifiee de demonstration (editable et supprimable)',
    dateDebut: '2026-09-07',
    dateFin: '2026-12-06',
    statut: 'planifiee',
    estOuverte: false,
    estCloturee: false,
  },
];

function deterministicUuidFromString(value: string): string {
  const hex = createHash('sha1').update(`${PERIODE_UUID_NAMESPACE}:${value}`).digest('hex').slice(0, 32);
  const chars = hex.split('');
  chars[12] = '5';
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  return `${chars.slice(0, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}-${chars.slice(16, 20).join('')}-${chars.slice(20, 32).join('')}`;
}

function isoDateFromOffset(offsetDays: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function isoTimestampFromOffset(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

// ----- Criteria bundles -----

function buildCriteriaBundle(domain: 'commercial' | 'marketing' | 'sponsoring' | 'trade'): CriterionSeed[] {
  const bundles: Record<string, CriterionSeed[]> = {
    commercial: [
      { id: 'couverture', libelle: 'Couverture terrain', description: 'Presence et couverture operationnelle', poids: 20, section: 'Execution terrain', ordreSection: 1, niveau: 4, axis: 'coverage', tags: ['terrain', 'coaching'] },
      { id: 'execution', libelle: 'Execution commerciale', description: 'Qualite d execution des actions terrain', poids: 20, section: 'Execution terrain', ordreSection: 1, niveau: 4, axis: 'execution', tags: ['execution', 'formation'] },
      { id: 'leadership', libelle: 'Leadership', description: 'Animation de l equipe et pilotage', poids: 20, section: 'Pilotage', ordreSection: 2, niveau: 4, axis: 'leadership', tags: ['leadership', 'mentorat'] },
      { id: 'communication', libelle: 'Communication', description: 'Partage de l information et coordination', poids: 20, section: 'Pilotage', ordreSection: 2, niveau: 3, axis: 'communication', tags: ['communication', 'coaching'] },
      { id: 'innovation', libelle: 'Initiative', description: 'Capacite a proposer des ameliorations', poids: 20, section: 'Developpement', ordreSection: 3, niveau: 3, axis: 'initiative', tags: ['innovation', 'mobilite'] },
    ],
    marketing: [
      { id: 'activation', libelle: 'Activation marche', description: 'Qualite des activations et campagnes', poids: 20, section: 'Operations marketing', ordreSection: 1, niveau: 4, axis: 'activation', tags: ['marketing', 'formation'] },
      { id: 'reporting', libelle: 'Reporting', description: 'Fiabilite du reporting et du suivi', poids: 20, section: 'Operations marketing', ordreSection: 1, niveau: 3, axis: 'reporting', tags: ['reporting', 'coaching'] },
      { id: 'coordination', libelle: 'Coordination', description: 'Coordination avec les equipes terrain', poids: 20, section: 'Pilotage', ordreSection: 2, niveau: 4, axis: 'coordination', tags: ['coordination', 'mentorat'] },
      { id: 'analyse', libelle: 'Analyse', description: 'Lecture des resultats et arbitrage', poids: 20, section: 'Pilotage', ordreSection: 2, niveau: 4, axis: 'analyse', tags: ['analyse', 'mobilite'] },
      { id: 'innovation', libelle: 'Creativite', description: 'Capacite a renouveler les activations', poids: 20, section: 'Innovation', ordreSection: 3, niveau: 3, axis: 'creativite', tags: ['innovation', 'hackathon'] },
    ],
    sponsoring: [
      { id: 'event', libelle: 'Gestion evenementielle', description: 'Preparation et suivi des evenements', poids: 20, section: 'Execution', ordreSection: 1, niveau: 4, axis: 'event', tags: ['event', 'formation'] },
      { id: 'partner', libelle: 'Relation partenaires', description: 'Qualite de relation avec les partenaires', poids: 20, section: 'Execution', ordreSection: 1, niveau: 4, axis: 'partner', tags: ['partenariats', 'coaching'] },
      { id: 'planning', libelle: 'Planification', description: 'Capacite a planifier et anticiper', poids: 20, section: 'Pilotage', ordreSection: 2, niveau: 3, axis: 'planning', tags: ['planning', 'mentorat'] },
      { id: 'communication', libelle: 'Communication', description: 'Communication sur les evenements et resultats', poids: 20, section: 'Pilotage', ordreSection: 2, niveau: 3, axis: 'communication', tags: ['communication', 'formation'] },
      { id: 'service', libelle: 'Qualite de service', description: 'Qualite du service rendu sur le terrain', poids: 20, section: 'Qualite', ordreSection: 3, niveau: 4, axis: 'service', tags: ['service', 'plan_developpement'] },
    ],
    trade: [
      { id: 'budget', libelle: 'Maitrise budgetaire', description: 'Gestion efficace des budgets trade', poids: 20, section: 'Pilotage trade', ordreSection: 1, niveau: 4, axis: 'budget', tags: ['budget', 'formation'] },
      { id: 'operateurs', libelle: 'Pilotage operateurs', description: 'Suivi des operateurs et partenaires trade', poids: 20, section: 'Pilotage trade', ordreSection: 1, niveau: 4, axis: 'operateurs', tags: ['operateurs', 'coaching'] },
      { id: 'execution', libelle: 'Execution trade', description: 'Deploiement des actions trade marketing', poids: 20, section: 'Execution', ordreSection: 2, niveau: 4, axis: 'execution', tags: ['execution', 'mentorat'] },
      { id: 'analyse', libelle: 'Analyse ROI', description: 'Analyse des resultats et rentabilite', poids: 20, section: 'Execution', ordreSection: 2, niveau: 4, axis: 'roi', tags: ['analyse', 'mobilite'] },
      { id: 'coordination', libelle: 'Coordination transverse', description: 'Coordination avec commercial et marketing', poids: 20, section: 'Collaboration', ordreSection: 3, niveau: 3, axis: 'coordination', tags: ['coordination', 'plan_developpement'] },
    ],
  };

  return bundles[domain];
}

// Extended criteria bundles for CDS (17 criteria), CDV (24 criteria), CSC (26 criteria)
function buildExtendedCriteria(role: 'CDS' | 'CDV' | 'CSC'): CriterionSeed[] {
  if (role === 'CDS') {
    return [
      // Technique (4)
      { id: 'maitrise_produit', libelle: 'Maitrise produit', description: 'Connaissance approfondie du portefeuille produit', poids: 7, section: 'Technique', ordreSection: 1, niveau: 4, axis: 'produit', tags: ['technique', 'formation'] },
      { id: 'techniques_commerciales', libelle: 'Techniques commerciales', description: 'Maitrise des techniques de vente et negociation', poids: 7, section: 'Technique', ordreSection: 1, niveau: 4, axis: 'vente', tags: ['technique', 'coaching'] },
      { id: 'gestion_temporelle', libelle: 'Gestion temporelle', description: 'Organisation du temps et respect des echeances', poids: 6, section: 'Technique', ordreSection: 1, niveau: 3, axis: 'temps', tags: ['technique', 'mentorat'] },
      { id: 'negociation', libelle: 'Negociation', description: 'Capacite de negociation avec les clients cles', poids: 5, section: 'Technique', ordreSection: 1, niveau: 4, axis: 'negociation', tags: ['technique', 'formation'] },
      // Analytique (4)
      { id: 'analyse_donnees', libelle: 'Analyse donnees', description: 'Exploitation des donnees de vente', poids: 7, section: 'Analytique', ordreSection: 2, niveau: 4, axis: 'analyse', tags: ['analytique', 'formation'] },
      { id: 'reporting_cds', libelle: 'Reporting', description: 'Qualite et regularite du reporting', poids: 6, section: 'Analytique', ordreSection: 2, niveau: 3, axis: 'reporting', tags: ['analytique', 'coaching'] },
      { id: 'outils_analytiques', libelle: 'Outils analytiques', description: 'Maitrise des outils d analyse et de suivi', poids: 5, section: 'Analytique', ordreSection: 2, niveau: 3, axis: 'outils', tags: ['analytique', 'mentorat'] },
      { id: 'veille_marche', libelle: 'Veille marche', description: 'Suivi des tendances et de la concurrence', poids: 5, section: 'Analytique', ordreSection: 2, niveau: 3, axis: 'veille', tags: ['analytique', 'mobilite'] },
      // Organisation (3)
      { id: 'organisation_info', libelle: 'Organisation info', description: 'Structuration et diffusion de l information', poids: 6, section: 'Organisation', ordreSection: 3, niveau: 3, axis: 'organisation', tags: ['organisation', 'formation'] },
      { id: 'suivi_activite', libelle: 'Suivi activite', description: 'Suivi regulier des indicateurs d activite', poids: 7, section: 'Organisation', ordreSection: 3, niveau: 4, axis: 'suivi', tags: ['organisation', 'coaching'] },
      { id: 'priorisation', libelle: 'Priorisation', description: 'Capacite a prioriser les actions a fort impact', poids: 6, section: 'Organisation', ordreSection: 3, niveau: 3, axis: 'priorisation', tags: ['organisation', 'mentorat'] },
      // Comportemental (6)
      { id: 'ecoute', libelle: 'Ecoute', description: 'Ecoute active des collaborateurs et clients', poids: 5, section: 'Comportemental', ordreSection: 4, niveau: 3, axis: 'ecoute', tags: ['comportemental', 'formation'] },
      { id: 'influence', libelle: 'Influence', description: 'Capacite d influence positive sur l equipe', poids: 5, section: 'Comportemental', ordreSection: 4, niveau: 4, axis: 'influence', tags: ['comportemental', 'coaching'] },
      { id: 'respect_collegues', libelle: 'Respect collegues', description: 'Respect et consideration envers les collegues', poids: 4, section: 'Comportemental', ordreSection: 4, niveau: 3, axis: 'respect', tags: ['comportemental', 'mentorat'] },
      { id: 'empathie', libelle: 'Empathie', description: 'Capacite a comprendre les enjeux des collaborateurs', poids: 4, section: 'Comportemental', ordreSection: 4, niveau: 3, axis: 'empathie', tags: ['comportemental', 'formation'] },
      { id: 'esprit_equipe', libelle: 'Esprit equipe', description: 'Contribution au collectif et a la cohesion', poids: 5, section: 'Comportemental', ordreSection: 4, niveau: 3, axis: 'equipe', tags: ['comportemental', 'coaching'] },
      { id: 'initiative_cds', libelle: 'Initiative', description: 'Prise d initiative et force de proposition', poids: 4, section: 'Comportemental', ordreSection: 4, niveau: 3, axis: 'initiative', tags: ['comportemental', 'mobilite'] },
    ];
  }
  if (role === 'CDV') {
    return [
      // Management terrain (6)
      { id: 'animation_equipe', libelle: 'Animation equipe', description: 'Capacite a animer et motiver l equipe terrain', poids: 5, section: 'Management terrain', ordreSection: 1, niveau: 4, axis: 'animation', tags: ['management', 'coaching'] },
      { id: 'coaching_terrain', libelle: 'Coaching terrain', description: 'Accompagnement et coaching des equipes', poids: 5, section: 'Management terrain', ordreSection: 1, niveau: 4, axis: 'coaching', tags: ['management', 'formation'] },
      { id: 'suivi_objectifs', libelle: 'Suivi objectifs', description: 'Suivi rigoureux des objectifs de vente', poids: 5, section: 'Management terrain', ordreSection: 1, niveau: 4, axis: 'objectifs', tags: ['management', 'mentorat'] },
      { id: 'pilotage_district', libelle: 'Pilotage district', description: 'Pilotage global du district', poids: 5, section: 'Management terrain', ordreSection: 1, niveau: 4, axis: 'pilotage', tags: ['management', 'coaching'] },
      { id: 'resolution_conflits', libelle: 'Resolution conflits', description: 'Gestion des conflits internes et externes', poids: 4, section: 'Management terrain', ordreSection: 1, niveau: 3, axis: 'conflits', tags: ['management', 'formation'] },
      { id: 'delegation', libelle: 'Delegation', description: 'Capacite a deleguer efficacement', poids: 4, section: 'Management terrain', ordreSection: 1, niveau: 3, axis: 'delegation', tags: ['management', 'mentorat'] },
      // Performance commerciale (6)
      { id: 'chiffre_affaires', libelle: 'Chiffre affaires', description: 'Atteinte des objectifs de chiffre d affaires', poids: 5, section: 'Performance commerciale', ordreSection: 2, niveau: 4, axis: 'ca', tags: ['performance', 'coaching'] },
      { id: 'part_marche', libelle: 'Part de marche', description: 'Evolution de la part de marche du district', poids: 5, section: 'Performance commerciale', ordreSection: 2, niveau: 4, axis: 'pdm', tags: ['performance', 'formation'] },
      { id: 'couverture_points', libelle: 'Couverture points de vente', description: 'Taux de couverture des points de vente', poids: 4, section: 'Performance commerciale', ordreSection: 2, niveau: 4, axis: 'couverture', tags: ['performance', 'mentorat'] },
      { id: 'qualite_distribution', libelle: 'Qualite distribution', description: 'Qualite du reseau de distribution', poids: 4, section: 'Performance commerciale', ordreSection: 2, niveau: 3, axis: 'distribution', tags: ['performance', 'coaching'] },
      { id: 'gestion_stocks', libelle: 'Gestion stocks', description: 'Optimisation des niveaux de stock', poids: 4, section: 'Performance commerciale', ordreSection: 2, niveau: 3, axis: 'stocks', tags: ['performance', 'formation'] },
      { id: 'recouvrement', libelle: 'Recouvrement', description: 'Efficacite du recouvrement des creances', poids: 4, section: 'Performance commerciale', ordreSection: 2, niveau: 4, axis: 'recouvrement', tags: ['performance', 'mentorat'] },
      // Strategie (6)
      { id: 'plan_action', libelle: 'Plan d action', description: 'Elaboration et suivi des plans d action', poids: 4, section: 'Strategie', ordreSection: 3, niveau: 3, axis: 'planification', tags: ['strategie', 'coaching'] },
      { id: 'analyse_concurrence', libelle: 'Analyse concurrence', description: 'Veille concurrentielle et adaptation', poids: 4, section: 'Strategie', ordreSection: 3, niveau: 3, axis: 'concurrence', tags: ['strategie', 'formation'] },
      { id: 'innovation_cdv', libelle: 'Innovation commerciale', description: 'Propositions innovantes pour le district', poids: 3, section: 'Strategie', ordreSection: 3, niveau: 3, axis: 'innovation', tags: ['strategie', 'mentorat'] },
      { id: 'relation_clients', libelle: 'Relation clients cles', description: 'Gestion de la relation avec les clients strategiques', poids: 4, section: 'Strategie', ordreSection: 3, niveau: 4, axis: 'clients', tags: ['strategie', 'coaching'] },
      { id: 'gestion_budget_cdv', libelle: 'Gestion budget', description: 'Maitrise du budget du district', poids: 4, section: 'Strategie', ordreSection: 3, niveau: 3, axis: 'budget', tags: ['strategie', 'formation'] },
      { id: 'prospection', libelle: 'Prospection', description: 'Developpement de nouveaux marches', poids: 3, section: 'Strategie', ordreSection: 3, niveau: 3, axis: 'prospection', tags: ['strategie', 'mobilite'] },
      // Communication (6)
      { id: 'reporting_cdv', libelle: 'Reporting CDV', description: 'Qualite et regularite du reporting', poids: 4, section: 'Communication', ordreSection: 4, niveau: 3, axis: 'reporting', tags: ['communication', 'coaching'] },
      { id: 'communication_equipe', libelle: 'Communication equipe', description: 'Communication interne avec l equipe', poids: 3, section: 'Communication', ordreSection: 4, niveau: 3, axis: 'com_interne', tags: ['communication', 'formation'] },
      { id: 'communication_direction', libelle: 'Communication direction', description: 'Communication avec la direction regionale', poids: 3, section: 'Communication', ordreSection: 4, niveau: 3, axis: 'com_direction', tags: ['communication', 'mentorat'] },
      { id: 'presentation', libelle: 'Presentation', description: 'Qualite des presentations et syntheses', poids: 3, section: 'Communication', ordreSection: 4, niveau: 3, axis: 'presentation', tags: ['communication', 'coaching'] },
      { id: 'ecoute_cdv', libelle: 'Ecoute active', description: 'Capacite d ecoute et de feedback', poids: 3, section: 'Communication', ordreSection: 4, niveau: 3, axis: 'ecoute', tags: ['communication', 'formation'] },
      { id: 'esprit_equipe_cdv', libelle: 'Esprit equipe CDV', description: 'Travail collaboratif avec les autres districts', poids: 3, section: 'Communication', ordreSection: 4, niveau: 3, axis: 'equipe', tags: ['communication', 'mentorat'] },
    ];
  }
  // CSC - 26 criteria
  return [
    // Execution commerciale (7)
    { id: 'presence_terrain', libelle: 'Presence terrain', description: 'Regularite de la presence sur le terrain', poids: 4, section: 'Execution commerciale', ordreSection: 1, niveau: 4, axis: 'presence', tags: ['execution', 'coaching'] },
    { id: 'visites_clients', libelle: 'Visites clients', description: 'Nombre et qualite des visites clients', poids: 4, section: 'Execution commerciale', ordreSection: 1, niveau: 4, axis: 'visites', tags: ['execution', 'formation'] },
    { id: 'merchandising', libelle: 'Merchandising', description: 'Qualite de la mise en rayon et de la visibilite', poids: 4, section: 'Execution commerciale', ordreSection: 1, niveau: 4, axis: 'merchandising', tags: ['execution', 'mentorat'] },
    { id: 'prise_commande', libelle: 'Prise de commande', description: 'Efficacite dans la prise de commande', poids: 4, section: 'Execution commerciale', ordreSection: 1, niveau: 4, axis: 'commande', tags: ['execution', 'coaching'] },
    { id: 'livraison', libelle: 'Suivi livraison', description: 'Suivi de la livraison et satisfaction client', poids: 3, section: 'Execution commerciale', ordreSection: 1, niveau: 3, axis: 'livraison', tags: ['execution', 'formation'] },
    { id: 'recouvrement_csc', libelle: 'Recouvrement', description: 'Suivi du recouvrement des impayees', poids: 4, section: 'Execution commerciale', ordreSection: 1, niveau: 4, axis: 'recouvrement', tags: ['execution', 'mentorat'] },
    { id: 'prospection_csc', libelle: 'Prospection', description: 'Ouverture de nouveaux points de vente', poids: 3, section: 'Execution commerciale', ordreSection: 1, niveau: 3, axis: 'prospection', tags: ['execution', 'coaching'] },
    // Connaissance produit (5)
    { id: 'gamme_produit', libelle: 'Gamme produit', description: 'Connaissance de la gamme de produits', poids: 4, section: 'Connaissance produit', ordreSection: 2, niveau: 4, axis: 'gamme', tags: ['produit', 'formation'] },
    { id: 'argumentation', libelle: 'Argumentation', description: 'Qualite de l argumentaire commercial', poids: 4, section: 'Connaissance produit', ordreSection: 2, niveau: 4, axis: 'argumentaire', tags: ['produit', 'coaching'] },
    { id: 'connaissance_concurrence', libelle: 'Connaissance concurrence', description: 'Connaissance des produits et strategies concurrents', poids: 3, section: 'Connaissance produit', ordreSection: 2, niveau: 3, axis: 'concurrence', tags: ['produit', 'mentorat'] },
    { id: 'formation_continue', libelle: 'Formation continue', description: 'Engagement dans la formation continue', poids: 3, section: 'Connaissance produit', ordreSection: 2, niveau: 3, axis: 'autoformation', tags: ['produit', 'formation'] },
    { id: 'promotion_nouveautes', libelle: 'Promotion nouveautes', description: 'Promotion active des nouveaux produits', poids: 4, section: 'Connaissance produit', ordreSection: 2, niveau: 4, axis: 'nouveautes', tags: ['produit', 'coaching'] },
    // Organisation et suivi (7)
    { id: 'planification_tournees', libelle: 'Planification tournees', description: 'Organisation des tournees terrain', poids: 4, section: 'Organisation et suivi', ordreSection: 3, niveau: 4, axis: 'tournees', tags: ['organisation', 'formation'] },
    { id: 'reporting_csc', libelle: 'Reporting CSC', description: 'Fiabilite et ponctualite du reporting', poids: 4, section: 'Organisation et suivi', ordreSection: 3, niveau: 3, axis: 'reporting', tags: ['organisation', 'coaching'] },
    { id: 'gestion_temps_csc', libelle: 'Gestion du temps', description: 'Optimisation du temps de travail', poids: 3, section: 'Organisation et suivi', ordreSection: 3, niveau: 3, axis: 'temps', tags: ['organisation', 'mentorat'] },
    { id: 'utilisation_outils', libelle: 'Utilisation outils', description: 'Maitrise des outils digitaux', poids: 3, section: 'Organisation et suivi', ordreSection: 3, niveau: 3, axis: 'outils', tags: ['organisation', 'formation'] },
    { id: 'suivi_kpi', libelle: 'Suivi KPI', description: 'Suivi regulier des indicateurs de performance', poids: 4, section: 'Organisation et suivi', ordreSection: 3, niveau: 4, axis: 'kpi', tags: ['organisation', 'coaching'] },
    { id: 'archivage', libelle: 'Archivage', description: 'Tenue et archivage des documents commerciaux', poids: 3, section: 'Organisation et suivi', ordreSection: 3, niveau: 3, axis: 'archivage', tags: ['organisation', 'mentorat'] },
    { id: 'gestion_reclamations', libelle: 'Gestion reclamations', description: 'Traitement des reclamations clients', poids: 3, section: 'Organisation et suivi', ordreSection: 3, niveau: 3, axis: 'reclamations', tags: ['organisation', 'formation'] },
    // Comportement professionnel (7)
    { id: 'ponctualite', libelle: 'Ponctualite', description: 'Respect des horaires et des echeances', poids: 4, section: 'Comportement professionnel', ordreSection: 4, niveau: 3, axis: 'ponctualite', tags: ['comportement', 'coaching'] },
    { id: 'attitude', libelle: 'Attitude professionnelle', description: 'Comportement professionnel avec clients et collegues', poids: 4, section: 'Comportement professionnel', ordreSection: 4, niveau: 3, axis: 'attitude', tags: ['comportement', 'formation'] },
    { id: 'autonomie', libelle: 'Autonomie', description: 'Capacite a travailler de maniere autonome', poids: 3, section: 'Comportement professionnel', ordreSection: 4, niveau: 3, axis: 'autonomie', tags: ['comportement', 'mentorat'] },
    { id: 'resilience', libelle: 'Resilience', description: 'Capacite a rebondir face aux difficultes', poids: 3, section: 'Comportement professionnel', ordreSection: 4, niveau: 3, axis: 'resilience', tags: ['comportement', 'coaching'] },
    { id: 'ethique', libelle: 'Ethique', description: 'Respect des regles et de l ethique professionnelle', poids: 4, section: 'Comportement professionnel', ordreSection: 4, niveau: 4, axis: 'ethique', tags: ['comportement', 'formation'] },
    { id: 'esprit_equipe_csc', libelle: 'Esprit equipe', description: 'Travail d equipe et solidarite', poids: 3, section: 'Comportement professionnel', ordreSection: 4, niveau: 3, axis: 'equipe', tags: ['comportement', 'mentorat'] },
    { id: 'proactivite', libelle: 'Proactivite', description: 'Anticipation des besoins et prise d initiative', poids: 3, section: 'Comportement professionnel', ordreSection: 4, niveau: 3, axis: 'proactivite', tags: ['comportement', 'coaching'] },
  ];
}

function buildRuleEnvelope(criteria: CriterionSeed[]) {
  const sections = Array.from(
    criteria.reduce((map, criterion) => {
      const key = `${criterion.ordreSection}:${criterion.section}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          titre: criterion.section,
          description: '',
          ordre: criterion.ordreSection,
          competences: [],
        });
      }

      map.get(key)!.competences.push({
        id: criterion.id,
        libelle: criterion.libelle,
        description: criterion.description,
        niveau_requis: criterion.niveau,
        ordre: map.get(key)!.competences.length + 1,
      });

      return map;
    }, new Map<string, any>()),
  ).map(([, value]) => value);

  return {
    version: 1,
    sections,
    criteres: criteria.map((criterion) => ({
      id: criterion.id,
      libelle: criterion.libelle,
      description: criterion.description,
      poids: criterion.poids,
      section_label: criterion.section,
      section_order: criterion.ordreSection,
      niveau_requis: criterion.niveau,
      improvement_axis_code: criterion.axis,
      recommendation_tags: criterion.tags,
      commentaire_requis_si_note_lt: criterion.commentaireSeuil ?? 3,
      echelle: { min: 1, max: 5 },
    })),
    visibility_policy: {
      evaluated: true,
      manager_n1: true,
      upper_management: true,
      admin: true,
      detail: 'aggregated',
    },
    analytics_metadata: {
      individual_dashboard: true,
      team_dashboard: true,
      admin_dashboard: true,
      alerts: true,
      improvement_plans: true,
    },
  };
}

const ROLE_DOMAIN: Record<string, 'commercial' | 'marketing' | 'sponsoring' | 'trade'> = {
  CDTT: 'trade',
  CDS: 'commercial',
  CDV: 'commercial',
  CSC: 'commercial',
  RTM: 'marketing',
  TMO: 'marketing',
  SRMO: 'marketing',
  SS: 'sponsoring',
  AS: 'sponsoring',
};

const RULE_SPECS: RuleSeed[] = [
  { nom: 'DR vers CDS', description: 'Evaluation descendante des CDS', roleEvaluateur: 'DR', roleEvalue: 'CDS', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('commercial') },
  { nom: 'DR vers RTM', description: 'Evaluation descendante des RTM', roleEvaluateur: 'DR', roleEvalue: 'RTM', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('marketing') },
  { nom: 'DR vers SS', description: 'Evaluation descendante des SS', roleEvaluateur: 'DR', roleEvalue: 'SS', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('sponsoring') },
  { nom: 'DR vers CDTT', description: 'Evaluation descendante des CDTT', roleEvaluateur: 'DR', roleEvalue: 'CDTT', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('trade') },
  { nom: 'CDS vers CDV', description: 'Evaluation descendante des CDV', roleEvaluateur: 'CDS', roleEvalue: 'CDV', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('commercial') },
  { nom: 'CDS vers CSC', description: 'Evaluation descendante des CSC', roleEvaluateur: 'CDS', roleEvalue: 'CSC', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('commercial') },
  { nom: 'RTM vers TMO', description: 'Evaluation descendante des TMO', roleEvaluateur: 'RTM', roleEvalue: 'TMO', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('marketing') },
  { nom: 'RTM vers SRMO', description: 'Evaluation descendante des SRMO', roleEvaluateur: 'RTM', roleEvalue: 'SRMO', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('marketing') },
  { nom: 'SS vers AS', description: 'Evaluation descendante des AS', roleEvaluateur: 'SS', roleEvalue: 'AS', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('sponsoring') },
  { nom: 'CDV vers CSC', description: 'Evaluation descendante des CSC par CDV', roleEvaluateur: 'CDV', roleEvalue: 'CSC', typeEvaluation: 'descendante', criteria: buildCriteriaBundle('commercial') },
  { nom: 'Auto CDS', description: 'Auto-evaluation des CDS', roleEvaluateur: 'CDS', roleEvalue: 'CDS', typeEvaluation: 'auto', criteria: buildCriteriaBundle('commercial') },
  { nom: 'Auto CDV', description: 'Auto-evaluation des CDV', roleEvaluateur: 'CDV', roleEvalue: 'CDV', typeEvaluation: 'auto', criteria: buildCriteriaBundle('commercial') },
  { nom: 'Auto CSC', description: 'Auto-evaluation des CSC', roleEvaluateur: 'CSC', roleEvalue: 'CSC', typeEvaluation: 'auto', criteria: buildCriteriaBundle('commercial') },
  { nom: 'Auto RTM', description: 'Auto-evaluation des RTM', roleEvaluateur: 'RTM', roleEvalue: 'RTM', typeEvaluation: 'auto', criteria: buildCriteriaBundle('marketing') },
  { nom: 'Auto TMO', description: 'Auto-evaluation des TMO', roleEvaluateur: 'TMO', roleEvalue: 'TMO', typeEvaluation: 'auto', criteria: buildCriteriaBundle('marketing') },
  { nom: 'Auto SRMO', description: 'Auto-evaluation des SRMO', roleEvaluateur: 'SRMO', roleEvalue: 'SRMO', typeEvaluation: 'auto', criteria: buildCriteriaBundle('marketing') },
  { nom: 'Auto SS', description: 'Auto-evaluation des SS', roleEvaluateur: 'SS', roleEvalue: 'SS', typeEvaluation: 'auto', criteria: buildCriteriaBundle('sponsoring') },
  { nom: 'Auto AS', description: 'Auto-evaluation des AS', roleEvaluateur: 'AS', roleEvalue: 'AS', typeEvaluation: 'auto', criteria: buildCriteriaBundle('sponsoring') },
];

// ----- Seeded RNG for reproducibility -----
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

const rng = new SeededRandom(42);

// ----- DB helper functions -----

async function pgQueryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  const result = await pg.query(sql, params);
  return (result.rows[0] as T | undefined) ?? null;
}

async function ensureBranche(branche: BrancheSeed) {
  const existing = await prisma.branche.findFirst({
    where: {
      OR: [{ id_branche: branche.id }, { nom_branche: branche.nom }],
    },
  });

  if (existing) {
    return prisma.branche.update({
      where: { id_branche: existing.id_branche },
      data: { nom_branche: branche.nom, description: branche.description },
    });
  }

  return prisma.branche.create({
    data: {
      id_branche: branche.id,
      nom_branche: branche.nom,
      description: branche.description,
    },
  });
}

async function ensureRegion(region: RegionSeed) {
  const existing = await prisma.region.findFirst({
    where: {
      OR: [{ id_region: region.id }, { nom_region: region.nom }],
    },
  });

  if (existing) {
    return prisma.region.update({
      where: { id_region: existing.id_region },
      data: { nom_region: region.nom, est_taniere: region.estTaniere },
    });
  }

  return prisma.region.create({
    data: {
      id_region: region.id,
      nom_region: region.nom,
      est_taniere: region.estTaniere,
    },
  });
}

async function ensureRole(role: RoleSeed) {
  const existing = await prisma.role.findFirst({
    where: {
      OR: [{ id_role: role.id }, { nom_role: role.nom }],
    },
  });

  const data = {
    nom_role: role.nom,
    description: role.description,
    id_branche: role.brancheId,
    niveau_taniere: role.niveauTaniere,
    niveau_non_taniere: role.niveauNonTaniere,
    peut_auto_evaluer: role.auto,
    peut_evaluer_pairs: role.pairs,
    peut_evaluer_subordonnes: role.subordonnes,
    peut_cross_branch: role.crossBranch,
    role_principal_equivalent: role.nom,
    peut_remplacer_roles: role.nom,
    portee_geographique: role.portee,
  };
  const createData = {
    id_role: role.id,
    ...data,
  };

  if (existing) {
    return prisma.role.update({
      where: { id_role: existing.id_role },
      data,
    });
  }

  return prisma.role.create({ data: createData });
}

async function resetData() {
  await prisma.$executeRawUnsafe('DELETE FROM logs_administration');
  await prisma.utilisateur.deleteMany();

  await prisma.$executeRawUnsafe('DELETE FROM notifications_utilisateurs');
  await prisma.$executeRawUnsafe('DELETE FROM replacement_temporaire');

  await pg.query('DELETE FROM evaluations');
  await pg.query('DELETE FROM scores_utilisateurs').catch(() => undefined);
  await pg.query('DELETE FROM templates_roles_periodes');
  await pg.query('DELETE FROM templates');
  await pg.query('DELETE FROM regles_evaluation');
  await pg.query('DELETE FROM periodes_evaluation');
  await pg.query('DELETE FROM utilisateurs_ref');
}

// ----- Core seeding -----

async function seedCore() {
  const branchIds = new Map<string, string>();
  const regions = new Map<string, { id: string; nom: string; estTaniere: boolean }>();
  const roleIdsByName = new Map<string, string>();

  for (const branche of BRANCHES) {
    const saved = await ensureBranche(branche);
    branchIds.set(branche.id, saved.id_branche);
  }

  for (const region of REGIONS) {
    const saved = await ensureRegion(region);
    regions.set(region.id, {
      id: saved.id_region,
      nom: saved.nom_region,
      estTaniere: saved.est_taniere,
    });
  }

  for (const role of ROLES) {
    const saved = await ensureRole({
      ...role,
      brancheId: branchIds.get(role.brancheId) ?? role.brancheId,
    });
    roleIdsByName.set(role.nom, saved.id_role);
  }

  // Insert users in batches -- Prisma createMany for MySQL
  const BATCH_SIZE = 50;
  for (let i = 0; i < USERS.length; i += BATCH_SIZE) {
    const batch = USERS.slice(i, i + BATCH_SIZE);
    const createData = batch.map((user) => {
      const region = regions.get(user.regionId);
      return {
        matricule: user.matricule,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: null,
        password: PASSWORD_HASH,
        role: user.role,
        role_nom: user.role,
        manager_matricule: user.managerMatricule,
        niveau_hierarchique: user.niveau,
        id_region: region?.id ?? user.regionId,
        id_branche: branchIds.get(user.brancheId) ?? user.brancheId,
        est_actif: true,
        est_admin: user.estAdmin ?? false,
        est_indisponible: user.estIndisponible ?? false,
        statut: user.statut ?? 'Actif',
        region_nom: region?.nom ?? user.regionId,
        type_region: user.typeRegion ?? (region?.estTaniere ? 'taniere' : 'non-taniere'),
        roles_support_json: '[]',
      };
    });

    // Use individual creates to respect foreign key ordering (manager_matricule)
    for (const data of createData) {
      await prisma.utilisateur.create({ data });
    }
  }

  return { branchIds, regions, roleIdsByName };
}

// ----- Sync PG user refs -----

async function syncUserRefs(regions: Map<string, { id: string; nom: string; estTaniere: boolean }>, branchIds: Map<string, string>) {
  // Batch insert into PG in groups of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < USERS.length; i += BATCH_SIZE) {
    const batch = USERS.slice(i, i + BATCH_SIZE);
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const user of batch) {
      const region = regions.get(user.regionId);
      values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, TRUE, NOW(), NOW())`);
      params.push(
        user.matricule,
        user.nom,
        user.prenom,
        user.email,
        user.role,
        region?.id ?? user.regionId,
        branchIds.get(user.brancheId) ?? user.brancheId,
        region?.nom ?? user.regionId,
        region?.estTaniere ? 'taniere' : 'non-taniere',
      );
      paramIdx += 9;
    }

    await pg.query(
      `INSERT INTO utilisateurs_ref (
         matricule, nom, prenom, email, role, id_region, id_branche,
         region_nom, type_region, est_actif, created_at, updated_at
       ) VALUES ${values.join(', ')}
       ON CONFLICT (matricule) DO UPDATE SET
         nom = EXCLUDED.nom,
         prenom = EXCLUDED.prenom,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         id_region = EXCLUDED.id_region,
         id_branche = EXCLUDED.id_branche,
         region_nom = EXCLUDED.region_nom,
         type_region = EXCLUDED.type_region,
         est_actif = EXCLUDED.est_actif,
         updated_at = NOW()`,
      params,
    );
  }
}

// ----- Periods, rules, templates -----

async function upsertPeriode(period: PeriodSeed) {
  await pg.query(
    `INSERT INTO periodes_evaluation (
       id_periode, code_periode, nom_periode, titre, description, date_debut, date_fin,
       statut, est_ouverte, est_cloturee, nb_evaluations_attendues, nb_evaluations_completees,
       taux_completion, statistiques_json, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0, 0, '{}'::json, NOW(), NOW()
     )
     ON CONFLICT (id_periode) DO UPDATE SET
       code_periode = EXCLUDED.code_periode,
       nom_periode = EXCLUDED.nom_periode,
       titre = EXCLUDED.titre,
       description = EXCLUDED.description,
       date_debut = EXCLUDED.date_debut,
       date_fin = EXCLUDED.date_fin,
       statut = EXCLUDED.statut,
       est_ouverte = EXCLUDED.est_ouverte,
       est_cloturee = EXCLUDED.est_cloturee,
       updated_at = NOW()`,
    [
      period.id,
      period.code,
      period.nom,
      period.titre,
      period.description,
      period.dateDebut,
      period.dateFin,
      period.statut,
      period.estOuverte,
      period.estCloturee,
    ],
  );
}

async function upsertRule(rule: RuleSeed) {
  await pg.query(
    `INSERT INTO regles_evaluation (
       nom_regle, description, criteres_evaluation_json, est_active,
       role_evaluateur, role_evalue, type_evaluation, created_at, updated_at
     ) VALUES ($1, $2, $3::json, TRUE, $4, $5, $6, NOW(), NOW())
     ON CONFLICT (role_evaluateur, role_evalue, type_evaluation) DO UPDATE SET
       nom_regle = EXCLUDED.nom_regle,
       description = EXCLUDED.description,
       criteres_evaluation_json = EXCLUDED.criteres_evaluation_json,
       est_active = TRUE,
       updated_at = NOW()`,
    [
      rule.nom,
      rule.description,
      JSON.stringify(buildRuleEnvelope(rule.criteria)),
      rule.roleEvaluateur,
      rule.roleEvalue,
      rule.typeEvaluation,
    ],
  );

  const inserted = await pgQueryOne<{ id_regle: string }>(
    `SELECT id_regle
     FROM regles_evaluation
     WHERE role_evaluateur = $1 AND role_evalue = $2 AND type_evaluation = $3`,
    [rule.roleEvaluateur, rule.roleEvalue, rule.typeEvaluation],
  );

  if (!inserted) {
    throw new Error(`Impossible de recuperer la regle ${rule.nom}`);
  }

  return inserted.id_regle;
}

async function upsertTemplate(template: {
  id: string;
  nom: string;
  description: string;
  evaluatedRole: string;
  criteria: CriterionSeed[];
}) {
  const sections = buildRuleEnvelope(template.criteria).sections;
  await pg.query(
    `INSERT INTO templates
     (id_template, nom, description, evaluated_role, version, statut, meta_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 1, 'published', $5::json, NOW(), NOW())
     ON CONFLICT (id_template) DO UPDATE SET
       nom = EXCLUDED.nom,
       description = EXCLUDED.description,
       evaluated_role = EXCLUDED.evaluated_role,
       statut = 'published',
       meta_json = EXCLUDED.meta_json,
       updated_at = NOW()`,
    [
      template.id,
      template.nom,
      template.description,
      template.evaluatedRole,
      JSON.stringify({
        categorie: template.evaluatedRole,
        sections,
      }),
    ],
  );
}

async function assignTemplate(roleId: string, periodId: string, templateId: string) {
  await pg.query(
    `INSERT INTO templates_roles_periodes (id_role, id_periode, id_template, est_actif, created_at, updated_at)
     VALUES ($1, $2, $3, TRUE, NOW(), NOW())
     ON CONFLICT (id_role, id_periode) DO UPDATE SET
       id_template = EXCLUDED.id_template,
       est_actif = TRUE,
       updated_at = NOW()`,
    [roleId, periodId, templateId],
  );
}

function makeNotes(criteria: CriterionSeed[], scores: number[], comments: string[] = []) {
  return criteria.map((criterion, index) => ({
    nom: criterion.libelle,
    critere_id: criterion.id,
    note: scores[index] ?? 3,
    poids: criterion.poids,
    commentaire: comments[index] ?? null,
    categorie: criterion.section,
  }));
}

function averageFromNotes(notes: Array<{ note: number; poids: number }>) {
  const totalWeight = notes.reduce((sum, note) => sum + (note.poids || 0), 0);
  if (!totalWeight) return null;
  const weighted = notes.reduce((sum, note) => sum + note.note * note.poids, 0) / totalWeight;
  return Math.round(weighted * 100) / 100;
}

// Generate random scores for a criteria bundle
function randomScores(criteria: CriterionSeed[], min: number, max: number): number[] {
  return criteria.map(() => Math.round(rng.float(min, max) * 10) / 10);
}

// Generate random comment from a pool
const COMMENTS_POOL = [
  'Bonne progression ce cycle',
  'Performance reguliere',
  'Axes d amelioration identifies',
  'Bonne maitrise du poste',
  'Besoin de renforcement terrain',
  'Coordination a ameliorer',
  'Excellent travail d equipe',
  'Objectifs atteints',
  'Objectifs partiellement atteints',
  'Forte implication',
  'Engagement remarquable',
  'Des progres notables',
  'Maintenir la dynamique',
  'Plan de developpement necessaire',
  'Communication efficace',
  'Pilotage terrain satisfaisant',
  'Besoin de coaching supplementaire',
  'Bon relationnel',
  'Rigueur appreciee',
  'Resultats en deca des attentes',
];

const GLOBAL_COMMENTS = [
  'Evaluation globale positive avec quelques axes de progres.',
  'Collaborateur fiable et regulier.',
  'Performance a renforcer sur les fondamentaux.',
  'Tres bon cycle, objectifs depasses.',
  'Niveau satisfaisant, continuer les efforts.',
  'Evaluation a discuter lors de l entretien.',
  'Progres significatifs par rapport au cycle precedent.',
  'Performance stable et coherente.',
  'Des difficultes rencontrees ce cycle necessitant un accompagnement.',
  'Collaborateur a fort potentiel.',
];

const VALIDATION_COMMENTS = [
  'Validation du cycle courant.',
  'Evaluation validee apres entretien.',
  'Validation avec recommandation de suivi.',
  'Validation conforme.',
  'Validation avec plan d amelioration.',
];

async function upsertEvaluation(seed: EvaluationSeed) {
  const noteGlobale = seed.statut === 'valide' ? averageFromNotes(seed.notes) : null;
  const evaluationPeriodId = deterministicUuidFromString(seed.periodeCode);

  await pg.query(
    `INSERT INTO evaluations (
       evaluateur_matricule, evalue_matricule, id_periode, id_regle, date_creation, date_soumission,
       date_validation, validateur_matricule, statut, notations_json, commentaire_global,
       commentaire_validation, note_globale, type_evaluation, periode_code, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5::date, $6::timestamp, $7::timestamp, $8, $9, $10::json,
       $11, $12, $13, $14, $15, $16::timestamp, $17::timestamp
     )
     ON CONFLICT (evaluateur_matricule, evalue_matricule, id_periode, type_evaluation) DO UPDATE SET
       id_regle = EXCLUDED.id_regle,
       date_creation = EXCLUDED.date_creation,
       date_soumission = EXCLUDED.date_soumission,
       date_validation = EXCLUDED.date_validation,
       validateur_matricule = EXCLUDED.validateur_matricule,
       statut = EXCLUDED.statut,
       notations_json = EXCLUDED.notations_json,
       commentaire_global = EXCLUDED.commentaire_global,
       commentaire_validation = EXCLUDED.commentaire_validation,
       note_globale = EXCLUDED.note_globale,
       periode_code = EXCLUDED.periode_code,
       updated_at = EXCLUDED.updated_at`,
    [
      seed.evaluateur,
      seed.evalue,
      evaluationPeriodId,
      seed.regleId,
      seed.dateCreation,
      seed.dateSoumission ?? null,
      seed.dateValidation ?? null,
      seed.validateur ?? null,
      seed.statut,
      JSON.stringify(seed.notes),
      seed.commentaireGlobal,
      seed.commentaireValidation ?? null,
      noteGlobale,
      seed.type,
      seed.periodeCode,
      seed.dateSoumission ?? seed.dateCreation,
      seed.dateValidation ?? seed.dateSoumission ?? seed.dateCreation,
    ],
  );
}

async function recalculatePeriodStats(periodCode: string) {
  const evaluationPeriodId = deterministicUuidFromString(periodCode);
  const stats = await pgQueryOne<{
    total: string;
    validees: string;
  }>(
    `SELECT
       COUNT(*)::text as total,
       COUNT(*) FILTER (WHERE statut = 'valide')::text as validees
     FROM evaluations
     WHERE id_periode = $1`,
    [evaluationPeriodId],
  );

  const total = Number(stats?.total ?? 0);
  const validees = Number(stats?.validees ?? 0);
  const taux = total > 0 ? Math.round((validees / total) * 10000) / 100 : 0;

  await pg.query(
    `UPDATE periodes_evaluation
     SET nb_evaluations_attendues = $1,
         nb_evaluations_completees = $2,
         taux_completion = $3,
         updated_at = NOW()
     WHERE code_periode = $4`,
    [total, validees, taux, periodCode],
  );
}

async function seedTemplatesAndRules(roleIdByName: Map<string, string>) {
  const ruleIdByKey = new Map<string, string>();

  for (const rule of RULE_SPECS) {
    const id = await upsertRule(rule);
    ruleIdByKey.set(`${rule.roleEvaluateur}:${rule.roleEvalue}:${rule.typeEvaluation}`, id);
  }

  const templateSpecs = Object.entries(ROLE_DOMAIN).map(([roleName, domain], index) => ({
    id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
    nom: `Template ${roleName}`,
    description: `Template actif local pour ${roleName}`,
    evaluatedRole: roleName,
    criteria: buildCriteriaBundle(domain),
  }));

  for (const template of templateSpecs) {
    await upsertTemplate(template);
    const roleId = roleIdByName.get(template.evaluatedRole);
    if (!roleId) continue;

    for (const period of PERIODS) {
      await assignTemplate(roleId, period.id, template.id);
    }
  }

  return ruleIdByKey;
}

// ----- Evaluation generation -----

async function seedEvaluations(ruleIdByKey: Map<string, string>) {
  const commercial = buildCriteriaBundle('commercial');
  const marketing = buildCriteriaBundle('marketing');
  const sponsoring = buildCriteriaBundle('sponsoring');
  const trade = buildCriteriaBundle('trade');

  const current = PERIODS[0].code;
  const previous = PERIODS[1].code;

  // Build lookup maps
  const usersByRole = new Map<string, UserSeed[]>();
  const usersByRegionRole = new Map<string, UserSeed[]>();
  for (const user of USERS) {
    const roleKey = user.role;
    if (!usersByRole.has(roleKey)) usersByRole.set(roleKey, []);
    usersByRole.get(roleKey)!.push(user);

    const regionRoleKey = `${user.regionId}:${user.role}`;
    if (!usersByRegionRole.has(regionRoleKey)) usersByRegionRole.set(regionRoleKey, []);
    usersByRegionRole.get(regionRoleKey)!.push(user);
  }

  const userByMatricule = new Map<string, UserSeed>();
  for (const user of USERS) {
    userByMatricule.set(user.matricule, user);
  }

  function getCriteriaForRole(role: string): CriterionSeed[] {
    const domain = ROLE_DOMAIN[role];
    if (!domain) return commercial;
    return buildCriteriaBundle(domain);
  }

  function getManagerMatricule(user: UserSeed): string | null {
    return user.managerMatricule;
  }

  // Track generated evaluation keys to avoid duplicates
  const evalKeys = new Set<string>();

  const evaluations: EvaluationSeed[] = [];

  // Helper to add an evaluation with dedup
  function addEval(ev: EvaluationSeed) {
    const key = `${ev.evaluateur}:${ev.evalue}:${ev.periodeCode}:${ev.type}`;
    if (evalKeys.has(key)) return;
    evalKeys.add(key);
    evaluations.push(ev);
  }

  // ----- Period 1 (previous, closed): ~70% validated, 20% submitted, 10% draft -----
  function statusForPrevious(): { statut: 'brouillon' | 'soumis' | 'valide'; addValidation: boolean } {
    const r = rng.next();
    if (r < 0.70) return { statut: 'valide', addValidation: true };
    if (r < 0.90) return { statut: 'soumis', addValidation: false };
    return { statut: 'brouillon', addValidation: false };
  }

  // ----- Period 2 (current, open): ~20% validated, 30% submitted, 50% draft -----
  function statusForCurrent(): { statut: 'brouillon' | 'soumis' | 'valide'; addValidation: boolean } {
    const r = rng.next();
    if (r < 0.20) return { statut: 'valide', addValidation: true };
    if (r < 0.50) return { statut: 'soumis', addValidation: false };
    return { statut: 'brouillon', addValidation: false };
  }

  // Generate evaluations for each period
  for (const period of [previous, current]) {
    const isPrevious = period === previous;
    const statusFn = isPrevious ? statusForPrevious : statusForCurrent;

    for (const region of REGIONS) {
      const drUsers = usersByRegionRole.get(`${region.id}:DR`) ?? [];
      const dr = drUsers[0];
      if (!dr) continue;

      // DR evaluates CDS, RTM, SS, CDTT (descendante)
      const directReports: { role: string; ruleKey: string; criteriaFn: () => CriterionSeed[] }[] = [
        { role: 'CDS', ruleKey: 'DR:CDS:descendante', criteriaFn: () => commercial },
        { role: 'RTM', ruleKey: 'DR:RTM:descendante', criteriaFn: () => marketing },
        { role: 'SS', ruleKey: 'DR:SS:descendante', criteriaFn: () => sponsoring },
        { role: 'CDTT', ruleKey: 'DR:CDTT:descendante', criteriaFn: () => trade },
      ];

      for (const spec of directReports) {
        const subordinates = usersByRegionRole.get(`${region.id}:${spec.role}`) ?? [];
        const ruleId = ruleIdByKey.get(spec.ruleKey);
        if (!ruleId) continue;

        for (const sub of subordinates) {
          const { statut, addValidation } = statusFn();
          const criteria = spec.criteriaFn();
          const scores = randomScores(criteria, 1.5, 4.8);
          const dayOffset = isPrevious ? rng.int(-200, -140) : rng.int(-14, -1);

          addEval({
            evaluateur: dr.matricule,
            evalue: sub.matricule,
            periodeCode: period,
            regleId: ruleId,
            statut,
            type: 'descendante',
            notes: makeNotes(criteria, scores, [rng.pick(COMMENTS_POOL)]),
            commentaireGlobal: rng.pick(GLOBAL_COMMENTS),
            validateur: addValidation ? dr.matricule : null,
            commentaireValidation: addValidation ? rng.pick(VALIDATION_COMMENTS) : null,
            dateCreation: isoDateFromOffset(dayOffset),
            dateSoumission: statut !== 'brouillon' ? isoTimestampFromOffset(dayOffset + 1) : null,
            dateValidation: addValidation ? isoTimestampFromOffset(dayOffset + 2) : null,
          });
        }
      }

      // CDS evaluates CDV and CSC (descendante)
      const cdsUsers = usersByRegionRole.get(`${region.id}:CDS`) ?? [];
      for (const cds of cdsUsers) {
        // CDV subordinates
        const cdvUsers = (usersByRegionRole.get(`${region.id}:CDV`) ?? []);
        const ruleIdCdv = ruleIdByKey.get('CDS:CDV:descendante');
        if (ruleIdCdv) {
          for (const cdv of cdvUsers) {
            if (cdv.managerMatricule !== cds.matricule && cds !== cdsUsers[0]) continue;
            const { statut, addValidation } = statusFn();
            const scores = randomScores(commercial, 1.5, 4.8);
            const dayOffset = isPrevious ? rng.int(-200, -140) : rng.int(-14, -1);
            addEval({
              evaluateur: cds.matricule,
              evalue: cdv.matricule,
              periodeCode: period,
              regleId: ruleIdCdv,
              statut,
              type: 'descendante',
              notes: makeNotes(commercial, scores, [rng.pick(COMMENTS_POOL)]),
              commentaireGlobal: rng.pick(GLOBAL_COMMENTS),
              validateur: addValidation ? cds.matricule : null,
              commentaireValidation: addValidation ? rng.pick(VALIDATION_COMMENTS) : null,
              dateCreation: isoDateFromOffset(dayOffset),
              dateSoumission: statut !== 'brouillon' ? isoTimestampFromOffset(dayOffset + 1) : null,
              dateValidation: addValidation ? isoTimestampFromOffset(dayOffset + 2) : null,
            });
          }
        }

        // CSC subordinates
        const cscUsers = (usersByRegionRole.get(`${region.id}:CSC`) ?? []);
        const ruleIdCsc = ruleIdByKey.get('CDS:CSC:descendante');
        if (ruleIdCsc) {
          for (const csc of cscUsers) {
            const { statut, addValidation } = statusFn();
            const scores = randomScores(commercial, 1.5, 4.8);
            const dayOffset = isPrevious ? rng.int(-200, -140) : rng.int(-14, -1);
            addEval({
              evaluateur: cds.matricule,
              evalue: csc.matricule,
              periodeCode: period,
              regleId: ruleIdCsc,
              statut,
              type: 'descendante',
              notes: makeNotes(commercial, scores, [rng.pick(COMMENTS_POOL)]),
              commentaireGlobal: rng.pick(GLOBAL_COMMENTS),
              validateur: addValidation ? cds.matricule : null,
              commentaireValidation: addValidation ? rng.pick(VALIDATION_COMMENTS) : null,
              dateCreation: isoDateFromOffset(dayOffset),
              dateSoumission: statut !== 'brouillon' ? isoTimestampFromOffset(dayOffset + 1) : null,
              dateValidation: addValidation ? isoTimestampFromOffset(dayOffset + 2) : null,
            });
          }
        }
      }

      // RTM evaluates TMO and SRMO (descendante)
      const rtmUsers = usersByRegionRole.get(`${region.id}:RTM`) ?? [];
      for (const rtm of rtmUsers) {
        const tmoUsers = (usersByRegionRole.get(`${region.id}:TMO`) ?? []).filter(u => u.managerMatricule === rtm.matricule);
        const ruleIdTmo = ruleIdByKey.get('RTM:TMO:descendante');
        if (ruleIdTmo) {
          for (const tmo of tmoUsers) {
            const { statut, addValidation } = statusFn();
            const scores = randomScores(marketing, 1.5, 4.8);
            const dayOffset = isPrevious ? rng.int(-200, -140) : rng.int(-14, -1);
            addEval({
              evaluateur: rtm.matricule,
              evalue: tmo.matricule,
              periodeCode: period,
              regleId: ruleIdTmo,
              statut,
              type: 'descendante',
              notes: makeNotes(marketing, scores, [rng.pick(COMMENTS_POOL)]),
              commentaireGlobal: rng.pick(GLOBAL_COMMENTS),
              validateur: addValidation ? rtm.matricule : null,
              commentaireValidation: addValidation ? rng.pick(VALIDATION_COMMENTS) : null,
              dateCreation: isoDateFromOffset(dayOffset),
              dateSoumission: statut !== 'brouillon' ? isoTimestampFromOffset(dayOffset + 1) : null,
              dateValidation: addValidation ? isoTimestampFromOffset(dayOffset + 2) : null,
            });
          }
        }

        const srmoUsers = (usersByRegionRole.get(`${region.id}:SRMO`) ?? []).filter(u => u.managerMatricule === rtm.matricule);
        const ruleIdSrmo = ruleIdByKey.get('RTM:SRMO:descendante');
        if (ruleIdSrmo) {
          for (const srmo of srmoUsers) {
            const { statut, addValidation } = statusFn();
            const scores = randomScores(marketing, 1.5, 4.8);
            const dayOffset = isPrevious ? rng.int(-200, -140) : rng.int(-14, -1);
            addEval({
              evaluateur: rtm.matricule,
              evalue: srmo.matricule,
              periodeCode: period,
              regleId: ruleIdSrmo,
              statut,
              type: 'descendante',
              notes: makeNotes(marketing, scores, [rng.pick(COMMENTS_POOL)]),
              commentaireGlobal: rng.pick(GLOBAL_COMMENTS),
              validateur: addValidation ? rtm.matricule : null,
              commentaireValidation: addValidation ? rng.pick(VALIDATION_COMMENTS) : null,
              dateCreation: isoDateFromOffset(dayOffset),
              dateSoumission: statut !== 'brouillon' ? isoTimestampFromOffset(dayOffset + 1) : null,
              dateValidation: addValidation ? isoTimestampFromOffset(dayOffset + 2) : null,
            });
          }
        }
      }

      // SS evaluates AS (descendante)
      const ssUsers = usersByRegionRole.get(`${region.id}:SS`) ?? [];
      for (const ss of ssUsers) {
        const asUsers = (usersByRegionRole.get(`${region.id}:AS`) ?? []).filter(u => u.managerMatricule === ss.matricule);
        const ruleIdAs = ruleIdByKey.get('SS:AS:descendante');
        if (ruleIdAs) {
          for (const as of asUsers) {
            const { statut, addValidation } = statusFn();
            const scores = randomScores(sponsoring, 1.5, 4.8);
            const dayOffset = isPrevious ? rng.int(-200, -140) : rng.int(-14, -1);
            addEval({
              evaluateur: ss.matricule,
              evalue: as.matricule,
              periodeCode: period,
              regleId: ruleIdAs,
              statut,
              type: 'descendante',
              notes: makeNotes(sponsoring, scores, [rng.pick(COMMENTS_POOL)]),
              commentaireGlobal: rng.pick(GLOBAL_COMMENTS),
              validateur: addValidation ? ss.matricule : null,
              commentaireValidation: addValidation ? rng.pick(VALIDATION_COMMENTS) : null,
              dateCreation: isoDateFromOffset(dayOffset),
              dateSoumission: statut !== 'brouillon' ? isoTimestampFromOffset(dayOffset + 1) : null,
              dateValidation: addValidation ? isoTimestampFromOffset(dayOffset + 2) : null,
            });
          }
        }
      }

      // Auto-evaluations for some roles
      const autoRoles = ['CDS', 'CDV', 'CSC', 'RTM', 'TMO', 'SRMO', 'SS', 'AS'];
      for (const roleName of autoRoles) {
        const ruleKey = `${roleName}:${roleName}:auto`;
        const ruleId = ruleIdByKey.get(ruleKey);
        if (!ruleId) continue;

        const usersOfRole = usersByRegionRole.get(`${region.id}:${roleName}`) ?? [];
        const criteria = getCriteriaForRole(roleName);

        // ~60% of users do auto-eval
        for (const user of usersOfRole) {
          if (rng.next() > 0.60) continue;
          const { statut, addValidation } = statusFn();
          const scores = randomScores(criteria, 2.0, 4.8); // self-evals tend to be higher
          const dayOffset = isPrevious ? rng.int(-200, -140) : rng.int(-14, -1);
          const managerMatricule = getManagerMatricule(user);

          addEval({
            evaluateur: user.matricule,
            evalue: user.matricule,
            periodeCode: period,
            regleId: ruleId,
            statut,
            type: 'auto',
            notes: makeNotes(criteria, scores, [rng.pick(COMMENTS_POOL)]),
            commentaireGlobal: rng.pick(GLOBAL_COMMENTS),
            validateur: addValidation && managerMatricule ? managerMatricule : null,
            commentaireValidation: addValidation ? rng.pick(VALIDATION_COMMENTS) : null,
            dateCreation: isoDateFromOffset(dayOffset),
            dateSoumission: statut !== 'brouillon' ? isoTimestampFromOffset(dayOffset + 1) : null,
            dateValidation: addValidation ? isoTimestampFromOffset(dayOffset + 2) : null,
          });
        }
      }

      // Peer evaluations (~15% chance for each eligible pair in same region/role)
      const peerRoles = ['CSC', 'TMO', 'CDV', 'AS'];
      for (const roleName of peerRoles) {
        const usersOfRole = usersByRegionRole.get(`${region.id}:${roleName}`) ?? [];
        if (usersOfRole.length < 2) continue;
        const ruleKey = `${roleName}:${roleName}:auto`; // peer uses same rule as auto
        const ruleId = ruleIdByKey.get(ruleKey);
        if (!ruleId) continue;

        const criteria = getCriteriaForRole(roleName);

        for (let a = 0; a < usersOfRole.length; a++) {
          for (let b = a + 1; b < usersOfRole.length; b++) {
            if (rng.next() > 0.15) continue;
            const { statut, addValidation } = statusFn();
            const scores = randomScores(criteria, 1.5, 4.5);
            const dayOffset = isPrevious ? rng.int(-200, -140) : rng.int(-14, -1);

            addEval({
              evaluateur: usersOfRole[a].matricule,
              evalue: usersOfRole[b].matricule,
              periodeCode: period,
              regleId: ruleId,
              statut,
              type: 'pairs',
              notes: makeNotes(criteria, scores, [rng.pick(COMMENTS_POOL)]),
              commentaireGlobal: rng.pick(GLOBAL_COMMENTS),
              validateur: addValidation ? (usersOfRole[b].managerMatricule ?? dr.matricule) : null,
              commentaireValidation: addValidation ? rng.pick(VALIDATION_COMMENTS) : null,
              dateCreation: isoDateFromOffset(dayOffset),
              dateSoumission: statut !== 'brouillon' ? isoTimestampFromOffset(dayOffset + 1) : null,
              dateValidation: addValidation ? isoTimestampFromOffset(dayOffset + 2) : null,
            });
          }
        }
      }
    }
  }

  // Insert evaluations in batches
  console.log(`  Inserting ${evaluations.length} evaluations...`);
  for (let i = 0; i < evaluations.length; i++) {
    await upsertEvaluation(evaluations[i]);
    if ((i + 1) % 200 === 0) {
      console.log(`  ... ${i + 1}/${evaluations.length}`);
    }
  }

  await recalculatePeriodStats(current);
  await recalculatePeriodStats(previous);

  return evaluations.length;
}

// ----- Replacements -----

async function seedRemplacements() {
  // Generate 8 replacements across different regions
  const replacements = [
    { titulaire: 'AS', remplacant: 'AS', regionIdx: 0, motif: 'Conge annuel' },
    { titulaire: 'TMO', remplacant: 'TMO', regionIdx: 1, motif: 'Formation externe' },
    { titulaire: 'CSC', remplacant: 'CSC', regionIdx: 2, motif: 'Mission temporaire' },
    { titulaire: 'SRMO', remplacant: 'SRMO', regionIdx: 3, motif: 'Conge maladie' },
    { titulaire: 'AS', remplacant: 'AS', regionIdx: 4, motif: 'Remplacement programmatique' },
    { titulaire: 'TMO', remplacant: 'TMO', regionIdx: 5, motif: 'Conge parental' },
    { titulaire: 'CDV', remplacant: 'CDV', regionIdx: 6, motif: 'Deplacement siege' },
    { titulaire: 'AS', remplacant: 'AS', regionIdx: 7, motif: 'Formation interne' },
  ];

  for (const repl of replacements) {
    const region = REGIONS[repl.regionIdx];
    if (!region) continue;
    const usersOfRole = USERS.filter(u => u.role === repl.titulaire && u.regionId === region.id);
    if (usersOfRole.length < 2) continue;

    const titulaire = usersOfRole[0];
    const remplacant = usersOfRole[1];
    const drOfRegion = USERS.find(u => u.role === 'DR' && u.regionId === region.id);
    const duree = rng.int(30, 45);
    const startOffset = -rng.int(0, 5);
    const dateDebut = isoDateFromOffset(startOffset);
    const dateFin = isoDateFromOffset(startOffset + duree - 1);

    await prisma.$executeRawUnsafe(
      `INSERT INTO replacement_temporaire
        (titulaire_matricule, remplacant_matricule, role_remplace, region_remplacement, service_remplacement,
         date_debut, date_fin, duree_prevue_jours, motif, cree_par, est_actif, notifications_envoyees,
         equipe_notifiee, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, NOW(), NOW())`,
      titulaire.matricule,
      remplacant.matricule,
      repl.titulaire,
      region.nom,
      `Service ${region.nom}`,
      dateDebut,
      dateFin,
      duree,
      repl.motif,
      drOfRegion?.matricule ?? 'A0001',
    );

    await prisma.utilisateur.update({
      where: { matricule: titulaire.matricule },
      data: {
        statut: 'Indisponible',
        est_indisponible: true,
        date_debut_indisponibilite: new Date(`${dateDebut}T00:00:00.000Z`),
        date_fin_indisponibilite: new Date(`${dateFin}T00:00:00.000Z`),
        motif_indisponibilite: repl.motif,
      },
    });
  }
}

// ----- Notifications -----

async function seedNotifications() {
  const notifTypes = ['info', 'validation', 'reminder', 'alerte', 'evaluation'];
  const notifTitles: Record<string, string[]> = {
    info: ['Pilotage analytics pret', 'Mise a jour du systeme', 'Nouveau tableau de bord disponible'],
    validation: ['Evaluations a valider', 'Validation en attente', 'Evaluation soumise pour validation'],
    reminder: ['Rappel auto-evaluation', 'Echeance evaluation proche', 'Rappel de soumission'],
    alerte: ['Anomalie detectee', 'Score faible identifie', 'Retard de soumission'],
    evaluation: ['Nouvelle evaluation recue', 'Evaluation validee', 'Feedback disponible'],
  };
  const notifMessages: Record<string, string[]> = {
    info: ['Les dashboards admin disposent maintenant de donnees multi-regions coherentes.', 'Une mise a jour du systeme a ete effectuee.', 'Un nouveau tableau de bord est disponible dans votre espace.'],
    validation: ['Des auto-evaluations soumises sont en attente de votre validation.', 'Une evaluation attend votre approbation.', 'Un collaborateur a soumis son evaluation pour validation.'],
    reminder: ['Votre auto-evaluation du cycle courant attend une validation manager.', 'L echeance de soumission des evaluations approche.', 'N oubliez pas de soumettre votre evaluation.'],
    alerte: ['Une anomalie a ete detectee dans les scores.', 'Un score particulierement bas a ete identifie.', 'Certaines evaluations sont en retard de soumission.'],
    evaluation: ['Vous avez recu une nouvelle evaluation.', 'Votre evaluation a ete validee par votre manager.', 'Un feedback pair est disponible.'],
  };

  const notifications: Array<{
    id: string;
    dest: string;
    titre: string;
    message: string;
    type: string;
    link: string;
    expediteur: string;
    lu: number;
  }> = [];

  // Generate 30 notifications spread across users and types
  const eligibleUsers = USERS.filter(u => u.role !== 'ADMIN').slice(0, 100); // pick from first 100 non-admin users
  for (let i = 0; i < 30; i++) {
    const user = rng.pick(eligibleUsers);
    const type = rng.pick(notifTypes);
    const titles = notifTitles[type];
    const messages = notifMessages[type];

    notifications.push({
      id: randomUUID(),
      dest: user.matricule,
      titre: rng.pick(titles),
      message: rng.pick(messages),
      type,
      link: type === 'validation' ? '/evaluations/validate' : type === 'evaluation' ? '/evaluations/mine' : '/dashboard',
      expediteur: user.managerMatricule ?? 'A0001',
      lu: rng.next() > 0.6 ? 1 : 0,
    });
  }

  // Always add the demo notifications
  notifications.push(
    {
      id: randomUUID(),
      dest: 'A0001',
      titre: 'Pilotage analytics pret',
      message: 'Les dashboards admin disposent maintenant de donnees multi-regions coherentes.',
      type: 'info',
      link: '/admin/dashboard?tab=overview',
      expediteur: 'A0001',
      lu: 0,
    },
    {
      id: randomUUID(),
      dest: 'S1110',
      titre: 'Evaluations a valider',
      message: 'Deux auto-evaluations soumises sont en attente de votre validation.',
      type: 'validation',
      link: '/evaluations/validate',
      expediteur: 'A0001',
      lu: 0,
    },
    {
      id: randomUUID(),
      dest: 'T1210',
      titre: 'Rappel auto-evaluation',
      message: 'Votre auto-evaluation du cycle courant a ete soumise et attend une validation manager.',
      type: 'reminder',
      link: '/evaluations/mine',
      expediteur: 'D1010',
      lu: 0,
    },
  );

  for (const notification of notifications) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO notifications_utilisateurs
        (id_notification, destinataire_matricule, titre, message, type, lien, donnees_json,
         expediteur_matricule, est_lu, date_creation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      notification.id,
      notification.dest,
      notification.titre,
      notification.message,
      notification.type,
      notification.link,
      JSON.stringify({ seeded: true }),
      notification.expediteur,
      notification.lu,
    );
  }

  return notifications.length;
}

// ----- Main -----

async function main() {
  const seedMode = process.env.SEED_MODE ?? 'reset';
  if (!['reset', 'if-empty'].includes(seedMode)) {
    throw new Error(`SEED_MODE invalide: ${seedMode} (valeurs: reset, if-empty)`);
  }
  if (seedMode === 'if-empty') {
    const existingUsers = await prisma.utilisateur.count();
    if (existingUsers > 0) {
      console.log(`Seed skipped: ${existingUsers} utilisateurs existent déjà`);
      return;
    }
  }

  console.log('Reset local demo data...');
  await resetData();

  console.log(`Seeding MySQL core (${USERS.length} users across ${REGIONS.length} regions)...`);
  const core = await seedCore();

  console.log('Syncing PostgreSQL user refs...');
  await syncUserRefs(core.regions, core.branchIds);

  console.log('Seeding business periods, rules and templates...');
  for (const period of PERIODS) {
    await upsertPeriode(period);
  }
  const ruleIdByKey = await seedTemplatesAndRules(core.roleIdsByName);

  console.log('Seeding evaluations...');
  const evalCount = await seedEvaluations(ruleIdByKey);

  console.log('Seeding replacements...');
  await seedRemplacements();

  console.log('Seeding notifications...');
  const notifCount = await seedNotifications();

  console.log(`Seed completed: ${USERS.length} users, ${RULE_SPECS.length} rules, ${PERIODS.length} periods, ${evalCount} evaluations, 8 replacements, ${notifCount} notifications.`);
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
