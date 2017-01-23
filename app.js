(function () {
    'use strict';

    angular
        .module('app', ['ngRoute', 'ngCookies','ngAnimate'])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider'];

    function config($routeProvider, $locationProvider,$http) {
        $routeProvider
            .when('/', {
                controller: 'HomeController',
                templateUrl: 'home/home.view.html',
                controllerAs: 'vm'
            })
            //.when('/login', {
               // controller: 'LoginController',
               // templateUrl: 'login/login.view.html',
               // controllerAs: 'vm'
           // })
            .otherwise({ redirectTo: '/' });
    }

    run.$inject = ['$rootScope', '$location', '$cookieStore', '$http'];
    function run($rootScope, $location, $cookieStore, $http) {
        
    }

})();