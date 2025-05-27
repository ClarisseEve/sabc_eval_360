---
trigger: always_on
---

# 🎨 Design System SABC - Règles Graphiques

## **PALETTE DE COULEURS STRICTE**

### Couleurs Primaires (OBLIGATOIRES)
```css
--sabc-red-primary: #E53E3E;    /* Rouge SABC principal */
--sabc-red-light: #FED7D7;      /* Rouge clair backgrounds */
--sabc-red-dark: #C53030;       /* Rouge foncé hover/active */
--sabc-accent: #FF9800;         /* Orange accent */
--sabc-accent-light: #FFE0B2;   /* Orange clair */
```

### Nuances de Gris (COMPLÈTES)
```css
--sabc-gray-50: #F5F5F5;        /* Background app */
--sabc-gray-100: #F5F5F5;       /* Background cards */
--sabc-gray-200: #E0E0E0;       /* Bordures, séparateurs */
--sabc-gray-400: #9E9E9E;       /* Texte secondaire */
--sabc-gray-800: #424242;       /* Texte principal */
--sabc-gray-900: #1A202C;       /* Titres importants */
```

### Couleurs Fonctionnelles
```css
--sabc-success: #48BB78;        /* Validations */
--sabc-warning: #D69E2E;        /* Alertes */
--sabc-error: #E53E3E;          /* Erreurs (rouge SABC) */
--sabc-info: #3182CE;           /* Informations */
```

## **TYPOGRAPHIE PROFESSIONNELLE**

### Police Principale : Poppins (Titres)
- **H1** : 28px, font-weight: 700 (Titres principaux)
- **H2** : 24px, font-weight: 600 (Titres sections)
- **H3** : 20px, font-weight: 600 (Sous-titres)
- **H4** : 18px, font-weight: 500 (Éléments importants)

### Police Secondaire : Inter (Contenu)
- **Body Large** : 16px, font-weight: 400 (Texte principal)
- **Body** : 14px, font-weight: 400 (Texte standard)
- **Small** : 12px, font-weight: 400 (Légendes)
- **Caption** : 10px, font-weight: 500 (Labels, badges)

## **COMPOSANTS UI STANDARDS**

### Dashboard Cards
```css
.dashboard-card {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  border: 1px solid #E0E0E0;
  transition: transform 0.2s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

**Règles Cards :**
- Padding minimum : 20px
- Espacement entre cards : 16px
- Maximum 3-4 éléments par card
- Maximum 2 boutons d'action

### Badges & États
```css
.badge-primary { background: #E53E3E; color: white; }
.badge-success { background: #48BB78; color: white; }
.badge-warning { background: #FF9800; color: white; }
.badge-secondary { background: #9E9E9E; color: white; }
```

Spécifications :
- padding: 4px 12px
- border-radius: 12px
- font-size: 12px
- font-weight: 500

### Barres de Progression
```css
.progress-bar {
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #E53E3E;
  border-radius: 4px;
  transition: width 0.3s ease;
}
```

## **RÈGLES RESPONSIVE**

### Breakpoints Obligatoires
- **Mobile** : 320px - 768px (Priorité 1 - 70% utilisateurs)
- **Tablet** : 768px - 1024px (20% utilisateurs)
- **Desktop** : 1024px+ (10% utilisateurs)

### Adaptations Mobile
- Cards : Stack vertical, padding 16px
- Tables : Transformation en cards
- Touch targets : Minimum 44px
- Navigation : Hamburger menu obligatoire

## **INTERDICTIONS STRICTES**

### Couleurs Interdites
- Bleu primaire (confusion concurrent)
- Vert primaire (réservé succès)
- Violet/rose (non-aligné SABC)
- Couleurs custom hors palette

### Typographie Interdite
- Autres polices que Poppins/Inter
- Tailles non-standardisées
- Texte < 10px (accessibilité)
- Letterspacing négatif

### Animations Interdites
- Durée > 0.5 secondes
- Bounce/elastic excessifs
- Clignotements
- Animations sans purpose

## **VALIDATION DESIGN**

### Checklist Obligatoire
- [ ] Couleurs palette SABC respectée
- [ ] Typographie Poppins/Inter uniquement
- [ ] Espacement multiple de 4px
- [ ] États hover/active définis
- [ ] Mobile responsive testé
- [ ] Contraste AA respecté
- [ ] Performance < 2s chargement