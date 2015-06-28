/* jshint node: true */
/* global -Promise */

'use strict';

var config = require('./config');
var GitHubPublisher = require('./github');

var publisher = new GitHubPublisher(config.github.token);

publisher.publish();
