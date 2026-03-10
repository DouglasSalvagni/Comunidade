import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddLessonAttachments1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lesson_attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'aula_id', type: 'uuid', isNullable: false },
          { name: 'nome', type: 'varchar', isNullable: false },
          { name: 'file_key', type: 'varchar', isNullable: false },
          { name: 'file_name', type: 'varchar', isNullable: false },
          { name: 'content_type', type: 'varchar', default: "'application/octet-stream'" },
          { name: 'tamanho_bytes', type: 'int', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'lesson_attachments',
      new TableForeignKey({
        columnNames: ['aula_id'],
        referencedTableName: 'lessons',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('lesson_attachments', true, true, true);
  }
}
