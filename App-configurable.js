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
var scrypt = require("scrypt-for-humans");

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
	resave: false, // don't save session if unmodified
	saveUninitialized: false, // don't create session until something stored
	secret: 'shhhh, very secret',
	cookie: {maxAge: 60},//
}));



// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)




// Authenticate using our plain-object database of doom!
var theHash;
function authenticate(name, password, fn) {
	if (!module.parent) console.log('authenticating %s:%s', name, password); 
	
	// query the db for the given username
	var user;
	return Promise.try(() => {
		return knex('users').where('userid', name).select('*');
	}).then(function(User){
		console.log(User[0]);
		user = User[0];
	});
	

	if (!user) return fn(new Error('cannot find user'));
	// if there is a match of the password we found the user
	
	Promise.try(function(){
		return scrypt.hash(password);
	}).then(function(hash){
		console.log(user);
		return scrypt.verifyHash(password, user.password);	
	}).then(function(){
		return fn(null, user);
	}).catch(scrypt.PasswordError, function(err){
		fn(new Error('invalid password'));
	});
}


//To limit access to certain pages add a simple middleware to those routes
function restrict(req, res, next) {
	if (req.session.user) {
		next();
	} else {
		req.session.error = 'Access denied!';
		res.redirect('/login');
	}
}


app.get('/', function(req, res, next) {
	res.render('home_page', { title: {english: 'Stock Prediction', chinese: '股票预测'},
									 stocks:config.stocks}); 
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


app.post('/login', function(req, res){
	authenticate(req.body.username, req.body.password, function(err, user){
		if (user) {
			// Regenerate session when signing in to prevent fixation
			req.session.regenerate(function(){
				// Store the user's primary key in the session store to be retrieved,
				// or in this case the entire user object
				req.session.user = user;
				req.session.success = 'Authenticated as ' + user.name
					+ ' click to <a href="/logout">logout</a>. '
					+ ' You may now access <a href="/restricted">/restricted</a>.';
				res.redirect('back');
			});
			console.log("success");
		} else {
			req.session.error = 'Authentication failed, please check your '
				+ ' username and password.'
				+ ' (use "tj" and "foobar")';
			res.redirect('/');
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
	}).catch((err) => { 
		console.error("ERROR", err); 
	});
});




// Get the data and statistics of a single stock
app.get('/:symbol', function (req, res) {
	return Promise.try( function() {
		return yahooFinance.historical({
			symbol: req.params.symbol,
			from: '2012-01-01',
			to: '2012-01-15',
			period: 'd' 
		});            
	}).then(function(quotes){
		res.render( 'home_page', { title: {english: 'Stock Prediction', chinese: '股票预测'},
								 stocks:config.stocks, data:quotes, symbol:req.params.symbol}); 
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

