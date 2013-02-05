(function(exports) {

  var baseFunctions = {};
  
  var colorFunctions = {};

  var PerlinTubulence = {
    
    defaultPerlinOptions : {
      magnitude: 100,
      period: 100,
      octaves: 3,
      seed: 0,
      type: 'linear'
    },

    addBaseFunction: function(tag, options) {
      baseFunctions[tag] = options;
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
    
    makeBaseFunction: function(tag, options) {
      return baseFunctions[tag].functionFactory(options);
    },
    
    makeColorFunction: function(tag, options) {
      return colorFunctions[tag].functionFactory(options);
    },

    /*
     *  Compute <lines> lines of the image based on options given.
     *  Intended to work either on the UI thread or in a web worker.
     *
     *  imagedata:        imagedata.data from canvas, or Uint8ClampedArray
     *  baseFunction:     function(x,y) that returns a value from 0 to 1
     *  colorFunction:    function(val, context) that returns a RGB color for val 0-1
     *  perlinOptions:    (see below) how to apply turbulence to the base function.  Use null for default
     *  positionOptions:  (see below) translation/rotation
     *  width:            width of the image in imagedata
     *  height:           height of the image in imagedata
     *  scale:            how many units in image space are represented by a pixel
     *  startY:           (optional) the start Y value in the image
     *  lines:            (optional) the number of lines of the image to process
     *
     *  example of perlinOptions object:
     *
     *  {                                  
     *    octaves: 3,                             // (optional) Number of octaves of noise
     *    period: 400,                            // (optional) period of first octave
     *    magnitude: 50,                          // (optional) magnitide of noise as percentage of period
     *    type: 'linear',                         // (optional) 'linear' or 'radial'
     *    seed: 3423                              // (optional) number to use as 'seed' for pseudo-random noise
     *  }
     *
     *  example of positionOptions object:
     *
     *  {                                  
     *    horizontal: 100,                        // shift center 100 pixels to the right
     *    vertical: 0,
     *    angle: 45,                              // rotate counterclockwize 45 degrees
     *  }
     *
     *
     */
    makeImageSlice: function(imagedata, baseFunction, colorFunction, perlinOptions, positionOptions, width, height, scale, startY, lines) {
    
      // Set default noise options if not present
      perlinOptions = perlinOptions || {};  
      for (var o in PerlinTubulence.defaultPerlinOptions) {
        perlinOptions[o] = perlinOptions[o] || PerlinTubulence.defaultPerlinOptions[o];
      }
      
      var turbMagnitude = perlinOptions.magnitude;
      var turbPeriod = perlinOptions.period;
      var octaves = perlinOptions.octaves;
      var z = perlinOptions.seed;
      var turbType = perlinOptions.type;
      
      var posCos = Math.cos(positionOptions.angle * Math.PI / 90);
      var posSin = Math.sin(positionOptions.angle * Math.PI / 90);
      
      startY = (typeof startY == 'undefined') ? 0 : startY;
      lines = (typeof lines == 'undefined') ? height : lines;
          
      var p1, p2, x2, y2, rx, ry, px, py, color,
          colorContext = { width: width, height: height };
      
      for (var y=startY; y<height && y<(startY+lines); y++) {
        for (var x=0; x<width; x++) {
        
          // make center of image at (0,0) and scale it
          x2 = (x - width/2) * scale;
          y2 = (y - height/2) * scale;
          
          // apply rotation and translation
          rx = px = (x2 * posCos - y2 * posSin) - positionOptions.horizontal;
          ry = py = (x2 * posSin + y2 * posCos) - positionOptions.vertical;
  
          p1 = p2 = 0;          
          for (var i=0; i<octaves; i++) {
            var pow = Math.pow(2,i);
            p1 += PerlinTubulence.noise(px * pow / turbPeriod, py * pow / turbPeriod, z + i) / (pow * 2);
            p2 += PerlinTubulence.noise(px * pow / turbPeriod, py * pow / turbPeriod, z + 32476 + i) / (pow * 2);
          }
          
          if (turbType == 'linear') {
            // translationsl perterbation
            px += ((p1-0.5) * turbMagnitude);
            py += ((p2-0.5) * turbMagnitude);
          }
          
          // TODO, this is not really a good way to do this, since
          // It does not appear that the distribution of the noise
          // is uniform, leading to bias in the angle.
          if (turbType == 'radial') {
            var angle = p1 * Math.PI * 2;
            var length = p2 * turbMagnitude;
            px += Math.cos(angle) * length;
            py += Math.sin(angle) * length;
          }
                
          var value = baseFunction(px, py);
          
          colorContext.x = rx;
          colorContext.y = ry;
          colorContext.px = px;
          colorContext.py = py;
          colorContext.p1 = p1;
          colorContext.p2 = p2;
          
          color = colorFunction(value, colorContext);
          
          imagedata[(y*width + x) * 4] = color[0];
          imagedata[(y*width + x) * 4 + 1] =  color[1];
          imagedata[(y*width + x) * 4 + 2] = color[2];
          imagedata[(y*width + x) * 4 + 3] = 255;
        }
      }
    },

    // This is a port of Ken Perlin's Java code. The
    // original Java code is at http://cs.nyu.edu/%7Eperlin/noise/.
    // Note that in this version, a number from 0 to 1 is returned.
    noise: function(x, y, z) {
    
      var X = Math.floor(x) & 255,                       // FIND UNIT CUBE THAT
          Y = Math.floor(y) & 255,                       // CONTAINS POINT.
          Z = Math.floor(z) & 255;
      x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
      y -= Math.floor(y);                                // OF POINT IN CUBE.
      z -= Math.floor(z);
      var    u = fade(x),                                // COMPUTE FADE CURVES
             v = fade(y),                                // FOR EACH OF X,Y,Z.
             w = fade(z);
      var A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,      // HASH COORDINATES OF
          B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;      // THE 8 CUBE CORNERS,

      return scale(lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),  // AND ADD
                                     grad(p[BA  ], x-1, y  , z   )), // BLENDED
                             lerp(u, grad(p[AB  ], x  , y-1, z   ),  // RESULTS
                                     grad(p[BB  ], x-1, y-1, z   ))),// FROM  8
                     lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  // CORNERS
                                     grad(p[BA+1], x-1, y  , z-1 )), // OF CUBE
                             lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                     grad(p[BB+1], x-1, y-1, z-1 )))));
   },
    
    // Utility function
    rbgColor: function(colorString) {
      var rgb = [];
      if (colorString.length == 4) {
        rgb[0] = parseInt(colorString.substr(1,1), 16) * 16;
        rgb[1] = parseInt(colorString.substr(2,1), 16) * 16;
        rgb[2] = parseInt(colorString.substr(3,1), 16) * 16;
      } else {
        rgb[0] = parseInt(colorString.substr(1,2), 16);
        rgb[1] = parseInt(colorString.substr(3,2), 16);
        rgb[2] = parseInt(colorString.substr(5,2), 16);
      }
      return rgb;
    }      
    
  };    

  /**
   *  Data and helper functions for PerlinTubulence.noise()
   **/
   
    var p = new Array(512);
     
    var permutation = [ 151,160,137,91,90,15,
     131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
     190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
     88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
     77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
     102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
     135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
     5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
     223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
     129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
     251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
     49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
     138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
    ];
     
    for (var i=0; i < 256 ; i++) 
      p[256+i] = p[i] = permutation[i]; 
    
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp( t, a, b) { return a + t * (b - a); }
    function grad(hash, x, y, z) {
      var h = hash & 15;                      // CONVERT LO 4 BITS OF HASH CODE
      var u = h<8 ? x : y,                 // INTO 12 GRADIENT DIRECTIONS.
              v = h<4 ? y : h==12||h==14 ? x : z;
      return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
    } 
    function scale(n) { return (1 + n)/2; }

  /**
   *
   **/
  
  exports.PerlinTubulence = PerlinTubulence;

   // export to window or self so that we can run
   // in either UI thread or a web worker
   // TODO: Is there a best practice on this?
})(typeof window == 'undefined' ? self : window);

