describe("binder tests", function () {
    it("can create options for undefined binder", function () {
        var bindingContext = {};
        var bindings = {};
        var binders = { test: { createOptions: undefined } };

        var result = ko.google.maps.binder.getCreateOptions(bindingContext, bindings, binders);

        expect(result).toEqual({});
    });
});