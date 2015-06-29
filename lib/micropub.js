/* jshint node: true */

'use strict';

var express = require('express');
var bodyParser = require('body-parser');

// var fetch = require('node-fetch');

module.exports = function () {
  var router = express.Router({
    caseSensitive: true,
  });

  //TODO: Access the req.app.locals.logger for logging – when available that is

  router.use(bodyParser.urlencoded({ extended: false }));

  router.param('targetsite', function (req, res, next, id) {
    //TODO: Make configurable through DB or similar – perhaps expose a method? So that this route can be used DB-less as well
    if (id === 'thepost.se') {
      req.targetsite = {
        hostname: id,
        tokenEndpoint: 'https://tokens.indieauth.com/token',
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
    //TODO: Check token!
    next();
  });

  router.post('/:targetsite', function (req, res) {
    res.send('Hi!');
  });

  return router;
};
