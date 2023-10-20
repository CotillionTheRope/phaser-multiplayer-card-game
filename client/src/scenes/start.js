import SocketHandler from '../helpers/SocketHandler';

export default class Start extends Phaser.Scene {
  constructor() {
    super({
      key: 'Start'
    });
  }

  preload() {

  }

  create() {
    this.socketHandler = new SocketHandler();
    this.socketHandler.startSceneSocketSetup(this);

    this.startGame = this.add.text(960, 450, 'Start Game').setFontSize(14).setFontFamily('Trebuchet MS');
    this.startGame.setColor('#00ffff');
    this.startGame.setInteractive();

    this.startGame.on('pointerdown', () => {
      this.socket.emit('joinRoom', this.roomId);
    });

    this.startGame.on('pointerover', () => {
      this.startGame.setColor('#ff69b4');
    });

    this.startGame.on('pointerout', () => {
      this.startGame.setColor('#00ffff');
    });
  }

  update() {

  }
}
