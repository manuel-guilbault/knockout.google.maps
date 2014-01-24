jasmine.Spec.prototype.restoreAfter = function (object, propertyName) {
	var originalValue = object[propertyName];
	this.after(function () {
		object[propertyName] = originalValue;
	});
};

jasmine.prepareTestNode = function () {
    // The bindings specs make frequent use of this utility function to set up
    // a clean new DOM node they can execute code against
    var existingNode = document.getElementById("testNode");
    if (existingNode != null)
        existingNode.parentNode.removeChild(existingNode);
    testNode = document.createElement("div");
    testNode.id = "testNode";
    document.body.appendChild(testNode);
};