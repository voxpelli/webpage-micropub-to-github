/* jshint node: true */

'use strict';

var GitHubPublisher = require('github-publish');
var MicropubFormatter = require('format-microformat');

module.exports = function (githubTarget, micropubDocument, siteUrl) {
  var publisher = new GitHubPublisher(githubTarget.token, githubTarget.user, githubTarget.repo);
  var formatter = new MicropubFormatter(siteUrl);

  return formatter.formatAll(micropubDocument)
    .then(function (formatted) {
      return Promise.all(
          (formatted.files || []).map(function (file) {
            return publisher.publish(file.filename, file.buffer, true).then(function (result) {
              //TODO: Do something more than just logging
              if (!result) { console.log('Failed to upload media'); }
            });
          })
        )
        .then(function () {
          return formatted;
        });
    })
    .then(function (formatted) {
      //TODO: Add support for custom commit messages (and filenames?) through "mp-" parameters?

      return publisher.publish(formatted.filename, formatted.content, true)
        .then(function (result) {
          return result ? formatted.url : false;
        });
    });
};
