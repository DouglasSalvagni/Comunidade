import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) UNIQUE NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "name" varchar(100) NOT NULL,
        "role" varchar(20) DEFAULT 'user' CHECK ("role" IN ('user', 'admin')),
        "is_active" boolean DEFAULT true,
        "email_verified" boolean DEFAULT false,
        "created_at" TIMESTAMPTZ DEFAULT now(),
        "updated_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "description" text,
        "price_cents" integer NOT NULL,
        "billing_period" varchar(20) CHECK ("billing_period" IN ('monthly', 'yearly')),
        "features" jsonb,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "plan_id" uuid NOT NULL REFERENCES "plans"("id"),
        "status" varchar(20) CHECK ("status" IN ('active', 'canceled', 'past_due', 'unpaid')),
        "current_period_end" TIMESTAMPTZ,
        "provider" varchar(50),
        "provider_subscription_id" varchar(255),
        "created_at" TIMESTAMPTZ DEFAULT now(),
        "updated_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions" ("status")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at' AND tgrelid = 'users'::regclass
        ) THEN
          CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON "users"
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at' AND tgrelid = 'subscriptions'::regclass
        ) THEN
          CREATE TRIGGER update_subscriptions_updated_at
          BEFORE UPDATE ON "subscriptions"
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      INSERT INTO "plans" ("name", "description", "price_cents", "billing_period", "features")
      SELECT 'Gratuito', 'Acesso limitado ao conteudo', 0, 'monthly', '["10 musicas por mes", "Audiobooks limitados", "Anuncios"]'
      WHERE NOT EXISTS (SELECT 1 FROM "plans" WHERE "name" = 'Gratuito');
    `);
    await queryRunner.query(`
      INSERT INTO "plans" ("name", "description", "price_cents", "billing_period", "features")
      SELECT 'Premium Mensal', 'Acesso completo mensal', 1990, 'monthly', '["Musicas ilimitadas", "Audiobooks ilimitados", "Sem anuncios"]'
      WHERE NOT EXISTS (SELECT 1 FROM "plans" WHERE "name" = 'Premium Mensal');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON "subscriptions"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON "users"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
