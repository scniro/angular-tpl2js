var fs = require('fs');
var minify = require('html-minifier').minify;
var engine = new TemplateEngine();


function TemplateEngine() {
    var self = this;

    self.getDirectiveTemplateHash = function(raw){

        var arr = []
        var found = raw.match(/(?!,)templateUrl(.*)$/gm)[0];

        if(found) {
            arr.push(found.split(':')[1].split(',')[0].replace(/"/g, '').replace(/'/g, '').trim());
        }

        return arr;
    }

    self.read = function(target, done) {
        fs.readFile(__dirname + target, 'utf8', function (err, data) {
            done(data);
        });
    }
}

function TemplateManager() {

    var self = this;

    self.inline = function (target, options, done) {

        self.read(target, function(data){

            engine.getDirectiveTemplateHash(data)
            done();
        });
    }
}

module.exports = new TemplateManager();
module.exports.engine = engine;