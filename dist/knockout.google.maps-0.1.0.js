// Knockout JavaScript library v0.1.0
// (c) Steven Sanderson - http://knockoutjs.com/
// Knockout bindings for Google Maps V3 v##VERSION##
// (c) Manuel Guilbault - https://github.com/manuel-guilbault/knockout.google.maps
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
(function(undefined){
    // (0, eval)('this') is a robust way of getting a reference to the global object
    // For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
    var window = this || (0, eval)('this'),
        document = window['document'],
        navigator = window['navigator'],
        jQuery = window["jQuery"],
        JSON = window["JSON"];
!function(factory) {
    // Support three module loading scenarios
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [1] CommonJS/Node.js
        var target = module['exports'] || exports; // module.exports is for Node.js
        factory(target);
    } else if (typeof define === 'function' && define['amd']) {
        // [2] AMD anonymous module
        define(['exports'], factory);
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko']);
    }
}(function(ko){
﻿ko.google = {
    maps: { }
};
﻿ko.google.maps.utils = {

    // Transform a position object (having decimal latitude and longitude properties) into a google.maps.LatLng object.
    positionToGoogleMaps: function (position) {
        return position ? new google.maps.LatLng(position.latitude, position.longitude) : null;
    },
	
    // Transform a google.maps.LatLng object into a position object (with decimal latitude and longitude properties).
    positionFromGoogleMaps: function (position) {
        return position ? {
            latitude: position.lat(),
            longitude: position.lng()
        } : null;
    },

    // Transform a bounds object (having position southWest and northEast properties) into a google.maps.LatLngBounds object.
    boundsToGoogleMaps: function (bounds) {
        return bounds ? new google.maps.LatLngBounds(
			ko.google.maps.utils.positionToGoogleMaps(bounds.southWest),
			ko.google.maps.utils.positionToGoogleMaps(bounds.northEast)
		) : null;
    },

    // Transform a google.maps.LatLngBounds object into a bounds object (with position southWest and northEast properties).
    boundsFromGoogleMaps: function (bounds) {
        return bounds ? {
            southWest: ko.google.maps.utils.positionFromGoogleMaps(bounds.getSouthWest()),
            northEast: ko.google.maps.utils.positionFromGoogleMaps(bounds.getNorthEast())
        } : null;
    },

    // Transform a size object (having int width and height properties) into a google.
    sizeToGoogleMaps: function (size) {
        return size ? new google.maps.Size(size.width, size.height) : null;
    },

    // Cast an arbitrary value into a type-safe boolean.
    castBoolean: function (value) {
        return !!value;
    },

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
            bindings[property].subscribe(function () {
                var value = bindings[property]();
                handler(value);
            });
        }
    },

    tryObserveBindingForSetter: function (bindings, property, target, setter, transform) {
        this.tryObserveBinding(bindings, property, function (value) {
            if (transform) {
                value = transform(value);
            }
            target[setter](value);
        });
    },

    tryRegisterPropertyChange: function (bindings, property, target, eventName, handler) {
        if (ko.isObservable(bindings[property])) {
            google.maps.addListener(target, eventName, handler);
        }
    },

    // Map a google.maps.MouseEvent to a mouse event object (having a position property and a stop method).
    mapMouseEvent: function (event) {
        return {
            position: ko.google.maps.utils.positionFromGoogleMaps(event.latLng),
            stop: function () {
                event.stop();
            }
        };
    },

    // Try to register a given mouse event on a given target.
    tryRegisterMouseEvent: function (bindingContext, bindings, eventName, target) {
        if (typeof bindings[eventName] === 'function') {
            google.maps.event.addListener(target, eventName, function (event) {
                bindings[eventName](ko.google.maps.utils.mapMouseEvent(event));
            });
        }
    },

    bindMapItem: function (bindingContext, element, item) {
        var childBindingContext = bindingContext.createChildContext(item);
        childBindingContext.removeHandlers = [];
        ko.applyBindingsToDescendants(childBindingContext, element);
        item.__ko_gm_removeHandlers = childBindingContext.removeHandlers;
    },

    unbindMapItem: function (item) {
        for (var k = 0; k < item.__ko_gm_removeHandlers.length; ++k) {
            item.__ko_gm_removeHandlers[k](item);
        }
    },

    updateMapItems: function (bindingContext, element, oldItems, newItems) {
        var differences = ko.utils.compareArrays(oldItems, newItems);

        for (var i = 0; i < differences.length; ++i) {
            var difference = differences[i];
            switch (difference.status) {
                case 'added':
                    ko.google.maps.utils.bindMapItem(bindingContext, element, difference.value);
                    break;
                case 'deleted':
                    ko.google.maps.utils.unbindMapItem(difference.value);
                    break;
            }
        }
    }
};
﻿ko.bindingHandlers.map = {
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
﻿ko.bindingHandlers.mapItems = {
	init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var itemsAccessor = valueAccessor();

		var items = ko.utils.unwrapObservable(itemsAccessor);
		for (var i = 0; i < items.length; ++i) {
			ko.google.maps.utils.bindMapItem(bindingContext, element, items[i]);
		}

		if (ko.isObservable(itemsAccessor)) {
			element.__ko_gm_oldItems = itemsAccessor().slice(0);
			itemsAccessor.subscribe(function () {
			    var newItems = itemsAccessor();
			    ko.google.maps.utils.updateMapItems(bindingContext, element, element.__ko_gm_oldItems, newItems);
			    element.__ko_gm_oldItems = newItems.slice(0);
			});
		}

		return { controlsDescendantBindings: true };
	}
};
ko.virtualElements.allowedBindings.mapItems = true;
﻿ko.bindingHandlers.marker = {
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
﻿ko.bindingHandlers.infoWindow = {
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
﻿var defaultClustererName = '$clusterer';

function getClusterer(bindings, bindingContext) {
    var name = ko.utils.unwrapObservable(bindings.clusterer) || defaultClustererName;
    return bindingContext[name];
}

ko.bindingHandlers.clusterer = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		if (bindingContext.$map === undefined) {
			throw 'marker binding must be used only inside the scope of a map binding.';
		}

		var bindings = ko.utils.unwrapObservable(valueAccessor());

		var options = {};
		for (var property in ko.bindingHandlers.clusterer.binders) {
			var binder = ko.bindingHandlers.clusterer.binders[property];
			if (binder.onBuildOptions) {
				binder.onBuildOptions(bindingContext, bindings, options, ko);
			}
		}

		var clusterer = new MarkerClusterer(bindingContext.$map, [], options);
		for (var property in ko.bindingHandlers.clusterer.binders) {
			var binder = ko.bindingHandlers.clusterer.binders[property];
			if (binder.onCreated) {
				binder.onCreated(bindingContext, bindings, clusterer, ko);
			}
		}

		var name = ko.utils.unwrapObservable(bindings.name) || defaultClustererName;

		var extension = {};
		extension[name] = clusterer;
		var innerBindingContext = bindingContext.extend(extension);
		ko.applyBindingsToDescendants(innerBindingContext, element);

		return { controlsDescendantBindings: true };
	},
	binders: {
		gridSize: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
				ko.google.maps.utils.assignBindingToOptions(bindings, 'gridSize', options, null);
			},
			onCreated: function (bindingContext, bindings, clusterer, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'gridSize', clusterer, 'setGridSize');
			}
		},
		maxZoom: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
				ko.google.maps.utils.assignBindingToOptions(bindings, 'maxZoom', options, null);
			},
			onCreated: function (bindingContext, bindings, clusterer, ko) {
			    ko.google.maps.utils.tryObserveBindingForSetter(bindings, 'maxZoom', clusterer, 'setMaxZoom');
			}
		},
		styles: {
			onBuildOptions: function (bindingContext, bindings, options, ko) {
				ko.google.maps.utils.assignBindingToOptions(bindings, 'styles', options, null);
			},
			onCreated: function (bindingContext, bindings, clusterer, ko) {
				if (ko.isObservable(bindings.styles)) {
					bindings.styles.subscribe(function () {
						clusterer.setStyles(bindings.styles());
						clusterer.resetViewport();
						clusterer.redraw();
					});
				}
			}
		}
	}
};
ko.virtualElements.allowedBindings.clusterer = true;

ko.bindingHandlers.marker.binders.clusterer = {
	onCreated: function (bindingContext, bindings, marker, ko) {
	    var clusterer = getClusterer(bindings, bindingContext);
	    if (clusterer) {
	        clusterer.addMarker(marker);
		}
	},
	onRemoved: function (bindingContext, bindings, viewModel, marker, ko) {
	    var clusterer = getClusterer(bindings, bindingContext);
	    if (clusterer) {
	        clusterer.removeMarker(marker);
		}
	}
};
});
}());