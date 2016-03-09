var fs = require('fs');
var minify = require('html-minifier').minify;
var engine = new TemplateEngine();
var async = require('async');


function TemplateEngine() {
    var self = this;

    function readAsync(file, callback) {

        if(file)
            fs.readFile(file, 'utf8', callback);
    }

    self.getDirectiveTemplateHash = function (raw) {

        var arr = [];

        var parts = raw.split(/(?=templateUrl)/g);

        parts.forEach(function(element, index) {

            var match = (element.match(/(?!,)templateUrl(.*)$/gm));

            if (match)
                arr.push(match[0].split(':')[1].split(',')[0].replace(/"/g, '').replace(/'/g, '').trim());
        });

        return arr;
    }

    self.getTemplates = function(hash, done) {

        async.map(hash, readAsync, function(err, results) {
            done(results);
        });
    }

    self.read = function (target, done) {
        fs.readFile(__dirname + target, 'utf8', function (err, data) {
            done(data);
        });
    }
}

function TemplateManager() {

    var self = this;

    self.inline = function (target, options, done) {

        self.read(target, function (data) {

            var hash = engine.getDirectiveTemplateHash(data)
            done();
        });
    }
}

module.exports = new TemplateManager();
module.exports.engine = engine;