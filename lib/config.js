/* jshint node: true */

'use strict';

var env = process.env;
var pkg = require('../package.json');
var prefix = 'MICROPUB_';

prefix = env[prefix + 'PREFIX'] || prefix;

require('dotenv').config({silent: true});

var config = {
  version: pkg.version,
  env: env.NODE_ENV || 'production',
  port: env.PORT || 8080,
  host: env[prefix + 'HOST'],
  github: {
    user: env[prefix + 'GITHUB_USER'],
    token: env[prefix + 'GITHUB_TOKEN']
  },
  site: {
    url: env[prefix + 'SITE_URL'],
    repo: env[prefix + 'SITE_GITHUB_REPO']
  },
  sites: env[prefix + 'SITES_JSON'] ? JSON.parse(env[prefix + 'SITES_JSON']) : false,
  token: env[prefix + 'TOKEN_ENDPOINT']
    ? [{
      endpoint: env[prefix + 'TOKEN_ENDPOINT'],
      me: env[prefix + 'TOKEN_ME'] || env[prefix + 'SITE_URL']
    }]
    : [],
  handlerOptions: {
    noAutoConfigure: !!env[prefix + 'OPTION_NO_AUTO_CONFIGURE'],
    deriveCategory: env[prefix + 'OPTION_DERIVE_CATEGORY'] ? JSON.parse(env[prefix + 'OPTION_DERIVE_CATEGORY']) : false,
    deriveLanguages: (env[prefix + 'OPTION_DERIVE_LANGUAGES'] || '').split(',').filter(item => !!item),
    permalinkStyle: env[prefix + 'PERMALINK_STYLE']
  }
};

config.userAgent = pkg.name + '/' + config.version + ' (' + pkg.homepage + ')';

module.exports = config;
