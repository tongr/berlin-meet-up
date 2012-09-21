function GoogleRouteFinder(gMapsMeetingMap) {
  this.meetingMap = gMapsMeetingMap;
  this.directions = new google.maps.DirectionsRenderer();
  this.directionsSource = new google.maps.DirectionsService();
  
  this.meetingMap.addRouteFinder(this.calcRoute.bind(this));
}

GoogleRouteFinder.prototype.calcRoute = function(from, to) {
  var con1, con2;
  this.findConnection(from, to, function(connection, response) {
    con1 = connection;
    if (con2) {
      this.findMeetingPoint(con1, con2);
    }
  }.bind(this), true);
  this.findConnection(to, from, function(connection) {
    con2 = connection;
    if (con1) {
      this.findMeetingPoint(con1, con2);
    }
  }.bind(this));
};


function GoogleWaypoint(elapsed_time, data) {
  this.elapsed_time = elapsed_time;
  this.pos = data.end_location;
  this.data = data;

  this.toString = data.toString;
}

GoogleWaypoint.prototype.htmlInfo = function() {
  if (this.elapsed_time == 0 ) {
    return '<b>start</b>';
  }
  if (!this.data.instructions) {
    return;
  }
  return '<b>' + this.data.duration.text + '</b>: ' + this.data.instructions;
};

GoogleWaypoint.prototype.getTimeDiff = function(otherWp) {
  return Math.abs(this.elapsed_time - otherWp.elapsed_time);
};

GoogleRouteFinder.prototype.findConnection = function(from, to, connectionCallback, showConnectionLine) {
  console.log(JSON.stringify(google.maps.TravelMode.BICYCLING));
  this.directionsSource.route({
    origin : from,
    destination : to,
    provideRouteAlternatives : false,
    travelMode : google.maps.TravelMode.WALKING
    // not yet working in germany
    //travelMode : google.maps.TravelMode.BICYCLING
    //travelMode : google.maps.TravelMode.TRANSIT 
  }, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      var elapsed_time = 0;
      var steps = response.routes[0].legs[0].steps;
      var waypoints = [];
      waypoints.push(new GoogleWaypoint(elapsed_time, {
        end_location : from
      }));
      for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        // interpolate time for the intermediate step
        var intermediateSteps = step.path;
        var interpolationTime = elapsed_time;
        var timeStepDuration = step.duration.value / (1 + intermediateSteps.length);

        for(j = 0; j<intermediateSteps.length;j++) {
          interpolationTime += timeStepDuration;
          waypoints.push(new GoogleWaypoint(interpolationTime, {
            end_location : intermediateSteps[j]
          }));
        }
        elapsed_time += step.duration.value;
        waypoints.push(new GoogleWaypoint(elapsed_time, step));
      }
      if(showConnectionLine) {
        // show connection line
        this.showConnectionLine(response);
      }
      connectionCallback(waypoints);
    }
  }.bind(this));
};

GoogleRouteFinder.prototype.findMeetingPoint = function(waypoints1, waypoints2) {
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
        best_match.index = i;
      }
    }
  }

  // show pois
  this.meetingMap.findPOIs(best_match.pos, ['bar', 'restaurant'], 'meet here');
  // show connection details
  this.printConnectionDetails(waypoints1, waypoints2, best_match.index, mappings[best_match.index]);
};

GoogleRouteFinder.prototype.getMapping = function(wps1, wps2) {
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

GoogleRouteFinder.prototype.showConnectionLine = function(response) {
  this.directions.setDirections(response);
  this.directions.setMap(this.meetingMap.map);
};

GoogleRouteFinder.prototype.printConnectionDetails = function(waypoints1, waypoints2, idx1, idx2) {
  // add debug output
  this.meetingMap.clearDetails();
  this.meetingMap.writeDetail('<h3>Route 1:</h3><ul>');

  for (var i = 0; i <= idx1; i++) {
    var info = waypoints1[i].htmlInfo();
    if(info) {
      this.meetingMap.writeDetail('<li>' + info + '</li>');
    }
  }
  this.meetingMap.writeDetail('</ul><h3>Route 2:</h3><ul>');
  for (var i = 0; i <= idx2; i++) {
    var info = waypoints2[i].htmlInfo();
    if(info) {
      this.meetingMap.writeDetail('<li>' + info + '</li>');
    }
  }
  this.meetingMap.writeDetail('</ul>');
};
