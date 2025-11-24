import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) { }

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.userId = :userId', { userId })
      .andWhere('subscription.status = :status', { status: 'active' })
      .andWhere('subscription.periodStart <= :now OR subscription.periodStart IS NULL', { now: new Date() })
      .andWhere('(subscription.periodEnd >= :now OR subscription.periodEnd IS NULL)', { now: new Date() })
      .orderBy('subscription.createdAt', 'DESC')
      .getOne();
  }

  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.userId = :userId', { userId })
      .orderBy('subscription.createdAt', 'DESC')
      .getMany();
  }

  async getAllPlans(): Promise<Plan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { priceCents: 'ASC' },
    });
  }

  async changePlan(userId: string, planId: string): Promise<Subscription> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    if (!plan.isActive) {
      throw new ConflictException('Plan is not active');
    }

    // Cancelar assinatura atual se existir
    const currentSubscription = await this.getCurrentSubscription(userId);
    if (currentSubscription) {
      currentSubscription.status = 'canceled';
      await this.subscriptionRepository.save(currentSubscription);
    }

    // Criar nova assinatura
    const now = new Date();
    const periodEnd = new Date(now);

    if (plan.billingPeriod === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan.billingPeriod === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const newSubscription = this.subscriptionRepository.create({
      userId,
      planId,
      status: 'active',
      periodStart: now,
      periodEnd: periodEnd,
    });

    return this.subscriptionRepository.save(newSubscription);
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    subscription.status = 'canceled';
    return this.subscriptionRepository.save(subscription);
  }

  async checkSubscriptionAccess(userId: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      return false;
    }

    return subscription.status === 'active' &&
      subscription.periodEnd > new Date();
  }

  async getSubscriptionLimits(userId: string): Promise<any> {
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      // Plano gratuito
      return {
        planName: 'Gratuito',
        isPremium: false,
        monthlyTracks: 10,
        offlineDownloads: 0,
        hasAds: true,
        hdQuality: false,
      };
    }

    const plan = subscription.plan;
    const features = plan.features || {};

    return {
      planName: plan.name,
      isPremium: plan.priceCents > 0,
      monthlyTracks: features.monthlyTracks || -1, // -1 = ilimitado
      offlineDownloads: features.offlineDownloads || 0,
      hasAds: features.hasAds || false,
      hdQuality: features.hdQuality || false,
      billingPeriod: plan.billingPeriod,
      periodEnd: subscription.periodEnd,
    };
  }

  async createFreeSubscription(userId: string): Promise<Subscription> {
    const freePlan = await this.planRepository.findOne({
      where: { priceCents: 0, isActive: true }
    });

    if (!freePlan) {
      throw new NotFoundException('Plano gratuito não encontrado');
    }

    const now = new Date();
    const newSubscription = this.subscriptionRepository.create({
      userId,
      planId: freePlan.id,
      status: 'active',
      periodStart: now,
      periodEnd: null,
    });

    const saved = await this.subscriptionRepository.save(newSubscription);

    // Recarregar com o relacionamento plan
    return this.subscriptionRepository.findOne({
      where: { id: saved.id },
      relations: ['plan'],
    });
  }
}