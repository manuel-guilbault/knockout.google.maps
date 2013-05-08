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
	            ko.google.maps.utils.assignBindingToOptions(bindings, 'disableAutoPan', options, false, ko.google.maps.utils.castBoolean);
	        },
	        onCreated: function (bindingContext, bindings, infoWindow, ko) {
	            if (ko.isObservable(bindings.disableAutoPan)) {
	                bindings.disableAutoPan.subscribe(function () {
	                    infoWindow.setOptions({ disableAutoPan: ko.google.maps.utils.castBoolean(bindings.disableAutoPan()) });
	                });
	            }
	        }
	    },
	    maxWidth: {
	        onBuildOptions: function (bindingContext, bindings, options, ko) {
	            ko.google.maps.utils.assignBindingToOptions(bindings, 'maxWidth', options, 0);
	        },
	        onCreated: function (bindingContext, bindings, infoWindow, ko) {
	            if (ko.isObservable(bindings.maxWidth)) {
	                bindings.maxWidth.subscribe(function () {
	                    infoWindow.setOptions({ maxWidth: bindings.maxWidth() });
	                });
	            }
	        }
	    },
	    pixelOffset: {
	        onBuildOptions: function (bindingContext, bindings, options, ko) {
	            ko.google.maps.utils.assignBindingToOptions(bindings, 'pixelOffset', options, { width: 0, height: 0 }, ko.google.maps.utils.sizeToGoogleMaps);
	        },
	        onCreated: function (bindingContext, bindings, infoWindow, ko) {
	            if (ko.isObservable(bindings.pixelOffset)) {
	                bindings.pixelOffset.subscribe(function () {
	                    infoWindow.setOptions({ pixelOffset: ko.google.maps.utils.sizeToGoogleMaps(bindings.pixelOffset()) });
	                });
	            }
	        }
	    },
	    position: {
	        onBuildOptions: function (bindingContext, bindings, options, ko) {
	            ko.google.maps.utils.assignBindingToOptions(bindings, 'position', options, null, ko.google.maps.utils.positionToGoogleMaps);
	        },
	        onCreated: function (bindingContext, bindings, infoWindow, ko) {
	            if (ko.isObservable(bindings.position)) {
	                bindings.position.subscribe(function () {
	                    infoWindow.setPosition(ko.google.maps.utils.positionToGoogleMaps(bindings.position()));
	                });
	            }
	        }
	    }
	}
};