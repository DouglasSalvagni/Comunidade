import { Controller, Get, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('ASAAS Callbacks')
@Controller('asaas/checkout')
export class AsaasCallbackController {
  private readonly logger = new Logger(AsaasCallbackController.name);

  @Get('success')
  @ApiOperation({ summary: 'ASAAS checkout success callback' })
  handleSuccess(@Res() res: Response) {
    this.logger.log('✅ Checkout success - redirecionando para frontend');

    // Redireciona para o frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard?checkout=success`);
  }

  @Get('cancel')
  @ApiOperation({ summary: 'ASAAS checkout cancel callback' })
  handleCancel(@Res() res: Response) {
    this.logger.log('❌ Checkout cancelado - redirecionando para frontend');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard?checkout=cancel`);
  }

  @Get('expired')
  @ApiOperation({ summary: 'ASAAS checkout expired callback' })
  handleExpired(@Res() res: Response) {
    this.logger.log('⏰ Checkout expirado - redirecionando para frontend');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard?checkout=expired`);
  }
}
