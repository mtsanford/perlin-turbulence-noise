(function(exports) {

  var listeners = [];

  var SettingsOptions = {
  
    // Register a listener for when values have changed
    // listner signature = function(blockID, variable, newValue)
    registerListener: function(listener) {
      listeners.push(listener);
    },
  
    makeControls: function(blockID, options, settings) {
      var $block = $('#' + blockID);
      
      for (var optName in options) {
        option = options[optName];
        if (option.name) { $block.append($('<div class="settingTitle">' + option.name + '</div>')); }
        switch (option.type) {
          case 'number':
            makeNumberControl($block, blockID, option, settings, optName);
            break;
          case 'slider':
            makeSliderControl($block, blockID, option, settings, optName);
            break;
          case 'select':
            makeSelectControl($block, blockID, option, settings, optName);
            break;
          case 'checkbox':
            makeCheckboxControl($block, blockID, option, settings, optName);
            break;
          case 'color':
            makeColorControl($block, blockID, option, settings, optName);
            break;
        }
        if (option.description) { $block.append($('<div class="settingDescription">' + option.description + '</div>')); }
      }
    },
    
    // utility function to create a default settings object from an options object
    getDefaultSettings: function(options) {
      var settings = {};
      for (var o in options) {
        settings[o] = options[o].defaultValue;
      }
      return settings;
    },

  }
  
  function makeNumberControl($block, blockID, config, settings, which) {
    var $input = $('<input type="text" id="' + blockID + '-' + which + '-slider" class="settingNumber"></input>');
    $block.append($input);
    $input.val(settings[which]);
    $input.change(function(e) {
      settings[which] = $input.val();
    });
  }

  
  function makeSliderControl($block, blockID, config, settings, which) {
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
      slide: function( event, ui ) {
        var newValue = config.exponential ? sliderPosToValue(ui.value) : ui.value;
        settings[which] = newValue;
        $text.text((newValue).toFixed(3) + unitText);
        notifyChange(blockID, which, settings[which]);
      },
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
      notifyChange(blockID, which, settings[which]);
    });
  }

  function makeCheckboxControl($block, blockID, config, settings, which) {
    console.log(config);
    var checked = settings.which ? 'checked="checked"' : '';
    var selectHTML = '<input type="checkbox" id="' + blockID + '-' + which + '-cb" ' + checked + '/>';
    $select = $(selectHTML);
    $block.append($select).append(config.name);
    $select.change(function(e) {
      settings[which] = $select.is(":checked");
      notifyChange(blockID, which, settings[which]);
    });
  }

  function makeColorControl($block, blockID, config, settings, which) {
    var inputID = blockID + '-' + which + '-input';
    var colorID = blockID + '-' + which + '-color';
    var $input = $('<input type="text" id="' + inputID + '" class="settingColorInput"></input>');
    var $color = $('<div id="' + colorID + '" class="settingColorColor"></div>');
    $block.append($input).append($color);
    $input.val(settings[which]);
    $color.farbtastic(function() {
      var newColor = $.farbtastic('#' + colorID).color;
      settings[which] = newColor;
      notifyChange(blockID, which, newColor);
    });
    $input.change(function(e) {
      console.log($input.val());
      settings[which] = $input.val();
    });
  }

  function notifyChange(blockID, which, newValue) {
    for (var i=0; i<listeners.length; i++) {
     listeners[i](blockID, which, newValue);
    }
  }

  exports.SettingsOptions = SettingsOptions;

})(window);
