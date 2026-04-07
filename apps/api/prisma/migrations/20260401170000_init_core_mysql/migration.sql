-- CreateTable
CREATE TABLE `branches` (
    `id_branche` VARCHAR(5) NOT NULL,
    `nom_branche` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `branches_nom_branche_key`(`nom_branche`),
    PRIMARY KEY (`id_branche`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regions` (
    `id_region` VARCHAR(5) NOT NULL,
    `nom_region` VARCHAR(100) NOT NULL,
    `est_taniere` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `regions_nom_region_key`(`nom_region`),
    PRIMARY KEY (`id_region`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id_role` VARCHAR(5) NOT NULL,
    `nom_role` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `id_branche` VARCHAR(5) NOT NULL,
    `niveau_taniere` INTEGER NULL,
    `niveau_non_taniere` INTEGER NULL,
    `peut_auto_evaluer` BOOLEAN NOT NULL DEFAULT true,
    `peut_evaluer_pairs` BOOLEAN NOT NULL DEFAULT true,
    `peut_evaluer_subordonnes` BOOLEAN NOT NULL DEFAULT false,
    `peut_cross_branch` BOOLEAN NOT NULL DEFAULT false,
    `role_principal_equivalent` VARCHAR(50) NULL,
    `peut_remplacer_roles` TEXT NULL,
    `portee_geographique` VARCHAR(20) NOT NULL DEFAULT 'region',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_nom_role_key`(`nom_role`),
    PRIMARY KEY (`id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `matricule` VARCHAR(5) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `telephone` VARCHAR(20) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `manager_matricule` VARCHAR(5) NULL,
    `niveau_hierarchique` INTEGER NOT NULL DEFAULT 0,
    `id_region` VARCHAR(5) NOT NULL,
    `id_branche` VARCHAR(5) NOT NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `est_admin` BOOLEAN NOT NULL DEFAULT false,
    `est_indisponible` BOOLEAN NOT NULL DEFAULT false,
    `photo_url` VARCHAR(191) NULL,
    `remember_token` VARCHAR(100) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `statut` VARCHAR(20) NOT NULL DEFAULT 'Actif',
    `date_debut_indisponibilite` DATE NULL,
    `date_fin_indisponibilite` DATE NULL,
    `motif_indisponibilite` VARCHAR(100) NULL,
    `region_nom` VARCHAR(100) NOT NULL,
    `role_nom` VARCHAR(50) NOT NULL,
    `type_region` VARCHAR(20) NOT NULL,
    `roles_support_json` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `utilisateurs_email_key`(`email`),
    INDEX `idx_user_role_region`(`role`, `id_region`),
    INDEX `idx_hierarchy`(`manager_matricule`),
    INDEX `idx_user_statut`(`statut`),
    PRIMARY KEY (`matricule`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_id_branche_fkey` FOREIGN KEY (`id_branche`) REFERENCES `branches`(`id_branche`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_id_region_fkey` FOREIGN KEY (`id_region`) REFERENCES `regions`(`id_region`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_id_branche_fkey` FOREIGN KEY (`id_branche`) REFERENCES `branches`(`id_branche`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_manager_matricule_fkey` FOREIGN KEY (`manager_matricule`) REFERENCES `utilisateurs`(`matricule`) ON DELETE SET NULL ON UPDATE CASCADE;
