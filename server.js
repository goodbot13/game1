const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use('/libs', express.static('client/dist/libs'));
app.use('/', express.static('client/dist'));

app.get('/', (req, res) => {
  res.sendFile('/index.html');
});

io.sockets.on('connection', (socket) => {

  socket.userData = { 
    x: 0, 
    y: 0, 
    z: 0, 
    heading: 0 
  }

  socket.emit('setId', { 
    id: socket.id 
  });

  console.log(socket.id);  

  socket.on('disconnect', () => {
    socket.broadcast.emit('deletePlayer', {
      id: socket.id
    });
  });

  socket.on('init', (data) => {
    /* socket.userData = {
      action: 'Idle',
      model, color, x, y, z, heading, pb
    } */

    console.log('init', socket.userData);
  });

  socket.on('update', ({ x, y, z, heading, pb, action }) => {
    socket.userData = {
      ...socket.userData,
      x, y, z, heading, pb, action
    }
  });
});

http.listen(2002, () => {
  console.log('Server up');
});
/* 
setInterval(() => {
  const pack = [];
  let ns = io.of("/");

  const socketIdsArray = Object.keys(io.sockets.sockets);

  socketIdsArray.forEach((socketId) => {
    ns.connected[socketId];
  });

  console.log(ns.connected[socketIdsArray[0]]?.userData);

  if (pack.length) {
    io.emit('remoteData', pack);
  }
}, 40); */