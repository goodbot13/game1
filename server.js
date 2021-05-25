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

  socket.on('disconnect', () => {
    socket.broadcast.emit('deletePlayer', {
      id: socket.id
    });
  });

  socket.on('init', ({ model, color, x, y, z, heading, pb }) => {
    socket.userData = {
      action: 'Idle',
      model, color, x, y, z, heading, pb
    }

    console.log('init model', model);
  });

  socket.on('update', ({ x, y, z, heading, pb, action }) => {
    socket.userData = {
      ...socket.userData,
      x, y, z, heading, pb, action
    }
  });

  socket.on('chat message', ({ message, id }) => {
    io.to(id).emit('chat message', { id: socket.id, message });
  });
});

http.listen(3075, () => {
  console.log('Server up');
});

setInterval(() => {
  const idsArray = [...io.sockets.adapter.rooms.values()].map((set) => Array.from(set)[0]);
  const pack = [];

  idsArray.forEach((id) => {
    const socket = io.sockets.sockets.get(id);

    if (socket.userData.model) {
      pack.push({
        id: socket.id,
        ...socket.userData
      });
    }
  });

  io.emit('remoteData', pack);
}, 17);