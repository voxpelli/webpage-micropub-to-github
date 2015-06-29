/* jshint node: true */

'use strict';

var _ = require('lodash');
var yaml = require('js-yaml');

var MicropubFormatter = function () {};

MicropubFormatter.prototype._formatFrontMatter = function (source) {
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

MicropubFormatter.prototype._formatContent = function (data) {
  return data.content ? data.content + '\n' : '';
};

MicropubFormatter.prototype.format = function (data) {
  return Promise.resolve(this._formatFrontMatter(data.properties) + this._formatContent(data.properties));
};

MicropubFormatter.prototype.formatFilename = function (data) {
  var name = (data.properties.name || data.properties.content || [''])[0].trim();

  if (name) {
    name = name.split(/\s+/);
    if (name.length > 5) {
      name = name.slice(0, 5);
    }
    name = name.join(' ');
  }

  return Promise.resolve('2015-04-05' + (name ? '-' + _.kebabCase(name) : '') + '.html');
};

module.exports = MicropubFormatter;
