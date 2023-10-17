export default class GameHandler {
  constructor() {
    this.gameState    = 'Initializing';
    this.isMyTurn     = false;
    this.playerDeck   = [];
    this.opponentDeck = [];
    this.playerHand   = [];
    this.opponentHand = [];
  }

  changeTurn() {
    this.isMyTurn = !this.isMyTurn;
    console.log('isMyTurn ' + this.isMyTurn);
  }

  changeGameState(gameState) {
    this.gameState = gameState;
    console.log('GameState ' + this.gameState);
  }
}
