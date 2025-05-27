---
trigger: always_on
---

# ⚛️ Frontend React SABC - Règles de Développement

## **ARCHITECTURE FRONTEND**

### Structure Dossiers Obligatoire
```
resources/js/
├── Components/
│   ├── UI/                   # Design system
│   ├── Charts/               # Graphiques réutilisables
│   ├── Forms/                # Formulaires évaluation
│   ├── Dashboards/           # Composants dashboard
│   └── Layout/               # Layout components
├── Pages/                    # Pages Inertia.js
├── Services/                 # API calls
├── Types/                    # Types TypeScript
├── Hooks/                    # Custom hooks
└── Utils/                    # Fonctions utilitaires
```

### Conventions Nommage
- **Components** : PascalCase (DashboardCard.tsx)
- **Hooks** : camelCase + "use" prefix (useEvaluations.ts)
- **Types** : PascalCase + suffixe (EvaluationData.ts)
- **Utils** : camelCase (formatDate.ts)

## **COMPOSANTS REACT**

### Règles Composants Obligatoires
- Props typées avec interfaces TypeScript
- Export default en bas de fichier
- Maximum 200 lignes par composant
- Séparation logique/UI claire
- Props destructurées en paramètres

### Structure Standard
- Interface Props en premier
- useState avec types explicites
- useCallback pour functions stables
- useEffect avec dependencies complètes
- Cleanup obligatoire si event listeners

## **TYPESCRIPT STRICT**

### Types Métier SABC Obligatoires
- User, Evaluation, Role, Region interfaces
- Enums pour statuts et états
- Union types pour rôles hiérarchiques
- Optional chaining pour propriétés optionnelles
- No any - types précis toujours

### Règles TypeScript
- Strict mode activé obligatoirement
- Interfaces pour objets complexes
- Types explicites pour useState
- Return types pour functions importantes
- Error handling typé

## **GESTION D'ÉTAT**

### State Local vs Global
- State local pour UI (modals, tabs, forms)
- Context pour données partagées (user, notifications)
- Props drilling maximum 2 niveaux
- State mutations interdites

### Patterns Autorisés
- useState pour état simple
- useReducer pour état complexe
- Context + useContext pour global
- Custom hooks pour logique réutilisable

## **PERFORMANCE MOBILE**

### Lazy Loading Obligatoire
- Pages par rôle chargées à la demande
- Composants lourds (charts) en lazy
- Suspense avec fallback approprié
- Code splitting par fonctionnalité

### Bundle Size Strict
- Import sélectif uniquement
- Tree shaking configuré
- Analyse bundle regulière
- Limite 200KB bundle initial

## **API & SERVICES**

### Service API Unifié
- Classe ApiService centralisée
- Error handling uniforme
- CSRF tokens automatiques
- Types pour requests/responses
- Loading states gérés

### Règles API
- Endpoints RESTful uniquement
- Status codes HTTP respectés
- Timeout requests (10s max)
- Retry logic pour erreurs réseau

## **HOOKS PERSONNALISÉS**

### Règles Hooks
- Un seul concept par hook
- Dependencies array complet
- Cleanup dans useEffect obligatoire
- Error handling systématique
- Types de retour explicites

### Hooks SABC Standards
- useAuth : authentification
- useEvaluations : gestion évaluations
- useNotifications : système alertes
- useResponsive : détection mobile

## **RESPONSIVE DESIGN**

### Breakpoints Obligatoires
- Mobile : 320px-768px (priorité 1)
- Tablet : 768px-1024px
- Desktop : 1024px+

### Règles Mobile
- Touch targets minimum 44px
- Navigation hamburger obligatoire
- Tables transformées en cards
- Hover states adaptés tactile

## **INTERDICTIONS FRONTEND**

### Code Interdit
- any en TypeScript
- console.log en production
- CSS inline dans JSX
- Imports complets de librairies
- State mutations directes

### Pratiques Bannies
- Composants > 200 lignes
- useEffect sans dependencies
- Keys manquantes dans listes
- Memory leaks non nettoyés
- Logique métier dans composants UI

## **TESTS FRONTEND**

### Coverage Minimum
- Composants critiques : 90%
- Hooks personnalisés : 95%
- Utils functions : 100%
- Business logic : 100%

### Types Tests Obligatoires
- Unit tests pour hooks
- Component tests avec interactions
- Integration tests pour workflows
- E2E tests pour parcours critiques

## **VALIDATION FRONTEND**

### Checklist Développement
- [ ] TypeScript strict sans erreurs
- [ ] Bundle size < 200KB
- [ ] Mobile responsive testé
- [ ] Loading states implémentés
- [ ] Error handling complet
- [ ] Performance Lighthouse > 85
- [ ] Accessibilité WCAG AA