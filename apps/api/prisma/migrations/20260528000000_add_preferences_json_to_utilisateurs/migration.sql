-- AlterTable: add preferences_json column to utilisateurs
ALTER TABLE `utilisateurs` ADD COLUMN `preferences_json` JSON NULL AFTER `date_naissance`;
