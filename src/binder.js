(function () {
    function applyCreateOptions(bindingContext, bindings, options, definition) {
        if (typeof definition === 'string') {
            ko.google.maps.utils.assignBindingToOptions(bindings, definition, options);
        } else if (typeof definition === 'object') {
            ko.google.maps.utils.assignBindingToOptions(bindings, definition.name, options, definition.defaultValue, definition.transform || function (value) {
                return value === undefined ? undefined : ko.google.maps.utils.convertVMToObj(value, definition.type);
            });
        } else if (typeof definition === 'function') {
            definition(bindingContext, bindings, options);
        } else {
            throw new TypeError('Unsupported createOptions definition');
        }
    }

    function applyCreateOptionsSet(bindingContext, bindings, options, definitions) {
        if (definitions && !ko.google.maps.utils.isArray(definitions)) {
            definitions = [definitions];
        }

        for (var i = 0; i < definitions.length; ++i) {
            applyCreateOptions(bindingContext, bindings, options, definitions[i]);
        }
    }

    function getCreateOptions(bindingContext, bindings, binders) {
        var options = {};
        for (var key in binders) {
            var binder = binders[key];
            if (binder.createOptions) {
                applyCreateOptionsSet(bindingContext, bindings, options, binder.createOptions);
            }
        }
        return options;
    }

    function applyGetter(obj, getter) {
        if (typeof getter === 'function') {
            return getter.apply(obj, []);
        } else if (typeof getter === 'string') {
            return obj[getter].apply(obj, []);
        } else {
            throw new TypeError('Invalid getter');
        }
    }

    function applySetter(obj, setter, value) {
        if (typeof setter === 'function') {
            return setter.apply(undefined, [obj, value]);
        } else if (typeof setter === 'string') {
            return obj[setter].apply(obj, [value]);
        } else {
            throw new TypeError('Invalid setter');
        }
    }

    function registerBinding(bindingContext, bindings, obj, subscriptions, definition) {
        if (typeof definition === 'string') {
            definition = { name: definition };
        }

        if (!ko.isObservable(bindings[definition.name])) return;

        if (!definition.vmToObj) {
            definition.vmToObj = {};
        }

        if (definition.vmToObj.setter) {
            subscriptions.addKOSubscription(bindings[definition.name].subscribe(function (value) {
                applySetter(obj, definition.vmToObj.setter, ko.google.maps.utils.convertVMToObj(value, definition.type));
            }));
        } else if (typeof obj.setOptions === 'function' && !definition.vmToObj.noOptions) {
            subscriptions.addKOSubscription(bindings[definition.name].subscribe(function (value) {
                var options = {};
                options[definition.vmToObj.option || definition.name] = ko.google.maps.utils.convertVMToObj(value, definition.type);
                obj.setOptions(options);
            }));
        }

        if (definition.objToVM) {
            subscriptions.addGMListener(google.maps.event.addListener(obj, definition.objToVM.event, function () {
                var value = applyGetter(obj, definition.objToVM.getter);
                value = ko.google.maps.utils.convertObjToVM(value, definition.type);
                bindings[definition.name](value);
            }));
        }
    }

    function registerBindings(bindingContext, bindings, obj, subscriptions, definitions) {
        if (definitions && !ko.google.maps.utils.isArray(definitions)) {
            definitions = [definitions];
        }

        for (var i = 0; i < definitions.length; ++i) {
            registerBinding(bindingContext, bindings, obj, subscriptions, definitions[i]);
        }
    }

    function registerEvent(bindingContext, bindings, obj, subscriptions, event) {
        if (typeof bindings[event] !== 'function') return;

        subscriptions.addGMListener(google.maps.event.addListener(obj, event, function (e) {
            bindings[event](bindingContext.$data, e);
        }));
    }

    function registerEvents(bindingContext, bindings, obj, subscriptions, events) {
        if (events && !ko.google.maps.utils.isArray(events)) {
            events = [events];
        }

        for (var i = 0; i < events.length; ++i) {
            registerEvent(bindingContext, bindings, obj, subscriptions, events[i]);
        }
    }

    function bind(bindingContext, bindings, obj, subscriptions, binders) {
        for (var key in binders) {
            var binder = binders[key];
            if (binder.bindings) {
                registerBindings(bindingContext, bindings, obj, subscriptions, binder.bindings);
            }
            if (binder.events) {
                registerEvents(bindingContext, bindings, obj, subscriptions, binder.events);
            }
            if (binder.bind) {
                binder.bind(bindingContext, bindings, obj, subscriptions);
            }
        }
    }

    ko.google.maps.binder = {
        getCreateOptions: getCreateOptions,
        bind: bind
    };
})();