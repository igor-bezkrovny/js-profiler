// just a stub in case there is no real data for some reason
var jsProfiler = jsProfiler || {};
jsProfiler.instrumentationData = jsProfiler.instrumentationData || [];

// main code
(function (global) {
	var getMilliseconds;

	/**
	 * Different utilities
	 * @type {{bind: Function, isFunction: Function, isObject: Function, isNumber: Function, isArray: Function, isBoolean: Function, isUndefined: Function, isString: Function, augmentObject: Function, processLater: Function}}
	 */
	var utils = {

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
				throw "Utils.prototype.augmentObject: sourceObject or destinationObject is null";
			}
			for (var propertyName in sourceObject) {
				// commented for Profiler! if (Object.prototype.hasOwnProperty.call(sourceObject, propertyName)) {
				if (!(propertyName in destinationObject)) {
					destinationObject[propertyName] = sourceObject[propertyName];
				}
				//}
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
	};

	/**
	 * @class ProfilerTimings
	 * @constructor
	 */
	function ProfilerTimings () {
		/**
		 * Number of function calls since last clear(), milliseconds
		 * @public
		 * @type {number}
		 */
		this.calls = 0;

		/**
		 * @public
		 * @type {number}
		 */
		this.lastCallTime = getMilliseconds();

		/**
		 * Min execution time since last clear(), milliseconds
		 * @public
		 * @type {number}
		 */
		this.min = 0;

		/**
		 * Max execution time since last clear(), milliseconds
		 * @public
		 * @type {number}
		 */
		this.max = 0;

		/**
		 * Total execution time since last clear(), milliseconds
		 * @public
		 * @type {number}
		 */
		this.total = 0;
	}

	/**
	 * @class ProfilerFPS
	 * @constructor
	 */
	function ProfilerFPS() {
		/**
		 * @public
		 * @type {number}
		 */
		this.calls = 0;

		/**
		 * @private
		 * @type {number}
		 */
		this.measureStartTime = getMilliseconds();

		/**
		 * @private
		 * @type {number}
		 */
		this.previousFPS = 0;
	}

	/**
	 * @public
	 * @returns {number}
	 */
	ProfilerFPS.prototype.getFPS = function() {
		var duration = getMilliseconds() - this.measureStartTime;
		if(duration < 1) {
			duration = 1
		}

		this.previousFPS = this.previousFPS * 0.3 + this.calls * (1000 / duration) * 0.7;
		this.calls = 0;
		this.measureStartTime = getMilliseconds();
		return this.previousFPS;
	};

	/**
	 * @class ProfilerRecord
	 * @param {string} id
	 * @param {object} loc
	 * @constructor
	 */
	function ProfilerRecord (id, loc) {
		/**
		 * Total SELF execution time since last clear(), milliseconds
		 * @public
		 * @type {ProfilerTimings}
		 */
		this.own = new ProfilerTimings();

		/**
		 * Total execution time including all internal calls since last clear(), milliseconds
		 * @public
		 * @type {ProfilerTimings}
		 */
		this.all = new ProfilerTimings();

		/**
		 * Browser Draw time as a result of calling this function, since last clear(), milliseconds
		 * @public
		 * @type {ProfilerTimings}
		 */
		this.draw = new ProfilerTimings();

		this.fps = new ProfilerFPS();

		/**
		 * @public
		 * @type {string}
		 */
		this.id = id;

		/**
		 * @public
		 * @type {Object}
		 */
		this.loc = loc;
	}
	ProfilerRecord.prototype = {
		clear : function() {
			this.all = new ProfilerTimings();
			this.own = new ProfilerTimings();
			this.draw = new ProfilerTimings();
		}
	};

	var callStack = [], timeStack = [], isProfilerPaused = false,
		rePaintMeasurementStarted = false;

	/**
	 * profiler methods,
	 * Should be optimized, no additional functions, not beautiful code!
	 */
	utils.augmentObject(global, {

		/**
		 * @public
		 * @param {number} functionIndex
		 */
		measureRePaintTime : function(functionIndex) {
			var startTime = getMilliseconds();
			// It is possible that we started draw time measurement, but browser have had another event in queue before out setTimeout, so restart measurement
			if (rePaintMeasurementStarted) {
				this.log("rePaint measurement collision");
			} else {
				rePaintMeasurementStarted = true;
				setImmediate(function () {
					var stopTime = getMilliseconds(),
						duration = stopTime - startTime,
						profileRecord = global.instrumentationData[functionIndex];

					rePaintMeasurementStarted = false;
					if (!isProfilerPaused && duration > 0) {
						profileRecord.draw.calls++;
						profileRecord.draw.total += duration;
						profileRecord.draw.lastCallTime = stopTime;
						/*if (profileRecord.draw.calls > 0) {
							profileRecord.draw.min = Math.min(profileRecord.draw.min, duration);
							profileRecord.draw.max = Math.max(profileRecord.draw.max, duration);
						} else {
							profileRecord.draw.min = duration;
							profileRecord.draw.max = duration;
						}*/
					}
				});
			}
		},

		/**
		 * @public
		 * @param {number} functionIndex
		 */
		markFunctionStart : function(functionIndex) {
			callStack.push({
				functionIndex: functionIndex,
				startTime : getMilliseconds()
			});
			timeStack.push(0);

			//var r = global.instrumentationData[functionIndex];
		},

		/**
		 * @public
		 * @param {number} functionIndex
		 * @param {*} exception
		 */
		markFunctionException : function(functionIndex, exception) {
			this.log("Exception in function " + JSON.stringify(global.instrumentationData[functionIndex].loc) + ": " + exception);
		},

		/**
		 * @public
		 * @param {number} functionIndex
		 */
		markFunctionEnd : function(functionIndex) {
			var stopTime = getMilliseconds();

			// check for error
			if(callStack.length > 0) {
				//
				var callStackItem = callStack.pop();

				// check for silent crash, if yes - notify, and search for correct index in callStack
				if(callStackItem.functionIndex !== functionIndex) {
					this.log("ERROR: function " + JSON.stringify(global.instrumentationData[callStackItem.functionIndex].loc) + " crashed silently. We can't catch such exception via TRY-CATCH");
					while(callStackItem = callStack.pop()) {
						if(callStackItem.functionIndex === functionIndex) {
							break;
						}
					}
				}

				if(callStackItem) {
					var startTime = callStackItem.startTime,
						duration = stopTime - startTime,
                    	notSelfTime = timeStack.pop();

					if (!isProfilerPaused) {
						/** @type {ProfilerRecord} */
						var profileRecord = global.instrumentationData[functionIndex];

						profileRecord.fps.calls++;

						profileRecord.all.calls++;
						profileRecord.all.total += duration;
						profileRecord.all.lastCallTime = stopTime;

						var selfDuration = duration - notSelfTime;
						profileRecord.own.calls++;
						profileRecord.own.total += selfDuration;
						profileRecord.own.lastCallTime = stopTime;
					}

					var l = timeStack.length;
					if (l > 0) {
						// We are inside another profiled method
						timeStack[l - 1] += getMilliseconds() - startTime;
					} else {
						global.measureRePaintTime(functionIndex);
						//this.log("0 LEVEL FUNCTION: " + JSON.stringify(global.instrumentationData[functionIndex]["loc"]));
					}
				}
			} else {
				this.log("ERROR: function " + JSON.stringify(global.instrumentationData[functionIndex].loc) + " can't be stopped!");
			}

		},

		/**
		 * @public
		 */
		pauseProfiler                  : function () {
			isProfilerPaused = true;
		},

		/**
		 * @public
		 */
		continueProfiler : function () {
			isProfilerPaused = false;
		},

		/**
		 * @public
		 */
		clear : function () {
			var records = global.instrumentationData;
			for (var i = records.length - 1; i >= 0; i--) {
				records[i].clear();
			}
		},

		/**
		 * @public
		 * @param {function(ProfilerRecord):boolean} [filterFn]
		 * @returns {Array.<ProfilerRecord>}
		 */
		getReport : function (filterFn) {
			var result = [],
				records = global.instrumentationData;

			if (!utils.isFunction(filterFn)) {
				filterFn = function () {
					return true;
				};
			}

			for (var i = records.length - 1; i >= 0; i--) {
				if (filterFn(records[i])) {
					result.push(records[i]);
				}
			}

			return result;
		},

		getMilliseconds : null,

		log : function(obj) {
			if(typeof obj === 'object') {
				console.log(JSON.stringify(obj));
			} else {
				console.log(obj);
			}
		}
	});

	/**
	 * Init instrumentation Data and other data
	 */
	function init() {
		// create getMilliseconds method
		if(typeof window !== 'undefined' && typeof window.performance !== 'undefined') {
			getMilliseconds = function() { return window.performance.now() };
		} else if (typeof Date.now !== 'undefined') {
			getMilliseconds = function() { return Date.now() };
		} else {
			getMilliseconds = function() { return (new Date()).getTime(); }
		}

		var data = global.instrumentationData;
		for(var i = data.length - 1; i >= 0; i--) {
			data[i] = new ProfilerRecord(data[i]["id"], data[i]["loc"]);
		}
	}
	init();

	global.getMilliseconds = getMilliseconds;
})(jsProfiler);

