import CardBack from './cards/CardBack';
import Boolean from './cards/Boolean';
import Ping from './cards/Ping';

export default class DeckHandler {
  constructor(scene) {
    this.scene = scene;
  }

  dealCard(x, y, name, type) {
    let newCard;

    switch (name)
    {
      case 'boolean':
        newCard = new Boolean(this.scene);
        break;

      case 'ping':
        newCard = new Ping(this.scene);
        break;

      case 'cardBack':
      default:
        newCard = new CardBack(this.scene);
    }

    return newCard.render(x, y, type);
  }
}
