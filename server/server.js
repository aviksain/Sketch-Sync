const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

app.use(express.static("./public"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on('connection', (socket) => {

  // for dwaring 
  socket.on('join-room', (slug) => {
    socket.join(slug);
  })

  socket.on('client-connect', ({ name, roomNumber }) => {
    console.log(`User ${name} connected to room ${roomNumber}`);
    socket.join(roomNumber);
    socket.to(roomNumber).emit('play-audio');

    emailToSocketIdMap.set(name, roomNumber);
    socketidToEmailMap.set(roomNumber, name);
    io.to(roomNumber).emit("user:joined", { name, id: socket.id });
    io.to(socket.id).emit("client-connect", { name, roomNumber });
  });

  socket.on('client-ready', (slug) => {
    if (slug) {
      socket.to(slug).emit('get-canvas-state');
    }
  });

  socket.on('canvas-state', (state,slug) => {
    if (slug) {
      socket.to(slug).emit('canvas-state-from-server', state);
    }
  });

  socket.on('draw-line', ({ prevPoint, currentPoint, color, lineWidth,slug }) => {
    if (slug) {
      socket.to(slug).emit('draw-line', { prevPoint, currentPoint, color, lineWidth });
    }
  });

  socket.on('clear-canvas', (slug) => {
    // const roomNumber = socket.roomNumber;
    // if (slug) {
      io.to(slug).emit('clear-canvas');
    // }
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected from room ${socket.roomNumber}`);
    // Additional cleanup or handling could be done here
  });


  // For WebRTC connection
  // socket.on("room:join", (data) => {
  //   const { email, room } = data;
  //   emailToSocketIdMap.set(email, socket.id);
  //   socketidToEmailMap.set(socket.id, email);
  //   io.to(room).emit("user:joined", { email, id: socket.id });
  //   socket.join(room);
  //   io.to(socket.id).emit("room:join", data);
  // });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});

server.listen(3001, () => {
  console.log('✔️ Server listening on port 3001 ✔️')
})


