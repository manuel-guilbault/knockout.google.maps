(function () {
    var subscriptions = function () {
        this.handlers = [];
    };

    subscriptions.prototype.add = function (handler) {
        if (typeof handler === 'function') {
            this.handlers.push(handler);
        } else if (ko.google.maps.utils.isArray(handler)) {
            Array.prototype.push.apply(this.handlers, handler);
        } else if (typeof handler === 'object' && Object.getPrototypeOf(handler) === subscriptions.prototype) {
            Array.prototype.push.apply(this.handlers, handler.handlers);
        } else {
            throw new TypeError('Invalid subscription');
        }
    };

    subscriptions.prototype.addGMListener = function (listener) {
        this.handlers.push(function () {
            google.maps.event.removeListener(listener);
        });
    };

    subscriptions.prototype.addKOSubscription = function (subscription) {
        this.handlers.push(function () {
            subscription.dispose();
        });
    };

    subscriptions.prototype.clear = function () {
        this.handlers = [];
    };

    subscriptions.prototype.dispose = function () {
        for (var i = 0; i < this.handlers.length; ++i) {
            this.handlers[i]();
        }
        this.clear();
    };

    ko.google.maps.Subscriptions = subscriptions;
})();