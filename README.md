# angular-tpl2js

[![Build Status](https://img.shields.io/travis/scniro/angular-tpl2js.svg?style=flat-square)](https://travis-ci.org/scniro/angular-tpl2js)
[![NPM Version](https://img.shields.io/npm/v/angular-tpl2js.svg?style=flat-square)](https://www.npmjs.com/package/angular-tpl2js)
[![Dependency Status](https://img.shields.io/david/scniro/angular-tpl2js.svg?label=deps&style=flat-square)](https://david-dm.org/scniro/angular-tpl2js)
[![devDependency Status](https://img.shields.io/david/dev/scniro/angular-tpl2js.svg?label=devDeps&style=flat-square)](https://david-dm.org/scniro/angular-tpl2js#info=devDependencies)

## Install

```
npm install angular-tpl2js --save-dev
```

## API

### inline(*path*, [*config*], *callback*)

```javascript
var tpl2js = require('angular-tpl2js');

tpl2js.inline('/js/directive.js', function (err, result) {

    // directive.js with inline template
});
```

#### config

`include` for retrieving [ng-include](https://docs.angularjs.org/api/ng/directive/ngInclude) templates and `HTMLMinifier`, a relay for [html-minifier](https://www.npmjs.com/package/html-minifier) options

```javascript
// defaults
var config = {
    include: false,
    HTMLMinifier: {
        collapseWhitespace: true,
        removeComments: true
    }
}
```

***

```javascript

tpl2js.inline('/js/directive.js', {include: true}, function (err, result) {

    // directive.js with inline template: ng-include parsed
});
```