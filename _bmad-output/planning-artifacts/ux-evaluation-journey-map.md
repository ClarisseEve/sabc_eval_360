# User Journey Map — Flux d'évaluation SABC Eval360
**Auteur** : Sally (UX Designer, BMAD)
**Date** : 2026-05-31
**Statut** : Diagnostique — basé sur exploration automatisée du code source

---

## 1. Personas concernés

| Persona | Rôle système | Objectif principal |
|---------|-------------|-------------------|
| **Admin** | ADMIN | Configurer périodes, règles ; piloter les campagnes |
| **Évaluateur** | DR, CDTT, CDV, CDS, CSC, SS, RTM, SRMO | Évaluer ses subordonnés et pairs |
| **Manager validateur** | DR, CDTT (selon règle) | Valider les évaluations soumises |

---

## 2. Flux Admin — Préparer une campagne d'évaluation

```
[Admin se connecte]
      │
      ▼
[Dashboard admin]  →  Aucun guidage vers "démarrer une campagne"
      │                ⚠️ FRICTION: l'admin doit savoir lui-même où aller
      │
      ▼
[/admin/evaluations/regles]  →  Crée une règle
      │  Étapes : nom + type + rôles + critères (poids, seuils) + activation
      │  ⚠️ FRICTION: interface complexe, aucun exemple/template par défaut
      │
      ▼
[/admin/evaluations/periodes]  →  Crée une période
      │  Étapes : code + nom + dates → puis "Basculer" pour l'ouvrir
      │  ⚠️ FRICTION: "Basculer" n'est pas intuitif comme action d'ouverture
      │  🔴 BLOCAGE: si les tables PostgreSQL n'existent pas → erreur 500 silencieuse
      │
      ▼
[Période ouverte]  →  Les évaluateurs peuvent maintenant agir
      │  ✅ La logique est correcte, le flux de setup est incomplet en guidage
```

**Points de friction Admin** :
- Aucune page "Démarrer une campagne" qui guide étape par étape
- L'ordre Règle → Période → Ouverture n'est pas documenté dans l'UI
- Aucun état vide orientant l'admin ("Commencez par créer une règle")

---

## 3. Flux Évaluateur — Démarrer et compléter une évaluation

```
[Évaluateur se connecte]
      │
      ▼
[Dashboard rôle]  →  Pas de CTA "Démarrer une évaluation" en évidence
      │               ⚠️ FRICTION: doit savoir naviguer vers /evaluations
      │
      ▼
[/evaluations/mine]  ←  Point d'entrée principal (peu discoverable)
      │
      ├─ 5 appels API en parallèle (Suspense)
      │   ⚠️ FRICTION: si 1 appel lent → page entière bloquée
      │
      ├─ [Aucune période active] → Alerte bloquante, bouton désactivé
      │   🔴 BLOCAGE: si l'admin n'a pas encore créé/ouvert une période
      │
      ├─ [Aucune règle applicable] → Alerte "Aucune règle exploitable"
      │   🔴 BLOCAGE: si les règles ne correspondent pas au couple rôles
      │
      ├─ [Aucun subordonné] → Liste vide, pas d'explication
      │   🔴 BLOCAGE: si la hiérarchie n'est pas configurée
      │
      └─ [Tout OK] → Sélection de la cible (en 2 étapes : "Sélectionner" + "Démarrer")
                       ⚠️ FRICTION: 2 clics distincts pour 1 action intuitive
      │
      ▼
[EvaluationModal] → Confirmation période + règle → "Créer le brouillon"
      │              POST /evaluations → id_evaluation
      │
      ▼
[/evaluations/:id/edit]  →  Saisie des critères
      │
      ├─ Notes 1–5 par bouton (bon)
      ├─ Commentaire obligatoire si note < seuil
      │   ⚠️ FRICTION: le seuil n'est pas affiché AVANT la saisie de la note
      ├─ Sauvegarde automatique locale (IndexedDB, 30s) ✅
      │
      ▼
[Soumettre]  →  PUT /evaluations/:id + POST /evaluations/:id/submit
      │          → Redirection vers /evaluations/:id (vue lecture)
      │          ⚠️ FRICTION: fenêtre de 72h pour modifier non annoncée à la soumission
      │
      ▼
[/evaluations/:id] (lecture)
      │
      └─ Si statut = "rejete" → bouton "Corriger et resoumettre" ✅ (corrigé)
         Si statut = "soumis" → timer 72h visible ✅
```

---

## 4. Flux Manager — Valider une évaluation

```
[Manager reçoit une évaluation à valider]
      │
      ├─ Aucune notification temps-réel  ⚠️ FRICTION: doit naviguer manuellement
      │
      ▼
[/evaluations/pending ou /evaluations/validate]
      │
      ▼
[ValidationModal] → Valider ou Renvoyer (avec motif obligatoire ≥20 chars)
      │
      └─ Succès → window.location.reload()
                   ⚠️ FRICTION: perd la position de scroll, recharge toute la page
```

---

## 5. Résumé des états et transitions

```
brouillon ──[submit]──▶ soumis ──[valider]──▶ valide
    ▲                     │                      
    │                     └──[rejeter]──▶ rejete ──[corriger]──▶ brouillon (edit)
    │                                                                │
    └────────────────────────────────────────────────────────────────┘
```

**Note** : Le backend autorise `canEditEvaluation` pour les statuts `brouillon` ET `rejete` (ligne 191-193 `evaluations.service.ts`). Le frontend était incohérent sur ce point — **corrigé**.
