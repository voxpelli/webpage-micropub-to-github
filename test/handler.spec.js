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
        'lang: en\n' +
        '---\n' +
        'hello world\n'
      );

      var mock = nock('https://api.github.com/')
        .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .put(path, {
          message: 'uploading article',
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
        'lang: en\n' +
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
          message: 'uploading media',
          content: fileContent.toString('base64'),
        })
        .reply(201, { content : { sha : 'abc123' } })
        // Upload of the content
        .put(repoPath + '_posts/2015-06-30-awesomeness-is-awesome.md', {
          message: 'uploading article',
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

    it('should override existing content if matching URL', function () {
      var token = 'abc123';
      var user = 'username';
      var repo = 'repo';
      var path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-awesomeness-is-awesome.md';
      var sha = 'abc123';

      var encodedContent = new Buffer(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:20:00.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'lang: en\n' +
        '---\n' +
        'hello world\n'
      );
      var base64 = encodedContent.toString('base64');

      var mock = nock('https://api.github.com/')
        .put(path, {
          message: 'uploading article',
          content: base64,
        })
        .reply(422, {})

        .get(path)
        .reply(200, {sha: sha})

        .put(path, {
          message: 'uploading article',
          content: base64,
          sha: sha,
        })
        .reply(201, { content : { sha : 'xyz789' } });

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
              'url': ['http://example.com/foo/2015/06/awesomeness-is-awesome/'],
            },
          },
          'http://example.com/foo/'
        )
        .then(function (url) {
          mock.done();
          url.should.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
        });
    });

    it('should not override existing content if no matching URL', function () {
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
        'lang: en\n' +
        '---\n' +
        'hello world\n'
      );
      var base64 = encodedContent.toString('base64');

      var mock = nock('https://api.github.com/')
        .put(path, {
          message: 'uploading article',
          content: base64,
        })
        .reply(422, {});

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
          url.should.equal(false);
        });
    });

    it('should set a custom commit message when formatter returns a category', function () {
      var token = 'abc123';
      var user = 'username';
      var repo = 'repo';
      var path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-hello-world.md';

      var encodedContent = new Buffer(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:20:00.000Z\'\n' +
        'title: null\n' +
        'slug: hello-world\n' +
        'lang: en\n' +
        'category: social\n' +
        '---\n' +
        'hello world\n'
      );
      var base64 = encodedContent.toString('base64');

      var mock = nock('https://api.github.com/')
        .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .put(path, {
          message: 'uploading social interaction',
          content: base64,
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
            },
          },
          'http://example.com/foo/'
        )
        .then(function (url) {
          mock.done();
          url.should.equal('http://example.com/foo/social/2015/06/hello-world/');
        });
    });


  });

});
