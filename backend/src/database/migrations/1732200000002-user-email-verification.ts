import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEmailVerification1732200000002 implements MigrationInterface {
  name = 'UserEmailVerification1732200000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "email_verification_token_hash" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "email_verification_expires_at" TIMESTAMP NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_expires_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_token_hash"`);
  }
}