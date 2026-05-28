import { EligibilityController } from './eligibility.controller';

describe('EligibilityController', () => {
  let controller: EligibilityController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      canEvaluate: jest.fn().mockResolvedValue({ autorise: true }),
      getEligibleTargets: jest.fn().mockResolvedValue({ auto: [], subordonnes: [], pairs: [] }),
    };
    controller = new EligibilityController(mockService);
  });

  it('checkEligibility delegates to service', async () => {
    const dto = { evaluateur_matricule: 'M001', evalue_matricule: 'M002', type_evaluation: 'pairs' };
    const req = { user: { matricule: 'M001' } };
    const result = await controller.checkEligibility(dto as any, req as any);
    expect(mockService.canEvaluate).toHaveBeenCalledWith('M001', 'M002', 'pairs');
    expect(result).toEqual({ autorise: true });
  });

  it('getMyTargets extracts matricule from req.user', async () => {
    const req = { user: { matricule: 'M001' } };
    await controller.getMyTargets(req);
    expect(mockService.getEligibleTargets).toHaveBeenCalledWith('M001');
  });

  it('getTargetsFor passes param correctly', async () => {
    await controller.getTargetsFor('M002');
    expect(mockService.getEligibleTargets).toHaveBeenCalledWith('M002');
  });
});
