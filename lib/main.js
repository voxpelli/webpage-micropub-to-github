/* jshint node: true */

'use strict';

var express = require('express');
var logger = require('bunyan-duckling');
var micropub = require('micropub-express');

var handler = require('./handler');

var config = require('./config');
var supportedSites = require('./sites');

var app = express();

app.disable('x-powered-by');
app.set('env', config.env);
// Activate when on Heroku?
// app.enable('trust proxy');

app.param('targetsite', function (req, res, next, id) {
  if (supportedSites[id]) {
    req.targetsite = supportedSites[id];
    next();
  } else {
    res.sendStatus(404);
  }
});

app.use('/micropub/:targetsite', micropub({
  logger: logger,
  userAgent: config.userAgent,
  token: function (req) {
    return req.targetsite.token;
  },
  handler: function (micropubDocument, req) {
    logger.debug({ micropubDocument: micropubDocument }, 'Received a Micropub document');

    return handler(
      req.targetsite.github,
      micropubDocument,
      req.targetsite.url
    ).then(function (url) {
      if (url) {
        return { url: url };
      }
    });
  }
}));

//TODO: Add a proper graceful shutdown mechanism here? Probably still needed in Express 4 – it probably needs to be
app.listen(config.port);

logger.info('Started and listens on ' + config.port);
