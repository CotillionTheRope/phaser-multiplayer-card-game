import ZoneHandler from './ZoneHandler';

export default class UIHandler {
  constructor(scene) {
    this.scene = scene;

    this.zoneHandler = new ZoneHandler(this.scene);
  }

  buildZones() {
    this.scene.dropZone = this.zoneHandler.renderZone(470, 500);
    this.zoneHandler.renderOutline(this.scene.dropZone);
  }

  buildPlayerAreas() {
    this.scene.playerHandArea = this.scene.add.rectangle(470, 860, 850, 230);
    this.scene.playerHandArea.setStrokeStyle(4, 0xff69b4);
    this.scene.playerDeckArea = this.scene.add.rectangle(1000, 860, 155, 215);
    this.scene.playerDeckArea.setStrokeStyle(3, 0x00ffff);

    this.scene.opponentHandArea = this.scene.add.rectangle(470, 135, 850, 230);
    this.scene.opponentHandArea.setStrokeStyle(4, 0xff69b4);
    this.scene.opponentDeckArea = this.scene.add.rectangle(1000, 135, 155, 215);
    this.scene.opponentDeckArea.setStrokeStyle(3, 0x00ffff);
  }

  buildGameText() {
    this.scene.opponentBP = this.scene.add.text(960, 400, 'Opponent BP: ').setFontSize(14).setFontFamily('Trebuchet MS');
    this.scene.opponentBPValue = this.scene.add.text(1050, 400, '0').setFontSize(14).setFontFamily('Trebuchet MS');
    this.scene.opponentVariables = this.scene.add.text(960, 420, 'Opponent Variables: ').setFontSize(14).setFontFamily('Trebuchet MS');
    this.scene.opponentVaraiblesValue = this.scene.add.text(1090, 420, '0').setFontSize(14).setFontFamily('Trebuchet MS');

    this.scene.dealCards = this.scene.add.text(960, 450, 'Deal Cards').setFontSize(14).setFontFamily('Trebuchet MS');

    this.scene.playerBP = this.scene.add.text(960, 480, 'Player BP: ').setFontSize(14).setFontFamily('Trebuchet MS');
    this.scene.playerBPValue = this.scene.add.text(1028, 480, '0').setFontSize(14).setFontFamily('Trebuchet MS');
    this.scene.playerVariables = this.scene.add.text(960, 500, 'Player Variables: ').setFontSize(14).setFontFamily('Trebuchet MS');
    this.scene.playerVaraiblesValue = this.scene.add.text(1068, 500, '0').setFontSize(14).setFontFamily('Trebuchet MS');
  }

  buildUI() {
    this.buildZones();
    this.buildPlayerAreas();
    this.buildGameText();
  }
}
