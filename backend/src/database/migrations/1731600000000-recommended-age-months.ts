import { MigrationInterface, QueryRunner } from "typeorm";

export class RecommendedAgeMonths1731600000000 implements MigrationInterface {
  name = 'RecommendedAgeMonths1731600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "works" ADD COLUMN "recommended_min_months" INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "works" ADD COLUMN "recommended_max_months" INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "works" ADD COLUMN "recommended_age_label" VARCHAR(32)`);
    // Optional: migrate legacy values if column exists
    try {
      await queryRunner.query(`UPDATE "works" SET "recommended_min_months" = 36, "recommended_max_months" = 96 WHERE "recommended_age" IS NOT NULL`);
    } catch {}
    try {
      await queryRunner.query(`ALTER TABLE "works" DROP COLUMN "recommended_age"`);
    } catch {}
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_works_recommended_range" ON "works" ("recommended_min_months", "recommended_max_months")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_works_recommended_range"`);
    await queryRunner.query(`ALTER TABLE "works" DROP COLUMN "recommended_age_label"`);
    await queryRunner.query(`ALTER TABLE "works" DROP COLUMN "recommended_max_months"`);
    await queryRunner.query(`ALTER TABLE "works" DROP COLUMN "recommended_min_months"`);
    await queryRunner.query(`ALTER TABLE "works" ADD COLUMN "recommended_age" VARCHAR(16)`);
  }
}

