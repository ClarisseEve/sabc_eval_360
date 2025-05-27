---
trigger: manual
---

# ⚙️ Backend Laravel SABC - Règles de Développement
### Organisation Dossiers Recommandée
```
app/
├── Http/Controllers/         # Contrôleurs API et vues
├── Models/                   # Modèles Eloquent
├── Services/                 # Logique métier
├── Policies/                 # Autorisations granulaires
└── Console/Commands/         # Commandes pipelines
```

### Règles Nommage Flexibles
- **Controllers** : PascalCase + "Controller" suffix
- **Models** : PascalCase singulier cohérent
- **Services** : PascalCase + "Service" suffix
- **Requests** : Action + Model + "Request"

## **MODELS & RELATIONS**

### Models Principaux SABC
- User, Evaluation, Region, ServiceCommercial
- EntiteOrganisationnelle, Role, Competence
- Relations avec foreign keys explicites
- Scopes pour requêtes fréquentes

### Bonnes Pratiques Relations
- Relations nommées clairement
- Foreign keys cohérentes (id_*)
- Eager loading des relations utilisées
- Accessors/Mutators pour logique simple

## **SERVICES & BUSINESS LOGIC**

### Services Métier Recommandés
- **EvaluationService** : Règles évaluation 360°
- **HierarchieService** : Navigation organisationnelle
- **AnalyticsService** : Calculs métriques
- **NotificationService** : Système alertes

### Pattern Service Layer
- Une responsabilité par service
- Injection dépendances dans constructeur
- Pas de requêtes DB directes dans controllers
- Logique testable et réutilisable

## **CONTROLLERS & API**

### Structure Controllers Sensée
- Maximum 10 méthodes par controller
- Form Requests pour validation complexe
- Resources pour transformation responses
- Logique métier dans services

### API RESTful Cohérente
- Endpoints standards (index, show, store, update, destroy)
- Status codes HTTP appropriés
- Responses JSON uniformes
- Error handling centralisé

## **VALIDATION & SÉCURITÉ**

### Form Requests Recommandées
- Validation rules centralisées
- Authorization dans authorize()
- Messages erreur français
- Sanitization des données entrantes

### Sécurité Raisonnable
- CSRF protection activée
- Validation input systématique
- Policies pour autorisations complexes
- Logs sécurisés sans données sensibles

### Protection XSS & Injection
- Échappement automatique Blade
- Eloquent pour requêtes (pas de raw SQL)
- Validation stricte données critiques
- Sanitization commentaires utilisateur

## **CACHE & PERFORMANCE**

### Stratégie Cache Adaptative
- Tags cache pour invalidation ciblée
- TTL selon fréquence changement données
- Cache dashboards 5-15 minutes
- Métriques cache 15-30 minutes

### Optimisation Requêtes
- Eager loading relations nécessaires
- Index sur colonnes recherche/tri
- Pagination listes importantes
- Select spécifique si bénéfice clair

## **MIGRATIONS & BASE DE DONNÉES**

### Bonnes Pratiques Migrations
- Nommage descriptif et chronologique
- Contraintes foreign keys explicites
- Index sur colonnes fréquemment utilisées
- Rollback toujours possible et testé

### Gestion Données
- Seeders pour données référentiel
- Factories pour tests avec données réalistes
- Soft deletes pour données critiques
- Backup régulier et procédure restauration

## **ARTISAN COMMANDS**

### Commands Pipeline Data
- Intégration Python via Process
- Gestion erreurs et logging approprié
- Options flexibles (région, période)
- Progress indicators pour tâches longues

### Scheduling Raisonnable
- Tâches critiques quotidiennes
- Nettoyage hebdomadaire
- Rapports automatiques mensuels
- Monitoring santé système

## **GESTION ERREURS & LOGS**

### Error Handling Centralisé
- Exception Handler personnalisé
- Messages utilisateur compréhensibles
- Logs détaillés pour debugging
- Notifications erreurs critiques

### Logging Structuré
- Canaux séparés (audit, erreurs, performance)
- Informations contextuelles utiles
- Rotation logs automatique
- Pas de données sensibles en logs

## **TESTS & QUALITÉ**

### Coverage Raisonnable
- **Models** : 80% coverage minimum
- **Services** : 75% coverage objectif
- **Controllers** : 60% coverage acceptable
- **Business rules** : 90% coverage critique

### Types Tests Recommandés
- Unit tests pour services et helpers
- Feature tests pour endpoints API
- Browser tests pour workflows critiques
- Tests performances pour requêtes lourdes

## **INTERDICTIONS RAISONNABLES**

### Éviter Absolument
- SQL injection (toujours Eloquent/QB)
- Données hardcodées dans code
- Logique métier dans vues/controllers
- Passwords en plain text

### Éviter Si Possible
- Requêtes dans boucles foreach
- SELECT * sur grandes tables
- Calculs lourds sans cache
- Controllers > 200 lignes

## **ENVIRONNEMENTS & DÉPLOIEMENT**

### Configuration Environnements
- Variables .env pour configuration
- Config cache en production
- Debug désactivé production
- Logs appropriés par environnement

### Déploiement Sécurisé
- Maintenance mode pendant déploiement
- Migrations automatiques testées
- Cache clear après déploiement
- Rollback plan défini

## **MONITORING & MAINTENANCE**

### Surveillance Recommandée
- Logs erreurs consultés régulièrement
- Performance queries surveillée
- Espace disque et mémoire
- Santé services externes

### Maintenance Préventive
- Nettoyage logs anciens
- Update sécurité Laravel régulières

## **INTÉGRATION PYTHON**

### Communication Laravel-Python
- Process Symfony pour exécution scripts
- Échange données via fichiers JSON/CSV
- Timeout appropriés (5-10 minutes)
- Gestion erreurs pipeline robuste

### Data Pipeline Integration
- Commands Artisan pour déclencher
- Logs pipeline dans Laravel
- Import résultats automatisé
- Cache invalidation post-processing

## **BONNES PRATIQUES GÉNÉRALES**

### Code Quality
- Conventions PSR-12 respectées
- Nommage explicite et cohérent
- Commentaires pour logique complexe
- Refactoring régulier code dupliqué

### Documentation
- README projet à jour
- API endpoints documentés
### Collaboration
- Git commits descriptifs
- Code review pour changements importants
- Tests automatisés dans CI/CD