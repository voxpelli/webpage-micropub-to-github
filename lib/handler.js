/* jshint node: true */

'use strict';

var GitHubPublisher = require('github-publish');
var MicropubFormatter = require('format-microformat');

module.exports = function (githubTarget, micropubDocument, siteUrl) {
  var publisher = new GitHubPublisher(githubTarget.token, githubTarget.user, githubTarget.repo);
  var formatter = new MicropubFormatter({
    relativeTo: siteUrl,
    defaults: {
      properties: {
        lang: ['en'],
      },
    },
  });
  var force = false;

  return formatter.formatAll(micropubDocument)
    .then(function (formatted) {
      if (formatted.raw.properties.url && formatted.raw.properties.url[0] === formatted.url) {
        force = true;
      }

      return Promise.all(
          (formatted.files || []).map(function (file) {
            return publisher.publish(file.filename, file.buffer, {
                force: force,
                message: 'uploading media',
              })
              .then(function (result) {
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
      var category = formatted.raw.derived.category || 'article';

      if (category === 'social') {
        category = 'social interaction';
      }

      return publisher.publish(formatted.filename, formatted.content, {
          force: force,
          message: 'uploading '  + category,
        })
        .then(function (result) {
          return result ? formatted.url : false;
        });
    });
};
