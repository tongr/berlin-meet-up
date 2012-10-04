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

function GoogleWaypoint(time, data) {
  this.init(time, data);
};

GoogleWaypoint.prototype = new Waypoint();
GoogleWaypoint.prototype.constructor = GoogleWaypoint;
GoogleWaypoint.parent = Waypoint.prototype;
// our "super" property

GoogleWaypoint.prototype.init = function(time, data) {
  GoogleWaypoint.parent.init.call(this, new Coordinates(data.end_location.lat(), data.end_location.lng()), time);
  this.data = data;
};

GoogleWaypoint.prototype.htmlInfo = function() {
  if ( this.data.isStart ) {
    return '<b>start</b>';
  }
  if (!this.data.instructions) {
    return;
  }
  return '<b>' + this.time + '</b>: ' + this.data.instructions;
};


GoogleRouteFinder.prototype.findConnection = function(from, to, connectionCallback, showConnectionLine) {
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
      var startTime = Time.now();
      var elapsedTime = new TimeSpan(0);
      var steps = response.routes[0].legs[0].steps;
      var waypoints = [];
      
      waypoints.push(new GoogleWaypoint(startTime, {
        end_location : from,
        isStart : true
      }));
      // TODO continue here
      for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        // interpolate time for the intermediate step
        var intermediateSteps = step.path;
        var interpolatedTime = elapsedTime.postpone(startTime);
        var timeStepDuration = TimeSpan.inMinutes(step.duration.value / (1 + intermediateSteps.length));

        for(j = 0; j<intermediateSteps.length;j++) {
          interpolatedTime = timeStepDuration.postpone(interpolatedTime);
          waypoints.push(new GoogleWaypoint(interpolatedTime, {
            end_location : intermediateSteps[j]
          }));
        }
        //elapsed_time += step.duration.value;
        //waypoints.push(new GoogleWaypoint(elapsed_time, step));
        // calculate end time w/o interpolation values (due to rounding errors)
	elapsedTime = elapsedTime.add(TimeSpan.inMinutes(step.duration.value));
        waypoints.push(new GoogleWaypoint(elapsedTime.postpone(startTime), step));
      }
      if (showConnectionLine) {
        // show connection line
        this.showConnectionLine(response);
      }
      connectionCallback(waypoints);
    }
  }.bind(this));
};

GoogleRouteFinder.prototype.findMeetingPoint = function(waypoints1, waypoints2) {
  var sortedMeetingPoints = findMeetingPoints(waypoints1, waypoints2);

  // TODO don't use just the best match but the topK or all within a given timespan
  var meetingCoords = sortedMeetingPoints[0].wp1.coords;// should be equal to: match.wp2.coords
  
  // TODO visualization of waypoints has to be synchronized with the matched waypoints (somehow)
  // show pois
  this.meetingMap.findPOIs(meetingCoords, ['bar', 'restaurant'], 'meet here');
  // show connection details
  this.printConnectionDetails(waypoints1, waypoints2, meetingCoords);
};

GoogleRouteFinder.prototype.showConnectionLine = function(response) {
  this.directions.setDirections(response);
  this.directions.setMap(this.meetingMap.map);
};

GoogleRouteFinder.prototype.printConnectionDetails = function(waypoints1, waypoints2, meetingCoords) {
  // add debug output
  this.meetingMap.clearDetails();
  this.meetingMap.writeDetail('<h3>Route 1:</h3><ul>');

  // TODO visualization of waypoints has to be synchronized with the matched waypoints (somehow)
  for (var i = 0; i < waypoints1.length; i++) {
    var info = waypoints1[i].htmlInfo();
    if(info)
      this.meetingMap.writeDetail('<li>' + info + '</li>');
    // stop at the meeting point
    if(meetingCoords.equals(waypoints1[i].coords)) {
      break;
    }
  }
  this.meetingMap.writeDetail('</ul><h3>Route 2:</h3><ul>');
  for (var i = 0; i < waypoints2.length; i++) {
    var info = waypoints2[i].htmlInfo();
    if(info)
      this.meetingMap.writeDetail('<li>' + info + '</li>');
    // stop at the meeting point
    if(meetingCoords.equals(waypoints2[i].coords)) {
      break;
    }
  }
  this.meetingMap.writeDetail('</ul>');
};
