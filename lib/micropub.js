/* jshint node: true */

'use strict';

var express = require('express');
var bodyParser = require('body-parser');

module.exports = function () {
  var router = express.Router();

  //TODO: Access the req.app.locals.logger for logging – when available that is

  router.use(bodyParser.urlencoded({ extended: false }));

  // Ensure the needed parts are there
  router.use(function (req, res, next) {
    if (!req.headers.authorization) {
      return res.status(401).set('Content-Type', 'text/plain').send('Missing "Authorization" header.');
    } else if (!req.body.h) {
      return res.status(400).set('Content-Type', 'text/plain').send('Missing "h" value.');
    }
    next();
  });

  // define the home page route
  router.post('/', function (req, res) {
    res.send('Hi!');
  });

  return router;
};
