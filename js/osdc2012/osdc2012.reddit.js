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
      ajax_pageComments = null,
      cache_user = {},
      ajax_user = null,
      regexps = [
        {
          // COMMENT PERMALINK:
          // Examples:
          //  - http://www.reddit.com/r/programming/comments/10b7xo/bug_ios6_safari_caches_post_requests/c6c1iti
          regex: /^https?:\/\/(?:[^\.\/]*\.)?reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?/,
          method: function(match) {
            if(!match)
              return false;
            else
              return {
                sub: match[1],
                postid: match[2],
                postlabel: match[3],
                commentid: match[4],
              };
          }
        },
        {
          // COMMENTS PERMALINK:
          // Examples:
          //  - http://www.reddit.com/r/programming/comments/10b7xo/bug_ios6_safari_caches_post_requests/
          regex: /^https?:\/\/(?:[^\.\/]*\.)?reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)\/([^\/]+)\/?$/,
          method: function(match) {
            if(!match)
              return false;
            else
              return {
                sub: match[1],
                postid: match[2],
                postlabel: match[3]
              };
          }
        },
        {
          // USER PERMALINK:
          // Examples:
          //  - http://www.reddit.com/user/Cataliades
          regex: /^https?:\/\/(?:www\.)?reddit\.com\/user\/([^\/]+)\/?/,
          method: function(match) {
            if(!match)
              return false;
            else
              return {
                userid: match[1]
              };
          }
        },
        {
          // DEFAULT:
          // Examples:
          //  - Cataliades
          //  - 10b7xo
          regex: /([^\/]+)/,
          method: function(match) {
            if(!match)
              return false;
            else
              return {
                userid: match[1],
                postid: match[1]
              };
          }
        }
      ];

  function getGraph(data) {
    var merge = true,
        displayCenter = true;

    var nodes = {},
        edges = {},
        maxRatio,
        minRatio,
        maxCounts = 0,
        minCounts = 0,
        maxNodeAppearance = 1,
        maxEdgeAppearance = 1,
        graph = {
          nodes: [],
          edges: []
        };

    function parseObject(o,rootNode){
      if(o.kind==='Listing')
        return ((o.data||{}).children||[]).map(function(o2){
          return parseObject(o2,rootNode);
        });

      if(
        //!o.kind==='t1' ||
        o.data===undefined ||
        o.data.author===undefined
      )
        return;

      // Node:
      var nodeId = merge ?
        'user_'+o.data.author :
        o.data.id+'|'+o.data.author;
      if(!nodes[nodeId]){
        nodes[nodeId] = {
          id: nodeId,
          label: o.data.author,
          color: '#333',
          x: Math.random(),
          y: Math.random(),
          ups: o.data.ups,
          downs: o.data.downs,
          appearances: 0
        };
        graph.nodes.push(nodes[nodeId]);
      }

      nodes[nodeId].ups +=+ o.data.ups;
      nodes[nodeId].downs +=+ o.data.downs;
      maxCounts = Math.max(maxCounts,nodes[nodeId].downs+nodes[nodeId].ups);
      minCounts = Math.min(minCounts,nodes[nodeId].downs+nodes[nodeId].ups);

      nodes[nodeId].appearances++;
      maxNodeAppearance = Math.max(maxNodeAppearance,nodes[nodeId].appearances);

      // Edge
      if(rootNode){
        var edgeId = rootNode<nodeId ?
          rootNode+'->'+nodeId :
          nodeId+'->'+rootNode;
        if(!edges[edgeId]){
          edges[edgeId] = {
            id: edgeId,
            source: rootNode,
            target: nodeId,
            size: o.data.downs,
            appearances: 0
          };
          graph.edges.push(edges[edgeId]);
        }

        edges[edgeId].appearances++;
        maxEdgeAppearance = Math.max(maxEdgeAppearance,edges[edgeId].appearances);
      }

      o.data.replies && parseObject(o.data.replies,nodeId);

      return nodes[nodeId];
    }

    // Start parsing data:
    var root = displayCenter ?
      (parseObject(data[0]) || [])[0] :
      {};
    parseObject(data[1],root.id);

    // Compute minRatio/maxRatio
    // (cannot be done in the main loop, since it must be based on the final
    // ratios of the nodes)
    graph.nodes.forEach(function(node){
      node.ratio = node.ups - node.downs;
      maxRatio = Math.max(
        maxRatio!==undefined ? maxRatio : Math.abs(node.ratio),
        Math.abs(node.ratio)
      );
    });
    minRatio = -maxRatio;

    // Adapt sizes / colors:
    graph.edges.forEach(function(edge){
      edge.size = edge.appearances;
      edge.color = osdc2012.color.interpolate(
        '#ddd',
        (edge.appearances-1) / ((maxEdgeAppearance-1) || 1),
        '#111'
      );
    });

    graph.nodes.forEach(function(node){
      node.size = node.appearances;

      var count = node.ups + node.downs;
      node.color = osdc2012.color.desaturate(
        osdc2012.color.interpolate(
          '#ec5757',
          (node.ratio - minRatio) / ((maxRatio - minRatio) || 1),
          '#81cf5a'
        ),
        (count - minCounts) / ((maxCounts - minCounts) || 1)
      );
    });

    return graph;
  }

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

  // Fallback if no connection:
  reddit.localPageComments = function(url) {
    var self = this;
    self.dispatch('startLoading');
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      success: function(data){
        self.dispatch('stopLoading');

        return self.dispatch('pageCommentsLoaded',{
          graph: getGraph(data)
        });
      },
      error: function(jqXHR, textStatus, errorThrown){
        ajax_pageComments = null;

        return self.dispatch('pageCommentsFailed',{
          jqXHR: jqXHR,
          textStatus: textStatus,
          errorThrown: errorThrown
        });
      }
    });
  }

  reddit.pageComments = function(entity, options) {
    var o = options || {},
        self = this,
        urlObj = this.parseEntity(entity);

    if(!urlObj || urlObj.postid===undefined)
      return self.dispatch('pageCommentsLoaded',{
        graph: {}
      });

    if(cache_pageComments[urlObj.postid]!==undefined)
      return self.dispatch('pageCommentsLoaded',{
        graph: cache_pageComments[urlObj.postid]
      });

    if(urlObj.postid!==undefined){
      self.dispatch('startLoading');
      ajax_pageComments && ajax_pageComments.abort();
      ajax_pageComments = $.ajax({
        url: 'http://www.reddit.com/comments/'+urlObj.postid+'.json?jsonp=?',
        type: 'GET',
        dataType: 'jsonp',
        success: function(data){
          cache_pageComments[urlObj.postid] = getGraph(data);

          ajax_pageComments = null;
          self.dispatch('stopLoading');

          return self.dispatch('pageCommentsLoaded',{
            graph: cache_pageComments[urlObj.postid]
          });
        },
        error: function(jqXHR, textStatus, errorThrown){
          ajax_pageComments = null;

          return self.dispatch('pageCommentsFailed',{
            jqXHR: jqXHR,
            textStatus: textStatus,
            errorThrown: errorThrown
          });
        }
      });
    }
  };

  reddit.user = function(entity, options) {
    var o = options || {},
        self = this,
        urlObj = this.parseEntity(entity);

    if(!urlObj || urlObj.userid===undefined)
      return self.dispatch('userLoaded',{
        graph: {}
      });

    if(cache_user[urlObj.userid]!==undefined)
      return self.dispatch('userLoaded',{
        graph: cache_user[urlObj.userid]
      });

    if(urlObj.userid!==undefined){
      ajax_user && ajax_user.abort();
      ajax_user = $.ajax({
        url: 'http://www.reddit.com/user/'+urlObj.userid+'/about.json?jsonp=?',
        type: 'GET',
        dataType: 'jsonp',
        success: function(data){
          cache_user[urlObj.userid] = data;

          ajax_user = null;
          self.dispatch('stopLoading');

          return self.dispatch('userLoaded',{
            user: cache_user[urlObj.userid]
          });
        },
        error: function(jqXHR, textStatus, errorThrown){
          ajax_user = null;

          return self.dispatch('userFailed',{
            jqXHR: jqXHR,
            textStatus: textStatus,
            errorThrown: errorThrown
          });
        }
      });
    }
  };
})();