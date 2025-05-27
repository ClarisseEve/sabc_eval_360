---
trigger: always_on
---

# 🧩 Composants UI SABC - Standards & Règles

## **DASHBOARDS PAR RÔLE**

### Dashboard DR (Directeur Régional)
**Spécifications visuelles :**
- Couleur dominante : Rouge SABC #E53E3E
- Layout : Grid 3 colonnes desktop
- KPIs : 4 métriques principales en header
- Graphiques : Bar charts performance par service
- Section "Actions Requises" avec alertes colorées

**Composants obligatoires :**
- Cards métriques avec pourcentages et flèches tendance
- Graphique barres comparatif services
- Liste talents haut potentiel (badges verts)
- Alertes urgentes (fond rouge/jaune/vert)

### Dashboard CDTT (Chef Département)
**Spécifications visuelles :**
- Dual view : Onglets Commercial/Marketing
- Cards équipe : Avatars circulaires colorés
- États : "En cours", "Terminé", "À évaluer"
- Analytics : Radar charts comparatifs

**Composants obligatoires :**
- Système onglets Commercial/Marketing
- Cards collaborateurs avec avatars initiales
- Badges statut colorés par état
- Graphiques radar par branche

### Dashboard CSC/RTM (Managers)
**Spécifications visuelles :**
- Focus équipe : Table avec progressions
- Métriques : 4 KPIs en cards horizontales
- Plans d'action : Cards bordures colorées
- Avatars : Initiales cercles colorés

**Composants obligatoires :**
- Table responsive équipe
- Barres progression intégrées
- Section plans d'action priorités
- Métriques KPI en header

### Dashboard CDS/AS (Opérationnels)
**Spécifications visuelles :**
- Profil central : Avatar large avec badges
- Radar personnel : Comparaison pairs
- Plan développement : Timeline statuts
- Progression : Barres pourcentages

**Composants obligatoires :**
- Avatar profile central
- Graphique radar compétences
- Timeline formations avec statuts
- Section pairs à évaluer

## **FORMULAIRES D'ÉVALUATION**

### Sliders d'Évaluation (Innovation)
```css
.evaluation-slider {
  width: 100%;
  height: 6px;
  background: #E0E0E0;
  border-radius: 5px;
  margin: 15px 0;
}

.evaluation-slider::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  background: #E53E3E;
  border-radius: 50%;
  cursor: pointer;
}
```

**Règles sliders :**
- Remplacent OBLIGATOIREMENT radio buttons
- Échelle 1-5 avec descriptions contextuelles
- Tooltip niveau sélectionné
- Feedback visuel immédiat

### Structure Formulaire
- Progression en header (barre)
- Groupes compétences par domaine
- Descriptions niveau apparaissent selon valeur
- Auto-save avec indicateur visuel
- Validation avant soumission

## **GRAPHIQUES & ANALYTICS**

### Types Autorisés
1. **Radar Charts** : Profils compétences
2. **Bar Charts** : Comparaisons performance
3. **Line Charts** : Évolutions temporelles
4. **Heatmaps** : Matrices équipes
5. **Donut Charts** : Répartitions pourcentages

### Couleurs Graphiques (Ordre priorité)
1. #E53E3E (Rouge SABC - principal)
2. #3182CE (Bleu - secondaire)
3. #48BB78 (Vert - succès)
4. #FF9800 (Orange - accent)
5. #9E9E9E (Gris - neutre)
6. #D69E2E (Jaune - attention)

### Spécifications Techniques
- Legends : Position bottom uniquement
- Tooltips : Background blanc, shadow subtile
- Axes : Couleur #9E9E9E, taille 12px
- Animations : Entrée progressive max 0.5s

## **AVATARS & IDENTITÉ VISUELLE**

### Avatars Collaborateurs
```css
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
}
```

**Couleurs avatars par performance :**
- Excellent (4.5-5.0) : #48BB78 (vert)
- Bon (3.5-4.4) : #FF9800 (orange)
- Moyen (2.5-3.4) : #9E9E9E (gris)
- Faible (1.0-2.4) : #E53E3E (rouge)

### Badges & Achievements
- Forme : Cercles 32px avec icônes
- Couleurs : Jaune étoile, rouge cœur, bleu œil
- Position : Alignés horizontalement
- Usage : Reconnaissance accomplissements

## **TABLES & LISTES**

### Tables Responsives
**Desktop :**
- Headers : Background #F5F5F5
- Alternance lignes : White / #FAFAFA
- Actions : Maximum 2 boutons/ligne
- Pagination : En bas avec info total

**Mobile :**
- Transformation obligatoire en cards
- Informations essentielles seulement
- Actions en boutons empilés
- Scroll vertical seulement

### Listes à Évaluer
- Avatar + nom + rôle
- Statut avec badge coloré
- Action principale (bouton rouge)
- Métadata (dates, progression)

## **ÉTATS & FEEDBACK**

### États Évaluations
```css
.status-draft { color: #9E9E9E; background: #F5F5F5; }
.status-pending { color: #FF9800; background: #FFF3E0; }
.status-completed { color: #48BB78; background: #F0FFF4; }
.status-overdue { color: #E53E3E; background: #FFF5F5; }
```

### Messages Système
- **Succès** : Fond #F0FFF4, texte #48BB78
- **Attention** : Fond #FFF3E0, texte #FF9800
- **Erreur** : Fond #FFF5F5, texte #E53E3E
- **Info** : Fond #EBF8FF, texte #3182CE

### Loading States
- Skeleton screens : Couleur #F5F5F5
- Spinners : Rouge SABC #E53E3E
- Progress bars : Animation fluide
- Feedback immédiat : < 100ms

## **NAVIGATION & STRUCTURE**

### Navigation Principale
- Logo SABC en header
- Menu adaptatif par rôle
- Breadcrumbs si navigation profonde
- Logout toujours accessible

### Micro-interactions
- Hover : translateY(-2px)
- Active : scale(0.98)
- Focus : outline rouge SABC
- Disabled : opacity 0.5

## **VALIDATION COMPOSANTS**

### Checklist UI
- [ ] Couleurs respectent palette SABC
- [ ] Responsive mobile testé
- [ ] États hover/active/disabled
- [ ] Feedback utilisateur immédiat
- [ ] Performance optimisée
- [ ] Accessibilité WCAG AA
- [ ] Cohérence avec autres composants