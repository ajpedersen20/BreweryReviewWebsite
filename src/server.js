/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
const { queryResult } = require('pg-promise');
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const axios = require('axios');
const qs = require('query-string');
const { response } = require('express');

//Create Database Connection
var pgp = require('pg-promise')();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.
		We'll be using `db` as this is the name of the postgres container in our
		docker-compose.yml file. Docker will translate this into the actual ip of the
		container for us (i.e. can't be access via the Internet).
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab,
		we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database. We set this in the
		docker-compose.yml for now, usually that'd be in a seperate file so you're not pushing your credentials to GitHub :).
**********************/
const dev_dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user:  process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD
};

/** If we're running in production mode (on heroku), the we use DATABASE_URL
* to connect to Heroku Postgres.
*/
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;
 
// Heroku Postgres patch for v10
// fixes: https://github.com/vitaly-t/pg-promise/issues/711
if (isProduction) {
  pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}

var db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

// Get and Post requests

// Home Page
app.get('/', function(req, res) {
	res.render('pages/main',{
		my_title:"Home Page",
		breweries: '',
		error: false,
		message: ''
	});
});

// Display Breweries
app.get('/home/search', function(req, res) {
	let city = req.query.search;
	city = city.replace(/ /g, '_');
	console.log('Searching in: \'' + city + '\'');
	if(city) {
	  	axios({
			url: `https://api.openbrewerydb.org/breweries?by_city=${city}`,
			method: 'GET',
			dataType:'json',
		})
		.then(items => {
			res.render('pages/main', {
			  my_title: "Home Page",
			  breweries: items.data,
			  error: false,
			  message: ''
			});
		})
		.catch(error => {
			console.log(error);
			res.render('pages/main',{
			  my_title: "Home Page",
			  breweries: '',
			  error: true,
			  message: error
			})
		});
	}
	else {
	  res.render('pages/main', {
		my_title: "Home Page",
		breweries: '',
		error: true,
		message: 'Please enter a city name'
	  });
	}
});

// Reviews Page
app.get('/reviews', function(req, res) {
	const get_reviews_statement = `SELECT * FROM reviews;`;
	db.task('get-everything', task => {
        return task.batch([
            task.any(get_reviews_statement)
        ]);
    })
    .then(info => {
    	res.render('pages/reviews',{
			my_title: "Reviews Page",
			breweries: info[0]
		})
    })
    .catch(err => {
		console.log('error', err);
		res.render('pages/reviews', {
			my_title: 'Reviews Page',
			breweries: ''
		})
    });
});

// Add review + redirect to reviews page
app.post('/reviews/add', function(req, res) {
	const brewery_name = req.body.breweryName;
	const review = req.body.reviewBody;
	const date = new Date();
	console.log('Adding review of ' + brewery_name + ' at ' + date);
	let insert_statement = `INSERT INTO reviews(brewery_name, review, review_date) VALUES('${brewery_name}', '${review}', '${date}');`;
	const get_reviews_statement = `SELECT * FROM reviews;`;
	db.task('get-everything', task => {
        return task.batch([
            task.any(insert_statement),
            task.any(get_reviews_statement)
        ]);
    })
    .then(info => {
		// response.status(200).send({result: info[1]});
    	res.render('pages/reviews',{
			my_title: "Reviews Page",
			breweries: info[1]
		})
    })
    .catch(err => {
		console.log('error', err);
		res.render('pages/reviews', {
			my_title: 'Reviews Page',
			breweries: ''
		})
    });
});

// Filter Reviews
app.post('/reviews/filter', function(req, res) {
	const name = req.body.filter;
	let get_filtered_reviews = `SELECT * FROM reviews WHERE brewery_name='${name}';`;
	const get_reviews = `SELECT * FROM reviews;`;
	db.task('get-everything', task => {
        return task.batch([
            task.any(get_filtered_reviews),
			task.any(get_reviews)
        ]);
    })
    .then(info => {
		let reviews = info[0];
		if(reviews.length == 0)
			reviews = info[1];
		// response.status(200).send({result: info[0][0].name});
    	res.render('pages/reviews',{
			my_title: "Reviews Page",
			breweries: reviews
		})
    })
    .catch(err => {
		console.log('error', err);
		res.render('pages/reviews', {
			my_title: 'Reviews Page',
			breweries: ''
		})
    });
});

// module.exports = app.listen(3000);
// app.listen(3000);
// console.log('3000 is the magic port');

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});