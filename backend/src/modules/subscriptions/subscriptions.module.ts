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
import { Affiliate } from './entities/affiliate.entity';
import { Partnership } from './entities/partnership.entity';
import { PartnershipAffiliate } from './entities/partnership-affiliate.entity';
import { UserActiveCoupon } from './entities/user-active-coupon.entity';
import { User } from '@/modules/users/entities/user.entity';
import { GatewayMetaService } from './services/gateway-meta.service';
import { GatewayWebhookService } from './services/gateway-webhook.service';
import { InvoiceService } from './services/invoice.service';
import { AsaasPaymentGateway } from './providers/asaas-payment.gateway';
import { PremiumGuard } from './guards/premium.guard';
import { SubscriptionsCouponsController } from './subscriptions-coupons.controller';
import { SubscriptionsCouponsService } from './subscriptions-coupons.service';
import { SettingsModule } from '@/modules/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Plan,
      GatewayMeta,
      GatewayWebhook,
      Invoice,
      Affiliate,
      Partnership,
      PartnershipAffiliate,
      UserActiveCoupon,
      User,
    ]),
    ConfigModule,
    SettingsModule,
  ],
  providers: [
    SubscriptionsService,
    GatewayMetaService,
    GatewayWebhookService,
    InvoiceService,
    PremiumGuard,
    SubscriptionsCouponsService,
    {
      provide: 'ASAAS_GATEWAY',
      useClass: AsaasPaymentGateway,
    },
  ],
  controllers: [
    SubscriptionsController,
    SubscriptionsCouponsController,
    WebhooksController,
    AsaasCallbackController,
    InvoicesController,
  ],
  exports: [
    SubscriptionsService,
    GatewayMetaService,
    GatewayWebhookService,
    InvoiceService,
    PremiumGuard,
    SubscriptionsCouponsService,
  ],
})
export class SubscriptionsModule { }
