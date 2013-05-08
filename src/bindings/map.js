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
		        ko.google.maps.utils.assignBindingToOptions(bindings, 'center', options, null, ko.google.maps.utils.positionToGoogleMaps);
		        ko.google.maps.utils.assignBindingToOptions(bindings, 'panCenter', options, true, ko.google.maps.utils.castBoolean);
		    },
		    onCreated: function (bindingContext, bindings, map, ko) {
		        if (ko.isObservable(bindings.center)) {
		            var isUpdatingCenter = false;
		            google.maps.event.addListener(map, 'center_changed', function () {
		                if (!isUpdatingCenter) {
		                    isUpdatingCenter = true;
		                    bindings.center(ko.google.maps.utils.positionFromGoogleMaps(map.getCenter()));
		                    isUpdatingCenter = false;
		                }
		            });
		            bindings.center.subscribe(function () {
		                if (isUpdatingCenter) return;

		                isUpdatingCenter = true;
		                if (ko.utils.unwrapObservable(bindings.panCenter)) {
		                    map.panTo(ko.google.maps.utils.positionToGoogleMaps(bindings.center()));
		                } else {
		                    map.setCenter(ko.google.maps.utils.positionToGoogleMaps(bindings.center()));
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
		        if (ko.isObservable(bindings.mapTypeId)) {
		            bindings.mapTypeId.subscribe(function () {
		                map.setMapTypeId(bindings.mapTypeId());
		            });
		        }
		    }
		},
		bounds: {
		    onBuildOptions: function (bindingContext, bindings, options, ko) {
		        ko.google.maps.utils.assignBindingToOptions(bindings, 'bounds', options, null, ko.google.maps.utils.boundsToGoogleMaps);
		        ko.google.maps.utils.assignBindingToOptions(bindings, 'panBounds', options, true, ko.google.maps.utils.castBoolean);
		    },
		    onCreated: function (bindingContext, bindings, map, ko) {
		        if (ko.isObservable(bindings.bounds)) {
		            var isUpdatingBounds = false;
		            google.maps.event.addListenerOnce(map, 'idle', function () {
		                isUpdatingBounds = true;
		                bindings.bounds(ko.google.maps.utils.boundsFromGoogleMaps(map.getBounds()));
		                isUpdatingBounds = false;
		            });
		            google.maps.event.addListener(map, 'bounds_changed', function () {
		                if (!isUpdatingBounds) {
		                    isUpdatingBounds = true;
		                    bindings.bounds(ko.google.maps.utils.boundsFromGoogleMaps(map.getBounds()));
		                    isUpdatingBounds = false;
		                }
		            });
		            bindings.bounds.subscribe(function () {
		                if (isUpdatingBounds) return;

		                isUpdatingBounds = true;
		                if (ko.utils.unwrapObservable(bindings.bounds)) {
		                    map.panToBounds(ko.google.maps.utils.boundsToGoogleMaps(bindings.bounds()));
		                } else {
		                    map.fitBounds(ko.google.maps.utils.boundsToGoogleMaps(bindings.bounds()));
		                }
		                isUpdatingBounds = false;
		            });
		        }
		    }
		},
		backgroundColor: {
		    onBuildOptions: function (bindingContext, bindings, options, ko) {
		        ko.google.maps.utils.assignBindingToOptions(bindings, 'backgroundColor', options, null);
		    }
		},
		//disableDefaultUI,
		//disableDoubleClickZoom,
		draggable: {
		    onBuildOptions: function (bindingContext, bindings, options, ko) {
		        ko.google.maps.utils.assignBindingToOptions(bindings, 'draggable', options, null);
		    },
		    onCreated: function (bindingContext, bindings, map, ko) {
		        if (ko.isObservable(bindings.draggable)) {
		            bindings.draggable.subscribe(function () {
		                map.setOptions({ draggable: ko.google.maps.utils.castBoolean(bindings.draggable()) });
		            });
		        }
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