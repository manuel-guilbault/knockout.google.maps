
function bindMapItem(bindingContext, element, item) {
    var childBindingContext = bindingContext.createChildContext(item);
    childBindingContext.removeHandlers = [];
    ko.applyBindingsToDescendants(childBindingContext, element);
    item.__ko_gm_removeHandlers = childBindingContext.removeHandlers;
}

function unbindMapItem(item) {
    for (var k = 0; k < item.__ko_gm_removeHandlers.length; ++k) {
        item.__ko_gm_removeHandlers[k](item);
    }
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
			element.__ko_gm_oldItems = itemsAccessor().slice(0);
			itemsAccessor.subscribe(function () {
			    var newItems = itemsAccessor();
			    updateMapItems(bindingContext, element, element.__ko_gm_oldItems, newItems);
			    element.__ko_gm_oldItems = newItems.slice(0);
			});
		}

		return { controlsDescendantBindings: true };
	}
};
ko.virtualElements.allowedBindings.mapItems = true;