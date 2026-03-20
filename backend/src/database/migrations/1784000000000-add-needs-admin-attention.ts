import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNeedsAdminAttention1784000000000 implements MigrationInterface {
  name = 'AddNeedsAdminAttention1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "community_posts" ADD "needs_admin_attention" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "community_posts" DROP COLUMN "needs_admin_attention"`,
    );
  }
}
