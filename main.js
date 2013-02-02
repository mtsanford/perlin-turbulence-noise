
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
    min: 1,
    max: 2000,
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

var gCurrentTaskID = 0;
var gPreviewWaitTimer = 0;
var previewWorker;
var previewContexts = {
  hidden1: {},
  hidden2: {},
  hidden3: {}
};

var baseFunctions;
var baseFunctionsSettings = {};
var colorFunctions;
var colorFunctionsSettings = {};

var activeTab = 'noiseSettingsBlock';


// Generate a new preview, but pause 200ms to make sure
// we are not getting rapid updates
function NewPreviewRequest() {
  if (gPreviewWaitTimer) {
    clearTimeout(gPreviewWaitTimer);
  }
  gPreviewWaitTimer = setTimeout(function() {
    WorkerPreview();
    gPreviewWaitTimer = 0;
  }, 200);
}

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
    }
  }
  
}

/*
 *  Tell the preview worker to disreguard it's current task (if any)
 *  and start work on a new one with new options
 */
function WorkerPreview() {

  gCurrentTaskID++;
  
  previewWorker.postMessage({
    command:    'newtask', 
    taskID:     gCurrentTaskID,
    options:    makeOptionsObject(),
  });
  
}

function onPreviewWorkerMessage(e) {

  if (e.data.type == 'result') {
    // If we get spurious data from a canceled task, ignore it
    if (e.data.taskID != gCurrentTaskID) return;
    
    var imageID = e.data.imageID;
    previewContexts[imageID].context.putImageData(e.data.imagedata, 0, 0);
    var hurl = previewContexts[imageID].element.toDataURL();
    $('#previewImage').attr('src', hurl);
  }
  
}



$(function() {
  var settingsBlock, blockID, previewInfo = [];
  
  for (var id in previewContexts) {
    var element = document.getElementById(id);
    previewContexts[id].context = element.getContext('2d');
    previewContexts[id].imagedata = previewContexts[id].context.createImageData(element.width,element.height);
    previewContexts[id].width = element.width;
    previewContexts[id].height = element.height;
    previewContexts[id].element = element;
    
    previewInfo.push({
      imageID: id,
      imagedata: previewContexts[id].imagedata,
      width: element.width,
      height: element.height,
      scale: 600 / element.width
    });

  }

  // Fire up the preview generation worker script
  previewWorker = new Worker("preview-worker.js");
  previewWorker.onmessage = onPreviewWorkerMessage;
  previewWorker.postMessage( {command: 'initialize', previewInfo: previewInfo} );
  
  SettingsOptions.registerListener(NewPreviewRequest);

  noiseSettings = SettingsOptions.getDefaultSettings(noiseOptions);
  SettingsOptions.makeControls('noiseOptions', noiseOptions, noiseSettings);
  
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
    WorkerPreview();
  });

  showActiveColorFunction();
  $('#colorFunctionSelect').change(function(e) {
    showActiveColorFunction();
    NewPreviewRequest();
  });

  $('#drawButton').click(function(e) {
    NewPreviewRequest();
  });

  setActiveTab('noiseTab');
  
  $('.settingsTab').click(function() {
    setActiveTab($(this).attr('id'));
  });
  
  WorkerPreview();
  
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

function setActiveTab(tabID) {
  switch(tabID) {
    case 'noiseTab':
      activeBlock = 'noiseSettingsBlock';
      break;
    case 'baseTab':
      activeBlock = 'baseSettingsBlock';
      break;
    case 'colorTab':
      activeBlock = 'colorSettingsBlock';
      break;
  }
  $('.settingsTab').css({opacity:0.3});
  $('#' + tabID).css({opacity:1});
  $('.settingsBlockWrapper').hide();
  $('#' + activeBlock).show();
}

})();
