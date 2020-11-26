// The faster the user moves their mouse
// the larger the circle will be
// We dont want it to be larger/smaller than this
tool.maxDistance = 2;
tool.maxDistance = 80;

// Each user has a unique session ID
// We'll use this to keep track of paths
var sessionId = socket.id;

// Returns an object specifying a semi-random color
function randomColor() {
  
  return {
    hue: Math.random() * 360,
    saturation: 0.8,
    brightness: 0.8,
    alpha: 0.5
  };

}

// An object to keep track of each users paths
// We'll use session ID's as keys
paths = {};

const object = {
  start: {
    point: { x: 454.015625, y: 685 },
    color: {
      hue: 287.18221728616436,
      saturation: 0.8,
      brightness: 0.8,
      alpha: 0.5
    }
  },
  middle: [
    { top: { x: 452.015625, y: 688 }, bottom: { x: 457.015625, y: 687 } },
    { top: { x: 454.015625, y: 696 }, bottom: { x: 461.015625, y: 691 } },
    { top: { x: 460.515625, y: 697.5 }, bottom: { x: 460.515625, y: 696.5 } },
    { top: { x: 460.515625, y: 698.5 }, bottom: { x: 462.515625, y: 697.5 } },
    { top: { x: 462.015625, y: 700 }, bottom: { x: 463.015625, y: 699 } }
  ],
  end: { x: 463.015625, y: 700 }
}

var id;
function makeId(){
  return Math.random().toString(36).substring(7);
}

var test = $('#test');
test.on("click", function(e) {
  socket.emit('getDrawings')
})
// -----------
// User Events
// -----------

// The user started a path
function onMouseDown(event) {
  id = makeId();
  // Create the new path
  color = randomColor();

  paths[sessionId] = new Path();
  paths[sessionId].fillColor = color;
  paths[sessionId].add(event.point);

  // Inform the backend
  socket.emit("startPath", { point: event.point, color: color }, sessionId, id);

}

function onMouseDrag(event) {

  var step        = event.delta / 2;
  step.angle     += 90; 
  var top         = event.middlePoint + step;
  var bottom      = event.middlePoint - step;

  var path = paths[sessionId];
  path.add(top);
  path.insert(0, bottom);


  // Inform the backend
  socket.emit("continuePath", {top: top, bottom: bottom}, sessionId, id);

}

function onMouseUp(event) {

  var path = paths[sessionId];
  path.add(event.point);
  path.closed = true;
  path.smooth();

  delete paths[sessionId]

  // Inform the backend
  socket.emit("endPath", {point: event.point}, sessionId, id);

}

// -----------------
// On
// Draw other users paths
// -----------------

socket.on('getDrawings', function(data) {
  function draw(object){
    paths[sessionId] = new Path();
    paths[sessionId].fillColor = object.start.color;
    paths[sessionId].add(object.start.point);
    object.middle.map(function(obj){
      paths[sessionId].add(obj.top);
      paths[sessionId].insert(0, obj.bottom);
      view.draw();
    })
    paths[sessionId].add(object.end);
    paths[sessionId].closed = true;
    paths[sessionId].smooth();
    view.draw();
  }
  
  data.forEach(function(value){
    for(var property in value){
      var drawing = value[property]
      draw(drawing);
    }
  })
})

socket.on( 'startPath', function( data, sessionId ) {
  
  color = randomColor();

  paths[sessionId] = new Path();
  paths[sessionId].fillColor = data.color;
  paths[sessionId].add(data.point);
  
})


socket.on( 'continuePath', function( data, sessionId ) {

  var path = paths[sessionId];
  path.add(data.top);
  path.insert(0, data.bottom);
  view.draw();
  
})


socket.on( 'endPath', function( data, sessionId ) {

  var path = paths[sessionId];
  path.add(data.point);
  path.closed = true;
  path.smooth();
  delete paths[sessionId];
  view.draw();
  
})
