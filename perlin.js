(function(exports) {

  var baseFunctions = {};
  
  var colorFunctions = {};

  var PerlinTubulence = {
  
    
    addBaseFunction: function(tag, options) {
      baseFunctions[tag] = options;
      for (var o in options.options) {
        options.options[o].value = options.options[o].defaultValue;
      }
    },

    getBaseFunctions: function() {
      return baseFunctions;
    },    
    
    addColorFunction: function(tag, options) {
      colorFunctions[tag] = options;
    },
    
    getColorFunctions: function() {
      return colorFunctions;
    },
    
    // imagedata: canvas api pixel data
    // options:
    // scale: number of domain pixels per image pixel (2 = "zoomed out") 
    
    makeImage: function(imagedata, options, width, height, scale) {
    
      //var func = (typeof options.func == 'undefined') ? grid(100) : options.func;
      
      var baseFunc = baseFunctions[options.baseFunction].functionFactory(options.baseFunctionOptions);
      var colorFunc = colorFunctions[options.colorFunction].functionFactory(options.colorFunctionOptions);
      
      if (typeof options.perlinOptions == 'undefined') options.perlinOptions = {};
      var turbMagnitude = (typeof options.perlinOptions.magnitude == 'undefined') ? 100 : options.perlinOptions.magnitude;
      var turbPeriod = (typeof options.perlinOptions.period == 'undefined') ? 100 : options.perlinOptions.period;
      var octaves = (typeof options.perlinOptions.octaves == 'undefined') ? 3 : options.perlinOptions.octaves;
      var z = (typeof options.perlinOptions.seed == 'undefined') ? 0 : options.perlinOptions.seed;
      var turbType = (typeof options.perlinOptions.type == 'undefined') ? 'linear' : options.perlinOptions.type;
      
      //var colorFunc = (typeof options.colorFunc == 'undefined') ? colorLinear([255,0,255]) : options.colorFunc;
    
      var p1, p2, px, py, color,
          colorContext = { width: width, height: height };
      
      for (var y=0; y<height; y++) {
        for (var x=0; x<width; x++) {
        
          // make center of image at (0,0)
          px = (x - width/2) * scale;
          py = (y - height/2) * scale;

          p1 = p2 = 0;          
          for (var i=0; i<octaves; i++) {
            var pow = Math.pow(2,i);
            p1 += PerlinNoise.noise(px * pow / turbPeriod, py * pow / turbPeriod, z + i) / (pow * 2);
            p2 += PerlinNoise.noise(px * pow / turbPeriod, py * pow / turbPeriod, z + 32476 + i) / (pow * 2);
          }
          
          if (turbType == 'linear') {
            // translationsl perterbation
            px += ((p1-0.5) * turbMagnitude);
            py += ((p2-0.5) * turbMagnitude);
          }
          
          if (turbType == 'radial') {
            var angle = p1 * Math.PI * 2;
            var length = p2 * turbMagnitude;
            px += Math.cos(angle) * length;
            py += Math.sin(angle) * length;
          }
                
          var value = baseFunc(px, py);
          
          colorContext.x = px;
          colorContext.y = py;
          colorContext.p1 = p1;
          colorContext.p2 = p2;
          
          color = colorFunc(value, colorContext);
          
          imagedata[(y*width + x) * 4] = color[0];
          imagedata[(y*width + x) * 4 + 1] =  color[1];
          imagedata[(y*width + x) * 4 + 2] = color[2];
          imagedata[(y*width + x) * 4 + 3] = 255;
        }
      }
    }
    
  };

  function ripple(period) {
    if (typeof period == 'undefined') period = 100;
    return function(x, y) {
      var cycle = (period / (2 * Math.PI));
      return (Math.cos(Math.sqrt(x * x + y * y) / cycle) + 1) / 2;
    }
  }
  
  function stripes(period) {
    if (typeof period == 'undefined') period = 100;
    return function(x, y) {
      var cycle = (period / (2 * Math.PI));
      return (Math.cos(y / cycle) + 1) / 2;
    }
  }
  
  function grid(size, width) {
    if (typeof size == 'undefined') size = 100;
    if (typeof width == 'undefined') width = 3;
    return function(x, y) {
      // javascript does not do molulos for negative numbers
      x = Math.floor( (x + size * 100000) % size );
      y = Math.floor( (y + size * 100000) % size );
              
      return (x < width || y < width) ? 1 : 0;
    }
  }
  
  function dots(period, radius, fade) {
    if (typeof period == 'undefined') period = 100;
    if (typeof radius == 'undefined') radius = period * 0.3;
    if (typeof fade == 'undefined') fade = period * 0.4;
    
    return function(x, y) {
      // javascript does not do molulos for negative numbers
      x = (period / 2) - ( (x + period * 1000) % period );
      y = (period / 2) - ( (y + period * 1000) % period );
      
      var dist2 = (x * x + y * y);  // square of distance from center of square
      radius2 = radius * radius;    // square of radius of dot
      fade2 = fade * fade;          // square of radius of fade cutoff
      
      return dist2 < radius2 ? 0
        : ( dist2 < fade2 ? ( (dist2-radius2) / (fade2-radius2)) : 1 )
        ;
    }
  }
  
  function squares(x, y) {
    var x2 = x/100 + 10000, y2 = y/100 + 10000;
    
    x2 = (x2 % 2) > 1;
    y2 = (y2 % 2)  > 1;
    
    return ((x2 && !y2) || (!x2 && y2)) ? 1 : 0;
  }
  
  function hills(peaks, halflife) {
    if (typeof peaks == 'undefined') peaks = [[0,0,1]];
    if (typeof halflife == 'undefined') halflife = 100;
    return function(x, y) {
      var value = 0;
      for (var i=0; i<peaks.length; i++) {
        var peak = peaks[i];
        var dist = Math.sqrt((peak[0] - x) * (peak[0] - x) + (peak[1] - y) * (peak[1] - y));
        value += Math.pow(0.5, dist/halflife) * peak[2];
      }
      return value;
    }
  }
  
  /*
   * Color function factories
   */
   
  function colorLinear(rgb) {
    if (typeof rgb == 'undefined') rgb = [255,255,255];
    return function(value) {
      return [rgb[0] * value, rgb[1] * value, rgb[2] * value];
    }
  }

  function colorExperimental(value, context) {
    var p3 = PerlinNoise.noise(context.x / (context.width / 8), context.y / (context.width / 8), 3);
    var p4 = PerlinNoise.noise(context.x / (context.width / 16), context.y / (context.width / 16), 8);
    var rgb = [0,255,255];
    //if (value < 0.3) return [0,0,0];
    value = value + (p4 * 0.2);
    return [p3 * value * 255, 0, value * 255];
  }
  
  exports.PerlinTubulence = PerlinTubulence;

})(window);



