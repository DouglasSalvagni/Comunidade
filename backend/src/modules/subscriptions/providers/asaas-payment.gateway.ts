import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentGateway } from '../interfaces/payment-gateway.interface';
import { GatewayMetaService } from '../services/gateway-meta.service';
import { SystemSettingsService } from '@/modules/settings/services/system-settings.service';

@Injectable()
export class AsaasPaymentGateway implements IPaymentGateway {
  readonly name = 'asaas';
  private readonly logger = new Logger(AsaasPaymentGateway.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly appUrl: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly gatewayMetaService: GatewayMetaService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {
    this.apiUrl = this.configService.get<string>('ASAAS_API_URL', 'https://api-sandbox.asaas.com/v3');
    this.apiKey = this.configService.get<string>('ASAAS_API_KEY', '');
    this.appUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3003');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    if (!this.apiKey) {
      this.logger.warn('⚠️ ASAAS_API_KEY não configurado');
    }

    this.logger.log(`🔧 ASAAS configurado - BASE_URL: ${this.appUrl}, FRONTEND_URL: ${this.frontendUrl}`);
  }

  /**
   * Faz requisições à API do ASAAS
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any,
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'accept': 'application/json',
      'access_token': this.apiKey,
      'content-type': 'application/json',
    };

    this.logger.debug(`${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`❌ ASAAS API Error: ${response.status} - ${error}`);
      throw new Error(`ASAAS API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private getNextDueDate(cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'): Date {
    const today = new Date();
    const nextDueDate = new Date(today);

    if (cycle === 'WEEKLY') {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      return nextDueDate;
    }

    if (cycle === 'BIWEEKLY') {
      nextDueDate.setDate(nextDueDate.getDate() + 14);
      return nextDueDate;
    }

    if (cycle === 'MONTHLY') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      return nextDueDate;
    }

    if (cycle === 'QUARTERLY') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      return nextDueDate;
    }

    if (cycle === 'SEMIANNUALLY') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 6);
      return nextDueDate;
    }

    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    return nextDueDate;
  }

  /**
   * Cria um Checkout Session
   */
  async createCheckoutLink(
    userId: string,
    planValue: number,
    cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY',
    planName: string,
    planDescription: string,
    options?: {
      splits?: Array<{ walletId: string; fixedValue?: number; percentageValue?: number }>;
    },
  ): Promise<{ checkoutUrl: string; checkoutId: string }> {
    const nextDueDate = this.getNextDueDate(cycle);

    const storedItemImageBase64 = await this.systemSettingsService.getValue('asaas.itemImageBase64');
    const itemImageBase64 = storedItemImageBase64 ?? this.configService.get<string>('ASAAS_ITEM_IMAGE_BASE64', '');
    const item: any = {
      description: planDescription,
      name: planName,
      quantity: 1,
      value: planValue,
    };

    if (itemImageBase64) {
      item.imageBase64 = itemImageBase64;
    }

    const body: any = {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      callback: {
        successUrl: `${this.frontendUrl}/dashboard/subscriptions?checkout=success`,
        cancelUrl: `${this.frontendUrl}/dashboard/subscriptions?checkout=cancel`,
        expiredUrl: `${this.frontendUrl}/dashboard/subscriptions?checkout=expired`,
      },
      externalReference: 'ninaro',
      items: [
        item,
      ],
      minutesToExpire: 120,
      subscription: {
        cycle,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
      },
    };

    if (options?.splits?.length) {
      body.splits = options.splits
        .map((s: any) => {
          const normalized: any = { walletId: s.walletId };

          if (typeof s.fixedValue === 'number' && Number.isFinite(s.fixedValue) && s.fixedValue > 0) {
            normalized.fixedValue = s.fixedValue;
          }

          const percentage = typeof s.percentageValue === 'number'
            ? s.percentageValue
            : (typeof s.percentualValue === 'number' ? s.percentualValue : undefined);

          if (typeof percentage === 'number' && Number.isFinite(percentage) && percentage > 0) {
            normalized.percentageValue = percentage;
          }

          return normalized;
        })
        .filter((s: any) => typeof s.fixedValue === 'number' || typeof s.percentageValue === 'number');

      if (body.splits.length === 0) {
        delete body.splits;
      }
    }

    this.logger.log(`🔄 Criando checkout para userId: ${userId}`);

    const response = await this.request<any>('/checkouts', 'POST', body);

    this.logger.debug(`📦 Response da API ASAAS: ${JSON.stringify(response)}`);

    // A API retorna um array ou objeto único?
    const checkout = Array.isArray(response) ? response[0] : response;

    if (!checkout || !checkout.id || !checkout.link) {
      this.logger.error(`❌ Resposta inválida da API ASAAS: ${JSON.stringify(response)}`);
      throw new Error('Resposta inválida da API ASAAS - checkout sem id ou link');
    }

    this.logger.log(`✅ Checkout criado: ${checkout.id}`);

    // Salva no gateway_metas
    await this.gatewayMetaService.updateMetas('asaas', 'user', userId, {
      checkout: {
        id: checkout.id,
        link: checkout.link,
      },
    });

    return {
      checkoutUrl: checkout.link,
      checkoutId: checkout.id,
    };
  }

  async cancelCheckout(checkoutId: string): Promise<void> {
    await this.request<any>(`/checkouts/${checkoutId}/cancel`, 'POST');
  }

  /**
   * Busca pagamentos de uma subscription no Asaas
   */
  async getSubscriptionPayments(subscriptionId: string): Promise<any> {
    this.logger.log(`🔍 Buscando pagamentos da subscription ${subscriptionId} no Asaas`);

    try {
      const response = await this.request<any>(`/subscriptions/${subscriptionId}/payments`, 'GET');
      this.logger.log(`✅ Pagamentos encontrados: ${response.totalCount} pagamento(s)`);

      // Retorna a lista completa para o service processar
      return response;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar pagamentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancela uma subscription no Asaas
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    this.logger.log(`🚫 Cancelando subscription ${subscriptionId} no Asaas`);

    try {
      await this.request<any>(`/subscriptions/${subscriptionId}`, 'DELETE');
      this.logger.log(`✅ Subscription cancelada com sucesso no Asaas: ${subscriptionId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao cancelar subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria uma assinatura no ASAAS
   */
  async createSubscription(
    customerId: string,
    planValue: number,
    cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY',
    description: string,
  ): Promise<{ subscriptionId: string; status: string; nextDueDate: string }> {
    const subscription = await this.request<{
      id: string;
      status: string;
      nextDueDate: string;
    }>('/subscriptions', 'POST', {
      customer: customerId,
      billingType: 'UNDEFINED', // Permite PIX, Boleto e Cartão
      cycle,
      value: planValue,
      description,
    });

    this.logger.log(`✅ Subscription criada no ASAAS: ${subscription.id}`);

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      nextDueDate: subscription.nextDueDate,
    };
  }
}
