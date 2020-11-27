var path = require('path');
var http = require('http');
var express = require('express');
var socketIO = require('socket.io');

var { User } = require('./utils/users.js');
var { Drawings } = require('./utils/state.js');

var port = process.env.PORT || 3000;
var app = express();

var server = http.createServer(app);
var io = socketIO(server);
var users = new User();
var drawings = new Drawings();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname,'/views'));
app.use(express.static(path.join(__dirname,'./public')));
 
app.get('/', function(req, res, next){
  res.render('index');
});

app.get('/chat', function(req, res, next){
  res.render('chat');
});

var realString = str => {
  return typeof str === 'string' && str.trim().length > 0;
}

io.on('connection', (socket) => {
  
  socket.on('join', ( params, callback ) => {
    params.room = params.room.toLowerCase();
    if( !realString(params.name) || !realString(params.room) ){
      return callback('Input should be valid');
    }
    if( users.getUsername(params.name, params.room) ){
      return callback('Username already Exists, Pick another ');
    }
    
    socket.join(params.room);
    users.removeUser(socket.id);
    var usersExists = users.users.length
    if(usersExists){
      users.addUser(socket.id, params.name, params.room, false);
    } else {
      users.addUser(socket.id, params.name, params.room, true);
    }
    
    io.to(params.room).emit('updateUserList', users.getUserList(params.room));
    callback();
  });

  socket.on('startPath', (data, sessionId, id) => {
    drawings.addStartDrawing(data, id);
    socket.broadcast.emit('startPath', data, sessionId, id);
  })

  socket.on('continuePath', (data, sessionId, id) => {
    drawings.addMiddleDrawing(data, id)
    socket.broadcast.emit('continuePath', data, sessionId, id);
  })

  socket.on('endPath', (data, sessionId, id) => {
    drawings.addEndDrawing(data, id)
    socket.broadcast.emit('endPath', data, sessionId, id);
  })

  socket.on('getDrawings', () => {
    socket.emit('getDrawings', drawings.drawings);
  })

  socket.on('allowUserEdit', (id) => {
    users.allowEdit(id);
    io.to('main').emit('updateUserList', users.users);
  })

  socket.on('disconnect', () => {
    var user = users.removeUser(socket.id);
    if(!user) return;
    if(user.isAdmin) users.selectNewAdmin()
    io.to(user.room).emit('updateUserList', users.users);
  });

});

server.listen(port, function(){
  console.log(`Server started at port ${port} `);
});