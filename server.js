
/*!
 * Tabloro
 * Copyright(c) 2014 Franky T
 * 
 */
/**
 * Module dependencies
 */

var log = console.log;

log(process.env.NODE_ENV);
var fs = require('fs');
var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport');
var config = require('config');
var R = require('ramda');
var EurecaServer = require('eureca.io').EurecaServer;



var app = express();
var port = process.env.PORT || 3000;
var server = require('http').createServer(app);


var eurecaServer = new EurecaServer({
  allow: [ // Network client methods
    'setId', 'spawnPlayer', 'kill', 'updateCursor',
    'positionTile', 'dropTile', 'dragTiles', 'flipTile', 'toHand', 'fromHand', 'lock', 'unlock', 'ownedBy', 'releasedBy',
    'updateStackCards', 'flipStack',
    'spin',
    'receiveChat', 'arrangeLayer'
  ]
});

log('attach eurecaServer', eurecaServer.version);
// attach eureca.io to our http server
eurecaServer.attach(server);



// Connect to mongodb
// var connect = function () {
//   var options = { server: { socketOptions: { keepAlive: 1 } } };
//   mongoose.connect(config.db, options);
// };
// connect();
const mongooseOptions = {
  server: {
    socketOptions: {
      keepAlive: 1
    }
  },
  autoIndex: false, // Don't build indexes
  reconnectTries: 30, // Retry up to 30 times
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0
}
const connectWithRetry = () => {
  console.log('MongoDB connection with retry')
  mongoose.connect(config.db, mongooseOptions).then(()=>{
    console.log('MongoDB is connected')
  }).catch(err=>{
    console.log('MongoDB connection unsuccessful, retry after 5 seconds.')
    setTimeout(connectWithRetry, 5000)
  })
}
connectWithRetry()

mongoose.connection.on('error', log);
mongoose.connection.on('disconnected', connectWithRetry);

// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file);
});

// Bootstrap passport config
require('./config/passport')(passport, config);

// Bootstrap application settings
require('./config/express')(app, passport, eurecaServer);

// Bootstrap routes
require('./config/routes')(app, passport);

// Eureca Server config
require('eurecaserver')(eurecaServer);

server.listen(port);
log('Express app started on port ' + port);

/**
 * Expose
 */

module.exports = app;
