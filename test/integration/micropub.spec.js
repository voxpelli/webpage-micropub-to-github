/* jshint node: true */
/* global beforeEach, afterEach, describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var nock = require('nock');
var request = require('supertest');
var sinon = require('sinon');
require('sinon-as-promised');

chai.use(chaiAsPromised);
chai.should();

describe('Micropub API', function () {
  var express = require('express');
  var micropub = require('../../lib/micropub.js');

  var app, agent, token, handlerStub;

  var mockTokenEndpoint = function (code, response) {
    return nock('https://tokens.indieauth.com/')
      .get('/token')
      .reply(
        code || 200,
        response || 'me=http%3A%2F%2Fkodfabrik.se%2F&scope=post',
        { 'Content-Type': 'application/x-www-form-urlencoded' }
      );
  };

  var doRequest = function (mock, done, code, content, response) {
    var req = agent
      .post('/micropub')
      .set('Authorization', 'Bearer ' + token)
      .type('form')
      .send(content || {
        h: 'entry',
        content: 'hello world',
      });

    if (response) {
      req = req.expect(code || 201, response);
    } else {
      req = req.expect(code || 201);
    }

    req.end(function (err) {
      if (err) { return done(err); }
      if (mock) { mock.done(); }
      done();
    });
  };

  beforeEach(function () {
    nock.disableNetConnect();

    // Needed so that supertest can connect to its own temporary local servers
    // Without it things blows up in a not so easy to debug way
    nock.enableNetConnect('127.0.0.1');

    token = 'abc123';
    handlerStub = sinon.stub().resolves({
      url: 'http://example.com/', //TODO: Set actual resolve URL
    });

    app = express();
    app.use('/micropub', micropub({
      handler: handlerStub,
      token: {
        me: 'http://kodfabrik.se/',
        endpoint: 'https://tokens.indieauth.com/token',
      },
    }));

    agent = request.agent(app);
  });

  afterEach(function () {
    nock.cleanAll();
  });

  describe('basics', function () {

    // it('should not accept a GET-request', function (done) {
    //   agent.get('/micropub').expect(405, done);
    // });

    it('should require authorization', function (done) {
      agent
        .post('/micropub')
        .expect(401, 'Missing "Authorization" header or body parameter.', done);
    });

    it('should require h-field', function (done) {
      agent
        .post('/micropub')
        .set('Authorization', 'Bearer abc123')
        .expect(400, 'Missing "h" value.', done);
    });

    it('should refuse update requests', function (done) {
      doRequest(false, done, 501, { 'edit-of': 'http://example.com/foo' }, 'This endpoint does not yet support updates.');
    });

    it('should refuse delete requests', function (done) {
      doRequest(false, done, 501, { 'delete-of': 'http://example.com/foo' }, 'This endpoint does not yet support deletions.');
    });

  });

  describe('auth', function () {

    it('should call handler and return 201 on successful request', function (done) {
      var mock = nock('https://tokens.indieauth.com/')
        .matchHeader('Authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .matchHeader('Content-Type', function (val) { return val && val[0] === 'application/x-www-form-urlencoded'; })
        .get('/token')
        .reply(
          200,
          'me=http%3A%2F%2Fkodfabrik.se%2F&issued_by=https%3A%2F%2Ftokens.indieauth.com%2Ftoken&client_id=http%3A%2F%2F127.0.0.1%3A8080%2F&issued_at=1435611612&scope=post&nonce=501574078',
          { 'Content-Type': 'application/x-www-form-urlencoded' }
        );

      doRequest(mock, done);
    });

    it('should return error on invalid token', function (done) {
      var mock = mockTokenEndpoint(400, 'error=unauthorized&error_description=The+token+provided+was+malformed');
      doRequest(mock, done, 403);
    });

    it('should return error on mismatching me', function (done) {
      var mock = mockTokenEndpoint(200, 'me=http%3A%2F%2Fvoxpelli.com%2F&scope=post');
      doRequest(mock, done, 403);
    });

    it('should return error on missing post scope', function (done) {
      var mock = mockTokenEndpoint(200, 'me=http%3A%2F%2Fkodfabrik.se%2F&scope=misc');
      doRequest(mock, done, 403);
    });

    it('should handle multiple scopes', function (done) {
      var mock = mockTokenEndpoint(200, 'me=http%3A%2F%2Fkodfabrik.se%2F&scope=post,misc');
      doRequest(mock, done);
    });

  });

  describe('create', function () {

    it('should require content', function (done) {
      var mock = mockTokenEndpoint(200, 'me=http%3A%2F%2Fkodfabrik.se%2F&scope=post,misc');
      doRequest(mock, done, 400, {
        h: 'entry',
      });
    });

  });

});
