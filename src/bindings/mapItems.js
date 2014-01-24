(function () {
    var __ko_gm_itemsKey = 'ko.google.maps.items';
    var __ko_gm_itemsSubscriptionsKey = 'ko.google.maps.items.subscriptions';

    function bindMapItem(bindingContext, element, item, subscriptions) {
        var elementClone = ko.google.maps.utils.cloneNode(element, true);
        subscriptions.add(function() {
            ko.cleanNode(elementClone);
        });

        var childBindingContext = bindingContext.createChildContext(item).extend({ $subscriptions: subscriptions });
        ko.applyBindingsToDescendants(childBindingContext, elementClone);
    }

    function updateMapItems(bindingContext, element, newItems) {
        var oldItems = ko.utils.domData.get(element, __ko_gm_itemsKey) || [];
        var subscriptions = ko.utils.domData.get(element, __ko_gm_itemsSubscriptionsKey) || [];
        var differences = ko.utils.compareArrays(oldItems, newItems);

        var itemSubscriptions;
        for (var i = 0; i < differences.length; ++i) {
            var difference = differences[i];
            switch (difference.status) {
                case 'added':
                    itemSubscriptions = new ko.google.maps.Subscriptions();
                    bindMapItem(bindingContext, element, difference.value, itemSubscriptions);
                    subscriptions.splice(difference.index, 0, itemSubscriptions);
                    break;

                case 'deleted':
                    itemSubscriptions = subscriptions.splice(difference.index, 1);
                    itemSubscriptions[0].dispose();
                    break;
            }
        }

        ko.utils.domData.set(element, __ko_gm_itemsKey, newItems.slice(0));
        ko.utils.domData.set(element, __ko_gm_itemsSubscriptionsKey, subscriptions);
    }

    function clearMapItems(bindingContext, element) {
        var items = ko.utils.domData.get(element, __ko_gm_itemsKey) || [];
        var subscriptions = ko.utils.domData.get(element, __ko_gm_itemsSubscriptionsKey) || [];

        for (var i = 0; i < items.length; ++i) {
            subscriptions[i].dispose();
        }
    }

    ko.bindingHandlers.mapItems = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var itemsAccessor = valueAccessor();

            var items = ko.utils.unwrapObservable(itemsAccessor);
            updateMapItems(bindingContext, element, items);

            var subscriptions = new ko.google.maps.Subscriptions();

            if (ko.isObservable(itemsAccessor)) {
                subscriptions.addKOSubscription(itemsAccessor.subscribe(function (newItems) {
                    updateMapItems(bindingContext, element, newItems);
                }));
            }

            var parentSubscriptions = bindingContext.$subscriptions;
            parentSubscriptions.add(function () {
                clearMapItems(bindingContext, element);
            });

            return { controlsDescendantBindings: true };
        }
    };
    ko.virtualElements.allowedBindings.mapItems = true;
})();