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

socket.on('updateUserList', function(users, savedDrawings){
  var ol = $("<ol class='list'></ol>");
  var admin = users.filter(function(user){ return user.isAdmin })[0];
  var nonAdmins = users.filter(function(user){ return !user.isAdmin });
  var currentUser = users.filter(function(user){ return user.id === socket.id })[0];
  var li;
  if(admin.id === currentUser.id){
    li = $('<li></li>').text(admin.name + '(You)');
  } else {
    li = $('<li></li>').text(admin.name);
  }
  if(currentUser.id === admin.id){
    ol.append($("<div class='text-center'><button class='btn-warning rounded save'>Save Whiteboard</button></div>"));
    $(ol).on('click', '.save', function(event){
      $(event.target).prop('disabled', true);
      $(event.target).css('background', '#F5F5F5');
      $(event.target).css('color', '#C3C3C3');
      socket.emit('startSave');
      alert('Vote collection has started')
    })
  }
  li.append($('<small class="bg-success float-right p-1 rounded">Admin</small>'));
  ol.append(li);
  nonAdmins.forEach(function(user){
    var li;
    if(user.id === socket.id){
      li = $('<li></li>').text(user.name + '(You)');
    }else {
      li = $('<li></li>').text(user.name);
    }
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

  if(currentUser.id === admin.id){
    var div = $("<div class=''><p class='text-center mb-0 mt-5 text-uppercase text-white'>Saved Whiteboards</p><p class='text-center text-info'>Click below to load a whiteboard</p></div>");
    var ul = $("<ul></ul>")
    savedDrawings.forEach(function(drawing){
      var li = $("<li></li>");
      var a = $("<a href='#' class='boards' data-id=" + drawing._id + "></a>").text(drawing._id);
      $(a).on('click', function(event){
        var target = $(event.target)
        var id = target.data('id');
        socket.emit('loadWhiteboard', id);
      });
      li.append(a);
      ul.append(li);
    })
    div.append(ul);
    ol.append(div);
  }

  if(currentUser.canEdit){
    $('#draw').css({pointerEvents: "auto"});
  }

  $('#users').html(ol);
});

socket.on('startSave', function(users) {
  var currentUser = users.filter(function(user){ return user.id === socket.id })[0];
  $("#dialog-confirm").toggleClass("d-none")
  $("#dialog-confirm").dialog({
    dialogClass: "no-close",
    resizable: false,
    height: "auto",
    width: 400,
    modal: true,
    buttons: {
      "Yes": function() {
        $(this).dialog( "close" );
        socket.emit('compileVote', currentUser.id, "yes");
        $("#dialog-confirm").toggleClass("d-none")
      },
      "No": function() {
        $(this).dialog( "close" );
        socket.emit('compileVote', currentUser.id, "no");
        $("#dialog-confirm").toggleClass("d-none")
      }
    }
  });
})

socket.on('endSave', function(result) {
  if(result === true){
    alert('Voting completed!, majority of users voted to save whiteboard')
  }
  if(result === false){
    alert('Voting completed!, majority of users voted not to save whiteboard')
  }
  var saveButton = $('.save')
  if(saveButton){
    saveButton.prop('disabled', false);
    saveButton.css({ 'background': '', 'color': '' });
  }
})

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
  project.activeLayer.removeChildren();
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
