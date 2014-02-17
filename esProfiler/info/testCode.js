var variableAsAFunctionReference = function() {};

var someObjectLiteral = {
	someMethodInsideObjectLiteral : function() {}
};

someObject.someMethodInsideObject = function() {};
someArray["someMethod"] = function() {};

setTimeout(function() {
}, 10);

test.nameSpace["someObject"]["someMethod"] = function() {};

test.nameSpace.methodAssignment = function() {};
test.nameSpace.methodWithArgument(function() {});

test.someArray["someMethod"].a["g"][4] = function() {};