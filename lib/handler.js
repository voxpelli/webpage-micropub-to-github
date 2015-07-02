/* jshint node: true */

'use strict';

var GitHubPublisher = require('github-publish');
var MicropubFormatter = require('format-microformat');

module.exports = function (githubTarget, micropubDocument, siteUrl) {
  var publisher = new GitHubPublisher(githubTarget.token, githubTarget.user, githubTarget.repo);
  var formatter = new MicropubFormatter();

  return formatter.preFormat(micropubDocument)
    .then(function (preFormatted) {
      micropubDocument = preFormatted;

      return Promise.all([
        formatter.formatFilename(micropubDocument),
        formatter.format(micropubDocument),
      ]);
    })
    .then(function (formatted) {
      var filename = formatted[0];
      var document = formatted[1];

      //TODO: Add support for custom commit messages (and filenames?) through "mp-" parameters?

      return publisher.publish(filename, document).then(function (result) {
        return result ? formatter.formatURL(micropubDocument, siteUrl) : false;
      });
    });
};
