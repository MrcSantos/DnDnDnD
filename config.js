require('dotenv').config()
const express = require('express');
const path = require('path');
const logger = require('morgan');
const uuid = require('uuid').v4;

const app = express();

//--------------------------------------------------//--------------------------------------------------// Server options and misc

const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layout')
app.use(expressLayouts)

app.use(logger('dev'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static(path.join(__dirname, 'public')));

//--------------------------------------------------//--------------------------------------------------// Database

const MongoClient = require('mongodb').MongoClient;
const ADMIN_DB_URI = process.env.ADMIN_DB_URI;
const USER_DB_URI = process.env.USER_DB_URI;
const admin_client = new MongoClient(ADMIN_DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const user_client = new MongoClient(USER_DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//--------------------------------------------------//--------------------------------------------------// Session settings

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const store = new MongoDBStore({
	uri: ADMIN_DB_URI,
	databaseName: 'manager',
	collection: 'sessions',
	connectionOptions: { useNewUrlParser: true, useUnifiedTopology: true }
});

// Catch errors
store.on('error', function (error) {
	console.log(error);
});

const SECRET = process.env.SECRET;
const COOKIE_NAME = 'Grooming archive';

app.use(session({
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 5 // For 5 days
	},
	name: COOKIE_NAME,
	genid: () => { return uuid() },
	store: store,
	secret: SECRET,
	resave: false,
	saveUninitialized: false
}));

//--------------------------------------------------//--------------------------------------------------// Passport setup

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const auth_messages = {
	ERROR: '-1',
	OK: '0',
	USER: '1',
	PASS: '2',
	PENDING: '3'
}

passport.use(new LocalStrategy({ usernameField: 'name', passwordField: 'pass' }, (name, pass, done) => {
	admin_client.connect(err => {
		if (err) { return done(err, false, { message: auth_messages.ERROR }) }

		const users = admin_client.db("manager").collection("users");
		users.findOne({ $or: [{ name: name }, { email: name }] }, (err, user) => {
			if (err) { return done(err, false, { message: auth_messages.ERROR }) }

			if (!user) { return done(null, false, { message: auth_messages.USER }) }

			if (user.pending) { return done(null, false, { message: auth_messages.PENDING }) }
			if (user.pass !== pass) { return done(null, false, { message: auth_messages.PASS }) }

			return done(null, user)
		})
	})
}));

// passport serialize and deserialize
passport.serializeUser((user, done) => {
	done(null, user._id)
})

passport.deserializeUser((id, done) => {
	admin_client.connect(err => {
		if (err) { done(err) }

		const users = admin_client.db("manager").collection("users");
		users.findOne({ _id: id }, (err, user) => {
			if (err) { done(err) }

			done(null, user)
		})
	})
})

app.use(passport.initialize());
app.use(passport.session());

//--------------------------------------------------//--------------------------------------------------// Config esports

module.exports = {
	admin_client: admin_client,
	user_client: user_client,
	auth_messages: auth_messages,
	app: app
}
