/* jshint node: true */

'use strict';

var _ = require('lodash');
var urlModule = require('url');
var yaml = require('js-yaml');
var strftime = require('strftime');

var MicropubFormatter = function () {};

MicropubFormatter.prototype._formatFrontMatter = function (source) {
  var target = {
    layout: 'post',
    date: source.published[0].toISOString(),
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

MicropubFormatter.prototype._formatName = function (data) {
  var name = (data.properties.name || data.properties.content || [''])[0].trim();

  if (name) {
    name = name.split(/\s+/);
    if (name.length > 5) {
      name = name.slice(0, 5);
    }
    name = name.join(' ');
  }

  return name ? _.kebabCase(name) : '';
};

MicropubFormatter.prototype.preFormat = function (data) {
  data = _.cloneDeep(data);

  data.properties.published = [data.properties.published && data.properties.published[0] ? new Date(data.properties.published[0]) : new Date()];

  return Promise.resolve(data);
};

MicropubFormatter.prototype.format = function (data) {
  return Promise.resolve(this._formatFrontMatter(data.properties) + this._formatContent(data.properties));
};

MicropubFormatter.prototype.formatFilename = function (data) {
  var name = this._formatName(data);
  return Promise.resolve(strftime('%Y-%m-%d', data.properties.published[0]) + (name ? '-' + name : '') + '.html');
};

MicropubFormatter.prototype.formatURL = function (data, relativeTo) {
  var name = this._formatName(data);
  var url = strftime('%Y/%m', data.properties.published[0]) + '/' + (name ? name + '/' : '');

  if (relativeTo) {
    url = urlModule.resolve(relativeTo, url);
  }

  return Promise.resolve(url);
};

module.exports = MicropubFormatter;
