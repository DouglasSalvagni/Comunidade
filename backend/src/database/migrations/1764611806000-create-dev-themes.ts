import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDevThemes1764611806000 implements MigrationInterface {
  name = 'CreateDevThemes1764611806000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dev_themes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) UNIQUE NOT NULL,
        "description" text,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_dev_themes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
        "theme_id" uuid NOT NULL REFERENCES "dev_themes"("id") ON DELETE CASCADE,
        UNIQUE("work_id", "theme_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_work_dev_themes_work_id" ON "work_dev_themes" ("work_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_work_dev_themes_theme_id" ON "work_dev_themes" ("theme_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_work_dev_themes_theme_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_work_dev_themes_work_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_dev_themes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dev_themes"`);
  }
}

