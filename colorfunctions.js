// Color function to turn a 0-1 value into a color

(function(PerlinTubulence) {

  PerlinTubulence.addColorFunction('colorLinear', {
    name: 'Linear',
    options: {
      color: { name: 'Color', type: 'color', defaultValue: '#FFFFFF', description: "Color for value of 1" },
    },
    functionFactory: function(options) {
      var rgb = SettingsOptions.rbgColor(options.color);
      return function(value) {
        return [rgb[0] * value, rgb[1] * value, rgb[2] * value];
      }
    }
  });
  
  PerlinTubulence.addColorFunction('colorLinearRed', {
    name: 'Red',
    options: {
      size: { name: 'Dummy', type: 'slider', defaultValue: 100, min: 5, max: 1000  },
    },
    functionFactory: function(options) {
      return function(value) {
        return [255 * value, 0 * value, 0 * value];
      }
    }
  });
  
})(PerlinTubulence);


