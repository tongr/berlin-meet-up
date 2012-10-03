var Time = {};

Time.get = function(h, min, s, forceAfter) {
  var newDate = new Date();
  newDate.setHours(h);
  newDate.setMinutes(min);
  if (s != undefined) {
    newDate.setSeconds(s);
  } else {
    newDate.setSeconds(0);
  }
  // ignore milliseconds
  newDate.setMilliseconds(0);

  // date switch
  if (forceAfter != undefined) {
    while (forceAfter.getTime() > newDate.getTime()) {
      // set date to the next day
      newDate.setTime(newDate.getTime() + 86400000);
    }
  }
  return newDate;
};


Time.now = function() {
  var newDate = new Date();
  
  // ignore milliseconds
  newDate.setMilliseconds(0);
  
  return newDate;
};

Time.toString = function(date) {
  var h = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();

  return (h < 10 ? "0" + h : h) + ":" + (min < 10 ? "0" + min : min) + (sec == 0 ? "" : ":" + (sec < 10 ? "0" + sec : sec));
};

Time.parse = function(timeStr, forceAfter) {
  var elements = timeStr.split(":");
  if (elements.length <= 1 || elements.length > 3) {
    throw "Unable to parse: " + timeStr;
  }
  if (elements.length == 2) {
    return Time.get(elements[0], elements[1], undefined, forceAfter);
  }
  if (elements.length == 3) {
    return Time.get(elements[0], elements[1], elements[2], forceAfter);
  }
};

function TimeSpan(secs) {
  this.elapsed = Math.abs(parseInt(secs));
};

TimeSpan.prototype.toString = function() {
  var h = parseInt(this.elapsed / 3600);
  var min = parseInt(this.elapsed / 60) % 60;
  var sec = this.elapsed % 60;

  var result = (h > 0 ? h + "h " : "") + (h + min > 0 ? min + "min " : "") + sec + "s";

  return result;
};

TimeSpan.prototype.compareTo = function(o) {
  return this.elapsed - o.elapsed;
};

TimeSpan.prototype.equals = function(o) {
  return this.elapsed === o.elapsed;
};

TimeSpan.prototype.postpone = function(time) {
  return new Date(time.getTime() + this.elapsed * 1000);
};

TimeSpan.prototype.prepone = function(time) {
  return new Date(time.getTime() - this.elapsed * 1000);
};

TimeSpan.prototype.add = function(o) {
  return new TimeSpan(this.elapsed + o.elapsed);
};

TimeSpan.prototype.diff = function(o) {
  return new TimeSpan(this.elapsed - o.elapsed);
};

TimeSpan.between = function(t1, t2) {
  return new TimeSpan((t1.getTime() - t2.getTime()) / 1000);
};

TimeSpan.inMinutes = function(minutes) {
  return new TimeSpan(minutes * 60);
};

TimeSpan.inHours = function(hours) {
  return new TimeSpan(hours * 3600);
};

function Coordinates(latitude, longitude) {
  this.latitude = latitude;
  this.longitude = longitude;
};

Coordinates.prototype.toString = function() {
  return "(" + this.latitude + ", " + this.longitude + ")";
};

Coordinates.prototype.equals = function(o) {
  return this.latitude === o.latitude && this.longitude === o.longitude;
};

function Waypoint(coords, time) {
  this.init(coords, time);
};

Waypoint.prototype.init = function(coords, time) {
  this.coords = coords;
  this.time = time;
};

Waypoint.prototype.toString = function() {
  return "Waypoint: " + Time.toString(this.time) + " @ " + this.coords.toString();
};

Waypoint.prototype.equals = function(o) {
  return this.time.getTime() === o.time.getTime() && this.coords.equals(o.coords);
};

// init meeting point finder

var getMapping = function(waypoints1, waypoints2) {
  var mapping = [];
  for (var i = 0; i < waypoints1.length; i++) {
    mapping.push(-1);
    for (var j = 0; j < waypoints2.length; j++) {
      // using aproximate equals in future versions?
      if (waypoints1[i].coords.equals(waypoints2[j].coords)) {
        mapping[i] = j;
        break;
      }
    }
  }
  return mapping;
};
// define meeting point finder algorithm
var findMeetingPoints = function(waypoints1, waypoints2) {
  // compare all equal (TODO similar) station pairs
  var mappings = getMapping(waypoints1, waypoints2);
  var matches = [];
  for (var i = 0; i < waypoints1.length; i++) {
    var j = mappings[i];
    if (j >= 0) {
      var diff = TimeSpan.between(waypoints1[i].time, waypoints2[j].time);
      matches.push({
        timeDiff : diff,
        wp1 : waypoints1[i],
        wp2 : waypoints2[j]
      });
    }
  }

  matches.sort(function(a, b) {
    return a.timeDiff.compareTo(b.timeDiff);
  });

  // return ranked matches
  return matches;
};

