function BVGRouteFinder(meetingMap) {
  this.meetingMap = meetingMap;
  this.connection

  this.meetingMap.addRouteFinder(this.calcRoute.bind(this));
}

BVGRouteFinder.prototype.calcRoute = function(from, to, inverse) {
  var con1, con2;
  this.findConnection(from, to, function(connection) {
    con1 = connection;
    if (con2) {
      this.findMeetingPoint(con1, con2);
    }
  }.bind(this));
  this.findConnection(to, from, function(connection) {
    con2 = connection;
    if (con1) {
      this.findMeetingPoint(con1, con2);
    }
  }.bind(this));
};

BVGRouteFinder.prototype.findConnection = function(from, to, callback) {
  // create a yql query that parses the BVG page with the connection details
  var queryStr = 'select value from html where url="' + this.createBVGRequest(from, to) + '" and xpath="//input[@name=\'fitrack\']"';

  var baseUri = 'http://query.yahooapis.com/v1/public/yql?';
  var params = {
    q : queryStr,
    format : 'json'
  };
  var uri = baseUri + encodeMap(params);

  $.getJSON(uri, function(response) {
    if (!response.query.results) {
      alert("no connection found");
      return;
    }
    var data = response.query.results.input;

    // TODO process several possible connections
    if (Array.isArray(data)) {
      data = data[0];
    }

    callback(this.parseResult(data.value))
  }.bind(this));
};

BVGRouteFinder.prototype.createBVGRequest = function(pos1, pos2) {
  // create a BVG request that shows the connection between poth geo coordinates
  var x1 = coordToBVGInt(pos1.lng());
  var x2 = coordToBVGInt(pos2.lng());
  var y1 = coordToBVGInt(pos1.lat());
  var y2 = coordToBVGInt(pos2.lat());
  var baseUri = 'http://www.fahrinfo-berlin.de/Fahrinfo/bin/query.bin/dn?';
  var params = {
    REQ0HafasInitialSelection : 1,
    SID : 'A=16@X=' + x1 + '@Y=' + y1 + '@O=' + pos1.toString(),
    ZID : 'A=16@X=' + x2 + '@Y=' + y2 + '@O=' + pos2.toString(),
    // TODO specify date and time
    start : ''
  };
  return baseUri + encodeMap(params);
};

BVGRouteFinder.prototype.parseResult = function(blob) {
  if (!blob || blob == "") {
    console.log("no connection found");
    return [];
  }
  // split at star token
  //var stations = blob.split(/\*\d+\|/g);
  var stations = blob.split('*');

  var waypoints = [];
  for (var i = 1; i < stations.length; i++) {
    waypoints.push(new BVGWaypoint(stations[i]));
  }
  return waypoints;
};

BVGRouteFinder.prototype.findMeetingPoint = function(waypoints1, waypoints2) {
  var best_match = {
    time_diff : NaN
  };

  // compare all (equal) station pairs
  var mappings = this.getMapping(waypoints1, waypoints2);
  for (var i = 0; i < waypoints1.length; i++) {
    var j = mappings[i];
    if (j > 0) {
      var time_diff = waypoints1[i].getTimeDiff(waypoints2[j]);
      if (isNaN(best_match.time_diff) || time_diff < best_match.time_diff) {
        best_match.time_diff = time_diff;
        best_match.pos = waypoints1[i].pos;
        best_match.title = waypoints1[i].title;
        best_match.index = i;
      }
    }
  }
  // show pois
  this.meetingMap.findPOIs(best_match.pos, ['bar', 'restaurant'], best_match.title);
  // show connection line
  this.showConnectionLine(waypoints1, waypoints2, best_match.index, mappings[best_match.index]);
  // show connection details
  this.printConnectionDetails(waypoints1, waypoints2, best_match.index, mappings[best_match.index]);
};

BVGRouteFinder.prototype.getMapping = function(wps1, wps2) {
  var mapping = [];
  for (var i = 0; i < wps1.length; i++) {
    mapping.push(-1);
    for (var j = 0; j < wps2.length; j++) {
      if (wps1[i].pos.equals(wps2[j].pos)) {
        mapping[i] = j;
        break;
      }
    }
  }
  return mapping;
}

BVGRouteFinder.prototype.showConnectionLine = function(waypoints1, waypoints2, idx1, idx2) {
  var path = [];

  // calculate connection line path
  for (var i = 0; i < idx1; i++) {
    path.push(waypoints1[i].pos);
  }
  for (var i = idx2; i >= 0; i--) {
    path.push(waypoints2[i].pos);
  }

  // remove old conection
  if (this.connection) {
    this.connection.setMap(null);
  }

  this.connection = new google.maps.Polyline({
    clickable : false,
    path : path,
    strokeColor : "Red"
  });
  // add line to the map
  this.connection.setMap(this.meetingMap.map);
};

BVGRouteFinder.prototype.printConnectionDetails = function(waypoints1, waypoints2, idx1, idx2) {
  // add debug output
  this.meetingMap.clearDetails();
  this.meetingMap.writeDetail('<h3>Route 1:</h3><ul>');

  for (var i = 0; i <= idx1; i++) {
    this.meetingMap.writeDetail('<li>' + waypoints1[i].htmlInfo() + '</li>');
  }
  this.meetingMap.writeDetail('</ul><h3>Route 2:</h3><ul>');
  for (var i = 0; i <= idx2; i++) {
    this.meetingMap.writeDetail('<li>' + waypoints2[i].htmlInfo() + '</li>');
  }
  this.meetingMap.writeDetail('</ul>');
};

function encodeMap(map) {
  var list = [];
  for (var k in map) {
    if (map.hasOwnProperty(k)) {
      list.push(encodeURIComponent(k) + '=' + encodeURIComponent(map[k]));
    }
  }
  return list.join('&');
}

function bvgIntToCoord(val) {
  return val / 1000000;
}

function coordToBVGInt(val) {
  return Math.round(val * 1000000);
}

function BVGWaypoint(blob) {
  // blob: "1|STATION|s|S7|9100003|13412831|52521148|13:54|13:55|S+U Alexanderplatz Bhf (Berlin)"
  this.blob = blob;
  var data = blob.split('|');
  this.pos = new google.maps.LatLng(bvgIntToCoord(data[6]), bvgIntToCoord(data[5]));
  this.time = data[7];
  this.title = data[9];
  if (this.time == "") {
    this.time = data[8];
  }
  this.transport = data[3];
  if (this.transport == "") {
    this.transport = data[2];
  }
}

BVGWaypoint.prototype.toString = function() {
  return this.blob;
};
BVGWaypoint.prototype.htmlInfo = function() {
  return '<b>' + this.time + '</b>: ' + this.title + ' (' + this.transport + ')';
};

BVGWaypoint.prototype.getTimeDiff = function(otherWp) {
  return Math.abs(this.minutes() - otherWp.minutes());
};

BVGWaypoint.prototype.minutes = function() {
  var values = this.time.split(':');
  return values[0] * 60 + values[1];
};
