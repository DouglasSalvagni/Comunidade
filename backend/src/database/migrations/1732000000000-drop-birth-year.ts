import { MigrationInterface, QueryRunner } from "typeorm";

export class DropBirthYear1732000000000 implements MigrationInterface {
  name = 'DropBirthYear1732000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "birth_year"`);
    } catch {}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" ADD COLUMN "birth_year" INT NULL`);
  }
}
