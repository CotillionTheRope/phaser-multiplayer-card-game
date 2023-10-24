import SocketHandler from '../helpers/SocketHandler';
import ZoneHandler from '../helpers/ZoneHandler';

export default class Start extends Phaser.Scene {
  constructor() {
    super({
      key: 'Start'
    });
  }

  preload() {

  }

  create() {
    this.roomX      = 135;
    this.roomY      = 135;
    this.roomWidth  = 230;
    this.roomHeight = 230;
    this.roomTextX  = 30;
    this.roomTextY  = 30;

    this.rooms = [];

    this.socketHandler = new SocketHandler();
    this.zoneHandler = new ZoneHandler(this);

    this.socketHandler.startSceneSocketSetup(this);
    this.startGame = this.add.text(960, 450, 'Start New Room')
      .setFontSize(14)
      .setFontFamily('Trebuchet MS');

    this.startGame.setColor('#00ffff');
    this.startGame.setInteractive();
    this.startGame.on('pointerdown', () => {
      this.socket.emit('joinRoom', this.roomId, true);
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

  generateRooms(rooms) {
    this.rooms = this.rooms.filter(room => {
      room.roomZone.destroy();
      room.graphic.destroy();
      room.roomText.destroy();
      room.playerText.destroy();
      return;
    });

    let rows, columns;

    for (let i in rooms) {
      rows = Math.trunc(this.rooms.length/3);
      columns = this.rooms.length % 3;

      let room = {};
      room.roomZone = this.zoneHandler
        .renderZone(
          this.roomX + (this.roomWidth * columns) + (10 * columns),
          this.roomY + (this.roomHeight * rows) + (10 * rows),
          this.roomWidth,
          this.roomHeight
        );
      room.graphic = this.zoneHandler.renderOutline(room.roomZone, 4, 0xffffff);
      room.roomZone.on('pointerover', () => {
        room.graphic.destroy();
        room.graphic = this.zoneHandler.renderOutline(room.roomZone, 4, 0xff69b4);
      });

      room.roomZone.on('pointerout', () => {
        room.graphic.destroy();
        room.graphic = this.zoneHandler.renderOutline(room.roomZone, 4, 0xffffff);
      });

      let roomCount = 1 + parseInt(i);
      room.roomText = this.add
        .text(
          this.roomTextX + (this.roomWidth * columns) + (10 * columns),
          this.roomTextY + (this.roomHeight * rows) + (10 * rows),
          `Room ${roomCount}`
        )
        .setFontSize(14)
        .setFontFamily('Trebuchet MS');

      room.playerText = this.add
        .text(
          this.roomTextX + (this.roomWidth * columns) + (10 * columns),
          this.roomTextY + 15 + (this.roomHeight * rows) + (10 * rows),
          `Player count: ${rooms[i].players.length}`
        )
        .setFontSize(14)
        .setFontFamily('Trebuchet MS');

      if (rooms[i].players.length < 2) {
        room.roomZone.on('pointerdown', () => {
          this.socket.emit('joinRoom', rooms[i].id, false);
        });
      }

      this.rooms.push(room);
    }

    console.log(this.rooms);
  }
}
