/* jshint node: true */

'use strict';

var _ = require('lodash');
var fetch = require('node-fetch');
var VError = require('verror');

var GitHubPublisher = function (token, user, repo, branch) {
  this.token = token;
  this.user = user;
  this.repo = repo;
  this.branch = branch;
};

GitHubPublisher.prototype.getBaseHeaders = function () {
  return {
    'authorization': 'Bearer ' + this.token,
    'accept': 'application/vnd.github.v3+json',
    'user-agent': this.user,
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

  return fetch(url, options);
};

GitHubPublisher.prototype.base64 = function (text) {
  var data = new Buffer(text);
  return data.toString('base64');
};

//TODO: Refactor args list into something more compact
GitHubPublisher.prototype.publish = function (file, content) {
  var data = {
    message: 'new content',
    content: this.base64(content),
  };

  if (this.branch) {
    data.branch = this.branch;
  }

  //TODO: Handle error due to lack of/invalid pre-existing sha1 hash
  return this.putRequest('/repos/' + this.user + '/' + this.repo + '/contents/' + file, data)
    .then(function (res) {
      return res.json().then(function (body) {
        return {
          ok: res.ok,
          body: body,
        };
      });
    })
    .then(function (res) {
      if (!res.ok) {
        console.log('GitHub Error', res.body);
      }
      return res.ok;
    })
    .catch(function (err) {
      throw new VError(err, 'Failed to call GitHub');
    });
};

module.exports = GitHubPublisher;
