import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAuditLogs1767000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'method', type: 'varchar', length: '10', isNullable: false },
          { name: 'path', type: 'text', isNullable: false },
          { name: 'status_code', type: 'int', isNullable: false },
          { name: 'ip', type: 'varchar', length: '64', isNullable: true },
          { name: 'user_agent', type: 'varchar', length: '200', isNullable: true },
          { name: 'request_id', type: 'varchar', length: '100', isNullable: true },
          { name: 'controller', type: 'varchar', length: '100', isNullable: true },
          { name: 'handler', type: 'varchar', length: '100', isNullable: true },
          { name: 'duration_ms', type: 'int', isNullable: true },
          { name: 'error_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_user_id_created_at" ON "audit_logs" ("user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_path_created_at" ON "audit_logs" ("path", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs', true);
  }
}

