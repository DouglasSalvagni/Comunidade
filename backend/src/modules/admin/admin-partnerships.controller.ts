import {
  Body,
  Controller,
  Get,
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
import { Partnership } from '@/modules/subscriptions/entities/partnership.entity';
import { PartnershipAffiliate } from '@/modules/subscriptions/entities/partnership-affiliate.entity';
import { Affiliate } from '@/modules/subscriptions/entities/affiliate.entity';
import { SavePartnershipDto } from '@/modules/subscriptions/dto/save-partnership.dto';

@ApiTags('Admin - Partnerships')
@Controller('admin/partnerships')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPartnershipsController {
  constructor(
    @InjectRepository(Partnership)
    private readonly partnershipRepository: Repository<Partnership>,
    @InjectRepository(PartnershipAffiliate)
    private readonly partnershipAffiliateRepository: Repository<PartnershipAffiliate>,
    @InjectRepository(Affiliate)
    private readonly affiliateRepository: Repository<Affiliate>,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar parcerias (cupons)' })
  async list() {
    const partnerships = await this.partnershipRepository.find({
      order: { createdAt: 'DESC' },
    });
    return partnerships;
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhar parceria com splits' })
  async get(@Param('id') id: string) {
    const partnership = await this.partnershipRepository.findOne({ where: { id } });
    if (!partnership) {
      return null;
    }
    const splits = await this.partnershipAffiliateRepository.find({
      where: { partnershipId: id },
      relations: ['affiliate'],
    });
    return {
      partnership,
      affiliates: splits.map((s) => ({
        id: s.id,
        affiliateId: s.affiliateId,
        affiliateName: s.affiliate?.name,
        payoutType: s.payoutType,
        payoutValue: s.payoutValue,
      })),
    };
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar parceria (cupom + splits)' })
  @ApiResponse({ status: 201 })
  async create(@Body() body: SavePartnershipDto) {
    const normalizedCode = body.code.toUpperCase();

    const existingCode = await this.partnershipRepository.findOne({
      where: { code: normalizedCode },
    });
    if (existingCode) {
      throw new Error('Código de parceria já existe');
    }

    const partnership = this.partnershipRepository.create({
      code: normalizedCode,
      status: body.status || 'ACTIVE',
      discountType: body.discountType,
      discountValue: String(body.discountValue),
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      maxRedemptions: body.maxRedemptions ?? null,
    });

    const saved = await this.partnershipRepository.save(partnership);
    await this.saveSplits(saved.id, body);

    return saved;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar parceria (cupom + splits)' })
  async update(@Param('id') id: string, @Body() body: SavePartnershipDto) {
    const partnership = await this.partnershipRepository.findOne({ where: { id } });
    if (!partnership) {
      return null;
    }

    partnership.code = body.code.toUpperCase();
    partnership.status = body.status || partnership.status;
    partnership.discountType = body.discountType;
    partnership.discountValue = String(body.discountValue);
    partnership.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    partnership.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    partnership.maxRedemptions = body.maxRedemptions ?? null;

    const updated = await this.partnershipRepository.save(partnership);
    await this.saveSplits(id, body);

    return updated;
  }

  private async saveSplits(partnershipId: string, body: SavePartnershipDto) {
    if (!body.affiliates || body.affiliates.length === 0) {
      await this.partnershipAffiliateRepository.delete({ partnershipId });
      return;
    }

    const affiliates = await this.affiliateRepository.findByIds(
      body.affiliates.map((a) => a.affiliateId),
    );
    if (affiliates.length !== body.affiliates.length) {
      throw new Error('Afiliado inválido na lista de splits');
    }

    const percentSum = body.affiliates
      .filter((a) => a.payoutType === 'PERCENT')
      .reduce((acc, cur) => acc + cur.payoutValue, 0);
    if (percentSum > 100.0001) {
      throw new Error('Soma dos percentuais de split não pode exceder 100%');
    }

    await this.partnershipAffiliateRepository.delete({ partnershipId });

    const records = body.affiliates.map((a) =>
      this.partnershipAffiliateRepository.create({
        partnershipId,
        affiliateId: a.affiliateId,
        payoutType: a.payoutType,
        payoutValue: String(a.payoutValue),
      }),
    );

    if (records.length > 0) {
      await this.partnershipAffiliateRepository.save(records);
    }
  }
}

