import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("stack_github", (table) => {
        table.increments("id");
        table.string("stack_name", 255).notNullable().unique();
        table.string("repo_url", 512).notNullable();
        table.string("pat", 512).nullable();
        table.string("branch", 255).notNullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("stack_github");
}
