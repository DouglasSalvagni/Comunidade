import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @Get('current')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'No active subscription found.' })
  async getCurrentSubscription(@Request() req) {
    let subscription = await this.subscriptionsService.getCurrentSubscription(req.user.userId);

    if (!subscription) {
      subscription = await this.subscriptionsService.createFreeSubscription(req.user.userId);
    }

    return {
      subscription: {
        id: subscription.id,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          priceCents: subscription.plan.priceCents,
          billingPeriod: subscription.plan.billingPeriod,
        },
        status: subscription.status,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
      },
    };
  }

  @Get('plans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully.' })
  async getAllPlans() {
    const plans = await this.subscriptionsService.getAllPlans();
    return {
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceCents: plan.priceCents,
        billingPeriod: plan.billingPeriod,
        features: plan.features,
      })),
    };
  }

  @Post('change-plan')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan changed successfully.' })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  @ApiResponse({ status: 409, description: 'Plan is not active.' })
  async changePlan(@Request() req, @Body('planId') planId: string) {
    const subscription = await this.subscriptionsService.changePlan(req.user.userId, planId);
    return {
      message: 'Plan changed successfully',
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
      },
    };
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create checkout session for paid subscription' })
  @ApiResponse({ status: 200, description: 'Checkout URL created successfully.' })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  @ApiResponse({ status: 409, description: 'Plan is not active.' })
  async createCheckout(
    @Request() req,
    @Body() body: { planId: string; cpf?: string },
  ) {
    const { checkoutUrl } = await this.subscriptionsService.createCheckoutSession(
      req.user.userId,
      body.planId,
      req.user.email,
      req.user.name || req.user.email,
      body.cpf,
    );

    return {
      checkoutUrl,
    };
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully.' })
  @ApiResponse({ status: 404, description: 'No active subscription found.' })
  async cancelSubscription(@Request() req) {
    await this.subscriptionsService.cancelSubscription(req.user.userId);

    // Retorna a assinatura atualizada para o cliente (compatível com o formato esperado pelo frontend)
    let subscription = await this.subscriptionsService.getCurrentSubscription(req.user.userId);
    if (!subscription) {
      subscription = await this.subscriptionsService.createFreeSubscription(req.user.userId);
    }

    return {
      message: 'Assinatura cancelada com sucesso',
      subscription: {
        id: subscription.id,
        plan: subscription.plan ? {
          id: subscription.plan.id,
          name: subscription.plan.name,
          priceCents: subscription.plan.priceCents,
          billingPeriod: subscription.plan.billingPeriod,
        } : null,
        status: subscription.status,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
      },
    };
  }

  @Get('billing-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get billing history' })
  @ApiResponse({ status: 200, description: 'Billing history retrieved successfully.' })
  async getBillingHistory(@Request() req) {
    const history = await this.subscriptionsService.getSubscriptionHistory(req.user.userId);
    return {
      history: history.map(subscription => ({
        id: subscription.id,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          priceCents: subscription.plan.priceCents,
          billingPeriod: subscription.plan.billingPeriod,
        },
        status: subscription.status,
        createdAt: subscription.createdAt,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
      })),
    };
  }

  @Get('limits')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription limits and features' })
  @ApiResponse({ status: 200, description: 'Limits retrieved successfully.' })
  async getSubscriptionLimits(@Request() req) {
    const limits = await this.subscriptionsService.getSubscriptionLimits(req.user.userId);
    return { limits };
  }
}