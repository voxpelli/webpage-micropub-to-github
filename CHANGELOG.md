# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 0.4.2 – 2017-01-28

* **Feature** – configurable syndication targets, see `sample.env` and #9
* **Improvement** – using new [microformat-express](https://github.com/voxpelli/node-micropub-express) version that is more spec compliant: JSON by default in query responses, better errors and support for space separated scopes
* **Updated** – dependencies has been updated

## 0.4.1 – 2017-01-21

* **Improvement** – using new `format-microformat` version that by default publish all posts in the past by 15 seconds to avoid time sync issues with build servers
* **Improvement** – now includes a Yarn lock file
* **Updated** – dependencies has been updated

## 0.4.0 - 2016-08-17

* **Feature** – derviced categories are now configurable
* **Somewhat breaking** – this project now requires Node.js 6.x

## 0.3.1 - 2016-07-30

* **Bug fix** – the caching of the auto-configuration didn't work

## 0.3.0 - 2016-07-30

* **Feature** – permalinks are now configurable
* **Feature** – this project now autoconfigures eg. the permalink style based on a sites `_config.yml` file
* **Somewhat breaking** – as this project now respects the actual permalink configuration it will now default to other permalink styles than before

## 0.2.0 - 2016-07-06

- Initial public release
