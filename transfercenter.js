/******************************************************* *
**
** AUTHOR:  Taylor White
** PURPOSE: To have a daily email of progress for transfer center peeps
** DATE: 	08/25/201
**
** Based on http://css-tricks.com/ajaxing-svg-sprite/
**
* *******************************************************/
var numSVGs = 0;
var icon = {caution: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Emoji_u1f613.svg",
			joy : "https://upload.wikimedia.org/wikipedia/commons/c/cb/Emoji_u1f601.svg",
			behind: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Emoji_u1f631.svg"
			//behind: "https://upload.wikimedia.org/wikipedia/commons/5/50/Emoji_u1f628.svg"
			};
var formatDate = d3.timeParse("%d-%b-%y");
var dlgTSV,line,area,x,y,width,height,margin,xAxis,yAxis,svg,parseDate,bisectDate,formatValue;
var errorColor = "#D97777";
var warningColor ="#D9C977";
var goodColor = "#69B261";
var ganttData;
var dlgCount;

// the table rows, typically loaded from data file using d3.csv
var movies = [
	{ title: "The Godfather", year: 1972, length: 175, budget: 6000000, rating: 9.1 },
	{ title: "The Shawshank Redemption", year: 1994, length: 142, budget: 25000000, rating: 9.1 },
	{ title: "The Lord of the Rings: The Return of the King", year: 2003, length: 251, budget: 94000000, rating: 9 },
	{ title: "The Godfather: Part II", year: 1974, length: 200, budget: 13000000, rating: 8.9 },
	{ title: "Shichinin no samurai", year: 1954, length: 206, budget: 500000, rating: 8.9 },
	{ title: "Buono, il brutto, il cattivo, Il", year: 1966, length: 180, budget: 1200000, rating: 8.8 },
	{ title: "Buono, il brutto, il cattivo, Il", year: 1966, length: 180, budget: 1200000, rating: 8.8 },
	{ title: "Casablanca", year: 1942, length: 102, budget: 950000, rating: 8.8 },
	{ title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, length: 208, budget: 93000000, rating: 8.8 },
	{ title: "The Lord of the Rings: The Two Towers", year: 2002, length: 223, budget: 94000000, rating: 8.8 },
	{ title: "Pulp Fiction", year: 1994, length: 168, budget: 8000000, rating: 8.8 }
];

// column definitions
var columns = [
	{ head: 'DLG ID ', cl: 'year', html: f('year') },
	{ head: 'Development Log', cl: 'title', html: f('title') },
	{ head: 'Responsible Person', cl: 'center', html: f('length') },
	{ head: 'Days In Status', cl: 'num', html: f('budget') },
	{ head: 'Developer', cl: 'num', html: f('rating') }
];	
			
/******************************************************* *
**
** Function to load SVG safely using AJAX,
** including fallback to png files when
** SVG is not supported
**
** Pass the selector and the URL of the files
** without its extenstion as the function
** will take care of it.
**
** Based on http://css-tricks.com/ajaxing-svg-sprite/
**
* *******************************************************/
function loadSvg(selector, url) {
  var target = document.querySelector(selector);

  // If SVG is supported
  if (typeof SVGRect != "undefined") {
    // Request the SVG file
    var ajax = new XMLHttpRequest();
    //ajax.open("GET", url + ".svg", true);
	ajax.open("GET", icon[url], true);
    ajax.send();

    // Append the SVG to the target
    ajax.onload = function(e) {
      target.innerHTML = ajax.responseText;
	  scaleSVG(selector);
    }
	
	numSVGs++;
  } else {
    // Fallback to png
    target.innerHTML = "<img src='" + url + ".png' />";
  }
}

function scaleSVGs() {
	var svgs = document.querySelectorAll("svg");
	for (var i = 0, len = svgs.length; i < len; i++) {
		scaleSVG(svgs[i]);
	}
}

function scaleSVG(target) {
	d3.select(target).select("svg")
		.attr("width", "50px").attr("height","50px");
}

