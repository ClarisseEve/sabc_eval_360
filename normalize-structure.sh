#!/bin/bash

# Script pour normaliser la structure des dossiers et résoudre les problèmes de casse

# Créer une structure temporaire avec la casse correcte
mkdir -p /tmp/sabc_structure/Components/UI/Button
mkdir -p /tmp/sabc_structure/Components/UI/Avatar
mkdir -p /tmp/sabc_structure/Components/UI/Status
mkdir -p /tmp/sabc_structure/Components/UI/Tooltip
mkdir -p /tmp/sabc_structure/Components/UI/Badge
mkdir -p /tmp/sabc_structure/Components/UI/Slider
mkdir -p /tmp/sabc_structure/Components/Layout
mkdir -p /tmp/sabc_structure/Components/Dashboard

# Copier les fichiers vers la structure temporaire
cp /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Button/Button.tsx /tmp/sabc_structure/Components/UI/Button/
cp /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Avatar/Avatar.tsx /tmp/sabc_structure/Components/UI/Avatar/
cp /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Status/StatusBadge.tsx /tmp/sabc_structure/Components/UI/Status/
cp /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Tooltip/Tooltip.tsx /tmp/sabc_structure/Components/UI/Tooltip/
cp /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Badge/Badge.tsx /tmp/sabc_structure/Components/UI/Badge/
cp /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui/Slider/Slider.tsx /tmp/sabc_structure/Components/UI/Slider/
cp /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/Layout/Header.tsx /tmp/sabc_structure/Components/Layout/

# Supprimer les dossiers existants avec la casse incorrecte
rm -rf /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/ui
rm -rf /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI
rm -rf /Users/macbook/Documents/SABC/sabc_eval360/resources/js/components/Layout
rm -rf /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/Layout

# Créer les dossiers avec la casse correcte
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Button
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Avatar
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Status
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Tooltip
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Badge
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Slider
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/Layout
mkdir -p /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/Dashboard

# Copier les fichiers depuis la structure temporaire
cp /tmp/sabc_structure/Components/UI/Button/Button.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Button/
cp /tmp/sabc_structure/Components/UI/Avatar/Avatar.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Avatar/
cp /tmp/sabc_structure/Components/UI/Status/StatusBadge.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Status/
cp /tmp/sabc_structure/Components/UI/Tooltip/Tooltip.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Tooltip/
cp /tmp/sabc_structure/Components/UI/Badge/Badge.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Badge/
cp /tmp/sabc_structure/Components/UI/Slider/Slider.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/UI/Slider/
cp /tmp/sabc_structure/Components/Layout/Header.tsx /Users/macbook/Documents/SABC/sabc_eval360/resources/js/Components/Layout/

# Nettoyer la structure temporaire
rm -rf /tmp/sabc_structure

echo "Structure normalisée avec succès !"
