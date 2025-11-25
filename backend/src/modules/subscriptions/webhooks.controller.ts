import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { GatewayWebhookService } from './services/gateway-webhook.service';
import { InvoiceService } from './services/invoice.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly gatewayWebhookService: GatewayWebhookService,
    private readonly invoiceService: InvoiceService,
  ) { }

  @Post('asaas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ASAAS webhook handler' })
  async handleAsaasWebhook(
    @Body() payload: any,
    @Headers('asaas-access-token') token: string,
    @Headers() headers: any,
  ) {
    this.logger.log(`🔔 Webhook ASAAS recebido: ${payload.event}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    // Tenta registrar webhook no banco (ignora erro se tabela não existir)
    try {
      await this.gatewayWebhookService.create('asaas', payload.event, {
        payload,
        headers,
        token,
      });
    } catch (error) {
      this.logger.warn(`⚠️ Não foi possível salvar webhook: ${error.message}`);
    }

    // TODO: Validar token se configurado
    // const expectedToken = this.configService.get('ASAAS_WEBHOOK_TOKEN');
    // if (token !== expectedToken) {
    //   this.logger.error('❌ Token inválido');
    //   throw new UnauthorizedException('Token inválido');
    // }

    try {
      switch (payload.event) {
        case 'SUBSCRIPTION_CREATED':
          await this.handleSubscriptionCreated(payload);
          break;

        case 'PAYMENT_CREATED':
          await this.handlePaymentCreated(payload);
          break;

        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_OVERDUE':
        case 'PAYMENT_REFUNDED':
          await this.handlePaymentStatusChange(payload);
          break;

        default:
          this.logger.warn(`⚠️ Evento não tratado: ${payload.event}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processa subscription criada - busca usuário pelo checkoutSession
   */
  private async handleSubscriptionCreated(payload: any) {
    const subscription = payload.subscription;

    if (!subscription) {
      this.logger.error('❌ Subscription não encontrada no payload');
      return;
    }

    const checkoutSessionId = subscription.checkoutSession;

    if (!checkoutSessionId) {
      this.logger.error('❌ checkoutSession não encontrado na subscription');
      return;
    }

    this.logger.log(`📝 Processando subscription com checkoutSession: ${checkoutSessionId}`);

    try {
      await this.subscriptionsService.processPaymentReceived(checkoutSessionId, subscription);

      this.logger.log(`✅ Subscription criada com sucesso (invoice será criada no PAYMENT_CREATED)`);
    } catch (error) {
      // Ignora erro se checkoutSession não for encontrado (webhook antigo ou de outro ambiente)
      if (error.status === 404 && error.message?.includes('checkoutSession')) {
        this.logger.warn(`⚠️ CheckoutSession ${checkoutSessionId} não encontrado - ignorando webhook`);
        return;
      }
      // Re-lança outros tipos de erro
      throw error;
    }
  }

  /**
   * Processa criação de novo pagamento (nova fatura)
   */
  private async handlePaymentCreated(payload: any) {
    const payment = payload.payment;

    if (!payment || !payment.subscription) {
      this.logger.warn('⚠️ Payment ou subscription não encontrado no payload');
      return;
    }

    // Busca subscription local pelo ID do ASAAS
    const subscription = await this.subscriptionsService.findByProviderId(
      'asaas',
      payment.subscription,
    );

    if (!subscription) {
      this.logger.warn(`⚠️ Subscription ${payment.subscription} não encontrada localmente`);
      return;
    }

    // Verifica se invoice já existe
    const existingInvoice = await this.invoiceService.findByProviderId(
      'asaas',
      payment.id,
    );

    if (existingInvoice) {
      this.logger.warn(`⚠️ Invoice ${payment.id} já existe`);
      return;
    }

    // Cria nova fatura
    await this.invoiceService.create({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      provider: 'asaas',
      providerId: payment.id,
      dueDate: new Date(this.parseBrazilianDate(payment.dueDate)),
      status: payment.status,
      invoiceUrl: payment.invoiceUrl || null,
      amount: payment.value,
    });

    this.logger.log(`✅ Nova fatura criada: ${payment.id}`);
  }

  /**
   * Atualiza status de pagamento existente
   */
  private async handlePaymentStatusChange(payload: any) {
    const payment = payload.payment;

    if (!payment) {
      this.logger.warn('⚠️ Payment não encontrado no payload');
      return;
    }

    // Mapeia evento para status (eventos não mapeados ficam como PENDING)
    const statusMap: Record<string, string> = {
      PAYMENT_RECEIVED: 'CONFIRMED',
      PAYMENT_CONFIRMED: 'CONFIRMED',
      PAYMENT_OVERDUE: 'OVERDUE',
      PAYMENT_REFUNDED: 'REFUNDED',
    };

    const newStatus = statusMap[payload.event];

    if (!newStatus) {
      this.logger.warn(`⚠️ Status não mapeado para evento: ${payload.event}`);
      return;
    }

    try {
      await this.invoiceService.updateStatus(
        'asaas',
        payment.id,
        newStatus as any,
        payment.invoiceUrl,
      );

      this.logger.log(`✅ Status da fatura ${payment.id} atualizado para ${newStatus}`);
    } catch (error) {
      // Ignora erro se invoice não existir (pode ser um pagamento avulso)
      if (error.status === 404) {
        this.logger.warn(`⚠️ Fatura ${payment.id} não encontrada - ignorando atualização`);
        return;
      }
      throw error;
    }
  }

  /**
   * Converte data brasileira (DD/MM/YYYY) para Date
   */
  private parseBrazilianDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
}
