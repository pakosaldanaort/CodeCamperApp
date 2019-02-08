(function () {
    'use strict';

    var controllerId = 'sessiondetail';

    angular
        .module('app')
        .controller(controllerId, ['$location', '$scope', '$routeParams', '$window', 'bootstrap.dialog', 'common', 'config', 'datacontext', 'model', sessiondetail]);


    function sessiondetail($location, $scope, $routeParams, $window, bsDialog, common, config, datacontext, model) {
        var vm = this;
        var logError = common.logger.getLogFn(controllerId, 'error');
        var $q = common.$q;
        var entityName = model.entityNames.session;
        var wipEntityKey = undefined;

        vm.cancel = cancel;
        vm.goBack = goBack;
        vm.hasChanges = false;
        vm.isSaving = false;
        vm.rooms = [];
        vm.deleteSession = deleteSession;
        vm.save = save;
        vm.session = undefined;
        vm.speakers = [];
        vm.timeslots = [];
        vm.tracks = [];

        activate();

        Object.defineProperty(vm, 'canSave', {get: canSave})

        function activate() {
            onDestroy();
            initLookups();
            onHasChanges();
            common.activateController([getRequestedSession()], controllerId)
                .then(onEveryChange);
        }

        function autoStoreWip(immediate) {
            common.debouncedThrottle(controllerId, storeWipEntity, 1000, immediate);

        }

        function initLookups() {
            var lookups = datacontext.lookup.lookupCacheData;
            vm.rooms = lookups.rooms;
            vm.timeslots = lookups.timeslots;
            vm.tracks = lookups.tracks
            vm.speakers = datacontext.speaker.getAllLocal(true);
        }

        function cancel() {
            datacontext.cancel();
            removeWipEntity();
            if (vm.session.entityAspect.entityState.isDetached()) {
                gotoSession();
            }
        }

        function removeWipEntity() {
            datacontext.zStorageWip.removeWipEntity(wipEntityKey);
        }

        function gotoSession() {
            $location.path('/sessions');
        }

        function canSave() { return vm.hasChanges && !vm.isSaving }

        function getRequestedSession() {
            var val = $routeParams.id;
            if (val === 'new') {
                vm.session = datacontext.session.create();
                return vm.session;
            }

            return datacontext.session.getEntityByIdOrFromWip(val)
                .then(function (data) {
                    wipEntityKey = data.key;
                    vm.session = data.entity || data;
                }, function (error) {
                    logError('Unable to get session ' + val);
                    gotoSession();
                });
        }


        function goBack() { $window.history.back(); }

        function onDestroy() {
            $scope.$on('$destroy', function () {
                autoStoreWip(true);
                datacontext.cancel();
            });
        }

        function onHasChanges() {
            $scope.$on(config.events.hasChangesChanged,
                function (event, data) {
                    vm.hasChanges = data.hasChanges;
                });
        }

        function save() {
            if (!canSave()) { return $q.when(null); }

            vm.isSaving = true;
            return datacontext.save().then(function (saveResults) {
                vm.isSaving = false;
                datacontext.speaker.calcIsSpeaker();
            }, function (error) {
                vm.isSaving = false;
            });
        }

        function deleteSession() {
            return bsDialog.deleteDialog('Session')
                .then(confirmDelete);

            function confirmDelete() {
                datacontext.markDeleted(vm.session);
                vm.save().then(success, failed);
            }

            function success() {
                removeWipEntity();
                gotoSession();
            }

            function failed(error) {
                cancel();
            }
        }

        function storeWipEntity() {
            if (!vm.session) return;
            var description = vm.session.title || '[New session ]' + vm.session.id;
            wipEntityKey = datacontext.zStorageWip.storeWipEntity(vm.session, wipEntityKey, entityName, description);
        }

        function onEveryChange() {
            $scope.$on(config.events.entitiesChanged,
                function (event, data) {
                    autoStoreWip();
                }
            )
        }

       
       
    }
})();
