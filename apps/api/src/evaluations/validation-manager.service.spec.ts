import { ValidationManagerService } from './validation-manager.service';

describe('ValidationManagerService', () => {
  let service: ValidationManagerService;
  let prisma: any;

  const user = (overrides: Record<string, unknown> = {}) => ({
    matricule: 'USR01',
    manager_matricule: null,
    role: 'CDS',
    role_nom: 'CDS',
    id_region: 'RG001',
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      utilisateur: {
        findUnique: jest.fn(),
      },
    };
    service = new ValidationManagerService(prisma);
  });

  it('autorise un CDS uniquement pour son subordonné direct', () => {
    const cds = user({ matricule: 'CDS01', role: 'CDS', role_nom: 'CDS' });
    const direct = user({ matricule: 'SUB01', manager_matricule: 'CDS01' });
    const autreMemeRegion = user({ matricule: 'SUB02', manager_matricule: 'AUTRE' });

    expect(service.peutValiderUtilisateurs(cds, direct)).toEqual({ canValidate: true });
    expect(service.peutValiderUtilisateurs(cds, autreMemeRegion)).toEqual({
      canValidate: false,
      reason: 'Non autorisé à valider cette évaluation',
    });
  });

  it.each(['DR', 'CDTT'])('autorise %s pour tout évalué de la même région', (role) => {
    const validateur = user({ matricule: `${role}01`, role, role_nom: role });
    const evalue = user({ matricule: 'SUB01', manager_matricule: 'AUTRE', id_region: 'RG001' });

    expect(service.peutValiderUtilisateurs(validateur, evalue)).toEqual({ canValidate: true });
    expect(service.aPorteeRegionale(validateur)).toBe(true);
  });

  it.each(['DR', 'CDTT'])('refuse %s hors de sa région', (role) => {
    const validateur = user({ matricule: `${role}01`, role, role_nom: role, id_region: 'RG001' });
    const evalue = user({ matricule: 'SUB01', manager_matricule: 'AUTRE', id_region: 'RG002' });

    expect(service.peutValiderUtilisateurs(validateur, evalue).canValidate).toBe(false);
  });

  it('conserve la priorité du lien manager direct, même entre deux régions', () => {
    const validateur = user({ matricule: 'CDS01', id_region: 'RG001' });
    const evalue = user({ matricule: 'SUB01', manager_matricule: 'CDS01', id_region: 'RG002' });

    expect(service.peutValiderUtilisateurs(validateur, evalue)).toEqual({ canValidate: true });
  });

  it('refuse lorsque le validateur ou l’évalué est introuvable', () => {
    expect(service.peutValiderUtilisateurs(null, user())).toEqual({
      canValidate: false,
      reason: 'Utilisateur introuvable',
    });
    expect(service.peutValiderUtilisateurs(user(), null)).toEqual({
      canValidate: false,
      reason: 'Utilisateur introuvable',
    });
  });

  it('fait utiliser la même primitive à la vérification par matricules', async () => {
    const validateur = user({ matricule: 'CDS01' });
    const evalue = user({ matricule: 'SUB01', manager_matricule: 'CDS01' });
    prisma.utilisateur.findUnique
      .mockResolvedValueOnce(validateur)
      .mockResolvedValueOnce(evalue);
    const sharedRule = jest.spyOn(service, 'peutValiderUtilisateurs');

    await expect(service.peutValider('CDS01', 'SUB01')).resolves.toEqual({ canValidate: true });

    expect(sharedRule).toHaveBeenCalledWith(validateur, evalue);
  });
});
