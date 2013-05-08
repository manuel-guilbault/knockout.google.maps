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
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'animation', options, null);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'animation', marker, 'setAnimation');
			},
			onRemoved: function (bindingContext, bindings, viewModel, marker, ko) {
			}
		},
		clickable: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'clickable', options, true, ko.google.maps.utils.castBoolean);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'clickable', marker, 'setClickable', ko.google.maps.utils.castBoolean);
			}
		},
		cursor: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'cursor', options, null);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'cursor', marker, 'setCursor');
			}
		},
		icon: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'icon', options, null);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'icon', marker, 'setIcon');
			}
		},
		raiseOnDrag: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'raiseOnDrag', options, true, ko.google.maps.utils.castBoolean);
			}
		},
		shadow: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'shadow', options, null);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'shadow', marker, 'setShadow');
			}
		},
		position: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'position', options, null, ko.google.maps.utils.positionToGoogleMaps);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    if (ko.isObservable(bindings.position)) {
					var isUpdatingPosition = false;
					bindings.position.subscribe(function () {
						if (isUpdatingPosition) return;
						isUpdatingPosition = true;
						marker.setPosition(ko.google.maps.utils.positionToGoogleMaps(bindings.position()));
						isUpdatingPosition = false;
					});
					if (bindings.positionUpdateOnDragEnd) {
						google.maps.event.addListener(marker, 'dragend', function () {
							if (isUpdatingPosition) return;
							isUpdatingPosition = true;
							bindings.position(ko.google.maps.utils.positionFromGoogleMaps(marker.getPosition()));
							isUpdatingPosition = false;
						});
					} else {
						google.maps.event.addListener(marker, 'position_changed', function () {
							if (isUpdatingPosition) return;
							isUpdatingPosition = true;
							bindings.position(ko.google.maps.utils.positionFromGoogleMaps(marker.getPosition()));
							isUpdatingPosition = false;
						});
					}
				}
			}
		},
		draggable: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'draggable', options, false, ko.google.maps.utils.castBoolean);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'draggable', marker, 'setDraggable', ko.google.maps.utils.castBoolean);
			}
		},
		flat: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'flat', options, false, ko.google.maps.utils.castBoolean);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'flat', marker, 'setFlat', ko.google.maps.utils.castBoolean);
			}
		},
		title: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'title', options, '');
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'title', marker, 'setTitle');
			}
		},
		visible: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
			    ko.google.maps.utils.assignBindingToOptions(bindings, 'visible', options, true, ko.google.maps.utils.castBoolean);
			},
			onCreated: function (bindingContext, bindings, marker, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'visible', marker, 'setVisible', ko.google.maps.utils.castBoolean);
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