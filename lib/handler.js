'use strict';

const GitHubPublisher = require('github-publish');
const MicropubFormatter = require('format-microformat');
const fulfills = require('fulfills');

const autoConfigure = require('./auto-config');

const removeEmptyValues = function (obj, exclude = []) {
  const result = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] || exclude.includes(key)) {
      result[key] = obj[key];
    }
  });
  return result;
};

const matchPropertiesToConditions = function (conditions, properties) {
  let result;

  conditions.some(({ condition, value }) => {
    if (fulfills(properties, condition)) {
      result = value;
      return true;
    }
  });

  return result;
};

module.exports = function (githubTarget, micropubDocument, siteUrl, options) {
  options = removeEmptyValues(options || {}, ['layoutName']);

  const publisher = new GitHubPublisher(githubTarget.token, githubTarget.user, githubTarget.repo, githubTarget.branch);

  let force = false;

  let categoryDeriver;

  if (options.deriveCategory) {
    categoryDeriver = (properties) => matchPropertiesToConditions(options.deriveCategory, properties);
  }

  return Promise.resolve(
    options.noAutoConfigure
      ? options
      : autoConfigure(publisher).then(autoConfig => Object.assign(autoConfig, options))
  )
    .then(options => {
      // Resolve any condition based options to functions that will resolve values based on the conditions
      [
        'permalinkStyle',
        'filenameStyle',
        'mediaFilesStyle',
        'layoutName'
      ].forEach(key => {
        // Save the original value as we will need it when matching the properties to the conditions
        const value = options[key];

        if (Array.isArray(value)) {
          options[key] = (properties) => matchPropertiesToConditions(value, properties);
        }
      });

      return options;
    })
    .then(options => new MicropubFormatter({
      relativeTo: siteUrl,
      deriveCategory: categoryDeriver,
      deriveLanguages: options.deriveLanguages,
      permalinkStyle: options.permalinkStyle,
      filenameStyle: options.filenameStyle,
      filesStyle: options.mediaFilesStyle,
      layoutName: options.layoutName,
      contentSlug: options.contentSlug
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
