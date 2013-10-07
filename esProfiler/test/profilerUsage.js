// prerequisites:
// dataFromServer.sortMethod - sort method (possible sort methods shown at file end)
// dataFromServer.functionsServerRequestedNum - number of functions server want to receive from client (we can't send all 1000+ functions data, only ~10-100)

// widget handler/updater
workerId = setInterval(function () {
	var i,
		dataToSend = [],
		time = jsProfiler.getMilliseconds(),// we need to use these function and not Date.now because results can be different
		report = jsProfiler.getReport(function (record) {
			return record.own.calls > 0; // filter by calls number > 0 - we don't need statistics about functions that were not called at least once
		});

	report.sort(dataFromServer.sortMethod); // SORT

	// update rows text
	var num = Math.max(report.length, dataFromServer.functionsServerRequestedNum);
	for (i = 0; i < num; i++) {
		var d = report[i];

		// whole d can be serialized, but for now it sent field per field to explain every field
		dataToSend.push({
			"id"   : report[i].id, // predicted function name (not accurate, most accurate is "loc" field below)
			"loc"  : report[i].loc, // esprima/AST loc data (see esprima site for format/demo)
			"all" : {
				totalTime    : d.all.total // total function execution time including all execution time of all functions called from this, in milliseconds
			},
			"draw" : {
				lastCallTime : d.draw.lastCallTime, // can be used to mark with some color last changed functions in server ui
				totalTime    : d.draw.total, // total SELF function execution time in milliseconds
				calls        : d.draw.calls // number of times BROWSER repaint was called after this function
			},
			"own"  : {
				lastCallTime : d.own.lastCallTime, // can be used to mark with some color last changed functions in server ui
				totalTime    : d.own.total, // total SELF function execution time in milliseconds
				calls        : d.own.calls // number of times function was called
			},
			"cps"  : d.fps.getFPS() // calls per second for this function, useful to see how often some heavy functions are called.
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
		if (a.own.total > b.own.total) {
			return -1;
		}
		return 1;
	},
	byTotalTime     : function (a, b) {
		if (a.all.total > b.all.total) {
			return -1;
		}
		return 1;
	},
	byCalls         : function (a, b) {
		if (a.own.calls > b.own.calls) {
			return -1;
		}
		return 1;
	},
	byDrawTime         : function (a, b) {
		if (a.draw.total > b.draw.total) {
			return -1;
		}
		return 1;
	}
};
