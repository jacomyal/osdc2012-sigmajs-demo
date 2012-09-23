/**
 * Copyright © Alexis Jacomy, 2012
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * The Software is provided "as is", without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and noninfringement. In no event shall the
 * authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising
 * from, out of or in connection with the software or the use or other dealings
 * in the Software.
 */

(function() {
  'use strict';

  window.reddit = new sigma.classes.EventDispatcher();
  var cache_pageComments = {},
      cache_userComments = {},
      regexps = [
    {
      // COMMENT PERMALINK:
      // Examples:
      //  - http://www.reddit.com/r/programming/comments/10b7xo/bug_ios6_safari_caches_post_requests/c6c1iti
      regex: /^https?:\/\/(?:www\.)?reddit\.com\/r\/([^\/]*)\/comments\/([^\/]*)\/([^\/]*)\/([^\/]*)\/?/,
      method: function(match) {
        if(!match)
          return false;
        else
          return {
            topic: match[1],
            postid: match[2],
            postlabel: match[3],
            commentid: match[4],
          };
      }
    }
    {
      // COMMENTS PERMALINK:
      // Examples:
      //  - http://www.reddit.com/r/programming/comments/10b7xo/bug_ios6_safari_caches_post_requests/
      regex: /^https?:\/\/(?:www\.)?reddit\.com\/r\/([^\/]*)\/comments\/([^\/]*)\/([^\/]*)\/?$/,
      method: function(match) {
        if(!match)
          return false;
        else
          return {
            topic: match[1],
            postid: match[2],
            postlabel: match[3]
          };
      }
    }
  ];

  reddit.parseEntity = function(entity) {
    if(!entity)
      return {};

    entity = entity.toString();
    for (var i in regexps) {
      var o = regexps[i].method(entity.match(regexps[i].regex));
      if(o)
        return o;
    }

    return {};
  };

  reddit.pageComments = function(entity, options) {
    var o = options || {},
        self = this,
        urlObj = this.parseEntity(entity);

    if(!urlObj || urlObj.postid===undefined)
      self.dispatch('pageCommentsLoaded',{
        received: {}
      });

    if(cache_pageComments[urlObj.postid]!==undefined)
      self.dispatch('pageCommentsLoaded',{
        received: cache_pageComments[urlObj.postid]
      });

    (urlObj.postid!==undefined) &&
      $.ajax({
        url: 'http://www.reddit.com/r/programming/comments/'+urlObj.postid+'.json?jsonp=?',
        type: 'GET',
        dataType: 'jsonp',
        success: function(data){
          cache_pageComments[urlObj.postid] = data;
          self.dispatch('pageCommentsLoaded',{
            received: data
          });
        },
        error: function(jqXHR, textStatus, errorThrown){
          self.dispatch('commentsFailed',{
            jqXHR: jqXHR,
            textStatus: textStatus,
            errorThrown: errorThrown
          });
        }
      });
  };
})();