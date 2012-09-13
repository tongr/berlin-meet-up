(function(window) {
  var APIKeys = this;
  this.Google = 'PLEASE ENTER THE GOOGLE API KEY HERE!';

  // Map over other "APIKeys" object
  _APIKeys = window.APIKeys;
  // expose the key store
  window.APIKeys = APIKeys;
})(window); 