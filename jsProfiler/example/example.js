
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

	// Enable Profiling
	ibNameSpace.debug.profiler.profileObject('obj', obj, true);
	ibNameSpace.debug.profiler.attachWidget(100);

	// do something
	setInterval(obj.testFunction, 50);
	setInterval(testClassInstance.testMethod, 150);

})();