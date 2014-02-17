// prerequisites:
// dataFromServer.sortMethod - sort method (possible sort methods shown at file end)
// dataFromServer.functionsServerRequestedNum - number of functions server want to receive from client (we can't send all 1000+ functions data, only ~10-100)

// widget handler/updater
workerId = setInterval(function () {
	var i,
		dataToSend = [],
		time = jsProfiler.getMilliseconds(),// we need to use these function and not Date.now because results can be different
		report = jsProfiler.getReport(function (record) {
			return record.calls > 0; // filter by calls number > 0 - we don't need statistics about functions that were not called at least once
		});

	report.sort(dataFromServer.sortMethod); // SORT

	// update rows text
	var num = Math.max(report.length, dataFromServer.functionsServerRequestedNum);
	for (i = 0; i < num; i++) {
		var record = report[i];

		// whole d can be serialized, but for now it sent field per field to explain every field
		dataToSend.push({
			"id"              : record.id, // predicted function name (not accurate, most accurate is "loc" field below)
			"loc"             : record.loc, // esprima/AST loc data (see esprima site for format/demo)
			"allTotalTime"    : record.allTotalTime,
			"ownTotalTime"    : record.ownTotalTime,
			"renderCalls"     : record.renderCalls,
			"renderTotalTime" : record.renderTotalTime,
			calls             : record.calls, // number of times function was called
			lastCallTime      : record.lastCallTime // can be used to mark with some color last changed functions in server ui
		});
	}

	sendJSONtoServer({
		data : dataToSend,
		time : time // current getMilliseconds time (it can be different value from Date.now!)
	})

}, 500); // EVERY 500 ms we update server about profiler measurements

/**
 * Sort Methods
 * @enum {function(a:ProfilerRecord, b:ProfilerRecord) : number}
 */
var profilerSortMethods = {
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
