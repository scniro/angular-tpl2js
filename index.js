var fs = require('fs');
var path = require('path');
var minify = require('html-minifier').minify;
var engine = new TemplateEngine();
var async = require('async');

function TemplateEngine() {

    var self = this;

    self.getTemplateHash = function (raw, base) {

        var arr = [];

        var parts = raw.split(/(?=templateUrl)/g);

        parts.forEach(function (element, index) {

            var match = (element.match(/(?!,)templateUrl(.*)$/gm));

            if (match) {
                var templateUrl = match[0].split(':')[1].split(',')[0].replace(/"/g, '').replace(/'/g, '').trim()
                var relative = path.resolve(__dirname + base, '../' + templateUrl);
                arr.push(relative);
            }

        });

        return arr;
    }

    self.getTemplates = function (hash) {

        function readAsync(file, callback) {
            if (file)
                fs.readFile(file, 'utf8', callback);
        }

        var deferred = new Promise(function (resolve, reject) {
            async.map(hash, readAsync, function (err, results) {

                results.forEach(function (element, index, arr) {
                    arr[index] = minify(element, {collapseWhitespace: true, removeComments: true}); // minify the markup
                });

                resolve(results);
            });
        });

        return deferred;
    }

    self.injectTemplates = function(templates){
        // incoming
    }

    self.read = function (target) {

        var deferred = new Promise(function (resolve, reject) {
            fs.readFile(__dirname + target, 'utf8', function (err, data) {
                resolve(data);
            });
        });

        return deferred;
    }
}

function TemplateManager() {

    var self = this;

    self.inline = function (target, options, done) { // file in

        engine.read(target).then(function (data) {

            // TODO solve path madness
            var base = path.dirname(target);

            var hash = engine.getTemplateHash(data, base);

            engine.getTemplates(hash).then(function (templates) {
                done(); // inject templates
            });
        });
    }
}

module.exports = new TemplateManager();
module.exports.engine = engine;