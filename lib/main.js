/* jshint node: true */

'use strict';

var config = require('./config');
var GitHubPublisher = require('./github');
var MicropubFormatter = require('./formatter');

var publisher = new GitHubPublisher(config.github.token);
var formatter = new MicropubFormatter();

var micropubDocument = {
  'type': ['h-entry'],
  'properties': {
    'content': ['hello world'],
    'category': ['foo', 'bar'],
  },
};

formatter.format(micropubDocument).then(function (formattedDocument) {
  return publisher.publish(formattedDocument);
});
