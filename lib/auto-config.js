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

  if (!cache[key]) {
    return;
  } else if (cache[key].expire < Date.now()) {
    delete cache[key];
    return;
  }

  return cache[key].value;
};

module.exports = function (publisher) {
  const cacheKey = [publisher.user, publisher.repo, publisher.branch];
  const cache = getCache(cacheKey);

  if (cache) {
    return cache.then(options => Object.assign({}, options));
  }

  const lookup = publisher.retrieve('_config.yml')
    .then(result => result ? Buffer.from(result.content, 'base64').toString('utf8') : '')
    .then(yamlConfig => yaml.safeLoad(yamlConfig))
    .then(config => {
      const options = {};

      config = config || {};

      if (config.permalink) {
        options.permalinkStyle = config.permalink;
      }

      return options;
    });

  setCache(cacheKey, lookup, 60 * 60 * 1000);

  return lookup;
};
