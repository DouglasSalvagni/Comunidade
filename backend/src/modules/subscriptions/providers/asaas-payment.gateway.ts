import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentGateway } from '../interfaces/payment-gateway.interface';
import { GatewayMetaService } from '../services/gateway-meta.service';

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

  /**
   * Cria um Checkout Session
   */
  async createCheckoutLink(
    userId: string,
    planValue: number,
    cycle: 'MONTHLY' | 'YEARLY',
    planName: string,
    planDescription: string,
    options?: {
      splits?: Array<{ walletId: string; fixedValue?: number; percentageValue?: number }>;
    },
  ): Promise<{ checkoutUrl: string; checkoutId: string }> {
    // Calcula nextDueDate (hoje + 1 mês ou 1 ano)
    const today = new Date();
    const nextDueDate = new Date(today);

    if (cycle === 'MONTHLY') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    } else {
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    }

    const body: any = {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      callback: {
        successUrl: `${this.frontendUrl}/dashboard/subscriptions?checkout=success`,
        cancelUrl: `${this.frontendUrl}/dashboard/subscriptions?checkout=cancel`,
        expiredUrl: `${this.frontendUrl}/dashboard/subscriptions?checkout=expired`,
      },
      externalReference: 'babytunes',
      items: [
        {
          description: planDescription,
          name: planName,
          quantity: 1,
          imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=',
          value: planValue,
        },
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
    cycle: 'MONTHLY' | 'YEARLY',
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
