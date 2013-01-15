(function(exports) {

  var SettingsOptions = {
  
    makeControls: function(blockID, options, settings) {
      var $block = $('#' + blockID);
      
      for (var optName in options) {
        option = options[optName];
        if (option.name) { $block.append($('<div class="settingTitle">' + option.name + '</div>')); }
        switch (option.type) {
          case 'number':
            makeNumberControl($block, blockID, option, settings, optName);
            break;
          case 'select':
            makeSelectControl($block, blockID, option, settings, optName);
            break;
        }
        if (option.description) { $block.append($('<div class="settingDescription">' + option.description + '</div>')); }
      }
    }
  
  }
  
  function makeNumberControl($block, blockID, config, settings, which) {
    var ratio = Math.log(config.max / config.min);
    var unitText = (config.unit ? (' ' + config.unit) : '');
    var $slider = $('<div id="' + blockID + '-' + which + '-slider" class="settingSlider"></div>');
    var $text = $('<div id="' + blockID + '-' + which + '-text" class="settingSliderValue"></div>');
    $block.append($slider).append($text).append($('<div style="clear:both;"></div>'));
    $text.text(settings[which] + unitText);
    $slider.slider({
      min: config.exponential ? 0 : config.min,
      max: config.exponential ? 100 : config.max,
      value: config.exponential ? valueToSliderPos(settings[which]) : settings[which],
      stop: function( event, ui ) {
        var newValue = config.exponential ? sliderPosToValue(ui.value) : ui.value;
        settings[which] = newValue;
        $text.text((newValue).toFixed(3) + unitText);
      }
    });
    function valueToSliderPos(value) {
      return Math.floor(Math.log( value/config.min ) * 100 / ratio);
    }
    function sliderPosToValue(pos) {
      return config.min * Math.pow(Math.E, pos * ratio / 100);
    }
  }
  
  function makeSelectControl($block, blockID, config, settings, which) {
    var selectHTML = '<select id="' + blockID + '-' + which + '-select">';
    for (var i=0; i<config.options.length; i++) {
      selectHTML += '<option value="' + config.options[i] + '">' + config.options[i] + '</option>'
    }
    selectHTML += '</select>';
    $select = $(selectHTML);
    $block.append($select);
    $select.change(function(e) {
      settings[which] = $select.find(":selected").text();
    });
  }
  
  exports.SettingsOptions = SettingsOptions;

})(window);
