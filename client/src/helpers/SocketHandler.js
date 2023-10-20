import io from 'socket.io-client';

export default class SocketHandler {
  constructor() {
    this.socket = io('http://localhost:9742');

    this.socket.on('connect', () => {
      console.log('Connected!');
    });
  }

  getSocketID() {
    return this.socket.id;
  }

  gameSceneSocketSetup(scene) {

    scene.socket = this.socket;

    scene.socket.emit('dealDeck', scene.socket.id);

    scene.socket.on('changeGameState', (gameState) => {
      scene.GameHandler.changeGameState(gameState);
      if (gameState === 'Initializing') {
        scene.DeckHandler.dealCard(1000, 860, 'cardBack', 'valueCard');
        scene.DeckHandler.dealCard(1000, 135, 'cardBack', 'opponentCard');
        scene.dealCards.setInteractive();
        scene.dealCards.setColor('#00ffff');
      }
    });

    scene.socket.on('changeTurn', () => {
      scene.GameHandler.changeTurn();
    });

    scene.socket.on('dealCards', (socketId, cards) => {
      if (socketId === scene.socket.id) {
        for (let i in cards) {
          scene.GameHandler.playerHand.push(scene.DeckHandler.dealCard(155 + (i * 155), 860, cards[i], 'playerCard'));
        }
      } else {
        for (let i in cards) {
          scene.GameHandler.opponentHand.push(scene.DeckHandler.dealCard(155 + (i * 155), 135, 'cardBack', 'opponentCard'));
        }
      }
    });

    scene.socket.on('cardPlayed', (cardName, socketId) => {
      if (socketId !== scene.socket.id) {
        scene.GameHandler.opponentHand.shift().destroy();
        scene.DeckHandler.dealCard((scene.dropZone.x - 350) + (scene.dropZone.data.values.cards * 50), scene.dropZone.y, cardName, 'opponentCard');
        scene.dropZone.data.values.cards++;
      }
    });

    scene.socket.on('playerValuesChanged', (players) => {
      console.log(scene.playerBPValue);
      for (const [key, value] of Object.entries(players)) {
        if (key === scene.socket.id) {
          scene.playerBPValue.setText(value.bp);
          scene.playerVaraiblesValue.setText(value.variables);
        }
        else {
          scene.opponentBPValue.setText(value.bp);
          scene.opponentVaraiblesValue.setText(value.variables);
        }
      }
    })
  }

  startSceneSocketSetup(scene) {
    scene.socket = this.socket;

    scene.socket.on('connected', (rooms) => {
      scene.roomId = scene.socket.id;
      if (rooms.length) {
        for (let i in rooms) {
          if (rooms[i].players.length < 2) {
            scene.roomId = rooms[i].id;
          }
        }
      }
    });

    scene.socket.on('roomJoined', (room) => {
      scene.scene.start('Game', {socketHandler: scene.socketHandler, 'firstTurn': room.players.length < 2});
    });
  }
}
