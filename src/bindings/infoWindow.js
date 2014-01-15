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
        },
        alignBottom: {
            createOptions: 'alignBottom'
        },
        boxClass: {
            createOptions: 'boxClass'
        },
        infoBoxClearance: {
            createOptions: 'boxClass'
        }
    }
};