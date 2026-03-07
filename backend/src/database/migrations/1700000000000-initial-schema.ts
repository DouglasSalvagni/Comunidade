import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

    // Function for updated_at triggers
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Users
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

    // Profiles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(100) NOT NULL,
        "avatar_url" varchar(500),
        "age_range" varchar(20) CHECK ("age_range" IN ('0-2', '3-5', '6-8', '9-12', '13+')),
        "parental_pin" varchar(4),
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMPTZ DEFAULT now(),
        "updated_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Plans
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

    // Subscriptions
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

    // Works
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "works" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "description" text,
        "type" varchar(20) CHECK ("type" IN ('music', 'audiobook', 'series')),
        "recommended_age" varchar(20),
        "cover_url" varchar(500),
        "duration_seconds" integer,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMPTZ DEFAULT now(),
        "updated_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Tracks
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tracks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
        "title" varchar(255) NOT NULL,
        "audio_url" varchar(500),
        "storage_key" varchar(255),
        "hls_manifest_storage_key" varchar(255),
        "hls_encrypted" boolean DEFAULT false,
        "hls_encryption_key" varchar(255),
        "duration_seconds" integer,
        "order_index" integer DEFAULT 0,
        "created_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Chapters
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chapters" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
        "track_id" uuid REFERENCES "tracks"("id") ON DELETE CASCADE,
        "title" varchar(255) NOT NULL,
        "start_time_seconds" integer DEFAULT 0,
        "duration_seconds" integer,
        "order_index" integer DEFAULT 0,
        "created_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Tags
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tags" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) UNIQUE NOT NULL,
        "color" varchar(7) DEFAULT '#000000',
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Work Tags (many-to-many)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_tags" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        UNIQUE("work_id", "tag_id")
      )
    `);

    // Favorites
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "favorites" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "profile_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
        "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ DEFAULT now(),
        UNIQUE("user_id", "work_id"),
        UNIQUE("profile_id", "work_id")
      )
    `);

    // Downloads
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "downloads" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "track_id" uuid NOT NULL REFERENCES "tracks"("id") ON DELETE CASCADE,
        "license_expires_at" TIMESTAMPTZ,
        "device_id" varchar(255),
        "created_at" TIMESTAMPTZ DEFAULT now(),
        UNIQUE("profile_id", "track_id", "device_id")
      )
    `);

    // Playlists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "playlists" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "profile_id" uuid REFERENCES "profiles"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "is_default" boolean DEFAULT false,
        "created_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Playlist Items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "playlist_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "playlist_id" uuid NOT NULL REFERENCES "playlists"("id") ON DELETE CASCADE,
        "track_id" uuid NOT NULL REFERENCES "tracks"("id") ON DELETE CASCADE,
        "order_index" integer DEFAULT 0,
        "created_at" TIMESTAMPTZ DEFAULT now(),
        UNIQUE("playlist_id", "track_id")
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_profiles_user_id" ON "profiles" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_works_type" ON "works" ("type")`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'works' AND column_name = 'recommended_age'
        ) THEN
          CREATE INDEX IF NOT EXISTS "idx_works_age" ON "works" ("recommended_age");
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_works_active" ON "works" ("is_active")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tracks_work_id" ON "tracks" ("work_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chapters_work_id" ON "chapters" ("work_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_work_tags_work_id" ON "work_tags" ("work_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_work_tags_tag_id" ON "work_tags" ("tag_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_favorites_user_id" ON "favorites" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_favorites_profile_id" ON "favorites" ("profile_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_favorites_work_id" ON "favorites" ("work_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_downloads_profile_id" ON "downloads" ("profile_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_downloads_track_id" ON "downloads" ("track_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_playlists_user_id" ON "playlists" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_playlists_profile_id" ON "playlists" ("profile_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_playlist_items_playlist_id" ON "playlist_items" ("playlist_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_works_title_trgm" ON "works" USING gin ("title" gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_works_description_trgm" ON "works" USING gin ("description" gin_trgm_ops)`);

    // Triggers (idempotentes)
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
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at' AND tgrelid = 'profiles'::regclass
        ) THEN
          CREATE TRIGGER update_profiles_updated_at
          BEFORE UPDATE ON "profiles"
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
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_works_updated_at' AND tgrelid = 'works'::regclass
        ) THEN
          CREATE TRIGGER update_works_updated_at
          BEFORE UPDATE ON "works"
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);

    // Seed inicial idempotente com suporte a coluna slug
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'slug'
        ) THEN
          INSERT INTO "plans" ("slug", "name", "description", "price_cents", "billing_period", "features")
          SELECT 'plano-gratuito', 'Gratuito', 'Acesso limitado ao conteudo', 0, 'monthly', '["10 musicas por mes", "Audiobooks limitados", "Anuncios"]'
          WHERE NOT EXISTS (SELECT 1 FROM "plans" WHERE "slug" = 'plano-gratuito' OR "name" = 'Gratuito');
        ELSE
          INSERT INTO "plans" ("name", "description", "price_cents", "billing_period", "features")
          SELECT 'Gratuito', 'Acesso limitado ao conteudo', 0, 'monthly', '["10 musicas por mes", "Audiobooks limitados", "Anuncios"]'
          WHERE NOT EXISTS (SELECT 1 FROM "plans" WHERE "name" = 'Gratuito');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'slug'
        ) THEN
          INSERT INTO "plans" ("slug", "name", "description", "price_cents", "billing_period", "features")
          SELECT 'plano-mensal', 'Premium Mensal', 'Acesso completo mensal', 1990, 'monthly', '["Musicas ilimitadas", "Audiobooks ilimitados", "Sem anuncios", "Downloads offline", "Qualidade HD"]'
          WHERE NOT EXISTS (SELECT 1 FROM "plans" WHERE "slug" = 'plano-mensal' OR "name" = 'Premium Mensal');
        ELSE
          INSERT INTO "plans" ("name", "description", "price_cents", "billing_period", "features")
          SELECT 'Premium Mensal', 'Acesso completo mensal', 1990, 'monthly', '["Musicas ilimitadas", "Audiobooks ilimitados", "Sem anuncios", "Downloads offline", "Qualidade HD"]'
          WHERE NOT EXISTS (SELECT 1 FROM "plans" WHERE "name" = 'Premium Mensal');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'slug'
        ) THEN
          INSERT INTO "plans" ("slug", "name", "description", "price_cents", "billing_period", "features")
          SELECT 'plano-anual', 'Premium Anual', 'Acesso completo anual com desconto', 19900, 'yearly', '["Musicas ilimitadas", "Audiobooks ilimitados", "Sem anuncios", "Downloads offline", "Qualidade HD", "2 meses gratis"]'
          WHERE NOT EXISTS (SELECT 1 FROM "plans" WHERE "slug" = 'plano-anual' OR "name" = 'Premium Anual');
        ELSE
          INSERT INTO "plans" ("name", "description", "price_cents", "billing_period", "features")
          SELECT 'Premium Anual', 'Acesso completo anual com desconto', 19900, 'yearly', '["Musicas ilimitadas", "Audiobooks ilimitados", "Sem anuncios", "Downloads offline", "Qualidade HD", "2 meses gratis"]'
          WHERE NOT EXISTS (SELECT 1 FROM "plans" WHERE "name" = 'Premium Anual');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      INSERT INTO "tags" ("name", "color") VALUES
        ('Aventura', '#FF6B35'),
        ('Educativo', '#4ECDC4'),
        ('Diversao', '#45B7D1'),
        ('Relaxamento', '#96CEB4'),
        ('Classicos', '#FFEAA7'),
        ('Natal', '#DD2D4A'),
        ('Animais', '#6C5CE7'),
        ('Natureza', '#00B894'),
        ('Amizade', '#FD79A8'),
        ('Familia', '#FDCB6E')
      ON CONFLICT ("name") DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO "users" ("email", "password_hash", "name", "role", "is_active")
      VALUES ('douglassalvagni@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'admin', true)
      ON CONFLICT ("email") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_works_updated_at ON "works"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON "subscriptions"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_profiles_updated_at ON "profiles"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON "users"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);

    await queryRunner.query(`DROP TABLE IF EXISTS "playlist_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "playlists"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "downloads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "favorites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chapters"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tracks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "works"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
