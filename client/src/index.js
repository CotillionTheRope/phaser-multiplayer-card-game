import Phaser from 'phaser';
import Game from './scenes/game.js';
import Start from './scenes/start.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        width: 1200,
        height: 1000,
    },
    scene: [
        Start,
        Game,
    ]
};

const game = new Phaser.Game(config);
