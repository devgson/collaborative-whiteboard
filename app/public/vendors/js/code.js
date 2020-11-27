var socket = io();
var sessionId = socket.id;
var id;
paths = {};
tool.maxDistance = 2;
tool.maxDistance = 80;

socket.on('connect', function(){
  var params = $.deparam(window.location.search);

  socket.emit('join', params, function (err){
    if(err){
      alert(err);
      window.location.href = "/";
    }
    socket.emit('getDrawings');
  });

});

socket.on('updateUserList', function(users){
  var ol = $('<ol></ol>');
  var admin = users.filter(function(user){ return user.isAdmin })[0];
  var nonAdmins = users.filter(function(user){ return !user.isAdmin });

  var li = $('<li></li>').text(admin.name);
  li.append($('<small class="bg-success float-right p-1 rounded">Admin</small>'));
  ol.append(li);
  nonAdmins.forEach(function(user){
    var li = $('<li></li>').text(user.name);
    if(admin.id === socket.id && !user.canEdit){
      li.append($("<button data-id="+ user.id +" class='btn-sm btn-danger float-right p-1 permit'>Allow draw</button>"));
      $(li).on('click', '.permit', function(event){
        var target = $(event.target)
        var id = target.data('id');
        socket.emit('allowUserEdit', id);
      });
    }
    ol.append(li);
  });
  $('#users').html(ol);
});

socket.on('disconnect', function(){
  console.log('Disconnected from server');
});



function randomColor() {
  return {
    hue: Math.random() * 360,
    saturation: 0.8,
    brightness: 0.8,
    alpha: 0.5
  };
}

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

function makeId(){
  return Math.random().toString(36).substring(7);
}

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
