/* jshint node: true */
/* global beforeEach, afterEach, describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var nock = require('nock');

chai.use(chaiAsPromised);

// var should = chai.should();
chai.should();

describe('Formatter', function () {
  var GitHubPublisher = require('../lib/github.js');

  beforeEach(function () {
    nock.disableNetConnect();
  });

  afterEach(function () {
    nock.cleanAll();
  });

  describe('publish', function () {

    it('should send the content to GitHub', function () {
      var token = 'abc123';
      var user = 'username';
      var repo = 'repo';
      var file = 'test.txt';
      var content = 'Morbi leo risus, porta ac consectetur ac, vestibulum at.';
      var base64 = 'TW9yYmkgbGVvIHJpc3VzLCBwb3J0YSBhYyBjb25zZWN0ZXR1ciBhYywgdmVzdGlidWx1bSBhdC4=';
      var path = '/repos/' + user + '/' + repo + '/contents/' + file;

      var publisher = new GitHubPublisher(token, user, repo);

      var mock = nock('https://api.github.com/')
        .matchHeader('user-agent',    function (val) { return val && val[0] === user; })
        .matchHeader('authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .matchHeader('accept',        function (val) { return val && val[0] === 'application/vnd.github.v3+json'; })
        .put(path, {
          message: 'new content',
          content: base64,
        })
        .reply(201, {});

      return publisher.publish(file, content).then(function (result) {
        mock.done();
        result.should.equal(true);
      });
    });

    it('should handle errors from GitHub', function () {
      var token = 'abc123';
      var user = 'username';
      var repo = 'repo';
      var file = 'test.txt';
      var content = 'Morbi leo risus, porta ac consectetur ac, vestibulum at.';
      var path = '/repos/' + user + '/' + repo + '/contents/' + file;

      var publisher = new GitHubPublisher(token, user, repo);

      var mock = nock('https://api.github.com/')
        .put(path)
        .reply(422, {});

      return publisher.publish(file, content).then(function (result) {
        mock.done();
        result.should.equal(false);
      });
    });

  });
});
