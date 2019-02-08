(function () {
    'use strict';

    var serviceId = 'repository.lookup';

    angular
        .module('app')
        .factory(serviceId,
        ['model', 'repository.abstract', 'zStorage', RepositoryLookup]);

    function RepositoryLookup(model, AbstractRepository, zStorage) {
        var entityName = 'lookups';
        var entityNames = model.entityNames;
        var EntityQuery = breeze.EntityQuery;

        function Ctor(mgr) {
            this.serviceId = serviceId;
            this.entityName = entityName;
            this.manager = mgr;
            this.getAll = getAll;
            this.zStorage = zStorage;
            this.setLookups = setLookups;
        }

        AbstractRepository.extend(Ctor);

        return Ctor;

        function setLookups() {
            this.lookupCacheData = {
                rooms: this._getAllLocal(entityNames.room, 'name'),
                tracks: this._getAllLocal(entityNames.track, 'name'),
                timeslots: this._getAllLocal(entityNames.timeslot, 'start')
            }
        }

        function getAll() {
            var self = this;
            return EntityQuery.from('Lookups')
                .using(self.manager).execute()
                .to$q(querySucceeded, self._queryFailed);

            function querySucceeded(data) {
                model.createNullos(self.manager);
                self.zStorage.save();
                self.log('Retrieved [Lookups]', data, true);
                return true;
            }
        }

        
    }
})();