(function () {
    var typeConverters = {
        bool: {
            convertObjToVM: function (value) {
                return !!value;
            },
            convertVMToObj: function (value) {
                return !!value;
            }
        }
    };

    function convertObjToVM(value, type) {
        if (!type) return value;

        var converter = typeConverters[type];
        if (!converter) return value;

        return converter.convertObjToVM(value);
    }

    function convertVMToObj(value, type) {
        if (!type) return value;

        var converter = typeConverters[type];
        if (!converter) return value;

        return converter.convertVMToObj(value);
    }

    /*
        Evaluate a property from a binding object and assign it to an option object.
        Use a default value if the property is not defined on the binding object.
        If a transform function is passed, the value is transformed before it is assigned to
        the option objects.
    */
    function assignBindingToOptions(bindings, property, options, defaultValue, transform) {
        var value = ko.utils.unwrapObservable(bindings[property]);
        if (value === undefined) {
            value = defaultValue;
        }
        if (transform) {
            value = transform(value);
        }
        options[property] = value;
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    ko.google.maps.utils = {
        typeConverters: typeConverters,
        convertObjToVM: convertObjToVM,
        convertVMToObj: convertVMToObj,
        assignBindingToOptions: assignBindingToOptions,
        isArray: isArray
    };
})();