function createDLGTable() {
	createGenericTable("dlgsAdvanced.tsv","#dlgTable","Days In Status",columns);
}

function createUnderDevTable() {
	createGenericTable("dlgsUnderDev.tsv","#underDevTable","Days In Status");
}

function createDesignBottleneckTable() {
	createGenericTable("designBottleneck.tsv","#bottleNeckDesignTable","Days Dev Comp");	
}

function createGenericTable(fileLoc,targetTableEl,sortCol) {
	// create table
	var tableData;
	var table;
	d3.tsv(fileLoc,function(error,data) {
		 tableData=data;
		 
		 table = tabulate(tableData,targetTableEl);
		 table.selectAll("tbody tr")
			.sort(function(a,b) {
				return b[sortCol] - a[sortCol];
			});
	});
}

function drawWorkInProgressDonut() {
	
	var height=500;
	var width= .84*$(document).width();
	var radius = Math.min(width, height) / 2;

	var color = d3.scaleOrdinal()
    .range(["#BB8E4B","#DE3A26", "#F28230", "#FFAB43", "#C0B44C","#B0A73D"]);
		
	var color2 = d3.scaleOrdinal()
		.range(["#83471E","#C92E1C","#E66E20","#F0A33F","#ADA73A"]);
		
	var tooltip = d3.select("divWIPDonut")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.style("background", "#000")
		.text("a simple tooltip");
	var arc = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(radius - 70);
		
	var arc2 = d3.arc()
		.outerRadius(radius-60)
		.innerRadius(radius-70);

	var pie = d3.pie()
		.sort(null)
		.value(function(d) { return d["Value"]; });
		
	var pie2 = d3.pie()
		.sort(null)
		.value(function(d) { return d.value; });

	var svg = d3.select("#divWIPDonut").append("svg")
		.attr("width", width)
		.attr("height", height)
	.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	d3.tsv("overallWIP.tsv", badgeType,function(error, data) {
	if (error) throw error;

	var g = svg.selectAll(".arc")
			.data(pie(data))
		.enter().append("g")
			.attr("class", "arc");

	var g2 = svg.selectAll(".arc2")
		.data(pie(data))
		.enter().append("g")
			.attr("class","arc2");
	
	g.append("path")
		.attr("d", arc)
		.style("fill", function(d) { return color(d.data.badge); })
		.on("mouseover", function(d){tooltip.text(d); return tooltip.style("visibility", "visible");})
		.on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
		.on("mouseout", function(){return tooltip.style("visibility", "hidden")});

	g.append("path")
		.attr("d",arc2)
		.style("fill", function(d) { return color2(d.data.badge); });
	//g2.append("text")
	//	.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
	//	.attr("dy", ".35em");

		
	g.append("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.text(function(d) { return d.data.badge; });
		
	});
}

function drawGanttChart() {
	var ganttColumns,minDate,maxDate,dateFormat,rows;
	rows=[];
	d3.tsv("GanttPlan.tsv", ganttType, function(error, data) {
		ganttColumns = data.columns;
		ganttData = data;
		
		for( var j =0; j<ganttData.length; j++){
			rows.push(ganttData[j].Project);
		}
		
		dateFormat = "%m/%d/%Y";
		ganttData.sort(function(a,b) {
			a.EndDate - b.EndDate;
		});
		maxDate = ganttData[ganttData.length - 1].EndDate;

		ganttData.sort(function(a,b) {
			a.StartDate - b.StartDate;
		});
		minDate = ganttData[0].StartDate;
		var taskStatus = {
			"Under Dev" : "stepUnderDev",
			"PQA 1" : "stepPQA1",
			"QA 1" : "stepQA1",
			"PQA 2" : "stepPQA2",
			"QA 2" : "stepQA2"
		};

		var gantt = d3.gantt("divGanttChart").taskTypes(rows).taskStatus(taskStatus).tickFormat(dateFormat);
		gantt(ganttData,"divGanttChart");
	});
}

function drawWorkInProgressPieChart() {
	/*var width = 960,
		height = 500,
		radius = Math.min(width, height) / 2;

	var color = d3.scale.ordinal()
		.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	var arc = d3.svg.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);

	var labelArc = d3.svg.arc()
		.outerRadius(radius - 40)
		.innerRadius(radius - 40);

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) { return d.population; });

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	d3.select("divWorkInProgress")
		.data(dlgCount)
		.enter()

	var g = svg.selectAll(".arc")
		.data(pie(data))
	.enter().append("g")
		.attr("class", "arc");

	g.append("path")
		.attr("d", arc)
		.style("fill", function(d) { return color(d.data.age); });

	g.append("text")
		.attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.text(function(d) { return d.data.age; });
	});*/
}


function populateFooter() {
	
	d3.tsv("metaData.tsv",badgeType,function(error,data) {
		var footer = d3.select(".footer").attr("id","divFooter");
		footer.data(data)
			.html(function(d,i) {
				return d.value;
			});
	});
	
}

function initializeD3Globals() {
	/********************
	Graph Constants
	*********************/
	width = .6*$(document).width(); 						// Set the width of the graph
	height = 300;											// set the height of the graph
	margin = {top: 20, right: 50, bottom: 50, left: 50};	// set the spacing between the graph and the labels / etc.
	//parseDate = d3.time.format("%d-%b-%y").parse,  
    bisectDate = d3.bisector(function(d) { return d.date; }).left,
    formatValue = d3.format(",.2f"),
    formatCurrency = function(d) { return "$" + formatValue(d); };
}


function drawDaysInStatusBadges() {
	//var width=200;
	var height=200;
	var margin = {bottom: 30};
	var stroke ="rgba(46,117,181,.7)";
	var svg = d3.select("#divDaysInStatusBadges")
		.classed("badges",true)
		.append("svg")
		.attr("height",height)
		.attr("width",1200);
		
	d3.tsv("daysInStatus.tsv",badgeType,function(error,data) {
		//for (var attrname in obj2) { data[attrname] = dlgCount[attrname]; }
		var groups = svg.selectAll("g")
			.data(data)
			.enter()
			.append("g");
		var circles = groups.selectAll("circle")
			.data(data)
			.enter()
			.append("circle");
		circles.attr("cx",function(d,i) {
			return((i)*200+75);
		})
		.attr("id",function(d,i) {
			return ("cirAvgStatus"+i);
		})
		.attr("cy",100)
		.attr("r",40)
		.attr("stroke",stroke)
		.attr("fill","none")
		.attr("stroke-width",10);
		
		var textLabel = groups.selectAll("text")
			.data(data)
			.enter()
			.append("text");
		textLabel.attr("x", function(d,i) {
				return((i)*200+75);
			})
			.classed("metricVal",true)
			.attr("y", height/2+10)
			.style("text-anchor","middle")
			.attr("fill",function(d,i) {
				var strokeColor;
				if (d.badge==="Days In Status" || d.badge==="Days In Status Last Week") {
					if (d.value<5) {
						strokeColor=goodColor;
					}
					else if (d.value<10) {
						strokeColor=warningColor;
					}
					else {
						strokeColor=errorColor;
					}
				}
				else if (d.badge==="DLGs / Developer") {
					if (d.value<2.3) {
						strokeColor=goodColor;
					}
					else if (d.value<3.5) {
						strokeColor=warningColor;
					}
					else {
						strokeColor=errorColor;
					}					
				}
			else if (d.badge==="Development Complete" || d.badge==="QA 1" || d.badge==="QA 2") {
					if (d.value<6) {
						strokeColor=goodColor;
					}
					else if (d.value<12) {
						strokeColor=warningColor;
					}
					else {
						strokeColor=errorColor;
					}		
				}
				return strokeColor;
			})
			.attr("font-weight","bold")
			.attr("font-size",30)
			.text(function(d,i) {
				return Math.round(d.value * 10) / 10;
			});
		
		groups.append("text")
			.attr("x", function(d,i) {
				return ((i)*200+75);
			})
			.attr("y", height - margin.bottom)
			.style("text-anchor","middle")
			.text(function(d) { return d.badge;})
			.attr("font-size",17);		
	});
}
function drawDaysInStatusOverTime() {

	/********************
	Graph Constants
	*********************/
	//var height=480;
	var x = d3.scaleTime()										// set the scale of the x axis which is dates
		.range([0, width]);										// 

	var y = d3.scaleLinear()									// set scale for height of 300 px
		.range([height, 0]);

	var xAxis = d3.axisBottom()									// set the xAxis to be the appropriate scale.
		.scale(x);

	var yAxis = d3.axisLeft()									// set the yaxis assuming a 300 px height
		.scale(y)
		.ticks(10);
		
	line = d3.line()										// the line comes from the data point x = date, y = price
		.x(function(d) { 
			return x(new Date(d.date)); 
		})
		.y(function(d) { 
			return y(d.days); 
		});

	area = d3.area()										// 
		.x(function(d) { 
			return x(new Date(d.date)); 
		})
		.y0(height)
		.y1(function(d) { 
			return y(d.days); 
		});
		
	svg = d3.select("#divDaysInStatusContainer").append("div").attr("id", "dlgsComped") // here we draw the initial SVG. This is the containing box
		.append("svg")
		.attr("id","dlgGraph")	
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")																	// add the overall containing group
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		
	d3.tsv("daysInStatusOvertime.tsv", daysInStatusType, function(error, data) {
		if (error) throw error;

		x.domain(d3.extent(data, function(d) { 
			return new Date(d.date); 
		}));					// get the range of the x values
		y.domain([0,d3.max(data, function(d) { 
			return d.days; 
		})]);					// get the range of the y values

		svg.append("g")
			.attr("class", "x axis")													// add the x axiz
			.attr("transform", "translate(0," + height + ")")							// to the bottom of the graph
			.call(xAxis);																// 

		svg.append("g")
			.attr("class", "y axis")
			 .call(yAxis);
			  
		svg.append("path")
			.attr("id","linePath")
			.datum(data)
			//.attr("class", "line")
			.attr("d", area)
			.attr("class","area");
			
		/*svg.append("line")
			.style("stroke", "black")
			.attr({ 
				x1: x(d3.min(data,function(d) {
					return d.date;
				})), 
				y1: y(15), //start of the line
				x2: x(d3.max(data,function(d) {
					return d.date;
				})), 
				y2: y(15)  //end of the line
			});*/

		svg.append("line")
			.style("stroke", errorColor)
			.attr("stroke-width",4)
			.attr("stroke-dasharray","9.5,9.5")
			.attr("x1", x(d3.min(data,function(d) { return d.date;})))
			.attr("y1", y(5)) //start of the line
			.attr("x2", x(d3.max(data,function(d) { return d.date;}))) 
			.attr("y2", y(5));  //end of the line
		
		svg.append("text")
			.attr("y",y(5))
			.attr("x",x(d3.max(data,function(d) { return d.date;}))/2)
			.attr("text-anchor","middle")
			.attr("dy",25)
			.text("Current goal: 5 days");
			
		var goal= svg.append("g")
			.classed("goalLine",true);
		
		goal.append("text")
				.attr("y",0)
				.attr("x",x(d3.max(data,function(d) { return d.date;}))/2)
				.attr("text-anchor","middle")
				.text("Average DLG Days in Current Status");
		goal.append("circle")
			.attr("cx",x(d3.max(data,function(d) { return d.date;}))/2)
			.attr("cy",y(5))
			.attr("r",6)
			.attr("stroke","black")
			.attr("fill",errorColor);
		

		var focus = svg.append("g")
			.attr("class", "focus")
			.style("display", "none");

		focus.append("circle")
			.attr("r", 4.5);

		focus.append("text")
			.attr("x", 9)
			.attr("dy", ".35em");
		focus.append("circle")
			.attr("x"
			, 9)
			.attr("dy", ".35em")
			.classed("tooltip",true)
			.attr("height","50")
			.attr("width","50")
			.attr("fill","black");
			//.text("hello");

		svg.append("rect")
		  .attr("class", "overlay")
		  .attr("width", width)
		  .attr("height", height)
		  .on("mouseover", function() { focus.style("display", null); })
		  .on("mouseout", function() { focus.style("display", "none");})
		  .on("mousemove", mousemove);
		  
		function mousemove() {
		var x0 = x.invert(d3.mouse(this)[0]),
			i = bisectDate(data, x0, 1),
			d0 = data[i - 1],
			d1 = data[i],
			d = x0 - d0.date > d1.date - x0 ? d1 : d0;
		focus.attr("transform", "translate(" + x(new Date(d.date)) + "," + y(d.days) + ")");
		focus.select("text").text(Math.round(d.days*100)/100 + " days");
		
		}		  

		svg.append("text")
			.classed("yLabel",true)
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Days in status");
			
		svg.append("text")
			.classed("xLabel",true)
			.attr("x", width/2)
			.attr("y", height + margin.bottom)
			.style("text-anchor","middle")
			.text("Date");
	});
}
function drawDLGStatusOvertime() {

	var height=400;
	/********************
	Graph Constants
	*********************/
	var margin = {top: 20, right: 50, bottom: 60, left: 50};	// set the spacing between the graph and the labels / etc.

	var y = d3.scaleLinear()									// set scale for height of 300 px
		.range([height, 0]);
	
	
	var stack = d3.stack();
	var z = d3.scaleOrdinal()
	.range(["#A34418", "#8F0D0D", "#DA3B1B","#F5DD03","#459596","#E77122","#1E9F04","#FD2425", "#6E8503","#AD583B","#86A854"]);
	//.range(["#A34418", "#8F0D0D", "#DA3B1B","#86A854","#459596","#1E9F04", "#6E8503","#E1F1EB","#AD583B","#E77122","#F5DD03"]);

	var svg = d3.select("#divStatusOverTimeContainer").append("div").attr("id", "divStatusOverTime") // here we draw the initial SVG. This is the containing box
		.append("svg")
		.attr("id","svgGraphOverTime")	
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom);

	var g = svg.append("g")										// add the overall containing group
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		
	d3.tsv("dlgsByStatusOvertime.tsv", type, function(error, data) {
		if (error) throw error;
		
		data.sort(function(a, b) { return a.total - b.total; });
		var ordinalX = d3.scaleBand()
			.rangeRound([0,width],-0.4,0);
			
		x = d3.scaleTime()
			.domain(d3.extent(data, function(d) { 
				return new Date(d.Date); 
			}))					// get the range of the x values
			.range([0, width - margin.left - margin.right]);
			
		y.domain(d3.extent(data, function(d) { return d.total; }));					// get the range of the y values

		ordinalX.domain(data.map(function(d) { return new Date(d.Date); }));
		y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
		z.domain(data.columns.slice(1));

		g.selectAll(".serie")
		.data(stack.keys(data.columns.slice(1))(data))
		.enter().append("g")
		  .attr("class", "serie")
		  .attr("fill", function(d) { return z(d.key); })
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("rect")
			.attr("x", function(d) { 
				return x(new Date(d.data.Date)); 
			})
			.attr("y", function(d) { return y(d[1]); })
			.attr("height", function(d) { return y(d[0]) - y(d[1]); })
			.attr("width", ordinalX.bandwidth())
			.on("mouseover", function() { 
				tooltip.style("display", null); 
			})
			.on("mouseout", function() { 
				tooltip.style("display", "none"); 
			})
			.on("mousemove", function(d) {
				//var xPosition = d3.mouse(this)[0] + 55;
				//var yPosition = d3.mouse(this)[1] - 1;
				//Get this bar's x/y values, then augment for the tooltip
				//tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
				var xPosition = parseFloat(d3.select(this).attr("x")) + ordinalX.bandwidth() / 2;
				var yPosition = parseFloat(d3.select(this).attr("y")) / 2 + height / 2;

				tooltip	.attr("left",xPosition)
				.attr("top",yPosition)
				.text("hello");
				/*.select("table").html(function() {
					var html;
					html="";
					html+="<tr><td>Under Dev: " + d.data["Under Dev"] + "</td></tr>";
					html+="<tr><td>Dev Comp: " + d.data["Dev Comp"] + "</td></tr>";
					html+="<tr><td>QA 1: " + d.data["QA 1"] + "</td></tr>";
					html+="<tr><td>PQA 2: " + d.data["PQA 2"] + "</td></tr>";
					html+="<tr><td>QA 2: " + d.data["QA 2"] + "</td></tr>";
					html+="<tr><td>Final: " + d.data["Final"] + "</td></tr>";
					html+="<tr><td>Final Comp: " + d.data["Final Comp"] + "</td></tr>";
					return html;
				});*/
			});

		g.append("g")
		  .attr("class", "axis axis--x")
		  .attr("transform", "translate(0," + height + ")")
		  .call(d3.axisBottom(x).ticks(15))
		  .selectAll("text")
		  .attr("y", 0)
		  .attr("x", 9)
		  .attr("dy", ".35em")
		  .attr("transform", "rotate(90)")
		  .style("text-anchor", "start");


		g.append("g")
			.attr("class", "axis axis--y")
			.call(d3.axisLeft(y).ticks(10));

		svg.append("text")
			.classed("yLabel",true)
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.attr("y", y(y.ticks(10).pop()))
			.attr("fill", "#000")
			.text("Count of DLGs");
			
		svg.append("text")
			.classed("xLabel",true)
			.attr("x", width/2)
			.attr("y", height + margin.bottom)
			.style("text-anchor","middle")
			.text("Date");
		
		var legend = g.selectAll(".legend")
			.data(data.columns.slice(1).reverse())
			.enter().append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
				.style("font", "10px sans-serif");

		legend.append("rect")
			.attr("x", width - 18)
			.attr("width", 18)
			.attr("height", 18)
			.attr("fill", z);

		legend.append("text")
			.attr("x", width - 24)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("text-anchor", "end")
			.text(function(d) { return d; });
			
		// Prep the tooltip bits, initial display is hidden
		var tooltip = svg.append("div")
			.attr("class", "divTooltip")
			.style("display", "none");
			
		/*tooltip.append("rect")
			.attr("width", 100)
			.attr("height", 50)
			.attr("fill", "white")
			.style("opacity", 0.5);*/

		tooltip.append("table");
			//.attr("x", 15)
			//.attr("dy", "1.2em")
			//.style("text-anchor", "middle")
			//.style("position", "absolute")
			//.style("z-index", "10")		
			//.attr("font-size", "12px")
			//.attr("color","black")
			//.attr("font-weight", "bold");
			
		g.append("text")
			.attr("text-anchor","middle")
			.attr("x",width/2)
			.attr("y",0)
			.text("Development Logs By Status Over Time");
	});
}
function resize2() {
	/* Find the new window dimensions */
	//width = $(document).width();
	 
	/* Update the range of the scale with new width/height */


	width = parseInt(d3.select("#dlgGraph").style("width")) - margin.left*2,
	x.range([0, width]);										// 

	/* Update the axis with the new scale */
	svg.select('.x.axis')
	  .attr("transform", "translate(0," + height + ")")
	  .call(xAxis);
	 
	svg.select('.y.axis')
	  .call(yAxis);
	 
	/* Force D3 to recalculate and update the line */
	svg.selectAll('.area')
	  .attr("d", area);
	
}

