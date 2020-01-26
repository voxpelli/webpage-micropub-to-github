'use strict';

const express = require('express');
const logger = require('bunyan-adaptor')();
const micropub = require('micropub-express');

const handler = require('./handler');

const config = require('./config');
const supportedSites = require('./sites');

const app = express();

app.disable('x-powered-by');
app.set('env', config.env);
app.set('port', config.port);
// Activate when on Heroku?
// app.enable('trust proxy');

if (config.host) {
  app.use((req, res, next) => {
    let portSuffix = (req.get('x-forwarded-port') || req.app.get('port')) + '';
    portSuffix = (portSuffix === '80' ? '' : ':' + portSuffix);
    if (req.hostname + portSuffix === config.host) { return next(); }
    res.redirect(307, req.protocol + '://' + config.host + req.url);
  });
}

app.param('targetsite', (req, res, next, id) => {
  if (supportedSites[id]) {
    req.targetsite = supportedSites[id];
    next();
  } else {
    res.sendStatus(404);
  }
});

app.use('/micropub/:targetsite', micropub({
  logger,
  userAgent: config.userAgent,
  tokenReference: req => (req.targetsite.token || []).concat(config.token),
  queryHandler: (q, req) => {
    if (q === 'config') {
      const config = {};

      if (req.targetsite.syndicateTo) { config['syndicate-to'] = req.targetsite.syndicateTo; }

      return config;
    } else if (q === 'syndicate-to') {
      return req.targetsite.syndicateTo ? { 'syndicate-to': req.targetsite.syndicateTo } : undefined;
    }
  },
  handler: (micropubDocument, req) => {
    logger.debug({ micropubDocument: JSON.stringify(micropubDocument, null, 2), date: Date().toString() }, 'Received a Micropub document');

    const options = Object.assign({}, config.handlerOptions, req.targetsite.options || {});

    return handler(
      Object.assign({}, config.github, req.targetsite.github),
      micropubDocument,
      req.targetsite.url,
      options
    ).then(function (url) {
      if (url) {
        return { url };
      }
    });
  }
}));

// TODO: Add a proper graceful shutdown mechanism here? Probably still needed in Express 4 – it probably needs to be
app.listen(config.port);

logger.info('Started and listens on ' + config.port);
