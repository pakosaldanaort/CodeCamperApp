﻿(function () {
    'use strict';

    var app = angular.module('app');

    // Collect the routes
    app.constant('routes', getRoutes());
    
    // Configure the routes and route resolvers
    app.config(['$routeProvider', 'routes', routeConfigurator]);
    function routeConfigurator($routeProvider, routes) {
        routes.forEach(function (r) {
            //$routeProvider.when(r.url, r.config);
            setRoute(r.url, r.config);
        });
        $routeProvider.otherwise({ redirectTo: '/' });

        function setRoute(url, definition) {
            definition.resolve = angular.extend(definition.resolve || {}, {
                prime: prime
            });
            $routeProvider.when(url, definition);
            return $routeProvider;

        }

        
    }

    prime.$inject = ['datacontext'];
    function prime(dc) {
        return dc.prime();
    }

    // Define the routes 
    function getRoutes() {
        return [
            {
                url: '/',
                config: {
                    templateUrl: 'app/dashboard/dashboard.html',
                    title: 'dashboard',
                    settings: {
                        nav: 1,
                        content: '<i class="fa fa-dashboard"></i> Dashboard'
                    }
                }
            }, {
                url: '/sessions',
                config: {
                    title: 'sessions',
                    templateUrl: 'app/session/sessions.html',
                    settings: {
                        nav: 2,
                        content: '<i class="fa fa-calendar"></i> Sessions'
                    }
                }
            }, {
                url: '/sessions/search/:search',
                config: {
                    title: 'sessions-search',
                    templateUrl: 'app/session/sessions.html',
                    settings: {
                        
                    }
                }
            }, {
                url: '/sessions/:id',
                config: {
                    title: 'session',
                    templateUrl: 'app/session/sessiondetail.html',
                    settings: {

                    }
                }
            }, {
                url: '/speakers',
                config: {
                    title: 'speakers',
                    templateUrl: 'app/speaker/speakers.html',
                    settings: {
                        nav: 3,
                        content: '<i class="fa fa-user"></i> Speakers'
                    }
                }
            }, {
                url: '/speaker/:id',
                config: {
                    title: 'speaker',
                    templateUrl: 'app/speaker/speakerdetail.html',
                    settings: { }
                }
            }, {
                url: '/attendees',
                config: {
                    title: 'attedees',
                    templateUrl: 'app/attendee/attendees.html',
                    settings: {
                        nav: 4,
                        content: '<i class="fa fa-group"></i> Attendees'
                    }
                }
            }
        ];
    }
})();