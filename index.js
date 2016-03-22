var async = require('async');
var engine = new TemplateEngine();
var fs = require('fs');
var minify = require('html-minifier').minify;
var path = require('path');
var cheerio = require('cheerio');

function TemplateEngine() {

    var self = this;

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
        get: function (source, parseIncludes) {

            var deferred = new Promise(function (resolve, reject) {
                async.map(source.templates, readAsync, function (err, results) {

                    results.forEach(function (element, index, arr) {

                        var $ = cheerio.load(element, {decodeEntities: false});
                        var t;

                        if ($($.html()).find('[ng-include]').length > 0 && parseIncludes) {
                            t = embedIncludes($.html(), source.templates[index])
                            //$ = cheerio.load(transformed, {decodeEntities: false});
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
// TODO - identify passed options, likely relayed to html-minifier
// TODO - identify failure points and return error through callbacks
// TODO - refine templating for ng-include support
// TODO - travis ci
// TODO - README

function TemplateManager() {

    var self = this;

    self.inline = function (input, options, done) { // -- in

        if (options.gulp) {

            var base = '/' + path.dirname(path.relative(__dirname, options.target));
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
module.exports.engine = engine;