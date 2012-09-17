// this is a meetin gmap implementation based on the google maps service
function GMapsMeetingMap(map_canvas, data_canvas) {
  // initialize map -> Berlin
  this.map = new google.maps.Map(document.getElementById(map_canvas), {
    center : new google.maps.LatLng(52.5191710, 13.40609120),
    zoom : 11,
    mapTypeId : google.maps.MapTypeId.ROADMAP
  });
  this.places = new google.maps.places.PlacesService(this.map);
  this.infowindow = new google.maps.InfoWindow();

  // sesrch for data canvas
  this.data_canvas_div = document.getElementById(data_canvas);

  // init set of finite markers
  this.markers = [];

  // init set of POIs
  this.pois = [];

  // execute "placeMarker" on click
  google.maps.event.addListener(this.map, 'click', function(event) {
    this.placeMarker(event.latLng);
  }.bind(this));

  // set the meeting point to undefined
  this.meetingPoint
}

// create a method to place markers on the map
GMapsMeetingMap.prototype.placeMarker = function(location) {
  var marker = new google.maps.Marker({
    position : location,
    draggable : true,
    animation : google.maps.Animation.DROP,
    map : this.map,

  });

  // allow only two markers on the map
  if (this.markers.length == 2) {
    // remove the oldest marker
    this.markers[0].setMap(null);
    this.markers.shift()
  }
  this.markers.push(marker);

  // if there are enough markers -> start routing functionality
  if (this.markers.length == 2) {
    this.findRoutes(this.markers[0].position, this.markers[1].position)
  }

  // execute "placeMarker" on drag-drop of an existing (bound) marker
  google.maps.event.addListener(marker, 'dragend', function() {
    if (this.markers.length == 2) {
      this.findRoutes(this.markers[0].position, this.markers[1].position)
    }
  }.bind(this));
};

// add a new route finder method to the map
GMapsMeetingMap.prototype.addRouteFinder = function(listener) {
  google.maps.event.addListener(this, 'find_route', listener);
};

// emit all added calc route methods
GMapsMeetingMap.prototype.findRoutes = function(pos1, pos2) {
  google.maps.event.trigger(this, 'find_route', pos1, pos2);
};

GMapsMeetingMap.prototype.clearDetails = function() {
  while (this.data_canvas_div.firstChild)
  this.data_canvas_div.removeChild(this.data_canvas_div.firstChild);
};

GMapsMeetingMap.prototype.writeDetail = function(data) {
  this.data_canvas_div.innerHTML += data;
};

GMapsMeetingMap.prototype.findPOIs = function(position, categories, title) {
  if (this.meetingPoint != undefined) {
    // remove the old marker
    this.meetingPoint.setMap(null);
  }
  // place a meeting point marker
  this.meetingPoint = new google.maps.Marker({
    position : position,
    map : this.map,
    title : title
  });

  // remove former POIs
  if (this.pois != undefined) {
    while (this.pois.length > 0) {
      this.pois.pop().setMap(null);
    }
  }

  // find new pois
  if (categories == undefined || categories.length == 0) {
    categories = ['restaurant']
  }
  var request = {
    location : position,
    radius : '300',
    types : categories
  };
  // create a GMaps places API request (for POIs)
  this.places.search(request, function(results, status) {
    // add all POIs to the map
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        this.addPOI(results[i]);
      }
    }
  }.bind(this));
};

GMapsMeetingMap.prototype.addPOI = function(place) {
  // create a custom Marker (with a special icon)
  var marker = new google.maps.Marker({
    map : this.map,
    icon : new google.maps.MarkerImage(place.icon, null, null, null, new google.maps.Size(20, 20)),
    position : place.geometry.location
  });

  // add the marker
  this.pois.push(marker);

  // show an info window to the marker (at onClick event)
  google.maps.event.addListener(marker, 'click', function() {
    // load further details from GMaps places API
    this.places.getDetails(place, function(place_details, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        var content = '<span style="padding: 0px; text-align:left" align="left"><h5><a  target="_blank" href=' + place_details.url + '>' + place_details.name + '</a>&nbsp; &nbsp; ' + place_details.rating + '</h5><p>' + place_details.formatted_address + '<br />' + place_details.formatted_phone_number + '<br />' + '<a  target="_blank" href=' + place_details.website + '>' + place_details.website + '</a></p>';
        content = content.replace(/undefined/g, ' ');
        this.infowindow.setContent(content);
        this.infowindow.open(this.map, marker);
      }
    }.bind(this));
  }.bind(this));
};
