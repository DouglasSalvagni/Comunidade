import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CommunitySpace } from './entities/community-space.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { Course } from '@/modules/courses/entities/course.entity';

@Injectable()
export class CommunityAccessService {
  constructor(
    @InjectRepository(CommunitySpace)
    private readonly spaceRepo: Repository<CommunitySpace>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async canReadSpace(userId: string, spaceId: string): Promise<boolean> {
    const space = await this.spaceRepo.findOne({
      where: { id: spaceId, isActive: true },
      relations: ['planAccess', 'courseAccess'],
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

    const restrictedSpaces = spaces.filter((space) => space.visibility === 'restricted');
    if (restrictedSpaces.length === 0) {
      return spaces;
    }

    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: In(['active', 'expiring']) },
    });
    const userPlanId = subscription?.planId ?? null;
    const needsCourseAccess = restrictedSpaces.some((space) => (space.courseAccess?.length ?? 0) > 0);
    const accessibleCourseIds = needsCourseAccess
      ? await this.getAccessibleCourseIdsForUser(userPlanId)
      : new Set<string>();

    return spaces.filter((space) => {
      if (space.visibility === 'public') {
        return true;
      }

      const planRules = space.planAccess ?? [];
      const courseRules = space.courseAccess ?? [];

      const hasRules = planRules.length > 0 || courseRules.length > 0;
      if (!hasRules) {
        return false;
      }

      if (planRules.length > 0 && userPlanId) {
        if (planRules.some((rule) => rule.planId === userPlanId)) {
          return true;
        }
      }

      if (courseRules.length > 0) {
        if (courseRules.some((rule) => accessibleCourseIds.has(rule.courseId))) {
          return true;
        }
      }

      return false;
    });
  }

  private async getAccessibleCourseIdsForUser(userPlanId: string | null): Promise<Set<string>> {
    const courses = await this.courseRepo.find({
      where: { status: 'publicado' },
      relations: ['planAccess'],
    });

    const accessible = courses.filter((course) => {
      if (!course.planAccess || course.planAccess.length === 0) {
        return true;
      }
      if (!userPlanId) {
        return false;
      }
      return course.planAccess.some((rule) => rule.planId === userPlanId);
    });

    return new Set(accessible.map((course) => course.id));
  }
}
