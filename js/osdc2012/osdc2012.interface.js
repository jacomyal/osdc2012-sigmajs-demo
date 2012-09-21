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
      defaultEdgeType: 'curve',
      font: 'Maven Pro',
      defaultLabelSize: 14,
      defaultLabelActiveColor: '#2c4762'
    }).graphProperties({
      scalingMode: 'inside'
    });

    var i, N = 1000, E = 5000;

    for (i = 0; i < N; i++) {
      var r = Math.random(),
          t = Math.random() * Math.PI * 2;
      s1.addNode(i, {
        'label': 'Node ' + i,
        'x': Math.cos(t) * r,
        'y': Math.sin(t) * r,
        'size': 0.5 + 5 * Math.random(),
        'color': colors[(Math.random() * 5) | 0]
      });

      labels.push('Node ' + i);
    }

    for (i = 0; i < E; i++) {
      s1.addEdge(i, Math.random() * N | 0, Math.random() * N | 0);
    }

    s1.draw();


    // Control panel:     
    $('div.nodes').text(N + ' nodes');
    $('div.edges').text(E + ' edges');

    $('.contains-icon').mouseover(function() {
      $(this).find('.icon-button').addClass('icon-white');
    }).mouseout(function() {
      $(this).find('.icon-button').removeClass('icon-white');
    });

    var moveDelay = 80;
    $('.move-icon').click(function(event) {
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

    var zoomDelay = 2;
    $('.zoom-icon').click(function(event) {
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

    $('.refresh-icon').click(function(event) {
      s1.position(0, 0, 1).draw();

      event.stopPropagation();
      return false;
    });


    // Keyboard controls:
    function keyPressHandler(e) {
      var newPos = s1.position();
      newPos.ratio = undefined;

      switch (e.keyCode) {
        case 38:
        case 107:
          newPos.stageY += moveDelay;
          break;
        case 40:
        case 106:
          newPos.stageY -= moveDelay;
          break;
        case 37:
        case 104:
          newPos.stageX += moveDelay;
          break;
        case 39:
        case 108:
          newPos.stageX -= moveDelay;
          break;
        case 43:
          newPos.ratio = s1.position().ratio * zoomDelay;
          newPos.stageX = $('.sigma-container').width() / 2;
          newPos.stageY = $('.sigma-container').height() / 2;
          break;
        case 45:
          newPos.ratio = s1.position().ratio / zoomDelay;
          newPos.stageX = $('.sigma-container').width() / 2;
          newPos.stageY = $('.sigma-container').height() / 2;
          break;
      }

      s1.goTo(newPos.stageX, newPos.stageY, newPos.ratio);
    }

    $('.sigma-container').mouseover(function(e) {
      $('body').bind('keypress', keyPressHandler);
    }).mouseout(function(e) {
      $('body').unbind('keypress', keyPressHandler);
    });

    function onAction() {
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

    $('#search-nodes').smartAutoComplete({
      source: labels
    }).bind('itemSelect', function(e) {
      onAction();

      var label = e.smartAutocompleteData.item.innerText;
      var pos0 = s1.position();
      var node = false;

      // This might be easier to do if the labels are uniques
      // (then I can use labels as IDs, and directly give the
      // label to search):
      s1.iterNodes(function(n) {
        if (n.label == label) {
          node = n;
          n.active = true;
        }
      });

      // HACK:
      // I have a bug on the zoomTo when the ratio is the same than
      // the actual one:
      node && s1.position(pos0.stageX, pos0.stageY, pos0.ratio * 0.9999);

      node && s1.zoomTo(
        node.displayX,
        node.displayY,
        s1.mouseProperties('maxRatio')
      );

      loadTwitterUser(node);
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
