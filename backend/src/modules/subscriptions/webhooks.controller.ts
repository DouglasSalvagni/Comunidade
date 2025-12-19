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
import { SkipThrottle } from '@nestjs/throttler';
import { SubscriptionsService } from './subscriptions.service';
import { GatewayWebhookService } from './services/gateway-webhook.service';
import { InvoiceService } from './services/invoice.service';

@ApiTags('Webhooks')
@Controller('webhooks')
@SkipThrottle()
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private lastSubscriptionData: any = null;

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
          await this.handlePaymentConfirmed(payload);
          break;

        case 'PAYMENT_OVERDUE':
          await this.handlePaymentOverdue(payload);
          break;

        case 'PAYMENT_REFUNDED':
          await this.handlePaymentStatusChange(payload);
          break;

        case 'PAYMENT_DELETED':
          await this.handlePaymentDeleted(payload);
          break;

        case 'SUBSCRIPTION_DELETED':
          await this.handleSubscriptionDeleted(payload);
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
   * Processa subscription criada - busca usuário pelo checkoutSession e cria invoice do primeiro pagamento
   */
  private async handleSubscriptionCreated(payload: any) {
    const subscription = payload.subscription;

    if (!subscription) {
      this.logger.error('❌ Subscription não encontrada no payload');
      return;
    }

    // Guarda dados da subscription para usar ao criar invoice
    this.lastSubscriptionData = subscription;

    const checkoutSessionId = subscription.checkoutSession;

    if (!checkoutSessionId) {
      this.logger.error('❌ checkoutSession não encontrado na subscription');
      return;
    }

    this.logger.log(`📝 Processando subscription com checkoutSession: ${checkoutSessionId}`);

    try {
      const createdSubscription = await this.subscriptionsService.processPaymentReceived(checkoutSessionId, subscription);

      this.logger.log(`✅ Subscription criada com sucesso`);

      // Busca dados da subscription no Asaas para pegar o primeiro pagamento
      await this.createFirstInvoiceFromAsaas(subscription.id, createdSubscription);
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
   * Cria invoice inicial da subscription usando o ID da subscription como providerId
   * (Asaas não cria payment separado para primeira mensalidade)
   */
  private async createFirstInvoiceFromAsaas(asaasSubscriptionId: string, localSubscription: any) {
    try {
      this.logger.log(`📝 Criando invoice inicial para subscription ${asaasSubscriptionId}`);

      // Busca dados da subscription do webhook
      const subscriptionData = this.lastSubscriptionData;

      if (!subscriptionData) {
        this.logger.warn(`⚠️ Dados da subscription não encontrados no webhook`);
        return;
      }

      // Asaas não cria payment separado para primeira mensalidade
      // Usamos o ID da subscription como providerId
      const providerId = asaasSubscriptionId;

      // Determina status: se subscription está ACTIVE, primeiro pagamento foi confirmado
      const invoiceStatus = subscriptionData.status === 'ACTIVE' ? 'CONFIRMED' : 'PENDING';

      // Usa nextDueDate ou dateCreated do Asaas
      let dueDate = subscriptionData.dateCreated;
      this.logger.log(`📅 Data original da invoice: ${dueDate}`);

      // Converte DD/MM/YYYY para YYYY-MM-DD se necessário
      if (dueDate && dueDate.includes('/')) {
        const [day, month, year] = dueDate.split('/');
        dueDate = `${year}-${month}-${day}`;
        this.logger.log(`📅 Data convertida para: ${dueDate}`);
      }

      // Cria invoice inicial (upsert evita duplicação)
      await this.invoiceService.create({
        userId: localSubscription.userId,
        subscriptionId: localSubscription.id,
        provider: 'asaas',
        providerId: providerId,
        dueDate: dueDate as any, // String YYYY-MM-DD
        status: invoiceStatus as any,
        invoiceUrl: null, // Primeira invoice não tem URL separada
        amount: subscriptionData.value,
      });

      this.logger.log(`✅ Invoice inicial criada: ${providerId} (${invoiceStatus})`);
    } catch (error) {
      this.logger.error(`❌ Erro ao criar invoice inicial: ${error.message}`);
      // Não re-lança erro para não falhar o webhook
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
      dueDate: payment.dueDate as any, // String YYYY-MM-DD do Asaas
      status: payment.status,
      invoiceUrl: payment.invoiceUrl || null,
      amount: payment.value,
    });

    this.logger.log(`✅ Nova fatura criada: ${payment.id}`);
  }

  /**
   * Processa pagamento confirmado - atualiza invoice e ativa subscription
   */
  private async handlePaymentConfirmed(payload: any) {
    const payment = payload.payment;

    if (!payment) {
      this.logger.warn('⚠️ Payment não encontrado no payload');
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

    // Busca ou cria invoice
    let invoice = await this.invoiceService.findByProviderId(
      'asaas',
      payment.id,
    );

    if (!invoice) {
      // Cria invoice se não existir (primeiro pagamento)
      invoice = await this.invoiceService.create({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        provider: 'asaas',
        providerId: payment.id,
        dueDate: payment.dueDate as any, // String YYYY-MM-DD do Asaas
        status: 'CONFIRMED',
        invoiceUrl: payment.invoiceUrl || null,
        amount: payment.value,
      });
      this.logger.log(`✅ Invoice criada e confirmada: ${payment.id}`);
    } else {
      // Atualiza invoice existente
      await this.invoiceService.updateStatus(
        'asaas',
        payment.id,
        'CONFIRMED',
        payment.invoiceUrl,
      );
      this.logger.log(`✅ Invoice confirmada: ${payment.id}`);
    }

    // Ativa a assinatura quando o pagamento é confirmado
    await this.subscriptionsService.activateSubscription(subscription.id);
    this.logger.log(`✅ Assinatura ativada: ${subscription.id}`);
  }

  /**
   * Processa pagamento vencido - atualiza invoice e pausa subscription
   */
  private async handlePaymentOverdue(payload: any) {
    const payment = payload.payment;

    if (!payment) {
      this.logger.warn('⚠️ Payment não encontrado no payload');
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

    // Atualiza status da invoice
    try {
      await this.invoiceService.updateStatus(
        'asaas',
        payment.id,
        'OVERDUE',
        payment.invoiceUrl,
      );
      this.logger.log(`✅ Invoice marcada como vencida: ${payment.id}`);
    } catch (error) {
      if (error.status === 404) {
        this.logger.warn(`⚠️ Invoice ${payment.id} não encontrada - ignorando`);
      } else {
        throw error;
      }
    }

    // Pausa a assinatura quando há pagamento vencido
    await this.subscriptionsService.pauseSubscription(subscription.id);
    this.logger.log(`⏸️ Assinatura pausada devido a pagamento vencido: ${subscription.id}`);
  }

  /**
   * Atualiza status de pagamento existente (refund)
   */
  private async handlePaymentStatusChange(payload: any) {
    const payment = payload.payment;

    if (!payment) {
      this.logger.warn('⚠️ Payment não encontrado no payload');
      return;
    }

    // Apenas trata REFUNDED aqui
    if (payload.event !== 'PAYMENT_REFUNDED') {
      this.logger.warn(`⚠️ Evento não esperado neste handler: ${payload.event}`);
      return;
    }

    try {
      await this.invoiceService.updateStatus(
        'asaas',
        payment.id,
        'REFUNDED',
        payment.invoiceUrl,
      );

      this.logger.log(`✅ Status da fatura ${payment.id} atualizado para REFUNDED`);
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
   * Processa pagamento deletado - remove invoice local
   */
  private async handlePaymentDeleted(payload: any) {
    const payment = payload.payment;

    if (!payment || !payment.id) {
      this.logger.warn('⚠️ Payment não encontrado no payload');
      return;
    }

    this.logger.log(`🗑️ Processando deleção do payment ${payment.id}`);

    try {
      // Busca invoice pelo providerId
      const invoice = await this.invoiceService.findByProviderId(
        'asaas',
        payment.id,
      );

      if (!invoice) {
        this.logger.warn(`⚠️ Invoice ${payment.id} não encontrada localmente`);
        return;
      }

      // Marca invoice como cancelada
      await this.invoiceService.updateStatus(
        'asaas',
        payment.id,
        'CANCELED',
        null,
      );

      this.logger.log(`✅ Invoice ${payment.id} marcada como cancelada`);
    } catch (error) {
      this.logger.error(`❌ Erro ao processar deleção: ${error.message}`);
      // Não re-lança erro para não falhar o webhook
    }
  }

  /**
   * Processa cancelamento de subscription
   */
  private async handleSubscriptionDeleted(payload: any) {
    const subscription = payload.subscription;

    if (!subscription || !subscription.id) {
      this.logger.warn('⚠️ Subscription não encontrada no payload');
      return;
    }

    this.logger.log(`🚫 Processando cancelamento da subscription ${subscription.id}`);

    try {
      // Busca subscription local
      const localSubscription = await this.subscriptionsService.findByProviderId(
        'asaas',
        subscription.id,
      );

      if (!localSubscription) {
        this.logger.warn(`⚠️ Subscription ${subscription.id} não encontrada localmente`);
        return;
      }

      // Cancela localmente
      await this.subscriptionsService.pauseSubscription(localSubscription.id);
      this.logger.log(`✅ Subscription cancelada localmente: ${localSubscription.id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao processar cancelamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Converte data brasileira (DD/MM/YYYY) ou ISO (YYYY-MM-DD) para Date (timezone local)
   */
  private parseBrazilianDate(dateStr: string): Date {
    if (!dateStr) {
      throw new Error('Data vazia');
    }

    // Se vier no formato ISO (YYYY-MM-DD)
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Se vier no formato brasileiro (DD/MM/YYYY)
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    throw new Error(`Formato de data não reconhecido: ${dateStr}`);
  }
}
