#!/bin/sh
# Garde-fou anti-réintroduction de secrets dans les fichiers versionnés.
#
# Volontairement étroit: il ne traque que les valeurs qui ont réellement fuité
# dans ce dépôt (incidents GitGuardian) et les mots de passe par défaut qui les
# avaient produites. Un scanner générique produirait trop de faux positifs sur
# un code métier qui manipule des champs « password ».
set -e

# Motifs interdits: littéraux ayant déjà fuité, et défauts de repli en dur.
PATTERNS='***REMOVED***|***REMOVED***|***REMOVED***|***REMOVED***|***REMOVED***|:-secret\}|:-***REMOVED***\}|PG_PASSWORD.*\|\|.*.***REMOVED***'

# .env.example ne doit contenir que des placeholders; les lockfiles et ce
# script lui-même sont exclus.
# validate-env.* est exclu: c'est précisément la liste noire qui refuse ces
# valeurs au démarrage en production.
MATCHES=$(git grep -nIE "$PATTERNS" -- \
  ':!*lock*' \
  ':!scripts/check-secrets.sh' \
  ':!apps/api/src/config/validate-env.ts' \
  ':!apps/api/src/config/validate-env.spec.ts' \
  ':!.github/workflows/ci.yml' 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "Secrets potentiels détectés dans des fichiers versionnés:"
  echo "$MATCHES"
  echo
  echo "Remplacez la valeur par une variable d'environnement ou un placeholder CHANGE_ME_*."
  exit 1
fi

echo "Aucun secret connu détecté dans les fichiers versionnés."
