(function () {
    'use strict';

    var serviceId = 'model.validation'

    angular
        .module('app')
        .factory(serviceId, ['common', modelValidation]);

    function modelValidation(common) {
        var entityNames;
        var log = common.logger.getLogFn(serviceId);
        var requireReferenceValidator;
        var twitterValidator;
        var Validator = breeze.Validator;

        var service = {
            applyValidators: applyValidators,
            createAndRegister: createAndRegister
        };

        return service;

        function createAndRegister(eNames) {
            entityNames = eNames;
            requireReferenceValidator = createRequireReferenceValidator();
            twitterValidator = createTwitterValidator();
            Validator.register(twitterValidator);
            Validator.register(requireReferenceValidator);
            log('Validators created and registered', null, serviceId, false);
        }

        function createRequireReferenceValidator() {
            var name = 'requireReferenceEntity';
            var ctx = {
                messageTemplate: 'Missing %displayName%',
                isRequired: true
            };
            var val = new Validator(name, valFunction, ctx);
            return val;

            function valFunction(value) {
                return value ? value.id !== 0 : false;
            }
        }

        function applyValidators(metadataStore) {
            applyRequireReferenceValidators(metadataStore);
            applyTwitterValidators(metadataStore);
            applyEmailValidators(metadataStore);
            applyUrlValidators(metadataStore);
            log('Validators applied', null, serviceId);
        }

        function applyEmailValidators(metadataStore) {
            var entityType = metadataStore.getEntityType(entityNames.speaker);
            entityType.getProperty('email').validators
                .push(Validator.emailAddress());
        }

        function applyUrlValidators(metadataStore) {
            var entityType = metadataStore.getEntityType(entityNames.speaker);
            entityType.getProperty('blog').validators
                .push(Validator.url());
        }

        function applyTwitterValidators(metadataStore) {
            var entityType = metadataStore.getEntityType(entityNames.speaker);
            entityType.getProperty('twitter').validators
                .push(twitterValidator);
        }

        function createTwitterValidator() {
            var val = Validator.makeRegExpValidator(
                'twitter', 
                /^@([a-zA-Z]+)([a-zA-Z0-9_]+)$/,
                "Invalid Twitter User Name: '%value%'"
            );
            return val;
        }

        function applyRequireReferenceValidators(metadataStore) {
            var navigations = ['room', 'track', 'timeSlot', 'speaker'];
            var entityType = metadataStore.getEntityType(entityNames.session);
            navigations.forEach(function (propertyName) {
                entityType.getProperty(propertyName).validators
                    .push(requireReferenceValidator)
            });
        }
    }
})();