import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandPlanBillingPeriods1772000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
      DROP CONSTRAINT IF EXISTS "plans_billing_period_check"
    `);
    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD CONSTRAINT "plans_billing_period_check"
      CHECK ("billing_period" IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually', 'yearly'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
      DROP CONSTRAINT IF EXISTS "plans_billing_period_check"
    `);
    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD CONSTRAINT "plans_billing_period_check"
      CHECK ("billing_period" IN ('monthly', 'yearly'))
    `);
  }
}
