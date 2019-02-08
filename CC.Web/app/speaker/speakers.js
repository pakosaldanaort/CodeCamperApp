(function () {
    'use strict';

    var controllerId = 'speakers';

    angular
        .module('app')
        .controller(controllerId, ['$location', 'common', 'config', 'datacontext',controller]);

    

    function controller($location, common, config, datacontext) {
        /* jshint validthis:true */
        var vm = this;
        var keyCodes = config.keyCodes;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        vm.filteredSpeakers = [];
        vm.title = 'Speakers';
        vm.search = search;
        vm.speakers = [];
        vm.gotoSpeaker = gotoSpeaker;
        vm.speakerSearch = '';
        vm.refresh = refresh;
        activate();

        function activate() {
            common.activateController([getSpeakers()], controllerId)
                .then(function () { log('Activated Speakers View'); });
        }

        function getSpeakers(forceRefresh) {
            return datacontext.speaker.getPartials(forceRefresh).then(function (data) {
                vm.speakers = data;
                applyFilter();
                return vm.speakers;
            });
        }

        function search($event) {
            if ($event.keyCode == keyCodes.esc) {
                vm.speakerSearch = '';
            }
            applyFilter();
        }

        function applyFilter() {
           vm.filteredSpeakers = vm.speakers.filter(speakerFilter);
        }

        function speakerFilter(speaker) {
            var isMatch = vm.speakerSearch
                ? common.textContains(speaker.fullName, vm.speakerSearch)
                : true ;
            return isMatch;
        }

        function refresh() {
            getSpeakers(true);
        }

        function gotoSpeaker(speaker) {
            if (speaker && speaker.id) {
                $location.path('/speaker/' + speaker.id); 
            }
        }
    }
})();
