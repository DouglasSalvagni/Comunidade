import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { WebhooksController } from './webhooks.controller';
import { AsaasCallbackController } from './asaas-callback.controller';
import { InvoicesController } from './invoices.controller';
import { Subscription } from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';
import { GatewayMeta } from './entities/gateway-meta.entity';
import { GatewayWebhook } from './entities/gateway-webhook.entity';
import { Invoice } from './entities/invoice.entity';
import { GatewayMetaService } from './services/gateway-meta.service';
import { GatewayWebhookService } from './services/gateway-webhook.service';
import { InvoiceService } from './services/invoice.service';
import { AsaasPaymentGateway } from './providers/asaas-payment.gateway';
import { PremiumGuard } from './guards/premium.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Plan, GatewayMeta, GatewayWebhook, Invoice]),
    ConfigModule,
  ],
  providers: [
    SubscriptionsService,
    GatewayMetaService,
    GatewayWebhookService,
    InvoiceService,
    PremiumGuard,
    {
      provide: 'ASAAS_GATEWAY',
      useClass: AsaasPaymentGateway,
    },
  ],
  controllers: [SubscriptionsController, WebhooksController, AsaasCallbackController, InvoicesController],
  exports: [SubscriptionsService, GatewayMetaService, GatewayWebhookService, InvoiceService, PremiumGuard],
})
export class SubscriptionsModule { }