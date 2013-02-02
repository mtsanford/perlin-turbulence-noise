
importScripts("perlin.js");
importScripts("basefunctions.js");
importScripts("colorfunctions.js");

var gPreviewInfo;

var gCurrentTaskID;
var gBaseFunction;
var gColorFunction;

self.onmessage = function (e) {
  var command = e.data.command;

  switch (command) {
    case 'initialize':
      gPreviewInfo = e.data.previewInfo;
      break;
    case 'newtask':
      newTask(e.data);
      break;
    case 'echo':
      self.postMessage( {type: 'echo', data: e.data.data} );
      break;
  }
   
};

function newTask(command) {
  gCurrentTaskID = command.taskID;
  makePreviews(command.taskID, command.options);
}

function makePreviews(taskID, options) {
  gBaseFunction = PerlinTubulence.makeBaseFunction(options.baseFunction, options.baseFunctionOptions);
  gColorFunction = PerlinTubulence.makeColorFunction(options.colorFunction, options.colorFunctionOptions);
  
  function makePreview(i, startY) {
    setTimeout(function() {
      if (taskID != gCurrentTaskID)
        return;
        
      var imagedata = gPreviewInfo[i].imagedata;
      
      // Do a max 50 lines at a time
      // TODO: Make this based on time
      var numLines = Math.min(50, gPreviewInfo[i].height - startY);
      PerlinTubulence.makeImageSlice(imagedata.data, gBaseFunction, gColorFunction, options.perlinOptions,
        gPreviewInfo[i].width, gPreviewInfo[i].height, gPreviewInfo[i].scale, startY, numLines);
      
      startY += numLines;
      if (startY >= gPreviewInfo[i].height) {
        self.postMessage({ type: 'result', taskID: taskID, imageID: gPreviewInfo[i].imageID, imagedata: imagedata});
        i = i+1;
        startY = 0;
      }
      
      if (i < gPreviewInfo.length) {
        makePreview(i, startY);
      }
    }, 0);
  };
  
  makePreview(0, 0);
}


