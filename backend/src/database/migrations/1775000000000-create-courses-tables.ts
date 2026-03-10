import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateCoursesTables1775000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. courses
    await queryRunner.createTable(
      new Table({
        name: 'courses',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'titulo', type: 'varchar', isNullable: false },
          { name: 'descricao', type: 'text', isNullable: true },
          { name: 'thumbnail_url', type: 'varchar', isNullable: true },
          { name: 'status', type: 'varchar', default: "'rascunho'" },
          { name: 'criador_id', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'courses',
      new TableForeignKey({
        columnNames: ['criador_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // 2. course_modules
    await queryRunner.createTable(
      new Table({
        name: 'course_modules',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'curso_id', type: 'uuid', isNullable: false },
          { name: 'titulo', type: 'varchar', isNullable: false },
          { name: 'ordem', type: 'int', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'course_modules',
      new TableForeignKey({
        columnNames: ['curso_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'course_modules',
      new TableIndex({ columnNames: ['curso_id', 'ordem'] }),
    );

    // 3. lessons
    await queryRunner.createTable(
      new Table({
        name: 'lessons',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'modulo_id', type: 'uuid', isNullable: false },
          { name: 'titulo', type: 'varchar', isNullable: false },
          { name: 'conteudo_texto', type: 'text', isNullable: true },
          { name: 'video_key', type: 'varchar', isNullable: true },
          { name: 'duracao_segundos', type: 'int', default: 0 },
          { name: 'ordem', type: 'int', default: 0 },
          { name: 'status', type: 'varchar', default: "'pendente'" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'lessons',
      new TableForeignKey({
        columnNames: ['modulo_id'],
        referencedTableName: 'course_modules',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'lessons',
      new TableIndex({ columnNames: ['modulo_id', 'ordem'] }),
    );

    // 4. lesson_progress
    await queryRunner.createTable(
      new Table({
        name: 'lesson_progress',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'usuario_id', type: 'uuid', isNullable: false },
          { name: 'aula_id', type: 'uuid', isNullable: false },
          { name: 'concluida', type: 'boolean', default: false },
          { name: 'tempo_assistido', type: 'int', default: 0 },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'lesson_progress',
      new TableForeignKey({
        columnNames: ['usuario_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'lesson_progress',
      new TableForeignKey({
        columnNames: ['aula_id'],
        referencedTableName: 'lessons',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'lesson_progress',
      new TableUnique({ columnNames: ['usuario_id', 'aula_id'] }),
    );

    // 5. course_plan_access
    await queryRunner.createTable(
      new Table({
        name: 'course_plan_access',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'curso_id', type: 'uuid', isNullable: false },
          { name: 'plan_id', type: 'uuid', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'course_plan_access',
      new TableForeignKey({
        columnNames: ['curso_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'course_plan_access',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'course_plan_access',
      new TableUnique({ columnNames: ['curso_id', 'plan_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('course_plan_access', true, true, true);
    await queryRunner.dropTable('lesson_progress', true, true, true);
    await queryRunner.dropTable('lessons', true, true, true);
    await queryRunner.dropTable('course_modules', true, true, true);
    await queryRunner.dropTable('courses', true, true, true);
  }
}
