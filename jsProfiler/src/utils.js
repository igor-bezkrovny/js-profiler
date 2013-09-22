/**
 * @namespace
 */
var ibNameSpace = ibNameSpace || {};

(function () {

	/**
	 * @class
	 */
	var Utils = ibNameSpace.Class.extend(/** @lends {Utils} */ {
		init : function () {
		},

		/**
		 @param {function} callBackFunc
		 @param {T} thisArg
		 @param {...*} [args]
		 @return {function(this:T)}
		 @template T
		 */
		bind : function (callBackFunc, thisArg, args) {
			return function () {
				callBackFunc.call(thisArg, args);
			}
		},

		/**
		 * @public
		 * @param {*} param
		 * @returns {boolean}
		 */
		isFunction : function (param) {
			return !!(param && ((typeof param === 'function') || Object.prototype.toString.apply(param) === '[object Function]'));
		},

		/**
		 * @public
		 * @param {*} param
		 * @returns {boolean}
		 */
		isObject : function (param) {
			var otherType = this.isString(param) || this.isNumber(param) || this.isArray(param) || this.isBoolean(param);
			return param !== null && (typeof param === 'object') && !otherType;
		},

		/**
		 * @public
		 * @param {*} param
		 * @returns {boolean}
		 */
		isNumber : function (param) {
			return typeof param === 'number';
		},

		/**
		 * @public
		 * @param {*} param
		 * @returns {boolean}
		 */
		isArray : function (param) {
			return param && typeof param === 'object' && (param instanceof Array);
		},

		/**
		 * @public
		 * @param {*} param
		 * @returns {boolean}
		 */
		isBoolean : function (param) {
			return typeof param === 'boolean';
		},

		/**
		 * @public
		 * @param {*} param
		 * @returns {boolean}
		 */
		isUndefined : function (param) {
			return typeof param === 'undefined';
		},

		/**
		 * @public
		 * @param {*} param
		 * @returns {boolean}
		 */
		isString : function (param) {
			return typeof param === 'string';
		},

		/**
		 * @public
		 * @param {object} destinationObject
		 * @param {object} sourceObject
		 */
		augmentObject : function (destinationObject, sourceObject) {
			if (!sourceObject || !destinationObject) {
				throw "augmentObject: sourceObject or destinationObject is null";
			}
			for (var propertyName in sourceObject) {
				if (!(propertyName in destinationObject)) {
					destinationObject[propertyName] = sourceObject[propertyName];
				}
			}
		},

		/**
		 * @public
		 * @param {function(this:T)} callBackFunc
		 * @param {T} thisArg
		 * @param {object} callBackData
		 * @param {number} timeOutMS
		 * @template T
		 */
		processLater : function (callBackFunc, thisArg, callBackData, timeOutMS) {
			var timerId = null;

			var listener = function () {
				if (timerId !== null) {
					clearTimeout(timerId);
					timerId = null;
					callBackFunc.call(thisArg, callBackData);
					thisArg = callBackData = callBackFunc = listener = null;
				}
			};

			timerId = setTimeout(listener, timeOutMS);
		}

	});

	/**
	 * Instance of class Utils
	 * @public
	 * @type {Utils}
	 */
	ibNameSpace.utils = new Utils();

})();
