angular.module('mod').directive('dir', function () {
    return {
        scope: {},
        templateUrl: 'templates/ng.template.basic.html',
        link: function (scope, elem, attrs) {
        }
    }
});

angular.module('mod').directive('dupe', function () {
    return {
        scope: {},
        templateUrl: 'templates/ng.template.nested.child.html',
        link: function (scope, elem, attrs) {
        }
    }
});