---
trigger: manual
---

Requêtes & Performance SABC - Règles d'Optimisation
1. Performance dans le Contexte Camerounais
1.1. Contraintes Environnementales Réalistes
L'infrastructure réseau et les équipements au Cameroun imposent des considérations spécifiques :

Connexion 3G/4G : Débits variables, latence typique 200-800ms.

Coût des données (Bundle data) : Optimisation de la consommation de données sans compromettre les fonctionnalités clés.

Appareils variés : Fonctionnalité sur large éventail d'appareils Android, y compris entrée de gamme.

Infrastructure locale : Adaptation aux conditions terrain essentielle pour l'adoption.

1.2. Objectifs de Performance Raisonnables
Nous visons les indicateurs suivants, atteignables pour une bonne expérience utilisateur :

Temps de chargement initial : Moins de 5 secondes sur connexion 3G typique.

Taille du bundle initial (frontend) : Objectif < 300KB, idéal 250KB.

Temps de réponse API : Moins de 1 seconde pour requêtes standards.

Temps de réponse Base de Données : Moins de 200ms par requête standard.

2. Optimisation de la Base de Données
2.1. Stratégie d'Indexation
Une indexation réfléchie accélère les requêtes sans surcharger la BD :

Index principaux : Pour colonnes de recherche fréquente (clés primaires, clés étrangères dans WHERE/JOIN).

Index composés : Pour combinaisons de colonnes souvent utilisées ensemble.

Index conditionnels : Envisageables pour requêtes spécifiques avec clauses WHERE complexes.

Éviter la sur-indexation : Équilibrer performance en lecture avec impact sur écritures et espace disque.

2.2. Bonnes Pratiques de Requêtes
Pour une performance optimale, les requêtes doivent suivre ces lignes directrices :

Eager loading : Fortement encouragé pour les relations de modèles fréquemment accédées afin de réduire les requêtes N+1.

Sélection de colonnes (SELECT) : Spécifier explicitement les colonnes nécessaires plutôt que SELECT *, surtout pour tables larges.

Pagination réaliste : Paginage des listes de données (50-100 éléments/page), adapté au contexte d'affichage.

Cache intelligent (DB) : Résultats de requêtes complexes ou sur données stables peuvent être cachés pour réduire la charge.

2.3. Gestion des Anti-Patterns Courants
Il est essentiel d'identifier et de corriger les schémas de requêtes inefficaces :

N+1 queries : Détecter et refactoriser pour utiliser eager loading ou joins appropriés.

Requêtes en boucle : Opérations sur collections de données devraient être regroupées en une seule requête optimisée si possible.

Joins excessifs : Limiter le nombre de joins au strict nécessaire. La dénormalisation ciblée est une solution.

COUNT inutiles : Pour affichages où l'exactitude n'est pas critique, des approximations ou valeurs mises en cache peuvent être acceptables.

3. Stratégie de Cache Flexible
3.1. Cache Backend Adaptatif
Le cache backend doit être flexible selon la nature et volatilité des données :

Dashboards : Cache de 3 à 10 minutes selon la fréquence d'actualisation.

Métriques agrégées : Résultats de calculs lourds cachés pour 10 à 30 minutes.

Référentiels : Données quasi-statiques (rôles, régions) peuvent avoir un TTL de 1 à 6 heures.

Sessions utilisateur : Cache des permissions de base pour accélérer les vérifications d'autorisation.

3.2. Invalidation Intelligente du Cache
La stratégie d'invalidation doit être efficace et proportionnée :

Tags ciblés : Utiliser des tags (par utilisateur, région, service) pour invalider précisément les données modifiées.

Cascade raisonnée : L'invalidation ne doit impacter que les données réellement affectées par un changement.

TTL adaptatif : La durée de vie (TTL) du cache peut être ajustée dynamiquement selon la fréquence de modification observée.

Warm-up optionnel : Un mécanisme de "warm-up" peut pré-remplir le cache après invalidation pour les dashboards très consultés.

3.3. Cache Frontend Pragmatique
L'optimisation du cache côté client complète les efforts backend :

