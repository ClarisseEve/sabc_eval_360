-- SABC Eval360 - canonical PostgreSQL business schema.
-- This migration must stay lexically before every incremental ALTER migration.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE utilisateurs_ref (
  matricule   VARCHAR(5) PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  prenom      VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL,
  role        VARCHAR(50),
  id_region   VARCHAR(5),
  id_branche  VARCHAR(5),
  region_nom  VARCHAR(100),
  type_region VARCHAR(20),
  est_actif   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_utilisateurs_ref_role ON utilisateurs_ref(role);
CREATE INDEX idx_utilisateurs_ref_region ON utilisateurs_ref(id_region);

CREATE TABLE periodes_evaluation (
  id_periode               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_periode             VARCHAR(50) NOT NULL UNIQUE,
  nom_periode              VARCHAR(200) NOT NULL,
  titre                    VARCHAR(200),
  description              TEXT,
  date_debut               DATE NOT NULL,
  date_fin                 DATE NOT NULL,
  statut                   VARCHAR(20) NOT NULL DEFAULT 'planifiee'
                             CHECK (statut IN ('planifiee', 'ouverte', 'fermee')),
  est_ouverte              BOOLEAN NOT NULL DEFAULT FALSE,
  est_cloturee             BOOLEAN NOT NULL DEFAULT FALSE,
  dates_rappels_json       JSONB NOT NULL DEFAULT '[]'::jsonb,
  nb_evaluations_attendues INTEGER NOT NULL DEFAULT 0,
  nb_evaluations_completees INTEGER NOT NULL DEFAULT 0,
  taux_completion          NUMERIC(5,2) NOT NULL DEFAULT 0,
  statistiques_json        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT periodes_dates_check CHECK (date_fin > date_debut)
);

CREATE INDEX idx_periodes_statut ON periodes_evaluation(statut);
CREATE INDEX idx_periodes_est_ouverte ON periodes_evaluation(est_ouverte);
CREATE INDEX idx_periodes_dates ON periodes_evaluation(date_debut, date_fin);

CREATE TABLE regles_evaluation (
  id_regle                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_regle                VARCHAR(200) NOT NULL,
  description              TEXT,
  criteres_evaluation_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  est_active               BOOLEAN NOT NULL DEFAULT FALSE,
  role_evaluateur          VARCHAR(50),
  role_evalue              VARCHAR(50),
  type_evaluation          VARCHAR(30),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_regle_roles_type
    UNIQUE (role_evaluateur, role_evalue, type_evaluation)
);

CREATE INDEX idx_regles_est_active ON regles_evaluation(est_active);
CREATE INDEX idx_regles_roles ON regles_evaluation(role_evaluateur, role_evalue);

CREATE TABLE templates (
  id_template    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom            VARCHAR(200) NOT NULL,
  description    TEXT,
  evaluated_role VARCHAR(50),
  version        INTEGER NOT NULL DEFAULT 1,
  statut         VARCHAR(20) NOT NULL DEFAULT 'draft'
                   CHECK (statut IN ('draft', 'published', 'archived')),
  meta_json      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_statut ON templates(statut);
CREATE INDEX idx_templates_evaluated_role ON templates(evaluated_role);

CREATE TABLE templates_roles_periodes (
  id_role     VARCHAR(5) NOT NULL,
  id_periode  UUID NOT NULL REFERENCES periodes_evaluation(id_periode) ON DELETE CASCADE,
  id_template UUID NOT NULL REFERENCES templates(id_template) ON DELETE RESTRICT,
  est_actif   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_role, id_periode)
);

CREATE INDEX idx_trp_id_template ON templates_roles_periodes(id_template);
CREATE INDEX idx_trp_id_periode ON templates_roles_periodes(id_periode);

CREATE TABLE evaluations (
  id_evaluation          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluateur_matricule   VARCHAR(5) NOT NULL,
  evalue_matricule       VARCHAR(5) NOT NULL,
  id_periode             UUID NOT NULL REFERENCES periodes_evaluation(id_periode),
  id_regle               UUID REFERENCES regles_evaluation(id_regle) ON DELETE SET NULL,
  date_creation          DATE NOT NULL DEFAULT CURRENT_DATE,
  date_soumission        TIMESTAMPTZ,
  date_validation        TIMESTAMPTZ,
  date_modification      TIMESTAMPTZ,
  validateur_matricule   VARCHAR(5),
  statut                 VARCHAR(20) NOT NULL DEFAULT 'brouillon'
                           CHECK (statut IN ('brouillon', 'soumis', 'valide', 'rejete')),
  notations_json         JSONB NOT NULL DEFAULT '[]'::jsonb,
  commentaire_global     TEXT,
  commentaire_validation TEXT,
  note_globale           NUMERIC(4,2),
  type_evaluation        VARCHAR(30) NOT NULL,
  periode_code           VARCHAR(50),
  motif_rejet            TEXT,
  evaluation_parent_id   UUID,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_evaluation_acteurs_periode_type
    UNIQUE (evaluateur_matricule, evalue_matricule, id_periode, type_evaluation)
);

CREATE INDEX idx_evaluations_evaluateur ON evaluations(evaluateur_matricule);
CREATE INDEX idx_evaluations_evalue ON evaluations(evalue_matricule);
CREATE INDEX idx_evaluations_id_periode ON evaluations(id_periode);
CREATE INDEX idx_evaluations_statut ON evaluations(statut);
CREATE INDEX idx_evaluations_type ON evaluations(type_evaluation);

CREATE TABLE scores_utilisateurs (
  matricule    VARCHAR(5) NOT NULL,
  id_periode   UUID NOT NULL REFERENCES periodes_evaluation(id_periode) ON DELETE CASCADE,
  score_auto   NUMERIC(4,2),
  score_pairs  NUMERIC(4,2),
  score_manager NUMERIC(4,2),
  derniere_maj TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (matricule, id_periode)
);

CREATE INDEX idx_scores_id_periode ON scores_utilisateurs(id_periode);

CREATE TABLE logs_anomalies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            VARCHAR(100) NOT NULL,
  description     TEXT NOT NULL,
  severite        VARCHAR(20) NOT NULL,
  matricule       VARCHAR(5),
  details         JSONB,
  resolue         BOOLEAN NOT NULL DEFAULT FALSE,
  date_resolution TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_anomalies_severite ON logs_anomalies(severite);
CREATE INDEX idx_logs_anomalies_resolue ON logs_anomalies(resolue);
CREATE INDEX idx_logs_anomalies_matricule ON logs_anomalies(matricule);

CREATE TABLE recommandations_admin (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  VARCHAR(50) NOT NULL,
  priorite              VARCHAR(20) NOT NULL,
  matricule             VARCHAR(5) NOT NULL,
  titre                 TEXT NOT NULL,
  description           TEXT NOT NULL,
  details               JSONB,
  statut                VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  motif_rejet           TEXT,
  validateur_matricule  VARCHAR(5),
  date_validation       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommandations_admin_statut ON recommandations_admin(statut);
CREATE INDEX idx_recommandations_admin_matricule ON recommandations_admin(matricule);

CREATE TABLE rapports (
  id_rapport         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre              VARCHAR(200) NOT NULL,
  createur_matricule VARCHAR(5) NOT NULL,
  sections_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
  statut             VARCHAR(20) NOT NULL DEFAULT 'brouillon',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rapports_createur ON rapports(createur_matricule);
CREATE INDEX idx_rapports_statut ON rapports(statut);

CREATE TABLE historique_exports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id          UUID REFERENCES rapports(id_rapport) ON DELETE SET NULL,
  format              VARCHAR(20) NOT NULL,
  createur_matricule  VARCHAR(5) NOT NULL,
  fichier_nom         VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historique_exports_rapport ON historique_exports(rapport_id);
