import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { WebhooksController } from './webhooks.controller';
import { AsaasCallbackController } from './asaas-callback.controller';
import { Subscription } from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';
import { GatewayMeta } from './entities/gateway-meta.entity';
import { GatewayWebhook } from './entities/gateway-webhook.entity';
import { GatewayMetaService } from './services/gateway-meta.service';
import { GatewayWebhookService } from './services/gateway-webhook.service';
import { AsaasPaymentGateway } from './providers/asaas-payment.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Plan, GatewayMeta, GatewayWebhook]),
    ConfigModule,
  ],
  providers: [
    SubscriptionsService,
    GatewayMetaService,
    GatewayWebhookService,
    {
      provide: 'ASAAS_GATEWAY',
      useClass: AsaasPaymentGateway,
    },
  ],
  controllers: [SubscriptionsController, WebhooksController, AsaasCallbackController],
  exports: [SubscriptionsService, GatewayMetaService, GatewayWebhookService],
})
export class SubscriptionsModule { }