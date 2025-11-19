import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthProvider1732200000000 implements MigrationInterface {
  name = 'AuthProvider1732200000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "auth_provider" varchar(50) NOT NULL DEFAULT 'local'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "auth_provider"`);
  }
}