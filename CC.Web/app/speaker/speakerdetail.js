(function () {
    'use strict';

    var controllerId = 'speakerdetail';

    angular
        .module('app')
        .controller(controllerId, ['$location', '$routeParams', '$scope', '$window', 'common', 'config', 'datacontext', speakerdetail]);

    function speakerdetail($location, $routeParams, $scope, $window, common, config, datacontext) {
        var vm = this;
        var logError = common.logger.getLogFn(controllerId, 'error');
        vm.speakerIdParameter = $routeParams.id;
        vm.cancel = cancel;
        vm.save = save;
        vm.goBack = goBack;
        vm.hasChanges = false;
        vm.title = 'speakerdetail';
        vm.speaker = undefined;
        vm.isSaving = false;

        Object.defineProperty(vm, 'canSave', {
            get: canSave
        });

        function canSave() { return vm.hasChanges && !vm.isSaving; }

        activate();

        function activate() {
            onDestroy();
            onChanges();
            common.activateController([getRequestedSpeaker()], controllerId);
        }

        function getRequestedSpeaker() {
            var val = $routeParams.id;
            if (val === 'new') {
                vm.speaker = datacontext.speaker.create();
                vm.speaker.isSpeaker = true;
                return vm.speaker;
            }
            return datacontext.speaker.getById(val)
                .then(function (data) {
                    vm.speaker = data;
                }, function (error) {
                    logError('Unable to get speaker ' + val);
                });
        }

        function cancel() {
            datacontext.cancel();
            if (vm.speaker.entityAspect.entityState.isDetached()) {
                gotoSpeakers();
            }
        }

        function gotoSpeakers() {
            $location.path('/speakers');
        }

        function onDestroy() {
            $scope.$on('$destroy', function () {
                datacontext.cancel();
            });
        }

        function goBack() { $window.history.back(); }

        function save() {
            if (!canSave()) { return $q.when(null); }

            vm.isSaving = true;
            return datacontext.save()
                .then(function saveResult() {
                    vm.isSaving = false;
                }, function (error) {
                    vm.isSaving = false;
                });
        }

        function onChanges() {
            $scope.$on(config.events.hasChangesChanged,
                function (event, data) {
                    vm.hasChanges = data.hasChanges;
            });
        }
    
    }
})();
