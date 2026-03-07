import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalDocument } from './entities/legal-document.entity';
import { UserAgreement } from './entities/user-agreement.entity';
import { LegalService } from './legal.service';
import { LegalController, AdminLegalController } from './legal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LegalDocument, UserAgreement])],
  providers: [LegalService],
  controllers: [LegalController, AdminLegalController],
  exports: [LegalService],
})
export class LegalModule {}

