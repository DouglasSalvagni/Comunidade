import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoiceService } from './services/invoice.service';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoiceService: InvoiceService) { }

  @Get()
  @ApiOperation({ summary: 'Listar faturas do usuário autenticado' })
  async list(@Request() req: any) {
    return this.invoiceService.findByUser(req.user.userId);
  }
}
