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
  var x1 = BVGWaypoint.coordToInt(pos1.lng());
  var x2 = BVGWaypoint.coordToInt(pos2.lng());
  var y1 = BVGWaypoint.coordToInt(pos1.lat());
  var y2 = BVGWaypoint.coordToInt(pos2.lat());
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
  var sortedMatches = findMeetingPoints(waypoints1, waypoints2);
  
  // TODO don't use just the best match but the topK or all within a given timespan
  var meetingCoords = sortedMatches[0].wp1.coords;// should be equal to: match.wp2.coords
  
  // show pois
  this.meetingMap.findPOIs(meetingCoords, ['bar', 'restaurant'], sortedMatches[0].wp1.title);
  
  // TODO visualization of waypoints has to be synchronized with the matched waypoints (somehow)
  // show connection line
  this.showConnectionLine(waypoints1, waypoints2, meetingCoords);
  // show connection details
  this.printConnectionDetails(waypoints1, waypoints2, meetingCoords);
};

BVGRouteFinder.prototype.showConnectionLine = function(waypoints1, waypoints2, meetingCoords) {
  var path = [];

  // TODO fix: Google maps specific
  // calculate connection line path
  for (var i = 0; i < waypoints1.length; i++) {
    path.push(new google.maps.LatLng(waypoints1[i].coords.latitude, waypoints1[i].coords.longitude));
    if(meetingCoords.equals(waypoints1[i].coords)) {
      break;
    }
  }
  var i = 0;
  for (; i < waypoints2.length; i++) {
    if(meetingCoords.equals(waypoints2[i].coords)) {
      break;
    }
  }
  i++;
  for (; i >= 0; i--) {
    path.push(new google.maps.LatLng(waypoints2[i].coords.latitude, waypoints2[i].coords.longitude));
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

BVGRouteFinder.prototype.printConnectionDetails = function(waypoints1, waypoints2, meetingCoords) {
  // add debug output
  this.meetingMap.clearDetails();
  this.meetingMap.writeDetail('<h3>Route 1:</h3><ul>');

  for (var i = 0; i < waypoints1.length; i++) {
    this.meetingMap.writeDetail('<li>' + waypoints1[i].htmlInfo() + '</li>');
    // stop at the meeting point
    if(meetingCoords.equals(waypoints1[i].coords)) {
      break;
    }
  }
  
  this.meetingMap.writeDetail('</ul><h3>Route 2:</h3><ul>');
  for (var i = 0; i < waypoints2.length; i++) {
    this.meetingMap.writeDetail('<li>' + waypoints2[i].htmlInfo() + '</li>');
    // stop at the meeting point
    if(meetingCoords.equals(waypoints2[i].coords)) {
      break;
    }
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

function BVGWaypoint(blob) {
  this.init(blob);
}

BVGWaypoint.intToCoord = function(val) {
  return val / 1000000;
}

BVGWaypoint.coordToInt = function(val) {
  return Math.round(val * 1000000);
}


BVGWaypoint.prototype = new Waypoint();
BVGWaypoint.prototype.constructor = BVGWaypoint;
BVGWaypoint.parent = Waypoint.prototype;
// our "super" property

BVGWaypoint.prototype.init = function(blob) {
  // blob: "1|STATION|s|S7|9100003|13412831|52521148|13:54|13:55|S+U Alexanderplatz Bhf (Berlin)"
  this.blob = blob;
  var data = blob.split('|');
  this.title = data[9];
  var time = data[7];
  if (time == "") {
    time = data[8];
  }
  BVGWaypoint.parent.init.call(this, new Coordinates(BVGWaypoint.intToCoord(data[6]), BVGWaypoint.intToCoord(data[5])), Time.parse(time));
  this.transport = data[3];
  if (this.transport == "") {
    this.transport = data[2];
  }
};


BVGWaypoint.prototype.htmlInfo = function() {
  return '<b>' + this.time + '</b>: ' + this.title + ' (' + this.transport + ')';
};

