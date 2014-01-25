describe("binder tests", function () {
    describe("createOptions tests", function () {
        it("can get empty create options for undefined binder", function () {
            var binders = {
                test: {}
            };

            var result = ko.google.maps.binder.getCreateOptions({}, {}, binders);

            expect(result.test).toBeUndefined();
        });
        it("can get create options for string definition", function () {
            var value = 12;
            var bindings = {
                test: ko.observable(value)
            };
            var binders = {
                test: {
                    createOptions: "test"
                }
            };

            var result = ko.google.maps.binder.getCreateOptions({}, bindings, binders);

            expect(result.test).toBe(value);
        });
        it("can get create options for object definition with undefined binding", function () {
            var binders = {
                test: {
                    createOptions: {
                        name: "test"
                    }
                }
            };

            var result = ko.google.maps.binder.getCreateOptions({}, {}, binders);

            expect(result.test).toBeUndefined();
        });
        it("can get create options for object definition with undefined binding and default value", function () {
            var value = 12;
            var binders = {
                test: {
                    createOptions: {
                        name: "test",
                        defaultValue: value
                    }
                }
            };

            var result = ko.google.maps.binder.getCreateOptions({}, {}, binders);

            expect(result.test).toBe(value);
        });
        it("can get create options for object definition without type", function () {
            var value = 12;
            var bindings = {
                test: ko.observable(value)
            };
            var binders = {
                test: {
                    createOptions: {
                        name: "test"
                    }
                }
            };

            var result = ko.google.maps.binder.getCreateOptions({}, bindings, binders);

            expect(result.test).toBe(value);
        });
        it("can get create options for object definition with type", function () {
            this.restoreAfter(ko.google.maps.utils, "convertVMToObj");

            ko.google.maps.utils.convertVMToObj = jasmine.createSpy().andCallFake(function (value) {
                return value;
            });
            var value = 12;
            var type = "blob";
            var bindings = {
                test: ko.observable(value)
            };
            var binders = {
                test: {
                    createOptions: {
                        name: "test",
                        type: type
                    }
                }
            };

            var result = ko.google.maps.binder.getCreateOptions({}, bindings, binders);

            expect(ko.google.maps.utils.convertVMToObj).toHaveBeenCalledWith(value, type);
            expect(result.test).toBe(value);
        });
        it("can get create options for object definitions with transform", function () {
            var value = 12;
            var transform = jasmine.createSpy().andCallFake(function (value) {
                return value;
            });
            var bindings = {
                test: ko.observable(value)
            };
            var binders = {
                test: {
                    createOptions: {
                        name: "test",
                        transform: transform
                    }
                }
            };

            var result = ko.google.maps.binder.getCreateOptions({}, bindings, binders);

            expect(transform).toHaveBeenCalledWith(value);
            expect(result.test).toBe(value);
        });
        it("can get create options for function definition", function () {
            var definition = jasmine.createSpy();
            var bindingContext = {};
            var bindings = {};
            var binders = {
                test: {
                    createOptions: definition
                }
            };

            ko.google.maps.binder.getCreateOptions(bindingContext, bindings, binders);

            expect(definition).toHaveBeenCalledWith(bindingContext, bindings, {});
        });
        it("can get create options for array", function () {
            var definition1 = jasmine.createSpy();
            var definition2 = jasmine.createSpy();
            var bindingContext = {};
            var bindings = {};
            var binders = {
                test: {
                    createOptions: [
                        definition1,
                        definition2
                    ]
                }
            };

            ko.google.maps.binder.getCreateOptions(bindingContext, bindings, binders);

            expect(definition1).toHaveBeenCalledWith(bindingContext, bindings, {});
            expect(definition2).toHaveBeenCalledWith(bindingContext, bindings, {});
        });
        it("triggers error when calling create options with invalid definition", function () {
            var binders = {
                test: {
                    createOptions: 12
                }
            };

            expect(function () {
                ko.google.maps.binder.getCreateOptions({}, {}, binders);
            }).toThrow();
        });
    });

    describe("bind tests", function () {
        it("can ignore un-observable binding", function () {
            this.restoreAfter(google.maps.event, "addListener");
            google.maps.event.addListener = jasmine.createSpy();

            var bindingContext = {};
            var bindings = {
                test: 12
            };
            var obj = {};
            var subscriptions = new ko.google.maps.Subscriptions();
            spyOn(subscriptions, "addKOSubscription");

            var binders = {
                test: {
                    bindings: "test"
                }
            };

            ko.google.maps.binder.bind(bindingContext, bindings, obj, subscriptions, binders);

            expect(subscriptions.addKOSubscription).not.toHaveBeenCalled();
            expect(google.maps.event.addListener).not.toHaveBeenCalled();
        });
        it("can bind binding with setter", function () {
            var handle = 12;

            this.restoreAfter(ko.google.maps.utils, "convertVMToObj");
            ko.google.maps.utils.convertVMToObj = jasmine.createSpy().andCallFake(function (value) {
                return value;
            });

            var bindingContext = {};
            var bindings = {
                test: ko.observable(12)
            };
            spyOn(bindings.test, "subscribe").andReturn(handle);

            var obj = {
                setTest: jasmine.createSpy()
            };
            var subscriptions = new ko.google.maps.Subscriptions();
            spyOn(subscriptions, "addKOSubscription");

            var binders = {
                test: {
                    bindings: {
                        name: "test",
                        vmToObj: {
                            setter: "setTest"
                        }
                    }
                }
            };

            ko.google.maps.binder.bind(bindingContext, bindings, obj, subscriptions, binders);

            expect(bindings.test.subscribe).toHaveBeenCalled();
            expect(subscriptions.addKOSubscription).toHaveBeenCalledWith(handle);
            bindings.test.subscribe.mostRecentCall.args[0](bindings.test());

            expect(ko.google.maps.utils.convertVMToObj).toHaveBeenCalledWith(bindings.test(), undefined);
            expect(obj.setTest).toHaveBeenCalledWith(bindings.test());
        });
        it("can bind binding to setOptions", function () {
            var handle = 12;

            this.restoreAfter(ko.google.maps.utils, "convertVMToObj");
            ko.google.maps.utils.convertVMToObj = jasmine.createSpy().andCallFake(function (value) {
                return value;
            });

            var bindingContext = {};
            var bindings = {
                test: ko.observable(12)
            };
            spyOn(bindings.test, "subscribe").andReturn(handle);

            var obj = {
                setOptions: jasmine.createSpy()
            };
            var subscriptions = new ko.google.maps.Subscriptions();
            spyOn(subscriptions, "addKOSubscription");

            var binders = {
                test: {
                    bindings: {
                        name: "test"
                    }
                }
            };

            ko.google.maps.binder.bind(bindingContext, bindings, obj, subscriptions, binders);

            expect(bindings.test.subscribe).toHaveBeenCalled();
            expect(subscriptions.addKOSubscription).toHaveBeenCalledWith(handle);
            bindings.test.subscribe.mostRecentCall.args[0](bindings.test());

            expect(ko.google.maps.utils.convertVMToObj).toHaveBeenCalledWith(bindings.test(), undefined);
            expect(obj.setOptions).toHaveBeenCalledWith({
                test: bindings.test()
            });
        });
        it("can ignore binding to setOptions with noOptions", function () {
            var handle = 12;
            var bindingContext = {};
            var bindings = {
                test: ko.observable()
            };
            spyOn(bindings.test, "subscribe").andReturn(handle);

            var obj = {
                setOptions: jasmine.createSpy()
            };
            var subscriptions = new ko.google.maps.Subscriptions();
            spyOn(subscriptions, "addKOSubscription");

            var binders = {
                test: {
                    bindings: {
                        name: "test",
                        vmToObj: {
                            noOptions: true
                        }
                    }
                }
            };

            ko.google.maps.binder.bind(bindingContext, bindings, obj, subscriptions, binders);

            expect(bindings.test.subscribe).not.toHaveBeenCalled();
            expect(subscriptions.addKOSubscription).not.toHaveBeenCalledWith(handle);
        });
        it("can bind binding back to viewModel", function () {
            var handle = 12;

            this.restoreAfter(ko.google.maps.utils, "convertObjToVM");
            ko.google.maps.utils.convertObjToVM = jasmine.createSpy().andCallFake(function (value) {
                return value;
            });

            this.restoreAfter(google.maps.event, "addListener");
            google.maps.event.addListener = jasmine.createSpy().andReturn(handle);

            var bindingContext = {};
            var bindings = {
                test: ko.observable()
            };
            var testValue = 92;
            var testType = "testType";
            var obj = {
                getTest: jasmine.createSpy().andReturn(testValue)
            };
            var subscriptions = new ko.google.maps.Subscriptions();
            spyOn(subscriptions, "addGMListener");

            var binders = {
                test: {
                    bindings: {
                        name: "test",
                        type: testType,
                        objToVM: {
                            event: "something_happened",
                            getter: "getTest"
                        }
                    }
                }
            };

            ko.google.maps.binder.bind(bindingContext, bindings, obj, subscriptions, binders);

            expect(google.maps.event.addListener).toHaveBeenCalled();
            expect(subscriptions.addGMListener).toHaveBeenCalledWith(handle);
            google.maps.event.addListener.mostRecentCall.args[2]();

            expect(obj.getTest).toHaveBeenCalled();
            expect(ko.google.maps.utils.convertObjToVM).toHaveBeenCalledWith(testValue, testType);
            expect(bindings.test()).toBe(testValue);
        });

        it("can ignore binding undefined events", function () {
            var bindings = {};
            var obj = {};
            var subscriptions = new ko.google.maps.Subscriptions();
            spyOn(subscriptions, "addGMListener");
            var binders = {
                test: {
                    events: "test"
                }
            };

            ko.google.maps.binder.bind({}, bindings, obj, subscriptions, binders);

            expect(subscriptions.addGMListener).not.toHaveBeenCalled();
        });
        it("can bind event", function () {
            this.restoreAfter(google.maps.event, "addListener");
            var handle = 12;
            google.maps.event.addListener = jasmine.createSpy().andReturn(handle);

            var bindingContext = {
                $data: {}
            };
            var bindings = {
                test: jasmine.createSpy()
            };
            var obj = {};
            var e = {};
            var subscriptions = new ko.google.maps.Subscriptions();
            spyOn(subscriptions, "addGMListener");
            var binders = {
                test: {
                    events: "test"
                }
            };

            ko.google.maps.binder.bind(bindingContext, bindings, obj, subscriptions, binders);
            google.maps.event.addListener.mostRecentCall.args[2](e);

            expect(google.maps.event.addListener).toHaveBeenCalled();
            expect(google.maps.event.addListener.mostRecentCall.args[0]).toBe(obj);
            expect(google.maps.event.addListener.mostRecentCall.args[1]).toBe(binders.test.events);
            expect(bindings.test).toHaveBeenCalledWith(bindingContext.$data, e);
            expect(subscriptions.addGMListener).toHaveBeenCalledWith(handle);
        });
        it("can bind array of events", function () {
            this.restoreAfter(google.maps.event, "addListener");
            var handle = 12;
            google.maps.event.addListener = jasmine.createSpy().andReturn(handle);

            var bindings = {
                test1: function () { },
                test2: function () { }
            };
            var obj = {};
            var subscriptions = new ko.google.maps.Subscriptions();
            spyOn(subscriptions, "addGMListener");
            var binders = {
                test: {
                    events: ["test1", "test2"]
                }
            };

            ko.google.maps.binder.bind({}, bindings, obj, subscriptions, binders);

            expect(google.maps.event.addListener.calls.length).toBe(2);
            expect(subscriptions.addGMListener.calls.length).toBe(2);
        });
        it("can call binder.bind", function () {
            var bindingContext = {};
            var bindings = {};
            var obj = {};
            var subscriptions = {};
            var binders = {
                test: {
                    bind: jasmine.createSpy()
                }
            };

            ko.google.maps.binder.bind(bindingContext, bindings, obj, subscriptions, binders);

            expect(binders.test.bind).toHaveBeenCalledWith(bindingContext, bindings, obj, subscriptions);
        });
    });
});