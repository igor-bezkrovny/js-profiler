
(function() {

	// Test Code
	var obj = {};

	// test function for profiling
	obj.testFunction = function() {
			var t = document.createElement('div');
			for(var i = Math.random() * 10; i >= 0; i-- ) {
				t.innerHTML += "<br/>";
			}
		t.innerHTML = null;
		t = null;
		};

	// test Class for profiling
	obj.TestClass = function() {
	};
	obj.TestClass.prototype.testMethod = function() {
		var t = document.createElement('div');
		for(var i = Math.random() * 10; i >= 0; i-- ) {
			t.innerHTML += "<br/>";
		}
		t.innerHTML = null;
		t = null;
	};
	// instance of test class
	var testClassInstance = new obj.TestClass();

	// do something
	setInterval(obj.testFunction, 50);
	setInterval(testClassInstance.testMethod, 150);

})();