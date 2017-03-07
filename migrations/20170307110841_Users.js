exports.up = function(knex, Promise) {
	return knex.schema.createTable("users", function(table) {
		table.string("email", 64).primary();
		table.string("password", 1024);
	})
};



exports.down = function(knex, Promise) {
	return knex.schema.dropTable("users");
};
