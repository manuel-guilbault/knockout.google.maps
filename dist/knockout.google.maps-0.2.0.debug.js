/*
*   knockout.google.maps 0.2.0 (2014-01-27)
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
(function () {
    var subscriptions = function () {
        this.handlers = [];
    };

    subscriptions.prototype.add = function (handler) {
        if (typeof handler === 'function') {
            this.handlers.push(handler);
        } else if (ko.google.maps.utils.isArray(handler)) {
            Array.prototype.push.apply(this.handlers, handler);
        } else if (typeof handler === 'object' && Object.getPrototypeOf(handler) === subscriptions.prototype) {
            Array.prototype.push.apply(this.handlers, handler.handlers);
        } else {
            throw new TypeError('Invalid subscription');
        }
    };

    subscriptions.prototype.addGMListener = function (listener) {
        this.handlers.push(function () {
            google.maps.event.removeListener(listener);
        });
    };

    subscriptions.prototype.addKOSubscription = function (subscription) {
        this.handlers.push(function () {
            subscription.dispose();
        });
    };

    subscriptions.prototype.clear = function () {
        this.handlers = [];
    };

    subscriptions.prototype.dispose = function () {
        for (var i = 0; i < this.handlers.length; ++i) {
            this.handlers[i]();
        }
        this.clear();
    };

    ko.google.maps.Subscriptions = subscriptions;
})();
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
(function () {
    function renderRoute(renderer, route, map) {
        if (route) {
            renderer.setDirections(route);
            renderer.setMap(map);
        } else {
            renderer.setMap(null);
        }
    }

    ko.bindingHandlers.directions = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            if (bindingContext.$map === undefined) {
                throw 'directions binding must be used only inside the scope of a map binding.';
            }

            var bindings = ko.utils.unwrapObservable(valueAccessor());

            var routeBinding = bindings.route;
            if (routeBinding === undefined) {
                throw 'directions binding must have a route binding.';
            }

            var options = ko.google.maps.binder.getCreateOptions(bindingContext, bindings, ko.bindingHandlers.directions.binders);
            var directionsRenderer = new google.maps.DirectionsRenderer(options);

            var subscriptions = new ko.google.maps.Subscriptions();
            ko.google.maps.binder.bind(bindingContext, bindings, directionsRenderer, subscriptions, ko.bindingHandlers.directions.binders);

            renderRoute(directionsRenderer, ko.utils.unwrapObservable(routeBinding), bindingContext.$map);

            if (ko.isObservable(routeBinding)) {
                subscriptions.addKOSubscription(routeBinding.subscribe(function (route) {
                    renderRoute(directionsRenderer, route, bindingContext.$map);
                }));
            }

            var parentSubscriptions = bindingContext.$subscriptions;
            parentSubscriptions.add(function () {
                subscriptions.dispose();
                directionsRenderer.setMap(null);
            });

            return { controlsDescendantBindings: true };
        },
        binders: {
            draggable: {
                createOptions: { name: 'draggable', type: 'bool' }
            },
            //hideRouteList
            //infoWindow
            //markerOptions
            //panel
            //polylineOptions
            //preserveViewport
            //routeIndex
            suppressBicyclingLayer: {
                createOptions: { name: 'suppressBicyclingLayer', type: 'bool' },
                bindings: { name: 'suppressBicyclingLayer', type: 'bool' }
            },
            suppressMarkers: {
                createOptions: { name: 'suppressMarkers', type: 'bool' },
                bindings: { name: 'suppressMarkers', type: 'bool' }
            },
            suppressInfoWindows: {
                createOptions: { name: 'suppressInfoWindows', type: 'bool' },
                bindings: { name: 'suppressInfoWindows', type: 'bool' }
            },
            suppressPolylines: {
                createOptions: { name: 'suppressPolylines', type: 'bool' },
                bindings: { name: 'suppressPolylines', type: 'bool' }
            }
        }
    };
})();
(function () {
    function isOpen(infoWindow) {
        return ko.utils.domData.get(infoWindow, 'isOpen');
    }

    function setOpen(infoWindow, isOpen) {
        ko.utils.domData.set(infoWindow, 'isOpen', !!isOpen);
    }

    function dispose(infoWindow) {
        if (isOpen(infoWindow)) {
            infoWindow.close();
        }
        ko.utils.domData.clear(infoWindow);
    }

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
                dispose(infoWindow);
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
                    setOpen(infoWindow, isOpen);

                    if (ko.isObservable(bindings.visible)) {
                        subscriptions.addKOSubscription(bindings.visible.subscribe(function (isShowing) {
                            var isOpen = isOpen(infoWindow);
                            if (isOpen && !isShowing) {
                                infoWindow.close();
                            } else if (!isOpen && isShowing) {
                                infoWindow.open(bindingContext.$map, ko.utils.unwrapObservable(bindings.anchor));
                            }
                            setOpen(infoWindow, isShowing);
                        }));
                        subscriptions.addGMListener(google.maps.event.addListener(infoWindow, 'closeclick', function () {
                            setOpen(infoWindow, false);
                            bindings.visible(false);
                        }));
                    }
                }
            },
            panToSelfWhenShown: {
                bind: function (bindingContext, bindings, infoWindow, subscriptions) {
                    if (ko.isObservable(bindings.visible)) {
                        subscriptions.addKOSubscription(bindings.visible.subscribe(function (visible) {
                            if (ko.utils.unwrapObservable(bindings.panToSelfWhenShown) && visible) {
                                infoWindow.panToSelf();
                            }
                        }));
                    } else if (ko.utils.unwrapObservable(bindings.panToSelfWhenShown) && ko.utils.unwrapObservable(bindings.visible)) {
                        infoWindow.panToSelf();
                    }
                }
            },
            disableAutoPan: {
                createOptions: { name: 'disableAutoPan', type: 'bool' },
                bindings: { name: 'disableAutoPan', type: 'bool' }
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
})();
ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var bindings = ko.utils.unwrapObservable(valueAccessor());

        // Take copy of map element (because the google.maps.Map constructor will remove all children when creating the map).
        var elementCopy = ko.google.maps.utils.cloneNode(element, true);

        var options = ko.google.maps.binder.getCreateOptions(bindingContext, bindings, ko.bindingHandlers.map.binders);
        var map = new google.maps.Map(element, options);

        var subscriptions = new ko.google.maps.Subscriptions();
        ko.google.maps.binder.bind(bindingContext, bindings, map, subscriptions, ko.bindingHandlers.map.binders);

        var childBindingContext = bindingContext.extend({ $map: map, $subscriptions: subscriptions });
        ko.applyBindingsToDescendants(childBindingContext, elementCopy);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            // Clear all subscriptions.
            subscriptions.dispose();

            // Clean element copy (so child bindings that added a disposeCallback on it or one of its child are disposed).
            ko.cleanNode(elementCopy);
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
            createOptions: { name: 'draggable', type: 'bool' },
            bindings: { name: 'draggable', type: 'bool' }
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
            bindings: 'maxZoom'
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
    var __ko_gm_itemsKey = 'ko.google.maps.items';
    var __ko_gm_itemsSubscriptionsKey = 'ko.google.maps.items.subscriptions';

    function bindMapItem(bindingContext, element, item, subscriptions) {
        var elementClone = ko.google.maps.utils.cloneNode(element, true);
        subscriptions.add(function() {
            ko.cleanNode(elementClone);
        });

        var childBindingContext = bindingContext.createChildContext(item).extend({ $subscriptions: subscriptions });
        ko.applyBindingsToDescendants(childBindingContext, elementClone);
    }

    function updateMapItems(bindingContext, element, newItems) {
        var oldItems = ko.utils.domData.get(element, __ko_gm_itemsKey) || [];
        var subscriptions = ko.utils.domData.get(element, __ko_gm_itemsSubscriptionsKey) || [];

        var itemSubscriptions,
            differences = ko.utils.compareArrays(oldItems, newItems);
        for (var i = 0; i < differences.length; ++i) {
            var difference = differences[i];
            switch (difference.status) {
                case 'added':
                    itemSubscriptions = new ko.google.maps.Subscriptions();
                    bindMapItem(bindingContext, element, difference.value, itemSubscriptions);
                    subscriptions.splice(difference.index, 0, itemSubscriptions);
                    break;

                case 'deleted':
                    itemSubscriptions = subscriptions.splice(difference.index, 1);
                    itemSubscriptions[0].dispose();
                    break;
            }
        }

        ko.utils.domData.set(element, __ko_gm_itemsKey, newItems.slice(0));
        ko.utils.domData.set(element, __ko_gm_itemsSubscriptionsKey, subscriptions);
    }

    function clearMapItems(bindingContext, element) {
        var subscriptions = ko.utils.domData.get(element, __ko_gm_itemsSubscriptionsKey) || [];

        for (var i = 0; i < subscriptions.length; ++i) {
            subscriptions[i].dispose();
        }
    }

    ko.bindingHandlers.mapItems = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var itemsAccessor = valueAccessor();

            var items = ko.utils.unwrapObservable(itemsAccessor);
            updateMapItems(bindingContext, element, items);

            var subscriptions = new ko.google.maps.Subscriptions();

            if (ko.isObservable(itemsAccessor)) {
                subscriptions.addKOSubscription(itemsAccessor.subscribe(function (newItems) {
                    updateMapItems(bindingContext, element, newItems);
                }));
            }

            var parentSubscriptions = bindingContext.$subscriptions;
            parentSubscriptions.add(function () {
                clearMapItems(bindingContext, element);
            });

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
            createOptions: { name: 'clickable', type: 'bool' },
            bindings: { name: 'clickable', type: 'bool', vmToObj: { setter: 'setClickable' } }
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
            createOptions: { name: 'raiseOnDrag', type: 'bool' }
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
            createOptions: { name: 'draggable', type: 'bool' },
            bindings: { name: 'draggable', vmToObj: { setter: 'setDraggable' } }
        },
        flat: {
            createOptions: { name: 'flat', type: 'bool' },
            bindings: { name: 'flat', type: 'bool', vmToObj: { setter: 'setFlat' } }
        },
        title: {
            createOptions: 'title',
            bindings: { name: 'title', vmToObj: { setter: 'setTitle' } }
        },
        visible: {
            createOptions: { name: 'visible', type: 'bool' },
            bindings: { name: 'visible', type: 'bool', vmToObj: { setter: 'setVisible' } }
        },
        zIndex: {
            createOptions: 'zIndex',
            bindings: { name: 'zIndex', vmToObj: { setter: 'setZIndex' } }
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