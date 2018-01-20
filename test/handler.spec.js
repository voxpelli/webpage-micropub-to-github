'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const sinon = require('sinon');

chai.use(chaiAsPromised);
chai.should();

describe('Handler', function () {
  const handler = require('../lib/handler.js');
  let handlerConfig;
  let clock;

  const basicTest = function ({ content, message, finalUrl, filename }) {
    const token = 'abc123';
    const user = 'username';
    const repo = 'repo';

    filename = filename || '_posts/2015-06-30-awesomeness-is-awesome.md';

    const path = '/repos/' + user + '/' + repo + '/contents/' + filename;

    const encodedContent = Buffer.from(content || (
      '---\n' +
      'layout: micropubpost\n' +
      'date: \'2015-06-30T14:19:45.000Z\'\n' +
      'title: awesomeness is awesome\n' +
      'lang: en\n' +
      'slug: awesomeness-is-awesome\n' +
      '---\n' +
      'hello world\n'
    )).toString('base64');

    const mock = nock('https://api.github.com/')
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
    nock.cleanAll();
    nock.disableNetConnect();
    clock = sinon.useFakeTimers(1435674000000);
    handlerConfig = {
      noAutoConfigure: true,
      permalinkStyle: '/:categories/:year/:month/:title/'
    };
  });

  afterEach(function () {
    clock.restore();
    if (!nock.isDone()) {
      throw new Error('pending nock mocks: ' + nock.pendingMocks());
    }
  });

  describe('main', function () {
    it('should format and send content', function () {
      return basicTest({});
    });

    it('should upload files prior to content', function () {
      const token = 'abc123';
      const user = 'username';
      const repo = 'repo';
      const repoPath = '/repos/' + user + '/' + repo + '/contents/';
      const mediaFilename = 'foo.jpg';

      const fileContent = Buffer.from('abc123');

      const encodedContent = Buffer.from(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:19:45.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'lang: en\n' +
        'slug: awesomeness-is-awesome\n' +
        'mf-photo:\n' +
        '  - \'http://example.com/foo/media/2015-06-awesomeness-is-awesome/' + mediaFilename + '\'\n' +
        '---\n' +
        'hello world\n'
      );

      const mock = nock('https://api.github.com/')
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
      const token = 'abc123';
      const user = 'username';
      const repo = 'repo';
      const path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-awesomeness-is-awesome.md';
      const sha = 'abc123';

      const encodedContent = Buffer.from(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:19:45.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'lang: en\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
      const base64 = encodedContent.toString('base64');

      const mock = nock('https://api.github.com/')
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
      const token = 'abc123';
      const user = 'username';
      const repo = 'repo';
      const path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-awesomeness-is-awesome.md';

      const encodedContent = Buffer.from(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:19:45.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'lang: en\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
      const base64 = encodedContent.toString('base64');

      const mock = nock('https://api.github.com/')
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
      const token = 'abc123';
      const user = 'username';
      const repo = 'repo';
      const path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-51585.md';

      const encodedContent = Buffer.from(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:19:45.000Z\'\n' +
        'title: \'\'\n' +
        'lang: en\n' +
        'slug: \'51585\'\n' +
        'category: social\n' +
        '---\n' +
        'hello world\n'
      );
      const base64 = encodedContent.toString('base64');

      const mock = nock('https://api.github.com/')
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
          url.should.equal('http://example.com/foo/social/2015/06/51585/');
        });
    });

    it('should format HTML to Markdown and send content', function () {
      const token = 'abc123';
      const user = 'username';
      const repo = 'repo';
      const path = '/repos/' + user + '/' + repo + '/contents/_posts/2015-06-30-awesomeness-is-awesome.md';

      const encodedContent = Buffer.from(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:19:45.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'lang: en\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        '**hello world**\n'
      );

      const mock = nock('https://api.github.com/')
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
      handlerConfig.deriveCategory = [
        { value: 'foo', condition: 'abc = 123 AND foo = bar' },
        { value: 'xyz', condition: 'content[] = "hello world"' }
      ];

      return basicTest({
        content: (
          '---\n' +
          'layout: micropubpost\n' +
          'date: \'2015-06-30T14:19:45.000Z\'\n' +
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

    it('should support custom layout deriving', function () {
      handlerConfig.layoutName = [
        { value: 'foo', condition: 'abc = 123 AND foo = bar' },
        { value: 'xyz', condition: 'content[] = "hello world"' }
      ];

      return basicTest({
        content: (
          '---\n' +
          'layout: xyz\n' +
          'date: \'2015-06-30T14:19:45.000Z\'\n' +
          'title: awesomeness is awesome\n' +
          'lang: en\n' +
          'slug: awesomeness-is-awesome\n' +
          '---\n' +
          'hello world\n'
        )
      });
    });

    it('should support simple custom layout', function () {
      handlerConfig.layoutName = 'simple';

      return basicTest({
        content: (
          '---\n' +
          'layout: simple\n' +
          'date: \'2015-06-30T14:19:45.000Z\'\n' +
          'title: awesomeness is awesome\n' +
          'lang: en\n' +
          'slug: awesomeness-is-awesome\n' +
          '---\n' +
          'hello world\n'
        )
      });
    });

    it('should support layout-less', function () {
      handlerConfig.layoutName = false;

      return basicTest({
        content: (
          '---\n' +
          'date: \'2015-06-30T14:19:45.000Z\'\n' +
          'title: awesomeness is awesome\n' +
          'lang: en\n' +
          'slug: awesomeness-is-awesome\n' +
          '---\n' +
          'hello world\n'
        )
      });
    });

    it('should support callback based permalink style', function () {
      handlerConfig.permalinkStyle = [
        { value: 'first/:slug', condition: 'content[] = "hello world"' },
        { value: 'second/:slug', condition: 'abc = 123 AND foo = bar' }
      ];

      return basicTest({
        content: (
          '---\n' +
          'layout: micropubpost\n' +
          'date: \'2015-06-30T14:19:45.000Z\'\n' +
          'title: awesomeness is awesome\n' +
          'lang: en\n' +
          'slug: awesomeness-is-awesome\n' +
          '---\n' +
          'hello world\n'
        ),
        finalUrl: 'http://example.com/foo/first/awesomeness-is-awesome'
      });
    });

    it('should support callback based filename style', function () {
      handlerConfig.filenameStyle = [
        { value: 'first/:slug', condition: 'abc = 123 AND foo = bar' },
        { value: 'second/:slug', condition: 'content[] = "hello world"' }
      ];

      return basicTest({
        content: (
          '---\n' +
          'layout: micropubpost\n' +
          'date: \'2015-06-30T14:19:45.000Z\'\n' +
          'title: awesomeness is awesome\n' +
          'lang: en\n' +
          'slug: awesomeness-is-awesome\n' +
          '---\n' +
          'hello world\n'
        ),
        filename: 'second/awesomeness-is-awesome.md'
      });
    });
  });
});
