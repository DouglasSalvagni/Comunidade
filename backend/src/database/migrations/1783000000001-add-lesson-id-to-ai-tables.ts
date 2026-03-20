import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddLessonIdToAiTables1783000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover a constraint unique antiga do chat_summaries que limitava apenas a user e course
    await queryRunner.dropUniqueConstraint('chat_summaries', 'UQ_chat_summaries_user_course');

    // 2. Adicionar lesson_id na tabela chat_messages
    await queryRunner.addColumn(
      'chat_messages',
      new TableColumn({
        name: 'lesson_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'chat_messages',
      new TableForeignKey({
        columnNames: ['lesson_id'],
        referencedTableName: 'lessons',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // 3. Adicionar lesson_id na tabela chat_summaries
    await queryRunner.addColumn(
      'chat_summaries',
      new TableColumn({
        name: 'lesson_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'chat_summaries',
      new TableForeignKey({
        columnNames: ['lesson_id'],
        referencedTableName: 'lessons',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const chatSummariesTable = await queryRunner.getTable('chat_summaries');
    if (chatSummariesTable) {
        const csFk = chatSummariesTable.foreignKeys.find(fk => fk.columnNames.indexOf('lesson_id') !== -1);
        if (csFk) await queryRunner.dropForeignKey('chat_summaries', csFk);
    }
    await queryRunner.dropColumn('chat_summaries', 'lesson_id');

    const chatMessagesTable = await queryRunner.getTable('chat_messages');
    if (chatMessagesTable) {
        const cmFk = chatMessagesTable.foreignKeys.find(fk => fk.columnNames.indexOf('lesson_id') !== -1);
        if (cmFk) await queryRunner.dropForeignKey('chat_messages', cmFk);
    }
    await queryRunner.dropColumn('chat_messages', 'lesson_id');

    // Retorna a constraint antiga no rollback
    await queryRunner.query(
      `ALTER TABLE "chat_summaries" ADD CONSTRAINT "UQ_chat_summaries_user_course" UNIQUE ("user_id", "course_id")`
    );
  }
}
