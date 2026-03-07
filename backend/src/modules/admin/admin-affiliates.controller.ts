import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Affiliate } from '@/modules/subscriptions/entities/affiliate.entity';

@ApiTags('Admin - Affiliates')
@Controller('admin/affiliates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAffiliatesController {
  constructor(
    @InjectRepository(Affiliate)
    private readonly affiliateRepository: Repository<Affiliate>,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar afiliados' })
  async list() {
    return this.affiliateRepository.find({ order: { createdAt: 'DESC' } });
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar afiliado' })
  @ApiResponse({ status: 201 })
  async create(@Body() body: { name: string; email: string; walletId: string }) {
    const affiliate = this.affiliateRepository.create({
      name: body.name,
      email: body.email,
      walletId: body.walletId,
      status: 'ACTIVE',
    });
    return this.affiliateRepository.save(affiliate);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar afiliado' })
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; email: string; walletId: string; status: 'ACTIVE' | 'INACTIVE' }>,
  ) {
    const affiliate = await this.affiliateRepository.findOne({ where: { id } });
    if (!affiliate) {
      throw new NotFoundException('Afiliado não encontrado');
    }

    if (body.name !== undefined) {
      affiliate.name = body.name;
    }
    if (body.email !== undefined) {
      affiliate.email = body.email;
    }
    if (body.walletId !== undefined) {
      affiliate.walletId = body.walletId;
    }
    if (body.status !== undefined) {
      affiliate.status = body.status;
    }

    return this.affiliateRepository.save(affiliate);
  }
}
