import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfilesBirthYear1731800000000 implements MigrationInterface {
  name = 'ProfilesBirthYear1731800000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN "birth_year" INT NULL`);
    try {
      await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "age_range"`);
    } catch {}
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_profiles_birth_year" ON "profiles" ("birth_year")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_profiles_birth_year"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "birth_year"`);
    await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN "age_range" VARCHAR(16) NULL`);
  }
}
