---
trigger: manual
---

# 🚀 Requêtes & Performance SABC - Règles Optimisation

## **PERFORMANCE CONTEXTE CAMEROUN**

### Contraintes Réalistes
- **Connexion 3G/4G** : Débit variable, latence 200-800ms
- **Bundle data coûteux** : Optimisation recommandée sans excès
- **Appareils variés** : Support Android bas de gamme
- **Infrastructure locale** : Adaptation aux conditions terrain

### Objectifs Performance Raisonnables
- **Temps chargement** : < 5 secondes acceptable sur 3G
- **Bundle initial** : < 300KB objectif, 250KB idéal
- **API response** : < 1 seconde acceptable
- **Base de données** : < 200ms par requête standard

## **OPTIMISATION BASE DE DONNÉES**

### Index Recommandés
- **Index principaux** : Colonnes de recherche fréquente
- **Index composés** : Combinaisons utilisées ensemble
- **Index conditionnels** : Avec WHERE pour optimiser
- **Éviter sur-indexation** : Balance performance/espace

### Bonnes Pratiques Requêtes
- **Eager loading encouragé** : Relations fréquemment utilisées
- **Select conscient** : Éviter SELECT * si possible
- **Pagination raisonnable** : 50-100 items selon contexte
- **Cache intelligent** : Données stables et calculs coûteux

### Éviter les Anti-Patterns
- **N+1 queries** : Détecter et corriger
- **Requêtes en boucle** : Regrouper quand possible
- **Joins excessifs** : Limiter selon besoin réel
- **COUNT inutiles** : Approximations acceptables

## **STRATÉGIE CACHE FLEXIBLE**

### Cache Backend Adaptatif
- **Dashboards** : 3-10 minutes selon fréquence usage
- **Métriques** : 10-30 minutes pour calculs lourds
- **Référentiels** : 1-6 heures données quasi-statiques
- **Sessions** : Cache rôles et permissions de base

### Invalidation Intelligente
- **Tags ciblés** : Par utilisateur, région, service
- **Cascade raisonnée** : Impact réel sur données
- **TTL adaptatif** : Selon fréquence changement observée
- **Warm-up optionnel** : Dashboards très utilisés

### Cache Frontend Pragmatique
- **API responses** : 1-5 minutes selon stabilité
- **Assets statiques** : Cache long avec versioning
- **Component memoization** : Pour composants coûteux
- **Service Worker** : Optionnel, selon besoins offline

## **API & REQUÊTES OPTIMISÉES**

### Pagination Sensée
- **Limite adaptée** : 25-100 selon type données
- **Pagination simple** : Offset acceptable pour listes courtes
- **Métadonnées utiles** : Total et navigation
- **Filtres serveur** : Pour listes importantes

### Optimisation Réponses
- **Serialization efficace** : Structure cohérente
- **Compression activée** : GZIP automatique
- **Headers cache** : ETags et Last-Modified
- **Rate limiting modéré** : 200-500 requests/minute

## **FRONTEND PERFORMANCE RÉALISTE**

### Bundle Management
- **Code splitting** : Par routes principales
- **Lazy loading** : Composants non-critiques
- **Tree shaking** : Configuration basique
- **Analyse régulière** : Monitoring taille

### Optimisations Pratiques
- **Images optimisées** : WebP quand supporté, fallback
- **Fonts efficaces** : Subset ou system fonts
- **State minimal** : Éviter complexité inutile
- **Debouncing** : Recherches et saisies

## **MONITORING RAISONNABLE**

### Métriques Essentielles Backend
- **Response time moyen** : < 800ms acceptable
- **Queries par request** : < 15 tolérable
- **Memory usage** : Monitoring sans seuils stricts
- **Error rate** : < 10% acceptable

### Métriques Frontend Flexibles
- **First Paint** : < 3 secondes objectif
- **Interactive** : < 6 secondes acceptable
- **Bundle size** : Monitoring sans blocage
- **User experience** : Feedback utilisateurs réels

### Alerting Modéré
- **Performance critique** : Seulement si > 3 secondes
- **Erreurs importantes** : Si > 15% pendant 5 minutes
- **Disponibilité** : Alerte si downtime > 2 minutes
- **Tendances** : Rapports hebdomadaires vs alertes

## **MOBILE & ACCESSIBILITÉ**

### Adaptations Mobile Sensées
- **Données prioritaires** : Charger l'essentiel d'abord
- **Images responsives** : Tailles adaptées sans excès
- **Touch targets** : 44px minimum recommandé
- **Navigation adaptée** : Hamburger menu mobile

### Détection Connexion Optionnelle
- **Mode dégradé** : Si détection disponible
- **Retry intelligent** : Backoff simple
- **Timeout raisonnable** : 10-15 secondes mobile
- **Offline basic** : Cache critique seulement

## **SÉCURITÉ ÉQUILIBRÉE**

### Protection Efficace
- **Rate limiting adapté** : Selon usage réel observé
- **Authentication rapide** : Cache permissions courantes
- **CSRF protection** : Standard sans optimisation excessive
- **Logs sécurisé** : Sans impact performance notable

## **RÈGLES DÉVELOPPEMENT PRAGMATIQUES**

### Bonnes Pratiques Recommandées
- **Eager loading** : Relations vraiment utilisées
- **Pagination** : Listes > 100 items
- **Cache stratégique** : Calculs coûteux identifiés
- **Bundle conscious** : Awareness sans obsession

### Éviter les Excès
- **Sur-optimisation prématurée** : Mesurer avant optimiser
- **Cache complexe** : Simplicité prioritaire
- **Micro-optimisations** : ROI faible éviter
- **Performance parfaite** : 80/20 rule appliquer

## **VALIDATION PROGRESSIVE**

### Tests Performance Adaptés
- **Load testing** : 20-50 utilisateurs simultanés
- **Mobile testing** : Quelques tests sur vraies connexions
- **Bundle monitoring** : Tendances plus qu'absolus
- **User feedback** : Intégrer retours réels

### Amélioration Continue
- **Profiling périodique** : Identifier vrais goulots
- **Monitoring léger** : Métriques utiles sans surcharge
- **Optimisations ciblées** : Effort/impact équilibré
- **Documentation simple** : Bonnes pratiques partagées