Réponses API : Cache local des réponses (localStorage, IndexedDB) pour 1 à 5 minutes selon la stabilité.

Assets statiques : Longue durée de vie du cache avec versioning (ex: app.js?v=1.2.3) pour les mises à jour.

Component memoization : Pour les composants React coûteux en rendu, éviter les re-rendus inutiles.

Service Worker : Envisageable pour support offline basique ou gestion améliorée du cache, selon les besoins.

4. API & Requêtes Optimisées
4.1. Pagination Sensée des API
La pagination doit optimiser la charge réseau et l'expérience utilisateur :

Limite adaptée : Taille de page (25 pour détaillé, 100 pour simple) adaptée au type de données.

Pagination simple (offset-based) : Acceptable pour listes courtes. Pour larges ensembles de données, une approche cursor-based est plus robuste.

Métadonnées utiles : Réponses paginées doivent inclure total, page courante, et liens de navigation.

Filtres côté serveur : Appliquer filtres et tris côté serveur pour listes importantes afin de réduire les transferts.

4.2. Optimisation des Réponses API
Pour minimiser taille et temps de transfert des réponses :

Serialization efficace : Utiliser des outils de serialization (ex: Laravel API Resources) pour des réponses cohérentes et ne renvoyer que les données nécessaires.

Compression activée : Assurer GZIP (ou Brotli) activée au niveau du serveur web pour toutes les réponses JSON/textuelles.

Headers de cache : Configurer en-têtes HTTP de cache (ETag, Last-Modified, Cache-Control) pour la mise en cache client et la validation conditionnelle.

Rate limiting modéré : Protéger l'API des abus avec des seuils raisonnables (ex: 200-500 requêtes/minute/utilisateur) basés sur l'usage réel.

5. Performance Frontend Réaliste
5.1. Gestion du Bundle JavaScript
La taille du bundle JS est un facteur clé :

Code splitting : Diviser le code JS en petits chunks, chargés sur demande.

Lazy loading : Charger les composants non-critiques uniquement si nécessaires.

Tree shaking : Configurer les outils de build pour éliminer le code mort.

Analyse régulière : Surveiller la taille du bundle pour identifier les augmentations et opportunités d'optimisation.

5.2. Optimisations Pratiques Frontend
Autres pratiques pour une expérience fluide :

Images optimisées : Compresser, optimiser et utiliser WebP si supporté, avec fallbacks.

Fonts efficaces : Charger uniquement les subsets nécessaires ou privilégier les system fonts.

State minimal : Maintenir un état React aussi minimal que possible pour éviter les re-rendus excessifs.

Debouncing : Appliquer sur fonctions déclenchées par événements fréquents (saisie recherche) pour limiter les appels/mises à jour.

6. Monitoring Raisonnable
6.1. Métriques Essentielles Backend
Le monitoring se concentre sur les indicateurs clés sans surcharge :

Temps de réponse moyen : Viser < 800ms pour l'API. Alertes si dépassement significatif.

Requêtes par requête API (Queries per request) : Moins de 15 requêtes BD par appel API.

Utilisation mémoire (Memory usage) : Surveiller les tendances des processus backend, identifier les fuites de mémoire.

Taux d'erreur (Error rate) : Taux général < 10%, avec attention aux erreurs critiques.

6.2. Métriques Frontend Flexibles
Le suivi côté client est pragmatique et orienté utilisateur :

First Contentful Paint (FCP) : Objectif < 3 secondes pour le premier rendu de contenu.

Time to Interactive (TTI) : Objectif < 6 secondes pour l'interactivité complète de l'application.

Taille du bundle (monitoring) : Suivre les tendances d'évolution, pas de blocage strict pour des dépassements minimes.

Expérience utilisateur (UX) : Le feedback direct des utilisateurs reste essentiel pour la performance perçue.

6.3. Alerting Modéré
Alertes configurées pour être pertinentes et actionnables :

Performance critique : Alertes uniquement si temps de réponse API > 3 secondes sur période prolongée.

Erreurs importantes : Alertes si taux d'erreur > 15% pendant plus de 5 minutes.

