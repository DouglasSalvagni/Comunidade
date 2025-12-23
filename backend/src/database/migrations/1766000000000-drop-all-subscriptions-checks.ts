import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAllSubscriptionsChecks1766000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop all CHECK constraints on the subscriptions table safely
    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT conname FROM pg_constraint
          WHERE contype = 'c' AND conrelid = 'subscriptions'::regclass
        LOOP
          BEGIN
            EXECUTE format('ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS %I', r.conname);
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop constraint %: %', r.conname, SQLERRM;
          END;
        END LOOP;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the status CHECK only (best-effort).
    // Using try-catch block to avoid errors if constraint already exists or conflicts
    await queryRunner.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE "subscriptions"
          ADD CONSTRAINT "chk_subscriptions_status" CHECK ("status" IN ('active', 'canceled', 'past_due', 'unpaid'));
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not recreate constraint chk_subscriptions_status: %', SQLERRM;
        END;
      END
      $$;
    `);
  }
}
