import { Game as MainGame } from './scenes/Game';
import { Queue } from './scenes/Queue';
import { AUTO, Game } from 'phaser';


//  Configuration settings for the Phaser screen
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    // this background color is replaced by each scene's own background color
    backgroundColor: '#028af8',
    // Game consists of 2 scenes: Queue scene and MainGame scene
    scene: [
        Queue,
        MainGame,
    ],
    // Enable keyboard input for the typing game
    input: {
        keyboard: true
    }
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
