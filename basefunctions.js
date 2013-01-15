// Base functions to define values before Perlin is used
// To generate turbulence 

(function(PerlinTubulence) {

  PerlinTubulence.addBaseFunction('grid', {
    name: 'Grid',
    options: {
      size: { name: 'Size', type: 'exponential', defaultValue: 7, min: 1, max: 9  },
      width: { name: 'Line width', type: 'number', defaultValue: 5, min: 1, max: 20 }
    },
    functionFactory: function(options) {
      return function(x, y) {
        // javascript does not do molulos for negative numbers, so make sure it's positive
        x = Math.floor( (x + options.size * 100000) % options.size );
        y = Math.floor( (y + options.size * 100000) % options.size );
                
        return (x < options.width || y < options.width) ? 1 : 0;
      }
    }
  });

  PerlinTubulence.addBaseFunction('ripple', {
    name: 'Cosine ripple',
    options: {
      period: { name: 'Period', type: 'number', defaultValue: 100, min: 10, max: 200 }
    },
    functionFactory: function(options) {
      var cycle = (options.period / (2 * Math.PI));
      return function(x, y) {
        return (Math.cos(Math.sqrt(x * x + y * y) / cycle) + 1) / 2;
      }
    }
  });

  PerlinTubulence.addBaseFunction('stripes', {
    name: 'Cosine stripes',
    options: {
      period: { name: 'Period', type: 'number', defaultValue:100, min:10, max:1000 }
    },
    functionFactory: function(options) {
      var cycle = (options.period / (2 * Math.PI));
      return function(x, y) {
        return (Math.cos(y / cycle) + 1) / 2;
      }
    }
  });

  PerlinTubulence.addBaseFunction('dots', {
    name: 'Dots',
    options: {
      period: { name: 'Period', type: 'number', defaultValue:100, min:10, max:1000 },
      radius: { name: 'Radius', type: 'number', defaultValue:30, min:10, max:1000 },
      fade: { name: 'Fade', type: 'number', defaultValue:40, min:10, max:1000 }
    },
    functionFactory: function(options) {
      radius2 = options.radius * options.radius;    // square of radius of dot
      fade2 = options.fade * options.fade;          // square of radius of fade cutoff
      return function(x, y) {
        // javascript does not do molulos for negative numbers
        x = (options.period / 2) - ( (x + options.period * 1000) % options.period );
        y = (options.period / 2) - ( (y + options.period * 1000) % options.period );
        
        var dist2 = (x * x + y * y);  // square of distance from center of square
        
        return dist2 < radius2 ? 0
          : ( dist2 < fade2 ? ( (dist2-radius2) / (fade2-radius2)) : 1 )
          ;
      }
    }
  });
  
})(PerlinTubulence);


