-- DropForeignKey
ALTER TABLE `roles` DROP FOREIGN KEY `roles_id_branche_fkey`;

-- DropForeignKey
ALTER TABLE `utilisateurs` DROP FOREIGN KEY `utilisateurs_id_branche_fkey`;

-- DropForeignKey
ALTER TABLE `utilisateurs` DROP FOREIGN KEY `utilisateurs_id_region_fkey`;

-- DropForeignKey
ALTER TABLE `utilisateurs` DROP FOREIGN KEY `utilisateurs_manager_matricule_fkey`;

-- DropIndex
DROP INDEX `roles_id_branche_fkey` ON `roles`;

-- DropIndex
DROP INDEX `utilisateurs_id_region_fkey` ON `utilisateurs`;

-- AlterTable
ALTER TABLE `branches` MODIFY `created_at` TIMESTAMP(0) NULL,
    MODIFY `updated_at` TIMESTAMP(0) NULL;

-- AlterTable
ALTER TABLE `regions` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `roles` MODIFY `id_branche` VARCHAR(5) NULL,
    MODIFY `created_at` TIMESTAMP(0) NULL,
    MODIFY `updated_at` TIMESTAMP(0) NULL;

-- AlterTable
ALTER TABLE `utilisateurs` ADD COLUMN `id_district` VARCHAR(10) NULL,
    ADD COLUMN `id_secteur` VARCHAR(10) NULL,
    ADD COLUMN `id_service` VARCHAR(10) NULL,
    ADD COLUMN `sexe` VARCHAR(10) NULL,
    MODIFY `password` VARCHAR(255) NOT NULL,
    MODIFY `id_region` VARCHAR(5) NULL,
    MODIFY `id_branche` VARCHAR(5) NULL,
    MODIFY `photo_url` VARCHAR(255) NULL,
    MODIFY `email_verified_at` TIMESTAMP(0) NULL,
    MODIFY `created_at` TIMESTAMP(0) NULL,
    MODIFY `updated_at` TIMESTAMP(0) NULL;

