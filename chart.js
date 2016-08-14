var width = 480,
    height = 480;

var locales = [{
  name: 'Mureybet',
  coordinates: [38.1287, 36.0434]
}, {
  name: 'Beidha',
  coordinates: [35.447756, 30.370780]
}, {
  name: 'Çatalhöyük',
  coordinates: [32.828056, 37.666667]
}, {
  name: 'Tell Brak',
  coordinates: [41.058644, 36.667617]
}];

var foo = [{
  "geometry": {
    "coordinates": [38.1287, 36.0434],
    "type": "Point"
  },
  "properties": {
    "name": "Mureybet"
  },
  "type": "Feature"
}];

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
    .pointRadius(20)
    .context(c);

var title = d3.select("h1");

queue()
    .defer(d3.json, "/data/world-110m.json")
    .defer(d3.tsv, "/data/world-country-names.tsv")
    .await(ready);

function ready(error, world, names) {
  if (error) throw error;

  var globe = {type: "Sphere"},
      land = topojson.feature(world, world.objects.land),
      countries = topojson.feature(world, world.objects.countries).features,
      borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }),
      i = -1,
      n = locales.length;

  countries = countries.filter(function(d) {
    return names.some(function(n) {
      if (d.id == n.id) return d.name = n.name;
    });
  }).sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  (function transition() {
    var activeLocale = locales[i = (i + 1) % n];

    console.log('AL: ', activeLocale);

    d3.transition()
        .duration(1250)
        .each("start", function() {
          title.text(activeLocale.name);
        })
        .tween("rotate", function() {
          var p = activeLocale.coordinates,
              r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);

          console.log(activeLocale.name + ': ', p);

          console.log('CI: ', countries[i]);

          return function(t) {
            projection.rotate(r(t));
            c.clearRect(0, 0, width, height);

            c.fillStyle = 'green';
            c.beginPath();
            c.arc(activeLocale.coordinates[0], activeLocale.coordinates[1], 25, 0, 2 * Math.PI, false);
            c.fill();
            c.lineWidth = 5;
            c.strokeStyle = '#003300';
            c.stroke();

            c.fillStyle = "#ccc", c.beginPath(), path(land), c.fill();
            c.fillStyle = "#f00", c.beginPath(), path(countries[i]), c.fill();
            c.strokeStyle = "#fff", c.lineWidth = .5, c.beginPath(), path(borders), c.stroke();
            c.strokeStyle = "#000", c.lineWidth = 2, c.beginPath(), path(globe), c.stroke();
          };
        })
      .transition()
        .each("end", transition);
  })();
}

d3.select(self.frameElement).style("height", height + "px");
