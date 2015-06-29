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

    it('should return a fully formatted page', function () {
      return formatter.format({
        'type': ['h-entry'],
        'properties': {
          'content': ['hello world'],
          'name': ['awesomeness'],
        },
      }).should.equal(
        '---\n' +
        'layout: post\n' +
        'title: "awesomeness"\n' +
        'date: 2015-04-05T16:20:00+02:00\n' +
        '---\n' +
        'hello world\n'
      );
    });

  });
});
