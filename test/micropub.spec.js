/* jshint node: true */
/* global describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

describe('Micropub Parse Formencoded Body', function () {

  var micropub = require('../lib/micropub.js');

  it('should be correctly parsed', function () {
    micropub.processFormencodedBody({
      h: 'entry',
      content: 'hello world',
      'mp-syndicate-to': 'http://twitter.com/voxpelli',
    }).should.deep.equal({
      type: ['h-entry'],
      properties: {
        content: ['hello world'],
      },
      mp: {
        'syndicate-to': ['http://twitter.com/voxpelli'],
      }
    });
  });

  it('should handle array properties', function () {
    micropub.processFormencodedBody({
      h: 'entry',
      content: 'hello world',
      'category[]': ['foo', 'bar'],
    }).should.deep.equal({
      type: ['h-entry'],
      properties: {
        content: ['hello world'],
        category: ['foo', 'bar'],
      }
    });
  });

});
