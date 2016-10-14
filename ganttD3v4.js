/**
 * @author Dimitry Kudrayvtsev
 * @version 2.0
 */

d3.gantt = function(elementID) {
    var FIT_TIME_DOMAIN_MODE = "fit";
    var FIXED_TIME_DOMAIN_MODE = "fixed";
    
    var margin = {
	top : 20,
	right : 40,
	bottom : 20,
	left : 150
    };
    var timeDomainStart = d3.timeDay.offset(new Date(),-3);
    var timeDomainEnd = d3.timeHour.offset(new Date(),+3);
    var timeDomainMode = FIT_TIME_DOMAIN_MODE;// fixed or fit
    var taskTypes = [];
    var taskStatus = [];
    var height = document.body.clientHeight - margin.top - margin.bottom-5;
    var width = (d3.select("#"+elementID).node().getBoundingClientRect().width*1) - margin.right - margin.left-5;

    var tickFormat = "%H:%M";

    var keyFunction = function(d) {
	return d.StartDate + d.Project + d.EndDate;
    };

    var rectTransform = function(d) {
	return "translate(" + x(d.StartDate) + "," + y(d.Project) + ")";
    };

    var x = d3.scaleTime().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);

    var y = d3.scaleBand().domain(taskTypes).range([ 0, height - margin.top - margin.bottom ], .1);
    
    var xAxis = d3.axisBottom().scale(x).tickFormat(d3.timeFormat(tickFormat));/*.tickSubdivide(true)
	    .tickSize(8).tickPadding(8);*/

    var yAxis = d3.axisLeft().scale(y).tickSize(0);

    var initTimeDomain = function(ganttData) {
	if (timeDomainMode === FIT_TIME_DOMAIN_MODE) {
	    if (ganttData === undefined || ganttData.length < 1) {
		timeDomainStart = d3.timeDay.offset(new Date(), -3);
		timeDomainEnd = d3.timeHour.offset(new Date(), +3);
		return;
	    }
	    ganttData.sort(function(a, b) {
		return a.EndDate - b.EndDate;
	    });
	    timeDomainEnd = ganttData[ganttData.length - 1].EndDate;
	    ganttData.sort(function(a, b) {
		return a.StartDate - b.StartDate;
	    });
	    timeDomainStart = ganttData[0].StartDate;
	}
    };

    var initAxis = function() {
		x = d3.scaleTime().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);
		y = d3.scaleBand().domain(taskTypes).range([ 0, height - margin.top - margin.bottom ], .1);

		xAxis = d3.axisBottom().scale(x).tickFormat(d3.timeFormat(tickFormat))/*.tickSubdivide(true).tickSize(8).tickPadding(8)*/;
		yAxis = d3.axisLeft().scale(y).tickSize(0);
    };
    
    function gantt(ganttData,elementID) {
	
		initTimeDomain(ganttData);
		initAxis();
		var legendKeys;
		var svg = d3.select("#"+elementID)
		.append("svg")
		.attr("class", "chart")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("class", "gantt-chart")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
		
		  svg.selectAll(".chart")
		 .data(ganttData, keyFunction).enter()
		 .append("rect")
		 .attr("rx", 5)
			 .attr("ry", 5)
		 .attr("class", function(d){ 
			 if(taskStatus[d.Step] == null){ 
				return "bar";
			 }
			 return taskStatus[d.Step];
		}) 
		.attr("y", 0)
		.attr("transform", rectTransform)
		.attr("height", function(d) { 
			return y.bandwidth(); 
			})
		.attr("width", function(d) { 
			 return (x(d.EndDate) - x(d.StartDate)); 
			 })
		.attr("id",function(d) {
			return d.Project+"_"+d.Step;
		});
		legendKeys = d3.map(ganttData,function(d) {return d.Step;}).keys();
		var z = d3.scaleOrdinal()
			.range(["stepUnderDev","stepPQA1","stepQA1","stepPQA2","stepQA2"])
			.domain(legendKeys);
		var legend = svg.selectAll(".legend")
			.data(d3.map(ganttData,function(d) {
					return d.Step;
				}).keys())
			.enter().append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
				.style("font", "10px sans-serif");

		legend.append("rect")
			.attr("x", width - 18)
			.attr("width", 18)
			.attr("height", 18)
			.attr("class", function(d) {
					return z(d);
				});

		legend.append("text")
			.attr("x", width - 24)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("text-anchor", "end")
			.text(function(d) { return d; });
		var today = new Date();
		svg.append("line")
			.attr("x1", x(today))  //<<== change your code here
			.attr("y1", 0)
			.attr("x2", x(today))  //<<== and here
			.attr("y2", height - margin.top - margin.bottom)
			.style("stroke-width", 4)
			.style("stroke", "#BB8E4B")
			.style("fill", "none");
		 
		 svg.append("g")
		 .attr("class", "x axis")
		 .attr("transform", "translate(0, " + (height - margin.top - margin.bottom) + ")")
		 .transition()
		 .call(xAxis);
		 
		 svg.append("g").attr("class", "y axis").transition().call(yAxis);
		 
		 return gantt;

    };
    
    gantt.redraw = function(tasks) {

	initTimeDomain();
	initAxis();
	var svg = d3.select("svg");

	var ganttChartGroup = svg.select(".gantt-chart");
	var rect = ganttChartGroup.selectAll("rect").data(ganttData, keyFunction);
	
	rect.enter()
	.insert("rect",":first-child")
	.attr("rx", 5)
	.attr("ry", 5)
	.attr("class", function(d){ 
		if(taskStatus[d.Step] == null){ 
			return "bar";
		}
		return taskStatus[d.Step];
	}) 
	.transition()
	.attr("y", 0)
	.attr("transform", rectTransform)
	.attr("height", function(d) { 
		return y.rangeBand(); 
	})
	.attr("width", function(d) { 
	    return (x(d.EndDate) - x(d.StartDate)); 
	});

	rect.transition()
		.attr("transform", rectTransform)
		.attr("height", function(d) { return y.rangeBand(); })
		.attr("width", function(d) { 
			return (x(d.EndDate) - x(d.StartDate)); 
		});
	rect.exit().remove();

	svg.select(".x").transition().call(xAxis);
	svg.select(".y").transition().call(yAxis);
	
	return gantt;
    };

    gantt.margin = function(value) {
	if (!arguments.length)
	    return margin;
	margin = value;
	return gantt;
    };

    gantt.timeDomain = function(value) {
	if (!arguments.length)
	    return [ timeDomainStart, timeDomainEnd ];
	timeDomainStart = +value[0], timeDomainEnd = +value[1];
	return gantt;
    };

    /**
     * @param {string}
     *                vale The value can be "fit" - the domain fits the data or
     *                "fixed" - fixed domain.
     */
    gantt.timeDomainMode = function(value) {
	if (!arguments.length)
	    return timeDomainMode;
        timeDomainMode = value;
        return gantt;

    };

    gantt.taskTypes = function(value) {
	if (!arguments.length)
	    return taskTypes;
	taskTypes = value;
	return gantt;
    };
    
    gantt.taskStatus = function(value) {
	if (!arguments.length)
	    return taskStatus;
	taskStatus = value;
	return gantt;
    };

    gantt.width = function(value) {
	if (!arguments.length)
	    return width;
	width = +value;
	return gantt;
    };

    gantt.height = function(value) {
	if (!arguments.length)
	    return height;
	height = +value;
	return gantt;
    };

    gantt.tickFormat = function(value) {
	if (!arguments.length)
	    return tickFormat;
	tickFormat = value;
	return gantt;
    };


    
    return gantt;
};
