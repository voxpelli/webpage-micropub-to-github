/* jshint node: true */

'use strict';

var env = process.env;
var pkg = require('../package.json');
var prefix = 'MICROPUB_';

prefix = env[prefix + 'PREFIX'] || prefix;

require('dotenv').config({silent: true});

var config = {
  version : pkg.version,
  // db : env.DATABASE_URL,
  env : env.NODE_ENV || 'production',
  port : env.PORT || 8080,
  host : env[prefix + 'HOST'],
  github : {
    token : env[prefix + 'GITHUB_TOKEN'],
    // client_id : env[prefix + 'GITHUB_ID'],
    // client_secret :  env[prefix + 'GITHUB_SECRET'],
  },
  deriveLanguages : (env[prefix + 'DERIVE_LANGUAGES'] || 'eng').split(',')
};

// if (config.env === 'test') {
//   config.db = process.env.DATABASE_TEST_URL || "postgres://postgres@localhost/micropub_test";
// }

// if (config.https === undefined) {
//   config.https = (config.env === 'production');
// }

config.userAgent = pkg.name + '/' + config.version + ' (' + pkg.homepage + ')';

module.exports = config;
