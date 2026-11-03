ALTER TABLE `utilisateurs`
    DROP FOREIGN KEY `utilisateurs_manager_matricule_foreign`,
    MODIFY `matricule` VARCHAR(6) NOT NULL,
    MODIFY `manager_matricule` VARCHAR(6) NULL;

ALTER TABLE `utilisateurs`
    ADD CONSTRAINT `utilisateurs_manager_matricule_foreign`
    FOREIGN KEY (`manager_matricule`) REFERENCES `utilisateurs`(`matricule`)
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `logs_administration`
    DROP FOREIGN KEY `logs_administration_matricule_utilisateur_foreign`,
    MODIFY `matricule_utilisateur` VARCHAR(6) NULL;

ALTER TABLE `logs_administration`
    ADD CONSTRAINT `logs_administration_matricule_utilisateur_foreign`
    FOREIGN KEY (`matricule_utilisateur`) REFERENCES `utilisateurs`(`matricule`)
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `notifications_utilisateurs`
    MODIFY `destinataire_matricule` VARCHAR(6) NOT NULL,
    MODIFY `expediteur_matricule` VARCHAR(6) NULL;

ALTER TABLE `replacement_temporaire`
    MODIFY `titulaire_matricule` VARCHAR(6) NOT NULL,
    MODIFY `remplacant_matricule` VARCHAR(6) NOT NULL,
    MODIFY `cree_par` VARCHAR(6) NOT NULL;

ALTER TABLE `sessions`
    MODIFY `user_id` VARCHAR(6) NULL;
