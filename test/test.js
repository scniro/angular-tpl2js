var chai = require('chai');
var engine = require('..').engine;
var expect = chai.expect;
var path = require('path');
var tpl2js = require('..');
var File = require('vinyl');
var fs = require('fs');

chai.should();

String.prototype.min = function () {
  return this.toString().replace(/ /g, '').replace(/(\r\n|\n|\r)/gm, '');
};

describe('tpl2js: engine', function () {

  it('should read the JS file: allow through', function (done) {
    var i = 0;

    engine.source.read('/test/fixtures/js/ng.module.basic.js').then(function () {
      i += 1;
      expect(i).to.equal(1);
      done();
    });
  });

  it('should read the JS file: verify results', function (done) {

    var expected = 'angular.module(\'mod\').directive(\'dir\', function () {' +
      'return {' +
      'scope: {},' +
      'templateUrl: \'templates/ng.template.basic.html\',' +
      'link: function (scope, elem, attrs) {' +
      '}' +
      '}' +
      '});';

    engine.source.read('/test/fixtures/js/ng.module.basic.js').then(function (actual) {
      expect(actual.min()).to.equal(expected.min());
      done();
    });
  });

  it('should resolve the correct directive template hash: single file', function () {

    var base = '/test/fixtures/js';
    var raw = 'angular.module(\'mod\').directive(\'dir\', function () {' +
      'return {' +
      'scope: {},' +
      'templateUrl: \'templates/ng.template.basic.html\',' +
      'link: function (scope, elem, attrs) {' +
      '}' +
      '}' +
      '});';

    var expected = [path.normalize('fixtures/templates/ng.template.basic.html')];
    var hash = engine.source.hash(raw, base)

    hash.templates.forEach(function (element, index, arr) {
      arr[index] = path.relative(__dirname, hash.templates[index])
    });

    expect(hash.templates).to.deep.equal(expected);
  });

  it('should resolve the correct directive template hash: single file: minified', function () {

    var base = '/test/fixtures/js'
    var raw = 'angular.module("mod").directive("dir",function(){return{scope:{},templateUrl:"templates/ng.template.basic.html",link:function(e,t,l){}}});';
    var expected = [path.normalize('fixtures/templates/ng.template.basic.html')];
    var hash = engine.source.hash(raw, base);
    hash.templates.forEach(function (element, index, arr) {
      arr[index] = path.relative(__dirname, hash.templates[index])
    });

    expect(hash.templates).to.deep.equal(expected);
  });

  it('should resolve the correct directive template hash: multiple definitions: minified', function () {

    var base = '/test/fixtures/js';
    var raw = 'angular.module("mod").directive("dir",function(){return{scope:{},templateUrl:"templates/ng.template.basic.html",link:function(e,t,n){}}}),angular.module("mod").directive("dupe",function(){return{scope:{},templateUrl:"templates/ng.template.nested.parent.html",link:function(e,t,n){}}});';
    var expected = [path.normalize('fixtures/templates/ng.template.basic.html'), path.normalize('fixtures/templates/ng.template.nested.parent.html')];
    var hash = engine.source.hash(raw, base);
    hash.templates.forEach(function (element, index, arr) {
      arr[index] = path.relative(__dirname, hash.templates[index])
    });

    expect(hash.templates).to.deep.equal(expected);
  });

  it('should retrieve the templates: hash passed', function (done) {

    var hash = {templates: [__dirname + '/fixtures/templates/ng.template.basic.html', __dirname + '/fixtures/templates/ng.template.nested.parent.html']};

    engine.templates.get(hash).then(function (transformed) {
      transformed.templates.length.should.equal(2);
      done();
    });
  });

  it('should retrieve the templates: hash passed: correctly minify templates: include=false', function (done) {

    var expected = ['<span>basic {{ stuff }}</span>', '<div><span>some parent</span><div ng-include="" src="\'ng.template.nested.child.html\'"></div></div>']
    var hash = {templates: [__dirname + '/fixtures/templates/ng.template.basic.html', __dirname + '/fixtures/templates/ng.template.nested.parent.html']};

    engine.config.set({});

    engine.templates.get(hash).then(function (transformed) {
      expect(transformed.templates).to.deep.equal(expected);
      done();
    });
  });

  it('should retrieve the templates: hash passed: correctly minify templates: include=true', function (done) {

    var expected = ['<span>basic {{ stuff }}</span>', '<div><span>some parent</span><div src="\'ng.template.nested.child.html\'"><div>some child</div></div></div>']
    var hash = {templates: [__dirname + '/fixtures/templates/ng.template.basic.html', __dirname + '/fixtures/templates/ng.template.nested.parent.html']};

    engine.config.set({include: true});

    engine.templates.get(hash).then(function (transformed) {
      expect(transformed.templates).to.deep.equal(expected);
      done();
    });
  });

  it('should retrieve the templates: hash passed: correctly minify templates: include=true, multiple parallel include', function (done) {

    var expected = ['<div><span>something</span><div src="\'ng.template.nested.child.html\'"><div>some child</div></div><span>something</span><div src="\'ng.template.nested.child.html\'"><div>some child</div></div><span>something</span><div src="\'ng.template.nested.child.html\'"><div>some child</div></div></div>']
    var hash = {templates: [__dirname + '/fixtures/templates/ng.template.includes.parallel.html']};

    engine.config.set({include: true});

    engine.templates.get(hash).then(function (transformed) {
      expect(transformed.templates).to.deep.equal(expected);
      done();
    });
  });

  it('should retrieve the templates: hash passed: correctly minify templates: includes=true, multiple staggered includes', function (done) {

    var expected = ['<div><span>something</span><div src="\'ng.template.nested.child.html\'"><div>some child</div></div><aside><div src="\'ng.template.nested.child.html\'"><div>some child</div></div></aside><footer><div><div src="\'ng.template.nested.child.html\'"><div>some child</div></div></div></footer></div>']
    var hash = {templates: [__dirname + '/fixtures/templates/ng.template.includes.staggered.html']};

    engine.config.set({include: true});

    engine.templates.get(hash).then(function (transformed) {
      expect(transformed.templates).to.deep.equal(expected);
      done();
    });
  });

  it('should retrieve the templates: hash passed: correctly minify templates: includes=true, deeply includes', function (done) {

    var expected = ['<div><span>something</span><div src="\'ng.template.includes.child.html\'"><div><p>paragraph</p><div src="\'ng.template.includes.grandchild.html\'"><div>grandchild</div></div></div></div></div>']
    var hash = {templates: [__dirname + '/fixtures/templates/ng.template.includes.parent.html']};

    engine.config.set({include: true});

    engine.templates.get(hash).then(function (transformed) {
      expect(transformed.templates).to.deep.equal(expected);
      done();
    });
  });

  it('should inject the correct template', function (done) {
    var expected = 'angular.module(\'mod\').directive(\'dir\', function () {' +
      'return {' +
      'scope: {},' +
      'template: \'<span>basic {{ stuff }}</span>\',' +
      'link: function (scope, elem, attrs) {' +
      '}' +
      '}' +
      '});';

    tpl2js.inline('/test/fixtures/js/ng.module.basic.js', {}, function (err, actual) {
      expect(actual.min()).to.equal(expected.min());
      done();
    });
  });

  it('should inject the correct template: duplicated', function (done) {
    var expected = 'angular.module(\'mod\').directive(\'dir\', function () {' +
      'return {' +
      'scope: {},' +
      'template: \'<span>basic {{ stuff }}</span>\',' +
      'link: function (scope, elem, attrs) {' +
      '}' +
      '}' +
      '});' +
      'angular.module(\'mod\').directive(\'dupe\', function () {' +
      'return {' +
      'scope: {},' +
      'template: \'<div>some child</div>\',' +
      'link: function (scope, elem, attrs) {' +
      '}' +
      '}' +
      '});';

    tpl2js.inline('/test/fixtures/js/ng.module.duplicated.js', {}, function (err, actual) {
      expect(actual.min()).to.equal(expected.min());
      done();
    });
  });

  it('should inject the template,templateUrl defined last on directive object', function (done) {

    var expected = 'angular.module(\'mod\').directive(\'dir\', function () {' +
      'return {' +
      'scope: {},' +
      'link: function (scope, elem, attrs) {' +
      '},' +
      'template: \'<span>basic {{ stuff }}</span>\',' +
      '}' +
      '});';

    tpl2js.inline('/test/fixtures/js/ng.module.variation.js', {}, function (err, actual) {
      expect(actual.min()).to.equal(expected.min());
      done();
    });
  });

  it('should set the configuration', function () {
    var expected = {
      include: true,
      HTMLMinifier: {
        collapseWhitespace: true,
        removeComments: true
      }
    };

    engine.config.set({
      include: true // false default
    });

    var actual = engine.config.get();
    expect(actual).to.deep.equal(expected);
  });

  it('should set the configuration: merge defaults', function () {
    var expected = {
      include: true,
      HTMLMinifier: {
        collapseWhitespace: true,
        removeComments: false
      }
    };

    engine.config.set({
      include: true,
      HTMLMinifier: {
        removeComments: false
      }
    });

    var actual = engine.config.get();
    expect(actual).to.deep.equal(expected);
  });

  it('should gracefully abort on a template that is not found - error exist', function (done) { // potentially retrn error?

    var i = 0;

    tpl2js.inline('/test/fixtures/js/ng.module.404.js', {}, function (err, actual) {
      i += 1;
      expect(err).to.exist;
      expect(i).to.equal(1);
      done();
    });
  });

  it('should execute logic regarded to buffer check', function (done) {

    var i = 0;

    var js = new File({
      path: '/nomatter',
      contents: new Buffer('angular.module(\'mod\').directive(\'dir\', function () { return { scope: {}, templateUrl: \'templates/ng.template.basic.html\', link: function (scope, elem, attrs) { } } });')
    });

    tpl2js.inline(js.contents, {target: '/nomatter'}, function (err, actual) {
      i += 1;
      expect(i).to.equal(1);
      done();
    });
  });

  it('should have no impact on directive file with double quote stynax usage', function (done) {

    var expected = 'angular.module("mod").directive("dir", function () {' +
      'return {' +
      'scope: {},' +
      'template: \'<span>basic {{ stuff }}</span>\',' +
      'link: function (scope, elem, attrs) {' +
      '}' +
      '}' +
      '});';

    tpl2js.inline('/test/fixtures/js/ng.module.doublequotes.js', {}, function (err, actual) {
      expect(actual.min()).to.equal(expected.min());
      done();
    });
  });

  it('should have no impact on named function link directive', function (done) {
    var expected =
      'function link(){' +
      'console.log(\'link\');' +
      '}' +
      'angular.module(\'mod\').directive(\'dir\', function () {' +
      'return {' +
      'scope: {},' +
      'template: \'<span>basic {{ stuff }}</span>\',' +
      'link: link' +
      '}' +
      '});';

    tpl2js.inline('/test/fixtures/js/ng.module.namedfunction.js', {}, function (err, actual) {
      expect(actual.min()).to.equal(expected.min());
      done();
    });
  });

  it('should gracefully abort on error encountered when setting a template - error exist', function (done) {

    var js = new File({
      path: '/nomatter',
      contents: new Buffer('this doesn\'t seem right!')
    });

    tpl2js.inline(js.contents, {target: '/nomatter'}, function (err, actual) {
      expect(err).to.exist && expect(err).to.equal('unable to set template: no templateUrl clause')
      done();
    });
  });
});

describe('tpl2js', function () {

  it('should init', function () {
    expect(tpl2js.inline).to.be.a('function');
    expect(engine).to.have.property('source');
    expect(engine).to.have.property('templates');
    expect(engine.templates).to.have.property('get');
    expect(engine.templates).to.have.property('set');
    expect(engine.source).to.have.property('hash');
    expect(engine.source).to.have.property('read');
    expect(engine.config).to.have.property('get');
    expect(engine.config).to.have.property('set');
  });

  it('should work/pass check', function (done) {
    tpl2js.inline('/test/fixtures/js/ng.module.nested.js', {}, function (err, actual) {
      expect(err).to.be.null;
      expect(actual).to.exist;
      done();
    });
  });

  it('should work/pass check: no config supplied', function (done) {
    tpl2js.inline('/test/fixtures/js/ng.module.nested.js', function (err, actual) {
      expect(err).to.be.null;
      expect(actual).to.exist;
      done();
    });
  });
});

