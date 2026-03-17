import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEditedAtToCommunity1779000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'community_posts',
      new TableColumn({
        name: 'edited_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'community_comments',
      new TableColumn({
        name: 'edited_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('community_comments', 'edited_at');
    await queryRunner.dropColumn('community_posts', 'edited_at');
  }
}
