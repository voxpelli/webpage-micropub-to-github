/* jshint node: true */

'use strict';


const config = require('./config');

const sites = config.sites || {};

if (config.site.url) {
  sites.main = {
    url: config.site.url,
    github: {
      repo: config.site.repo
    },
    options: {
      deriveLanguages: config.site.deriveLanguages
    }
  };
}

module.exports = sites;
