/* jshint node: true */

'use strict';

var _ = require('lodash');
var fetch = require('node-fetch');
var VError = require('verror');

var GitHubPublisher = function (token) {
  this.token = token;
};

GitHubPublisher.prototype.getBaseHeaders = function () {
  return {
    'authorization': 'Bearer ' + this.token,
    'accept': 'application/vnd.github.v3+json',
    'user-agent': 'voxpelli', //TODO: Improve!
  };
};

GitHubPublisher.prototype.putRequest = function (path, data) {
  var options = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: _.assign({
      'content-type': 'application/json',
    }, this.getBaseHeaders()),
  };

  var url = 'https://api.github.com' + path;

  console.log(url, options);

  return fetch(url, options);
};

GitHubPublisher.prototype.base64 = function (text) {
  var data = new Buffer(text);
  return data.toString('base64');
};

//TODO: Refactor args list into something more compact
GitHubPublisher.prototype.publish = function () {//name, target, content, template) {
  var owner = 'voxpelli';
  var repo = 'webpage-thepost-se';
  var path = 'world.txt';
  var data = {
    message: 'feat(main): hello world',
    content: this.base64('Hello World!'),
    // branch: 'master',
  };

  //TODO: Handle error due to lack of/invalid pre-existing sha1 hash
  return this.putRequest('/repos/' + owner + '/' + repo + '/contents/' + path, data)
    .then(function (res) {
      console.log(res.ok);
      console.log(res.status);
      console.log(res.statusText);
      console.log(res.headers.raw());
      console.log(res.headers.get('content-type'));
      return res.json();
    })
    .then(function (data) {
      console.log(data);
    })
    .catch(function (err) {
      throw new VError(err, 'Failed to call GitHub');
    });
};

module.exports = GitHubPublisher;
