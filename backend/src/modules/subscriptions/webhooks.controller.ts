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

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly gatewayWebhookService: GatewayWebhookService,
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

        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          this.logger.log(`✅ ${payload.event} - Pagamento já processado via SUBSCRIPTION_CREATED`);
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
      this.logger.log(`✅ Subscription processada com sucesso`);
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
}
