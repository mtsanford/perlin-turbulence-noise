
(function() {

var noiseOptions = {
  period: {
    name: 'Period',
    description: 'Number of pixels between noise values',
    type: 'slider',
    exponential: true,
    unit: 'pixels',
    min: 10,
    max: 3000,
    defaultValue: 500
  },
  magnitude: {
    name: 'Magnitude',
    description: 'Maximum magnitude of the noise (as % of period)',
    type: 'slider',
    exponential: true,
    unit: '%',
    min: 4,
    max: 4000,
    defaultValue: 80
  },
  type: {
    name: 'Noise type',
    description: 'How noise is applied to input values',
    type: 'select',
    options: ['linear', 'radial'],
    defaultValue: 'linear',
    value: 'linear'
  },
  octaves: {
    name: 'Octaves',
    description: 'How many levels of high frequency (and lower amplitude) noise to add',
    type: 'slider',
    unit: 'levels',
    min: 1,
    max: 8,
    defaultValue: 3
  },
  seed: {
    name: 'Seed',
    description: 'The numberic seed to use in the pseudo-random number generator',
    type: 'number',
    defaultValue: 0
  }
};

var noiseSettings = {};

var positionOptions = {
  horizontal: {
    name: 'Horizontal',
    description: 'Number of pixels to shift right horizontally',
    type: 'slider',
    unit: 'pixels',
    min: -1000,
    max: 1000,
    defaultValue: 0
  },
  vertical: {
    name: 'Vertical',
    description: 'Number of pixels to shift up vertically',
    type: 'slider',
    unit: 'pixels',
    min: -1000,
    max: 1000,
    defaultValue: 0
  },
  angle: {
    name: 'Angle',
    description: 'Angle to rotate',
    type: 'slider',
    unit: 'degrees',
    min: 0,
    max: 90,
    defaultValue: 0
  }
};

var positionSettings = {};

var baseFunctions;
var baseFunctionsSettings = {};
var colorFunctions;
var colorFunctionsSettings = {};

// Preview stuff
var gCurrentTaskID = 0;
var gPreviewWaitTimer = 0;
var previewWorker;
var previewContexts = [
  {width: 150, height: 100, scale: 4},
  {width: 300, height: 200, scale: 2},
  {width: 600, height: 400, scale: 1}
];


// Generate a new preview, but pause 200ms to make sure
// we are not getting rapid updates
function NewPreviewRequest() {
  if (gPreviewWaitTimer) {
    clearTimeout(gPreviewWaitTimer);
  }
  gPreviewWaitTimer = setTimeout(function() {
    //  Tell the preview worker to disreguard it's current task (if any)
    //  and start work on a new one with new options
    gCurrentTaskID++;
    gPreviewWaitTimer = 0;    
    previewWorker.postMessage({
      command:    'newtask', 
      taskID:     gCurrentTaskID,
      options:    makeOptionsObject()
    });
  }, 200);
}

function onPreviewWorkerMessage(e) {

  if (e.data.type == 'result') {
    // If we get spurious data from a canceled task, ignore it
    if (e.data.taskID != gCurrentTaskID) return;
    
    var imageID = e.data.imageID;
    previewContexts[imageID].context.putImageData(e.data.imagedata, 0, 0);
    var hurl = previewContexts[imageID].canvas.toDataURL();
    $('#previewImage').attr('src', hurl);
  }
  
}


// Wrap up all settings into one object to be shipped of to the
// web worker, or put on the URL for a large image page
function makeOptionsObject() {
  var baseFunction = $('#baseFunctionSelect').val(),
      colorFunction = $('#colorFunctionSelect').val();
      
  return {
    baseFunction: baseFunction,
    baseFunctionOptions: baseFunctionsSettings[baseFunction],
    colorFunction: colorFunction,
    colorFunctionOptions: colorFunctionsSettings[colorFunction],
    perlinOptions: {
      octaves: noiseSettings.octaves,
      period: noiseSettings.period,
      magnitude: noiseSettings.magnitude * noiseSettings.period / 100,
      type: noiseSettings.type,
      seed: noiseSettings.seed
    },
    positionOptions: positionSettings
  }
  
}


$(function() {
  var settingsBlock, blockID,
      previewInfo = [];               // Info to provide about previews to web worker
  
  if (typeof window.Worker == "undefined") {
    $('#errorMsg').text("Your browser does not support web workers.  Try Google Chrome.");
    return;
  }
  
  if (typeof window.HTMLCanvasElement == "undefined") {
    $('#errorMsg').text("Your browser does not canvas.  Try Google Chrome.");
    return;
  }
  
  for (var i=0; i < previewContexts.length; i++) {
    var element = document.createElement('canvas');
    element.id = 'canvas' + 0;
    element.width = previewContexts[i].width;
    element.height = previewContexts[i].height;
    
    previewContexts[i].canvas = element;
    previewContexts[i].context = element.getContext('2d');
    previewContexts[i].imagedata = previewContexts[i].context.createImageData(element.width,element.height);
    
    previewInfo.push({
      imageID: i,
      imagedata: previewContexts[i].imagedata,
      width: previewContexts[i].width,
      height: previewContexts[i].height,
      scale: previewContexts[i].scale
    });

  }

  // Fire up the preview generation worker script
  previewWorker = new Worker("preview-worker.js");
  previewWorker.onmessage = onPreviewWorkerMessage;
  previewWorker.postMessage( {command: 'initialize', previewInfo: previewInfo} );
  
  SettingsOptions.registerListener(NewPreviewRequest);

  noiseSettings = SettingsOptions.getDefaultSettings(noiseOptions);
  SettingsOptions.makeControls('noiseOptions', noiseOptions, noiseSettings);
  
  positionSettings = SettingsOptions.getDefaultSettings(positionOptions);
  SettingsOptions.makeControls('positionOptions', positionOptions, positionSettings);
  
  baseFunctions = PerlinTubulence.getBaseFunctions();
  $.each(baseFunctions, function(key, baseFunction) {
     $('#baseFunctionSelect')
         .append($("<option></option>")
         .attr("value",key)
         .text(baseFunction.name));
     blockID = 'baseFunction' + key;
     $settingsBlock = $('<div id="' + blockID + '" class="baseFunctionSettings settingsBlock">');
     $('#baseFunctionBlocks').append($settingsBlock);
     
     baseFunctionsSettings[key] = SettingsOptions.getDefaultSettings(baseFunction.options);
     SettingsOptions.makeControls(blockID, baseFunction.options, baseFunctionsSettings[key]);
     
  });

  colorFunctions = PerlinTubulence.getColorFunctions();
  $.each(colorFunctions, function(key, colorFunction) {
     $('#colorFunctionSelect')
         .append($("<option></option>")
         .attr("value",key)
         .text(colorFunction.name));
     blockID = 'colorFunction' + key;
     $settingsBlock = $('<div id="' + blockID + '" class="colorFunctionSettings settingsBlock">');
     $('#colorFunctionBlocks').append($settingsBlock);
     
     colorFunctionsSettings[key] = SettingsOptions.getDefaultSettings(colorFunction.options);
     SettingsOptions.makeControls(blockID, colorFunction.options, colorFunctionsSettings[key]);
     
  });

  showActiveBaseFunction();
  $('#baseFunctionSelect').change(function(e) {
    showActiveBaseFunction();
    NewPreviewRequest();
  });

  showActiveColorFunction();
  $('#colorFunctionSelect').change(function(e) {
    showActiveColorFunction();
    NewPreviewRequest();
  });

  $('#optionsTabs').makeTabs();
  
  NewPreviewRequest();
  
  $('#createImage').click(function(e) {
    NewImageWindow();
  });
  
});

function NewImageWindow() {
  var options = makeOptionsObject();
  options.width = $('#imageWidth').val();
  options.height = $('#imageHeight').val();
  options.scale = 600 / options.width;
  var optionsString = encodeURIComponent(JSON.stringify(options));
  window.open('http://localhost/perlin/image.html?options=' + optionsString);
}

function showActiveBaseFunction() {
  var id = $('#baseFunctionSelect').val();
  $('.baseFunctionSettings').hide();
  $('#baseFunction' + $('#baseFunctionSelect').val()).show();
}

function showActiveColorFunction() {
  var id = $('#colorFunctionSelect').val();
  $('.colorFunctionSettings').hide();
  $('#colorFunction' + $('#colorFunctionSelect').val()).show();
}

})();