-- CreateTable
CREATE TABLE `services_commerciaux` (
    `id_service` VARCHAR(10) NOT NULL,
    `nom_service` VARCHAR(100) NOT NULL,
    `id_region` VARCHAR(5) NOT NULL,
    `description` TEXT NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `services_commerciaux_nom_service_unique`(`nom_service`),
    INDEX `services_commerciaux_id_region_est_actif_index`(`id_region`, `est_actif`),
    INDEX `services_commerciaux_nom_service_index`(`nom_service`),
    PRIMARY KEY (`id_service`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `districts` (
    `id_district` VARCHAR(10) NOT NULL,
    `nom_district` VARCHAR(100) NOT NULL,
    `id_service` VARCHAR(10) NOT NULL,
    `description` TEXT NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `districts_id_service_est_actif_index`(`id_service`, `est_actif`),
    INDEX `districts_nom_district_index`(`nom_district`),
    UNIQUE INDEX `districts_nom_district_id_service_unique`(`nom_district`, `id_service`),
    PRIMARY KEY (`id_district`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `secteurs` (
    `id_secteur` VARCHAR(10) NOT NULL,
    `nom_secteur` VARCHAR(100) NOT NULL,
    `id_service` VARCHAR(10) NOT NULL,
    `id_district` VARCHAR(10) NULL,
    `description` TEXT NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `secteurs_id_service_est_actif_index`(`id_service`, `est_actif`),
    INDEX `secteurs_id_district_est_actif_index`(`id_district`, `est_actif`),
    INDEX `secteurs_nom_secteur_index`(`nom_secteur`),
    UNIQUE INDEX `secteurs_nom_secteur_id_service_unique`(`nom_secteur`, `id_service`),
    PRIMARY KEY (`id_secteur`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs_administration` (
    `id_log` VARCHAR(5) NOT NULL,
    `matricule_utilisateur` VARCHAR(5) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entite` VARCHAR(50) NOT NULL,
    `id_entite` VARCHAR(20) NULL,
    `details_json` JSON NULL,
    `adresse_ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `idx_log_utilisateur`(`matricule_utilisateur`),
    INDEX `idx_log_entite`(`entite`, `id_entite`),
    INDEX `idx_log_date`(`created_at`),
    PRIMARY KEY (`id_log`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` INTEGER NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` INTEGER NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `failed_jobs_uuid_unique`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications_utilisateurs` (
    `id_notification` VARCHAR(36) NOT NULL,
    `destinataire_matricule` VARCHAR(5) NOT NULL,
    `titre` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `lien` VARCHAR(255) NULL,
    `donnees_json` JSON NULL,
    `id_evaluation` VARCHAR(36) NULL,
    `id_remplacement` BIGINT NULL,
    `expediteur_matricule` VARCHAR(5) NULL,
    `est_lu` BOOLEAN NOT NULL DEFAULT false,
    `date_creation` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `date_lecture` DATETIME(0) NULL,

    INDEX `idx_notifications_destinataire`(`destinataire_matricule`, `est_lu`, `date_creation`),
    PRIMARY KEY (`id_notification`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` TEXT NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `abilities` TEXT NULL,
    `last_used_at` TIMESTAMP(0) NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `personal_access_tokens_token_unique`(`token`),
    INDEX `personal_access_tokens_expires_at_index`(`expires_at`),
    INDEX `personal_access_tokens_tokenable_type_tokenable_id_index`(`tokenable_type`, `tokenable_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `replacement_temporaire` (
    `id_remplacement` BIGINT NOT NULL AUTO_INCREMENT,
    `titulaire_matricule` VARCHAR(5) NOT NULL,
    `remplacant_matricule` VARCHAR(5) NOT NULL,
    `role_remplace` VARCHAR(50) NOT NULL,
    `region_remplacement` VARCHAR(100) NOT NULL,
    `service_remplacement` VARCHAR(100) NULL,
    `date_debut` DATE NOT NULL,
    `date_fin` DATE NULL,
    `date_fin_effective` DATE NULL,
    `duree_prevue_jours` INTEGER NOT NULL,
    `motif` VARCHAR(255) NOT NULL,
    `cree_par` VARCHAR(5) NOT NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `notifications_envoyees` BOOLEAN NOT NULL DEFAULT false,
    `equipe_notifiee` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_replacement_remplacant`(`remplacant_matricule`, `est_actif`),
    INDEX `idx_replacement_titulaire`(`titulaire_matricule`, `est_actif`),
    PRIMARY KEY (`id_remplacement`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(5) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INTEGER NOT NULL,

    INDEX `sessions_last_activity_index`(`last_activity`),
    INDEX `sessions_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_region_taniere` ON `regions`(`est_taniere`);

-- CreateIndex
CREATE INDEX `idx_niveaux` ON `roles`(`niveau_taniere`, `niveau_non_taniere`);

-- CreateIndex
CREATE INDEX `idx_role_equivalent` ON `roles`(`role_principal_equivalent`);

-- CreateIndex
CREATE INDEX `roles_id_branche_niveau_taniere_niveau_non_taniere_index` ON `roles`(`id_branche`, `niveau_taniere`, `niveau_non_taniere`);

-- CreateIndex
CREATE INDEX `idx_indisponibilite` ON `utilisateurs`(`date_debut_indisponibilite`, `date_fin_indisponibilite`);

-- CreateIndex
CREATE INDEX `utilisateurs_id_region_id_service_id_district_id_secteur_index` ON `utilisateurs`(`id_region`, `id_service`, `id_district`, `id_secteur`);

-- CreateIndex
CREATE INDEX `utilisateurs_id_service_est_actif_index` ON `utilisateurs`(`id_service`, `est_actif`);

-- CreateIndex
CREATE INDEX `utilisateurs_id_district_est_actif_index` ON `utilisateurs`(`id_district`, `est_actif`);

-- CreateIndex
CREATE INDEX `utilisateurs_id_secteur_est_actif_index` ON `utilisateurs`(`id_secteur`, `est_actif`);

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_id_branche_foreign` FOREIGN KEY (`id_branche`) REFERENCES `branches`(`id_branche`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_id_district_foreign` FOREIGN KEY (`id_district`) REFERENCES `districts`(`id_district`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_id_secteur_foreign` FOREIGN KEY (`id_secteur`) REFERENCES `secteurs`(`id_secteur`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_id_service_foreign` FOREIGN KEY (`id_service`) REFERENCES `services_commerciaux`(`id_service`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_manager_matricule_foreign` FOREIGN KEY (`manager_matricule`) REFERENCES `utilisateurs`(`matricule`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `services_commerciaux` ADD CONSTRAINT `services_commerciaux_id_region_foreign` FOREIGN KEY (`id_region`) REFERENCES `regions`(`id_region`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `districts` ADD CONSTRAINT `districts_id_service_foreign` FOREIGN KEY (`id_service`) REFERENCES `services_commerciaux`(`id_service`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `secteurs` ADD CONSTRAINT `secteurs_id_district_foreign` FOREIGN KEY (`id_district`) REFERENCES `districts`(`id_district`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `secteurs` ADD CONSTRAINT `secteurs_id_service_foreign` FOREIGN KEY (`id_service`) REFERENCES `services_commerciaux`(`id_service`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `logs_administration` ADD CONSTRAINT `logs_administration_matricule_utilisateur_foreign` FOREIGN KEY (`matricule_utilisateur`) REFERENCES `utilisateurs`(`matricule`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- RenameIndex
ALTER TABLE `branches` RENAME INDEX `branches_nom_branche_key` TO `unq_branche_nom`;

-- RenameIndex
ALTER TABLE `regions` RENAME INDEX `regions_nom_region_key` TO `regions_nom_region_unique`;

-- RenameIndex
ALTER TABLE `roles` RENAME INDEX `roles_nom_role_key` TO `roles_nom_role_unique`;

-- RenameIndex
ALTER TABLE `utilisateurs` RENAME INDEX `utilisateurs_email_key` TO `utilisateurs_email_unique`;

-- RenameIndex
ALTER TABLE `utilisateurs` RENAME INDEX `utilisateurs_id_branche_fkey` TO `utilisateurs_id_branche_foreign`;
