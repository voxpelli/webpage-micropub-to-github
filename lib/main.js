/* jshint node: true */

'use strict';

var express = require('express');
var logger = require('bunyan-duckling');

var config = require('./config');
// var handler = require('./handler');
var micropub = require('./micropub');
//
// var micropubDocument = {
//   'type': ['h-entry'],
//   'properties': {
//     'content': ['hello world'],
//     'category': ['foo', 'bar'],
//   },
// };
//
// handler(
//   {
//     token: config.github.token,
//     user: 'voxpelli',
//     repo: 'webpage-thepost-se',
//   },
//   micropubDocument
// );

var app = express();

app.enable('case sensitive routing');
app.disable('x-powered-by');
app.set('env', config.env);
app.set('query parser', 'simple');

// Activate when on Heroku?
// app.enable('trust proxy');

app.use('/micropub', micropub());

//TODO: Add a proper graceful shutdown mechanism here? Probably still needed in Express 4 – it probably needs to be
app.listen(config.port);

//TODO: Replace with Bunyan?
logger.info('Started and listens on ' + config.port);
