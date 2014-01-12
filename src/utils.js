ko.google.maps.utils = {

    /*
    Evaluate a property from a binding object and assign it to an option object.
    Use a default value if the property is not defined on the binding object.
    If a transform function is passed, the value is transformed before it is assigned to
    the option objects.
    */
    assignBindingToOptions: function (bindings, property, options, defaultValue, transform) {
        var value = ko.utils.unwrapObservable(bindings[property]);
        if (value === undefined) {
            value = defaultValue;
        }
        if (transform) {
            value = transform(value);
        }
        options[property] = value;
    },

    /*
    Try to observe a property of a bindings object.
    */
    tryObserveBinding: function (bindings, property, handler) {
        if (ko.isObservable(bindings[property])) {
            bindings[property].subscribe(handler);
        }
    },

    // Try to register a given mouse event on a given target.
    tryRegisterMouseEvent: function (bindingContext, bindings, bindingName, target, eventName) {
        if (typeof bindings[bindingName] === 'function') {
            google.maps.event.addListener(target, eventName || bindingName, function (event) {
                bindings[bindingName](event);
            });
        }
    }
};