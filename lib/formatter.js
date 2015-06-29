/* jshint node: true */

'use strict';

var _ = require('lodash');
var yaml = require('js-yaml');
var MicropubFormatter = function () {};

MicropubFormatter.prototype.formatFrontMatter = function (source) {
  //TODO: Make configurable
  var target = {
    layout: 'post',
    date: '2015-04-05T16:20:00+02:00', //TODO: Make dynamic
  };

  var mapping = {
    title: 'name',
  };

  _.forEach(mapping, function (sourceKey, targetKey) {
    if (source[sourceKey] && _.isArray(source[sourceKey]) && source[sourceKey][0] !== undefined) {
      target[targetKey] = source[sourceKey][0];
    }
  });

  return '---\n' + yaml.safeDump(target) + '---\n';
};

MicropubFormatter.prototype.formatContent = function (data) {
  return data.content ? data.content + '\n' : '';
};

MicropubFormatter.prototype.format = function (data) {
  return Promise.resolve(this.formatFrontMatter(data.properties) + this.formatContent(data.properties));
};

module.exports = MicropubFormatter;
