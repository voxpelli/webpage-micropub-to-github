/* jshint node: true */

'use strict';

var qs = require('querystring');

var express = require('express');
var bodyParser = require('body-parser');

var fetch = require('node-fetch');

var normalizeUrl = function (url) {
  if (url.substr(-1) !== '/') {
    url += '/';
  }
  return url;
};

module.exports = function (options) {
  options = options || {};

  var logger = options.logger || require('bunyan-duckling');

  // Helper functions

  var validateToken = function (token, me, endpoint) {
    if (!token) {
      return Promise.resolve(false);
    }

    var fetchOptions = {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': options.userAgent,
        },
      };

    console.log(endpoint, fetchOptions);

    return fetch(endpoint, fetchOptions)
      .then(function (response) {
        return response.text();
      }).then(function (body) {
        return qs.parse(body);
      }).then(function (result) {
        if (!result.me || !result.scope) {
          logger.debug({
            result: result,
          }, 'Invalid IndieAuth response');

          return false;
        }

        if (normalizeUrl(result.me) !== normalizeUrl(me)) {
          return false;
        }

        var scopes = result.scope.split(',');
        if (scopes.indexOf('post') === -1) {
          return false;
        }

        return true;
      });
  };

  // Router setup

  var router = express.Router({
    caseSensitive: true,
  });

  //TODO: Access the req.app.locals.logger for logging – when available that is

  router.use(bodyParser.urlencoded({ extended: false }));

  router.param('targetsite', function (req, res, next, id) {
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

  // Ensure the needed parts are there
  router.use('/:targetsite', function (req, res, next) {
    if (!req.headers.authorization && !req.body.access_token) {
      return res.status(401).set('Content-Type', 'text/plain').send('Missing "Authorization" header or body parameter.');
    } else if (!req.body.h) {
      return res.status(400).set('Content-Type', 'text/plain').send('Missing "h" value.');
    }

    var token;

    if (req.headers.authorization) {
      token = req.headers.authorization.trim().split(/\s+/)[1];
    }
    if (!token && req.body.access_token) {
      token = req.body.access_token;
    }

    console.log('TOOOOKEN!', token);

    validateToken(token, req.targetsite.token.me, req.targetsite.token.endpoint)
      .then(function (valid) {
        if (!valid) {
          return res.sendStatus(403);
        }
        next();
      })
      .catch(function (err) {
        console.log('Error!', err, err.stack);
        next(err);
      });
  });

  router.post('/:targetsite', function (req, res) {
    //TODO: Validate the existance of a content param
    res.status(201).send('Hi!');
  });

  return router;
};