function DoNoise() {

	// Globals
  var   elem
      , context
      , nscale = 1
      , width
      , height
      , nwidth
      , nheight;
	
	if (Initialize()) {
	  DrawNoise();
	}
	
	function DrawNoise() {
	  //context.scale(nscale, nscale);
	  var imgd = context.createImageData(nwidth,nheight);
	  if (!imgd) {
	    alert("createImageData failed");
	    return;
	  }
	  
	  var pix = imgd.data;

    Turbulence({ 
      func: dots(400,150,180),
      //func: stripes(500),
      //func: hills([[-300,-200,1],[400,-200,.8]], 250),
      turbMagnitude: 200,
      turbPeriod: 600,
      turbOctaves: 7,
      turbType: 'radial',
      seed: 12361,
      //colorFunc: colorLinear([0xcd,0x5c,0x5c])
      colorFunc: colorExperimental
    });
    
    function Turbulence(options) {
      if (typeof options == 'undefined') options = {};
      var func = (typeof options.func == 'undefined') ? grid(100) : options.func;
      var turbMagnitude = (typeof options.turbMagnitude == 'undefined') ? 100 : options.turbMagnitude;
      var turbPeriod = (typeof options.turbPeriod == 'undefined') ? 100 : options.turbPeriod;
      var octaves = (typeof options.turbOctaves == 'undefined') ? 3 : options.turbOctaves;
      var z = (typeof options.seed == 'undefined') ? 0 : options.seed;
      var turbType = (typeof options.turbType == 'undefined') ? 'linear' : options.turbType;
      var colorFunc = (typeof options.colorFunc == 'undefined') ? colorLinear([255,0,255]) : options.colorFunc;
    
      var p1, p2, px, py, color,
          colorContext = { width: width, height: height };
      
      for (var y=0; y<nheight; y++) {
        for (var x=0; x<nwidth; x++) {
        
          p1 = p2 = 0;          
          for (var i=0; i<octaves; i++) {
            var pow = Math.pow(2,i);
            p1 += PerlinNoise.noise(x * pow / turbPeriod, y * pow/ turbPeriod, z + i) / (pow * 2);
            p2 += PerlinNoise.noise(x * pow / turbPeriod, y * pow/ turbPeriod, z + 32476 + i) / (pow * 2);
          }

          // make center of image at (0,0)
          px = x - nwidth / 2;
          py = y - nheight / 2;      
          
          if (turbType == 'linear') {
            // translationsl perterbation
            px += ((p1-0.5) * turbMagnitude);
            py += ((p2-0.5) * turbMagnitude);
          }
          
          if (turbType == 'radial') {
            var angle = p1 * Math.PI * 2;
            var length = p2 * turbMagnitude;
            px += Math.cos(angle) * length;
            py += Math.sin(angle) * length;
          }
                
          var value = func(px, py);
          
          colorContext.x = x;
          colorContext.y = y;
          colorContext.p1 = p1;
          colorContext.p2 = p2;
          
          color = colorFunc(value, colorContext);
          
          pix[(y*nwidth + x) * 4] = color[0];
          pix[(y*nwidth + x) * 4 + 1] =  color[1];
          pix[(y*nwidth + x) * 4 + 2] = color[2];
          pix[(y*nwidth + x) * 4 + 3] = 255;
        }
      }
      context.putImageData(imgd, 0, 0);
    }
    
  }
	
	function Initialize() {
  
    elem = document.getElementById('noise');
      if (!elem) {
      alert("can't get canvas element");
      return false;
    }
    
    width = elem.width;
    height = elem.height;
    nwidth = width / nscale
    nheight = height / nscale;
    
	  if (!elem.getContext) {
      alert("getContext() does not exist");
      return false;
    }
    
    context = elem.getContext('2d');
    if (!context) {
      alert("can't get canvas context");
      return false;
    }
    
    return true;
  }

  
}