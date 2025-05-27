#!/bin/bash

# Créer les dossiers nécessaires s'ils n'existent pas
mkdir -p resources/js/components/ui/Table
mkdir -p resources/js/components/ui/Status
mkdir -p resources/js/components/ui/Skeleton
mkdir -p resources/js/components/Dashboard

# Copier les fichiers vers les bons dossiers
cp -f resources/js/Components/UI/Table/Table.tsx resources/js/components/ui/Table/
cp -f resources/js/Components/UI/Status/StatusBadge.tsx resources/js/components/ui/Status/
cp -f resources/js/Components/UI/Skeleton/Skeleton.tsx resources/js/components/ui/Skeleton/
cp -f resources/js/Components/Dashboard/EvaluationList.tsx resources/js/components/Dashboard/
cp -f resources/js/Components/Dashboard/EvaluationStats.tsx resources/js/components/Dashboard/
cp -f resources/js/Components/Dashboard/SkillsRadar.tsx resources/js/components/Dashboard/

# Supprimer les dossiers avec la mauvaise casse
rm -rf resources/js/Components

echo "Composants déplacés avec succès!"
