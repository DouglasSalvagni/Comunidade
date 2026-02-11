import {
  Body,
  Controller,
  Get,
  NotFoundException,
  ConflictException,
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
import { Plan } from '@/modules/subscriptions/entities/plan.entity';

@ApiTags('Admin - Plans')
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPlansController {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar planos' })
  async list() {
    return this.planRepository.find({ order: { priceCents: 'ASC' } });
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar plano' })
  @ApiResponse({ status: 201 })
  async create(@Body() body: {
    name: string;
    slug?: string;
    description?: string;
    priceCents: number;
    billingPeriod: 'monthly' | 'yearly';
    features?: string[];
    isActive?: boolean;
    isCourtesy?: boolean;
    courtesyDurationMonths?: number | null;
  }) {
    const isCourtesy = body.isCourtesy === true;
    const courtesySlug = 'plano-cortesia';

    let slug = body.slug?.trim();
    if (isCourtesy) {
      const existingCourtesy = await this.planRepository.findOne({ where: { slug: courtesySlug } });
      if (existingCourtesy) {
        throw new ConflictException('Plano cortesia já existe');
      }
      slug = courtesySlug;
    } else {
      if (!slug) {
        throw new ConflictException('Slug é obrigatório');
      }
      if (slug === courtesySlug) {
        throw new ConflictException('Use a marcação de cortesia para este plano');
      }
    }

    const existingSlug = await this.planRepository.findOne({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('Slug já existe');
    }

    const plan = this.planRepository.create({
      name: body.name,
      slug,
      description: body.description ?? null,
      priceCents: body.priceCents,
      billingPeriod: body.billingPeriod,
      features: Array.isArray(body.features) ? body.features : [],
      isActive: body.isActive ?? true,
      courtesyDurationMonths: body.courtesyDurationMonths ?? null,
    });

    return this.planRepository.save(plan);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar plano' })
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      slug: string;
      description?: string;
      priceCents: number;
      billingPeriod: 'monthly' | 'yearly';
      features?: string[];
      isActive?: boolean;
      isCourtesy?: boolean;
      courtesyDurationMonths?: number | null;
    }>,
  ) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const courtesySlug = 'plano-cortesia';

    if (body.isCourtesy === true) {
      const existingCourtesy = await this.planRepository.findOne({ where: { slug: courtesySlug } });
      if (existingCourtesy && existingCourtesy.id !== plan.id) {
        throw new ConflictException('Plano cortesia já existe');
      }
      plan.slug = courtesySlug;
    }

    if (body.isCourtesy === false) {
      if (plan.slug === courtesySlug && !body.slug) {
        throw new ConflictException('Slug é obrigatório');
      }
      if (body.slug === courtesySlug) {
        throw new ConflictException('Use a marcação de cortesia para este plano');
      }
    }

    if (body.slug) {
      const normalizedSlug = body.slug.trim();
      const existingSlug = await this.planRepository.findOne({ where: { slug: normalizedSlug } });
      if (existingSlug && existingSlug.id !== plan.id) {
        throw new ConflictException('Slug já existe');
      }
      plan.slug = normalizedSlug;
    }

    if (body.name !== undefined) {
      plan.name = body.name;
    }
    if (body.description !== undefined) {
      plan.description = body.description;
    }
    if (body.priceCents !== undefined) {
      plan.priceCents = body.priceCents;
    }
    if (body.billingPeriod !== undefined) {
      plan.billingPeriod = body.billingPeriod;
    }
    if (body.features !== undefined) {
      plan.features = Array.isArray(body.features) ? body.features : [];
    }
    if (body.isActive !== undefined) {
      plan.isActive = body.isActive;
    }
    if (body.courtesyDurationMonths !== undefined) {
      if (body.courtesyDurationMonths === null) {
        plan.courtesyDurationMonths = null;
      } else {
        const duration = Number(body.courtesyDurationMonths);
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new ConflictException('Duração inválida');
        }
        plan.courtesyDurationMonths = duration;
      }
    }

    return this.planRepository.save(plan);
  }
}
