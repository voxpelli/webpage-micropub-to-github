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

app.disable('x-powered-by');
app.set('env', config.env);

// Activate when on Heroku?
// app.enable('trust proxy');

//TODO: Make '/:targetsite' opt in – whether one wants to support multiple site targets or not should be optional – perhaps it shouldn't even at all be handled by this script but rather be defered to the handler somehow?
app.param('targetsite', function (req, res, next, id) {
  //TODO: Make configurable through DB or similar – perhaps expose a method? So that this route can be used DB-less as well
  if (id === 'thepost.se') {
    req.targetsite = {
      github: {
        user: 'voxpelli',
        repo: 'webpage-thepost-se',
        token: 'foo',
      },
      token: {
        me: 'http://kodfabrik.se/',
        endpoint: 'https://tokens.indieauth.com/token',
      },
    };
    next();
  } else {
    return res.sendStatus(404);
  }
});

app.use('/micropub/:targetsite', micropub({
  logger: logger,
  userAgent: config.userAgent,
  token: function (req) {
    return req.targetsite.token;
  },
}));

//TODO: Add a proper graceful shutdown mechanism here? Probably still needed in Express 4 – it probably needs to be
app.listen(config.port);

//TODO: Replace with Bunyan?
logger.info('Started and listens on ' + config.port);
