import { MigrationInterface, QueryRunner } from "typeorm";

export class DropFavoritesUniqueUserWork1732100000002 implements MigrationInterface {
  name = 'DropFavoritesUniqueUserWork1732100000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "favorites_user_id_work_id_key"`);
    } catch {}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_work_id_key" UNIQUE ("user_id", "work_id")`);
    } catch {}
  }
}