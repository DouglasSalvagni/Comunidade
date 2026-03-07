import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrackHlsFields1731700000000 implements MigrationInterface {
  name = 'AddTrackHlsFields1731700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tracks" ADD COLUMN "original_object_key" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "tracks" ADD COLUMN "hls_master_key" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "tracks" ADD COLUMN "hls_base_path" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "tracks" ADD COLUMN "bitrate_variants" text[] NULL`);
    await queryRunner.query(`ALTER TABLE "tracks" ADD COLUMN "encryption_key_id" varchar NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tracks" DROP COLUMN "encryption_key_id"`);
    await queryRunner.query(`ALTER TABLE "tracks" DROP COLUMN "bitrate_variants"`);
    await queryRunner.query(`ALTER TABLE "tracks" DROP COLUMN "hls_base_path"`);
    await queryRunner.query(`ALTER TABLE "tracks" DROP COLUMN "hls_master_key"`);
    await queryRunner.query(`ALTER TABLE "tracks" DROP COLUMN "original_object_key"`);
  }
}

