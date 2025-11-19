import { MigrationInterface, QueryRunner } from "typeorm";

export class UserResetFields1732200000001 implements MigrationInterface {
  name = 'UserResetFields1732200000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "password_reset_token_hash" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "password_reset_expires_at" TIMESTAMP NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_expires_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token_hash"`);
  }
}