var path = require('path');
var http = require('http');
var mongoose = require('mongoose');
var express = require('express');
var socketIO = require('socket.io');

var { User } = require('./utils/users.js');
var { Drawings } = require('./utils/state.js');

mongoose.connect('mongodb+srv://admin:admin@cluster0.xvhnn.mongodb.net/icc?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
})
  .then(result => {
    console.log('Database connection established')
  })
  .catch(err => {
    console.log(err)
  })

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

app.get('/whiteboard', function(req, res, next){
  res.render('whiteboard');
});

var realString = str => {
  return typeof str === 'string' && str.trim().length > 0;
}

io.on('connection', (socket) => {
  
  socket.on('join', async ( params, callback ) => {
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
    
    const savedDrawings = await drawings.getSavedWhiteboards();
    io.to(params.room).emit('updateUserList', users.getUserList(params.room), savedDrawings);
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

  socket.on('allowUserEdit', async (id) => {
    const savedDrawings = await drawings.getSavedWhiteboards();
    users.allowEdit(id);
    io.to('main').emit('updateUserList', users.users, savedDrawings);
  })

  socket.on('startSave', () => {
    io.to('main').emit('startSave', users.users)
  })

  socket.on('compileVote', (id, answer) => {
    users.addVote(answer);
    if(users.compileVotes.votesSoFar === users.users.length){
      if(users.compileVotes.yesVotes >= users.compileVotes.noVotes){
        drawings.saveWhiteboard()
          .then(async () => {
            const savedDrawings = await drawings.getSavedWhiteboards();
            users.resetVotes();
            io.to('main').emit('endSave', true);
            io.to('main').emit('updateUserList', users.users, savedDrawings);
          })
          .catch((err) => console.log(err));
      } else {
        users.resetVotes()
        io.to('main').emit('endSave', false);
      }
    }
  });

  socket.on('loadWhiteboard', async (id) => {
    try {
      const loadedDrawing = await drawings.getWhiteboard(id);
      if(loadedDrawing){
        drawings.drawings = loadedDrawing.drawings;
        io.to('main').emit('getDrawings', loadedDrawing.drawings);
      }
    } catch (error) {
      
    }
  })

  socket.on('disconnect', async () => {
    var user = users.removeUser(socket.id);
    if(!user) return;
    if(user.isAdmin) users.selectNewAdmin()
    const savedDrawings = await drawings.getSavedWhiteboards();
    io.to(user.room).emit('updateUserList', users.users, savedDrawings);
  });

});

server.listen(port, function(){
  console.log(`Server started at port ${port} `);
});