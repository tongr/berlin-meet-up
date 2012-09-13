var Util = {
  now : function() {
    var t = new Date();
    return t.getHours() + ':' + t.getMinutes();
  },

  debug : function(str) {
    // debug mode off
  },

  encodeParameters : function(params) {
    var result = '';
    $.each(params, function(k, v) {
      result += encodeURIComponent(k) + '=' + encodeURIComponent(v) + '&';
    });
    return result;
  }
}

var YQL = {
  createRequest : function(queryStr) {
    var baseUri = 'http://query.yahooapis.com/v1/public/yql?';
    var params = {
      q : queryStr,
      format : 'json'
    };
    var uri = baseUri + Util.encodeParameters(params);

    Util.debug('yql request created:');
    Util.debug( uri );

    return uri;
  },

  createParseRequest : function(projection, sourceUrl, xpath) {
    var queryStr = 'select ' + projection.join() + ' from html where url="' + sourceUrl + '"';
    if(xpath!=null) {
      queryStr += ' and xpath=\'' + xpath + '\'';
    }
    return this.createRequest(queryStr);
  }
};

var fahrinfo = {
  createRequest : function(pos1, pos2) {
    var baseUri = 'http://www.fahrinfo-berlin.de/Fahrinfo/bin/?';
    var params = { 
        from : pos1,
        to : pos2,
        start : 'yes',
      };
    return baseUri + Util.encodeParameters(params);
  },

  projection : ['span.id', 'span.content', 'select.id', 'select.option.content', 'href'],

  xpath : '//div[@class="ivuFormField"] | //a[@title="Zwischenhalte einblenden"]',

  query : function(pos1, pos2, successCallback, ambiguationCallback) {
    $.getJSON(
      YQL.createParseRequest(
        fahrinfo.projection, 
        fahrinfo.createRequest(pos1, pos2), 
        fahrinfo.xpath), 
      function(response) {
        var data = response['query']['results'];

        // query is not ambiguous
        if(data['a']!=null) {
          var uris = [];
          if($.isArray(data['a'])) {
            $.each(data['a'], function() {
              uris.push('http://www.fahrinfo-berlin.de' + this['href']);
            });
          } else {
            uris.push('http://www.fahrinfo-berlin.de' + data['a']['href']);
          }
          // return the found detail uris
          successCallback(uris);
        } else if(data['div']!=null && $.isArray(data['div'])) {
        // query is ambiguous
          var options = { from : [], to : [] };
          $.each(data['div'], function() {
            $.each(this, function(k, v) {
              // parse the alternatives for a position
              fahrinfo.parsePositionAlternatives(v, options);
            });
          });

          // return the alternative positions
          ambiguationCallback( options.from, options.to );
        } else {
          alert('Unknown data element: ' + JSON.stringify(data));
        }
      }
    );
  },

  parsePositionAlternatives : function(dataElement, options) {
    var arr;
    if(dataElement['id']=='from') {
      arr = options['from'];
    } else if(dataElement['id']=='to') {
      arr = options['to'];
    }
         
    var item;
    if(dataElement['content']!=null) {
      item = dataElement['content'];
    } else if(dataElement['option']!=null) {
      item = dataElement['option'];
    }
     
    if(arr!=null && item!=null) {
      arr.push(item);
    } else {
      alert('Illegal data element: ' + JSON.stringify(data));
    }
  }  
};