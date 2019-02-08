(function () {
    'use strict';

    var serviceId = 'repository.speaker';

    angular
        .module('app')
        .factory(serviceId, ['model', 'repository.abstract', 'zStorage', 'zStorageWip', RepositorySpeaker]);

    function RepositorySpeaker(model, AbstractRepository, zStorage, zStorageWip) {
        var entityName = model.entityNames.speaker;
        var EntityQuery = breeze.EntityQuery;
        var orderBy = 'firstName, lastName';
        var Predicate = breeze.Predicate;

        function Ctor(mgr) {
            this.serviceId = serviceId;
            this.entityName = entityName;
            this.manager = mgr;
            this.getAllLocal = getAllLocal;
            this.getTopLocal = getTopLocal;
            this.getPartials = getPartials;
            this.zStorage = zStorage;
            this.zStorageWip = zStorageWip;
            this.getById = getById;
            this.create = create;
            this.calcIsSpeaker = calcIsSpeaker;
        }

        AbstractRepository.extend(Ctor);

        return Ctor;

        function calcIsSpeaker() {
            var self = this;
            var persons = self.manager.getEntities(model.entityNames.person);
            var sessions = self.manager.getEntities(model.entityNames.session);
            persons.forEach(function (s) { s.isSpeaker = false; });
            sessions.forEach(function (s) { s.speaker.isSpeaker = (s.speakerId != 0) });
        }

        function getAllLocal(includeNullo) {
            var self = this;
            var predicate = Predicate.create('isSpeaker', '==', true);
            if (includeNullo) {
                predicate = predicate.or(this._predicates.isNullo);
            }
            var orderBy = 'firstName, lastName';
            return self._getAllLocal(entityName, orderBy, predicate);
        }

        function getPartials(forceRemote) {
            var self = this;
            var predicate = breeze.Predicate.create('isSpeaker', '==', true);
            var speakerOrderBy = 'firstName, lastName';
            var speakers = [];


            if (!forceRemote) {
                speakers = self._getAllLocal(entityName, speakerOrderBy, predicate);
                return self.$q.when(speakers);

            }

            return EntityQuery.from('Speakers')
                .select('id, firstName, lastName, imageSource')
                .orderBy(speakerOrderBy)
                .toType(entityName)
                .using(self.manager).execute()
                .to$q(querySucceded, self._queryFailed);

            function querySucceded(data) {
                speakers = data.results;
                for (var i = speakers.length; i--;) {
                    speakers[i].isPartial = true;
                    speakers[i].isSpeaker = true;
                }
                self.zStorage.save();
                self.log('Retrieved [Speakers Partials] from remote data source', speakers.length, true);
                return speakers;
            }
        }

        function getTopLocal() {
            var self = this;
            var orderBy = 'firstName, lastName';
            var predicate = Predicate.create('lastName', '==', 'Papa')
                .or('lastName', '==', 'Guthrie')
                .or('lastName', '==', 'Bell')
                .or('lastName', '==', 'Hanselman')
                .or('lastName', '==', 'Lerman')
                .and('isSpeaker', '==', true);
            return self._getAllLocal(entityName, orderBy, predicate);
        }

        function create() {
           return this.manager.createEntity(entityName);
        }

        function getById(id, forceRemote) {
            return this._getById(entityName, id, forceRemote)
        }
    }
})();