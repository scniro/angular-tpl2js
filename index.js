var fs = require('fs');
var path = require('path');
var minify = require('html-minifier').minify;
var engine = new TemplateEngine();
var async = require('async');

function TemplateEngine() {

    var self = this;

    function readAsync(file, callback) {
        if (file)
            fs.readFile(file, 'utf8', callback);
    }

    self.source = {
        hash: function (raw, base) {
            var source = {contents: raw, templates: []};
            var parts = source.contents.split(/(?=templateUrl)/g);

            parts.forEach(function (element, index) {

                var match = (element.match(/(?!,)templateUrl(.*)$/gm));

                if (match) {
                    var templateUrl = match[0].split(':')[1].split(',')[0].replace(/"/g, '').replace(/'/g, '').trim()
                    var relative = path.resolve(__dirname + base, '../' + templateUrl);
                    source.templates.push(relative);
                }
            });

            return source;
        },
        read: function (target) {
            var deferred = new Promise(function (resolve, reject) {
                fs.readFile(__dirname + target, 'utf8', function (err, data) {
                    resolve(data);
                });
            });

            return deferred;
        }
    }

    self.templates = {
        get: function (source) {
            var deferred = new Promise(function (resolve, reject) {
                async.map(source.templates, readAsync, function (err, results) {

                    results.forEach(function (element, index, arr) {
                        source.templates[index] = minify(element, {collapseWhitespace: true, removeComments: true}); // minify the markup
                    });

                    resolve(source);
                });
            });

            return deferred;
        },
        set: function (transformed) {
            var deferred = new Promise(function (resolve, reject) {

                var parts = transformed.contents.split(/(?=templateUrl)(?!,)/g);

                parts.forEach(function (element, index, arr) {

                    var match = (element.match(/(?!,)templateUrl(.*)$/gm));

                    if (match)
                        arr[index] = arr[index].replace(/(?!,)templateUrl(.*),$/gm, 'template: \'' + transformed.templates.shift() + '\',');
                });

                resolve(parts.join(''));
            });

            return deferred;
        }
    }
}

function TemplateManager() {

    var self = this;

    self.inline = function (target, options, done) { // file in

        engine.source.read(target).then(function (data) {

            var base = path.dirname(target); // TODO solve path madness
            var source = engine.source.hash(data, base);

            engine.templates.get(source).then(function (transformed) {
                engine.templates.set(transformed).then(function (output) {
                    done();
                });
            });
        });
    }
}

module.exports = new TemplateManager();
module.exports.engine = engine;