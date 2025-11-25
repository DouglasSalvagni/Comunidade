import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) { }

  /**
   * Cria uma nova fatura
   */
  async create(data: {
    userId: string;
    subscriptionId?: string;
    provider: string;
    providerId: string;
    dueDate: Date;
    status: InvoiceStatus;
    invoiceUrl?: string;
    amount: number;
  }): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(data);
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Busca fatura por provider e providerId
   */
  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({
      where: { provider, providerId },
    });
  }

  /**
   * Atualiza status da fatura
   */
  async updateStatus(
    provider: string,
    providerId: string,
    status: InvoiceStatus,
    invoiceUrl?: string,
  ): Promise<Invoice> {
    const invoice = await this.findByProviderId(provider, providerId);

    if (!invoice) {
      throw new NotFoundException(
        `Fatura não encontrada: ${provider}:${providerId}`,
      );
    }

    invoice.status = status;
    if (invoiceUrl) {
      invoice.invoiceUrl = invoiceUrl;
    }

    return this.invoiceRepository.save(invoice);
  }

  /**
   * Lista todas as faturas de um usuário
   */
  async findByUser(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca fatura por ID
   */
  async findById(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({ where: { id } });
  }
}
