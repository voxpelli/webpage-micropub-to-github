/* jshint node: true */

'use strict';

var MicropubFormatter = function () {};

MicropubFormatter.prototype.format = function (data) {
  var props = data.properties;
  return '---\n' +
    'layout: post\n' +
    'title: "'  + props.name + '"\n' + //TODO: Add escaping!
    'date: 2015-04-05T16:20:00+02:00\n' +
    '---\n' +
    (props.content || '') + '\n';
};

module.exports = MicropubFormatter;
