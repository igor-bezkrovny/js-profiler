esprima profiler added.

TODO:
=====
* separate widget from profiler
* refactor code
* update readme.md (and describe both profilers)


js-profiler
==========

Standalone javascript profiler + simple widget.
Using this profiler allows to find bottlenecks of your javascript application.

License
=======

The MIT License (MIT)

Usage
=====

```JavaScript
var p = ibNameSpace.debug.profiler;

// profile all properties of obj
p.profileObject('obj', obj, true);

// attach widget to document.body, update every 100 ms
p.attachWidget(100);
```

Widget configuration:
===============

```JavaScript
// set X coordinate of profiler
var p = jsProfiler.widget.getProfilerWidgetConfiguration()

p.x = 640;

// pause profiler
p.pauseProfiler();

// continue profiling
p.continueProfiler();

// change sort method in widget
p.getProfilerWidgetConfiguration().sortMethod = p.widgetSortMethods.bySelfTotalTime;
```

Default configuration:
```JavaScript
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
		sortMethod : profilerWidgetSortMethods.byRenderTime
	};
```

Full API
========

See JSDoc's in profile.js for full API and parameter names/types

Changelog
=========

1.6
* 1. jsProfiler is no more supported. Please use esProfiler instead. All future changes will reflect only esProfiler.
* 2. widget optimized
* 3. profiler core optimized
* 4. min/max timings removed - they were nice, but useless values, that had used cpu/memory.
* 5. browser render time metric added (experimental)
* 6. widget is separated from profiler core.
* 7. hot keys added to widget/widget configuration, widget subscribes to key events automatically

1.5
* 1. esProfiler added

1.4
* 1. profiling properties created with Object.defineProperty now just skips such property instead of crash
* 2. some window properties return another property that references to parent property.
But in such cases when profiler marks some window properties with flag "PROFILED", this flag is not set and
there is no exception on it. It leads to infinite recursion.

1.3
* 1. Added protection against recursive objects.

1.2
* 1. initial commit
