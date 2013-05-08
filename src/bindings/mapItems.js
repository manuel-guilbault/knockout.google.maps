ko.bindingHandlers.mapItems = {
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