(function () {
    'use strict';

    var serviceId = 'repository.attendee';

    angular
        .module('app')
        .factory(serviceId, ['model', 'repository.abstract', 'zStorage', RepositoryAttendee]);

    function RepositoryAttendee(model, AbstractRepository, zStorage) {
        var entityName = model.entityNames.attendee;
        var EntityQuery = breeze.EntityQuery;
        var orderBy = 'firstName, lastName';
        var Predicate = breeze.Predicate;

        function Ctor(mgr) {
            this.serviceId = serviceId;
            this.entityName = entityName;
            this.manager = mgr;
            this.getAll = getAll;
            this.zStorage = zStorage;
            this.getCount = getCount;
            this.getFilteredCount = getFilteredCount;
        }

        AbstractRepository.extend(Ctor);

        return Ctor;

        function getAll(forceRemote, page, size, nameFilter) {
            var self = this;
            var take = size || 20;
            var skip = page ? (page - 1) * size : 0;

            if (self.zStorage.areItemsLoaded('attendees') && !forceRemote) {
                return self.$q.when(getByPage());
            }

            return EntityQuery.from('Persons')
                .select('id, firstName, lastName, imageSource')
                .orderBy(orderBy)
                .toType(entityName)
                .using(self.manager).execute()
                .to$q(querySucceded, self._queryFailed);

            function querySucceded(data) {
                var attendees = self._setIsPartialTrue(data.results)
                self.zStorage.areItemsLoaded('attendees', true);
                self.zStorage.save();
                self.log('Retrieved [Attendees] from remote data source', attendees.length, true);
                return getByPage();
            }

            function getByPage() {
                var predicate = null;
                if (nameFilter) {
                    predicate = _fullNamePredicate(nameFilter);

                }
                var attendees = EntityQuery.from(entityName)
                    .where(predicate)
                    .orderBy(orderBy)
                    .take(take).skip(skip)
                    .using(self.manager)
                    .executeLocally();
                return attendees;
            }

            

        }

        function getCount() {
            var self = this;
            if (self.zStorage.areItemsLoaded('attendees')) {
                return self.$q.when(self._getLocalEntityCount(entityName));
            }
            return EntityQuery.from('Persons').take(0).inlineCount()
                .using(self.manager).execute()
                .to$q(self._getInlineCount);
        }

        function getFilteredCount(nameFilter) {
            var self = this;
            var predicate = _fullNamePredicate(nameFilter);
            var attendees = EntityQuery.from(entityName)
                .where(predicate)
                .using(self.manager)
                .executeLocally();
            return attendees.length
        }

        function _fullNamePredicate(filterValue) {
            return Predicate
                .create('firstName', 'contains', filterValue)
                .or('lastName', 'contains', filterValue);
        }
    }
})();