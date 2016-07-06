# Micropub to GitHub

[![Build Status](https://travis-ci.org/voxpelli/webpage-micropub-to-github.svg?branch=master)](https://travis-ci.org/voxpelli/webpage-micropub-to-github)
[![Coverage Status](https://coveralls.io/repos/voxpelli/webpage-micropub-to-github/badge.svg)](https://coveralls.io/r/voxpelli/webpage-micropub-to-github)
[![Dependency Status](https://gemnasium.com/voxpelli/webpage-micropub-to-github.svg)](https://gemnasium.com/voxpelli/webpage-micropub-to-github)

An endpoint that accepts [Micropub](http://micropub.net/) requests, formats them into [Jekyll](http://jekyllrb.com/) posts and pushes them to a configured GitHub repository.

Enables updating ones Jekyll blog through Micropub-supporting tools such as [Quill](https://quill.p3k.io/) and even through some [experimental iOS-flows](https://www.youtube.com/watch?v=CBPmSpD2jN4).

The Micropub protocol is part of the [IndieWeb](https://indieweb.org/) movement.

## Requirements

Requires at least Node.js 5.0.0.

## Setup

### On Heroku:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/voxpelli/webpage-micropub-to-github)

### Elsewhere:

Install it like a normal node.js application and adds the needed configuration through environment variables, either by copying the `sample.env` as `.env` and filling the values in there or by setting them through any other mechanism.

## Micropub endpoint discovery

After a successful deploy the standard endpoint can be found at the `/micropub/main` path where you deployed the application, like eg. `https://example.com/micropub/main`.

If you specified more than one site by using the `MICROPUB_SITES_JSON` variable, then each one of those will be available under the name of their key like `/micropub/key-name`.

You need to add proper discovery for [your Micropub endpoint](https://indieweb.org/micropub#Endpoint_Discovery) as well as [your token endpoint](https://indieweb.org/obtaining-an-access-token#Discovery) to your site to enable tools to discover what endpoints it should talk to.

## Current status

**Early alpha**

Supported:

* Creation of posts
* Uploading of media
* Replacing an existing post with a new version

Unsupported:

* Partial update
* Deletes

## Modules used

* [micropub-express](https://github.com/voxpelli/node-micropub-express) – an [Express](http://expressjs.com/) Micropub endpoint that accepts and verifies Micropub requests and calls a callback with a parsed `micropubDocument`
* [format-microformat](https://github.com/voxpelli/node-format-microformat) – a module that takes a `micropubDocument` as its input and then formats filenames, URL:s and file content from that data to a standard format which one then can publish elsewhere. Currently supports just a single Jekyll format.
* [github-publish](https://github.com/voxpelli/node-github-publish) – a module that takes a filename and content and publishes that to a GitHub repository. A useful place to send the formatted data that comes out of `format-microformat` to publish it to a GitHub hosted Jekyll blog like eg. a [GitHub Pages](https://pages.github.com/) one.

## Related

* [My 2015 in IndieWeb](http://voxpelli.com/2016/03/my-2015-in-indieweb/) post from 2016-03-12 by @voxpelli
* [miklb/jekyll-indieweb](https://github.com/miklb/jekyll-indieweb) – a Jekyll theme built with the IndieWeb in mind
* [voxpelli/voxpelli.github.com](https://github.com/voxpelli/voxpelli.github.com) – first Jekyll blog to use this Micropub endpoint
* [webmention.herokuapp.com](https://webmention.herokuapp.com/) – another IndieWeb project suited for Jekyll, this one for [Webmention](https://indieweb.org/webmention)
