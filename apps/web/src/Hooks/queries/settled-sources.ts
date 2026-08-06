/**
 * Les tableaux de bord agrègent plusieurs appels via `Promise.allSettled` et
 * substituent une valeur vide à chaque échec. Sans cette distinction, une panne
 * d'API s'affiche comme « 0 évaluation / couverture 0 % », c'est-à-dire comme
 * une donnée réelle — trompeur sur une application d'évaluation RH.
 *
 * Retourne le nom des sources qui ont échoué, pour que l'interface signale un
 * résultat partiel au lieu de présenter des zéros comme une vérité.
 */
export function failedSources(
  results: Record<string, PromiseSettledResult<unknown>>,
): string[] {
  return Object.entries(results)
    .filter(([, result]) => result.status === 'rejected')
    .map(([nom]) => nom);
}
