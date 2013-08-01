/**
 * @namespace
 */
var ibNameSpace = ibNameSpace || {};

(function () {

	ibNameSpace.debug = ibNameSpace.debug || {};

	/**
	 * Sort Methods for widget
	 * @enum {function(a:ProfilerRecord, b:ProfilerRecord) : number}
	 */
	var profilerWidgetSortMethods = {
		bySelfTotalTime : function (a, b) {
			if (a.selfTotal > b.selfTotal) {
				return -1;
			}
			return 1;
		},
		byTotalTime     : function (a, b) {
			if (a.total > b.total) {
				return -1;
			}
			return 1;
		},
		byCalls         : function (a, b) {
			if (a.calls > b.calls) {
				return -1;
			}
			return 1;
		}
	};

	/**
	 * @public
	 * @class ProfilerWidgetConfiguration
	 * @constructor
	 */
	var ProfilerWidgetConfiguration = ibNameSpace.Class.extend(/** lends {ProfilerWidgetConfiguration} */ {
		/**
		 * @private
		 */
		init : function () {
			/**
			 * @public
			 * @type {number}
			 */
			this.x = 0;

			/**
			 * @public
			 * @type {number}
			 */
			this.y = 0;

			/**
			 * @public
			 * @type {number}
			 */
			this.rows = 20;

			/**
			 * @public
			 * @type {boolean}
			 */
			this.showChangedRows = true;

			/**
			 * @public
			 * @type {number}
			 */
			this.timeChangedRowsShown = 2000;

			/**
			 * @public
			 * @type {function(a : ProfilerRecord, b : ProfilerRecord) : number}
			 */
			this.sortMethod = profilerWidgetSortMethods.bySelfTotalTime;
		}
	});

	/**
	 * @public
	 * @class ProfilerRecord
	 * @param {string} name
	 * @constructor
	 */
	var ProfilerRecord = ibNameSpace.Class.extend(/** @lends {ProfilerRecord} */ {
		/**
		 * @private
		 * @param name
		 */
		init : function (name) {
			/**
			 * Function name with full namespace
			 * @public
			 * @type {string}
			 */
			this.id = name;

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

			/**
			 * Total SELF execution time since last clear(), milliseconds
			 * @public
			 * @type {number}
			 */
			this.selfTotal = 0;

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
			this.lastCallTime = Date.now();
		}
	});

	/** @type {boolean} */
	var isProfilerPaused = false;

	/** @type {Array.<ProfilerRecord>} */
	var profilerRecords = [];

	// Widget data
	var isWidgetAttached = false,
		widgetId = "profilerWidgetV1.3",
		widgetIntervalId = null,
		widgetConfiguration = new ProfilerWidgetConfiguration();

	var timeStack = [];

	/**
	 * @public
	 * @class Profiler
	 * @constructor
	 */
	var Profiler = ibNameSpace.Class.extend(/** @lends {Profiler} */ {
		/**
		 * @public
		 * @returns {ProfilerWidgetConfiguration}
		 */
		getProfilerWidgetConfiguration : function () {
			return widgetConfiguration;
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
			for (var i = profilerRecords.length - 1; i >= 0; i--) {
				profilerRecords[i] = new ProfilerRecord(profilerRecords[i].id);
			}
		},

		/**
		 * @public
		 * @param {function(ProfilerRecord):boolean} [filterFn]
		 * @returns {Array.<ProfilerRecord>}
		 */
		getReport : function (filterFn) {
			var result = [];

			if (!ibNameSpace.utils.isFunction(filterFn)) {
				filterFn = function () {
					return true;
				};
			}

			for (var i = profilerRecords.length - 1; i >= 0; i--) {
				if (filterFn(profilerRecords[i])) {
					result.push(profilerRecords[i]);
				}
			}

			return result;
		},

		/**
		 * @public
		 * @param {string} name
		 * @param {object} owner
		 * @param {boolean} profilePrototype
		 */
		profileFunction : function (name, owner, profilePrototype) {
			var functionName = (name.indexOf(".") >= 0 ? name.substr(name.lastIndexOf(".") + 1) : name),
				originalFunction, prototype;

			originalFunction = owner[functionName];
			prototype = originalFunction.prototype;

			// exclude already added functions
			if (ibNameSpace.utils.isFunction(originalFunction) && !originalFunction.____PPROFILED) {
				owner[functionName] = this.getFixedFunction(name, originalFunction);

				if (profilePrototype) {
					this.profileObject(name + ".prototype", prototype);
				}

			}

		},

		/**
		 * @public
		 * @param {string} name Name of owner object (for report)
		 * @param {object} object
		 * @param {boolean} [recursively]
		 */
		profileObject : function (name, object, recursively) {
			for (var propertyName in object) {
				if (Object.prototype.hasOwnProperty.call(object, propertyName)) {
					if (ibNameSpace.utils.isFunction(object[propertyName])) {
						if (propertyName != "constructor" && propertyName != "_super") {
							this.profileFunction(name + "." + propertyName, object, typeof object[propertyName]["prototype"] === "object");
						}
					} else if (recursively && ibNameSpace.utils.isObject(object[propertyName]) && !object[propertyName].____PPROFILED) {
						object[propertyName].____PPROFILED = true;
						this.profileObject(name + "." + propertyName, object[propertyName], recursively);
					}
				}
			}
		},

		/**
		 * @public
		 */
		widgetSortMethods : profilerWidgetSortMethods,

		/**
		 * @public
		 * @param {number} updateInterval
		 */
		attachWidget : function (updateInterval) {
			var changedColors = ["#ffe4e4", "#ffd4d4"],
				notChangedColors = ["#e2f4ff", "#d2e4ff"],
				widgetRows = 0, x = 0, y = 0;

			if (isWidgetAttached) {
				this.detachWidget();
			}
			isWidgetAttached = true;

			var el = document.createElement('div');
			el.id = widgetId;
			document.body.appendChild(el);

			function createTableRow (rowIndex) {
				var elRow = document.createElement('tr');

				for (var l = arguments.length, i = 1; i < l; i++) {
					var elCell = document.createElement('td');

					if (rowIndex === null) {
						elCell.setAttribute('style', 'padding: 2px; background-color: #0055aa; color: #ffa700; font-weight: bold;');
					} else if (rowIndex & 1) {
						elCell.setAttribute('style', 'padding: 2px; background-color: #e2f4ff;');
					} else {
						elCell.setAttribute('style', 'padding: 2px; background-color: #d2e4ff;');
					}
					// align text to center for all columns except first
					if (rowIndex === null || i > 1) {
						elCell.style.textAlign = 'center'
					}
					if (rowIndex !== null) {
						elCell.id = widgetId + rowIndex + "." + (i - 1);
					}
					elCell.innerHTML = arguments[i];
					elRow.appendChild(elCell);
				}
				return elRow;
			}

			function updateTableRow (changed, rowIndex) {
				for (var l = arguments.length, i = 2; i < l; i++) {
					var el = document.getElementById(widgetId + rowIndex + "." + (i - 2)),
						color = changedColors[rowIndex & 1];

					if (!changed) {
						color = notChangedColors[rowIndex & 1];
					}
					el.innerHTML = arguments[i] + "";
					el.style.backgroundColor = color;
				}
			}

			// create table
			var elTable = document.createElement('table');
			elTable.setAttribute('style', 'position: fixed; z-index: 99999; color: #000000; background-color: #FFFFFF; top: 0; left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px;');
			elTable.id = widgetId + ".table";

			function updateTableCoordinates () {
				var elTable = document.getElementById(widgetId + ".table");
				if (typeof widgetConfiguration.x !== 'undefined' && widgetConfiguration.x !== x) {
					x = widgetConfiguration.x;
					elTable.style.left = x + 'px';
				}
				if (typeof widgetConfiguration.y !== 'undefined' && widgetConfiguration.y !== y) {
					y = widgetConfiguration.y;
					elTable.style.top = y + 'px';
				}
			}

			el.appendChild(elTable);
			updateTableCoordinates();

			// widget handler/updater
			widgetIntervalId = setInterval(function () {
				var i, time = Date.now(),
					report = ibNameSpace.debug.profiler.getReport(function (record) {
						return record.calls > 0;
					});

				updateTableCoordinates();

				// update rows according to current number
				if (widgetRows !== widgetConfiguration.rows) {
					widgetRows = widgetConfiguration.rows;
					var elTable = document.getElementById(widgetId + ".table");
					elTable.innerHTML = null;
					// create header
					elTable.appendChild(createTableRow(null, "name", "self total, ms", "total, ms", "max, ms", "min, ms", "calls"));
					// create rows
					for (i = 0; i < widgetRows; i++) {
						elTable.appendChild(createTableRow(i, "-", null, null, null, null, null));
					}
				}

				// sort by total execution time
				if (widgetConfiguration.sortMethod) {
					report.sort(widgetConfiguration.sortMethod);
				}

				// update rows text
				for (i = 0; i < widgetRows; i++) {
					if (i < report.length) {
						var d = report[i];
						updateTableRow(
							widgetConfiguration.showChangedRows && (time - d.lastCallTime < widgetConfiguration.timeChangedRowsShown),
							i, d.id, d.selfTotal, d.total, d.max, d.min, d.calls
						);
						d.updated = false;
					} else {
						updateTableRow(false, i, "-", "", "", "", "", "");
					}
				}

			}, updateInterval);
		},

		/**
		 * @public
		 */
		detachWidget : function () {
			if (isWidgetAttached) {
				var wDiv = document.getElementById(widgetId);
				if (wDiv && wDiv.parentNode) {
					wDiv.parentNode.removeChild(wDiv);
				}
				isWidgetAttached = false;
			}
			if (widgetIntervalId !== null) {
				clearInterval(widgetIntervalId);
				widgetIntervalId = null;
			}
		},

		/**
		 * @private
		 * @param {string} name
		 * @param {function} originalFunction
		 * @returns {function}
		 */
		getFixedFunction : function (name, originalFunction) {
			var indexInProfileRecords = profilerRecords.length;

			var fixedFunction = function () {
				timeStack.push(0);

				var start = Date.now(),
					result = originalFunction.apply(this, arguments),
					stop = Date.now(),
					duration = stop - start,
					notSelfTime = timeStack.pop();

				if (!isProfilerPaused) {
					/** @type {ProfilerRecord} */
					var profilerRecord = profilerRecords[indexInProfileRecords];

					profilerRecord.calls++;
					profilerRecord.selfTotal += duration - notSelfTime;
					profilerRecord.total += duration;

					profilerRecord.lastCallTime = stop;
					if (profilerRecord.calls > 1) {
						profilerRecord.min = Math.min(profilerRecord.min, duration);
						profilerRecord.max = Math.max(profilerRecord.max, duration);
					} else {
						profilerRecord.min = duration;
						profilerRecord.max = duration;
					}
				}

				var l = timeStack.length;
				if (l > 0) {
					timeStack[l - 1] += Date.now() - start;
				}
				return result;
			};

			ibNameSpace.utils.augmentObject(fixedFunction, originalFunction);
			fixedFunction.____PPROFILED = true;
			fixedFunction.prototype = originalFunction.prototype;

			profilerRecords[indexInProfileRecords] = new ProfilerRecord(name);
			return fixedFunction;
		}
	});

	/**
	 * @public
	 * @type {Profiler}
	 */
	ibNameSpace.debug.profiler = new Profiler();

})();
