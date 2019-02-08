(function () {
    'use strict';

    var controllerId = 'attendees'

    angular
        .module('app')
        .controller(controllerId, ['common','config', 'datacontext', controller]);


    function controller(common, config, datacontext) {
        var vm = this;
        var getLogFn = common.logger.getLogFn;
        var keyCodes = config.keyCodes;
        var log = getLogFn(controllerId);
        vm.title = 'Attendees';
        vm.refresh = refresh;
        vm.attendees = [];
        vm.attendeeCount = 0;
        vm.attendeeFilteredCount = 0;
        vm.attendeeSearch = '';
        vm.filteredAttendees = [];
        vm.search = search;
        vm.pageChanged = pageChanged;
        vm.paging = {
            currentPage: 1,
            maxPagesToShow: 5,
            pageSize: 15
        };

        Object.defineProperty(vm.paging, 'pageCount', {
            get: function () {
                return Math.floor(vm.attendeeFilteredCount / vm.paging.pageSize) + 1;
            }
        });


        activate();

        function activate() {
            common.activateController([getAttendees()], controllerId)
                .then(function () { log('Activated Attendees View'); });
        }

        function getAttendeeCount() {
            return datacontext.attendee.getCount().then(function (data) {
                return vm.attendeeCount = data;
            });
        }

        function getAttendeeFilteredCount() {
            vm.attendeeFilteredCount = datacontext.attendee.getFilteredCount(vm.attendeeSearch);
        }

        function getAttendees(forceRefresh) {
            return datacontext.attendee.getAll(forceRefresh, vm.paging.currentPage, vm.paging.pageSize, vm.attendeeSearch).then(
                function (data) {
                    vm.attendees = data;
                    getAttendeeFilteredCount();
                    if (!vm.attendeeCount || forceRefresh) {
                        getAttendeeCount();

                    }
                    
                    return data;
                    
            });
        }

        function pageChanged(page) {
            if (!page) {
                return;
            }
            vm.paging.currentPage = page;
            getAttendees();
        }

        function refresh() {
            getAttendees(true);
        }

        function search($event) {
            if ($event.keyCode === keyCodes.esc) {
                vm.attendeeSearch = '';
            }
            getAttendees();
        }
    }
})();
