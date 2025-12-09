import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArtistNameToWorks1764800000000 implements MigrationInterface {
  name = 'AddArtistNameToWorks1764800000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "works" ADD COLUMN "artist_name" VARCHAR(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "works" DROP COLUMN "artist_name"`);
  }
}

