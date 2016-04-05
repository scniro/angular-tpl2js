var async = require('async');
var fs = require('fs');
var minify = require('html-minifier').minify;
var path = require('path');
var cheerio = require('cheerio');
var engine;

function TemplateEngine() {

    var self = this;
    var _config = {};

    function readAsync(file, callback) {
        if (file)
            fs.readFile(file, 'utf8', callback);
    }

    function merge(obj1, obj2) {
        var obj3 = {};
        for (var attrname in obj1) {
            obj3[attrname] = obj1[attrname];
        }
        for (var attrname in obj2) {
            obj3[attrname] = obj2[attrname];
        }
        return obj3;
    }

    function embedIncludes(template, source) {

        var $ = cheerio.load(template, {decodeEntities: false});

        $('[ng-include]').each(function (i, ele) {
            var src = path.dirname(source) + '/' + ($(ele).attr('ng-include') || $(ele).attr('src')).replace(/"/g, '').replace(/'/g, '').trim();
            var include = fs.readFileSync(src, 'utf8');
            $(ele).append(include);
        });

        return $.html();
    }

    self.config = {
        get: function () {
            return _config;
        },
        set: function (config) {

            var HTMLMinifier = {
                collapseWhitespace: true,
                removeComments: true
            }

            _config = config || {};
            _config.HTMLMinifier = merge(HTMLMinifier, (config.HTMLMinifier || {}));
        }
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

                    if (err)
                        reject('template not found: ' + err.path);
                    else {
                        results.forEach(function (element, index, arr) {

                            var t, $ = cheerio.load(element, {decodeEntities: false});

                            if ($($.html()).find('[ng-include]').length > 0 && _config.includes) {
                                t = embedIncludes($.html(), source.templates[index])
                            }

                            var template = minify((t || $.html()), _config.HTMLMinifier) // minify the markup
                            source.templates[index] = template
                            resolve(source);
                        });

                        resolve(source);
                    }
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
                        arr[index] = arr[index].replace(/(?!,)templateUrl(.*)(?!,)$/gm, 'template: \'' + transformed.templates.shift().replace(/'/g, "\\'") + '\',')
                });

                resolve(parts.join(''));
            });

            return deferred;
        }
    }
}

// TODO - pathing madness
// TODO - refine templateUrl regex check
// TODO - identify failure points and return errors
// TODO - recurse deeply nested ng-include templates
// TODO - README

function TemplateManager() {

    var self = this;

    self.inline = function (input, config, done) { // -- in

        engine = new TemplateEngine();
        engine.config.set(config);

        // more robust gulp check mayhaps?
        if (typeof input === 'object') {
            var base = '/' + path.dirname(path.relative(__dirname, config.target));
            var source = engine.source.hash(input.toString(), base);

            engine.templates.get(source).then(function (transformed) {
                engine.templates.set(transformed).then(function (output) {
                    done(output); // -- out
                });
            });
        } else {
            engine.source.read(input).then(function (data) {

                var base = path.dirname(input);
                var source = engine.source.hash(data, base);

                engine.templates.get(source).then(function (transformed) {
                    engine.templates.set(transformed).then(function (output) {
                        done(null, output); // -- out
                    });
                }, function (error) {
                    done(error);
                });
            });
        }
    }
}

module.exports = new TemplateManager();
module.exports.engine = new TemplateEngine();