function initialize() {
	initializeD3Globals();
	loadSvg(".caution","caution");
	loadSvg(".joy","joy");
	loadSvg(".behind","behind");
	scaleSVGs();
	addClickHandlers();
	createDLGTable();
	createUnderDevTable();
	createDesignBottleneckTable();
	drawDaysInStatusOverTime();
	drawDLGStatusOvertime();
	drawDaysInStatusBadges();
	drawWorkInProgressDonut();
	drawGanttChart();
	populateFooter();
	d3.select(window).on('resize',resize2);	
}

function addClickHandlers() {
	var headers = d3.selectAll("h2");
		
		headers.on("click",function (d) {
			$("html, body").animate({ scrollTop: $(d.id).offset().top }, 1000);
		});
}

function daysInStatusType(d) {
  //d.date = formatDate(d.Date);
  //d.date = d.date;
  d.date = new Date(d.Date);
  d.days = +d["Average Days In Status"];
  return d;
}

function badgeType (d) {
	d.badge=d["Badge"];
	d.value=d["Value"];
	return d;
}

function type(d, i, columns) {
  for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
  d.total = t;
  return d;
}

function ganttType(d) {
	var task = new Object();
	var stepClass;
	task.DLG = d["DLG"];
	task.Project = d["Project"];
	task.Step = d["Step"];
	task.StartDate = new Date(d["Start Date"]);
	task.EndDate = new Date(d["End Date"]);
	
	switch (d.Step) {
		case "Under Dev":
			stepClass="stepUnderDev";
			break;
		case "PQA 1":
			stepClass="stepPQA1";
			break;
		case "QA 1":
			stepClass="stepQA1";
			break;
		case "PQA 2":
			stepClass="stepPQA2";
			break;
		case "QA 2":
			stepClass="stepQA2";
			break;
	}
	task.StepClass = stepClass;
	
	return task;
}

