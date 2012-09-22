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
  window.osdc2012 = window.osdc2012 || {};

  /**
   * -> osdc2012.properties
   * Managing the global properties
   */
  osdc2012.properties = {
    // Mode: 'users', 'articles', 'users|articles'
    mode: 'users'
  };

  /**
   * -> osdc2012.location
   * A tool to manage the permalink
   */
  function onHashChange() {

  }

  osdc2012.permalink = new sigma.classes.EventDispatcher();
  osdc2012.permalink.init = function() {
    var self = this;
    if('onhashchange' in window){ // If the event is supported:
      window.onhashchange = function() {
        self.dispatchEvent('hashChange',{
          values: self.get()
        });
      };
    }else{                        // If the event is not supported:
      var storedHash = window.location.hash;
      window.setInterval(function() {
        if(window.location.hash !== storedHash){
          storedHash = window.location.hash;
          self.dispatchEvent('hashChange',{
            values: self.get()
          });
        }
      },100);
    }
  };

  osdc2012.permalink.get = function() {
    var a = (window.location.hash||'').split(/[?&#]/).filter(function(s){
      return !!s;
    });
  };

  /**
   * -> osdc2012.graph
   * Methods to manage the graph
   */
  osdc2012.graph = {
    dump: function(sig) {
      var k,
          node,
          edge,
          sigInst,
          res = {
            nodes: [],
            edges: []
          };

      (sig === undefined) &&
        (sigInst = sigma.instances[1]);

      (sig !== undefined) && (typeof sig === 'object') &&
        (sigInst = sig);

      (typeof sig === 'string') || (typeof sig === 'string') &&
        (sigInst = sigma.instances[1]);

      // Get nodes:
      sigInst.iterNodes(function(n) {
        node = {
          id: n.id,
          label: n.label,
          size: n.size,
          color: n.color,
          x: n.x,
          y: n.y,
          attr: n.attr
        };

        res.nodes.push(node);
        for(k in node)
          if(node[k] === undefined)
            delete node[k];
      });

      // Get edges:
      sigInst.iterEdges(function(e) {
        edge = {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          size: e.size,
          color: e.color,
          weight: e.weight,
          attr: e.attr
        };

        res.edges.push(node);
        for(k in edge)
          if(edge[k] === undefined)
            delete edge[k];
      });

      return res;
    },
    set: function(graph, sig, options) {
      var 
          node,
          edges,
          sigInst,
          res = {
            nodes: [],
            edges: []
          };

    }
  };
})();