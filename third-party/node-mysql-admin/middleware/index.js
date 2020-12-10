var express = require('express');
var bodyParser = require('body-parser');
var sock = require('socket.io');
var fs = require('fs');
var randomstring = require('randomstring')

// *** myadmin Routers ***
var auth = require('./auth/authroutes.js');
var database = require('./database/databaseroutes.js');
var settings = require('./settings/settingsroutes.js');
var system = require('./system/systemroutes.js');
var home = require('./home/homeroutes.js');

module.exports = function myadmin(router, server, app, ioPath) {
  'use strict';

  // ** Socket Connection
  var io = sock(server).path(ioPath);

  // ** Socket Controller
  require('./sockets/socketcontroller.js')(io);

  router(bodyParser.json());
  router(bodyParser.urlencoded({extended: true}));
  router(express.static(__dirname + '/public'));
  // creates secret.js with a random string if it hasn't been initialized\\
  fs.readFile('./secret.js', function(err, data) {
    if (err.code === 'ENOENT') {
      var randomString = randomstring.generate();
      var contents = "module.exports = '" + randomString + "';";
      fs.writeFileSync(__dirname + '/secret.js', contents);
    }
    var secret = require('./secret.js');
    app.locals.secret = secret;
  });
  
  // ** Routes
  router('/api/auth', auth);
  router('/api/db', database);
  router('/api/settings',settings);
  router('/api/system',system);
  router('/api/home',home);
};
