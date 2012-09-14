// this is a meetin gmap implementation based on the google maps service
function GMapsMeetingMap(map_canvas, data_canvas) {
  var _this = this;

  // initialize map -> Berlin
  this.map = new google.maps.Map(document.getElementById(map_canvas), {
    center : new google.maps.LatLng(52.5191710, 13.40609120),
    zoom : 11,
    mapTypeId : google.maps.MapTypeId.ROADMAP
  });

  // init set of finite markers
  this.markers = [];

  this.placeMarker = function(location) {

    var marker = new google.maps.Marker({
      position : location,
      draggable : true,
      animation : google.maps.Animation.DROP,
      map : _this.map,

    });
    if (_this.markers.length == 2) {
      // remove the oldest marker
      _this.markers[0].setMap(null);
      _this.markers.shift()
    }
    _this.markers.push(marker);

    // if there are enough markers -> start routing functionality
    if (_this.markers.length == 2) {
      _this.calcRoute(_this.markers[0].position, _this.markers[1].position)
    }

    // execute "placeMarker" on drag-drop of an existing (bound) marker
    google.maps.event.addListener(marker, 'dragend', function() {
      if (_this.markers.length == 2) {
        _this.calcRoute(_this.markers[0].position, _this.markers[1].position)
      }
    });
  };
  // execute "placeMarker" on click
  google.maps.event.addListener(this.map, 'click', function(event) {
    _this.placeMarker(event.latLng);
  });

  // add calcRoute dummy (not yet implemented)
  this.calcRoute = function(m1, m2) {
    alert('no routing method defined!');
  }
}