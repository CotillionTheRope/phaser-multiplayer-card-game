const server = require('express')();
const http = require('http').createServer(server);
const cors = require('cors');
const path = require('path');
const serveStatic = require('serve-static');
const shuffle = require('shuffle-array');

let players = {};
let rooms = [];
let booleansPlayed = 0;
let readyCheck = 0;
let gameState = 'Initializing';

const io = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST']
  }
});

// Uncomment to use the built version of the client.
// server.use(cors());
// server.use(serveStatic(__dirname + '/client/dist'));

io.on('connection', function (socket) {
  console.log('User Connected: ' + socket.id);

  players[socket.id] = {
    inDeck: [],
    inHand: [],
    currentRoom: null,
    bp: 0,
    variables: 0,
    isPlayerA: false
  }

  socket.emit('connected', rooms);

  socket.on('joinRoom', (roomId) => {
    console.log('joining room');
    socket.join(roomId);
    if (roomId === socket.id) {
      console.log('joining new room');
      const room = {
        'id': socket.id,
        'players': [{'id': socket.id}]
      }

      rooms.push(room);
    } else {
      console.log('joining existing room');
      const existingRoom = rooms.find(aRoom => aRoom.id === roomId);
      existingRoom.players.push({'id': socket.id});
    }

    players[socket.id].currentRoom = roomId;

    console.log(rooms);

    const room = rooms.find(aRoom => aRoom.id === roomId);
    if (room.players.length < 2) {
      players[socket.id].isPlayerA = true;
    }

    socket.emit('roomJoined', room);

  });

  socket.on('disconnect', () => {
    for (let i in rooms) {
      const player = rooms[i].players.find(player => player.id === socket.id);
      if (player !== -1) {
        rooms[i].players.splice(player, 1);
      }
    }

    delete players[socket.id];
    console.log(rooms);
  })

  socket.on('dealDeck', function(socketId) {
    players[socketId].inDeck = shuffle(['boolean', 'ping']);

    if (Object.keys(players) < 2) return;
    io.to(players[socketId].currentRoom).emit('changeGameState', 'Initializing');
  });

  socket.on('dealCards', function(socketId) {
    for (let i = 0; i < 5; ++i) {
      if (players[socketId].inDeck.length === 0) {
        players[socketId].inDeck = shuffle(['boolean', 'ping']);
      }

      players[socketId].inHand.push(players[socketId].inDeck.shift());
    }

    console.log(players);
    io.to(players[socketId].currentRoom).emit('dealCards', socketId, players[socketId].inHand);
    ++readyCheck;

    if (readyCheck >= 2) {
      gameState = 'Ready';
      io.to(players[socketId].currentRoom).emit('changeGameState', 'Ready');
    }
  });

  socket.on('cardPlayed', function(cardName, socketId) {
    io.to(players[socketId].currentRoom).emit('cardPlayed', cardName, socketId);

    if (cardName === 'ping') {
      for(let [key, value] of Object.entries(players)) {
        if (key === socketId) {
          value.bp += 2;
          value.variables++;
        } else {
          value.bp -= 1;
        }
      }

      io.to(players[socketId].currentRoom).emit('playerValuesChanged', players);
    } else if (cardName === 'boolean') {
      if (booleansPlayed === 0) {
        players[socketId].bp += 4;
      } else {
        players[socketId].bp -= 2;
      }

      booleansPlayed++;
      players[socketId].variables++;
      io.to(players[socketId].currentRoom).emit('playerValuesChanged', players);
    }

    io.to(players[socketId].currentRoom).emit('changeTurn');
  })
});

const port = process.env.PORT || 9742;

http.listen(port, function() {
  console.log('server started');
});
