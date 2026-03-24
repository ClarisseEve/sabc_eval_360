import { ReglesService } from './regles.service';

describe('ReglesService', () => {
  let service: ReglesService;

  beforeEach(() => {
    service = new ReglesService();
  });

  const validCritere = (override = {}) => ({
    nom: 'Critère test',
    description: 'Description test',
    ponderation: 20,
    echelle: { min: 1, max: 5 },
    categorie: 'Performance',
    ...override,
  });

  describe('validateCriteres', () => {
    it('should validate correct criteres', () => {
      const criteres = Array.from({ length: 5 }, (_, i) =>
        validCritere({ nom: `Critère ${i}`, ponderation: 20 }),
      );
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(true);
      expect(result.erreurs).toHaveLength(0);
    });

    it('should reject fewer than 5 criteres', () => {
      const criteres = [validCritere({ ponderation: 100 })];
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(false);
      expect(result.erreurs.some(e => e.includes('Minimum 5'))).toBe(true);
    });

    it('should reject ponderation != 100', () => {
      const criteres = Array.from({ length: 5 }, (_, i) =>
        validCritere({ nom: `Critère ${i}`, ponderation: 10 }),
      );
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(false);
      expect(result.erreurs.some(e => e.includes('100%'))).toBe(true);
    });

    it('should reject invalid echelle', () => {
      const criteres = Array.from({ length: 5 }, (_, i) =>
        validCritere({ nom: `Critère ${i}`, ponderation: 20, echelle: { min: 0, max: 10 } }),
      );
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(false);
      expect(result.erreurs.some(e => e.includes('échelle'))).toBe(true);
    });

    it('should reject invalid categorie', () => {
      const criteres = Array.from({ length: 5 }, (_, i) =>
        validCritere({ nom: `Critère ${i}`, ponderation: 20, categorie: 'INVALID' }),
      );
      const result = service.validateCriteres(criteres);
      expect(result.valide).toBe(false);
      expect(result.erreurs.some(e => e.includes('catégorie'))).toBe(true);
    });
  });

  describe('getConstraints', () => {
    it('should return constraints', () => {
      const c = service.getConstraints();
      expect(c.min_criteres).toBe(5);
      expect(c.total_ponderation).toBe(100);
      expect(c.echelle_min).toBe(1);
      expect(c.echelle_max).toBe(5);
      expect(c.categories_valides.length).toBe(8);
    });
  });

  describe('getCategoriesValides', () => {
    it('should return 8 categories', () => {
      expect(service.getCategoriesValides()).toHaveLength(8);
    });
  });
});
