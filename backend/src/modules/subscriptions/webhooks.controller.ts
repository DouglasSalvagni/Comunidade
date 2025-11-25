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

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @Post('asaas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ASAAS webhook handler' })
  async handleAsaasWebhook(
    @Body() payload: any,
    @Headers('asaas-access-token') token: string,
    @Headers() headers: any,
  ) {
    // Log completo em arquivo
    const fs = require('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      event: payload.event,
      payload,
      headers,
      token,
    };
    fs.appendFileSync(
      'webhook-asaas.log',
      JSON.stringify(logData, null, 2) + '\n---\n',
    );

    this.logger.log(`🔔 Webhook ASAAS recebido: ${payload.event}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    // TODO: Validar token se configurado
    // const expectedToken = this.configService.get('ASAAS_WEBHOOK_TOKEN');
    // if (token !== expectedToken) {
    //   this.logger.error('❌ Token inválido');
    //   throw new UnauthorizedException('Token inválido');
    // }

    try {
      switch (payload.event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          await this.handlePaymentReceived(payload);
          break;

        default:
          this.logger.warn(`⚠️ Evento não tratado: ${payload.event}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar webhook: ${error.message}`);
      fs.appendFileSync(
        'webhook-asaas.log',
        `ERROR: ${error.message}\n${error.stack}\n---\n`,
      );
      throw error;
    }
  }

  /**
   * Processa pagamento recebido - busca usuário pelo checkoutSession
   */
  private async handlePaymentReceived(payload: any) {
    const payment = payload.payment;

    if (!payment) {
      this.logger.error('❌ Payment não encontrado no payload');
      return;
    }

    const checkoutSessionId = payment.checkoutSession;

    if (!checkoutSessionId) {
      this.logger.error('❌ checkoutSession não encontrado no payment');
      return;
    }

    this.logger.log(`📝 Processando pagamento com checkoutSession: ${checkoutSessionId}`);

    await this.subscriptionsService.processPaymentReceived(checkoutSessionId, payment);

    this.logger.log(`✅ Pagamento processado com sucesso`);
  }
}
