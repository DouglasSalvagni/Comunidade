import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalDocument } from './entities/legal-document.entity';
import { UserAgreement } from './entities/user-agreement.entity';

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(LegalDocument) private readonly legalRepo: Repository<LegalDocument>,
    @InjectRepository(UserAgreement) private readonly agreementRepo: Repository<UserAgreement>,
  ) {}

  async createDocument(params: { type: 'PRIVACY_POLICY' | 'TERMS_OF_USE'; content: string; isActive?: boolean }) {
    const doc = this.legalRepo.create({ type: params.type, content: params.content, isActive: !!params.isActive });
    const saved = await this.legalRepo.save(doc);
    if (params.isActive) {
      await this.activateDocument(saved.id);
      return await this.legalRepo.findOne({ where: { id: saved.id } });
    }
    return saved;
  }

  async listDocuments(type?: 'PRIVACY_POLICY' | 'TERMS_OF_USE') {
    const where = type ? { type } : {};
    return this.legalRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getActiveDocuments() {
    const [privacy, terms] = await Promise.all([
      this.legalRepo.findOne({ where: { type: 'PRIVACY_POLICY', isActive: true } }),
      this.legalRepo.findOne({ where: { type: 'TERMS_OF_USE', isActive: true } }),
    ]);
    return { privacy, terms };
  }

  async activateDocument(id: string) {
    const doc = await this.legalRepo.findOne({ where: { id } });
    if (!doc) return null;
    await this.legalRepo.update({ type: doc.type }, { isActive: false });
    doc.isActive = true;
    await this.legalRepo.save(doc);
    return doc;
  }

  async recordUserAcceptance(userId: string) {
    const { privacy, terms } = await this.getActiveDocuments();
    const docs = [privacy, terms].filter(Boolean) as LegalDocument[];
    if (docs.length === 0) return;
    for (const d of docs) {
      const existing = await this.agreementRepo.findOne({ where: { userId, documentId: d.id } });
      if (!existing) {
        await this.agreementRepo.save(this.agreementRepo.create({ userId, documentId: d.id }));
      }
    }
  }

  async hasUserAcceptedActive(userId: string): Promise<boolean> {
    const { privacy, terms } = await this.getActiveDocuments();
    const requiredDocs = [privacy, terms].filter(Boolean) as LegalDocument[];
    if (requiredDocs.length === 0) return true;
    for (const d of requiredDocs) {
      const existing = await this.agreementRepo.findOne({ where: { userId, documentId: d.id } });
      if (!existing) return false;
    }
    return true;
  }

  async hasUserAcceptedRequiredEver(userId: string): Promise<boolean> {
    const rows = await this.agreementRepo.createQueryBuilder('ua')
      .innerJoin('ua.document', 'doc')
      .where('ua.user_id = :userId', { userId })
      .andWhere('doc.type IN (:...types)', { types: ['PRIVACY_POLICY', 'TERMS_OF_USE'] })
      .select('doc.type', 'type')
      .groupBy('doc.type')
      .getRawMany();
    return Array.isArray(rows) && rows.length >= 2;
  }
}
