import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAndAddPeriodColumns1732500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna period_start
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD COLUMN "period_start" TIMESTAMP
    `);

    // 2. Preencher period_start com created_at para registros existentes
    await queryRunner.query(`
      UPDATE "subscriptions"
      SET "period_start" = "created_at"
      WHERE "period_start" IS NULL
    `);

    // 3. Renomear current_period_end para period_end
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      RENAME COLUMN "current_period_end" TO "period_end"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: renomear period_end para current_period_end
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      RENAME COLUMN "period_end" TO "current_period_end"
    `);

    // Remover coluna period_start
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      DROP COLUMN "period_start"
    `);
  }
}