Disponibilité : Alertes immédiates si downtime prolongé (> 2 minutes).

Tendances : Privilégier rapports hebdomadaires/mensuels sur tendances de performance.

7. Mobile et Accessibilité
7.1. Adaptations Mobile Sensées
La conception tient compte de l'environnement mobile :

Données prioritaires : Charger l'essentiel en premier pour une expérience rapide sur connexions lentes.

Images responsives : Servir des tailles d'images adaptées à l'écran, sans excès de complexité.

Touch targets : Éléments interactifs > 44px minimum pour faciliter le tactile.

Navigation adaptée : Implémenter patrons de navigation mobile (menu "hamburger") et assurer accessibilité.

7.2. Détection de Connexion Optionnelle
Gestion intelligente de la connectivité améliorant l'expérience :

Mode dégradé : Offrir un mode dégradé avec fonctions limitées si détection de connexion fiable (navigator.onLine).

Retry intelligent : Mécanisme de retry simple avec backoff exponentiel en cas d'échec réseau.

Timeout raisonnable : Configurer des timeouts raisonnables (10-15 secondes sur mobile) pour les requêtes réseau.

Offline basique : Mettre en cache uniquement les données/assets critiques pour une expérience utilisateur minimale hors ligne.

8. Sécurité Équilibrée
8.1. Protection Efficace et Raisonnable
La sécurité doit être robuste sans devenir un goulot d'étranglement :

Rate limiting adapté : Ajuster selon l'usage réel observé pour bloquer les attaques tout en permettant un fonctionnement normal.

Authentification rapide : Mettre en cache les permissions courantes des utilisateurs pour accélérer les vérifications d'autorisation.

Protection CSRF : Implémenter protection CSRF standard (Laravel par défaut) sans optimisations excessives.

Logs sécurisés : Générés sans impact notable sur les performances de l'application.

9. Règles de Développement Pragmaticques
9.1. Bonnes Pratiques Recommandées
Ces pratiques sont encouragées pour un développement performant et maintenable :

Eager loading : Utiliser with() en Eloquent pour relations qui seront utilisées immédiatement (éviter N+1).

Pagination systématique : Pour toute liste de données susceptible de dépasser 100 éléments.

Cache stratégique : Identifier calculs coûteux/données stables et appliquer cache où le ROI est clair.

Bundle conscious : Développeurs conscients de l'impact sur la taille du bundle frontend, sans obsession.

9.2. Éviter les Excès
Crucial d'éviter les pièges de la sur-optimisation prématurée :

Sur-optimisation prématurée : Ne pas optimiser sans mesurer et identifier des goulots d'étranglement réels. Prioriser fonctionnalités et stabilité.

Cache complexe : Privilégier la simplicité des mécanismes de cache. Un cache trop complexe peut introduire plus de problèmes.

Micro-optimisations : Éviter le temps passé sur des gains négligeables lorsque le ROI est faible.

Performance parfaite : Appliquer la règle des 80/20 (80% des résultats viennent de 20% des efforts) : viser une performance "suffisamment bonne".

10. Validation Progressive
10.1. Tests de Performance Adaptés
La stratégie de test de performance est réaliste et progressive :

Tests de charge (Load testing) : Avec un nombre raisonnable d'utilisateurs simultanés (ex: 20-50) pour simuler la charge et identifier les faiblesses.

Tests mobiles : Sur vrais appareils mobiles avec connexions variées pour évaluer l'UX réelle.

Monitoring du bundle : Suivre l'évolution de la taille du bundle pour identifier les tendances d'augmentation.

Feedback utilisateur : Intégrer activement les retours des utilisateurs sur la performance et la fluidité.

10.2. Amélioration Continue
L'optimisation des performances est un processus itératif :

Profiling périodique : Sessions régulières de profiling pour identifier les vrais goulots d'étranglement (backend/frontend).

Monitoring léger : Maintenir un système de monitoring qui fournit des métriques utiles sans surcharger l'infra.

Optimisations ciblées : Concentrer les efforts sur les zones critiques, équilibrer effort et impact.

Documentation simple : Partager les bonnes pratiques