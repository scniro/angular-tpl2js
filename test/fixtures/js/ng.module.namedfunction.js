function link() {
  console.log('link');
}

angular.module('mod').directive('dir', function () {
  return {
    scope: {},
    templateUrl: 'templates/ng.template.basic.html',
    link: link
  }
});