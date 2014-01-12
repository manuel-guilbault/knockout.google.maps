describe("utils tests", function () {
    it("can assign binding to options", function () {
        var property = "myTestProperty";
        var value = 223;
        var bindings = {};
        bindings[property] = value;
        var options = {};

        ko.google.maps.utils.assignBindingToOptions(bindings, property, options);

        expect(options[property]).toEqual(value);
    });
    it("can assign binding to options (using default value)", function () {
        var property = "myTestProperty";
        var value = 223;
        var bindings = {};
        var options = {};

        ko.google.maps.utils.assignBindingToOptions(bindings, property, options, value);

        expect(options[property]).toEqual(value);
    });
    it("can assign binding to options (using transformation)", function () {
        var property = "myTestProperty";
        var value = 1;
        var bindings = {};
        var options = {};

        ko.google.maps.utils.assignBindingToOptions(bindings, property, options, value, function (v) { return !!v; });

        expect(options[property]).toEqual(!!value);
    });
});