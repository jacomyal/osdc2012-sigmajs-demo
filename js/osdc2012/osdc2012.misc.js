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
   * -> osdc2012.permalink
   * A tool to manage the permalink
   */
  var shortcuts = {
        uid: 'userid',
        u: 'userlabel',
        pid: 'pageid',
        p: 'pagelabel',
        url: 'entity',
        m: 'mode'
      },
      reversedShortcuts = {};

  for(var k in shortcuts)
    reversedShortcuts[shortcuts[k]] = k;

  osdc2012.permalink = new sigma.classes.EventDispatcher();
  osdc2012.permalink.init = function() {
    var self = this;
    if('onhashchange' in window){ // If the event is supported:
      window.onhashchange = function() {
        var o = self.get();
        for(var k in o)
          shortcuts[k] ?
            (osdc2012.properties[shortcuts[k]] = o[k]) :
            (osdc2012.properties[k] = o[k]);

        self.dispatchEvent('hashChange',{
          values: osdc2012.properties
        });
      };
    }else{                        // If the event is not supported:
      var storedHash = window.location.hash;
      window.setInterval(function() {
        if(window.location.hash !== storedHash){
          storedHash = window.location.hash;
          var o = self.get();
          for(var k in o)
            shortcuts[k] ?
              (osdc2012.properties[shortcuts[k]] = o[k]) :
              (osdc2012.properties[k] = o[k]);

          self.dispatchEvent('hashChange',{
            values: osdc2012.properties
          });
        }
      },100);
    }
  };

  osdc2012.permalink.get = function() {
    var a = (window.location.hash||'').split(/[?&#]/).filter(function(s){
      return !!s;
    }).map(function(s){
      var o = {},
          a = s.split('=');

      o[a[0]] = a[1];
      return o;
    });
  };

  osdc2012.permalink.update = function() {
    var a = (window.location.hash||'').split(/[?&#]/).filter(function(s){
      return !!s;
    }).map(function(s){
      var o = {},
          a = s.split('=');

      o[a[0]] = a[1];
      return o;
    });
  };

  /**
   * -> osdc2012.color
   * Methods to manipulate colors
   */
  osdc2012.color = {
    hex2rgb: function(hex){
      if(hex.substr(0,2)=='0x') hex = hex.substr(2);
      if(hex.substr(0,1)=='#') hex = hex.substr(1);
      
      var isShort = hex.length==3;
      
      var r = isShort ? hex.substr(0,1)+hex.substr(0,1) : hex.substr(0,2);
      var g = isShort ? hex.substr(1,1)+hex.substr(1,1) : hex.substr(2,2);
      var b = isShort ? hex.substr(2,1)+hex.substr(2,1) : hex.substr(4,2);
      
      return { 'r': parseInt(r,16), 'g':parseInt(g,16), 'b':parseInt(b,16) };
    },
    interpolateRGB: function(c1,percent,c2){
      return {
        'r':(c2.r*percent+c1.r*(1-percent)),
        'g':(c2.g*percent+c1.g*(1-percent)),
        'b':(c2.b*percent+c1.b*(1-percent))
      };
    },
    darken: function(c1,percent){
      return {
        'r':(c2.r*percent+c1.r*(1-percent)),
        'g':(c2.g*percent+c1.g*(1-percent)),
        'b':(c2.b*percent+c1.b*(1-percent))
      };
    },
    desaturateRGB: function(c1,percent){
      var m = (c1.r+c1.g+c1.b)/3;
      return {
        'r':(m*percent+c1.r*(1-percent)),
        'g':(m*percent+c1.g*(1-percent)),
        'b':(m*percent+c1.b*(1-percent))
      };
    },
    componentToHex: function(c){
      var hex = Math.round(c).toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    },
    printHex: function(c){
      return(
        "#" +
        osdc2012.color.componentToHex(c.r) +
        osdc2012.color.componentToHex(c.g) +
        osdc2012.color.componentToHex(c.b)
      );
    },
    printRGB: function(c){
      return('rgb('+Math.round(c.r)+','+Math.round(c.g)+','+Math.round(c.b)+')');
    },
    interpolate: function(h1,percent,h2){
      return osdc2012.color.printHex(
        osdc2012.color.interpolateRGB(
          osdc2012.color.hex2rgb(h1),
          percent,
          osdc2012.color.hex2rgb(h2)
        )
      );
    },
    desaturate: function(h1,percent){
      return osdc2012.color.printHex(
        osdc2012.color.desaturateRGB(
          osdc2012.color.hex2rgb(h1),
          percent
        )
      );
    }
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
          sigInst = this.getInstance(sig),
          res = {
            nodes: [],
            edges: []
          };

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

        res.edges.push(edge);
        for(k in edge)
          if(edge[k] === undefined)
            delete edge[k];
      });

      return res;
    },
    set: function(graph, sig, options) {
      var node,
          edges,
          sigInst = this.getInstance(sig),
          res = {
            nodes: [],
            edges: []
          };

      // Empty existing graph
      sigInst.emptyGraph();

      (graph.nodes||[]).forEach(function(n){
        sigInst.addNode(n.id,n);
      });

      (graph.edges||[]).forEach(function(e){
        sigInst.addEdge(e.id,e.source,e.target,e);
      });

      return sigInst;
    },
    zoomTo: function(v, sig, options) {
      var sigInst = this.getInstance(sig),
          node;

      if (typeof v === 'string') {
        v = v;
      } else if (typeof v === 'object') {
        v = v.label||'';
      }

      // This might be easier to do if the labels are uniques
      // (then I can use labels as IDs, and directly give the
      // label to search):
      sigInst.iterNodes(function(n) {
        if (n.label == v) {
          node = n;
          n.active = true;
        }
      });

      // HACK:
      // I have a bug on the zoomTo when the ratio is the same than
      // the actual one:
      var pos0 = sigInst.position();
      node && sigInst.position(pos0.stageX, pos0.stageY, pos0.ratio * 0.9999);

      node && sigInst.zoomTo(
        node.displayX,
        node.displayY,
        sigInst.mouseProperties('maxRatio')
      );

      return node;
    },
    getInstance: function(sig) {
      var sigInst;

      (sig === undefined) &&
        (sigInst = sigma.instances[1]);

      (sig !== undefined) && (typeof sig === 'object') &&
        (sigInst = sig);

      (typeof sig === 'string') || (typeof sig === 'string') &&
        (sigInst = sigma.instances[1]);

      return sigInst;
    }
  };
})();