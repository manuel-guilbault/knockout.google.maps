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
    it("can convertObjToVM bool falsy", function () {
        var value = null;

        var result = ko.google.maps.utils.convertObjToVM(value, 'bool');

        expect(result).toBeFalsy();
    });
    it("can convertObjToVM bool truthy", function () {
        var value = [];

        var result = ko.google.maps.utils.convertObjToVM(value, 'bool');

        expect(result).toBeTruthy();
    });
    it("can convertVMToObj bool falsy", function () {
        var value = null;

        var result = ko.google.maps.utils.convertVMToObj(value, 'bool');

        expect(result).toBeFalsy();
    });
    it("can convertVMToObj bool truthy", function () {
        var value = [];

        var result = ko.google.maps.utils.convertVMToObj(value, 'bool');

        expect(result).toBeTruthy();
    });
    it("can check isArray on array", function () {
        var result = ko.google.maps.utils.isArray([]);
        expect(result).toBe(true);
    });
    it("can check isArray on number", function () {
        var result = ko.google.maps.utils.isArray(0);
        expect(result).toBe(false);
    });
    it("can check isArray on string", function () {
        var result = ko.google.maps.utils.isArray("");
        expect(result).toBe(false);
    });
    it("can check isArray on bool", function () {
        var result = ko.google.maps.utils.isArray(false);
        expect(result).toBe(false);
    });
    it("can check isArray on object", function () {
        var result = ko.google.maps.utils.isArray({});
        expect(result).toBe(false);
    });
    it("can check isArray on function", function () {
        var result = ko.google.maps.utils.isArray(function(){});
        expect(result).toBe(false);
    });
    it("can clone node without expando properties", function () {
        var div = document.createElement("div");
        div.__test = "test";

        var clone = ko.google.maps.utils.cloneNode(div);

        expect(clone.__test).toBeUndefined();
    });
});