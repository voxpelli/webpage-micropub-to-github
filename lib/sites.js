/* jshint node: true */

'use strict';

var config = require('./config');

var sites = config.sites || {};

if (config.site.url) {
  sites.main = {
    url: config.site.url,
    github: {
      repo: config.site.repo,
    },
    options: {
      deriveLanguages: config.site.deriveLanguages
    }
  };
}

module.exports = sites;
