const server = require('express')();
const http = require('http').createServer(server);
const cors = require('cors');
const path = require('path');
const serveStatic = require('serve-static');
const shuffle = require('shuffle-array');

let players = {};
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
    bp: 0,
    variables: 0,
    isPlayerA: false
  }

  if (Object.keys(players).length < 2) {
    players[socket.id].isPlayerA = true;
    io.emit('firstTurn');
  }

  socket.on('dealDeck', function(socketId) {
    players[socketId].inDeck = shuffle(['boolean', 'ping']);
    console.log(players);

    if (Object.keys(players) < 2) return;
    io.emit('changeGameState', 'Initializing');
  });

  socket.on('dealCards', function(socketId) {
    for (let i = 0; i < 5; ++i) {
      if (players[socketId].inDeck.length === 0) {
        players[socketId].inDeck = shuffle(['boolean', 'ping']);
      }

      players[socketId].inHand.push(players[socketId].inDeck.shift());
    }

    console.log(players);
    io.emit('dealCards', socketId, players[socketId].inHand);
    ++readyCheck;

    if (readyCheck >= 2) {
      gameState = 'Ready';
      io.emit('changeGameState', 'Ready');
    }
  });

  socket.on('cardPlayed', function(cardName, socketId) {
    io.emit('cardPlayed', cardName, socketId);

    if (cardName === 'ping') {
      for(let [key, value] of Object.entries(players)) {
        if (key === socketId) {
          value.bp += 2;
          value.variables++;
        } else {
          value.bp -= 1;
        }
      }

      io.emit('playerValuesChanged', players);
    } else if (cardName === 'boolean') {
      if (booleansPlayed === 0) {
        players[socketId].bp += 4;
      } else {
        players[socketId].bp -= 2;
      }

      booleansPlayed++;
      players[socketId].variables++;
      io.emit('playerValuesChanged', players);
    }

    io.emit('changeTurn');
  })
});

const port = process.env.PORT || 9742;

http.listen(port, function() {
  console.log('server started');
});
