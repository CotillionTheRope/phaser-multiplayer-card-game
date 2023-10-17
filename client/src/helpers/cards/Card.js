export default class Card {
  constructor(scene) {
    this.scene = scene;
  }

  render(x, y, type) {
    let sprite;

    if (type === 'playerCard') {
      sprite = this.playerCardSprite;
    } else {
      sprite = this.opponentCardSprite;
    }

    let card = this.scene.add.image(x, y, sprite)
      .setScale(0.25, 0.25)
      .setInteractive()
      .setData({
        'name': this.name,
        'type': type,
        'sprite': sprite
      });

    if (type === 'playerCard') {
      this.scene.input.setDraggable(card);
    }

    return card;
  }
}
