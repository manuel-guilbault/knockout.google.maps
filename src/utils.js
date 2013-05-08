ko.google.maps.utils = {

    // Transform a position object (having decimal latitude and longitude properties) into a google.maps.LatLng object.
    positionToGoogleMaps: function (position) {
        return position ? new google.maps.LatLng(position.latitude, position.longitude) : null;
    },
	
    // Transform a google.maps.LatLng object into a position object (with decimal latitude and longitude properties).
    positionFromGoogleMaps: function (position) {
        return position ? {
            latitude: position.lat(),
            longitude: position.lng()
        } : null;
    },

    // Transform a bounds object (having position southWest and northEast properties) into a google.maps.LatLngBounds object.
    boundsToGoogleMaps: function (bounds) {
        return bounds ? new google.maps.LatLngBounds(
			ko.google.maps.utils.positionToGoogleMaps(bounds.southWest),
			ko.google.maps.utils.positionToGoogleMaps(bounds.northEast)
		) : null;
    },

    // Transform a google.maps.LatLngBounds object into a bounds object (with position southWest and northEast properties).
    boundsFromGoogleMaps: function (bounds) {
        return bounds ? {
            southWest: ko.google.maps.utils.positionFromGoogleMaps(bounds.getSouthWest()),
            northEast: ko.google.maps.utils.positionFromGoogleMaps(bounds.getNorthEast())
        } : null;
    },

    // Transform a size object (having int width and height properties) into a google.
    sizeToGoogleMaps: function (size) {
        return size ? new google.maps.Size(size.width, size.height) : null;
    },

    // Cast an arbitrary value into a type-safe boolean.
    castBoolean: function (value) {
        return !!value;
    },

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
            bindings[property].subscribe(function () {
                var value = bindings[property]();
                handler(value);
            });
        }
    },

    tryObserveBindingForSetter: function (bindings, property, target, setter, transform) {
        this.tryObserveBinding(bindings, property, function (value) {
            if (transform) {
                value = transform(value);
            }
            target[setter](value);
        });
    },

    tryRegisterPropertyChange: function (bindings, property, target, eventName, handler) {
        if (ko.isObservable(bindings[property])) {
            google.maps.addListener(target, eventName, handler);
        }
    },

    // Map a google.maps.MouseEvent to a mouse event object (having a position property and a stop method).
    mapMouseEvent: function (event) {
        return {
            position: ko.google.maps.utils.positionFromGoogleMaps(event.latLng),
            stop: function () {
                event.stop();
            }
        };
    },

    // Try to register a given mouse event on a given target.
    tryRegisterMouseEvent: function (bindingContext, bindings, eventName, target) {
        if (typeof bindings[eventName] === 'function') {
            google.maps.event.addListener(target, eventName, function (event) {
                bindings[eventName](ko.google.maps.utils.mapMouseEvent(event));
            });
        }
    },

    bindMapItem: function (bindingContext, element, item) {
        var childBindingContext = bindingContext.createChildContext(item);
        childBindingContext.removeHandlers = [];
        ko.applyBindingsToDescendants(childBindingContext, element);
        item.__ko_gm_removeHandlers = childBindingContext.removeHandlers;
    },

    unbindMapItem: function (item) {
        for (var k = 0; k < item.__ko_gm_removeHandlers.length; ++k) {
            item.__ko_gm_removeHandlers[k](item);
        }
    },

    updateMapItems: function (bindingContext, element, oldItems, newItems) {
        var differences = ko.utils.compareArrays(oldItems, newItems);

        for (var i = 0; i < differences.length; ++i) {
            var difference = differences[i];
            switch (difference.status) {
                case 'added':
                    ko.google.maps.utils.bindMapItem(bindingContext, element, difference.value);
                    break;
                case 'deleted':
                    ko.google.maps.utils.unbindMapItem(difference.value);
                    break;
            }
        }
    }
};