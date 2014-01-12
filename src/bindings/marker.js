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