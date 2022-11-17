// geomap.js
// References:
// - - https://bl.ocks.org/mbostock/5562380
// - - https://sureshlodha.github.io/CSE163_Spring2020/projects/pamidi/epp.html
// json file is from the NC dept. of Environmental Quality
// https://data-ncdenr.opendata.arcgis.com/datasets/nc-counties/explore?location=34.614981%2C-79.919249%2C5.85
// 

var svg = d3.select( "body" )
          .append( "svg" )
          .attr( "width", width )
          .attr( "height", height );

// toggle boundary button
document.write('<button id="boundary" class="boundary" onclick="toggleBoundary();">Toggle County Boundary</button>');


//Set margins
var margin = {top: 0, right: 0, bottom: 0, left: 0};
//Set visualization's width and height
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

//Add the containing svg element to the visSpace div
var svg = d3.select("body")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
//Add a g element to group the entire visualization's elements
//g will be used whenever attributes must be given to all elements in
//the visualization
var g = svg.append("g")
           .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// the svg for drawing the counties
var countyGroup = g.append("g")
    .attr("stroke", "black")
    .style("stroke-width", 1);

// toggle the boundary of the states
var toggle = false;

// the color of the one visualization
var color = d3.scaleThreshold()
    .domain([0, 100, 250, 500, 750, 1000, 2000])
    .range(d3.schemeOrRd[7]);

// second color for the visualization
var colorScale = d3.scaleThreshold()
                   .domain([0, 100, 250, 500, 750, 1000, 2000])
                   .range(d3.schemeGreens[7]);

// toggle to switch between colors
var colorToggle = true;

var tooltip;

// hide tooltip function
function hideTooltip(d, i) {
   d3.select("#tooltip")
     .attr("class", "hidden");
   tooltip.style("background-color", "transparent")
          .style("border-color", "transparent")
          .style("color", "transparent");
 }
// defines the x value for the legend
var x = d3.scaleSqrt()
    .domain([0, 4500])
    .rangeRound([440, 950]);

// defines the counties in NC
var geoStates;

//  draw the Albers equal-area conic projection
var projection = d3.geoAlbers();

//Create a path generator
var pathGenerator = d3.geoPath().projection(projection);

