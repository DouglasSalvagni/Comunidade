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
   * Cria ou atualiza uma fatura (upsert baseado em provider + providerId)
   */
  async create(data: {
    userId: string;
    subscriptionId?: string;
    provider: string;
    providerId: string;
    dueDate: Date | string;
    status: InvoiceStatus;
    invoiceUrl?: string;
    amount: number;
  }): Promise<Invoice> {
    // Busca invoice existente
    const existingInvoice = await this.findByProviderId(data.provider, data.providerId);

    if (existingInvoice) {
      // Atualiza invoice existente
      existingInvoice.status = data.status;
      existingInvoice.dueDate = data.dueDate as any; // Aceita string YYYY-MM-DD
      existingInvoice.amount = data.amount;
      if (data.invoiceUrl) {
        existingInvoice.invoiceUrl = data.invoiceUrl;
      }
      if (data.subscriptionId) {
        existingInvoice.subscriptionId = data.subscriptionId;
      }
      return this.invoiceRepository.save(existingInvoice);
    }

    // Cria nova invoice
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
      order: {
        dueDate: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Marca como CANCELED todas invoices pendentes/overdue de uma subscription
   */
  async cancelInvoicesForSubscription(subscriptionId: string): Promise<void> {
    await this.invoiceRepository
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: 'CANCELED' })
      .where('subscription_id = :subscriptionId', { subscriptionId })
      .andWhere("status IN (:...statuses)", { statuses: ['PENDING', 'OVERDUE'] })
      .execute();
  }

  /**
   * Busca fatura por ID
   */
  async findById(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({ where: { id } });
  }
}
