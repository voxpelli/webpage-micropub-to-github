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

  var app, agent;

  beforeEach(function () {
    nock.disableNetConnect();

    // Needed so that supertest can connect to its own temporary local servers
    // Without it things blows up in a not so easy to debug way
    nock.enableNetConnect('127.0.0.1');

    app = express();
    app.use('/micropub', micropub());

    agent = request.agent(app);
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
      var token = 'abc123';

      var mock = nock('https://tokens.indieauth.com/')
        .matchHeader('Authorization', function (val) { return val && val[0] === 'Bearer ' + token; })
        .get('/token')
        .matchHeader('Content-Type', function (val) { return val && val[0] === 'application/x-www-form-urlencoded'; })
        .reply(
          200,
          'me=http%3A%2F%2Fkodfabrik.se%2F&issued_by=https%3A%2F%2Ftokens.indieauth.com%2Ftoken&client_id=http%3A%2F%2F127.0.0.1%3A8080%2F&issued_at=1435611612&scope=post&nonce=501574078',
          { 'Content-Type': 'application/x-www-form-urlencoded' }
        );

      agent
        .post('/micropub/thepost.se')
        .set('Authorization', 'Bearer ' + token)
        .type('form')
        .send({
          h: 'entry',
          content: 'hello world',
        })
        .expect(201, function (err) {
          if (err) { return done(err); }
          mock.done();
          done();
        });
    });

  });
});
