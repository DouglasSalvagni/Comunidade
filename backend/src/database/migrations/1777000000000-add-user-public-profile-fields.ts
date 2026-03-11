import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPublicProfileFields1777000000000 implements MigrationInterface {
  name = 'AddUserPublicProfileFields1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_links" jsonb`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_key" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_key"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_links"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "bio"`);
  }
}
