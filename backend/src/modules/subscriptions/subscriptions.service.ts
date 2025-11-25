import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';
import { IPaymentGateway } from './interfaces/payment-gateway.interface';
import { GatewayMetaService } from './services/gateway-meta.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @Inject('ASAAS_GATEWAY')
    private readonly asaasGateway: IPaymentGateway,
    private readonly gatewayMetaService: GatewayMetaService,
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

  /**
   * Cria um link de checkout para assinatura paga
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    userEmail: string,
    userName: string,
    userCpf?: string,
  ): Promise<{ checkoutUrl: string }> {
    // Busca o plano
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plano ${planId} não encontrado`);
    }

    if (!plan.isActive) {
      throw new ConflictException('Plano não está ativo');
    }

    if (plan.priceCents === 0) {
      throw new ConflictException('Plano gratuito não requer checkout');
    }

    // Cria Checkout Link
    const cycle = plan.billingPeriod === 'monthly' ? 'MONTHLY' : 'YEARLY';
    const planValue = plan.priceCents / 100; // Converte centavos para reais

    const { checkoutUrl, checkoutId } = await this.asaasGateway.createCheckoutLink(
      userId,
      planValue,
      cycle,
      plan.name,
      plan.description || plan.name,
    );

    // Atualiza o meta para incluir o planId
    await this.gatewayMetaService.updateMetas('asaas', 'user', userId, {
      checkout: {
        id: checkoutId,
        link: checkoutUrl,
        planId: planId,
      },
    });

    return { checkoutUrl };
  }



  /**
   * Cancela assinatura local
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('Nenhuma assinatura ativa encontrada');
    }

    // Cancela localmente
    subscription.status = 'canceled';
    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Processa pagamento recebido via webhook usando checkoutSession
   */
  async processPaymentReceived(checkoutSessionId: string, payment: any): Promise<Subscription> {
    // Busca usuário pelo checkoutSession
    const userMeta = await this.gatewayMetaService.findUserByCheckoutSession(
      'asaas',
      checkoutSessionId,
    );

    if (!userMeta) {
      throw new NotFoundException(
        `Usuário não encontrado para checkoutSession ${checkoutSessionId}`,
      );
    }

    const userId = userMeta.entityId;
    const planId = userMeta.metas?.checkout?.planId;

    if (!planId) {
      throw new ConflictException(
        `PlanId não encontrado no checkout para usuário ${userId}`,
      );
    }

    // Busca o plano
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plano ${planId} não encontrado`);
    }

    // Cancela assinatura atual se existir
    const currentSubscription = await this.getCurrentSubscription(userId);
    if (currentSubscription) {
      currentSubscription.status = 'canceled';
      await this.subscriptionRepository.save(currentSubscription);
    }

    // Calcula period_end baseado no ciclo do plano
    const now = new Date();
    const periodEnd = new Date(now);

    if (plan.billingPeriod === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan.billingPeriod === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Cria nova assinatura
    const newSubscription = this.subscriptionRepository.create({
      userId,
      planId,
      status: 'active',
      periodStart: now,
      periodEnd,
      provider: 'asaas',
      providerSubscriptionId: payment.subscription || payment.id,
    });

    return this.subscriptionRepository.save(newSubscription);
  }

  /**
   * Busca subscription por provider e providerId
   */
  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: {
        provider,
        providerSubscriptionId: providerId,
      },
    });
  }
}