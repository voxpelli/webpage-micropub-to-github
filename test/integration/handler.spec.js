/* jshint node: true */
/* global beforeEach, afterEach, describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var nock = require('nock');

chai.use(chaiAsPromised);
chai.should();

describe('Handler', function () {
  var handler = require('../../lib/handler.js');

  beforeEach(function () {
    nock.disableNetConnect();
  });

  afterEach(function () {
    nock.cleanAll();
  });

  describe('main', function () {

    it('should format and sent content', function () {
      var token = 'abc123';
      var user = 'username';
      var repo = 'repo';
      var path = '/repos/' + user + '/' + repo + '/contents/2015-04-05-awesomeness-is-awesome.html';

      var encodedContent = new Buffer(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-04-05T16:20:00+02:00\'\n' +
        'title: awesomeness is awesome\n' +
        '---\n' +
        'hello world\n'
      );

      var mock = nock('https://api.github.com/')
        .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .put(path, {
          message: 'new content',
          content: encodedContent.toString('base64'),
        })
        .reply(201, {});

      return handler(
          {
            token: token,
            user: user,
            repo: repo,
          }, {
            'type': ['h-entry'],
            'properties': {
              'content': ['hello world'],
              'name': ['awesomeness is awesome'],
            },
          },
          'http://example.com/foo/'
        )
        .then(function (url) {
          mock.done();
          url.should.equal('http://example.com/foo/2015/04/awesomeness-is-awesome/');
        });
    });

  });
});
