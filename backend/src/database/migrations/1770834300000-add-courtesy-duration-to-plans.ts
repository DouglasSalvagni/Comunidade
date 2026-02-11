import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourtesyDurationToPlans1770834300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD COLUMN "courtesy_duration_months" INT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
      DROP COLUMN "courtesy_duration_months"
    `);
  }
}
