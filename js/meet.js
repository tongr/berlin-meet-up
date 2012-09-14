// this is a meetin gmap implementation based on the google maps service
function GMapsMeetingMap(map_canvas, data_canvas) {
  // initialize map -> Berlin
  this.map = new google.maps.Map(document.getElementById(map_canvas), {
    center : new google.maps.LatLng(52.5191710, 13.40609120),
    zoom : 11,
    mapTypeId : google.maps.MapTypeId.ROADMAP
  });

  // init set of finite markers
  this.markers = [];

  // execute "placeMarker" on click
  google.maps.event.addListener(this.map, 'click', function(event) {
    this.placeMarker(event.latLng);
  }.bind(this));
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
