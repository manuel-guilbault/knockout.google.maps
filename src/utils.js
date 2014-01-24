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

    /*
        Because IE8's cloneNode copies expando properties (see http://msdn.microsoft.com/en-us/library/ie/ms536365(v=vs.85).aspx),
        when an element is cloned, the clone and the original will share the data from ko.utils.domData (which causes issue when disposing
        dependencies). This method clones an element, then makes sure to find and delete the data store key expando property.
        This solution is britle and will break if the __ko__ prefix changes.
    */
    function cloneNode(element, deep) {
        var clone = element.cloneNode(deep);
        for (var key in clone) {
            if (key.indexOf('__ko__') === 0) {
                // Since IE8 does not support deleting an expando property, we need to set it to undefined to work around it.
                clone[key] = undefined;
            }
        }
        return clone;
    }

    ko.google.maps.utils = {
        typeConverters: typeConverters,
        convertObjToVM: convertObjToVM,
        convertVMToObj: convertVMToObj,
        assignBindingToOptions: assignBindingToOptions,
        isArray: isArray,
        cloneNode: cloneNode
    };
})();