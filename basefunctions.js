// Base functions to define values before Perlin is used
// To generate turbulence 

(function(baseFuncs) {

  baseFuncs.ripple = {
    name: 'Cosine ripple',
    options: {
      period: { type: 'number', defaultValue:100 }
    },
    functionFactory: function(options) {
      return function(x, y) {
        var cycle = (options.period / (2 * Math.PI));
        return (Math.cos(Math.sqrt(x * x + y * y) / cycle) + 1) / 2;
      }
    }
  }

})(PerlinOptions.baseFunctions);
