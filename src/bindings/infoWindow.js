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
                    var isInfoWindowOpen = false;
                    if (ko.utils.unwrapObservable(bindings.visible)) {
                        infoWindow.open(bindingContext.$map, ko.utils.unwrapObservable(bindings.anchor));
                        isInfoWindowOpen = true;
                    }
                    setOpen(infoWindow, isInfoWindowOpen);

                    if (ko.isObservable(bindings.visible)) {
                        subscriptions.addKOSubscription(bindings.visible.subscribe(function (isShowing) {
                            var isInfoWindowOpen = isOpen(infoWindow);
                            if (isInfoWindowOpen && !isShowing) {
                                infoWindow.close();
                            } else if (!isInfoWindowOpen && isShowing) {
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