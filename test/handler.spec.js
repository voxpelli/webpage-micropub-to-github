'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const sinon = require('sinon');

chai.use(chaiAsPromised);
chai.should();

describe('Handler', () => {
  const handler = require('../lib/handler.js');
  let handlerConfig;
  let clock;

  const basicTest = function ({ content, message, finalUrl, filename, contentInput } = {}) {
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
      .matchHeader('authorization', val => val && val[0] === 'Bearer ' + token)
      .put(path, {
        message: message || 'uploading article',
        content: encodedContent
      })
      .reply(201, { content: { sha: 'abc123' } });

    return handler(
      {
        token,
        user,
        repo
      },
      {
        'type': ['h-entry'],
        'properties': {
          'content': [contentInput || 'hello world'],
          'name': ['awesomeness is awesome'],
          'lang': ['en']
        }
      },
      'http://example.com/foo/',
      handlerConfig
    )
      .then(url => {
        mock.done();
        url.should.equal(finalUrl || 'http://example.com/foo/2015/06/awesomeness-is-awesome/');
      });
  };

  beforeEach(() => {
    nock.cleanAll();
    nock.disableNetConnect();
    clock = sinon.useFakeTimers(1435674000000);
    handlerConfig = {
      // Enable to help with debugging of wrongly formatted content
      // verbose: true,
      noAutoConfigure: true,
      permalinkStyle: '/:categories/:year/:month/:title/'
    };
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
    if (!nock.isDone()) {
      throw new Error('pending nock mocks: ' + nock.pendingMocks());
    }
  });

  describe('main', () => {
    it('should format and send content', () => {
      return basicTest();
    });

    it('should upload files prior to content', () => {
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
        .matchHeader('authorization', val => val && val[0] === 'Bearer ' + token)
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
          token,
          user,
          repo
        }, {
          'type': ['h-entry'],
          'properties': {
            'content': ['hello world'],
            'name': ['awesomeness is awesome'],
            'lang': ['en']
          },
          files: {
            photo: [{ filename: 'foo.jpg', buffer: fileContent }]
          }
        },
        'http://example.com/foo/',
        handlerConfig
      )
        .then(url => {
          mock.done();
          url.should.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
        });
    });

    it('should override existing content if matching URL', () => {
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
        .reply(200, { sha })

        .put(path, {
          message: 'uploading article',
          content: base64,
          sha
        })
        .reply(201, { content: { sha: 'xyz789' } });

      return handler(
        {
          token,
          user,
          repo
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
        .then(url => {
          mock.done();
          url.should.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
        });
    });

    it('should not override existing content if no matching URL', () => {
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
          token,
          user,
          repo
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
        .then(url => {
          mock.done();
          url.should.equal(false);
        });
    });

    it('should set a custom commit message when formatter returns a category', () => {
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
        .matchHeader('authorization', val => val && val[0] === 'Bearer ' + token)
        .put(path, {
          message: 'uploading social interaction',
          content: base64
        })
        .reply(201, { content: { sha: 'abc123' } });

      return handler(
        {
          token,
          user,
          repo
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
        .then(url => {
          mock.done();
          url.should.equal('http://example.com/foo/social/2015/06/51585/');
        });
    });

    it('should format HTML to Markdown and send content', () => {
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
        .matchHeader('authorization', val => val && val[0] === 'Bearer ' + token)
        .put(path, {
          message: 'uploading article',
          content: encodedContent.toString('base64')
        })
        .reply(201, { content: { sha: 'abc123' } });

      return handler(
        {
          token,
          user,
          repo
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
        .then(url => {
          mock.done();
          url.should.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
        });
    });

    it('should support category deriving', () => {
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

    it('should support custom layout deriving', () => {
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

    it('should support simple custom layout', () => {
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

    it('should support layout-less', () => {
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

    it('should support callback based permalink style', () => {
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

    it('should support callback based filename style', () => {
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

    it('should correctly HTML-encode text input', () => {
      return basicTest({
        contentInput: 'world < hello',
        content: (
          '---\n' +
          'layout: micropubpost\n' +
          'date: \'2015-06-30T14:19:45.000Z\'\n' +
          'title: awesomeness is awesome\n' +
          'lang: en\n' +
          'slug: awesomeness-is-awesome\n' +
          '---\n' +
          'world &lt; hello\n'
        )
      });
    });

    it('should support HTML-encode opt out', () => {
      handlerConfig.encodeHTML = false;

      return basicTest({
        contentInput: 'world < hello',
        content: (
          '---\n' +
          'layout: micropubpost\n' +
          'date: \'2015-06-30T14:19:45.000Z\'\n' +
          'title: awesomeness is awesome\n' +
          'lang: en\n' +
          'slug: awesomeness-is-awesome\n' +
          '---\n' +
          'world < hello\n'
        )
      });
    });
  });
});
