(function () {
    'use strict';

    var serviceId = 'repository.session';

    angular
        .module('app')
        .factory(serviceId, ['model', 'repository.abstract', 'zStorage', 'zStorageWip', RepositorySession]);

    function RepositorySession(model, AbstractRepository, zStorage, zStorageWip) {
        var entityName = model.entityNames.session;
        var EntityQuery = breeze.EntityQuery;
        var orderBy = 'timeSlotId, level, speaker.firstName';

        function Ctor(mgr) {
            this.serviceId = serviceId;
            this.entityName = entityName;
            this.manager = mgr;
            this.getById = getById;
            this.getCount = getCount;
            this.getPartials = getPartials;
            this.zStorage = zStorage;
            this.getTrackCounts = getTrackCounts;
            this.create = create;
            this.zStorageWip = zStorageWip;
        }

        AbstractRepository.extend(Ctor);

        return Ctor;

        function create() {
            return this.manager.createEntity(entityName);
        }

        function getCount() {
            var self = this;
            if (self.zStorage.areItemsLoaded('sessions')) {
                return self.$q.when(self._getLocalEntityCount(entityName))
            }


            return EntityQuery.from('Sessions')
                .take(0).inlineCount()
                .using(self.manager).execute()
                .to$q(self._getInlineCount);
        }

        function getTrackCounts() {
            return this.getPartials().then(function (data) {
                var sessions = data;
                var trackMap = sessions.reduce(function (accum, session) {
                    var trackName = session.track.name;
                    var trackId = session.track.id;
                    if (accum[trackId - 1]) {
                        accum[trackId - 1].count++;
                    } else {
                        accum[trackId - 1] = {
                            track: trackName,
                            count: 1
                        }
                    }
                    return accum;
                }, []);
                return trackMap;

            });
        }

        function getPartials(forceRemote) {
            var self = this;
            var sessions;

            if (self.zStorage.areItemsLoaded('sessions') && !forceRemote) {
                sessions = self._getAllLocal(entityName, orderBy);
                return self.$q.when(sessions);

            }

            return EntityQuery.from('Sessions')
                .select('id, title, code, speakerId, trackId, timeSlotId, roomId, level, tags')
                .orderBy(orderBy)
                .toType(entityName)
                .using(self.manager).execute()
                .to$q(querySucceded, self._queryFailed);

            function querySucceded(data) {
                sessions = self._setIsPartialTrue(data.results);
                self.zStorage.areItemsLoaded('sessions', true);
                self.zStorage.save();
                self.log('Retrieved [Session Partials] from remote data source', sessions.length, true);
                return sessions;
            }
        }

        function getById(id, forceRemote) {
            return this._getById(entityName, id, forceRemote);
        }
    }
})();