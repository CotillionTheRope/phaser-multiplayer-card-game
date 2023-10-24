const server = require('express')();
const http = require('http').createServer(server);
const cors = require('cors');
const path = require('path');
const serveStatic = require('serve-static');
const shuffle = require('shuffle-array');
const { DateTime } = require('luxon');

let players = {};
let rooms = [];
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
  cleanUpRooms();

  players[socket.id] = {
    inDeck: [],
    inHand: [],
    currentRoom: null,
    bp: 0,
    variables: 0,
    isPlayerA: false
  }

  socket.emit('connected', rooms);

  socket.on('joinRoom', (roomId, newRoom) => {
    console.log('joining room');
    socket.join(roomId);
    if (roomId === socket.id || newRoom) {
      console.log(`player ${socket.id} creating new room`);
      const room = {
        'id': socket.id,
        'players': [{'id': socket.id}],
        'booleansPlayed': 0,
      };

      rooms.push(room);
    } else {
      console.log(`player ${socket.id} joining existing room ${roomId}`);
      const existingRoom = rooms.find(aRoom => aRoom.id === roomId);
      existingRoom.players.push({'id': socket.id});
    }

    players[socket.id].currentRoom = roomId;

    console.log(JSON.stringify(rooms));

    const room = rooms.find(aRoom => aRoom.id === roomId);
    if (room.players.length < 2) {
      players[socket.id].isPlayerA = true;
    }

    socket.emit('roomJoined', room);
    io.emit('roomsUpdate', rooms);
  });

  socket.on('disconnect', () => {
    console.log(`player ${socket.id} disconnecting.`);
    console.log(JSON.stringify(rooms));
    for (let i in rooms) {
      const player = rooms[i].players.findIndex(player => player.id === socket.id);
      if (player !== -1) {
        console.log(`player ${socket.id} leaving room ${rooms[i].id}`);
        rooms[i].players.splice(player, 1);
        if (!rooms[i].players.length) {
          rooms[i].exp = DateTime.now().plus({ minutes: 5 });
        }
        io.to(rooms[i].id).emit('playerLeftRoom');
      }
    }

    delete players[socket.id];
    console.log(JSON.stringify(rooms));
    io.emit('roomsUpdate', rooms);
  })

  socket.on('dealDeck', (socketId) => {
    let currentRoom = rooms.find(room => room.id === players[socketId].currentRoom);

    players[socketId].inDeck = shuffle(['boolean', 'ping']);
    if (currentRoom.players.length < 2) return;
    io.to(players[socketId].currentRoom).emit('changeGameState', 'Initializing');
  });

  socket.on('dealCards', (socketId) => {
    for (let i = 0; i < 5; ++i) {
      if (players[socketId].inDeck.length === 0) {
        players[socketId].inDeck = shuffle(['boolean', 'ping']);
      }

      players[socketId].inHand.push(players[socketId].inDeck.shift());
    }

    io.to(players[socketId].currentRoom).emit('dealCards', socketId, players[socketId].inHand);
    ++readyCheck;

    if (readyCheck >= 2) {
      gameState = 'Ready';
      io.to(players[socketId].currentRoom).emit('changeGameState', 'Ready');
    }
  });

  socket.on('cardPlayed', (cardName, socketId) => {
    io.to(players[socketId].currentRoom).emit('cardPlayed', cardName, socketId);
    let roomPlayers = {};
    let room = rooms.find(aRoom => aRoom.id === players[socketId].currentRoom);
    let pointsChanged = false;
    console.log(room);

    if (cardName === 'ping') {
      for(let [key, value] of Object.entries(players)) {
        if (key === socketId) {
          value.bp += 2;
          value.variables++;
        } else {
          value.bp -= 1;
        }
      }

      pointsChanged = true;

    } else if (cardName === 'boolean') {
      if (room.booleansPlayed === 0) {
        players[socketId].bp += 4;
      } else {
        players[socketId].bp -= 2;
      }

      room.booleansPlayed++;
      players[socketId].variables++;
      pointsChanged = true;
    }

    if (pointsChanged) {
      room.players.forEach(player => {
        roomPlayers[player.id] = {'bp': players[player.id].bp, 'variables': players[player.id].variables};
      });

      io.to(players[socketId].currentRoom).emit('playerValuesChanged', roomPlayers);
    }

    io.to(players[socketId].currentRoom).emit('changeTurn');
  });

  socket.on('resetRoom', (socketId) => {
    players[socketId].inDeck = [];
    players[socketId].inHand = [];
    players[socketId].bp = 0;
    players[socketId].variables = 0;
    players[socketId].isPlayerA = true;

    let room = rooms.find(aRoom => aRoom.id === players[socketId].currentRoom);
    room.booleansPlayed = 0;

    let emptyPlayer = {
      bp: 0,
      variables: 0
    };

    io.to(players[socketId].currentRoom).emit('playerValuesChanged', [players[socketId], emptyPlayer]);
  });
});

function cleanUpRooms() {
  roomsStart = rooms.length;
  rooms = rooms.filter(room => !room.exp || room.exp > DateTime.now());
  roomsEnd = rooms.length;
  console.log(`${roomsStart} became ${roomsEnd}`);
  io.emit('roomsUpdate', rooms);
}

const port = process.env.PORT || 9742;

http.listen(port, function() {
  console.log('server started');
});
