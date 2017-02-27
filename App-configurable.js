// and creating a page that lists all the symbols and lets you add/remove them

var express = require('express');
var app = express();
var config = require("./config.json");
var yahooFinance = require('yahoo-finance');
var util = require('util');
var bodyParser = require('body-parser');

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

app.use(bodyParser.urlencoded()) 

app.get('/', function (req, res) {
	return Promise.try(() => {
		return knex.table('symbols').first('symbol');
	}).then(function(SYMBOL) {
		return Promise.try( function() {
			return yahooFinance.historical({
				symbol: SYMBOL.symbol,
				from: '2012-01-01',
				to: '2012-01-15',
				period: 'd' 
			});            
		}).then(function(quotes){
//			for (quote in quotes){
//				knex(SYMBOL.symbol).insert(quotes[quote])
//			}
			res.render( 'home_page', { title: {english: 'Stock Prediction', chinese: '股票预测'},
									 stocks:config.stocks,data:quotes}); 
		});
	});
});


// Get the list of all the stocks
app.get('/stock_list', function(req, res) {
	return Promise.try(() => {
		return knex.select().from('symbols')
	}).then(function(entries){
		res.render('stocks_page', {title : {english: 'Stocks Lists', chinese: '股票列表'}, stocks : entries});
	});
});



// Delete a stock
app.get('/stock_list/delete/:symbol', function(req, res) {
	return Promise.try(() => {
		return knex('symbols').where('symbol', req.params.symbol).del()
	}).then(function(entries){
		res.redirect('/stock_list');
	});
});



// Add a stock
app.get('/stock_list/add', function(req, res) {
	res.render('add_stock', {title : {english: 'Add Stocks', chinese: '添加股票'}});
});


app.post('/stock_list/add', function(req, res) {
	return Promise.try(() => {
		knex('symbols').insert({symbol: req.body.symbol, name:req.body.name})
	}).then(function(entries){
		res.redirect('/stock_list');
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