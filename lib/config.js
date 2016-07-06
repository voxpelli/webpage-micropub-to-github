/* jshint node: true */

'use strict';

var env = process.env;
var pkg = require('../package.json');
var prefix = 'MICROPUB_';

prefix = env[prefix + 'PREFIX'] || prefix;

require('dotenv').config({silent: true});

var config = {
  version : pkg.version,
  env : env.NODE_ENV || 'production',
  port : env.PORT || 8080,
  host : env[prefix + 'HOST'],
  github : {
    user: env[prefix + 'GITHUB_USER'],
    token : env[prefix + 'GITHUB_TOKEN'],
  },
  site: {
    url : env[prefix + 'SITE_URL'],
    repo : env[prefix + 'SITE_GITHUB_REPO'],
  },
  sites : env[prefix + 'SITES_JSON'] ? JSON.parse(env[prefix + 'SITES_JSON']) : false,
  token: env[prefix + 'TOKEN_JSON']
    ? JSON.parse(env[prefix + 'TOKEN_JSON'])
    : (
      env[prefix + 'TOKEN_ENDPOINT']
      ? [{ endpoint: env[prefix + 'TOKEN_ENDPOINT'], me: env[prefix + 'TOKEN_ME'] }]
      : []
    ),
  handlerOptions: {
    deriveLanguages : (env[prefix + 'OPTION_DERIVE_LANGUAGES'] || '').split(',').filter(item => !!item),
  }
};

config.userAgent = pkg.name + '/' + config.version + ' (' + pkg.homepage + ')';

module.exports = config;
