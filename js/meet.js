function MeetingGMap(map_canvas, data_canvas) {
  // initialize map -> Berlin
  this.map = new google.maps.Map(document.getElementById(map_canvas), {
    center : new google.maps.LatLng(52.5191710, 13.40609120),
    zoom : 11,
    mapTypeId : google.maps.MapTypeId.ROADMAP
  });

  // init set of finite markers
  this.markers = [];
  this.placeMarker = function(event) {
    var location = event.latLng;
    var marker = new google.maps.Marker({
      position : location,
      draggable : true,
      animation : google.maps.Animation.DROP,
      map : this.map,

    });
    if (this.markers.length == 2) {
      // remove the oldest marker
      this.markers[0].setMap(null);
      this.markers.shift()
    }
    this.markers.push(marker);

    // if there are enough markers -> start routing functionality
    if (this.markers.length == 2) {
      this.calcRoute(this.markers[0].position, this.markers[1].position)
    }

    // execute "placeMarker" on drag-drop of an existing (bound) marker
    google.maps.event.addListener(marker, 'dragend', function() {
      if (this.markers.length == 2) {
        this.calcRoute(this.markers[0].position, this.markers[1].position)
      }
    }.bind(this));
  };
  // execute "placeMarker" on click
  google.maps.event.addListener(this.map, 'click', this.placeMarker.bind(this));

  // add calcRoute dummy (not yet implemented)
  this.calcRoute = function(m1, m2) {
    alert('no routing method defined!');
  }
}