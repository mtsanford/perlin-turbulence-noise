// Color function to turn a 0-1 value into a color

(function(PerlinTubulence) {

  PerlinTubulence.addColorFunction('colorLinear', {
    name: 'Linear',
    options: {
      color: { name: 'Color', type: 'color', defaultValue: '#FFFFFF', description: "Color for value of 1" },
    },
    functionFactory: function(options) {
      var rgb = PerlinTubulence.rbgColor(options.color);
      return function(value) {
        return [rgb[0] * value, rgb[1] * value, rgb[2] * value];
      }
    }
  });
  
  PerlinTubulence.addColorFunction('noisy', {
    name: 'Noisy',
    options: {
      period: { name: 'Period', type: 'slider', defaultValue: 200, min: 10, max: 2000, exponential: true },
      color1: { name: 'Color 1', type: 'color', defaultValue: '#FF0000'},
      color2: { name: 'Color 2', type: 'color', defaultValue: '#0000FF'},
      turbulence: { name: 'Apply turbulence', type: 'checkbox', defaultValue: false},
      scurve: { name: 'Use S-curve', type: 'checkbox', defaultValue: true},
    },
    functionFactory: function(options) {
      var rgb1 = PerlinTubulence.rbgColor(options.color1);
      var rgb2 = PerlinTubulence.rbgColor(options.color2);
      return function(value, colorContext) {
        var noise = options.turbulence ? 
                    PerlinTubulence.noise(colorContext.px / options.period, colorContext.py / options.period, 5) :
                    PerlinTubulence.noise(colorContext.x / options.period, colorContext.y / options.period, 5);
        if (options.scurve) {
          noise = (3 * noise * noise) - (2 * noise * noise * noise);
        }
        return [  
          ((rgb1[0] * noise) + (rgb2[0] * (1 - noise))) * value,
          ((rgb1[1] * noise) + (rgb2[1] * (1 - noise))) * value,
          ((rgb1[2] * noise) + (rgb2[2] * (1 - noise))) * value
        ];
      }
    }
  });  
  
})(PerlinTubulence);


