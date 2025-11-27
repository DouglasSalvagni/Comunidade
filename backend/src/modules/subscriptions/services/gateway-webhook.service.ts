import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayWebhook, GatewayType } from '../entities/gateway-webhook.entity';

@Injectable()
export class GatewayWebhookService {
  constructor(
    @InjectRepository(GatewayWebhook)
    private readonly gatewayWebhookRepository: Repository<GatewayWebhook>,
  ) { }

  /**
   * Registra um webhook recebido
   */
  async create(
    gateway: GatewayType,
    event: string,
    payload: Record<string, any>,
  ): Promise<GatewayWebhook> {
    const webhook = this.gatewayWebhookRepository.create({
      gateway,
      event,
      payload,
    });

    return this.gatewayWebhookRepository.save(webhook);
  }

  /**
   * Lista webhooks por gateway
   */
  async findByGateway(gateway: GatewayType, limit = 50): Promise<GatewayWebhook[]> {
    return this.gatewayWebhookRepository.find({
      where: { gateway },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Lista webhooks por evento
   */
  async findByEvent(gateway: GatewayType, event: string, limit = 50): Promise<GatewayWebhook[]> {
    return this.gatewayWebhookRepository.find({
      where: { gateway, event },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
