ko.bindingHandlers.marker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (bindingContext.$map === undefined) {
            throw 'marker binding must be used only inside the scope of a map binding.';
        }

        var bindings = ko.utils.unwrapObservable(valueAccessor());

        var options = ko.google.maps.binder.getCreateOptions(bindingContext, bindings, ko.bindingHandlers.marker.binders);
        options.map = bindingContext.$map;
        var marker = new google.maps.Marker(options);

        var subscriptions = new ko.google.maps.Subscriptions();
        ko.google.maps.binder.bind(bindingContext, bindings, marker, subscriptions, ko.bindingHandlers.marker.binders);

        var childBindingContext = bindingContext.extend({ $marker: marker, $subscriptions: subscriptions });
        ko.applyBindingsToDescendants(childBindingContext, element);

        var parentSubscriptions = bindingContext.$subscriptions;
        parentSubscriptions.add(function () {
            subscriptions.dispose();
            marker.setMap(null);
        });

        return { controlsDescendantBindings: true };
    },
    binders: {
        animation: {
            createOptions: 'animation',
            bindings: { name: 'animation', vmToObj: { setter: 'setAnimation' } }
        },
        clickable: {
            createOptions: 'clickable',
            bindings: { name: 'clickable', vmToObj: { setter: 'setClickable' } }
        },
        cursor: {
            createOptions: 'cursor',
            bindings: { name: 'cursor', vmToObj: { setter: 'setCursor' } }
        },
        icon: {
            createOptions: 'icon',
            bindings: { name: 'icon', vmToObj: { setter: 'setIcon' } }
        },
        raiseOnDrag: {
            createOptions: 'raiseOnDrag'
        },
        shadow: {
            createOptions: 'shadow',
            bindings: { name: 'shadow', vmToObj: { setter: 'setShadow' } }
        },
        position: {
            createOptions: 'position',
            bind: function (bindingContext, bindings, marker, subscriptions) {
                if (!ko.isObservable(bindings.position)) return;

                var isUpdatingPosition = false;
                subscriptions.addKOSubscription(bindings.position.subscribe(function () {
                    if (isUpdatingPosition) return;
                    isUpdatingPosition = true;
                    marker.setPosition(bindings.position());
                    isUpdatingPosition = false;
                }));

                var positionChangedEvent = ko.utils.unwrapObservable(bindings.positionUpdateOnDragEnd) ? 'dragend' : 'position_changed';
                subscriptions.addGMListener(google.maps.event.addListener(marker, positionChangedEvent, function () {
                    if (isUpdatingPosition) return;
                    isUpdatingPosition = true;
                    bindings.position(marker.getPosition());
                    isUpdatingPosition = false;
                }));
            }
        },
        draggable: {
            createOptions: 'draggable',
            bindings: { name: 'draggable', vmToObj: { setter: 'setDraggable' } }
        },
        flat: {
            createOptions: 'flat',
            bindings: { name: 'flat', vmToObj: { setter: 'setFlat' } }
        },
        title: {
            createOptions: 'title',
            bindings: { name: 'title', vmToObj: { setter: 'setTitle' } }
        },
        visible: {
            createOptions: 'visible',
            bindings: { name: 'visible', vmToObj: { setter: 'setVisible' } }
        },
        zIndex: {
            createOptions: 'zIndex',
            bindings: { name: 'zIndex', vmToObj: { setter: 'setZIndex' } }
        },
        click: {
            events: 'click'
        },
        doubleclick: {
            events: 'dblclick'
        },
        rightclick: {
            events: 'rightclick'
        },
        mousedown: {
            events: 'mousedown'
        },
        mouseout: {
            events: 'mouseout'
        },
        mouseover: {
            events: 'mouseover'
        },
        mouseup: {
            events: 'mouseup'
        }
    }
};
ko.virtualElements.allowedBindings.marker = true;