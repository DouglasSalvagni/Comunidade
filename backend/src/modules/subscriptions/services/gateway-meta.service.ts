import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayMeta, GatewayType, EntityType } from '../entities/gateway-meta.entity';

@Injectable()
export class GatewayMetaService {
  constructor(
    @InjectRepository(GatewayMeta)
    private readonly gatewayMetaRepository: Repository<GatewayMeta>,
  ) { }

  /**
   * Busca ou cria um registro de gateway meta
   */
  async findOrCreate(
    gateway: GatewayType,
    entityType: EntityType,
    entityId: string,
    metas: Record<string, any> = {},
  ): Promise<GatewayMeta> {
    let gatewayMeta = await this.gatewayMetaRepository.findOne({
      where: { gateway, entityType, entityId },
    });

    if (!gatewayMeta) {
      gatewayMeta = this.gatewayMetaRepository.create({
        gateway,
        entityType,
        entityId,
        metas,
      });
      await this.gatewayMetaRepository.save(gatewayMeta);
    }

    return gatewayMeta;
  }

  /**
   * Busca um gateway meta
   */
  async findOne(
    gateway: GatewayType,
    entityType: EntityType,
    entityId: string,
  ): Promise<GatewayMeta | null> {
    return this.gatewayMetaRepository.findOne({
      where: { gateway, entityType, entityId },
    });
  }

  /**
   * Atualiza os metadados
   */
  async updateMetas(
    gateway: GatewayType,
    entityType: EntityType,
    entityId: string,
    metas: Record<string, any>,
  ): Promise<GatewayMeta> {
    const gatewayMeta = await this.findOrCreate(gateway, entityType, entityId, metas);
    gatewayMeta.metas = { ...gatewayMeta.metas, ...metas };
    return this.gatewayMetaRepository.save(gatewayMeta);
  }

  /**
   * Busca por ID do gateway (ex: customer_id, subscription_id)
   */
  async findByGatewayId(
    gateway: GatewayType,
    entityType: EntityType,
    gatewayId: string,
  ): Promise<GatewayMeta | null> {
    const metas = await this.gatewayMetaRepository
      .createQueryBuilder('gateway_meta')
      .where('gateway_meta.gateway = :gateway', { gateway })
      .andWhere('gateway_meta.entity_type = :entityType', { entityType })
      .andWhere("gateway_meta.metas->>'id' = :gatewayId", { gatewayId })
      .getOne();

    return metas;
  }
}
