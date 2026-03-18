import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class DropCommunitySpaceCourseAccess1780000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('community_space_course_access');
    if (!hasTable) {
      return;
    }

    await queryRunner.dropTable('community_space_course_access', true, true, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('community_space_course_access');
    if (hasTable) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'community_space_course_access',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'space_id', type: 'uuid', isNullable: false },
          { name: 'course_id', type: 'uuid', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'community_space_course_access',
      new TableForeignKey({
        columnNames: ['space_id'],
        referencedTableName: 'community_spaces',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'community_space_course_access',
      new TableForeignKey({
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'community_space_course_access',
      new TableUnique({ columnNames: ['space_id', 'course_id'] }),
    );
  }
}
