'use strict';

const yaml = require('js-yaml');

const cache = {};

const setCache = (key, value, maxAge) => {
  cache[JSON.stringify(key)] = {
    value,
    expire: Date.now() + maxAge
  };
};

const getCache = (key, value, maxAge) => {
  key = JSON.stringify(key);

  if (cache[key] && cache[key].expire < Date.now()) {
    delete cache[key];
  }

  return cache[key];
};

module.exports = function (publisher) {
  const cacheKey = [publisher.user, publisher.repo, publisher.branch];
  const cache = getCache(cacheKey);

  return cache
    ? Object.assign({}, cache)
    : publisher.retrieve('_config.yml')
      .then(result => result ? Buffer.from(result.content, 'base64').toString('utf8') : '')
      .then(yamlConfig => yaml.safeLoad(yamlConfig))
      .then(config => {
        const options = {};

        config = config || {};

        if (config.permalink) {
          options.permalinkStyle = config.permalink;
        }

        setCache(cacheKey, options, 60 * 60 * 1000);

        return options;
      });
};
