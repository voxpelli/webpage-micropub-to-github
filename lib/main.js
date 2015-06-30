/* jshint node: true */

'use strict';

var express = require('express');
var logger = require('bunyan-duckling');
var micropub = require('micropub-express');

var config = require('./config');
var handler = require('./handler');

var supportedSites = {
  'thepost.se': {
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
  },
  'voxpelli.com': {
    url: 'http://voxpelli.com/',
    github: {
      user: 'voxpelli',
      repo: 'voxpelli.github.com',
      token: config.github.token,
    },
    token: {
      me: 'http://kodfabrik.se/',
      endpoint: 'https://tokens.indieauth.com/token',
    },
  },
};

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
