// Custom jQuery tabs library
// usage $("#tabsWrapper").makeTabs();
// e.g.
// <div id="tabsWrapper">
//   <div class="tab" id="tab1">Tab 1</div>
//   <div class="tab" id="tab2">Tab 2</div>
//   <div id="tab1-block">This is the contents of tab 1</div>
//   <div id="tab2-block">This is the contents of tab 2</div>
// </div>
//
// to work correctly:
//   1 - all tabs should have class of 'tab'
//   2 - tab contents blocks should have an id that is the id of the tab with '-block' appended
//

(function( $ ){

  $.fn.makeTabs = function() {
    this.find('.tab').each(function() {
      $(this).click(function() {
        $(this).setActive();
      });
    }).first().setActive();
  };
  
  $.fn.setActive = function() {
    $activeTab = this;
    $wrapper = this.parent();
    // gray out all tabs, hide all tab blocks,
    // then ungray active tab, and show active tab block
    $wrapper.find('.tab').css({opacity:0.3});
    $wrapper.find('.tabBlock').hide();
    $activeTab.css({opacity:1});
    $('#' + $activeTab.prop('id') + '-block').show();
  };
  
})( jQuery );