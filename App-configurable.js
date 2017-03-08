// server

// set up ======================================================================
// get all the tools we need

var express = require('express');
var app = express();
var Promise = require("bluebird");
var util = require('util');

var bodyParser = require('body-parser');
var session = require('express-session');

var yahooFinance = require('yahoo-finance');
var KnexSessionStore = require('connect-session-knex')(session);

// configuration 
var config = require("./config.json");

//database configuration
var knex = require("knex")(require("./knexfile"));

// hash the user's password 
var scryptForHumans = require("scrypt-for-humans");


var expressPromiseRouter = require("express-promise-router");

// set up our express application
app.use(express.static('static'));
app.locals.language = config.language;
app.set('views', './views');
app.set('view engine', 'pug');  // set up ejs for templating
app.use(bodyParser.urlencoded());

app.use(function(req, res, next ){
	res.locals.username = "wenbo"
	console.log('logger');
	next();
});


// Use the session middleware 
app.use(session({
    secret: "secret",
    resave: false,  // don't save session if unmodified
    saveUninitialized: false,  // don't create session until something stored
    store: new KnexSessionStore({
        knex: knex
    })
}));




app.get("/", (req, res) => {
    return Promise.try(() => {
        if (req.session.userId == null) {
			console.log("not logged in");
			res.render('home_page', { title: {english: 'Stock Prediction', chinese: '股票预测'}, stocks:config.stocks, user:null});
        } else {
            return Promise.try(() => {
                return knex("users").where({
                    userid: req.session.userId
                });
				
            }).then((users) => {
                if (users.length === 0) {
					console.log("User no longer exists");
                    /* User no longer exists */
                    req.session.destroy();
					res.render('home_page', { title: {english: 'Stock Prediction', chinese: '股票预测'}, stocks:config.stocks, user:null}); 
                } else {
					console.log("logged in");
					res.render('home_page', { title: {english: 'Stock Prediction', chinese: '股票预测'}, stocks:config.stocks, user:users[0]}); 
                }
            });
        }
    });
});


app.get('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
	req.session.destroy(function(){
		res.redirect('/');
	});
});


//log in page
app.get('/login', function (req, res) {
	res.render('login', { title: {english: 'Login', chinese: '登录'}}); 
});



// set properties on req.session, and you can then access those properties from other requests within 
// the same sessioN
app.post('/login', function(req, res){
	return Promise.try(() => {
		return knex('users').where({userid : req.body.username});
	}).then(function(users){
		if (users.length === 0) {
			console.log("No such username exists");
			throw new AuthenticationError("No such username exists");
		} else {
            let user = users[0];
			return Promise.try(() => {
				return scryptForHumans.verifyHash(req.body.password, user.password);	
			}).then(function(){
				/* Password was correct */
				console.log("Password was correct");
                req.session.userId = user.userid;
                res.redirect("/");
			}).catch(scryptForHumans.PasswordError, (err) => {
                throw new AuthenticationError("Invalid password");
            });
		}
	});
});

	



app.get('/logout', function(req, res){
	// destroy the user's session to log them out
	// will be re-created next request
	req.session.destroy(function(){
		res.redirect('/');
	});
});




// sign up page
app.get('/sign_up', function (req, res) {
	res.render('register', { title: {english: 'Registration', chinese: '注册'}}); 
}); 

// add a new user
app.post('/sign_up', function(req, res) {
	return Promise.try(function(){
		return scrypt.hash(req.body.password);
	}).then(function(hash){
		return knex('users').insert({email: req.body.email, password:hash, userid:req.body.userid});
	}).then(function(){
		res.redirect('/');
	});
});




// Get the data and statistics of a single stock
//app.get('/:symbol', function (req, res) {
//	return Promise.try( function() {
//		return yahooFinance.historical({
//			symbol: req.params.symbol,
//			from: '2012-01-01',
//			to: '2012-01-15',
//			period: 'd' 
//		});            
//	}).then(function(quotes){
//		res.render( 'home_page', { title: {english: 'Stock Prediction', chinese: '股票预测'},
//								 stocks:config.stocks, data:quotes, symbol:req.params.symbol}); 
//	});
//});



// Get the list of all the stocks
app.get('/stock_list', function(req, res) {
	return Promise.try(() => {
		return knex.select().from('symbols');
	}).then(function(entries){
		res.render('stocks_page', {title : {english: 'Stocks Lists', chinese: '股票列表'}, stocks : entries});
	});
});


// Delete a stock
app.post('/stock_list/delete/:symbol', function(req, res) {
	return Promise.try(() => {
		return knex('symbols').where('symbol', req.params.symbol).del()
	}).then(function(){
		res.redirect('/stock_list');
	});
});



// Edit a stock
app.get('/stock_list/edit/:symbol', function(req, res) {
	res.render('edit_stock', {title : {english: 'Edit Stocks', chinese: '更新股票'}, symbol:req.params.symbol});
});


app.post('/stock_list/edit/:symbol', function(req, res) {
	return Promise.try(() => {
		return knex('symbols').where('symbol', req.params.symbol).update({symbol: req.body.symbol, 
																		 name:req.body.name});
	}).then(function(){
		res.redirect('/stock_list');
	}).catch((err) => { 
		console.error("ERROR", err); 
	});
});



// Add a stock
app.get('/stock_list/add', function(req, res) {
	res.render('add_stock', {title : {english: 'Add New Stock Symbol', chinese: '添加股票'}});
});


app.post('/stock_list/add', function(req, res) {
	return Promise.try(() => {
		return knex('symbols').insert({symbol: req.body.symbol, name:req.body.name})
	}).then(function(){
		res.redirect('/stock_list');
	}).catch((err) => { 
		console.error("ERROR", err); 
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

module.exports = router;