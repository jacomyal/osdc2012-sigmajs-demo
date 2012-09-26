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
    // Circular plugin:
    sigma.publicPrototype.circularize = function() {
      var R = 100, i = 0, L = this.getNodesCount();
   
      this.iterNodes(function(n){
        n.x = Math.cos(Math.PI*(i++)/L)*R;
        n.y = Math.sin(Math.PI*(i++)/L)*R;
      });
   
      return this.position(0,0,1).draw();
    };

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

    reddit.bind('pageCommentsLoaded',function(event){
      var graph = event.content.graph;

      s1.stopForceAtlas2();
      osdc2012.graph.set(graph,s1);
      s1.circularize().startForceAtlas2();

      $('div.nodes').text(s1.getNodesCount() + ' nodes');
      $('div.edges').text(s1.getEdgesCount() + ' edges');

      $('#search-nodes-fieldset > div').remove();
      $('<div>' +
          '<label for="search-nodes">' +
            'Search a user...' +
          '</label>' +
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
      s1.circularize().startForceAtlas2();
    }).bind('pageCommentsError',function(event){
      // TODO
      // console.log('failed');
    }).bind('startLoading',function(event){
      $('.sigma-container').addClass('loading');
      s1.emptyGraph().stopForceAtlas2();
    }).bind('stopLoading',function(event){
      $('.sigma-container').removeClass('loading');
    });

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
      var newPos = s1.position(),
          change = false;
      newPos.ratio = undefined;

      switch (e.keyCode) {
        case 32:
          s1.position(0, 0, 1).draw();
          e.stopPropagation();
          return false;
        case 38:
        case 75:
          newPos.stageY += moveDelay;
          change = true;
          break;
        case 40:
        case 74:
          newPos.stageY -= moveDelay;
          change = true;
          break;
        case 37:
        case 72:
          newPos.stageX += moveDelay;
          change = true;
          break;
        case 39:
        case 76:
          newPos.stageX -= moveDelay;
          change = true;
          break;
        case 107:
          newPos.ratio = s1.position().ratio * zoomDelay;
          newPos.stageX = $('.sigma-container').width() / 2;
          newPos.stageY = $('.sigma-container').height() / 2;
          change = true;
          break;
        case 109:
          newPos.ratio = s1.position().ratio / zoomDelay;
          newPos.stageX = $('.sigma-container').width() / 2;
          newPos.stageY = $('.sigma-container').height() / 2;
          change = true;
          break;
      }

      if(change) {
        s1.goTo(newPos.stageX, newPos.stageY, newPos.ratio);
        e.stopPropagation();
        return false;
      }
    }).focus(function(){
      s1.stopForceAtlas2();
    }).blur(function(){
      s1.startForceAtlas2();
    });

    /**
     * OTHER
     */
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
