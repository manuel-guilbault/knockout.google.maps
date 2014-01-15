(function () {
    function bindMapItem(bindingContext, element, newItem) {
        var subscriptions = ko.utils.domData.get(newItem, 'subscriptions');
        if (!subscriptions) {
            subscriptions = new ko.google.maps.Subscriptions();
            ko.utils.domData.set(newItem, 'subscriptions', subscriptions);
        }

        var childBindingContext = bindingContext.createChildContext(newItem).extend({ $subscriptions: subscriptions });
        ko.applyBindingsToDescendants(childBindingContext, element.cloneNode(true));
    }

    function unbindMapItem(oldItem) {
        var subscriptions = ko.utils.domData.get(oldItem, 'subscriptions');
        if (subscriptions) {
            subscriptions.dispose();
        }
        ko.utils.domData.clear(oldItem);
    }

    function updateMapItems(bindingContext, element, oldItems, newItems) {
        var differences = ko.utils.compareArrays(oldItems, newItems);

        for (var i = 0; i < differences.length; ++i) {
            var difference = differences[i];
            switch (difference.status) {
                case 'added':
                    bindMapItem(bindingContext, element, difference.value);
                    break;
                case 'deleted':
                    unbindMapItem(difference.value);
                    break;
            }
        }
    }

    ko.bindingHandlers.mapItems = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var itemsAccessor = valueAccessor();

            var items = ko.utils.unwrapObservable(itemsAccessor);
            for (var i = 0; i < items.length; ++i) {
                bindMapItem(bindingContext, element, items[i]);
            }

            if (ko.isObservable(itemsAccessor)) {
                ko.utils.domData.set(element, 'oldItems', itemsAccessor().slice(0));

                itemsAccessor.subscribe(function () {
                    var newItems = itemsAccessor();
                    var oldItems = ko.utils.domData.get(element, 'oldItems');
                    updateMapItems(bindingContext, element, oldItems, newItems);
                    ko.utils.domData.set(element, 'oldItems', newItems.slice(0));
                });
            }

            return { controlsDescendantBindings: true };
        }
    };
    ko.virtualElements.allowedBindings.mapItems = true;
})();