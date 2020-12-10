angular.module('nodeadmin.system.logs', [])
.controller('LogsController', ['$scope', function ($scope) {

    var first = ''
    var spanify = function (string) {
      var httpRegex = /POST|GET|PUT|DELETE/g;
      var regex = /([\[][\d]+[m.?])([^\[]*)/g;
      var colorRegex = /(\[\d+[m])/g;
      return string.replace(regex, function (substr) {
        var color = substr.match(colorRegex)[0];
        if(color === '[32m') {
          color = 'green';
        }
        else if (color === '[36m') {
          color = '#0072C6';
        }
        else if (color === '[31m') {
          color = 'red';
        } else {
          color = 'wheat';
        }
        var str = substr.split(colorRegex)[2];
        var newLine = httpRegex.test(str) ? first + '<div style="position: relative; bottom: .5em;">' : '';
        first = '</div>';
        return newLine + '<span style="color: ' + color + '">' + str + '</span>';
      });
    };

  $scope.logfile = [];

  $scope.getLogs = function () {};

  $scope.$on("$destroy", function () {});
}]);
