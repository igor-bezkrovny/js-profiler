/* Simple JavaScript Inheritance by John Resig http://ejohn.org/ MIT Licensed. Inspired by base2 and Prototype */
/* description: http://blog.buymeasoda.com/understanding-john-resigs-simple-javascript-i/ */

/**
 * @version 0.1
 * - original John Resig inheritance
 * - added checking for ABSTRACT_METHOD
 * (if child/base class property equals ABSTRACT_METHOD, Class will throw error)
 */

var ibNameSpace = ibNameSpace || {};

(function () {
	var initializing = false, fnTest = /xyz/.test(function () {xyz;}) ? /\b_super\b/ : /.*/;

	/**
	 *  The base Class implementation (does nothing)
	 *  @class
	 *  @constructor
	 */
	function Class() {
	}

	ibNameSpace.Class = Class;

	/**
	 * @public
	 * @type {function}
	 */
	Class.ABSTRACT_METHOD = function() {};

	/**
	 * Create a new Class that inherits from this class
	 * @public
	 */
	Class.extend = function (prop) {
		var _super = this.prototype,
			isClassAbstract = false,
			NewClass;

		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] = typeof prop[name] == "function" &&
				typeof _super[name] == "function" && fnTest.test(prop[name]) ?
				(function (name, fn) {
					return function () {
						var tmp = this._super;

						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];

						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						var ret = fn.apply(this, arguments);
						this._super = tmp;

						return ret;
					};
				})(name, prop[name]) :
				prop[name];
		}

		for (var name in prototype) {
			if (prototype[name] === Class.ABSTRACT_METHOD) {
				isClassAbstract = true;
			}
		}

		// The dummy class constructor
		NewClass = function () {
			if (!initializing) {
				if (isClassAbstract) {
					throw "Can't create class with at least one non-implemented abstract method!";
				} else if (this.init) {
					// All construction is actually done in the init method
					this.init.apply(this, arguments);
				}
			}
		};

		// Populate our constructed prototype object
		NewClass.prototype = prototype;

		// Enforce the constructor to be what we expect
		NewClass.prototype.constructor = NewClass;

		// And make this class extendable
		NewClass.extend = arguments.callee;

		return NewClass;
	};
})();