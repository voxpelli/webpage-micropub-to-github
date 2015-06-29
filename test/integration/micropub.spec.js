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
        .put('/micropub/thepost.se')
        .expect(401, 'Missing "Authorization" header or body parameter.', done);
    });


    it('should require h-field', function (done) {
      agent
        .put('/micropub/thepost.se')
        .set('Authorization', 'Bearer abc123')
        .expect(400, 'Missing "h" value.', done);
    });

    // it('should require h-field', function (done) {
    //   agent.put('/micropub/thepost.se').type('form').send({ h: 'entry' }).expect(401, done);
    // });

  });
});
