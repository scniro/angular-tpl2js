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

    function embedIncludes(template, source) {

        var $ = cheerio.load(template, {decodeEntities: false});
        var ele = $('[ng-include]').first();
        var src = path.dirname(source) + '/' + ($(ele).attr('ng-include') || $(ele).attr('src')).replace(/"/g, '').replace(/'/g, '').trim();
        var include = fs.readFileSync(src, 'utf8');
        $(ele).append(include);
        return $.html();
    }

    self.config = {
        get: function () {
            return _config;
        },
        set: function (config) {
            _config = config || {};
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

                    results.forEach(function (element, index, arr) {

                        var t, $ = cheerio.load(element, {decodeEntities: false});

                        if ($($.html()).find('[ng-include]').length > 0 && _config.includes) {
                            t = embedIncludes($.html(), source.templates[index])
                        }

                        var template = minify((t || $.html()), {collapseWhitespace: true, removeComments: true}) // minify the markup
                        source.templates[index] = template
                        resolve(source);
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
                        arr[index] = arr[index].replace(/(?!,)templateUrl(.*),$/gm, 'template: \'' + transformed.templates.shift().replace(/'/g, "\\'") + '\',')
                });

                resolve(parts.join(''));
            });

            return deferred;
        }
    }
}

// TODO - solve pathing weirdness
// TODO - refine poor regex check
// TODO - relay options to html-minifier
// TODO - identify failure points and return error through callbacks
// TODO - refine templating for ng-include support
// TODO - README
// TODO - cli

function TemplateManager() {

    var self = this;

    self.inline = function (input, config, done) { // -- in

        engine = new TemplateEngine();
        engine.config.set(config);

        // more robust gulp check mayhaps?
        if (input.contents) {
            var base = '/' + path.dirname(path.relative(__dirname, config.target));
            var source = engine.source.hash(input, base);

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
                        done(output); // -- out
                    });
                });
            });
        }
    }
}

module.exports = new TemplateManager();
module.exports.engine = new TemplateEngine();