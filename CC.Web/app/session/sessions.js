(function () {
    'use strict';

    var controllerId = "sessions";

    angular
        .module('app')
        .controller(controllerId, ['$location', '$routeParams', 'common','config','datacontext', sessions]);

    

    function sessions($location, $routeParams, common,config, datacontext) {
      
        /* jshint validthis:true */
        var vm = this;
        var keyCodes = config.keyCodes;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var applyFilter = function () { };
        vm.filteredSessions = [];
        vm.search = search;
        vm.gotoSession = gotoSession;
        vm.sessionsFilter = sessionsFilter;
        vm.sessionsSearch = $routeParams.search || '';
        vm.sessions = [];
        vm.refresh = refresh;
        vm.title = 'Sessions';

        activate();

        function refresh() {
            getSessions(true);
        }

        function activate() {
            common.activateController([getSessions()], controllerId)
                .then(function () {
                    applyFilter = common.createSearchThrottle(vm, 'sessions')
                    if (vm.sessionsSearch) { applyFilter(true) }
                    log('Activated Sessions View');
                });
        }

        function getSessions(forceRefresh) {
            return datacontext.session.getPartials(forceRefresh).then(function (data) {
                return vm.sessions = vm.filteredSessions = data;
            });
        }

        function search($event) {
            if ($event.keyCode == keyCodes.esc) {
                vm.sessionsSearch = '';
                applyFilter(true);
            } else {
                applyFilter();
            }
            
        }


        function sessionsFilter(session) {
            var textContains = common.textContains;
            var searchText = vm.sessionsSearch;
            var isMatch = searchText ?
                textContains(session.title, searchText)
                || textContains(session.tagsFormatted, searchText)
                || textContains(session.room.name, searchText)
                || textContains(session.track.name, searchText)
                || textContains(session.speaker.fullName, searchText)
                : true;
            return isMatch;
        }

        function gotoSession(session) {
            if (session && session.id) {
                $location.path('/sessions/' + session.id);
            }
        }
    }
})();
