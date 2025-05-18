import { Game as MainGame } from './scenes/Game';
import { Queue } from './scenes/Queue';
import { AUTO, Game } from 'phaser';


//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    // this background color is replaced by each scene's own background color
    backgroundColor: '#028af8',
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
