# Micropub to GitHub
[![Build Status](https://travis-ci.org/voxpelli/webpage-micropub-to-github.svg?branch=master)](https://travis-ci.org/voxpelli/webpage-micropub-to-github)
[![Coverage Status](https://coveralls.io/repos/github/voxpelli/webpage-micropub-to-github/badge.svg?branch=master)](https://coveralls.io/github/voxpelli/webpage-micropub-to-github?branch=master)
[![dependencies Status](https://david-dm.org/voxpelli/webpage-micropub-to-github/status.svg)](https://david-dm.org/voxpelli/webpage-micropub-to-github)
[![Known Vulnerabilities](https://snyk.io/test/github/voxpelli/webpage-micropub-to-github/badge.svg?targetFile=package.json)](https://snyk.io/test/github/voxpelli/webpage-micropub-to-github?targetFile=package.json)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat)](https://github.com/Flet/semistandard)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fvoxpelli%2Fwebpage-micropub-to-github.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fvoxpelli%2Fwebpage-micropub-to-github?ref=badge_shield)

An endpoint that accepts [Micropub](http://micropub.net/) requests, formats them into [Jekyll](http://jekyllrb.com/) posts before pushing them to a configured GitHub repository. This enables updating a Jekyll blog through a [Micropub client](https://indieweb.org/Micropub/Clients).

### _Early alpha_
Supported:
* Creation of posts
* Uploading of media
* Replacing an existing post with a new version

Unsupported:
* Partial update
* Deletes

## Requirements
Requires at least Node.js 6.0.0.

This project contains a [https://yarnpkg.com/](Yarn) lock file which is a faster and more secure alternative to the npm client.

## Installation
Install as a normal Node.js application. Add the required [configuration](#configuration) values via environment variables or similar mechanism. Or deploy to Heroku:

[![Deploy heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/voxpelli/webpage-micropub-to-github)

### Deploy to now

1. Install [now cli](https://zeit.co/download).
2. Edit `now.json` to have right values relevant for your project. 
   Especially make sure to change the `alias` to something unique.
3. Run `now secret add micropub-github-token <yourtoken>` to setup secret.
4. Run `now` to do deployment to now.
5. Run `now alias`

This will setup a url endpoint i.e. `https://mysite-micropub.now.sh/micropub/main`
you can then use in your site.

Note: this uses version1 of now that is based on full Docker. You'll
get warnings about this but it is okey - things still works.

## Endpoint discovery
Once deployed, your Micropub endpoint can be found at `/micropub/main` e.g. `https://example.com/micropub/main`.

If you specified more than one site using the `MICROPUB_SITES_JSON` variable, then each endpoint will be available under the name of its respective key, i.e. `/micropub/key-name`.

To enable automatic discovery for your [Micropub endpoint](https://indieweb.org/micropub#Endpoint_Discovery) and [token endpoint](https://indieweb.org/obtaining-an-access-token#Discovery), you will need to add the following values to your site's `<head>`:

```
<link rel="micropub" href="https://example.com/micropub/main">
<link rel="token_endpoint" href="https://tokens.indieauth.com/token">
```

## Configuration
### Required values
The following variables are required to enable a Micropub client to push content to your GitHub repository.

Variable | Description
-------- | -----------
`MICROPUB_TOKEN_ENDPOINT` | URL to verify Micropub token. Example: `https://tokens.indieauth.com/token`
`MICROPUB_TOKEN_ME` | URL to identify Micropub user. Example: `https://johndoe.example`
`MICROPUB_GITHUB_TOKEN` | [GitHub access token](https://github.com/settings/tokens) to grant access to repository. Example: `12345abcde67890fghij09876klmno54321pqrst`
`MICROPUB_GITHUB_USER` | Username/organisation that owns repository. Example: `johndoe`
`MICROPUB_SITE_GITHUB_REPO` | GitHub repository in which site files are found. Example: `johndoe.github.io`
`MICROPUB_SITE_URL` | URL where site is published. Example: `https://johndoe.example`

### Syndication
The following variables can be used to set [syndication target(s)](https://www.w3.org/TR/micropub/#syndication-targets).

Variable | Description
-------- | -----------
`MICROPUB_SITE_SYNDICATE_TO_UID` | Unique identifier of syndication target. Example: `https://social.example/johndoe`
`MICROPUB_SITE_SYNDICATE_TO_NAME` | User readable name of syndication target. Example: `@johndoe on Example Social Network`
`MICROPUB_SITE_SYNDICATE_TO` | Complex syndication target. Provided as a JSON array, e.g.: `[{"uid":"https://social.example/johndoe","name":"@johndoe on Example Social Network","service":{"name":"Example Social Network","url":"https://social.example/","photo":"https://social.example/icon.png"},"user":{"name":"johndoe","url":"https://social.example/johndoe","photo":"https://social.example/johndoe/photo.jpg"}}]`. Not compatible with `MICROPUB_SITES_JSON`.

### Output style
The following variables allow you to configure the name and destination for files pushed to your repository. These variables will also accept conditional values ([described below](#conditional-values)).

Variable | Description
-------- | -----------
`MICROPUB_FILENAME_STYLE` | File name and path for post.  Example: `_posts/:year-:month-:day-:slug`
`MICROPUB_MEDIA_FILES_STYLE` | File name and path for media files. Example: `media/:year-:month-:slug/:filesslug`
`MICROPUB_PERMALINK_STYLE` | [Jekyll permalink style](http://jekyllrb.com/docs/permalinks/). Example: `/:categories/:year/:month/:title/`
`MICROPUB_LAYOUT_NAME` | The name of the Jekyll layout to use for the posts. Set to `false` to have no layout be added. Defaults to `microblogpost`
`MICROPUB_OPTION_DERIVE_CATEGORY` | Override the default category
`MICROPUB_GITHUB_BRANCH` | Branch to use for pushes. Useful to test out if things end up where you want them to. Example: `micropub`

#### Complex output styles

These configuration options can all be given different values for different types of content by setting up conditions under which each configuration applies. See [conditional values](#conditional-values).

### Complex configuration
Variable | Description
-------- | -----------
`MICROPUB_SITES_JSON` | Complex settings and/or multiple sites (including their syndication targets) provided as JSON, e.g.: `'{"site1":{"url":"https://site1.example/","github":{"repo":"site1"},"token":[{"endpoint":"https://tokens.indieauth.com/token","me":"https://site1.example/"}]},"site2":{"url":"http://site2.example/","github":{"repo":"site2"},"token":[{"endpoint":"https://tokens.indieauth.com/token","me":"http://site2.example/"}]}}'`
`MICROPUB_OPTION_NO_AUTO_CONFIGURE` | Auto-configure permalink status from the Jekyll repo config. Boolean
`MICROPUB_OPTION_DERIVE_LANGUAGES` | Comma separated list of language codes to auto-detect. Example `eng,swe`
`MICROPUB_HOST` | Domain name to enforce. Will redirect requests to all other domain names and IP addresses that the endpoint can be accessed on.

### Conditional values

Conditions are set up by assessing the environment variables using a JSON object of the format:

```json
[
  {
    "condition": "bookmark OR name",
    "value": "value-one"
  },
  {
    "condition": "bookmark OR name",
    "value": "value-two"
  }
]
```

Conditions are [fulfills expressions](https://github.com/voxpelli/node-fulfills#condition-syntax) that apply to the properties of the document being saved. Pretty much any property that can be inserted into a YAML front matter can be matched against. All values explicitly set in the Micropub request are available, but some defaults and derived values may not be available, depending on the option configured.

_Please [open an issue](https://github.com/voxpelli/webpage-micropub-to-github/issues/new) and let me know what conditions you would like to set up._

## Modules used
* [micropub-express](https://github.com/voxpelli/node-micropub-express) – an [Express](http://expressjs.com/) Micropub endpoint that accepts and verifies Micropub requests and calls a callback with a parsed `micropubDocument`.
* [format-microformat](https://github.com/voxpelli/node-format-microformat) – a module that takes a `micropubDocument` as its input, and converts this data into a standard that can be published elsewhere. Currently supports the Jekyll format.
* [github-publish](https://github.com/voxpelli/node-github-publish) – a module that takes a filename and content and publishes it to a GitHub repository. The formatted data generated by `format-microformat` can be published to a Jekyll blog hosted on a GitHub, or a [GitHub Pages](https://pages.github.com/) site.

## Related
* [My 2015 in IndieWeb](http://voxpelli.com/2016/03/my-2015-in-indieweb/) – post from 2016-03-12 by @voxpelli
* [miklb/jekyll-indieweb](https://github.com/miklb/jekyll-indieweb) – a Jekyll theme built with the IndieWeb in mind
* [voxpelli/voxpelli.github.com](https://github.com/voxpelli/voxpelli.github.com) – first Jekyll blog to use this Micropub endpoint
* [webmention.herokuapp.com](https://webmention.herokuapp.com/) – another IndieWeb project suited for Jekyll, this one for [Webmention](https://indieweb.org/webmention)


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fvoxpelli%2Fwebpage-micropub-to-github.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fvoxpelli%2Fwebpage-micropub-to-github?ref=badge_large)
