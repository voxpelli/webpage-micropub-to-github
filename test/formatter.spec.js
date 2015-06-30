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
  var baseMicropubData;

  beforeEach(function () {
    formatter = new MicropubFormatter();
    baseMicropubData = {
      'type': ['h-entry'],
      'properties': {
        'content': ['hello world'],
        'name': ['awesomeness is awesome'],
        'published': [new Date(1435674841000)],
      },
    };
  });

  describe('format', function () {

    it('should return a fully formatted page on sunny day content', function () {
      return formatter.format(baseMicropubData).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing title', function () {
      delete baseMicropubData.properties.name;

      return formatter.format(baseMicropubData).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing content', function () {
      delete baseMicropubData.properties.content;

      return formatter.format(baseMicropubData).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        '---\n'
      );
    });

    it('should handle categories', function () {
      baseMicropubData.properties.category = ['foo', 'bar'];

      return formatter.format(baseMicropubData).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'categories: foo bar\n' +
        '---\n' +
        'hello world\n'
      );
    });

  });

  describe('formatFilename', function () {

    it('should base file name on title', function () {
      return formatter.formatFilename(baseMicropubData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.html');
    });

    it('should fall back on content', function () {
      delete baseMicropubData.properties.name;
      return formatter.formatFilename(baseMicropubData).should.eventually.equal('_posts/2015-06-30-hello-world.html');
    });

    it('should ulimately fallback to just date', function () {
      delete baseMicropubData.properties.name;
      delete baseMicropubData.properties.content;
      return formatter.formatFilename(baseMicropubData).should.eventually.equal('_posts/2015-06-30.html');
    });

  });

  describe('formatURL', function () {

    it('should base URL on name', function () {
      return formatter.formatURL(baseMicropubData).should.eventually.equal('2015/06/awesomeness-is-awesome/');
    });

    it('should return absolute URL when requested', function () {
      return formatter.formatURL(baseMicropubData, 'http://example.com/foo/').should.eventually.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
    });

  });
});