//Load in the json and csv file
d3.json("NC_Counties.geojson").then(function(geoData){
d3.csv("ncdata.csv").then(function(popData){

  geoStates = geoData.features;
  console.log("states from geoData.features:");
  console.log(geoStates);
  projection.fitExtent([ [ 0, 0 ], [ width, height ] ], geoData);
  // iterate through the csv file to get the state, county, and density
  for (var i = 0; i < popData.length; ++i) {
      var stateName = popData[i].USstate; // only NC
      var countyDensity = +popData[i].density;
      var countyName = popData[i].county.split(' ')[0];
    
      // iterate through the json
      for (var j = 0; j < geoStates.length; ++j) {
        // get the county and add a value to the object 
        if (countyName.toLowerCase() == geoStates[j].properties.CO_NAME.toLowerCase()) {
          console.log(countyName.toLowerCase(), geoStates[j].properties.CO_NAME.toLowerCase())
          geoStates[j].properties.value = countyDensity;        
        }
      }
    }

  // draw the legend rectangle  
  g.selectAll("rect")
    .data(colorScale.range().map(function(d) {
        d = colorScale.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
    .enter().append("rect")
      .attr("height", 8)
      .attr("x", function(d) { return x(d[0]); })
      .attr("width", function(d) { return x(d[1]) - x(d[0]); })
      .attr("fill", function(d) { return colorScale(d[0]); });

  // draw the text of the legend
  g.append("text")
      .attr("class", "caption")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Population per square mile");
  
  // draw the ticks along the legend
  g.call(d3.axisBottom(x)
      .tickSize(13)
      .tickValues(colorScale.domain()))
      .select(".domain")
      .remove();
  
  // draw the counties
  countyGroup.selectAll("path")
            .data(geoStates)
            .enter()
            .append("path")
            .attr("d", pathGenerator)
            .attr("fill", function(d){console.log(d.properties.value); return colorScale(d.properties.value);});

  //draw the tooltip
  tooltip = d3.select("body")
            .data(geoStates)
            .enter()
            .append("div")
            .attr("id", "tooltip")
            .attr("class", "hidden");
 // draw the county and density on the tooltip
 tooltip.append("p").append("b").attr("id", "cField");
 tooltip.append("p").attr("id", "densityField");
 //display tool tip for specifc county
 countyGroup.selectAll("path").on("mousemove", showTooltip);
 //Set the action function on mousemove
 function showTooltip(d, i) {
     // draw tooltip
     d3.select("#tooltip")
        .style("left", d3.event.pageX - 60 + "px")
        .style("top", d3.event.pageY - 100 + "px")
        .attr("class", "")
        .style("background-color", "grey")
        .style("border-color", "black")
        .style("color", "black");
     //Add in the data
     d3.select("#cField").text(d.properties.CO_NAME);
     d3.select("#densityField").text("Density: " + d.properties.value+" people/km^2");
 };
 //Assign on mouseout event
 countyGroup.selectAll("path").on("mouseout", hideTooltip);
  

});
});


// change color button
function changeColor(geoStates) {
  // remove the graph and legend when the button is clicked
  // to make place for another one
  g.selectAll("rect").remove()
  g.selectAll("path").remove()
  
  // if the button is not toggled
  if (colorToggle == false) {
     // draw the legend
     g.selectAll("rect")
      .data(colorScale.range().map(function(d) {
          d = colorScale.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return colorScale(d[0]); });
      // draws the text on the legend
      g.append("text")
          .attr("class", "caption")
          .attr("x", x.range()[0])
          .attr("y", -6)
          .attr("fill", "#000")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text("Population per square mile");
      // draws the ticks on the legend
      g.call(d3.axisBottom(x)
          .tickSize(13)
          .tickValues(colorScale.domain()))
        .select(".domain")
          .remove();

        countyGroup.selectAll("path")
                .data(geoStates)
                .enter()
                .append("path")
                .attr("d", pathGenerator)
                .attr("fill", function(d){return colorScale(d.properties.value);});    

     tooltip = d3.select("body")
            .data(geoStates)
            .enter()
            .append("div")
            .attr("id", "tooltip")
            .attr("class", "hidden");
     tooltip.append("p").append("b").attr("id", "cField");
     tooltip.append("p").attr("id", "densityField");
     // display the tooltip
     countyGroup.selectAll("path").on("mousemove", showTooltip);
     // show tooltip when on the county
     function showTooltip(d, i) {
       // draw the tooltip
       d3.select("#tooltip")
         .style("left", d3.event.pageX - 70 + "px")
         .style("top", d3.event.pageY - 105 + "px")
         .attr("class", "")
         .style("background-color", "grey")
         .style("border-color", "black")
         .style("color", "black");
       //Add the data
       d3.select("#cField").text(d.properties.CO_NAME);
       d3.select("#densityField").text("Density: " + d.properties.value+" people/km^2");
     };
     // hide the tooltip when the mouse leaves
     countyGroup.selectAll("path").on("mouseout", hideTooltip);

     colorToggle = true;
    
  } else {
      // draw the legend
      g.selectAll("rect")
      .data(color.range().map(function(d) {
          d = color.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return color(d[0]); });
    // draws the text on the legend
    g.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Population per square mile");
    // draws the ticks on the legend
    g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickValues(color.domain()))
      .select(".domain")
        .remove();
    // draws the county
    countyGroup.selectAll("path")
              .data(geoStates)
              .enter()
              .append("path")
              .attr("d", pathGenerator)
              .attr("fill", function(d){return color(d.properties.value);});
     // draws the tooltip
     tooltip = d3.select("body")
            .data(geoStates)
            .enter()
            .append("div")
            .attr("id", "tooltip")
            .attr("class", "hidden");
     tooltip.append("p").append("b").attr("id", "cField");
     tooltip.append("p").attr("id", "densityField");
     // display the tooltip
     countyGroup.selectAll("path").on("mousemove", showTooltip);
     // show tooltip when on the county
     function showTooltip(d, i) {
       // draw the tooltip
       d3.select("#tooltip")
         .style("left", d3.event.pageX - 70 + "px")
         .style("top", d3.event.pageY - 105 + "px")
         .attr("class", "")
         .style("background-color", "grey")
         .style("border-color", "black")
         .style("color", "black");
       //Add the data
       d3.select("#cField").text(d.properties.CO_NAME);
       d3.select("#densityField").text("Density: " + d.properties.value+" people/km^2");
     };
     // hide the tooltip when the mouse leaves
     countyGroup.selectAll("path").on("mouseout", hideTooltip);

  
    colorToggle = false;
  }
}

// the toggle boundary function to toggle between the stroke
function toggleBoundary(){
  if (toggle == false) {
    // remove boundary
    countyGroup.style("stroke-width", 0)
    toggle = true;
  } else {
    // draw boundary
    countyGroup.style("stroke-width", 1)
    toggle = false;
  }
    
}
