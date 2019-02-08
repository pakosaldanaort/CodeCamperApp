(function () {
    'use strict';

    var serviceId = 'datacontext';
    angular.module('app').factory(serviceId, ['$rootScope', 'common', 'config', 'entityManagerFactory', 'repositories', 'model', 'zStorage', 'zStorageWip', datacontext]);

    function datacontext($rootScope, common, config, emFactory, repositories, model, zStorage, zStorageWip) {
        var EntityQuery = breeze.EntityQuery;
        var events = config.events;
        var entityNames = model.entityNames;
        var Predicate = breeze.Predicate;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(serviceId);
        var logError = getLogFn(serviceId, 'error');
        var logSuccess = getLogFn(serviceId, 'succes');
        var manager = emFactory.newManager();
        var $q = common.$q;
        var repoNames = ['attendee', 'lookup', 'session', 'speaker'];
        var primePromise;

        var service = {
            cancel: cancel,
            save: save,
            prime: prime,
            markDeleted: markDeleted,
            zStorage: zStorage,
            zStorageWip: zStorageWip
        };

        init();

        return service;

        function init() {
            zStorage.init(manager);
            zStorageWip.init(manager);
            repositories.init(manager);
            defineLazyLoadedRepos();
            setupEventForHasChangesChanged();
            listenForStorageEvents();
            setupEventForEntitiesChanged();
        }

        function defineLazyLoadedRepos() {
            repoNames.forEach(function (name) {
                Object.defineProperty(service, name, {
                    configurable: true,
                    get: function () {
                        var repo = repositories.getRepo(name);
                        Object.defineProperty(service, name, {
                            value: repo,
                            configurable: false,
                            enumerable: true
                        });
                        return repo;
                    }
                });
            });
        }

        function prime() {
            if (primePromise) return primePromise;

            var storageEnabledAndHasData = zStorage.load(manager); 

            primePromise = storageEnabledAndHasData ?
                $q.when(log('Loading entities and metadata from local storage')) :
                $q.all([service.lookup.getAll(), service.speaker.getPartials(true)])
                    .then(extendMetadata)
                    .then(success);
            return primePromise.then(success);

            function extendMetadata() {
                var metadataStore = manager.metadataStore;
                model.extendMetadata(metadataStore);
                registerResourceNames(metadataStore);
            }

            function registerResourceNames(metadataStore) {
                var types = metadataStore.getEntityTypes();
                types.forEach(function (type) {
                    if (type instanceof breeze.EntityType) {
                        set(type.shortName, type);
                    }

                });

                var personEntityName = entityNames.person;
                ['Speakers', 'Speaker', 'Attendees', 'Attendee']
                    .forEach(function (r) {
                        set(r, personEntityName);
                    });


                function set(resourceName, entityName) {
                    metadataStore.setEntityTypeForResourceName(resourceName, entityName);
                }
            }

            function success() {
                service.lookup.setLookups();
                zStorage.save();
                log('Prime the data');
            }
        }

        function cancel() {
            if (manager.hasChanges()) {
                manager.rejectChanges();
                logSuccess('Canceled changes', null, true);
            }
            
        }

        function save() {
            return manager.saveChanges()
                .to$q(saveSucceeded, saveFailed);

            function saveSucceeded(result) {
                zStorage.save();
                logSuccess('Saved data', result, true);
            }

            function saveFailed(error) {
                var msg = config.appErrorPrefix + 'Save failed'
                    + breeze.saveErrorMessageService.getErrorMessage(error);
                error.message = msg;
                logError(msg, error);
                throw error;
            }
        }

        function setupEventForHasChangesChanged() {
            manager.hasChangesChanged.subscribe(function (eventArgs) {
                var data = { hasChanges: eventArgs.hasChanges };
                common.$broadcast(events.hasChangesChanged, data);
            });
        }

        function markDeleted(entity) {
            return entity.entityAspect.setDeleted();
        }

        function listenForStorageEvents() {
            $rootScope.$on(config.events.storage.storageChanged, function (event, data) {
                log('Updated local storage', data, true);

            });
            $rootScope.$on(config.events.storage.wipChanged, function (event, data) {
                log('Updated WIP', data, true);

            });
            $rootScope.$on(config.events.storage.error, function (event, data) {
                log('Error with local storage '+ data.activity, data, true);

            });
        }

        function setupEventForEntitiesChanged() {
            manager.entityChanged.subscribe(function (changeArgs) {
                if (changeArgs.entityAction === breeze.EntityAction.PropertyChange) {
                    interceptPropertyChange(changeArgs);
                    common.$broadcast(events.entitiesChanged, changeArgs);
                }
            });
        }

        function interceptPropertyChange(changeArgs) {
            var changedProp = changeArgs.args.propertyName;
            if (changedProp === 'isPartial' || changedProp === 'isSpeaker') {
                delete changeArgs.entity.entityAspect.originalValues[changedProp];
            }
        }

       

    }
})();