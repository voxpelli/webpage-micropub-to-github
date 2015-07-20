/* jshint node: true */

'use strict';

var GitHubPublisher = require('github-publish');
var MicropubFormatter = require('format-microformat');

module.exports = function (githubTarget, micropubDocument, siteUrl) {
  var publisher = new GitHubPublisher(githubTarget.token, githubTarget.user, githubTarget.repo);
  var formatter = new MicropubFormatter(siteUrl);

  return formatter.formatAll(micropubDocument)
    .then(function (formatted) {
      //TODO: Add support for custom commit messages (and filenames?) through "mp-" parameters?

      return publisher.publish(formatted.filename, formatted.content, true)
        .then(function (result) {
          return result ? formatted.url : false;
        });
    });
};
