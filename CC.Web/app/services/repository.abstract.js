(function () {
    'use strict';

    var serviceId = 'repository.abstract';

    angular
        .module('app')
        .factory(serviceId, ['common', 'config', AbstractRepository]);

    function AbstractRepository(common, config) {
        var EntityQuery = breeze.EntityQuery;
        var logError = common.logger.getLogFn(this.serviceId, 'error');
        var $q = common.$q; 
        var _predicates = {
            isNotNullo: breeze.Predicate.create('id', '!=', 0),
            isNullo: breeze.Predicate.create('id', '==', 0)
        }

        function Ctor() {
            this.isLoaded = false;
        }

        Ctor.extend = function (repoCtor) {
            repoCtor.prototype = new Ctor();
            repoCtor.prototype.constructor = repoCtor;
        }

        Ctor.prototype._getAllLocal = _getAllLocal;
        Ctor.prototype._getById = _getById;
        Ctor.prototype._predicates = _predicates;
        Ctor.prototype._getInlineCount = _getInlineCount;
        Ctor.prototype._getLocalEntityCount = _getLocalEntityCount;
        Ctor.prototype._queryFailed = _queryFailed;
        Ctor.prototype._setIsPartialTrue = _setIsPartialTrue;
        Ctor.prototype.log = common.logger.getLogFn(this.serviceId);
        Ctor.prototype.$q = common.$q;
        Ctor.prototype.getEntityByIdOrFromWip = getEntityByIdOrFromWip;

        return Ctor;


        function _getAllLocal(resource, ordering, predicate) {
            return EntityQuery.from(resource)
                .orderBy(ordering)
                .where(predicate)
                .using(this.manager)
                .executeLocally();
        }

        function _getInlineCount(data) { return data.inlineCount; }

        function _getLocalEntityCount(resource) {
            var entities = EntityQuery.from(resource)
                .using(this.manager)
                .executeLocally();
            return entities.length;
        }

        function _getById(entityName, id, forceRemote) {
            var self = this;
            var manager = self.manager;
            if (!forceRemote) {
                var entity = manager.getEntityByKey(entityName, id);
                if (entity && !entity.isPartial) {
                    self.log('Retrieved [' + entityName + '] id: ' + entity.id + 'from cache', entity, true);
                    if (entity.entityAspect.entityState.isDeleted()) {
                        entity = null;
                    }
                    return $q.when(entity);
                }
            }

            return manager.fetchEntityByKey(entityName, id)
                .to$q(querySucceeded, self._queryFailed);

            function querySucceeded(data) {
                entity = data.entity
                if (!entity) {
                    self.log('Could not find [' + entityName + '] id: ' + id, null, true);
                    return null;
                }
                entity.isPartial = false;
                self.log('Retrieved [' + entityName + '] id: ' + id + 'from remote data source', entity, true);
                self.zStorage.save();
                return entity;
            }
        }

        function _queryFailed(error) {
            var msg = config.appErrorPrefix + 'Error retrieving data.' + error.message;
            logError(msg, error);
            throw error;
        }

        function _setIsPartialTrue(entities) {
            for (var i = entities.length; i--;) {
                entities[i].isPartial = true;
            }
            return entities;
        }

        function getEntityByIdOrFromWip(val) {
            var wipEntityKey = val;
            if (common.isNumber(val)) {
                val = parseInt(val);
                wipEntityKey = this.zStorageWip.findWipKeyByEntityId(this.entityName, val);
                if (!wipEntityKey) {
                    return this._getById(this.entityName, val);
                }
            }

            var importedEntity = this.zStorageWip.loadWipEntity(wipEntityKey);
            if (importedEntity) {
                importedEntity.entityAspect.validateEntity();
                return $q.when({ entity: importedEntity, key: wipEntityKey });
            }

            return $.q.reject({ error: 'Couldn\'t find the entity for WIP key' + wipEntityKey })
        }
    }
})();