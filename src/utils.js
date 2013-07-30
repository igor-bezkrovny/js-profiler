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
			return !!(param && (typeof param === 'object' || this.isFunction(param)));
		},

		/**
		 * @public
		 * @param {*} param
		 * @returns {boolean}
		 */
		isString : function (param) {
			return !!(param && ((typeof param === 'string') || (typeof param[constructor] !== 'undefined' && param.constructor === String)));
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
