jsprofiler v1.3
==========

Stand-alone Javascript profiler + simple widget.
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

Advanced usage:
===============

```JavaScript
// set X coordinate of profiler
p.getProfilerWidgetConfiguration().x = 640;

// pause profiler
p.pauseProfiler();

// continue profiling
p.continueProfiler();

// change sort method in widget
p.getProfilerWidgetConfiguration().sortMethod = p.widgetSortMethods.bySelfTotalTime;
```

Full API
========

See JSDoc's in profile.js for full API and parameter names/types

Changelog
=========

1.4
* 1. profiling properties created with Object.defineProperty now just skips such property instead of crash
* 2. some window properties return another property that references to parent property.
But in such cases when profiler marks some window properties with flag "PROFILED", this flag is not set and
there is no exception on it. It leads to infinite recursion.

1.3
* 1. Added protection against recursive objects.

1.2
* 1. initial commit
