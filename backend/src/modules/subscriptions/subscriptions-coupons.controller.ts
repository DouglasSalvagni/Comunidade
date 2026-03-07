import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { SubscriptionsCouponsService } from './subscriptions-coupons.service';
import { ActivateCouponDto } from './dto/activate-coupon.dto';

@ApiTags('Subscriptions - Coupons')
@Controller('subscriptions/coupons')
@UseGuards(JwtAuthGuard)
export class SubscriptionsCouponsController {
  constructor(private readonly couponsService: SubscriptionsCouponsService) { }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate partnership coupon for current user' })
  @ApiResponse({ status: 200, description: 'Coupon activated successfully.' })
  async activate(@Request() req, @Body() dto: ActivateCouponDto) {
    const activeCoupon = await this.couponsService.activateCoupon(req.user.userId, dto.code);
    return activeCoupon;
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current active coupon for user' })
  @ApiResponse({ status: 200, description: 'Coupon canceled successfully.' })
  async cancel(@Request() req) {
    await this.couponsService.cancelActiveCoupon(req.user.userId);
    return { ok: true };
  }

  @Post('checkout-failed')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark pending coupon back to active after checkout failure' })
  @ApiResponse({ status: 200, description: 'Coupon updated successfully.' })
  async checkoutFailed(@Request() req) {
    await this.couponsService.markActiveAfterCheckoutFailure(req.user.userId);
    return { ok: true };
  }

  @Get('active')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active coupon for user' })
  @ApiResponse({ status: 200, description: 'Active coupon retrieved successfully.' })
  async getActive(@Request() req) {
    const activeCoupon = await this.couponsService.getActiveCoupon(req.user.userId);
    return activeCoupon;
  }
}
