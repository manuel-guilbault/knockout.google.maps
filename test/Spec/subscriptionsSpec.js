describe("Subscriptions tests", function () {
    it("can add subscription function", function() {
        var sut = new ko.google.maps.Subscriptions();
        sut.add(function () { });

        expect(sut.handlers.length).toBe(1);
    });
    it("can add subscription array", function () {
        var sut = new ko.google.maps.Subscriptions();
        sut.add([function () { }, function () { }]);

        expect(sut.handlers.length).toBe(2);
    });
    it("can add subscriptions object", function () {
        var subscriptions = new ko.google.maps.Subscriptions();
        subscriptions.add(function () { });

        var sut = new ko.google.maps.Subscriptions();
        sut.add(subscriptions);

        expect(sut.handlers.length).toBe(1);
    });
    it("throws error when adding invalid value", function () {
        var sut = new ko.google.maps.Subscriptions();
        expect(function () {
            sut.add("");
        }).toThrow();
    });
    it("can dispose google maps listener", function () {
        var map = new google.maps.Map(document.createElement("div"), { zoom: 10 });
        var triggered = false;

        var sut = new ko.google.maps.Subscriptions();
        sut.addGMListener(google.maps.event.addListener(map, "zoom_changed", function () {
            triggered = true;
        }));

        sut.dispose();

        map.setZoom(12);
        expect(triggered).toBe(false);
    });
    it("can dispose knockout subscription", function () {
        var observable = ko.observable(0);
        var triggered = false;

        var sut = new ko.google.maps.Subscriptions();
        sut.addKOSubscription(observable.subscribe(function () {
            triggered = true;
        }));

        sut.dispose();

        observable(1);
        expect(triggered).toBe(false);
    });
    it("can dispose added function", function () {
        var sut = new ko.google.maps.Subscriptions();
        var called = false;
        sut.add(function () {
            called = true;
        });

        sut.dispose();

        expect(called).toBe(true);
    });
    it("clears when disposing", function () {
        var sut = new ko.google.maps.Subscriptions();
        sut.add(function () { });

        sut.dispose();

        expect(sut.handlers.length).toBe(0);
    });
    it("does not dispose when clearing", function () {
        var sut = new ko.google.maps.Subscriptions();
        var called = false;
        sut.add(function () {
            called = true;
        });

        sut.clear();

        expect(called).toBe(false);
    });
    it("can clear subscriptions", function () {
        var sut = new ko.google.maps.Subscriptions();
        sut.add(function () { });

        sut.clear();

        expect(sut.handlers.length).toBe(0);
    });
});