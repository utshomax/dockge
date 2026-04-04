import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable("stack_github", (table) => {
        table.string("compose_path", 512).nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable("stack_github", (table) => {
        table.dropColumn("compose_path");
    });
}
