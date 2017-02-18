// lates -> rollback -> latest does not work??
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.createTable("symbols", function(table) {
			table.increments("id").primary();
			table.string("symbol", 16);
			table.string("name", 64);
		}),
		
		knex.schema.createTable("AAPL", function(table){
			table.dateTime("date").primary();
			table.float("open");
			table.float("high");
			table.float("low");
			table.float("close");
			table.integer("volume");
			table.float("adjClose");
			table.string("symbol", 16);
		})
	]).then (function(){
		return knex("symbols").insert({id : 1, symbol : "AAPL", name : "Apple Inc."});
	});
};



exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.dropTable("symbols"),
		knex.schema.dropTable("AAPL")
	]);
};
