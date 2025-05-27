#!/bin/bash

# Script pour résoudre les problèmes de casse dans la structure des dossiers

# Créer une structure temporaire pour sauvegarder les fichiers importants
mkdir -p /tmp/sabc_backup/Components/UI/Button
mkdir -p /tmp/sabc_backup/Components/UI/Avatar
mkdir -p /tmp/sabc_backup/Components/UI/Status
mkdir -p /tmp/sabc_backup/Components/UI/Tooltip
mkdir -p /tmp/sabc_backup/Components/UI/Badge
mkdir -p /tmp/sabc_backup/Components/UI/Slider
mkdir -p /tmp/sabc_backup/Components/Layout
mkdir -p /tmp/sabc_backup/Components/Dashboard

# Sauvegarder les fichiers importants
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Button/Button.tsx /tmp/sabc_backup/Components/UI/Button/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Avatar/Avatar.tsx /tmp/sabc_backup/Components/UI/Avatar/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Status/StatusBadge.tsx /tmp/sabc_backup/Components/UI/Status/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Tooltip/Tooltip.tsx /tmp/sabc_backup/Components/UI/Tooltip/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Badge/Badge.tsx /tmp/sabc_backup/Components/UI/Badge/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Slider/Slider.tsx /tmp/sabc_backup/Components/UI/Slider/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/Layout/Header.tsx /tmp/sabc_backup/Components/Layout/ 2>/dev/null || true

cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Button/Button.tsx /tmp/sabc_backup/Components/UI/Button/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Avatar/Avatar.tsx /tmp/sabc_backup/Components/UI/Avatar/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Status/StatusBadge.tsx /tmp/sabc_backup/Components/UI/Status/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Tooltip/Tooltip.tsx /tmp/sabc_backup/Components/UI/Tooltip/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Badge/Badge.tsx /tmp/sabc_backup/Components/UI/Badge/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Slider/Slider.tsx /tmp/sabc_backup/Components/UI/Slider/ 2>/dev/null || true
cp -f /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/Layout/Header.tsx /tmp/sabc_backup/Components/Layout/ 2>/dev/null || true

# Supprimer complètement les dossiers components et Components
rm -rf /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components
rm -rf /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components

# Créer la structure de dossiers avec la casse correcte (PascalCase selon les règles SABC)
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Button
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Avatar
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Status
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Tooltip
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Badge
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Slider
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/Layout
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/Dashboard

# Restaurer les fichiers depuis la sauvegarde
cp -f /tmp/sabc_backup/Components/UI/Button/Button.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Button/ 2>/dev/null || true
cp -f /tmp/sabc_backup/Components/UI/Avatar/Avatar.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Avatar/ 2>/dev/null || true
cp -f /tmp/sabc_backup/Components/UI/Status/StatusBadge.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Status/ 2>/dev/null || true
cp -f /tmp/sabc_backup/Components/UI/Tooltip/Tooltip.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Tooltip/ 2>/dev/null || true
cp -f /tmp/sabc_backup/Components/UI/Badge/Badge.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Badge/ 2>/dev/null || true
cp -f /tmp/sabc_backup/Components/UI/Slider/Slider.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Slider/ 2>/dev/null || true
cp -f /tmp/sabc_backup/Components/Layout/Header.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/Layout/ 2>/dev/null || true

# Nettoyer la sauvegarde temporaire
rm -rf /tmp/sabc_backup

echo "Structure corrigée avec succès !"
