# d3Reports
## Introduction


![screenshot](https://raw.github.com/dk8996/Gantt-Chart/master/examples/screenshot1.png)

#### External Data Example
Here is a [example] (http://static.mentful.com/d3ganttchart/example.html) of loading external data, in JSON format, into the Gantt Chart, you need to watch out for [cross-domain restrictions] (http://en.wikipedia.org/wiki/Same-origin_policy). 

## Getting Started
### Task Names
Create a array of task names, they will be display on they y-axis in the order given to the array.

```javascript
var taskNames = [ "D Job", "P Job", "E Job", "A Job", "N Job" ];
```

### Create a Simple Gantt-Chart
Create a simple Gantt-Chart

```javascript
var gantt = d3.gantt().taskTypes(taskNames).taskStatus(taskStatus);
gantt(tasks);
```

## Dependencies & Building
Relies on the fantastic [D3 visualization library](http://mbostock.github.com/d3/) to do lots of the heavy lifting for stacking and rendering to SVG.

## Resources
#### Gantt Chart
[Example 1] (http://bl.ocks.org/dk8996/5534835)
[Example 2] (http://bl.ocks.org/dk8996/5449641).
## License

   Copyright 2012 Dimitry Kudryavtsev

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
   
   [![githalytics.com alpha](https://cruel-carlota.pagodabox.com/c088458a0319a78b63aaea9c54fba4de "githalytics.com")](http://githalytics.com/dk8996/Gantt-Chart)
