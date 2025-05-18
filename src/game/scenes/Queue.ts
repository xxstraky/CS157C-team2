import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import axios from 'axios';

export class Queue extends Scene {
    // Keep track of user ID, queue ID, and whether game started
    userId: string | null = null;
    queueId: string | null = null;
    gameStarted: boolean = false;

    // GUI elements
    title: GameObjects.Text;
    queueText: GameObjects.Text;
    readyText: GameObjects.Text;
    playersReadyText: GameObjects.Text;
    gameStartText: GameObjects.Text;
    

    // Fetch user ID from the backend
    async getUserInfo() {
        try {
            const response = await axios.get("http://localhost:3000/user", {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Set this.userId
                this.userId = response.data.user;
                console.log(`User ID set: ${this.userId}`);
                return true;
            } else {
                console.error("Failed to get user info:", response.data.message);
                return false;
            }
        } catch (error) {
            console.error("Error getting user info:", error);
            return false;
        }
    }

    constructor() {
        super('Queue');
    }

    preload() {
        // Load the WebFont script dynamically
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        this.getUserInfo().then(success => {
            if (!success) {
                console.warn("Failed to get user info during preload, will retry during create");
            }
        });
    }

    create() {
        
        // Wait for WebFont to load the font before creating text
        (window as any).WebFont.load({
            google: {
                families: ['Press Start 2P']
            },
            active: async () => {
                // If user ID wasn't set during preload, try again
                if (!this.userId) {
                    await this.getUserInfo();
                }
                
                // Create game elements regardless of user info success
                // (we'll handle any user-related issues inside createGameElements)
                this.createGameElements();
            }
        });
    }

    createGameElements() {
        // Add user verification at the beginning of this method
        if (!this.userId) {
            // Display a warning if we still don't have user info
            const errorText = this.add.text(512, 100, 'User info not loaded. Some features may not work properly.', {
                fontFamily: '"Press Start 2P"', 
                fontSize: '16px',
                color: '#ff0000',
                stroke: '#000000', 
                strokeThickness: 6,
                align: 'center'
            }).setOrigin(0.5).setDepth(101);
            
            // Start a retry timer for user info
            this.time.addEvent({
                delay: 2000,
                callback: async () => {
                    const success = await this.getUserInfo();
                    if (success) {
                        errorText.destroy();
                    }
                },
                callbackScope: this,
                loop: true
            });
        }

        // Queue Text
        this.queueText = this.add.text(512, 200, 'PRESS QUEUE TO FIND A GAME', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Ready Text
        this.readyText = this.add.text(512, 300, '', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Number of Players Ready Text
        this.playersReadyText = this.add.text(512, 400, '', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Game Start Text
        this.gameStartText = this.add.text(512, 500, '', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Add Tetris-style decorative blocks
        this.addDecorativeBlocks();

        EventBus.emit('current-scene-ready', this);
    }
    
    // Add some Tetris blocks as decoration
    addDecorativeBlocks() {
        // Colors for Tetris pieces
        const colors = [
            0xa000f0, // T piece - purple
            0x0000f0, // J piece - blue
            0x00f000, // S piece - green
            0x00f0f0, // I piece - cyan
            0xf00000, // Z piece - red
            0xf0f000  // O piece - yellow
        ];
        
        // Get canvas dimensions for block positioning
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Add some falling blocks that can appear anywhere on the canvas
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(20, width - 20);
            const y = Phaser.Math.Between(20, height - 20);
            const size = Phaser.Math.Between(15, 30);
            const color = colors[Phaser.Math.Between(0, colors.length - 1)];
            
            const block = this.add.rectangle(x, y, size, size, color)
                .setAlpha(0.5)
                .setDepth(50);
                
            // Animate the block to fall to the bottom of the screen
            this.tweens.add({
                targets: block,
                y: height + size,
                duration: Phaser.Math.Between(3000, 8000),
                ease: 'Linear',
                repeat: -1,
                yoyo: false,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }

    // Enter queue when Enter Queue button is pressed
    async enterQueue() {
        try {
            const response = await axios.post('http://localhost:3000/enterqueue', {
                user: this.userId
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Set this.queueId, to indicate that user is in queue
                this.queueId = response.data.queueId;

                // Retrieve queueSize from Redis
                const queueSize = response.data.queueSize;
                this.queueText.setText(`Players in queue: ${queueSize}`);

                // User just entered queue, so they are not ready
                this.readyText.setText('You are not ready');

                // Retrieve readySize from Redis
                const readySize = response.data.readySize;
                this.playersReadyText.setText(`Players ready: ${readySize}/${queueSize}`);

                // Information for game start
                this.gameStartText.setText('Game starts when all are ready \nand there are at least 2 players');

                // Start updating queue status periodically
                await this.updateQueueStatusWhile();
            }
        } catch (error) {
            if (this.scene && this.scene.isActive()) {
                this.queueText.setText("Failed to enter queue");
            }
            console.error(error);
        }
    }

    // Loop for updating queue status while in queue
    async updateQueueStatusWhile() {
        while (!this.gameStarted) {
            // Call updateQueueStatus function
            await this.updateQueueStatus();

            // Update queue status every 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Game is started
        if (this.gameStarted) {
            // Set game information text
            this.gameStartText.setText('All players ready! Starting game...');
            // Wait 1 second before starting game
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.startGame();
        }
    }

    // Runs once per loop of updateQueueStatusWhile()
    async updateQueueStatus() {
        // Only update queue status if user is currently in queue
        if (!this.queueId) {
            return;
        }
        // User is currently in queue, so proceed with updating queue status
        else {
            try {
                // Send queueId to backend
                const response = await axios.post('http://localhost:3000/queuestatus', {
                    queueId: this.queueId,
                }, {
                    withCredentials: true
                });
    
                if (response.data.success) {
                    // Update queueText with updated queue size
                    const queueSize = response.data.queueSize;
                    this.queueText.setText(`Players in queue: ${queueSize}`);
    
                    // Update playersReadyText with updated ready size
                    const readySize = response.data.readySize;
                    this.playersReadyText.setText(`Players ready: ${readySize}/${queueSize}`);

                    // If all players in queue are ready,
                    // AND at least 2 players, then start game
                    if (readySize == queueSize && readySize >= 2) {
                        this.gameStarted = true;
                    }
                    else if (readySize == queueSize) {
                        
                    }
                }
            }
            catch (error) {
                this.queueText.setText('Failed to get queue info');
                this.playersReadyText.setText('Error checking ready players');
                console.error(error);
            }
        }
    }

    // User clicks Ready Up button
    async readyUp() {
        try {
            // Call /readyup endpoint in backend, sending queueId
            const response = await axios.post('http://localhost:3000/readyup', {
                // Send lobbyId
                queueId: this.queueId,
                user: this.userId
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Update queueText with updated queue size
                const queueSize = response.data.queueSize;
                this.queueText.setText(`Players in queue: ${queueSize}`);

                // Update readyText indicating this user is ready
                this.readyText.setText('You are ready!');

                // Update playersReadyText with updated ready size
                const readySize = response.data.readySize;
                this.playersReadyText.setText(`Players ready: ${readySize}/${queueSize}`);
            }
        }
        catch (error) {
            this.readyText.setText("Failed to ready up");
            console.error(error);
        }
    }

    // Game starts
    async startGame() {
        try {
            // Switch to Game scene
            this.scene.start("Game");
        }
        catch (error) {
            this.gameStartText.setText("Error starting game");
            console.error(error);
        }
    }

}