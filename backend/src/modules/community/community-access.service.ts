import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CommunitySpace } from './entities/community-space.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';

@Injectable()
export class CommunityAccessService {
  constructor(
    @InjectRepository(CommunitySpace)
    private readonly spaceRepo: Repository<CommunitySpace>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async canReadSpace(userId: string, spaceId: string): Promise<boolean> {
    const space = await this.spaceRepo.findOne({
      where: { id: spaceId, isActive: true },
      relations: ['planAccess'],
    });
    if (!space) {
      throw new NotFoundException('Espaço não encontrado');
    }
    const accessible = await this.filterAccessibleSpaces(userId, [space]);
    return accessible.length > 0;
  }

  async canPostInSpace(userId: string, spaceId: string): Promise<boolean> {
    return this.canReadSpace(userId, spaceId);
  }

  async filterAccessibleSpaces(userId: string, spaces: CommunitySpace[]): Promise<CommunitySpace[]> {
    if (spaces.length === 0) {
      return [];
    }

    const spacesWithPlanRules = spaces.filter((space) => (space.planAccess ?? []).length > 0);
    const hasRestrictedSpace = spaces.some((space) => space.visibility === 'restricted');
    if (!hasRestrictedSpace && spacesWithPlanRules.length === 0) {
      return spaces;
    }

    const now = new Date();
    const subscription = await this.subscriptionRepo.findOne({
      where: [
        {
          userId,
          status: In(['active', 'expiring']),
          periodStart: LessThanOrEqual(now),
          periodEnd: IsNull(),
        },
        {
          userId,
          status: In(['active', 'expiring']),
          periodStart: LessThanOrEqual(now),
          periodEnd: MoreThanOrEqual(now),
        },
      ],
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
    const userPlanId = subscription?.planId ?? null;

    return spaces.filter((space) => {
      const planRules = space.planAccess ?? [];
      if (planRules.length > 0) {
        if (!userPlanId) {
          return false;
        }
        return planRules.some((rule) => rule.planId === userPlanId);
      }

      if (space.visibility === 'public') {
        return true;
      }

      if (!userPlanId) {
        return false;
      }

      return false;
    });
  }
}
