#!/bin/sh
# Garde-fou anti-réintroduction de secrets dans les fichiers versionnés.
#
# Volontairement étroit: il ne traque que les valeurs qui ont réellement fuité
# dans ce dépôt (incidents GitGuardian) et les mots de passe par défaut qui les
# avaient produites. Un scanner générique produirait trop de faux positifs sur
# un code métier qui manipule des champs « password ».
set -e

# Motifs interdits: littéraux ayant déjà fuité, et défauts de repli en dur.
# Construits par concaténation pour que ce script ne contienne jamais lui-même
# les valeurs qu'il interdit (purge d'historique et scanners de secrets).
W_PWD='pass''word'
W_SEC='sec''ret'
PATTERNS="${W_PWD}123|sabc_${W_PWD}|root${W_SEC}|ci-only-jwt-${W_SEC}|ci-seed-${W_PWD}|:-${W_SEC}\\}|:-root${W_SEC}\\}|PG_PASSWORD.*\\|\\|.*.sabc_${W_PWD}"

# .env.example ne doit contenir que des placeholders; seuls les lockfiles sont
# exclus — les garde-fous (ce script, validate-env.*) construisent leurs
# motifs par concaténation et passent donc le scan.
MATCHES=$(git grep -nIE "$PATTERNS" -- \
  ':!*lock*' 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "Secrets potentiels détectés dans des fichiers versionnés:"
  echo "$MATCHES"
  echo
  echo "Remplacez la valeur par une variable d'environnement ou un placeholder CHANGE_ME_*."
  exit 1
fi

echo "Aucun secret connu détecté dans les fichiers versionnés."
