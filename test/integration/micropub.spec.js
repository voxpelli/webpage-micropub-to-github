/* jshint node: true */
/* global beforeEach, afterEach, describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var nock = require('nock');
var request = require('supertest');

chai.use(chaiAsPromised);
chai.should();

describe('Micropub API', function () {
  var express = require('express');
  var micropub = require('../../lib/micropub.js');

  var app, agent, token;

  var mockTokenEndpoint = function (code, response) {
    return nock('https://tokens.indieauth.com/')
      .get('/token')
      .reply(
        code || 200,
        response || 'me=http%3A%2F%2Fkodfabrik.se%2F&scope=post',
        { 'Content-Type': 'application/x-www-form-urlencoded' }
      );
  };

  var doRequest = function (mock, done, code, content) {
    agent
      .post('/micropub/thepost.se')
      .set('Authorization', 'Bearer ' + token)
      .type('form')
      .send(content || {
        h: 'entry',
        content: 'hello world',
      })
      .expect(code || 201, function (err) {
        if (err) { return done(err); }
        mock.done();
        done();
      });
  };

  beforeEach(function () {
    nock.disableNetConnect();

    // Needed so that supertest can connect to its own temporary local servers
    // Without it things blows up in a not so easy to debug way
    nock.enableNetConnect('127.0.0.1');

    app = express();
    app.use('/micropub', micropub());

    agent = request.agent(app);

    token = 'abc123';
  });

  afterEach(function () {
    nock.cleanAll();
  });

  describe('basics', function () {

    // it('should not accept a GET-request', function (done) {
    //   agent.get('/micropub/thepost.se').expect(405, done);
    // });

    it('should require authorization', function (done) {
      agent
        .post('/micropub/thepost.se')
        .expect(401, 'Missing "Authorization" header or body parameter.', done);
    });


    it('should require h-field', function (done) {
      agent
        .post('/micropub/thepost.se')
        .set('Authorization', 'Bearer abc123')
        .expect(400, 'Missing "h" value.', done);
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
