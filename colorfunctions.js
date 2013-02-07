// Color function to turn a 0-1 value into a color

(function(PerlinTubulence) {

  PerlinTubulence.addColorFunction('colorLinear', {
    name: 'Two color',
    options: {
      color1: { name: 'Color 1', type: 'color', defaultValue: '#000000', description: "Color for value of 0" },
      color2: { name: 'Color 2', type: 'color', defaultValue: '#FFFFFF', description: "Color for value of 1" }
    },
    functionFactory: function(options) {
      var rgb1 = PerlinTubulence.rbgColor(options.color1);
      var rgb2 = PerlinTubulence.rbgColor(options.color2);
      return function(value) {
        return [(rgb2[0] * value) + (rgb1[0] * (1 - value)),
                (rgb2[1] * value) + (rgb1[1] * (1 - value)),
                (rgb2[2] * value) + (rgb1[2] * (1 - value))];
      }
    }
  });
  
  PerlinTubulence.addColorFunction('noisy', {
    name: 'Noisy',
    options: {
      period: { name: 'Period', type: 'slider', defaultValue: 200, min: 10, max: 2000, exponential: true },
      color1: { name: 'Color 1', type: 'color', defaultValue: '#FF0000'},
      color2: { name: 'Color 2', type: 'color', defaultValue: '#0000FF'},
      turbulence: { name: 'Apply turbulence', type: 'checkbox', defaultValue: false, description: "Use the value after noise is applied to determine color"},
      sharpness: { name: 'Sharpness', type: 'slider', defaultValue: 2, min:1, max:10},
      seed: { name: 'Seed', description: 'The numberic seed to use in the pseudo-random number generator', type: 'number', defaultValue: 0 }
    },
    functionFactory: function(options) {
      var rgb1 = PerlinTubulence.rbgColor(options.color1);
      var rgb2 = PerlinTubulence.rbgColor(options.color2);
      return function(value, colorContext) {
        var noise = options.turbulence ? 
                    PerlinTubulence.noise(colorContext.px / options.period, colorContext.py / options.period, options.seed) :
                    PerlinTubulence.noise(colorContext.x / options.period, colorContext.y / options.period, options.seed);
        if (noise < 0.5) {
          noise = Math.pow(noise * 2, options.sharpness) / 2;         
        } else {
          noise = 1 - Math.pow((1 - noise) * 2, options.sharpness) / 2;   
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


