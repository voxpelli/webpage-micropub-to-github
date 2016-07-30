/* jshint node: true */

'use strict';

var GitHubPublisher = require('github-publish');
var MicropubFormatter = require('format-microformat');

var autoConfigure = require('./auto-config');

var removeEmptyValues = function (obj) {
  var result = {};
  Object.keys(obj).forEach(key => {
    if (obj[key]) {
      result[key] = obj[key];
    }
  });
  return result;
};

module.exports = function (githubTarget, micropubDocument, siteUrl, options) {
  options = removeEmptyValues(options || {});

  var publisher = new GitHubPublisher(githubTarget.token, githubTarget.user, githubTarget.repo, githubTarget.branch);

  var force = false;

  return Promise.resolve(
    options.noAutoConfigure
      ? options
      : autoConfigure(publisher).then(autoConfig => Object.assign(autoConfig, options))
  )
    .then(options => new MicropubFormatter({
      relativeTo: siteUrl,
      deriveLanguages: options.deriveLanguages,
      permalinkStyle: options.permalinkStyle
    }))
    .then(formatter => formatter.formatAll(micropubDocument))
    .then(function (formatted) {
      if (formatted.raw.url === formatted.url) {
        force = true;
      }

      return Promise.all(
          (formatted.files || []).map(function (file) {
            return publisher.publish(file.filename, file.buffer, {
              force: force,
              message: 'uploading media'
            })
              .then(function (result) {
                // TODO: Do something more than just logging
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
        message: 'uploading ' + category
      })
        .then(function (result) {
          return result ? formatted.url : false;
        });
    });
};
