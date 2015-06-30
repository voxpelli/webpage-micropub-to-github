/* jshint node: true */

'use strict';

var qs = require('querystring');

var express = require('express');
var bodyParser = require('body-parser');

var fetch = require('node-fetch');

var badRequest = function (res, reason, code) {
  res.status(code || 400).set('Content-Type', 'text/plain').send(reason);
};

var normalizeUrl = function (url) {
  if (url.substr(-1) !== '/') {
    url += '/';
  }
  return url;
};

module.exports = function (options) {
  options = options || {};

  var logger = options.logger || require('bunyan-duckling');

  if (!options.token || ['function', 'object'].indexOf(typeof options.token) === -1) {
    throw new Error('No token set. Needed to check authorization.');
  }

  var tokenLookup = typeof options.token === 'function' ? options.token : function () {
    return options.token;
  };

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

    return fetch(endpoint, fetchOptions)
      .then(function (response) {
        return response.text();
      }).then(function (body) {
        return qs.parse(body);
      }).then(function (result) {
        if (!result.me || !result.scope) {
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
    mergeParams: true,
  });

  //TODO: Access the req.app.locals.logger for logging – when available that is

  router.use(bodyParser.urlencoded({ extended: false }));

  // Ensure the needed parts are there
  router.use(function (req, res, next) {
    if (!req.headers.authorization && !req.body.access_token) {
      return badRequest(res, 'Missing "Authorization" header or body parameter.', 401);
    } else if (!req.body.h) {
      return badRequest(res, 'Missing "h" value.');
    }

    var token;

    if (req.headers.authorization) {
      token = req.headers.authorization.trim().split(/\s+/)[1];
    }
    if (!token && req.body.access_token) {
      token = req.body.access_token;
    }

    //TODO: resolve me + endpoint from something else than targetsite

    var tokenReference = tokenLookup(req);

    validateToken(token, tokenReference.me, tokenReference.endpoint)
      .then(function (valid) {
        if (!valid) {
          return res.sendStatus(403);
        }
        next();
      })
      .catch(function (err) {
        logger.debug(err, 'An error occured when trying to validate token');
        next(err);
      });
  });

  router.post('/', function (req, res) {
    if (!req.body.content) {
      return badRequest(res, 'Missing "content" value.');
    }

    //TODO: Verify it's a creation and not a modification/deletion

    //TODO: Call a handler with the specified content and wait for the handler to report back before returning

    res.status(201).send('Hi!');
  });

  return router;
};
