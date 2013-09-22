var esprima = require("../ext/esprima"),
	escodegen = require("../ext/escodegen"),
	Syntax = require("./types.js").Syntax,
	esCodeGenOptions = require("./types.js").esCodeGenOptions,
	globalName = "jsProfiler";

var ignoredFunctionNames = [
	"bind",
	"listener"
];

/**
 * Walks over MemberExpression tree to create full name with dots
 * @param {*} node
 * @param {number} [level] internal parameter
 * @returns {*}
 */
function getComputedIdentifier (node, level) {
	var result;

	if (typeof level === 'undefined') {
		level = 0;
	}

	switch (node['type']) {
		case Syntax.Identifier:
			result = "." + node['name'];
			break;

		case Syntax.MemberExpression:
			result = getComputedIdentifier(node['object'], level + 1) + getComputedIdentifier(node['property'], level + 1);
			break;

		case Syntax.Literal:
			result = "[\"" + node['value'] + "\"]";
			break;

		default:
			result = "??anonymous";
			break;
	}

	if (level === 0 && result && result.length > 0 && result.charAt(0) === '.') {
		result = result.substring(1);
	}
	return result;
}

/**
 * Converts tree to list, adds parentNode to every node
 * @param object
 * @returns {Array}
 */
function syntaxTreeToList (object) {
	function fixSyntaxTree_Traverse (object, parentNode) {
		var key, child;

		if (typeof object === 'object' && object !== null) {
			if (object.type && Syntax[object.type]) {
				nodeList.push({
					node       : object,
					parentNode : parentNode
				});
				parentNode = object;
			}
		}

		for (key in object) {
			if (object.hasOwnProperty(key)) {
				child = object[key];
				if (typeof child === 'object' && child !== null) {
					fixSyntaxTree_Traverse(child, parentNode);
				}
			}
		}
	}

	var nodeList = [];
	fixSyntaxTree_Traverse(object, null);

	for (var i = nodeList.length - 1; i >= 0; i--) {
		nodeList[i].node.parentNode = nodeList[i].parentNode;
	}
	return nodeList;
}

/**
 * @class Instrumenter
 * @constructor
 */
function Instrumenter () {
}
Instrumenter.prototype = {

	/**
	 * @private
	 * @param functionNode
	 * @param functionName
	 * @param instrumentedFunctions
	 */
	instrumentFunction : function (functionNode, functionName, instrumentedFunctions) {
		if (typeof functionNode.instrumented === 'undefined') {
			var block = functionNode.body;
			if (block) {
				functionNode.instrumented = true;

				block.body = this.getInstrumentedFunctionNode(
					instrumentedFunctions,
					functionName,
					block.body,
					functionNode.loc
				);
			}
		}
	},

	/**
	 * @private
	 * @param node
	 * @returns {*}
	 */
	getFunctionName : function (node) {
		if (node.id && node.id.name) {
			return node.id.name;
		} else {
			while (node) {

				switch (node.type) {
					case Syntax.VariableDeclarator:
						return getComputedIdentifier(node['id']);
						break;

					case Syntax.Property:
						return getComputedIdentifier(node['key']);
						break;

					case Syntax.AssignmentExpression:
						return getComputedIdentifier(node['left']);
						break;

					case Syntax.CallExpression:
						return "argument of " + getComputedIdentifier(node.callee);
						break;

					default:
						//console.log("3function name lost:(");
						break;
				}
				node = node.parentNode;
			}
		}
		return "anonymous";
	},

	/**
	 * @public
	 * @param fileName
	 * @param code
	 * @param preambleCode
	 * @returns {*}
	 */
	instrumentCode : function (fileName, code, preambleCode) {
		try {
			var ast = esprima.parse(code, { raw : true, loc : true, comment : true, tolerant : true, tokens : true, range : true }),
				instrumentedFunctions = [];

			ast = escodegen.attachComments(ast, ast.comments, ast.tokens);

			var nodeList = syntaxTreeToList(ast);

			for (var i = nodeList.length - 1; i >= 0; i--) {
				var node = nodeList[i].node;
				if (node.type === Syntax.FunctionDeclaration || node.type === Syntax.FunctionExpression) {
					var functionName = this.getFunctionName(node);
					if(ignoredFunctionNames.indexOf(functionName) < 0) {
						try {
							this.instrumentFunction(node, functionName, instrumentedFunctions);
						} catch (e) {
							console.log("X: " + e);
						}
					}
				}
			}

			code =	this.getInstrumentationDataCode(fileName, instrumentedFunctions) +
					preambleCode +
					escodegen.generate(ast, esCodeGenOptions);

		} catch (e) {
			console.log("ERROR in instrumentCode - escodegen.generate: " + e);
		}
		return code;
	},

	/**
	 * @private
	 * @param fileName
	 * @param instrumentedFunctions
	 * @returns {string}
	 */
	getInstrumentationDataCode : function (fileName, instrumentedFunctions) {
		return "var " + globalName + " = { instrumentationData : " + JSON.stringify(instrumentedFunctions) + "};\n";
	},

	/**
	 * @private
	 * @param instrumentedFunctions
	 * @param functionName
	 * @param functionBodyNode
	 * @param loc
	 * @returns {*}
	 */
	getInstrumentedFunctionNode : function (instrumentedFunctions, functionName, functionBodyNode, loc) {
		function getEscapedFileName (fileName) {
			return fileName.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/\\]/, "_");
		}

		if (!functionName) {
			functionName = "anonymous";
		}

		var id = instrumentedFunctions.length;

		instrumentedFunctions.push({
			"loc"           : loc,
			"id"            : functionName
		});

		console.log("functionName: " + functionName + " - " + JSON.stringify(loc));

		var instrumentationCodeTree = esprima.parse(
			"jsProfiler.markFunctionStart(" + id + ");" +
				"try {" +
				"} catch(e) {" +
				"  jsProfiler.markFunctionException(" + id + ", e);" +
				//"  throw e;" +
				//"  console.log(e);" +
				"} finally {" +
				"  jsProfiler.markFunctionEnd(" + id + ");" +
				"}", {}).body;

		for (var i = 0; i < instrumentationCodeTree.length; i++) {
			var b = instrumentationCodeTree[i];
			if (b.type === Syntax.TryStatement) {
				b.block.body = functionBodyNode;
				break;
			}
		}

		return instrumentationCodeTree;
	}
};

module.exports = {
	Instrumenter : Instrumenter
};