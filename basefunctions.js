// Base functions to define values before Perlin is used
// To generate turbulence 

(function(PerlinTubulence) {

  PerlinTubulence.addBaseFunction('grid', {
    name: 'Grid',
    options: {
      size: { name: 'Size', type: 'slider', unit: 'pixels', exponential: true, defaultValue: 100, min: 5, max: 1000  },
      width: { name: 'Line width', type: 'slider', defaultValue: 5, min: 1, max: 95, unit: '%', description: "as percentage of grid size" }
    },
    functionFactory: function(options) {
      var lineWidth = options.size * options.width / 100;
      return function(x, y) {
        // javascript does not do molulos for negative numbers, so make sure it's positive
        x = Math.floor( (x + options.size * 100000) % options.size );
        y = Math.floor( (y + options.size * 100000) % options.size );
                
        return (x < lineWidth || y < lineWidth) ? 1 : 0;
      }
    }
  });

  PerlinTubulence.addBaseFunction('ripple', {
    name: 'Cosine ripple',
    options: {
      period: { name: 'Period', type: 'slider', defaultValue: 100, min: 10, max: 200 }
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
      period: { name: 'Period', type: 'slider', defaultValue:100, min:10, max:1000 }
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
      period: { name: 'Period', type: 'slider', defaultValue:100, min:10, max:1000 },
      radius: { name: 'Radius', type: 'slider', unit: '%', defaultValue:30, min:5, max:45 },
      fade: { name: 'Fade', type: 'slider', unit: '%', defaultValue:40, min:0, max:100 }
    },
    functionFactory: function(options) {
      radiusPixels = options.radius * options.period / 100;
      fadePixels =  radiusPixels + ((options.period - radiusPixels) * options.fade / 200);
      
      radius2 = radiusPixels * radiusPixels;    // square of radius of dot
      fade2 = fadePixels * fadePixels;          // square of radius of fade cutoff
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

  PerlinTubulence.addBaseFunction('flower', {
    name: 'Flower',
    options: {
      symmetry: { name: 'Symmetry', type: 'slider', exponential: false, defaultValue: 6, min: 2, max: 20  },
      period: { name: 'Period', type: 'slider', defaultValue:100, min:10, max:400 }
    },
    functionFactory: function(options) {
      var distanceCycle = (options.period / (2 * Math.PI));
      return function(x, y) {
        var angle = (x==0) ? 0 : Math.atan2(y,x);
        var radialCofactor = (Math.sin(angle * options.symmetry ) + 1) / 2;
        var distanceCofactor = (1 - Math.cos(Math.sqrt(x * x + y * y) / distanceCycle)) / 2;
        return Math.sqrt(radialCofactor * distanceCofactor);
      }
    }
  });

  PerlinTubulence.addBaseFunction('hill', {
    name: 'Hill',
    options: {
      size: { name: 'size', type: 'slider', defaultValue:200, min:50, max:800 }
    },
    functionFactory: function(options) {
      return function(x, y) {
        var dist = (x * x + y * y) / (options.size * options.size);
        return Math.pow(0.5, dist);
      }
    }
  });

  PerlinTubulence.addBaseFunction('custom', {
    name: 'Custom',
    options: {
      code: { name: 'code', type: 'text', defaultValue: "// Temporary variables are O.K.\ntemp = 1 / ((x*x + y*y) * 0.0001);\n\n// Don't use \"return\"\n// Just create expression as last statement\ntemp;", 
      description: "Javascript code to use the variables x and y to create a value between 0 and 1.   Value will be clamped for you."  }
    },
    functionFactory: function(options) {
      return function(x, y) {
        try {
          var value = eval(options.code);
          return (value > 1) ? 1 : (value < 0) ? 0 : value;
        } catch(e) {
          return 0;
        }
      }
    }
  });

})(PerlinTubulence);


