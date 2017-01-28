/* jshint node: true */

'use strict';

const { deepFreeze } = require('./utils');

const config = require('./config');

const sites = config.sites || {};

if (config.site.url) {
  sites.main = {
    url: config.site.url,
    github: {
      repo: config.site.repo
    },
    syndicateTo: config.site.syndicateTo,
    options: {
      deriveLanguages: config.site.deriveLanguages
    }
  };

  if (config.site.syndicateToUid) {
    sites.main.syndicateTo = [
      {
        uid: config.site.syndicateToUid,
        name: config.site.syndicateToName
      }
    ];
  }
}

module.exports = deepFreeze(sites);
