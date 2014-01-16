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