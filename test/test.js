var chai = require('chai');
var expect = chai.expect;
var tpl2js = require('..');
var engine = require('..').engine;

chai.should();

describe('tpl2js: init', function () {

    it('should init', function () {
        expect(tpl2js.inline).to.be.function;
    });
});

describe('tpl2js: engine', function () {

    it('should read the JS file: allow through', function (done) {
        var i = 0;

        engine.read('/test/fixtures/js/ng.module.basic.js', function () {
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

        engine.read('/test/fixtures/js/ng.module.basic.js', function (data) {
            expect(data.replace(/ /g, '').replace(/(\r\n|\n|\r)/gm, '')).to.equal(expected.replace(/ /g, '').replace(/(\r\n|\n|\r)/gm, ''));
            done();
        });
    });

    it('should resolve the correct directive template hash: single file', function () {

        var raw = `angular.module('mod').directive('dir', function () {
                    return {
                        scope: {},
                        templateUrl: 'templates/ng.template.basic.html',
                        link: function (scope, elem, attrs) {
                        }
                    }
                });`;
        var expected = ['templates/ng.template.basic.html'];
        var hash = engine.getDirectiveTemplateHash(raw)

        expect(hash).to.deep.equal(expected);
    });

    it('should resolve the correct directive template hash: single file: minified', function () {

        var raw = 'angular.module("mod").directive("dir",function(){return{scope:{},templateUrl:"templates/ng.template.basic.html",link:function(e,t,l){}}});';
        var expected = ['templates/ng.template.basic.html'];
        var hash = engine.getDirectiveTemplateHash(raw);

        expect(hash).to.deep.equal(expected);
    });

    it('should resolve the correct directive template hash: multiple definitions: minified', function () {

        var raw = 'angular.module("mod").directive("dir",function(){return{scope:{},templateUrl:"templates/ng.template.basic.html",link:function(e,t,n){}}}),angular.module("mod").directive("dupe",function(){return{scope:{},templateUrl:"templates/ng.template.nested.parent.html",link:function(e,t,n){}}});';
        var expected = ['templates/ng.template.basic.html', 'templates/ng.template.nested.parent.html'];
        var hash = engine.getDirectiveTemplateHash(raw);

        expect(hash).to.deep.equal(expected);
    });
});

