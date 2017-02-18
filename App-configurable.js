// and creating a page that lists all the symbols and lets you add/remove them

var express = require('express');
var app = express();
var config = require("./config.json");
var yahooFinance = require('yahoo-finance');
var util = require('util');

require('colors');
var Promise = require("bluebird");

var knex = require("knex")(require("./knexfile"));

app.locals.language = config.language;

app.set('views', './views');
app.set('view engine', 'pug');


app.use(function(req, res, next ){
	res.locals.username = "wenbo"
	console.log('logger');
	next();
});



app.get('/', function (req, res) {
	return Promise.try(() => {
    	return knex.table('symbols').first('symbol');
	}).then(function(SYMBOL) {
		return yahooFinance.historical({
			symbol: SYMBOL.symbol,
			from: '2012-01-01',
			to: '2012-01-15',
			period: 'd'              
		}).then(function(quotes){
			for (quote in quotes){
				knex(SYMBOL.symbol).insert(quotes[quote])
			}
			res.render( 'MainPage', { title: {english: 'Stock Prediction', chinese: '股票预测'}, stocks:config.stocks,
									 data:quotes}); 
		});
	});
});



app.get('/'+stock, function(req, res) {
	return Promise.try(() => {
		return yahooFinance.historical({
			symbol: stock,
			from: '2012-01-01',
			to: '2012-01-15',
			period: 'd'  
		});
	}).then(function(quotes){
			res.render( 'SymbolPage', { title: {english: 'APPL', chinese: '苹果公司'}, symbol:stock, 
									   name:>> , data:quotes}); 
	});
});


app.get('/users/:userId', function(req, res, next ){
	console.log('the response will be sent by the next function ...');
	next();
}, function(req,res){
	res.send("Hello from " + req.params.userId );
});


app.route('/algorithm')
	.get(function(req, res) {
		res.send('Get a random algorithm');
	})
	.post(function(req, res) {
        res.send('Add a algorithm');
	})
	.put(function(req, res) {
		res.send('Update the algorithm');
	});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});