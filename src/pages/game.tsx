import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from '../PhaserGame';
import { Queue } from '../game/scenes/Queue';
import { Game } from '../game/scenes/Game';
import { useRouter } from 'next/router';
import axios from 'axios';

// Game page
function GameController() {
    // Router to handle page navigation
    const router = useRouter();
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Can only ready up if user is in queue
    const [isReady, setCantReady] = useState(true);
    // Can only queue is user is not already queued
    const [isQueued, setIsQueued] = useState(false);

    // Game status message
    const [statusMessage, setStatusMessage] = useState('PRESS QUEUE TO START');

    // Add game state tracking
    const [inGame, setInGame] = useState(false);

    const [sceneReady, setSceneReady] = useState(false);

    // Function to handle leaving the game or queue
    const handleLeaveGame = async () => {
        if (!phaserRef.current) {
            router.push('/profile');
            return;
        }
        
        // Get game info directly from the Phaser game
        const gameInfo = phaserRef.current.getCurrentGameInfo();
        
        // If user is in a game
        if (inGame && gameInfo.gameId && gameInfo.userId) {
            try {
                // Call leaveGame on the Game scene to stop the game loop
                if (phaserRef.current && phaserRef.current.scene) {
                    const gameScene = phaserRef.current.scene as Game;
                    if (gameScene && gameScene.leaveGame) {
                        gameScene.leaveGame();
                    }
                }
                const response = await axios.post('http://localhost:3000/leavegame', {
                    gameId: gameInfo.gameId,
                    user: gameInfo.userId
                }, {
                    withCredentials: true
                });
                
                console.log('Left game successfully:', response.data);
                setStatusMessage('LEFT GAME SUCCESSFULLY');
                // Navigate to profile page
                router.push('/profile');
            } catch (error) {
                console.error('Error leaving game:', error);
                setStatusMessage('ERROR LEAVING GAME');
            }
        } 
        // If user is in a queue but not in game yet
        else if (!inGame && gameInfo.gameId && gameInfo.userId) {
            try {
                const response = await axios.post('http://localhost:3000/leavequeue', {
                    queueId: gameInfo.gameId,
                    user: gameInfo.userId
                }, {
                    withCredentials: true
                });
                
                console.log('Left queue successfully:', response.data);
                setStatusMessage('LEFT QUEUE SUCCESSFULLY');
                
                // Reset UI state
                setIsQueued(false);
                setCantReady(true);
                
                // Reset Queue scene state if possible
                if (phaserRef.current && phaserRef.current.scene && 
                    phaserRef.current.scene.scene.key === 'Queue') {
                    const queueScene = phaserRef.current.scene as Queue;
                    // Reset queue scene variables
                    queueScene.queueId = null;
                    queueScene.gameStarted = false;
                    queueScene.queueText.setText('PRESS QUEUE TO FIND A GAME');
                    queueScene.readyText.setText('');
                    queueScene.playersReadyText.setText('');
                    queueScene.gameStartText.setText('');
                }
                
            } catch (error) {
                console.error('Error leaving queue:', error);
                setStatusMessage('ERROR LEAVING QUEUE');
            }
        } else {
            // Not in game or queue - just go back to profile
            console.log('Not currently in a game or queue - returning to profile');
            setStatusMessage('RETURNING TO PROFILE');
            router.push('/profile');
        }
    };

    // Enter queue
    const enterQueue = () => {
        if (phaserRef.current && phaserRef.current.scene) {
            try {
                // Check if scene is Queue before casting
                if (phaserRef.current.scene.scene.key === 'Queue') {
                    const scene = phaserRef.current.scene as Queue;
                    
                    if (scene && scene.enterQueue) {
                        // Call enterQueue() function of the Phaser scene
                        scene.enterQueue();
                        // Update useStates
                        setCantReady(false);
                        setIsQueued(true);
                        setStatusMessage('IN QUEUE - READY UP!');
                    } else {
                        console.error("Queue scene missing enterQueue method");
                        setStatusMessage('ERROR: QUEUE UNAVAILABLE');
                    }
                } else {
                    console.error("Current scene is not Queue");
                    setStatusMessage('ERROR: NOT IN QUEUE SCENE');
                }
            } catch (error) {
                console.error("Error accessing Queue scene:", error);
                setStatusMessage('ERROR: QUEUE ERROR');
            }
        }
    }

    // Ready up
    const readyUp = () => {
        if (phaserRef.current)
        {
            const scene = phaserRef.current.scene as Queue;

            if (scene)
            {
                // Call readyUp() function of the Phaser scene
                scene.readyUp();
                setCantReady(true);
                setStatusMessage('READY! WAITING FOR GAME START');
            }
        }
    }


    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        // Update inGame state based on the current scene
        setInGame(scene.scene.key === 'Game');

        // Add this line to track when scene is ready
        setSceneReady(true);
    }

    // Button styling
    useEffect(() => {
        const colors = ['i', 'j', 'l', 'o', 's', 't', 'z'];
        let colorIndex = 0;
        
        const interval = setInterval(() => {
            const buttons = document.querySelectorAll('.button');
            buttons.forEach(button => {
                if (!button.hasAttribute('disabled')) {
                    (button as HTMLElement).style.borderColor = `var(--tetris-${colors[colorIndex]})`;
                }
            });
            
            colorIndex = (colorIndex + 1) % colors.length;
        }, 2000);
        
        return () => clearInterval(interval);
    }, []);

    // Update status message when user enters the Game
    useEffect(() => {
        if (inGame) {
            setStatusMessage('GLHF!');
        }
    }, [inGame]);


    // Use effect to handle tab close
    useEffect(() => {
        const handleUnload = () => {
            if (!phaserRef.current) return;

            const gameInfo = phaserRef.current.getCurrentGameInfo();

            // User is in Queue, so leave queue
            if (!inGame && gameInfo.gameId && gameInfo.userId) {
                const info = JSON.stringify({
                    queueId: gameInfo.gameId,
                    user: gameInfo.userId
                });

                // Need to use navigator for unloading
                navigator.sendBeacon(
                    'http://localhost:3000/leavequeue',
                    new Blob([info], { type: 'application/json'})
                );
            }
            // User is in Game, so leave game
            else if (inGame && gameInfo.gameId && gameInfo.userId) {
                const info = JSON.stringify({
                    gameId: gameInfo.gameId,
                    user: gameInfo.userId
                });

                navigator.sendBeacon(
                    'http://localhost:3000/leavegame',
                    new Blob([info], { type: 'application/json'})
                );
            }
        };

        // Listen for tab close
        window.addEventListener('unload', handleUnload);

        return () => {
            window.removeEventListener('unload', handleUnload);
        };
    }, [inGame]);
    

    return (
        <div className="game-container">
            {/* Logo at the top */}
            <div className="game-header">
                <div className="type99-logo">
                    <div className="type-text">
                        <span style={{ color: 'var(--tetris-t)' }}>T</span>
                        <span style={{ color: 'var(--tetris-j)' }}>Y</span>
                        <span style={{ color: 'var(--tetris-s)' }}>P</span>
                        <span style={{ color: 'var(--tetris-i)' }}>E</span>
                    </div>
                    <div className="num-text">
                        <span style={{ color: 'var(--tetris-z)' }}>9</span>
                        <span style={{ color: 'var(--tetris-o)' }}>9</span>
                    </div>
                </div>
            </div>
            
            {/* Game content (game screen + control panel) */}
            <div className="game-content">
                {/* Game screen */}
                <div className="game-screen">
                    <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
                </div>
                
                {/* Control panel */}
                <div className="control-panel">
                    <div className="status-message" style={{ 
                        color: 'var(--tetris-o)', 
                        marginBottom: '15px',
                        fontSize: '0.8em',
                        textAlign: 'center'
                    }}>
                        {statusMessage}
                    </div>
                    
                    <div>
                    <button 
                        disabled={isQueued || !sceneReady} 
                        className="button queue-button" 
                        onClick={enterQueue}
                    >
                        QUEUE
                    </button>
                    </div>
                    
                    <div>
                        <button 
                            disabled={isReady} 
                            className="button ready-button" 
                            onClick={readyUp}
                        >
                            READY UP
                        </button>
                    </div>
                    
                    <div style={{ marginTop: '20px' }}>
                    <button 
                        className="button back-button" 
                        onClick={handleLeaveGame}
                    >
                        {inGame ? 'LEAVE GAME' : (isQueued ? 'LEAVE QUEUE' : 'BACK TO PROFILE')}
                    </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GameController
