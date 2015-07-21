/* jshint node: true */
/* global beforeEach, afterEach, describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var nock = require('nock');
var sinon = require('sinon');

chai.use(chaiAsPromised);
chai.should();

describe('Handler', function () {
  var handler = require('../lib/handler.js');
  var clock;

  beforeEach(function () {
    nock.disableNetConnect();
    clock = sinon.useFakeTimers(1435674000000);
  });

  afterEach(function () {
    nock.cleanAll();
    clock.restore();
  });

  describe('main', function () {

    it('should format and send content', function () {
      var token = 'abc123';
      var user = 'username';
      var repo = 'repo';
      var path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-awesomeness-is-awesome.md';

      var encodedContent = new Buffer(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:20:00.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );

      var mock = nock('https://api.github.com/')
        .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .put(path, {
          message: 'new content',
          content: encodedContent.toString('base64'),
        })
        .reply(201, { content : { sha : 'abc123' } });

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
          url.should.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
        });
    });

    it('should upload files prior to content', function () {
      var token = 'abc123';
      var user = 'username';
      var repo = 'repo';
      var repoPath = '/repos/' + user + '/' + repo + '/contents/';
      var mediaFilename = 'foo.jpg';

      var fileContent = new Buffer('abc123');

      var encodedContent = new Buffer(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:20:00.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'mf-photo:\n' +
        '  - \'http://example.com/foo/media/2015-06-awesomeness-is-awesome/' + mediaFilename + '\'\n' +
        '---\n' +
        'hello world\n'
      );

      var mock = nock('https://api.github.com/')
        .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        // Upload of the media
        .put(repoPath + 'media/2015-06-awesomeness-is-awesome/' + mediaFilename, {
          //TODO: Change this commit message to at least be "new media" instead
          message: 'new content',
          content: fileContent.toString('base64'),
        })
        .reply(201, { content : { sha : 'abc123' } })
        // Upload of the content
        .put(repoPath + '_posts/2015-06-30-awesomeness-is-awesome.md', {
          message: 'new content',
          content: encodedContent.toString('base64'),
        })
        .reply(201, { content : { sha : 'abc123' } });

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
            files: {
              photo: [{filename: 'foo.jpg', buffer: fileContent}]
            }
          },
          'http://example.com/foo/'
        )
        .then(function (url) {
          mock.done();
          url.should.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
        });
    });


  });
});
