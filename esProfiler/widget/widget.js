// Widget should be used only with instrumented code loaded before!

(function (global) {

	/**
	 * Sort Methods for widget
	 * @enum {function(a:ProfilerRecord, b:ProfilerRecord) : number}
	 */
	var profilerWidgetSortMethods = {
		bySelfTotalTime : function (a, b) {
			if (a.ownTotalTime > b.ownTotalTime) {
				return -1;
			}
			return 1;
		},
		byTotalTime     : function (a, b) {
			if (a.allTotalTime > b.allTotalTime) {
				return -1;
			}
			return 1;
		},
		byCalls         : function (a, b) {
			if (a.calls > b.calls) {
				return -1;
			}
			return 1;
		},
		byRenderTime    : function (a, b) {
			if (a.renderTotalTime > b.renderTotalTime) {
				return -1;
			}
			return 1;
		}
	};

	/**
	 * @public
	 */
	var profilerWidgetConfiguration = {
		/**
		 * @public
		 * @type {number}
		 */
		x : 0,

		/**
		 * @public
		 * @type {number}
		 */
		y : 0,

		/**
		 * @public
		 * @type {number}
		 */
		rows : 20,

		/**
		 * @public
		 * @type {boolean}
		 */
		showChangedRows : true,

		/**
		 * @public
		 * @type {number}
		 */
		timeChangedRowsShown : 2000,

		/**
		 * @public
		 */
		hotKeyCodes : {
			"hide"             : 53,
			"show"             : 54,
			"pauseProfiler"    : 55,
			"continueProfiler" : 56,
			"clear"            : 57
		},

		/**
		 * @public
		 * @type {profilerWidgetSortMethods}
		 */
		sortMethod : profilerWidgetSortMethods.bySelfTotalTime
	};

	// Widget data
	var isWidgetAttached = false,
		widgetId = "profilerWidgetV1.7",
		widgetIntervalId = null,
		widgetConfiguration = profilerWidgetConfiguration;

	var widget = {
		cfg : profilerWidgetConfiguration,
		sortMethods : profilerWidgetSortMethods,

		/**
		 * @public
		 */
		attachEventListeners : function () {
			document.addEventListener("keydown", function (e) {
				e = e || window.event;
				var hotKeys = widgetConfiguration.hotKeyCodes;

				switch (e.keyCode) {
					case hotKeys["pauseProfiler"]:
						jsProfiler.pauseProfiler();
						break;
					case hotKeys["continueProfiler"]:
						jsProfiler.continueProfiler();
						break;
					case hotKeys["clear"]:
						jsProfiler.clear();
						break;
					case hotKeys["hide"]:
						widget.detachWidget();
						break;
					case hotKeys["show"]:
						widget.attachWidget(500);
						break;
				}
			}, true);
		},

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
			el.style.position = "fixed";
			el.style.zIndex = 99999;
			el.style.top = '0';
			el.style.left = '0';

			document.body.appendChild(el);

			function createTableRow (rowIndex) {
				var elRow = document.createElement('tr'),
					args = [].slice.apply(arguments);

				for (var l = args.length, i = 1; i < l; i++) {
					var elCell = document.createElement('td');

					if (rowIndex === null) {
						elCell.setAttribute('style', 'padding: 2px; background-color: #0055aa; color: #ffa700; font-weight: bold;');
					} else if (rowIndex & 1) {
						elCell.setAttribute('style', 'padding: 2px; background-color: #e2f4ff;');
					} else {
						elCell.setAttribute('style', 'padding: 2px; background-color: #d2e4ff;');
					}
					// align text to center for all columns except first
					if (rowIndex === null || i > 2) {
						elCell.style.textAlign = 'center'
					}
					if (rowIndex !== null) {
						elCell.id = widgetId + rowIndex + "." + (i - 1);
					}

					if (args[i]) {
						var parts = args[i].split('|');
						if (parts.length === 1) {
							elCell.innerHTML = args[i];
						} else {
							elCell.colSpan = parseInt(parts[0]);
							elCell.innerHTML = parts[1];
						}
					} else {
						elCell.innerHTML = args[i];
					}
					elRow.appendChild(elCell);
				}
				return elRow;
			}

			function updateTableRow (changed, rowIndex) {
				for (var l = arguments.length, i = 2; i < l; i++) {
					var el = document.getElementById(widgetId + rowIndex + "." + (i - 2)),
						color = changed ? changedColors[rowIndex & 1] : notChangedColors[rowIndex & 1],
						value = arguments[i];

					if (typeof value === 'number') {
						value = value | 0;
					}

					el.innerHTML = value + "";
					el.style.backgroundColor = color;
				}
			}

			// create table
			var elTable = document.createElement('table');
			elTable.setAttribute('style', 'color: #000000; background-color: #FFFFFF; top: 0; left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px;');
			elTable.id = widgetId + ".table";

			function updateTableCoordinates () {
				var el = document.getElementById(widgetId);
				if (typeof widgetConfiguration.x !== 'undefined' && widgetConfiguration.x !== x) {
					x = widgetConfiguration.x;
					el.style.left = x + 'px';
				}
				if (typeof widgetConfiguration.y !== 'undefined' && widgetConfiguration.y !== y) {
					y = widgetConfiguration.y;
					el.style.top = y + 'px';
				}
			}

			el.appendChild(elTable);
			updateTableCoordinates();

			// widget handler/updater
			widgetIntervalId = setInterval(function () {
				var i,
					time = jsProfiler.getMilliseconds(),
					report = jsProfiler.getReport(function (record) {
						return record.calls > 0;
					});

				updateTableCoordinates();

				// update number of rows according to current widget rows number
				if (widgetRows !== widgetConfiguration.rows) {
					widgetRows = widgetConfiguration.rows;
					var elTable = document.getElementById(widgetId + ".table");
					elTable.innerHTML = null;
					// create header
					elTable.appendChild(createTableRow(null, "2|function", "2|self time, ms", "2|all time, ms", "2|draw time, ms", "calls", "redraws"));
					elTable.appendChild(createTableRow(null, "location", "name", "total", "avg", "total", "avg", "total", "avg", "", ""));
					// create rows
					for (i = 0; i < widgetRows; i++) {
						elTable.appendChild(createTableRow(i, "-", "-", null, null, null, null, null, null, null, null));
					}
				}

				// sort by total execution time
				if (widgetConfiguration.sortMethod) {
					report.sort(widgetConfiguration.sortMethod);
				}

				// update rows text
				for (i = 0; i < widgetRows; i++) {
					if (i < report.length) {
						var d = report[i], allAvg = 0, ownAvg = 0, drawAvg = 0, isChanged = false;

						if (d.calls > 0) {
							allAvg = (d.allTotalTime / d.calls) | 0;
							ownAvg = (d.ownTotalTime / d.calls) | 0;
						}

						if (d.renderCalls > 0) {
							drawAvg = (d.renderTotalTime / d.renderCalls) | 0;
						}

						if (widgetConfiguration.showChangedRows) {
							isChanged = time - d.lastCallTime < widgetConfiguration.timeChangedRowsShown;
						}

						updateTableRow(
							isChanged,
							i, JSON.stringify(report[i].loc["start"]), report[i].id, d.ownTotalTime, ownAvg, d.allTotalTime, allAvg, d.renderTotalTime, drawAvg, d.calls, d.renderCalls
						);
						//d.updated = false;
					} else {
						updateTableRow(false, i, "-", "-", "", "", "", "", "", "", "", "");
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
		}
	};

	widget.attachEventListeners();

	global.widget = widget;
})(jsProfiler);
