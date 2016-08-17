'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var nock = require('nock');
var sinon = require('sinon');

chai.use(chaiAsPromised);
chai.should();

describe('Handler', function () {
  var handler = require('../lib/handler.js');
  var handlerConfig;
  var clock;

  const basicTest = function ({ content, message, finalUrl }) {
    var token = 'abc123';
    var user = 'username';
    var repo = 'repo';
    var path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-awesomeness-is-awesome.md';

    var encodedContent = new Buffer(content || (
      '---\n' +
      'layout: micropubpost\n' +
      'date: \'2015-06-30T14:20:00.000Z\'\n' +
      'title: awesomeness is awesome\n' +
      'lang: en\n' +
      'slug: awesomeness-is-awesome\n' +
      '---\n' +
      'hello world\n'
    )).toString('base64');

    var mock = nock('https://api.github.com/')
      .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
      .put(path, {
        message: message || 'uploading article',
        content: encodedContent
      })
      .reply(201, { content: { sha: 'abc123' } });

    return handler(
      {
        token: token,
        user: user,
        repo: repo
      },
      {
        'type': ['h-entry'],
        'properties': {
          'content': ['hello world'],
          'name': ['awesomeness is awesome'],
          'lang': ['en']
        }
      },
      'http://example.com/foo/',
      handlerConfig
    )
      .then(function (url) {
        mock.done();
        url.should.equal(finalUrl || 'http://example.com/foo/2015/06/awesomeness-is-awesome/');
      });
  };

  beforeEach(function () {
    nock.disableNetConnect();
    clock = sinon.useFakeTimers(1435674000000);
    handlerConfig = {
      noAutoConfigure: true,
      permalinkStyle: '/:categories/:year/:month/:title/'
    };
  });

  afterEach(function () {
    nock.cleanAll();
    clock.restore();
  });

  describe('main', function () {
    it('should format and send content', function () {
      return basicTest({});
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
        'lang: en\n' +
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
          // TODO: Change this commit message to at least be "new media" instead
          message: 'uploading media',
          content: fileContent.toString('base64')
        })
        .reply(201, { content: { sha: 'abc123' } })
        // Upload of the content
        .put(repoPath + '_posts/2015-06-30-awesomeness-is-awesome.md', {
          message: 'uploading article',
          content: encodedContent.toString('base64')
        })
        .reply(201, { content: { sha: 'abc123' } });

      return handler(
        {
          token: token,
          user: user,
          repo: repo
        }, {
          'type': ['h-entry'],
          'properties': {
            'content': ['hello world'],
            'name': ['awesomeness is awesome'],
            'lang': ['en']
          },
          files: {
            photo: [{filename: 'foo.jpg', buffer: fileContent}]
          }
        },
        'http://example.com/foo/',
        handlerConfig
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
        'lang: en\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
      var base64 = encodedContent.toString('base64');

      var mock = nock('https://api.github.com/')
        .put(path, {
          message: 'uploading article',
          content: base64
        })
        .reply(422, {})

        .get(path)
        .reply(200, {sha: sha})

        .put(path, {
          message: 'uploading article',
          content: base64,
          sha: sha
        })
        .reply(201, { content: { sha: 'xyz789' } });

      return handler(
        {
          token: token,
          user: user,
          repo: repo
        }, {
          'type': ['h-entry'],
          'url': 'http://example.com/foo/2015/06/awesomeness-is-awesome/',
          'properties': {
            'content': ['hello world'],
            'name': ['awesomeness is awesome'],
            'lang': ['en']
          }
        },
        'http://example.com/foo/',
        handlerConfig
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
        'lang: en\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
      var base64 = encodedContent.toString('base64');

      var mock = nock('https://api.github.com/')
        .put(path, {
          message: 'uploading article',
          content: base64
        })
        .reply(422, {});

      return handler(
        {
          token: token,
          user: user,
          repo: repo
        }, {
          'type': ['h-entry'],
          'properties': {
            'content': ['hello world'],
            'name': ['awesomeness is awesome'],
            'lang': ['en']
          }
        },
        'http://example.com/foo/',
        handlerConfig
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
      var path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-51600.md';

      var encodedContent = new Buffer(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:20:00.000Z\'\n' +
        'title: \'\'\n' +
        'lang: en\n' +
        'slug: \'51600\'\n' +
        'category: social\n' +
        '---\n' +
        'hello world\n'
      );
      var base64 = encodedContent.toString('base64');

      var mock = nock('https://api.github.com/')
        .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .put(path, {
          message: 'uploading social interaction',
          content: base64
        })
        .reply(201, { content: { sha: 'abc123' } });

      return handler(
        {
          token: token,
          user: user,
          repo: repo
        }, {
          'type': ['h-entry'],
          'properties': {
            'content': ['hello world'],
            'lang': ['en']
          }
        },
        'http://example.com/foo/',
        handlerConfig
      )
        .then(function (url) {
          mock.done();
          url.should.equal('http://example.com/foo/social/2015/06/51600/');
        });
    });

    it('should format HTML to Markdown and send content', function () {
      var token = 'abc123';
      var user = 'username';
      var repo = 'repo';
      var path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-awesomeness-is-awesome.md';

      var encodedContent = new Buffer(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:20:00.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'lang: en\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        '**hello world**\n'
      );

      var mock = nock('https://api.github.com/')
        .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .put(path, {
          message: 'uploading article',
          content: encodedContent.toString('base64')
        })
        .reply(201, { content: { sha: 'abc123' } });

      return handler(
        {
          token: token,
          user: user,
          repo: repo
        }, {
          'type': ['h-entry'],
          'properties': {
            'content': [{
              'html': '<strong>hello world</strong>',
              'value': 'hello world'
            }],
            'name': ['awesomeness is awesome'],
            'lang': ['en']
          }
        },
        'http://example.com/foo/',
        handlerConfig
      )
        .then(function (url) {
          mock.done();
          url.should.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
        });
    });

    it('should support category deriving', function () {
      handlerConfig.deriveCategory = {
        'foo': 'abc = 123 AND foo = bar',
        'xyz': 'content[] = "hello world"'
      };

      return basicTest({
        content: (
          '---\n' +
          'layout: micropubpost\n' +
          'date: \'2015-06-30T14:20:00.000Z\'\n' +
          'title: awesomeness is awesome\n' +
          'lang: en\n' +
          'slug: awesomeness-is-awesome\n' +
          'category: xyz\n' +
          '---\n' +
          'hello world\n'
        ),
        message: 'uploading xyz',
        finalUrl: 'http://example.com/foo/xyz/2015/06/awesomeness-is-awesome/'
      });
    });
  });
});
