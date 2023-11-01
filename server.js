const server = require('express')();
const http = require('http').createServer(server);
const cors = require('cors');
const path = require('path');
const serveStatic = require('serve-static');
const shuffle = require('shuffle-array');
const { DateTime } = require('luxon');

let players = {};
let rooms = [];
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

  /**
   * When a new connection is created, emit the connected event and supply
   * the current list of rooms.
   *
   * @emits connected Socket specific event
   *   @param rooms The current array of rooms.
   */
  socket.emit('connected', rooms);

  /**
   * When a socket requests to join a room.
   * If newRoom is true, or the supplied roomId is the same as
   * the socket's id, initializes and creates a new room and adds
   * the room to the rooms array.
   * Otherwise joins the room and adds the current socketId as a player
   * in the room's players array. Also resets the rooms expiration datetime
   * to null.
   *
   * Sets the players current room to the roomId, sets the player as
   * playerA if they are the first in the room, and emits the roomJoined
   * event back to the socket passing the room info back.  Also emits the
   * roomsUpdate event with the current array of rooms to the server.
   *
   * @param roomId The ID of the room to join.
   * @param newRoom Boolean variable indicating if this is a new room.
   *
   * @emits roomJoined socket specific event.
   *   @param room The room joined.
   *
   * @emits roomsUpdate Server event.
   *  @param rooms The current array of rooms.
   */
  socket.on('joinRoom', (roomId, newRoom) => {
    console.log('joining room');
    socket.join(roomId);
    if (roomId === socket.id || newRoom) {
      console.log(`player ${socket.id} creating new room`);
      const room = {
        'id': socket.id,
        'players': [{'id': socket.id}],
        'booleansPlayed': 0,
        'exp': null,
        'readyCheck': 0,
        'gameState':'Initializing',
      };

      rooms.push(room);
    } else {
      console.log(`player ${socket.id} joining existing room ${roomId}`);
      const existingRoom = rooms.find(aRoom => aRoom.id === roomId);
      existingRoom.players.push({'id': socket.id});
      existingRoom.exp = null;
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

  /**
   * When a player disconnects, if they were in a room remove them from the room's
   * players array and delete the player information in the server's players list.
   *
   * If the player was removed from a room:
   *  - emits the 'playerLeftRoom' event to that room and if they were the last player
   *    in the room sets the room's exp datetime.
   *  - emits the 'roomsUpdate' event to the server.
   *
   * @emits playerLeftRoom room specific event.
   *
   * @emits roomsUpdate Server event.
   *  @param rooms The current array of rooms.
   */
  socket.on('disconnect', () => {
    console.log(`player ${socket.id} disconnecting.`);
    console.log(JSON.stringify(rooms));
    for (let i in rooms) {
      const player = rooms[i].players.findIndex(player => player.id === socket.id);
      if (player !== -1) {
        console.log(`player ${socket.id} leaving room ${rooms[i].id}`);
        rooms[i].readyCheck = 0;
        rooms[i].players.splice(player, 1);
        if (!rooms[i].players.length) {
          rooms[i].exp = DateTime.now().plus({ minutes: 5 });
        }
        io.to(rooms[i].id).emit('playerLeftRoom');
        io.emit('roomsUpdate', rooms);
      }
    }

    delete players[socket.id];
    console.log(JSON.stringify(rooms));

  });

  /**
   * On the 'dealDeck' event, sets up the player's deck and if there
   * are two players in the room emits the 'changeGameState' event
   * to the room.
   *
   * @emits changeGameState room specific event.
   *  @param gameState Sends the 'Initializing' game state.
   */
  socket.on('dealDeck', (socketId) => {
    let currentRoom = rooms.find(room => room.id === players[socketId].currentRoom);

    players[socketId].inDeck = shuffle(['boolean', 'ping']);
    if (currentRoom.players.length < 2) return;
    io.to(players[socketId].currentRoom).emit('changeGameState', 'Initializing');
  });

  /**
   * On the 'dealCards' event, add cards from the player's
   * deck into their hand. Emits the 'dealCards' event to the
   * player's room, sending the player's hand along and incrementing
   * the room's readyCheck count.  If all players are ready, emits
   * the 'changeGameState' event.
   *
   * @emits dealCards room specific event.
   *  @param socketId The current player's socket Id.
   *  @param players[socketId].inHand The player's hand.
   *
   * @emits changeGameState room specific event.
   *  @param gameState Sends the 'Ready' game state.
   */
  socket.on('dealCards', (socketId) => {
    let currentRoom = rooms.find(room => room.id === players[socketId].currentRoom);

    for (let i = 0; i < 5; ++i) {
      if (players[socketId].inDeck.length === 0) {
        players[socketId].inDeck = shuffle(['boolean', 'ping']);
      }

      players[socketId].inHand.push(players[socketId].inDeck.shift());
    }

    io.to(players[socketId].currentRoom).emit('dealCards', socketId, players[socketId].inHand);
    ++currentRoom.readyCheck;

    if (currentRoom.readyCheck >= 2) {
      currentRoom.gameState = 'Ready';
      io.to(players[socketId].currentRoom).emit('changeGameState', 'Ready');
    }
  });

  /**
   * On the 'cardPlayed' event, emits the 'cardPlayed' event to the room
   * passing along the card name and the id of the player who played the card.
   * Then updates player points based on the name of the card played and if the score
   * values changed emits the 'playerValuesChanged' event to the room. Always
   * emits the 'changeTurn' event at the end.
   *
   * @emits cardPlayed room specific event.
   *  @param cardName The name of the card played.
   *  @param socketId The id of the player who played the card.
   *
   * @emits playerValuesChanged room specific event.
   *  @param roomPlayers An object with keys for the players in the room and
   *  the point values for each.
   *
   * @emits changeTurn room specific event.
   */
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
    room.readyCheck = 0;
    room.gameState = 'Initializing';

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
