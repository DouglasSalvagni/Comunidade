import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddAttachmentIdToLessonKnowledge1783000000003 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'lesson_knowledge',
            new TableColumn({
                name: 'attachment_id',
                type: 'uuid',
                isNullable: true,
            })
        );

        await queryRunner.createForeignKey(
            'lesson_knowledge',
            new TableForeignKey({
                columnNames: ['attachment_id'],
                referencedTableName: 'lesson_attachments',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('lesson_knowledge');
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('attachment_id') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('lesson_knowledge', foreignKey);
        }
        await queryRunner.dropColumn('lesson_knowledge', 'attachment_id');
    }

}