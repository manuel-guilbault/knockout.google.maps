/*
*   knockout.google.maps 0.1.0 (2014-01-15)
*   Created by Manuel Guilbault (https://github.com/manuel-guilbault)
*
*   Source: https://github.com/manuel-guilbault/knockout.google.maps
*   MIT License: http://www.opensource.org/licenses/MIT
*/
(function (factory) {
    // Module systems magic dance.

    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require("knockout"), exports);
    } else if (typeof define === "function" && define.amd) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["knockout", "exports"], factory);
    } else {
        // <script> tag: use the global `ko` object, attaching a `mapping` property
        factory(ko, ko.validation = {});
    }
}(function ( ko, exports ) {
    if (typeof (ko) === undefined) { throw "Knockout is required, please ensure it is loaded before loading this plugin"; }
ko.google = {
    maps: { }
};
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

    isArray: function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
};
(function () {
    ko.google.maps.Subscriptions = function () {
        this.handlers = [];
    };

    ko.google.maps.Subscriptions.prototype.add = function (handler) {
        if (typeof handler === 'function') {
            this.handlers.push(handler);
        } else if (ko.google.maps.utils.isArray(handler)) {
            Array.prototype.push.apply(this.handlers, handler);
        } else if (typeof handler === 'object' && handler.prototype === this.prototype) {
            Array.prototype.push.apply(this.handlers, handler.handlers);
        } else {
            throw new TypeError('Invalid subscription');
        }
    };

    ko.google.maps.Subscriptions.prototype.addGMListener = function (listener) {
        this.handlers.push(function () {
            google.maps.event.removeListener(listener);
        });
    };

    ko.google.maps.Subscriptions.prototype.addKOSubscription = function (subscription) {
        this.handlers.push(function () {
            subscription.dispose();
        });
    };

    ko.google.maps.Subscriptions.prototype.dispose = function () {
        for (var i = 0; i < this.handlers.length; ++i) {
            this.handlers[i]();
        }
        this.handlers = [];
    };
})();
(function () {
    function applyCreateOptions(bindingContext, bindings, options, definition) {
        if (typeof definition === 'string') {
            ko.google.maps.utils.assignBindingToOptions(bindings, definition, options);
        } else if (typeof definition === 'object') {
            ko.google.maps.utils.assignBindingToOptions(bindings, definition.name, options, definition.defaultValue, definition.transform);
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
                applySetter(obj, definition.vmToObj.setter, value);
            }));
        } else if (typeof obj.setOptions === 'function' && !definition.vmToObj.noOptions) {
            subscriptions.addKOSubscription(bindings[definition.name].subscribe(function (value) {
                var options = {};
                options[definition.vmToObj.option || definition.name] = value;
                obj.setOptions(options);
            }));
        }

        if (definition.objToVM) {
            subscriptions.addGMListener(google.maps.event.addListener(obj, definition.objToVM.event, function () {
                var value = applyGetter(obj, definition.objToVM.getter);
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
            bindings[event](e);
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
ko.bindingHandlers.infoWindow = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (bindingContext.$map === undefined) {
            throw 'infoWindow binding must be used only inside the scope of a map binding.';
        }

        var bindings = ko.utils.unwrapObservable(valueAccessor());

        var childBindingContext = bindingContext.extend({});
        ko.applyBindingsToDescendants(childBindingContext, element);

        var options = ko.google.maps.binder.getCreateOptions(bindingContext, bindings, ko.bindingHandlers.infoWindow.binders);
        options.content = element;
        var infoWindow = new google.maps.InfoWindow(options);

        var subscriptions = new ko.google.maps.Subscriptions();
        ko.google.maps.binder.bind(bindingContext, bindings, infoWindow, subscriptions, ko.bindingHandlers.infoWindow.binders);

        var parentSubscriptions = bindingContext.$subscriptions;
        parentSubscriptions.add(function () {
            subscriptions.dispose();
            if (ko.utils.domData.get(infoWindow, 'isOpen')) {
                infoWindow.close();
            }
        });

        return { controlsDescendantBindings: true };
    },
    binders: {
        visible: {
            bind: function (bindingContext, bindings, infoWindow, subscriptions) {
                var isOpen = false;
                if (ko.utils.unwrapObservable(bindings.visible)) {
                    infoWindow.open(bindingContext.$map, ko.utils.unwrapObservable(bindings.anchor));
                    isOpen = true;
                }
                ko.utils.domData.set(infoWindow, 'isOpen', isOpen);

                if (ko.isObservable(bindings.visible)) {
                    subscriptions.addKOSubscription(bindings.visible.subscribe(function (isShowing) {
                        var isOpen = ko.utils.domData.get(infoWindow, 'isOpen');
                        if (isOpen && !isShowing) {
                            infoWindow.close();
                        } else if (!isOpen && isShowing) {
                            infoWindow.open(bindingContext.$map, ko.utils.unwrapObservable(bindings.anchor));
                        }
                        ko.utils.domData.set(infoWindow, 'isOpen', isShowing);
                    }));
                    subscriptions.addGMListener(google.maps.event.addListener(infoWindow, 'closeclick', function () {
                        ko.utils.domData.set(infoWindow, 'isOpen', false);
                        bindings.visible(false);
                    }));
                }
            }
        },
        disableAutoPan: {
            createOptions: 'disableAutoPan',
            bindings: 'disableAutoPan'
        },
        maxWidth: {
            createOptions: { name: 'maxWidth', defaultValue: 0 },
            bindings: 'maxWidth'
        },
        pixelOffset: {
            createOptions: { name: 'pixelOffset', defaultValue: new google.maps.Size(0, 0) },
            bindings: 'pixelOffset'
        },
        position: {
            createOptions: 'position',
            bindings: { name: 'position', vmToObj: { setter: 'setPosition' } }
        }
    }
};
ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var bindings = ko.utils.unwrapObservable(valueAccessor());

        // Take copy of map element (because the google.maps.Map constructor will remove all children when creating the map).
        var elementCopy = element.cloneNode(true);

        var options = ko.google.maps.binder.getCreateOptions(bindingContext, bindings, ko.bindingHandlers.map.binders);
        var map = new google.maps.Map(element, options);

        var subscriptions = new ko.google.maps.Subscriptions();
        ko.google.maps.binder.bind(bindingContext, bindings, map, subscriptions, ko.bindingHandlers.map.binders);

        var childBindingContext = bindingContext.extend({ $map: map, $subscriptions: subscriptions });
        ko.applyBindingsToDescendants(childBindingContext, elementCopy);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            // Clear all subscriptions.
            subscriptions.dispose();

            // Clean element copy (so child bindings that added a disposeCallback on it are disposed).
            ko.utils.domNodeDisposal.cleanNode(elementCopy);
        });

        return { controlsDescendantBindings: true };
    },
    binders: {
        center: {
            createOptions: 'center',
            bind: function (bindingContext, bindings, map, subscriptions) {
                if (!ko.isObservable(bindings.center)) return;

                var isUpdatingCenter = false;
                subscriptions.addGMListener(google.maps.event.addListener(map, 'center_changed', function () {
                    if (!isUpdatingCenter) {
                        isUpdatingCenter = true;
                        bindings.center(map.getCenter());
                        isUpdatingCenter = false;
                    }
                }));
                subscriptions.addKOSubscription(bindings.center.subscribe(function () {
                    if (isUpdatingCenter) return;

                    isUpdatingCenter = true;
                    if (ko.utils.unwrapObservable(bindings.panCenter)) {
                        map.panTo(bindings.center());
                    } else {
                        map.setCenter(bindings.center());
                    }
                    isUpdatingCenter = false;
                }));
            }
        },
        zoom: {
            createOptions: { name: 'zoom', defaultValue: 8 },
            bindings: { name: 'zoom', objToVM: { event: 'zoom_changed', getter: 'getZoom' }, vmToObj: { setter: 'setZoom' } }
        },
        mapTypeId: {
            createOptions: 'mapTypeId',
            bindings: { name: 'mapTypeId', vmToObj: { setter: 'setMapTypeId' } }
        },
        bounds: {
            createOptions: 'bounds',
            bind: function (bindingContext, bindings, map, subscriptions) {
                if (!ko.isObservable(bindings.bounds)) return;

                var isUpdatingBounds = false;
                subscriptions.addGMListener(google.maps.event.addListenerOnce(map, 'idle', function () {
                    isUpdatingBounds = true;
                    bindings.bounds(map.getBounds());
                    isUpdatingBounds = false;
                }));
                subscriptions.addGMListener(google.maps.event.addListener(map, 'bounds_changed', function () {
                    if (isUpdatingBounds) return;

                    isUpdatingBounds = true;
                    bindings.bounds(map.getBounds());
                    isUpdatingBounds = false;
                }));
                subscriptions.addKOSubscription(bindings.bounds.subscribe(function () {
                    if (isUpdatingBounds) return;

                    isUpdatingBounds = true;
                    if (ko.utils.unwrapObservable(bindings.panBounds)) {
                        map.panToBounds(bindings.bounds());
                    } else {
                        map.fitBounds(bindings.bounds());
                    }
                    isUpdatingBounds = false;
                }));
            }
        },
        backgroundColor: {
            createOptions: 'backgroundColor'
        },
        //disableDefaultUI,
        //disableDoubleClickZoom,
        draggable: {
            createOptions: 'draggable',
            bindings: 'draggable'
        },
        //draggableCursor,
        //draggingCursor,
        //heading,
        //keyboardShortcuts,
        //mapMaker,
        //mapTypeControl,
        //mapTypeControlOptions,
        maxZoom: {
            createOptions: 'maxZoom',
            bindings: 'draggable'
        },
        minZoom: {
            createOptions: 'minZoom',
            bindings: 'minZoom'
        },
        //overviewMapControl,
        //overviewMapControlOptions,
        //panControl,
        //panControlOptions,
        //rotateControl,
        //rotateControlOptions,
        //scaleControl,
        //scaleControlOptions,
        //scrollwheel,
        //streetView,
        //streetViewControl,
        //streetViewControlOptions,
        //styles,
        //tilt,
        //zoomControl,
        //zoomControlOptions
        dragend: {
            events: 'dragend'
        },
        idle: {
            events: 'idle'
        }
    }
};
(function () {
    function bindMapItem(bindingContext, element, newItem) {
        var subscriptions = ko.utils.domData.get(newItem, 'subscriptions');
        if (!subscriptions) {
            subscriptions = new ko.google.maps.Subscriptions();
            ko.utils.domData.set(newItem, 'subscriptions', subscriptions);
        }

        var childBindingContext = bindingContext.createChildContext(newItem).extend({ $subscriptions: subscriptions });
        ko.applyBindingsToDescendants(childBindingContext, element.cloneNode(true));
    }

    function unbindMapItem(oldItem) {
        var subscriptions = ko.utils.domData.get(oldItem, 'subscriptions');
        if (subscriptions) {
            subscriptions.dispose();
        }
        ko.utils.domData.clear(oldItem);
    }

    function updateMapItems(bindingContext, element, oldItems, newItems) {
        var differences = ko.utils.compareArrays(oldItems, newItems);

        for (var i = 0; i < differences.length; ++i) {
            var difference = differences[i];
            switch (difference.status) {
                case 'added':
                    bindMapItem(bindingContext, element, difference.value);
                    break;
                case 'deleted':
                    unbindMapItem(difference.value);
                    break;
            }
        }
    }

    ko.bindingHandlers.mapItems = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var itemsAccessor = valueAccessor();

            var items = ko.utils.unwrapObservable(itemsAccessor);
            for (var i = 0; i < items.length; ++i) {
                bindMapItem(bindingContext, element, items[i]);
            }

            if (ko.isObservable(itemsAccessor)) {
                ko.utils.domData.set(element, 'oldItems', itemsAccessor().slice(0));

                itemsAccessor.subscribe(function () {
                    var newItems = itemsAccessor();
                    var oldItems = ko.utils.domData.get(element, 'oldItems');
                    updateMapItems(bindingContext, element, oldItems, newItems);
                    ko.utils.domData.set(element, 'oldItems', newItems.slice(0));
                });
            }

            return { controlsDescendantBindings: true };
        }
    };
    ko.virtualElements.allowedBindings.mapItems = true;
})();
ko.bindingHandlers.marker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (bindingContext.$map === undefined) {
            throw 'marker binding must be used only inside the scope of a map binding.';
        }

        var bindings = ko.utils.unwrapObservable(valueAccessor());

        var options = ko.google.maps.binder.getCreateOptions(bindingContext, bindings, ko.bindingHandlers.marker.binders);
        options.map = bindingContext.$map;
        var marker = new google.maps.Marker(options);

        var subscriptions = new ko.google.maps.Subscriptions();
        ko.google.maps.binder.bind(bindingContext, bindings, marker, subscriptions, ko.bindingHandlers.marker.binders);

        var childBindingContext = bindingContext.extend({ $marker: marker, $subscriptions: subscriptions });
        ko.applyBindingsToDescendants(childBindingContext, element);

        var parentSubscriptions = bindingContext.$subscriptions;
        parentSubscriptions.add(function () {
            subscriptions.dispose();
            marker.setMap(null);
        });

        return { controlsDescendantBindings: true };
    },
    binders: {
        animation: {
            createOptions: 'animation',
            bindings: { name: 'animation', vmToObj: { setter: 'setAnimation' } }
        },
        clickable: {
            createOptions: 'clickable',
            bindings: { name: 'clickable', vmToObj: { setter: 'setClickable' } }
        },
        cursor: {
            createOptions: 'cursor',
            bindings: { name: 'cursor', vmToObj: { setter: 'setCursor' } }
        },
        icon: {
            createOptions: 'icon',
            bindings: { name: 'icon', vmToObj: { setter: 'setIcon' } }
        },
        raiseOnDrag: {
            createOptions: 'raiseOnDrag'
        },
        shadow: {
            createOptions: 'shadow',
            bindings: { name: 'shadow', vmToObj: { setter: 'setShadow' } }
        },
        position: {
            createOptions: 'position',
            bind: function (bindingContext, bindings, marker, subscriptions) {
                if (!ko.isObservable(bindings.position)) return;

                var isUpdatingPosition = false;
                subscriptions.addKOSubscription(bindings.position.subscribe(function () {
                    if (isUpdatingPosition) return;
                    isUpdatingPosition = true;
                    marker.setPosition(bindings.position());
                    isUpdatingPosition = false;
                }));

                var positionChangedEvent = ko.utils.unwrapObservable(bindings.positionUpdateOnDragEnd) ? 'dragend' : 'position_changed';
                subscriptions.addGMListener(google.maps.event.addListener(marker, positionChangedEvent, function () {
                    if (isUpdatingPosition) return;
                    isUpdatingPosition = true;
                    bindings.position(marker.getPosition());
                    isUpdatingPosition = false;
                }));
            }
        },
        draggable: {
            createOptions: 'draggable',
            bindings: { name: 'draggable', vmToObj: { setter: 'setDraggable' } }
        },
        flat: {
            createOptions: 'flat',
            bindings: { name: 'flat', vmToObj: { setter: 'setFlat' } }
        },
        title: {
            createOptions: 'title',
            bindings: { name: 'title', vmToObj: { setter: 'setTitle' } }
        },
        visible: {
            createOptions: 'visible',
            bindings: { name: 'visible', vmToObj: { setter: 'setVisible' } }
        },
        click: {
            events: 'click'
        },
        doubleclick: {
            events: 'dblclick'
        },
        rightclick: {
            events: 'rightclick'
        },
        mousedown: {
            events: 'mousedown'
        },
        mouseout: {
            events: 'mouseout'
        },
        mouseover: {
            events: 'mouseover'
        },
        mouseup: {
            events: 'mouseup'
        }
    }
};
ko.virtualElements.allowedBindings.marker = true;
}));