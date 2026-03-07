import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfilesBirthDate1731900000000 implements MigrationInterface {
  name = 'ProfilesBirthDate1731900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN "birth_date" DATE NULL`);
    try {
      await queryRunner.query(`UPDATE "profiles" SET "birth_date" = to_date(concat("birth_year", '-01-01'), 'YYYY-MM-DD') WHERE "birth_year" IS NOT NULL AND "birth_date" IS NULL`);
    } catch {}
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_profiles_birth_date" ON "profiles" ("birth_date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_profiles_birth_date"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "birth_date"`);
  }
}
