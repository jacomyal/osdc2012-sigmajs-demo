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

  $(document).ready(function() {
    var labels = [],
        colors = [
          '#FFC54B',
          '#89A846',
          '#4E8565',
          '#465F61',
          '#443D4A'
        ];

    // Instanciate sigma.js:
    var s1 = sigma.init($('.sigma-container')[0]).drawingProperties({
      defaultEdgeType: 'line',
      font: 'Maven Pro',
      defaultLabelSize: 14,
      defaultLabelActiveColor: '#2c4762'
    }).graphProperties({
      scalingMode: 'inside',
      minNodeSize: 1,
      maxNodeSize: 10,
      minEdgeSize: 0.5,
      maxEdgeSize: 5
    });

    // Tweak:
    // Give focus to sigma-container when sigma is clicked:
    $('#sigma_mouse_1').click(function(){
      $('.sigma-container').focus();
    });

    // // Generate random graph:
    // var i, N = 400, E = 1500;

    // for (i = 0; i < N; i++) {
    //   var r = Math.random(),
    //       t = Math.random() * Math.PI * 2;
    //   s1.addNode(i, {
    //     'label': 'Node ' + i,
    //     'x': Math.cos(t) * r,
    //     'y': Math.sin(t) * r,
    //     'size': 0.5 + 5 * Math.random(),
    //     'color': colors[(Math.random() * 5) | 0]
    //   });

    //   labels.push('Node ' + i);
    // }

    // for (i = 0; i < E; i++) {
    //   s1.addEdge(i, Math.random() * N | 0, Math.random() * N | 0);
    // }

    s1.draw();

    reddit.bind('pageCommentsLoaded',function(event){
      var merge = true,
          displayCenter = true;

      var nodes = {},
          edges = {},
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
            size: o.data.downs,
            appearances: 0
          };
          graph.nodes.push(nodes[nodeId]);
        }

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
        (parseObject(event.content.comments[0]) || [])[0] :
        {};
      parseObject(event.content.comments[1],root.id);

      // Adapt sizes / colors:
      graph.edges.forEach(function(edge){
        edge.size = edge.appearances;
        edge.color = osdc2012.color.newHex(
          '#ddd',
          (edge.appearances-1) / ((maxEdgeAppearance-1) || 1),
          '#111'
        );
      });

      graph.nodes.forEach(function(node){
        node.size = node.appearances;
        node.color = osdc2012.color.newHex(
          '#ddd',
          (node.appearances-1) / ((maxNodeAppearance-1) || 1),
          '#111'
        );
      });
      
      osdc2012.graph.set(graph,s1);
      s1.startForceAtlas2();

      $('div.nodes').text(s1.getNodesCount() + ' nodes');
      $('div.edges').text(s1.getEdgesCount() + ' edges');

      $('#search-nodes-fieldset > div').remove();
      $('<div>' +
          '<label for="search-nodes">Search a user...</label>' +
          '<input type="text" autocomplete="off" id="search-nodes"/>' +
        '</div>').appendTo('#search-nodes-fieldset');

      $('#search-nodes-fieldset #search-nodes').smartAutoComplete({
        source: graph.nodes.map(function(n){
          return n.label;
        })
      }).bind('itemSelect', function(e) {
        var label = e.smartAutocompleteData.item.innerText;
        onAction();

        var node = osdc2012.graph.zoomTo(label);
        node && loadTwitterUser(node);
      });

      $('.refresh-icon').click();
    }).bind('pageCommentsError',function(event){
      // TODO
      console.log('failed');
    });

    //reddit.pageComments('http://www.reddit.com/r/programming/comments/10b7xo/bug_ios6_safari_caches_post_requests/c6c1iti')
    //reddit.userSubmitted('http://www.reddit.com/user/Cataliades/submitted.json');
    
    $('form[name="post-url-form"]').submit(function(e){
      reddit.pageComments($(this).find('input[type="text"]').attr('value'));

      e.stopPropagation();
      e.preventDefault();
      return false;
    });

    $('.contains-icon').mouseover(function() {
      $(this).find('.icon-button').addClass('icon-white');
    }).mouseout(function() {
      $(this).find('.icon-button').removeClass('icon-white');
    });






    /**
     * NAVIGATION:
     */
    var moveDelay = 80,
        zoomDelay = 2;

    $('.move-icon').bind('click keypress',function(event) {
      var newPos = s1.position();
      switch ($(this).attr('action')) {
        case 'up':
          newPos.stageY += moveDelay;
          break;
        case 'down':
          newPos.stageY -= moveDelay;
          break;
        case 'left':
          newPos.stageX += moveDelay;
          break;
        case 'right':
          newPos.stageX -= moveDelay;
          break;
      }

      s1.goTo(newPos.stageX, newPos.stageY);

      event.stopPropagation();
      return false;
    });

    $('.zoom-icon').bind('click keypress',function(event) {
      var ratio = s1.position().ratio;
      switch ($(this).attr('action')) {
        case 'in':
          ratio *= zoomDelay;
          break;
        case 'out':
          ratio /= zoomDelay;
          break;
      }

      s1.goTo(
        $('.sigma-container').width() / 2,
        $('.sigma-container').height() / 2,
        ratio
      );

      event.stopPropagation();
      return false;
    });

    $('.refresh-icon').bind('click keypress',function(event) {
      s1.position(0, 0, 1).draw();

      event.stopPropagation();
      return false;
    });

    $('.sigma-container').keydown(function(e) {
      var newPos = s1.position();
      newPos.ratio = undefined;

      switch (e.keyCode) {
        case 38:
        case 75:
          newPos.stageY += moveDelay;
          break;
        case 40:
        case 74:
          newPos.stageY -= moveDelay;
          break;
        case 37:
        case 72:
          newPos.stageX += moveDelay;
          break;
        case 39:
        case 76:
          newPos.stageX -= moveDelay;
          break;
        case 107:
          newPos.ratio = s1.position().ratio * zoomDelay;
          newPos.stageX = $('.sigma-container').width() / 2;
          newPos.stageY = $('.sigma-container').height() / 2;
          break;
        case 109:
          newPos.ratio = s1.position().ratio / zoomDelay;
          newPos.stageX = $('.sigma-container').width() / 2;
          newPos.stageY = $('.sigma-container').height() / 2;
          break;
      }

      s1.goTo(newPos.stageX, newPos.stageY, newPos.ratio);
    });







    function onAction() {
      // Stop FA2:
      s1.stopForceAtlas2();
      // Make all nodes unactive:
      s1.iterNodes(function(n) {
        n.active = false;
      });
    }

    // Autocompleted search field:
    $('form.search-nodes-form').submit(function(e) {
      onAction();
      e.preventDefault();
    });

    // Node information:
    var usersCache = {};
    function loadTwitterUser(node) {
      hideTwitterUser();
      var screenName = node['id'];

      if (usersCache[screenName]) {
        showTwitterUser(usersCache[screenName]);
      }else {
        $.ajax({
          url: 'https://api.twitter.com/1/users/show.json',
          data: { screen_name: screenName },
          dataType: 'jsonp',
          type: 'GET',
          success: function(data) {
            data['score'] = node['attr']['score'];
            usersCache[screenName] = data;
            showTwitterUser(data);
          },
          error: function() {
            // TODO
          }
        });
      }
    }

    function showTwitterUser(obj) {
      hideTwitterUser();

      // Name :
      $('div.node-info-container .node-name').append(
        '<h3>' +
          '<a target="_blank" href="' +
            'http://twitter.com/' + obj['screen_name'] +
          '">' +
          obj['name'] +
          '</a>' +
        '</h3>' +
        (obj['url'] ?
          '<a target="_blank" href="' + obj['url'] + '">' +
            obj['url'] +
          '</a>' :
          '')
      );

      // Avatar :
      $('div.node-info-container .node-avatar').append(
        '<img src="' +
          obj['profile_image_url_https'] +
        '" width="64px" height="64px" />'
      );

      // Followers :
      $('div.node-info-container .node-followers').append(
        obj['followers_count'] +
          ' follower' +
          (obj['followers_count'] > 0 ? 's' : '')
      );

      // Following :
      $('div.node-info-container .node-following').append(
        'following ' + obj['friends_count'] + ' people'
      );

      // Tweets count :
      $('div.node-info-container .node-tweets').append(
        obj['statuses_count'] +
          ' tweet' +
          (obj['statuses_count'] > 0 ? 's' : '')
      );

      // Score :
      $('div.node-info-container .node-score').append(
        'score : ' + (obj['score'] || '-')
      );
    }

    function hideTwitterUser() {
      $('div.node-info-container .node-info').empty();
    }

    s1.bind('downnodes', function(e) {
      onAction();

      var node;
      s1.iterNodes(function(n) {
        node = n;
        n.active = true;
      }, [e.content[0]]);

      s1.refresh();
      loadTwitterUser(node);
    });
  });
})();
