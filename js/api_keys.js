// this file has to be renamed to api_keys.private.js
(function(window) {
  var APIKeys = this;
  // TODO please add your private API keys here
  this.Google = 'PLEASE ENTER THE GOOGLE API KEY HERE!';

  // Map over other "APIKeys" object
  _APIKeys = window.APIKeys;
  // expose the key store
  window.APIKeys = APIKeys;
})(window);
