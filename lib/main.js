/* jshint node: true */

'use strict';

var express = require('express');
var logger = require('bunyan-duckling');

var config = require('./config');
var handler = require('./handler');
var micropub = require('./micropub');

var app = express();

app.disable('x-powered-by');
app.set('env', config.env);
// Activate when on Heroku?
// app.enable('trust proxy');

app.param('targetsite', function (req, res, next, id) {
  //TODO: Make configurable through DB or similar – perhaps expose a method? So that this route can be used DB-less as well
  if (id === 'thepost.se') {
    req.targetsite = {
      url: 'http://thepost.se/',
      github: {
        user: 'voxpelli',
        repo: 'webpage-thepost-se',
        token: config.github.token,
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
