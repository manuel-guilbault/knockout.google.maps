/*
*   knockout.google.maps 0.1.0 (2014-01-12)
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
ko.bindingHandlers.infoWindow = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (bindingContext.$map === undefined) {
            throw 'infoWindow binding must be used only inside the scope of a map binding.';
        }

        var bindings = ko.utils.unwrapObservable(valueAccessor());

        element = element.cloneNode(true);
        ko.applyBindingsToDescendants(bindingContext, element);

        var options = {};
        for (var property in ko.bindingHandlers.infoWindow.binders) {
            var binder = ko.bindingHandlers.infoWindow.binders[property];
            if (binder.onBuildOptions) {
                binder.onBuildOptions(bindingContext, bindings, options, ko);
            }
        }
        options.content = element;

        var infoWindow = new google.maps.InfoWindow(options);
        for (var property in ko.bindingHandlers.infoWindow.binders) {
            var binder = ko.bindingHandlers.infoWindow.binders[property];
            if (binder.onCreated) {
                binder.onCreated(bindingContext, bindings, infoWindow, ko);
            }
        }

        if (bindingContext.removeHandlers) {
            bindingContext.removeHandlers.push(function (viewModel) {
                for (var property in ko.bindingHandlers.infoWindow.binders) {
                    var binder = ko.bindingHandlers.infoWindow.binders[property];
                    if (binder.onRemoved) {
                        binder.onRemoved(bindingContext, bindings, viewModel, infoWindow, ko);
                    }
                }
                if (infoWindow.isOpen) {
                    infoWindow.close();
                }
            });
        }

        return { controlsDescendantBindings: true };
    },
    binders: {
        visible: {
            onCreated: function (bindingContext, bindings, infoWindow, ko) {
                infoWindow.isOpen = false;
                if (ko.utils.unwrapObservable(bindings.visible)) {
                    infoWindow.open(bindingContext.map, ko.utils.unwrapObservable(bindings.anchor));
                    infoWindow.isOpen = true;
                }
                if (ko.isObservable(bindings.visible)) {
                    bindings.visible.subscribe(function () {
                        if (infoWindow.isOpen) {
                            infoWindow.close();
                        } else {
                            infoWindow.open(bindingContext.$map, ko.utils.unwrapObservable(bindings.anchor));
                        }
                        infoWindow.isOpen = !infoWindow.isOpen;
                    });
                }
            }
        },
        disableAutoPan: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'disableAutoPan', options, false, function (v) { return !!v; });
            },
            onCreated: function (bindingContext, bindings, infoWindow, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'disableAutoPan', function (v) {
                    infoWindow.setOptions({ disableAutoPan: !!v });
                });
            }
        },
        maxWidth: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'maxWidth', options, 0);
            },
            onCreated: function (bindingContext, bindings, infoWindow, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'maxWidth', function (v) {
                    infoWindow.setOptions({ maxWidth: v });
                });
            }
        },
        pixelOffset: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'pixelOffset', options, new google.maps.Size(0, 0));
            },
            onCreated: function (bindingContext, bindings, infoWindow, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'pixelOffset', function (v) {
                    infoWindow.setOptions({ pixelOffset: v });
                });
            }
        },
        position: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'position', options);
            },
            onCreated: function (bindingContext, bindings, infoWindow, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'position', function (v) { infoWindow.setPosition(v); });
            }
        }
    }
};
ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var elementCopy = element.cloneNode(true);
        var bindings = ko.utils.unwrapObservable(valueAccessor());

        var options = {};
        for (var property in ko.bindingHandlers.map.binders) {
            var binder = ko.bindingHandlers.map.binders[property];
            if (binder.onBuildOptions) {
                binder.onBuildOptions(bindingContext, bindings, options, ko);
            }
        }

        var map = new google.maps.Map(element, options);
        for (var property in ko.bindingHandlers.map.binders) {
            var binder = ko.bindingHandlers.map.binders[property];
            if (binder.onCreated) {
                binder.onCreated(bindingContext, bindings, map, ko);
            }
        }

        var innerBindingContext = bindingContext.extend({ $map: map });
        ko.applyBindingsToDescendants(innerBindingContext, elementCopy);

        return { controlsDescendantBindings: true };
    },
    binders: {
        center: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'center', options);
                ko.google.maps.utils.assignBindingToOptions(bindings, 'panCenter', options, true, function (v) { return !!v; });
            },
            onCreated: function (bindingContext, bindings, map, ko) {
                if (ko.isObservable(bindings.center)) {
                    var isUpdatingCenter = false;
                    google.maps.event.addListener(map, 'center_changed', function () {
                        if (!isUpdatingCenter) {
                            isUpdatingCenter = true;
                            bindings.center(map.getCenter());
                            isUpdatingCenter = false;
                        }
                    });
                    bindings.center.subscribe(function () {
                        if (isUpdatingCenter) return;

                        isUpdatingCenter = true;
                        if (ko.utils.unwrapObservable(bindings.panCenter)) {
                            map.panTo(bindings.center());
                        } else {
                            map.setCenter(bindings.center());
                        }
                        isUpdatingCenter = false;
                    });
                }
            }
        },
        zoom: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'zoom', options, 8);
            },
            onCreated: function (bindingContext, bindings, map, ko) {
                if (ko.isObservable(bindings.zoom)) {
                    google.maps.event.addListener(map, 'zoom_changed', function () {
                        bindings.zoom(map.getZoom());
                    });
                    bindings.zoom.subscribe(function () {
                        map.setZoom(bindings.zoom());
                    });
                }
            }
        },
        mapTypeId: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'mapTypeId', options, google.maps.MapTypeId.ROADMAP);
            },
            onCreated: function (bindingContext, bindings, map, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'mapTypeId', function (v) { map.setMapTypeId(v); });
            }
        },
        bounds: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'bounds', options);
                ko.google.maps.utils.assignBindingToOptions(bindings, 'panBounds', options, true, function (v) { return !!v; });
            },
            onCreated: function (bindingContext, bindings, map, ko) {
                if (ko.isObservable(bindings.bounds)) {
                    var isUpdatingBounds = false;
                    google.maps.event.addListenerOnce(map, 'idle', function () {
                        isUpdatingBounds = true;
                        bindings.bounds(map.getBounds());
                        isUpdatingBounds = false;
                    });
                    google.maps.event.addListener(map, 'bounds_changed', function () {
                        if (!isUpdatingBounds) {
                            isUpdatingBounds = true;
                            bindings.bounds(map.getBounds());
                            isUpdatingBounds = false;
                        }
                    });
                    bindings.bounds.subscribe(function () {
                        if (isUpdatingBounds) return;

                        isUpdatingBounds = true;
                        if (ko.utils.unwrapObservable(bindings.bounds)) {
                            map.panToBounds(bindings.bounds());
                        } else {
                            map.fitBounds(bindings.bounds());
                        }
                        isUpdatingBounds = false;
                    });
                }
            }
        },
        backgroundColor: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'backgroundColor', options);
            }
        },
        //disableDefaultUI,
        //disableDoubleClickZoom,
        draggable: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'draggable', options);
            },
            onCreated: function (bindingContext, bindings, map, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'draggable', function (value) {
                    map.setOptions({ draggable: !!value });
                });
            }
        },
        //draggableCursor,
        //draggingCursor,
        //heading,
        //keyboardShortcuts,
        //mapMaker,
        //mapTypeControl,
        //mapTypeControlOptions,
        //maxZoom,
        //minZoom,
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
    }
};

function bindMapItem(bindingContext, element, item) {
    var childBindingContext = bindingContext.createChildContext(item);
    childBindingContext.removeHandlers = [];
    ko.applyBindingsToDescendants(childBindingContext, element);
    item.__ko_gm_removeHandlers = childBindingContext.removeHandlers;
}

function unbindMapItem(item) {
    for (var k = 0; k < item.__ko_gm_removeHandlers.length; ++k) {
        item.__ko_gm_removeHandlers[k](item);
    }
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
            element.__ko_gm_oldItems = itemsAccessor().slice(0);
            itemsAccessor.subscribe(function () {
                var newItems = itemsAccessor();
                updateMapItems(bindingContext, element, element.__ko_gm_oldItems, newItems);
                element.__ko_gm_oldItems = newItems.slice(0);
            });
        }

        return { controlsDescendantBindings: true };
    }
};
ko.virtualElements.allowedBindings.mapItems = true;
ko.bindingHandlers.marker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (bindingContext.$map === undefined) {
            throw 'marker binding must be used only inside the scope of a map binding.';
        }

        var bindings = ko.utils.unwrapObservable(valueAccessor());

        var options = {};
        for (var property in ko.bindingHandlers.marker.binders) {
            var binder = ko.bindingHandlers.marker.binders[property];
            if (binder.onBuildOptions) {
                binder.onBuildOptions(bindingContext, bindings, options, ko);
            }
        }
        options.map = bindingContext.$map;

        var marker = new google.maps.Marker(options);
        for (var property in ko.bindingHandlers.marker.binders) {
            var binder = ko.bindingHandlers.marker.binders[property];
            if (binder.onCreated) {
                binder.onCreated(bindingContext, bindings, marker, ko);
            }
        }

        if (bindingContext.removeHandlers) {
            bindingContext.removeHandlers.push(function (viewModel) {
                for (var property in ko.bindingHandlers.marker.binders) {
                    var binder = ko.bindingHandlers.marker.binders[property];
                    if (binder.onRemoved) {
                        binder.onRemoved(bindingContext, bindings, viewModel, marker, ko);
                    }
                }
                marker.setMap(null);
            });
        }

        var innerBindingContext = bindingContext.extend({ $marker: marker });
        ko.applyBindingsToDescendants(innerBindingContext, element);

        return { controlsDescendantBindings: true };
    },
    binders: {
        animation: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'animation', options);
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'animation', function (v) { marker.setAnimation(v); });
            },
            onRemoved: function (bindingContext, bindings, viewModel, marker, ko) {
            }
        },
        clickable: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'clickable', options, true, function (v) { return !!v; });
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'clickable', function (v) { marker.setClickable(!!v); });
            }
        },
        cursor: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'cursor', options);
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'cursor', function (v) { marker.setCursor(v); });
            }
        },
        icon: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'icon', options);
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'icon', function (v) { marker.setIcon(v); });
            }
        },
        raiseOnDrag: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'raiseOnDrag', options, true, function (v) { return !!v; });
            }
        },
        shadow: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'shadow', options);
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'shadow', function (v) { marker.setShadow(v); });
            }
        },
        position: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'position', options);
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                if (ko.isObservable(bindings.position)) {
                    var isUpdatingPosition = false;
                    bindings.position.subscribe(function () {
                        if (isUpdatingPosition) return;
                        isUpdatingPosition = true;
                        marker.setPosition(bindings.position());
                        isUpdatingPosition = false;
                    });
                    if (bindings.positionUpdateOnDragEnd) {
                        google.maps.event.addListener(marker, 'dragend', function () {
                            if (isUpdatingPosition) return;
                            isUpdatingPosition = true;
                            bindings.position(marker.getPosition());
                            isUpdatingPosition = false;
                        });
                    } else {
                        google.maps.event.addListener(marker, 'position_changed', function () {
                            if (isUpdatingPosition) return;
                            isUpdatingPosition = true;
                            bindings.position(marker.getPosition());
                            isUpdatingPosition = false;
                        });
                    }
                }
            }
        },
        draggable: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'draggable', options, false, function (v) { return !!v; });
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'draggable', function (v) { marker.setDraggable(!!v); });
            }
        },
        flat: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'flat', options, false, function (v) { return !!v; });
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'flat', function (v) { marker.setFlat(!!v); });
            }
        },
        title: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'title', options, '');
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'title', function (v) { marker.setTitle(v); });
            }
        },
        visible: {
            onBuildOptions: function (bindingContext, bindings, options, ko) {
                ko.google.maps.utils.assignBindingToOptions(bindings, 'visible', options, true, function (v) { return !!v; });
            },
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryObserveBinding(bindings, 'visible', function (v) { marker.setVisible(!!v); });
            }
        },
        click: {
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryRegisterMouseEvent(bindingContext, bindings, 'click', marker);
            }
        },
        doubleclick: {
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryRegisterMouseEvent(bindingContext, bindings, 'dblclick', marker);
            }
        },
        rightclick: {
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryRegisterMouseEvent(bindingContext, bindings, 'rightclick', marker);
            }
        },
        mousedown: {
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryRegisterMouseEvent(bindingContext, bindings, 'mousedown', marker);
            }
        },
        mouseout: {
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryRegisterMouseEvent(bindingContext, bindings, 'mouseout', marker);
            }
        },
        mouseover: {
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryRegisterMouseEvent(bindingContext, bindings, 'mouseover', marker);
            }
        },
        mouseup: {
            onCreated: function (bindingContext, bindings, marker, ko) {
                ko.google.maps.utils.tryRegisterMouseEvent(bindingContext, bindings, 'mouseup', marker);
            }
        }
    }
};
ko.virtualElements.allowedBindings.marker = true;
}));