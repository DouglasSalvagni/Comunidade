import { Injectable, NotFoundException, ConflictException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';
import { User } from '@/modules/users/entities/user.entity';
import { IPaymentGateway } from './interfaces/payment-gateway.interface';
import { GatewayMetaService } from './services/gateway-meta.service';
import { InvoiceService } from './services/invoice.service';
import { SubscriptionsCouponsService } from './subscriptions-coupons.service';
import { PartnershipAffiliate } from './entities/partnership-affiliate.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PartnershipAffiliate)
    private readonly partnershipAffiliateRepository: Repository<PartnershipAffiliate>,
    @Inject('ASAAS_GATEWAY')
    private readonly asaasGateway: IPaymentGateway,
    private readonly gatewayMetaService: GatewayMetaService,
    private readonly invoiceService: InvoiceService,
    private readonly couponsService: SubscriptionsCouponsService,
  ) { }

  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly freePlanSlug = 'plano-gratuito';
  private readonly courtesyPlanSlug = 'plano-cortesia';

  private getPeriodEnd(start: Date, billingPeriod: Plan['billingPeriod']): Date {
    const periodEnd = new Date(start);

    if (billingPeriod === 'weekly') {
      periodEnd.setDate(periodEnd.getDate() + 7);
      return periodEnd;
    }

    if (billingPeriod === 'biweekly') {
      periodEnd.setDate(periodEnd.getDate() + 14);
      return periodEnd;
    }

    if (billingPeriod === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      return periodEnd;
    }

    if (billingPeriod === 'quarterly') {
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      return periodEnd;
    }

    if (billingPeriod === 'semiannually') {
      periodEnd.setMonth(periodEnd.getMonth() + 6);
      return periodEnd;
    }

    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    return periodEnd;
  }

  private getAsaasCycle(billingPeriod: Plan['billingPeriod']): 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' {
    if (billingPeriod === 'weekly') return 'WEEKLY';
    if (billingPeriod === 'biweekly') return 'BIWEEKLY';
    if (billingPeriod === 'monthly') return 'MONTHLY';
    if (billingPeriod === 'quarterly') return 'QUARTERLY';
    if (billingPeriod === 'semiannually') return 'SEMIANNUALLY';
    return 'YEARLY';
  }

  private parseDateOnly(value?: string): Date | null {
    if (!value) return null;
    const parts = value.split('-').map((part) => Number(part));
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return new Date(year, month - 1, day);
  }

  private toDateOnly(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  async renewSubscriptionPeriod(subscriptionId: string, paymentDueDate?: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} não encontrada`);
    }

    if (!subscription.plan) {
      throw new NotFoundException(`Plano da subscription ${subscriptionId} não encontrado`);
    }

    const parsedDueDate = this.parseDateOnly(paymentDueDate) ?? null;
    const periodEndDateOnly = subscription.periodEnd ? this.toDateOnly(subscription.periodEnd) : null;
    if (parsedDueDate && periodEndDateOnly && parsedDueDate.getTime() < periodEndDateOnly.getTime()) {
      return subscription;
    }

    const now = new Date();
    const baseDate = subscription.periodEnd && subscription.periodEnd > now
      ? subscription.periodEnd
      : (parsedDueDate ?? now);

    subscription.periodEnd = this.getPeriodEnd(baseDate, subscription.plan.billingPeriod);
    return this.subscriptionRepository.save(subscription);
  }

  private async getCourtesyPlan(): Promise<Plan | null> {
    return this.planRepository.findOne({ where: { slug: this.courtesyPlanSlug } });
  }

  async getCourtesyAutoGrantEnabled(): Promise<boolean> {
    const plan = await this.getCourtesyPlan();
    if (!plan) return false;
    const meta = await this.gatewayMetaService.findOne('asaas', 'plan', plan.id);
    return meta?.metas?.courtesyAutoGrantEnabled === true;
  }

  async setCourtesyAutoGrantEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
    const plan = await this.getCourtesyPlan();
    if (!plan) {
      throw new NotFoundException('Plano cortesia não encontrado');
    }
    await this.gatewayMetaService.updateMetas('asaas', 'plan', plan.id, {
      courtesyAutoGrantEnabled: enabled,
    });
    return { enabled };
  }

  async grantCourtesySubscription(userId: string): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const plan = await this.getCourtesyPlan();
    if (!plan) {
      throw new NotFoundException('Plano cortesia não encontrado');
    }
    if (!plan.isActive) {
      throw new ConflictException('Plano cortesia não está ativo');
    }
    const current = await this.getCurrentSubscription(userId);
    if (current && current.plan?.slug !== this.freePlanSlug && current.plan?.slug !== this.courtesyPlanSlug) {
      throw new ConflictException('Usuário já possui uma assinatura ativa');
    }
    if (current && current.plan?.slug === this.courtesyPlanSlug) {
      return current;
    }
    if (current && current.plan?.slug === this.freePlanSlug) {
      current.status = 'canceled';
      if (!current.periodEnd) {
        current.periodEnd = new Date();
      }
      await this.subscriptionRepository.save(current);
    }
    const now = new Date();
    const periodEnd = new Date(now);
    const courtesyMonths = plan.courtesyDurationMonths;
    if (courtesyMonths && courtesyMonths > 0) {
      periodEnd.setMonth(periodEnd.getMonth() + courtesyMonths);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
    const newSubscription = this.subscriptionRepository.create({
      userId,
      planId: plan.id,
      status: 'expiring',
      periodStart: now,
      periodEnd,
    });
    return this.subscriptionRepository.save(newSubscription);
  }

  async revokeCourtesySubscription(userId: string): Promise<Subscription> {
    const current = await this.getCurrentSubscription(userId);
    if (!current || current.plan?.slug !== this.courtesyPlanSlug) {
      throw new NotFoundException('Plano cortesia não encontrado para o usuário');
    }
    current.status = 'canceled';
    if (!current.periodEnd) {
      current.periodEnd = new Date();
    }
    await this.subscriptionRepository.save(current);
    return this.createFreeSubscription(userId);
  }

  async tryAutoGrantCourtesy(userId: string): Promise<void> {
    const enabled = await this.getCourtesyAutoGrantEnabled();
    if (!enabled) return;
    await this.grantCourtesySubscription(userId);
  }

  private async assertCanMigratePlan(userId: string): Promise<void> {
    const currentSubscription = await this.getCurrentSubscription(userId);
    if (!currentSubscription) {
      return;
    }

    if (currentSubscription.plan?.slug !== this.freePlanSlug) {
      throw new ConflictException(
        'Não é permitido migrar de plano enquanto existe uma assinatura ativa. Cancele e aguarde o término do período atual.',
      );
    }
  }

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const now = new Date();

    // Atualiza assinaturas que estão em 'expiring' mas cujo período já passou -> 'canceled'
    await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: 'canceled' })
      .where("status = :expiring", { expiring: 'expiring' })
      .andWhere('periodEnd IS NOT NULL')
      .andWhere('periodEnd < :now', { now })
      .execute();

    // Busca assinatura ativa ou em expiring cujo período ainda não expirou
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.userId = :userId', { userId })
      .andWhere('subscription.status IN (:...statuses)', { statuses: ['active', 'expiring'] })
      .andWhere('subscription.periodStart <= :now OR subscription.periodStart IS NULL', { now })
      .andWhere('(subscription.periodEnd >= :now OR subscription.periodEnd IS NULL)', { now })
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
    await this.assertCanMigratePlan(userId);

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
      if (!currentSubscription.periodEnd) {
        currentSubscription.periodEnd = new Date();
      }
      await this.subscriptionRepository.save(currentSubscription);
    }

    // Criar nova assinatura
    const now = new Date();
    const periodEnd = this.getPeriodEnd(now, plan.billingPeriod);

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

    // 'expiring' é considerado ativo até periodEnd
    return (subscription.status === 'active' || subscription.status === 'expiring') &&
      (!subscription.periodEnd || subscription.periodEnd > new Date());
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
      where: { slug: this.freePlanSlug, isActive: true }
    });

    if (!freePlan) {
      throw new NotFoundException('Plano gratuito não encontrado');
    }

    // Não cria plano gratuito se já existir assinatura ativa ou em expiring
    const existing = await this.getCurrentSubscription(userId);
    if (existing) {
      throw new ConflictException('Usuário já possui uma assinatura ativa ou expiring');
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
    await this.assertCanMigratePlan(userId);

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
    const cycle = this.getAsaasCycle(plan.billingPeriod);
    const basePlanValue = plan.priceCents / 100;

    const activeCoupon = await this.couponsService.getActiveCoupon(userId);

    if (activeCoupon?.status === 'PENDING_CHECKOUT' && activeCoupon.lastCheckoutId) {
      const pendingSince = (activeCoupon as any).updatedAt || activeCoupon.activatedAt;
      const minutesToExpire = 120;
      const isLikelyExpired = pendingSince
        ? (Date.now() - new Date(pendingSince).getTime()) > (minutesToExpire * 60 * 1000 + 60 * 1000)
        : false;

      if (isLikelyExpired) {
        await this.couponsService.markActiveAfterCheckoutFailure(userId);
      } else {
        const meta = await this.gatewayMetaService.findOne('asaas', 'user', userId);
        const checkoutMeta = meta?.metas?.checkout;
        if (checkoutMeta?.id !== activeCoupon.lastCheckoutId) {
          try {
            if (this.asaasGateway.cancelCheckout) {
              await this.asaasGateway.cancelCheckout(activeCoupon.lastCheckoutId);
            }
          } catch { }

          await this.couponsService.markActiveAfterCheckoutFailure(userId);
          await this.gatewayMetaService.updateMetas('asaas', 'user', userId, { checkout: {} });
        } else {
          if (checkoutMeta?.planId && checkoutMeta.planId !== planId) {
            try {
              if (this.asaasGateway.cancelCheckout) {
                await this.asaasGateway.cancelCheckout(checkoutMeta.id);
              }
            } catch { }

            await this.couponsService.markActiveAfterCheckoutFailure(userId);
            await this.gatewayMetaService.updateMetas('asaas', 'user', userId, { checkout: {} });
          } else if (checkoutMeta?.link) {
            return { checkoutUrl: checkoutMeta.link };
          } else {
            throw new ConflictException('Checkout pendente');
          }
        }
      }
    }

    let finalPlanValue = basePlanValue;
    let itemDescription = plan.description || plan.name;
    let splits: Array<{ walletId: string; fixedValue?: number; percentageValue?: number }> | undefined;

    if (activeCoupon) {
      const code = activeCoupon.partnership?.code;
      const discountType = activeCoupon.snapshotDiscountType || activeCoupon.partnership?.discountType;
      const discountValue = parseFloat(
        String(activeCoupon.snapshotDiscountValue || activeCoupon.partnership?.discountValue || '0'),
      );

      if (discountType === 'PERCENT') {
        finalPlanValue = basePlanValue * (1 - discountValue / 100);
      } else if (discountType === 'FIXED') {
        finalPlanValue = Math.max(basePlanValue - discountValue, 0);
      }

      finalPlanValue = Math.round(finalPlanValue * 100) / 100;

      if (finalPlanValue <= 0) {
        throw new ConflictException('Cupom inválido para este plano');
      }

      const formatBRL = (value: number) =>
        `R$ ${value.toFixed(2).replace('.', ',')}`;

      const discountLabel = discountType === 'PERCENT'
        ? `-${discountValue}%`
        : `-${formatBRL(discountValue)}`;

      const couponText = `Cupom ${code} aplicado: ${discountLabel} (de ${formatBRL(basePlanValue)} por ${formatBRL(finalPlanValue)}).`;
      itemDescription = `${itemDescription}\n\n${couponText}`;

      const partnershipSplits = await this.partnershipAffiliateRepository.find({
        where: { partnershipId: activeCoupon.partnershipId },
        relations: ['affiliate'],
      });

      const activeSplits = partnershipSplits.filter((s) => s.affiliate?.status === 'ACTIVE');
      const percentSum = activeSplits
        .filter((s) => s.payoutType === 'PERCENT')
        .reduce((acc, cur) => acc + parseFloat(cur.payoutValue), 0);
      if (percentSum > 100.0001) {
        throw new ConflictException('Split inválido para este cupom');
      }
      const fixedSum = activeSplits
        .filter((s) => s.payoutType === 'FIXED')
        .reduce((acc, cur) => acc + parseFloat(cur.payoutValue), 0);
      if (fixedSum > finalPlanValue + 0.0001) {
        throw new ConflictException('Split inválido para este cupom');
      }

      splits = activeSplits.map((s) => {
        const parsed = parseFloat(s.payoutValue);
        const value = Math.round(parsed * 100) / 100;
        if (!Number.isFinite(value) || value <= 0) {
          throw new ConflictException('Split inválido para este cupom');
        }
        if (s.payoutType === 'FIXED') {
          return { walletId: s.affiliate.walletId, fixedValue: value };
        }
        return { walletId: s.affiliate.walletId, percentageValue: value };
      });
    }

    const { checkoutUrl, checkoutId } = await this.asaasGateway.createCheckoutLink(
      userId,
      finalPlanValue,
      cycle,
      plan.name,
      itemDescription,
      { splits },
    );

    // Atualiza o meta para incluir o planId
    await this.gatewayMetaService.updateMetas('asaas', 'user', userId, {
      checkout: {
        id: checkoutId,
        link: checkoutUrl,
        planId: planId,
      },
    });

    if (activeCoupon) {
      await this.couponsService.markPendingCheckout(userId, checkoutId, { splits });
    }

    return { checkoutUrl };
  }



  /**
   * Cancela assinatura no gateway e localmente
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('Nenhuma assinatura ativa encontrada');
    }

    // Se é assinatura paga do Asaas, cancela no gateway e DEIXA O WEBHOOK ATUALIZAR O STATUS LOCAL
    if (subscription.provider === 'asaas' && subscription.providerSubscriptionId) {
      if (this.asaasGateway.cancelSubscription) {
        try {
          await this.asaasGateway.cancelSubscription(subscription.providerSubscriptionId);
          this.logger.log(`Chamada ao gateway para cancelar subscription ${subscription.providerSubscriptionId} executada com sucesso; aguardando webhook para atualizar status local.`);

          // Cancela faturas pendentes locais relacionadas a essa subscription
          try {
            await this.invoiceService.cancelInvoicesForSubscription(subscription.id);
            this.logger.log(`Invoices relacionadas à subscription ${subscription.id} marcadas como CANCELED`);
          } catch (invErr) {
            this.logger.error(`Erro ao cancelar invoices locais: ${invErr?.message || invErr}`);
          }

          // Não alteramos o status local aqui: o webhook (SUBSCRIPTION_DELETED) deve marcar a subscription como 'expiring'.
          return;
        } catch (error) {
          this.logger.error(`Erro ao cancelar subscription no gateway: ${error?.message || error}`);
          // Em caso de falha no gateway, marcamos localmente como 'canceled' (comportamento anterior)
          subscription.status = 'canceled';
          await this.subscriptionRepository.save(subscription);

          // Cancela faturas locais também
          try {
            await this.invoiceService.cancelInvoicesForSubscription(subscription.id);
            this.logger.log(`Invoices relacionadas à subscription ${subscription.id} marcadas como CANCELED`);
          } catch (invErr) {
            this.logger.error(`Erro ao cancelar invoices locais: ${invErr?.message || invErr}`);
          }

          this.logger.log(`Subscription local marcada como 'canceled' após falha no gateway (userId=${userId}, id=${subscription.id})`);
          throw error;
        }
      }
    }

    // Plano gratuito ou sem provider: cancela localmente imediatamente (comportamento original)
    subscription.status = 'canceled';
    await this.subscriptionRepository.save(subscription);
    try {
      await this.invoiceService.cancelInvoicesForSubscription(subscription.id);
      this.logger.log(`Invoices relacionadas à subscription ${subscription.id} marcadas como CANCELED`);
    } catch (invErr) {
      this.logger.error(`Erro ao cancelar invoices locais: ${invErr?.message || invErr}`);
    }
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
      currentSubscription.status = 'expiring';
      if (!currentSubscription.periodEnd) {
        // Define uma data de término razoável (por segurança, hoje)
        currentSubscription.periodEnd = new Date();
      }
      await this.subscriptionRepository.save(currentSubscription);
    }

    // Calcula period_end baseado no ciclo do plano
    const now = new Date();
    const periodEnd = this.getPeriodEnd(now, plan.billingPeriod);

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

  /**
   * Ativa uma assinatura
   */
  async activateSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} não encontrada`);
    }

    subscription.status = 'active';
    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Marca uma subscription como 'expiring' (usado por webhooks de cancelamento)
   */
  async expireSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} não encontrada`);
    }

    subscription.status = 'expiring';
    if (!subscription.periodEnd) {
      subscription.periodEnd = new Date();
    }
    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Pausa uma assinatura
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} não encontrada`);
    }

    subscription.status = 'past_due';
    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Verifica se a assinatura do usuário está válida
   * (todas as faturas vencidas devem estar pagas)
   */
  async isSubscriptionValid(userId: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      return false;
    }

    // Se está com status diferente de active/expiring, não é válida
    if (subscription.status !== 'active' && subscription.status !== 'expiring') {
      return false;
    }

    // Verifica se período ainda está válido
    if (subscription.periodEnd && new Date() > subscription.periodEnd) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se o usuário está no plano gratuito
   */
  async isFreePlan(userId: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) return true;
    return subscription.plan?.slug === this.freePlanSlug;
  }

  /**
   * Busca pagamentos de uma subscription no gateway Asaas
   */
  async getAsaasSubscription(asaasSubscriptionId: string): Promise<any> {
    if (this.asaasGateway.getSubscriptionPayments) {
      return this.asaasGateway.getSubscriptionPayments(asaasSubscriptionId);
    }
    throw new Error('Gateway não suporta busca de pagamentos');
  }
}
