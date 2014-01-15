(function () {
    ko.google.maps.Subscriptions = function () {
        this.handlers = [];
    };

    ko.google.maps.Subscriptions.prototype.add = function (handler) {
        if (typeof handler === 'function') {
            this.handlers.push(handler);
        } else if (ko.google.maps.utils.isArray(handler)) {
            Array.prototype.push.apply(this.handlers, handler);
        } else if (typeof handler === 'object' && handler.prototype === this.prototype) {
            Array.prototype.push.apply(this.handlers, handler.handlers);
        } else {
            throw new TypeError('Invalid subscription');
        }
    };

    ko.google.maps.Subscriptions.prototype.addGMListener = function (listener) {
        this.handlers.push(function () {
            google.maps.event.removeListener(listener);
        });
    };

    ko.google.maps.Subscriptions.prototype.addKOSubscription = function (subscription) {
        this.handlers.push(function () {
            subscription.dispose();
        });
    };

    ko.google.maps.Subscriptions.prototype.clear = function () {
        this.handlers = [];
    };

    ko.google.maps.Subscriptions.prototype.dispose = function () {
        for (var i = 0; i < this.handlers.length; ++i) {
            this.handlers[i]();
        }
        this.clear();
    };
})();