import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLegalDocumentsAndAgreements1765500000000 implements MigrationInterface {
  name = 'CreateLegalDocumentsAndAgreements1765500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "legal_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "type" varchar(50) NOT NULL CHECK ("type" IN ('PRIVACY_POLICY','TERMS_OF_USE')),
        "content" text NOT NULL,
        "is_active" boolean DEFAULT false,
        "created_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_agreements" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "document_id" uuid NOT NULL REFERENCES "legal_documents"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ DEFAULT now(),
        UNIQUE("user_id","document_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_legal_documents_type" ON "legal_documents" ("type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_legal_documents_active" ON "legal_documents" ("type","is_active")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_agreements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "legal_documents"`);
  }
}
