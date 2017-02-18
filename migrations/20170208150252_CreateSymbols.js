
exports.up = function(knex, Promise) {
	return Promise.all([
		knex("symbols").insert({id : 2, symbol : "SINA", name : "SINA Corporation"}),
		knex("symbols").insert({id : 3, symbol : "GE", name : "General Electric Company"}),
		knex("symbols").insert({id : 4, symbol : "GOOG", name : "Alphabet Inc."})
	]);
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex("symbols").where('id', 2).del(),
		knex("symbols").where('id', 3).del(),
		knex("symbols").where('id', 4).del(),
	]);
};
