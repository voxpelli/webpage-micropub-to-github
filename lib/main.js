/* jshint node: true */

'use strict';

var config = require('./config');
var handler = require('./handler');

var micropubDocument = {
  'type': ['h-entry'],
  'properties': {
    'content': ['hello world'],
    'category': ['foo', 'bar'],
  },
};

handler(
  {
    token: config.github.token,
    user: 'voxpelli',
    repo: 'webpage-thepost-se',
  },
  micropubDocument
);
