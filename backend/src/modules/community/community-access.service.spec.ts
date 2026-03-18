import { NotFoundException } from '@nestjs/common';
import { CommunityAccessService } from './community-access.service';

describe('CommunityAccessService', () => {
  const makeService = () => {
    const spaceRepo = { findOne: jest.fn() } as any;
    const subscriptionRepo = { findOne: jest.fn() } as any;
    const courseRepo = { find: jest.fn() } as any;
    const service = new CommunityAccessService(spaceRepo, subscriptionRepo, courseRepo);
    return { service, spaceRepo, subscriptionRepo, courseRepo };
  };

  it('retorna espaços públicos sempre', async () => {
    const { service, subscriptionRepo, courseRepo } = makeService();
    const spaces = [{ id: 's1', visibility: 'public' }] as any[];

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result.map((s) => s.id)).toEqual(['s1']);
    expect(subscriptionRepo.findOne).not.toHaveBeenCalled();
    expect(courseRepo.find).not.toHaveBeenCalled();
  });

  it('bloqueia espaço restrito sem regras de plano/curso', async () => {
    const { service, subscriptionRepo, courseRepo } = makeService();
    const spaces = [{ id: 's1', visibility: 'restricted', planAccess: [], courseAccess: [] }] as any[];
    subscriptionRepo.findOne.mockResolvedValue(null);
    courseRepo.find.mockResolvedValue([]);

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result).toEqual([]);
  });

  it('libera espaço restrito quando plano do usuário bate', async () => {
    const { service, subscriptionRepo, courseRepo } = makeService();
    const spaces = [
      {
        id: 's1',
        visibility: 'restricted',
        planAccess: [{ planId: 'p-gold' }],
        courseAccess: [],
      },
    ] as any[];
    subscriptionRepo.findOne.mockResolvedValue({ planId: 'p-gold' });
    courseRepo.find.mockResolvedValue([]);

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result.map((s) => s.id)).toEqual(['s1']);
  });

  it('libera espaço restrito por curso quando usuário tem acesso ao curso', async () => {
    const { service, subscriptionRepo, courseRepo } = makeService();
    const spaces = [
      {
        id: 's1',
        visibility: 'restricted',
        planAccess: [],
        courseAccess: [{ courseId: 'c1' }],
      },
    ] as any[];
    subscriptionRepo.findOne.mockResolvedValue({ planId: 'p-gold' });
    courseRepo.find.mockResolvedValue([
      { id: 'c1', planAccess: [{ planId: 'p-gold' }] },
      { id: 'c2', planAccess: [{ planId: 'p-silver' }] },
    ]);

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result.map((s) => s.id)).toEqual(['s1']);
  });

  it('aplica regra OU entre plano e curso em espaço restrito', async () => {
    const { service, subscriptionRepo, courseRepo } = makeService();
    const spaces = [
      {
        id: 's1',
        visibility: 'restricted',
        planAccess: [{ planId: 'p-gold' }],
        courseAccess: [{ courseId: 'c1' }],
      },
    ] as any[];
    subscriptionRepo.findOne.mockResolvedValue({ planId: 'p-silver' });
    courseRepo.find.mockResolvedValue([{ id: 'c1', planAccess: [{ planId: 'p-silver' }] }]);

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result.map((s) => s.id)).toEqual(['s1']);
  });

  it('canReadSpace lança NotFoundException para espaço inexistente/inativo', async () => {
    const { service, spaceRepo } = makeService();
    spaceRepo.findOne.mockResolvedValue(null);

    await expect(service.canReadSpace('u1', 's-inexistente')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('canReadSpace retorna false quando espaço existe mas usuário não se enquadra', async () => {
    const { service, spaceRepo, subscriptionRepo, courseRepo } = makeService();
    spaceRepo.findOne.mockResolvedValue({
      id: 's1',
      isActive: true,
      visibility: 'restricted',
      planAccess: [{ planId: 'p-gold' }],
      courseAccess: [{ courseId: 'c1' }],
    });
    subscriptionRepo.findOne.mockResolvedValue({ planId: 'p-basic' });
    courseRepo.find.mockResolvedValue([{ id: 'c1', planAccess: [{ planId: 'p-pro' }] }]);

    await expect(service.canReadSpace('u1', 's1')).resolves.toBe(false);
  });
});
