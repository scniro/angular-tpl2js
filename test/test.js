var chai = require('chai');
var engine = require('..').engine;
var expect = chai.expect;
var path = require('path');
var tpl2js = require('..');

chai.should();

String.prototype.min = function () {
    return this.toString().replace(/ /g, '').replace(/(\r\n|\n|\r)/gm, '');
}

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

        var base = '/test/fixtures/js'
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
        })

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

        var base = '/test/fixtures/js'
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

    it('should retrieve the templates: hash passed: correctly minify templates', function (done) {

        var expected = ['<span>basic {{ stuff }}</span>', '<div><span>some parent</span><div ng-include src="\'ng.template.nested.child.html\'"></div></div>']
        var hash = {templates: [__dirname + '/fixtures/templates/ng.template.basic.html', __dirname + '/fixtures/templates/ng.template.nested.parent.html']};

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

        tpl2js.inline('/test/fixtures/js/ng.module.basic.js', {}, function (actual) {
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

        tpl2js.inline('/test/fixtures/js/ng.module.duplicated.js', {}, function (actual) {
            expect(actual.min()).to.equal(expected.min());
            done();
        });
    });
});

describe('tpl2js', function () {

    it('should init', function () {
        expect(tpl2js.inline).to.be.function;
        expect(engine).to.have.property('source');
        expect(engine).to.have.property('templates');
        expect(engine.templates).to.have.property('get');
        expect(engine.templates).to.have.property('set');
        expect(engine.source).to.have.property('hash');
        expect(engine.source).to.have.property('read');
    });

    it('should work/pass check', function (done) {
        tpl2js.inline('/test/fixtures/js/ng.module.nested.js', {}, function () {
            done();
        });
    });
});

