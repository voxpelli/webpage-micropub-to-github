/* jshint node: true */

'use strict';

var config = require('./config');

module.exports = {
  'thepost.se': {
    url: 'http://thepost.se/',
    github: {
      user: 'voxpelli',
      repo: 'webpage-thepost-se',
      token: config.github.token,
    },
    token: {
      me: 'http://kodfabrik.se/',
      endpoint: 'https://tokens.indieauth.com/token',
    },
  },
  'voxpelli.com': {
    url: 'http://voxpelli.com/',
    github: {
      user: 'voxpelli',
      repo: 'voxpelli.github.com',
      token: config.github.token,
    },
    token: {
      me: 'http://kodfabrik.se/',
      endpoint: 'https://tokens.indieauth.com/token',
    },
  },
};
