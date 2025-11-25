import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { WebhooksController } from './webhooks.controller';
import { Subscription } from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';
import { GatewayMeta } from './entities/gateway-meta.entity';
import { GatewayMetaService } from './services/gateway-meta.service';
import { AsaasPaymentGateway } from './providers/asaas-payment.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Plan, GatewayMeta]),
    ConfigModule,
  ],
  providers: [
    SubscriptionsService,
    GatewayMetaService,
    {
      provide: 'ASAAS_GATEWAY',
      useClass: AsaasPaymentGateway,
    },
  ],
  controllers: [SubscriptionsController, WebhooksController],
  exports: [SubscriptionsService, GatewayMetaService],
})
export class SubscriptionsModule { }