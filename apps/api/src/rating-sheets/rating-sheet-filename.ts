function filenamePart(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function periodFilenamePart(
  nomPeriode: string | null | undefined,
  codePeriode: string | null | undefined,
): string {
  const nameParts = nomPeriode?.match(
    /(?:cycle\s*)?(20\d{2}).*?\bsem(?:estre)?\s*([12])\b/i,
  );
  if (nameParts) return `cycle${nameParts[1]}-Sem${nameParts[2]}`;

  const codeParts = codePeriode?.match(/^P?(\d{2})0?([12])$/i);
  if (codeParts) return `cycle20${codeParts[1]}-Sem${codeParts[2]}`;

  return filenamePart(nomPeriode || codePeriode) || 'periode';
}

export function buildRatingSheetFilename(
  nomPeriode: string | null | undefined,
  codePeriode: string | null | undefined,
  role: string | null | undefined,
  prenom: string | null | undefined,
  nom: string | null | undefined,
): string {
  const parts = [
    'fiche-notation',
    periodFilenamePart(nomPeriode, codePeriode),
    filenamePart(role),
    filenamePart(prenom),
    filenamePart(nom),
  ].filter(Boolean);

  return `${parts.join('-')}.pdf`;
}
