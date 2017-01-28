'use strict';

const GitHubPublisher = require('github-publish');
const MicropubFormatter = require('format-microformat');
const fulfills = require('fulfills');

const autoConfigure = require('./auto-config');

const removeEmptyValues = function (obj) {
  const result = {};
  Object.keys(obj).forEach(key => {
    if (obj[key]) {
      result[key] = obj[key];
    }
  });
  return result;
};

module.exports = function (githubTarget, micropubDocument, siteUrl, options) {
  options = removeEmptyValues(options || {});

  const publisher = new GitHubPublisher(githubTarget.token, githubTarget.user, githubTarget.repo, githubTarget.branch);

  let force = false;

  let categoryDeriver;

  if (options.deriveCategory) {
    categoryDeriver = (properties) => {
      let result;

      Object.keys(options.deriveCategory)
        .some(category => {
          if (fulfills(properties, options.deriveCategory[category])) {
            result = category;
            return true;
          }
        });

      return result;
    };
  }

  return Promise.resolve(
    options.noAutoConfigure
      ? options
      : autoConfigure(publisher).then(autoConfig => Object.assign(autoConfig, options))
  )
    .then(options => new MicropubFormatter({
      relativeTo: siteUrl,
      deriveCategory: categoryDeriver,
      deriveLanguages: options.deriveLanguages,
      permalinkStyle: options.permalinkStyle
    }))
    .then(formatter => formatter.formatAll(micropubDocument))
    .then(formatted => {
      if (formatted.raw.url === formatted.url) {
        force = true;
      }

      return Promise.all(
          (formatted.files || []).map(file => {
            return publisher.publish(file.filename, file.buffer, {
              force: force,
              message: 'uploading media'
            })
              .then(result => {
                // TODO: Do something more than just logging
                if (!result) { console.log('Failed to upload media'); }
              });
          })
        )
        .then(() => formatted);
    })
    .then(formatted => {
      let category = formatted.raw.derived.category || 'article';

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
