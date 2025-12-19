import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAllSubscriptionsChecks1766000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop all CHECK constraints on the subscriptions table
    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT conname FROM pg_constraint
          WHERE contype = 'c' AND conrelid = 'subscriptions'::regclass
        LOOP
          EXECUTE format('ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS %I', r.conname);
        END LOOP;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the status CHECK only (best-effort). If you need other checks restored,
    // create a migration that re-adds them explicitly.
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT IF NOT EXISTS "chk_subscriptions_status" CHECK ("status" IN ('active', 'canceled', 'past_due', 'unpaid'))
    `);
  }
}
