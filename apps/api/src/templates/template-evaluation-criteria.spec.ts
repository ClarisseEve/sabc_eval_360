import { buildTemplateEvaluationCriteria } from './template-evaluation-criteria';

describe('buildTemplateEvaluationCriteria', () => {
  it('uses assigned template sections, competencies, weights, and level descriptions', () => {
    const result = buildTemplateEvaluationCriteria({
      sections: [
        {
          id: 'vente',
          titre: 'Vente',
          description: 'Compétences commerciales',
          ordre: 2,
          competences: [
            {
              id: 'negociation',
              libelle: 'Négociation commerciale',
              description: 'Traite les objections client.',
              poids: 40,
              niveau_requis: 4,
              niveaux: [
                { niveau: 1, description: 'Ne prépare pas la négociation.' },
                {
                  niveau: 4,
                  description: 'Conclut efficacement la négociation.',
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result?.criteres).toHaveLength(1);
    expect(result?.criteres[0]).toMatchObject({
      id: 'negociation',
      libelle: 'Négociation commerciale',
      description: 'Traite les objections client.',
      poids: 40,
      section_label: 'Vente',
      section_order: 2,
      niveau_requis: 4,
      niveaux: [
        { niveau: 1, description: 'Ne prépare pas la négociation.' },
        { niveau: 2, description: '' },
        { niveau: 3, description: '' },
        { niveau: 4, description: 'Conclut efficacement la négociation.' },
        { niveau: 5, description: '' },
      ],
    });
    expect(result?.sections[0].description).toBe('Compétences commerciales');
  });

  it('returns null for malformed templates without competencies', () => {
    expect(buildTemplateEvaluationCriteria('{invalid json')).toBeNull();
    expect(
      buildTemplateEvaluationCriteria({ sections: [{ titre: 'Vide' }] }),
    ).toBeNull();
  });
});
