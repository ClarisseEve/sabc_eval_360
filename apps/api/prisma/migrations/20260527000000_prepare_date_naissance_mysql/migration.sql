-- Repair the legacy migration chain without rewriting either published file.
-- The following preferences migration places its column AFTER date_naissance,
-- while the original core migration did not create date_naissance on a fresh DB.
SET @date_naissance_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'utilisateurs'
    AND COLUMN_NAME = 'date_naissance'
);

SET @date_naissance_ddl = IF(
  @date_naissance_exists = 0,
  'ALTER TABLE `utilisateurs` ADD COLUMN `date_naissance` DATE NULL AFTER `telephone`',
  'SELECT 1'
);

PREPARE date_naissance_statement FROM @date_naissance_ddl;
EXECUTE date_naissance_statement;
DEALLOCATE PREPARE date_naissance_statement;
