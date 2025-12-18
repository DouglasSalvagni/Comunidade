import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserAgreement } from './user-agreement.entity';

export type LegalDocumentType = 'PRIVACY_POLICY' | 'TERMS_OF_USE';

@Entity('legal_documents')
export class LegalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: LegalDocumentType;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserAgreement, (ua) => ua.document)
  agreements: UserAgreement[];
}

