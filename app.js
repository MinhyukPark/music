global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
require('dotenv').config({path: '/home/min/git_repos/music/.env'});
var Spotify = require('spotify-web-api-js'); 
var express = require('express');
var  session = require('express-session');
var  passport = require('passport');
var  swig = require('swig');
var  SpotifyStrategy = require('passport-spotify').Strategy;
var consolidate = require('consolidate');

var accessToken_g = null;
var appKey = process.env.APPKEY;
var appSecret = process.env.APPSECRET;

/* passport */
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});
passport.use(
  new SpotifyStrategy(
    {
      clientID: appKey,
      clientSecret: appSecret,
      callbackURL: 'https://musictude.minhyukpark.com/callback'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      process.nextTick(function() {
	    accessToken_g = accessToken;
        return done(null, profile);
      });
    }
  )
);

/* express */
var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
app.engine('html', consolidate.swig);

app.get('/', function(req, res) {
  res.render('index.html', { user: req.user , accessToken: accessToken_g });
});
app.get('/host', function(req, res) {
  res.render('host.html', { user: req.user , accessToken: accessToken_g });
});
app.get('/client', function(req, res) {
  res.render('client.html', {accessToken: accessToken_g});
});
app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account.html', { user: req.user });
});
app.get('/login', function(req, res) {
  res.render('login.html', { user: req.user });
});
app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private', 'app-remote-control', 'user-read-playback-state', 'user-modify-playback-state'],
    showDialog: true
  }), function(req, res) { }
);
app.get(
  '/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/host');
  }
);
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});
app.listen(8769);

/* auth check */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}
