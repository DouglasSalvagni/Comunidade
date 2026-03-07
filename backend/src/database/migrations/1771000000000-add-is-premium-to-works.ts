import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsPremiumToWorks1771000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'works',
            new TableColumn({
                name: 'is_premium',
                type: 'boolean',
                default: false,
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('works', 'is_premium');
    }
}
