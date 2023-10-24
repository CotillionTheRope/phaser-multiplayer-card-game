export default class ZoneHandler {
  constructor(scene) {
    this.scene = scene;
  }

  renderZone(x, y, width, height) {
    let dropZone = this.scene.add.zone(x, y, width, height)
      .setRectangleDropZone(width, height);

    return dropZone;
  }

  renderOutline(dropZone, lineWidth, color) {
    let dropZoneOutline = this.scene.add.graphics();

    dropZoneOutline.lineStyle(lineWidth, color);
    dropZoneOutline.strokeRect(
      dropZone.x - dropZone.input.hitArea.width / 2,
      dropZone.y - dropZone.input.hitArea.height / 2,
      dropZone.input.hitArea.width,
      dropZone.input.hitArea.height
    );

    return dropZoneOutline;
  }
}
