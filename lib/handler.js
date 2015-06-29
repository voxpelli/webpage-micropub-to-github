/* jshint node: true */

'use strict';

var GitHubPublisher = require('./github');
var MicropubFormatter = require('./formatter');

module.exports = function (githubTarget, micropubDocument) {
  var publisher = new GitHubPublisher(githubTarget.token, githubTarget.user, githubTarget.repo);
  var formatter = new MicropubFormatter();

  return Promise.all([
    formatter.formatFilename(micropubDocument),
    formatter.format(micropubDocument),
  ])
    .then(function (formatted) {
      var filename = formatted[0];
      var document = formatted[1];

      return publisher.publish(filename, document);
    });
};
