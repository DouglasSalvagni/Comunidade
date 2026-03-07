import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoverThumbUrlToWorks1764900000000 implements MigrationInterface {
  name = 'AddCoverThumbUrlToWorks1764900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "works" ADD COLUMN "cover_thumb_url" TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "works" DROP COLUMN "cover_thumb_url"`);
  }
}

