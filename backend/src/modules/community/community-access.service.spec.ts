import { NotFoundException } from '@nestjs/common';
import { CommunityAccessService } from './community-access.service';

describe('CommunityAccessService', () => {
  const makeService = () => {
    const spaceRepo = { findOne: jest.fn() } as any;
    const subscriptionRepo = { findOne: jest.fn() } as any;
    const service = new CommunityAccessService(spaceRepo, subscriptionRepo);
    return { service, spaceRepo, subscriptionRepo };
  };

  it('retorna espaços públicos sempre', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [{ id: 's1', visibility: 'public' }] as any[];

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result.map((s) => s.id)).toEqual(['s1']);
    expect(subscriptionRepo.findOne).not.toHaveBeenCalled();
  });

  it('bloqueia espaço restrito sem regras de plano', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [{ id: 's1', visibility: 'restricted', planAccess: [] }] as any[];
    subscriptionRepo.findOne.mockResolvedValue(null);

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result).toEqual([]);
  });

  it('libera espaço restrito quando plano do usuário bate', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [
      {
        id: 's1',
        visibility: 'restricted',
        planAccess: [{ planId: 'p-gold' }],
      },
    ] as any[];
    subscriptionRepo.findOne.mockResolvedValue({ planId: 'p-gold' });

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result.map((s) => s.id)).toEqual(['s1']);
  });

  it('bloqueia espaço restrito quando plano do usuário não bate', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [
      {
        id: 's1',
        visibility: 'restricted',
        planAccess: [{ planId: 'p-gold' }],
      },
    ] as any[];
    subscriptionRepo.findOne.mockResolvedValue({ planId: 'p-silver' });

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result).toEqual([]);
  });

  it('bloqueia espaço restrito sem assinatura ativa', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [
      {
        id: 's1',
        visibility: 'restricted',
        planAccess: [{ planId: 'p-gold' }],
      },
    ] as any[];
    subscriptionRepo.findOne.mockResolvedValue(null);

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result).toEqual([]);
  });

  it('consulta assinatura válida por período e ordena pela mais recente', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [{ id: 's1', visibility: 'restricted', planAccess: [{ planId: 'p-gold' }] }] as any[];
    subscriptionRepo.findOne.mockResolvedValue(null);

    await service.filterAccessibleSpaces('u1', spaces as any);

    expect(subscriptionRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: ['plan'],
        order: { createdAt: 'DESC' },
        where: expect.arrayContaining([
          expect.objectContaining({
            userId: 'u1',
          }),
        ]),
      }),
    );
  });

  it('libera usuário no plano gratuito quando regra restrita aponta para esse plano', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [{ id: 's1', visibility: 'restricted', planAccess: [{ planId: 'p-free' }] }] as any[];
    subscriptionRepo.findOne.mockResolvedValue({
      planId: 'p-free',
      plan: { slug: 'plano-gratuito' },
    });

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result.map((s) => s.id)).toEqual(['s1']);
  });

  it('bloqueia espaço público quando há regras de plano e usuário não pertence ao plano', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [{ id: 's1', visibility: 'public', planAccess: [{ planId: 'p-gold' }] }] as any[];
    subscriptionRepo.findOne.mockResolvedValue({ planId: 'p-free', plan: { slug: 'plano-gratuito' } });

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result).toEqual([]);
  });

  it('libera acesso pelo planId mesmo quando slug do plano for customizado', async () => {
    const { service, subscriptionRepo } = makeService();
    const spaces = [{ id: 's1', visibility: 'restricted', planAccess: [{ planId: 'p-free' }] }] as any[];
    subscriptionRepo.findOne.mockResolvedValue({
      planId: 'p-free',
      plan: { slug: 'gratuito-custom', priceCents: 0 },
    });

    const result = await service.filterAccessibleSpaces('u1', spaces as any);

    expect(result.map((s) => s.id)).toEqual(['s1']);
  });

  it('canReadSpace lança NotFoundException para espaço inexistente/inativo', async () => {
    const { service, spaceRepo } = makeService();
    spaceRepo.findOne.mockResolvedValue(null);

    await expect(service.canReadSpace('u1', 's-inexistente')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('canReadSpace retorna false quando espaço existe mas usuário não se enquadra', async () => {
    const { service, spaceRepo, subscriptionRepo } = makeService();
    spaceRepo.findOne.mockResolvedValue({
      id: 's1',
      isActive: true,
      visibility: 'restricted',
      planAccess: [{ planId: 'p-gold' }],
    });
    subscriptionRepo.findOne.mockResolvedValue({ planId: 'p-basic' });

    await expect(service.canReadSpace('u1', 's1')).resolves.toBe(false);
  });
});
