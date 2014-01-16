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