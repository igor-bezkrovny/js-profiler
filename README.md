jsprofiler v1.3
==========

Stand-alone Javascript profiler + simple widget.

Using this profiler allows to find bottlenecks of your javascript application.

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

FULL API
========

See JSDoc's in profile.js for full API and parameter names/types

Changelog
=========

*1.3*
Added protection against recursive objects.

*1.2*
initial commit
