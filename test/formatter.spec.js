/* jshint node: true */
/* global beforeEach, describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

// var should = chai.should();
chai.should();

describe('Formatter', function () {
  var MicropubFormatter = require('../lib/formatter.js');
  var formatter;

  beforeEach(function () {
    formatter = new MicropubFormatter();
  });

  describe('format', function () {

    it('should return a fully formatted page on sunny day content', function () {
      return formatter.format({
        'type': ['h-entry'],
        'properties': {
          'content': ['hello world'],
          'name': ['awesomeness is awesome'],
        },
      }).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-04-05T16:20:00+02:00\'\n' +
        'title: awesomeness is awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing title', function () {
      return formatter.format({
        'type': ['h-entry'],
        'properties': {
          'content': ['hello world'],
        },
      }).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-04-05T16:20:00+02:00\'\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing content', function () {
      return formatter.format({
        'type': ['h-entry'],
        'properties': {
          'name': ['awesomeness is awesome'],
        },
      }).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-04-05T16:20:00+02:00\'\n' +
        'title: awesomeness is awesome\n' +
        '---\n'
      );
    });

  });
});
