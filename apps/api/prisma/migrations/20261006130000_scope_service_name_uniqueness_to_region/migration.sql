ALTER TABLE `services_commerciaux`
  DROP INDEX `services_commerciaux_nom_service_unique`,
  DROP INDEX `services_commerciaux_nom_service_index`,
  ADD UNIQUE INDEX `services_commerciaux_nom_service_id_region_unique` (`nom_service`, `id_region`);