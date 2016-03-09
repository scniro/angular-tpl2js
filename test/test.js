var chai = require('chai');
var expect = chai.expect;
var tpl2js = require('..');
var engine = require('..').engine;
var path = require('path');

chai.should();

describe('tpl2js: init', function () {

    it('should init', function () {
        expect(tpl2js.inline).to.be.function;
    });
});

describe('tpl2js: engine', function () {

    it('should read the JS file: allow through', function (done) {
        var i = 0;

        engine.read('/test/fixtures/js/ng.module.basic.js').then(function () {
            i += 1;
            expect(i).to.equal(1);
            done();
        });
    });

    it('should read the JS file: verify results', function (done) {

        var expected = `angular.module('mod').directive('dir', function () {
                                return {
                                    scope: {},
                                    templateUrl: 'templates/ng.template.basic.html',
                                    link: function (scope, elem, attrs) {
                                    }
                                }
                            });`

        engine.read('/test/fixtures/js/ng.module.basic.js').then(function (data) {
            expect(data.replace(/ /g, '').replace(/(\r\n|\n|\r)/gm, '')).to.equal(expected.replace(/ /g, '').replace(/(\r\n|\n|\r)/gm, ''));
            done();
        });
    });

    it('should resolve the correct directive template hash: single file', function () {

        var base = '/test/fixtures/js'
        var raw = `angular.module('mod').directive('dir', function () {
                    return {
                        scope: {},
                        templateUrl: 'templates/ng.template.basic.html',
                        link: function (scope, elem, attrs) {
                        }
                    }
                });`;

        var expected = [path.normalize('fixtures/templates/ng.template.basic.html')];
        var hash = engine.getTemplateHash(raw, base)

        hash.forEach(function (element, index, arr) {
            arr[index] = path.relative(__dirname, hash[index])
        })

        expect(hash).to.deep.equal(expected);
    });

    it('should resolve the correct directive template hash: single file: minified', function () {

        var base = '/test/fixtures/js'
        var raw = 'angular.module("mod").directive("dir",function(){return{scope:{},templateUrl:"templates/ng.template.basic.html",link:function(e,t,l){}}});';
        var expected = [path.normalize('fixtures/templates/ng.template.basic.html')];
        var hash = engine.getTemplateHash(raw, base);
        hash.forEach(function (element, index, arr) {
            arr[index] = path.relative(__dirname, hash[index])
        });

        expect(hash).to.deep.equal(expected);
    });

    it('should resolve the correct directive template hash: multiple definitions: minified', function () {

        var base = '/test/fixtures/js'
        var raw = 'angular.module("mod").directive("dir",function(){return{scope:{},templateUrl:"templates/ng.template.basic.html",link:function(e,t,n){}}}),angular.module("mod").directive("dupe",function(){return{scope:{},templateUrl:"templates/ng.template.nested.parent.html",link:function(e,t,n){}}});';
        var expected = [path.normalize('fixtures/templates/ng.template.basic.html'), path.normalize('fixtures/templates/ng.template.nested.parent.html')];
        var hash = engine.getTemplateHash(raw, base);
        hash.forEach(function (element, index, arr) {
            arr[index] = path.relative(__dirname, hash[index])
        });

        expect(hash).to.deep.equal(expected);
    });

    it('should retrieve the templates: hash passed', function (done) {

        var hash = [__dirname + '/fixtures/templates/ng.template.basic.html', __dirname + '/fixtures/templates/ng.template.nested.parent.html'];

        engine.getTemplates(hash).then(function (templates) {
            templates.length.should.equal(2);
            done();
        });
    });

    it('should retrieve the templates: hash passed: correctly minify templates', function (done) {

        var expected = ['<span>basic {{ stuff }}</span>', '<div><span>some parent</span><div ng-include src="\'ng.template.nested.child.html\'"></div></div>']
        var hash = [__dirname + '/fixtures/templates/ng.template.basic.html', __dirname + '/fixtures/templates/ng.template.nested.parent.html'];

        engine.getTemplates(hash).then(function (templates) {
            expect(templates).to.deep.equal(expected);
            done();
        });
    });
});

describe('tpl2js: e2e', function () {
    it('should work/sanity check', function (done) {

        tpl2js.inline('/test/fixtures/js/ng.module.basic.js', {}, function () {
            done();
        });
    });
});