function length() {
	var fmt = d3.format('02d');
	return function(l) { return Math.floor(l / 60) + ':' + fmt(l % 60) + ''; };
}

function tabulate(data,container) {
	var sortAscending = true;
    var table = d3.select(container).append("table"),
        thead = table.append("thead"),
        tbody = table.append("tbody");
	var titles = d3.keys(data[0]);
    // append the header row
    var headers = thead.append("tr")
		.selectAll("th")
		.data(titles)
		.enter()
		.append("th")
		.text(function(column) { return column; })
		.on('click', function (d) {
			headers.attr('class', 'header');

			if (sortAscending) {
				rows.sort(function(a, b) {
					if (isNaN(a[d])) {
						return d3.ascending(a[d], b[d]);
					} 
					else {
						return b[d] - a[d]; 	
					}
				});
				sortAscending = false;
				this.className = 'aes';
			} else {
				rows.sort(function(a, b) {
					if (isNaN(a[d])) {
						return d3.descending(a[d], b[d]);
					} 
					else {
						return a[d] - b[d]; 	
					}
				});
				sortAscending = true;
				this.className = 'des';
			}

		});

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
		.data(data)
		.enter()
		.append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
		.data(function(row) {
			return titles.map(function(column) {
				return {column: column, value: row[column]};
            });
		})
		.enter()
		.append("td")
		.html(function(d) { 
			if (d.column==="DLG ID") {
				return '<a href="emc2://TRACK/DLG/' + d.value + '?action=EDIT">' + d.value + "</a>";
			}
			else if (d.column==="Design ID") {
				return '<a href="emc2://TRACK/XDS/' + d.value + '?action=EDIT">' + d.value + '</a>';
			}
			else {
				return d.value; 
			}
		})
		.attr('class', function(d,i) {
			if (d.column==="Days In Status") {
				if (d.value <=2) {
					return "goodColor";
				}
				else if (d.value>5) {
					return "errorColor";
				}
				else {
					return "warningColor";
				}
			}
			else {
				return;
			}
		})
		.classed('rightAlign', function(d) {
			
			if (!isNaN(d.value)) {
				return true;
			}
			return false;
		})
		.classed('tableCell', true)
		.attr('data-th', function (d) {
			return d.name;
		});    
    return table;
}