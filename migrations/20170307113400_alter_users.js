exports.up = function(knex, Promise) {
	return knex.schema.table('users', function (table) {
		table.string("userid", 255);
	})
};


exports.down = function(knex, Promise) {
	return knex.schema.table('users', function (table) {
		table.dropColumn("userid");
	})
};
