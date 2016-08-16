var width = 640,
    height = 640;

var zoom = d3.behavior.zoom()
    .size([width, height])
    .on("zoom", zoomed);

var projection = d3.geo.orthographic()
    .translate([width / 2, height / 2])
    .scale(width / 2 - 20)
    .clipAngle(90)
    .precision(0.6);

var canvas = d3.select("#chart").append("canvas")
    .attr("width", width)
    .attr("height", height);

var c = canvas.node().getContext("2d");

var path = d3.geo.path()
    .projection(projection)
    .context(c);

var simplify = d3.geo.transform({
  point: function(x, y, z) {
    if (z < visibleArea) return;
    x = x * scale + translate[0];
    y = y * scale + translate[1];
    if (x >= -10 && x <= width + 10 && y >= -10 && y <= height + 10 || z >= invisibleArea) this.stream.point(x, y);
  }
});

var yearLabel = d3.select("td.year");
var cityLabel = d3.select("td.city");
var populationLabel = d3.select("td.population");

queue()
    .defer(d3.json, "data/world-110m.json")
    .defer(d3.json, "data/biggest_cities.json")
    .await(ready);

function ready(error, world, cities) {
  if (error) throw error;

  var globe = {type: "Sphere"},
      land = topojson.feature(world, world.objects.land),
      countries = topojson.feature(world, world.objects.countries).features,
      borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }),
      i = -1,
      n = cities.length;

  (function transition() {
    var activeCity = cities[i = (i + 1) % n];

    d3.transition()
        .duration(1250)
        .each("start", function() {
          var population = Number(activeCity.properties.population).toLocaleString();

          cityLabel.text(activeCity.properties.name);
          populationLabel.text(population);
          yearLabel.text(activeCity.properties.year)
        })
        .tween("rotate", function() {
          var p = activeCity.geometry.coordinates,
              r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);

          return function(t) {
            projection.rotate(r(t));
            c.clearRect(0, 0, width, height);

            c.fillStyle = "#ccc", c.beginPath(), path(land), c.fill();
            c.strokeStyle = "#fff", c.lineWidth = .5, c.beginPath(), path(borders), c.stroke();
            c.strokeStyle = "#000", c.lineWidth = 2, c.beginPath(), path(globe), c.stroke();

            c.fillStyle = "#1485CC", c.beginPath(), path(activeCity), c.fill();
          };
        })
      .transition()
        .each("end", transition);
  })();
}

function zoomed(d) {

}

d3.select(self.frameElement).style("height", height + "px");
