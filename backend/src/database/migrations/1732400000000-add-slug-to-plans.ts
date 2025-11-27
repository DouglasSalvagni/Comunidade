import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugToPlans1732400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna slug
    await queryRunner.query(`
      ALTER TABLE "plans" 
      ADD COLUMN "slug" VARCHAR
    `);

    // 2. Preencher slug baseado nos planos existentes
    await queryRunner.query(`
      UPDATE "plans"
      SET "slug" = CASE 
        WHEN name ILIKE 'plano-%' THEN LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9-]', '-', 'g'))
        ELSE 'plano-' || LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'))
      END
    `);

    // 3. Tornar slug NOT NULL e UNIQUE
    await queryRunner.query(`
      ALTER TABLE "plans" 
      ALTER COLUMN "slug" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "plans" 
      ADD CONSTRAINT "uk_plans_slug" UNIQUE ("slug")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover constraint e coluna
    await queryRunner.query(`
      ALTER TABLE "plans" 
      DROP CONSTRAINT IF EXISTS "uk_plans_slug"
    `);

    await queryRunner.query(`
      ALTER TABLE "plans" 
      DROP COLUMN "slug"
    `);
  }
}
