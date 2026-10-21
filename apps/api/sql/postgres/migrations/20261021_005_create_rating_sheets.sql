CREATE TABLE rating_sheet_configurations (
  id_configuration UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_periode UUID NOT NULL REFERENCES periodes_evaluation(id_periode) ON DELETE CASCADE,
  role_evalue VARCHAR(50) NOT NULL,
  methode_calcul VARCHAR(20) NOT NULL CHECK (methode_calcul IN ('moyenne', 'ponderee')),
  categories_json JSONB NOT NULL,
  configurateur_matricule VARCHAR(5) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_periode, role_evalue)
);

CREATE TABLE rating_sheets (
  id_fiche UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_periode UUID NOT NULL REFERENCES periodes_evaluation(id_periode) ON DELETE CASCADE,
  matricule VARCHAR(5) NOT NULL,
  role_evalue VARCHAR(50) NOT NULL,
  contenu_json JSONB NOT NULL,
  publie_par VARCHAR(5) NOT NULL,
  publie_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_statut VARCHAR(20) NOT NULL DEFAULT 'en_attente'
    CHECK (notification_statut IN ('en_attente', 'envoye', 'echec')),
  notification_erreur TEXT,
  email_statut VARCHAR(20) NOT NULL DEFAULT 'en_attente'
    CHECK (email_statut IN ('en_attente', 'envoye', 'echec')),
  email_erreur TEXT,
  email_envoye_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_periode, matricule)
);

CREATE INDEX idx_rating_sheets_matricule ON rating_sheets(matricule, publie_le DESC);
CREATE INDEX idx_rating_sheets_periode_role ON rating_sheets(id_periode, role_evalue);
