import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import axios from 'axios';

// Define an interface for word data
interface WordData {
    word: string;
    width: number;
    index: number;
}

export class Game extends Scene {
    // Make properties for gameId and userId private
    private _gameId: string | null = null;
    private _userId: string | null = null;
    
    // Provide getters for gameId and userId
    public get gameId(): string | null {
        return this._gameId;
    }
    
    public get userId(): string | null {
        return this._userId;
    }

    // Define main GUI elements
    camera: Phaser.Cameras.Scene2D.Camera;
    gameText: Phaser.GameObjects.Text;
    decorativeBlocks: Phaser.GameObjects.Rectangle[] = []; // For Tetris-style blocks

    // Keep track of this game client's player
    userHp: number = 5;

    // Keep track of this game's ID and who is the last ready player
    static currentGameId: string | null = null;
    static lastReadyUser: string | null = null;

    // Keep track of if game started (wait for last readied player to create game)
    gameStarted: boolean = false;
    // Keep track of game end (ends when only 1 player alive)
    gameOver: boolean = false;
    // Keep track of if this user died (is at 0 HP)
    died: boolean = false;

    // Contains text to be displayed on screen
    wordsText: Phaser.GameObjects.Text;
    inputText: Phaser.GameObjects.Text;
    healthText: Phaser.GameObjects.Text;
    zoneText: Phaser.GameObjects.Text;
    killsText: Phaser.GameObjects.Text;
    leaderText: Phaser.GameObjects.Text;
    wpmText: Phaser.GameObjects.Text;

    // Leaderboard text
    leaderboardText: Phaser.GameObjects.Text;
    leaderboardBackground: Phaser.GameObjects.Rectangle;
    leaderboardTitle: Phaser.GameObjects.Text;
    leaderboardEntries: Phaser.GameObjects.Text[] = [];

    // Accumulated word list
    wordList: string[] = [];
    // Current 10 words for user to type
    wordLine: string[] = [];
    // For rendering each word as a separate object
    wordTextObjects: Phaser.GameObjects.Text[] = [];
    wordSpacing: number = 20; // Base spacing between words
    // Current word the user is on in the line
    currentWordIndex = 0;
    // Current line the user is on
    currentLineIndex = 0;
    // User input
    wordsInput = '';
    
    // Zone properties
    inZone: boolean = false;
    kills: number = 0;
    isLeader: boolean = false;
    
    // To store status of other players during game
    playerHps: Record<string, number> | null = null;
    playerWordLines: Record<string, number> | null = null;
    playerWpm: Record<string, number> | null = null;

    // WPM tracking
    private lineStartTime: number = 0;
    private currentWPM: number = 0;
    private averageWPM: number = 0;

    // Fetch user info upon game start
    async getUserInfo() {
        try {
            const response = await axios.get("http://localhost:3000/user", {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Set this._userId variable
                this._userId = response.data.user;
                console.log(`User ID set: ${this._userId}`);
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

    // Start game
    async startGame() {
        // Check if we have user info, if not, wait for it
        if (!this._userId) {
            const success = await this.getUserInfo();
            if (!success) {
                this.add.text(512, 384, 'Error loading user info. Please refresh.', {
                    fontFamily: '"Press Start 2P"', 
                    fontSize: '20px', 
                    color: '#ffffff',
                    align: 'center',
                    stroke: '#000000',
                    strokeThickness: 6
                }).setOrigin(0.5);
                return;
            }
        }
        
        // Now start the game in the backend
        await this.startGameFromBackend();
    }

    constructor () {
        super('Game');
    }

    // First thing to run when Game scene is created
    preload () {
        // Load the WebFont script dynamically
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
        
        // Start game after WebFont is finished loading by checking for complete event handler
        this.load.on('complete', async () => {
            // Make sure all players get correct game ID
            if (!Game.currentGameId) {
                const response = await axios.get("http://localhost:3000/lastready", {
                    withCredentials: true
                });
                Game.currentGameId = response.data.gameId;
                Game.lastReadyUser = response.data.lastReady;

                // Set this._gameId
                this._gameId = Game.currentGameId;
            }
            // This ensures preload is truly done before proceeding
            this.startGame();
        });
        
        // Also start the user info fetch in parallel
        this.getUserInfo();
    }

    // After preload is done
    create () {
        // Wait for WebFont to load
        (window as any).WebFont.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                // Create the game UI elements with the WebFont
                this.createGameElements();
            }
        });
    }
    
    // Create the UI elements for the game
    createGameElements() {
        // Create background
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00cc66);
        
        // Add decorative Tetris-style blocks
        this.addDecorativeBlocks();

        EventBus.emit('current-scene-ready', this);

        // Create wordsText to display current words to type
        this.wordsText = this.add.text(512, 300, '', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '18px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6,
            align: 'center',
            wordWrap: {width: 800, useAdvancedWrap: true }
        }).setOrigin(0.5).setDepth(100);
        this.wordsText.setStyle({ fontSize: '18px' }); // Reset the style to ensure HTML works
        this.wordsText.setStyle({ fontSize: '18px', color: '#ffffff' });

        // Create inputText to display this player's current input
        this.inputText = this.add.text(512, 400, '', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '16px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6,
            align: 'center',
            wordWrap: {width: 800, useAdvancedWrap: true }
        }).setOrigin(0.5).setDepth(100);

        // Create health display (All players' health is initially 5)
        this.healthText = this.add.text(100, 50, 'Health: 5', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '16px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6
        }).setDepth(100);
        
        // Create zone status display (All players are outside of the zone at game start)
        this.zoneText = this.add.text(100, 80, 'Zone: Safe', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '16px', 
            color: '#00ff00',
            stroke: '#000000', 
            strokeThickness: 6
        }).setDepth(100);

        // WPM display
        this.wpmText = this.add.text(100, 110, 'WPM: 0 | Avg: 0', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '16px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6,
            align: 'center'
        }).setDepth(100);
        
        // Create kills display
        this.killsText = this.add.text(800, 50, 'Kills: 0', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '16px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6
        }).setDepth(100);
        
        // Create leader status
        this.leaderText = this.add.text(800, 80, '', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '16px', 
            color: '#ffff00',
            stroke: '#000000', 
            strokeThickness: 6
        }).setDepth(100);

        // Create leaderboard with background and title
        this.leaderboardBackground = this.add.rectangle(890, 650, 275, 300, 0x000000)
        .setAlpha(0.7)
        .setOrigin(0.5, 0.5)
        .setStrokeStyle(2, 0xFFFFFF)
        .setDepth(90);

        this.leaderboardTitle = this.add.text(890, 520, 'LEADERBOARD', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '14px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5, 0).setDepth(100);

        this.leaderboardText = this.add.text(785, 550, '', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '10px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 3,
            align: 'left'
        }).setDepth(100);

        // Access keyboard input
        const keyboard = this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;

        keyboard.on('keydown', (event: KeyboardEvent) => {
            // Call function to handle key press
            this.handleKeyPress(event.key);
        });
    }
    
    // Add Tetris blocks as decoration (similar to Queue.ts)
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
        
        // Add some falling blocks that appear at the edges of the screen
        for (let i = 0; i < 12; i++) {
            // Position blocks mostly at the edges to not interfere with gameplay
            const x = i % 2 === 0 ? 
                Phaser.Math.Between(20, 150) : 
                Phaser.Math.Between(width - 150, width - 20);
            
            const y = Phaser.Math.Between(20, height - 20);
            const size = Phaser.Math.Between(15, 30);
            const color = colors[Phaser.Math.Between(0, colors.length - 1)];
            
            const block = this.add.rectangle(x, y, size, size, color)
                .setAlpha(0.4)
                .setDepth(10);
                
            // Store reference to block for later use
            this.decorativeBlocks.push(block);
                
            // Animate the block to fall to the bottom of the screen
            this.tweens.add({
                targets: block,
                y: height + size,
                duration: Phaser.Math.Between(5000, 10000),
                ease: 'Linear',
                repeat: -1,
                yoyo: false,
                delay: Phaser.Math.Between(0, 3000)
            });
        }
    }

    // Updates leaderboard
    updateLeaderboard() {
        // Check if necessary data exists and scene is active
        if (!this.playerHps || !this.playerWordLines || !this.scene.isActive()) {
            return;
        }
        
        // Clear any existing player text objects
        if (this.leaderboardEntries) {
            this.leaderboardEntries.forEach(entry => {
                if (entry && entry.scene) {
                    entry.destroy();
                }
            });
            this.leaderboardEntries = [];
        }
        
        // If we have the original leaderboard text, keep it blank instead of destroying
        if (this.leaderboardText && this.leaderboardText.scene) {
            this.leaderboardText.setText('');
        }
        
        // Combine player data
        const playerData = [];
        
        // Build array of players with their data
        for (const player in this.playerHps) {
            if (this.playerWordLines[player] !== undefined) {
                playerData.push({
                    name: player,
                    health: this.playerHps[player],
                    line: this.playerWordLines[player],
                    wpm: this.playerWpm && this.playerWpm[player] ? this.playerWpm[player] : 0
                });
            }
        }
        
        // Sort by line number (descending) then by health (descending)
        playerData.sort((a, b) => {
            if (b.line !== a.line) {
                return b.line - a.line;
            }
            return b.health - a.health;
        });
        
        // Limit to top 10 players
        const topPlayers = playerData.slice(0, 10);
        
        // Define leaderboard position and layout
        const startX = 775;
        const startY = 550;
        const lineHeight = 20; // Space between lines
        
        // Create individual text objects for each player
        topPlayers.forEach((player, index) => {
            // Truncate name if too long (max 6 chars)
            const displayName = player.name.length > 6 ? 
                player.name.substring(0, 5) + '.' : 
                player.name.padEnd(6, ' '); // Pad with spaces for alignment
            
            // Check if this is the current player
            const isCurrentPlayer = player.name === this._userId;
            
            // Create the player entry text
            const entryText = `${index + 1}. ${displayName} ♥ ${player.health} ★ ${player.line} ⚡ ${player.wpm || 0}`;
            
            // Set color based on whether this is the current player
            const textColor = isCurrentPlayer ? '#ff8800' : '#ffffff'; // Orange for current player
            
            // Create text object for this player
            const playerText = this.add.text(startX, startY + (index * lineHeight), entryText, {
                fontFamily: '"Press Start 2P"', 
                fontSize: '10px', 
                color: textColor,
                stroke: '#000000', 
                strokeThickness: 3,
                align: 'left'
            }).setDepth(100);
            
            // Store reference to player text
            this.leaderboardEntries.push(playerText);
        });
    }

    // Create and position individual word text objects
    private renderWordObjects() {
        // Clear existing word objects if any
        this.wordTextObjects.forEach(textObj => textObj.destroy());
        this.wordTextObjects = [];

        if (this.wordLine.length > 0 && this.currentWordIndex === 0) {
            // Only start timer if this is a new line (currentWordIndex is 0)
            this.lineStartTime = Date.now();
        }
        
        if (!this.wordLine || this.wordLine.length === 0) {
            return;
        }
        
        // Screen dimensions
        const screenWidth = this.cameras.main.width;
        const centerX = screenWidth / 2;
        const baseY = 300; // Base Y position for the first line
        const lineHeight = 40; // Vertical space between lines
        
        // Maximum width to allow for text (with some margin)
        const maxLineWidth = screenWidth - 100; // 50px margin on each side
        
        // Array to hold words for each line
        const lines: WordData[][] = [];
        let currentLine: WordData[] = [];
        let currentLineWidth = 0;
        
        // Create temporary text objects to measure word widths
        const wordWidths: WordData[] = [];
        for (let i = 0; i < this.wordLine.length; i++) {
            const tempText = this.add.text(0, 0, this.wordLine[i], {
                fontFamily: '"Press Start 2P"',
                fontSize: '18px'
            });
            wordWidths.push({
                word: this.wordLine[i],
                width: tempText.width,
                index: i
            });
            tempText.destroy(); // Clean up temp text
        }
        
        // Distribute words into lines
        for (let i = 0; i < wordWidths.length; i++) {
            const wordData = wordWidths[i];
            
            // If adding this word would exceed line width and it's not the first word
            // in the line, start a new line
            if (currentLineWidth + wordData.width + (currentLine.length * this.wordSpacing) > maxLineWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = [wordData];
                currentLineWidth = wordData.width;
            } else {
                currentLine.push(wordData);
                currentLineWidth += wordData.width;
            }
        }
        
        // Add the last line if it has any words
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        
        // Now render each line of words
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const posY = baseY + (lineIndex * lineHeight);
            
            // Calculate total line width including spacing
            let lineWidth = 0;
            for (const wordData of line) {
                lineWidth += wordData.width;
            }
            lineWidth += (line.length - 1) * this.wordSpacing;
            
            // Starting X position for this line (centered)
            let currentX = centerX - (lineWidth / 2);
            
            // Create and position each word in this line
            for (const wordData of line) {
                // Determine color based on progress
                let color = '#ffffff'; // Default white
                if (wordData.index < this.currentWordIndex) {
                    color = '#00ff00'; // Completed words in green
                } else if (wordData.index === this.currentWordIndex) {
                    color = '#ffff00'; // Current word in yellow/gold
                }
                
                // Create text object for this word
                const wordText = this.add.text(currentX, posY, wordData.word, {
                    fontFamily: '"Press Start 2P"',
                    fontSize: '18px',
                    color: color,
                    stroke: '#000000',
                    strokeThickness: 6
                }).setOrigin(0, 0.5).setDepth(100);
                
                // Add to our array of word objects
                this.wordTextObjects.push(wordText);
                
                // Increment X position for next word
                currentX += wordData.width + this.wordSpacing;
            }
        }
    }

    // Add this method to update the color of word objects based on progress
    private updateWordColors() {
        if (!this.wordTextObjects || this.wordTextObjects.length === 0) {
            return;
        }
        
        // Track which word object corresponds to which word in the wordLine
        let wordIndex = 0;
        
        for (let i = 0; i < this.wordTextObjects.length; i++) {
            // Get the corresponding index in the wordLine
            if (wordIndex < this.wordLine.length) {
                if (wordIndex < this.currentWordIndex) {
                    this.wordTextObjects[i].setColor('#00ff00'); // Completed
                } else if (wordIndex === this.currentWordIndex) {
                    this.wordTextObjects[i].setColor('#ffff00'); // Current
                } else {
                    this.wordTextObjects[i].setColor('#ffffff'); // Upcoming
                }
                wordIndex++;
            }
        }
    }

    // This is called from startGame() function above
    // Upon game start, fetch game info from backend
    async startGameFromBackend() {
        // Game is not started yet
        // The last readied user will start it
        if (!this.gameStarted) {
            try {
                // First, get this client's user ID
                if (!this._userId) {
                    const success = await this.getUserInfo();
                    if (!success) return;
                }
                // Check if this current user == last readied user
                if (this._userId == Game.lastReadyUser) {
                    try {
                        const gameResponse = await axios.post("http://localhost:3000/startgame", {
                            gameId: this._gameId,
                            user: this._userId
                        }, {
                            withCredentials: true
                        });

                        if (gameResponse.data.success) {
                            this.gameStarted = true;

                            // Fetch the first line of words
                            this.wordLine = await this.fetchWordLine(this.currentLineIndex);

                            await this.fetchGameStatusWhile();
                        } else {
                            console.log("Failed to start game:", gameResponse.data.message);
                            // Maybe implement a retry mechanism or fallback
                        }
                    } catch (error) {
                        console.error("Error starting game:", error);
                    }
                }
                // Not readied user
                else {
                    // Wait for game data to appear in database
                    await this.waitGameStartWhile();
                }
            }
            catch (error) {
                console.log(error);
            }
        }
    }

    // Loop for checking if game is started (for all players besides last readied player)
    async waitGameStartWhile() {

        // Wait for game while game is not started
        while (!this.gameStarted) {
            await this.waitGameStart();
        }

        // Game has started, so fetch it
        try {
            // Enter loop to fetch game status
            await this.fetchGameStatusWhile();
        }
        catch (error) {
            console.log(error);
        }

    }

    // Called per loop of waitGameStartWhile()
    async waitGameStart() {
        try {
            // Check if game is ready in Redis database, pass gameId to backend
            const response = await axios.post("http://localhost:3000/checkgameready", {
                gameId: this._gameId
            }, {
                withCredentials: true
            });

            // Game has started in backend
            if (response.data.gameReady == true) {
                this.gameStarted = true;
            }

        }
        catch (error) {
            console.log(error);
        }
    }

    // Loop for fetching  game status (updating display)
    async fetchGameStatusWhile() {
        // Update game status as long as game is not over
        while (!this.gameOver && this.scene.isActive()) {
            try {
                await this.fetchGameStatus();
            } catch (error) {
                console.error("Error fetching game status:", error);
                // If we encounter an error (like player removed from game), terminate the loop
                this.gameOver = true;
                break;
            }
        }
    
        console.log("Game loop terminated");

    }

    // Fetches words for player's current line
    async fetchWordLine(lineIndex: number): Promise<string[]> {
        try {
            // Pass lineIndex to backend for the correct 10 words to be returned from Redis database
          const response = await axios.post("http://localhost:3000/getWordLine", {
            gameId: this._gameId,
            lineIndex: lineIndex
          }, {
            withCredentials: true
          });
          
          if (response.data.success) {
            // Return the 10 words
            return response.data.words;
          } else {
            console.error("Failed to fetch word line:", response.data.message);
            return [];
          }
        } catch (error) {
          console.error("Error fetching word line:", error);
          return [];
        }
      }

    // Called per loop of fetchGameStatusWhile()
    async fetchGameStatus() {
        try {
            // Check if scene is still active before proceeding
            if (!this.scene.isActive()) {
                console.log("Scene is no longer active, aborting fetchGameStatus");
                this.gameOver = true;
                return;
            }

            // Fetch game status from backend
            const response = await axios.post("http://localhost:3000/fetchgame", {
                gameId: this._gameId,
                user: this._userId
            }, {
                withCredentials: true
            });

            // Check if the response indicates the player is no longer in the game
            if (!response.data.success) {
                console.log("Player no longer in game");
                this.gameOver = true;
                return;
            }

            // Double check scene is still active before updating UI
            if (!this.scene.isActive()) {
                console.log("Scene became inactive during fetch, aborting update");
                this.gameOver = true;
                return;
            }

            // Check if game is ended (only 1 player alive)
            if (response.data.gameOver) {
                this.gameOver = true;
                
                if (response.data.isWinner && this.scene.isActive()) {
                    this.playerWin();
                    return; // Exit the method early since game is over
                }
                
            }
    
            // Update fields
            this.playerHps = response.data.playerHps;
            this.playerWordLines = response.data.playerWordLines;
            this.playerWpm = response.data.playerWpm;
            this.isLeader = response.data.isLeader;
            if (this.isLeader) {
                if (this.leaderText && this.leaderText.scene) {
                    this.leaderText.setText('LEADER');
                    this.leaderText.setColor('#ffff00');
                }
            } else {
                if (this.leaderText && this.leaderText.scene) {
                    this.leaderText.setText(''); // Clear the leader text
                }
            }
            this.userHp = response.data.hp;
            this.inZone = response.data.inZone;
            this.died = response.data.died;

            // Update leaderboard with new values
            this.updateLeaderboard();

            // If we need to fetch a new line of words
            if (this.wordLine.length === 0) {
                this.wordLine = await this.fetchWordLine(this.currentLineIndex);
            }
            
            // Update or create word objects
            if (this.scene.isActive()) {
                this.renderWordObjects();
            }
            
            // Update HP display
            if (this.healthText && this.healthText.scene) {
                this.healthText.setText(`Health: ${this.userHp}`);
            }

            // Update Zone display
            if (this.inZone) {
                this.zoneText.setText('Zone: DANGER!');
                this.zoneText.setColor('#ff0000');
            } else {
                this.zoneText.setText('Zone: Safe');
                this.zoneText.setColor('#00ff00');
            }

            // Handle user died (their HP is 0)
            if (this.died && this.scene.isActive()) {
                this.playerDied();
            }
        }
        catch (error) {
            console.log(error);
            this.gameOver = true;
            throw error;
        }
    }

    // Handle each key press of the user during the game
    async handleKeyPress(key: string) {
        // Initialize lineStartTime at the start of a word line to calculate WPM
        if (this.currentWordIndex === 0 && this.wordsInput.length === 0 && key.length === 1 && /^[a-zA-Z]$/.test(key)) {
            // This is the first keystroke of a new line
            if (this.lineStartTime === 0) {
                this.lineStartTime = Date.now();
            }
        }

        // Check if user is not done with the current word line
        if (this.currentWordIndex < this.wordLine.length) {
            if (key === 'Backspace') {
                // Remove most recent key if user presses backspace
                // Do not remove space (makes sure user doesn't remove already completed words)
                if (this.wordsInput[this.wordsInput.length - 1] !== ' ') {
                    this.wordsInput = this.wordsInput.slice(0, -1);
                }
            }
            else if (key === ' ') {
                // Check if word is correct if user presses space
                
                // Get most recent space-separated inputted word, or '' if no words
                const currentWord = this.wordsInput.split(' ').pop() || '';
    
                // Word is correct
                if (currentWord === this.wordLine[this.currentWordIndex]) {
                    this.wordsInput = ' ';
                    this.currentWordIndex++;
                    this.updateWordColors();

                    // Add a flash effect for correct word
                    this.cameras.main.flash(100, 0, 255, 0, true);

                    // Check if user is done
                    if (this.currentWordIndex === this.wordLine.length) {
                        await this.goToNextLine();
                    }
                    // User is not done
                    else {
                        await this.updateGameStatus();
                    }
                }
                // Word is not correct
                else {
                    // Add a shake effect for incorrect word
                    this.cameras.main.shake(100, 0.01);
                    await this.updateGameStatus();
                }
            }
            // Only accept alphanumeric characters as user input
            else if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
                // Add this key to typedText
                this.wordsInput += key;
            }
    
            this.inputText.setText(this.wordsInput);
        }
    }

    // When the user finishes typing all words in the current line
    async goToNextLine() {

        if (this.lineStartTime > 0) {
            // Calculate elapsed time in minutes
            const elapsedTimeMs = Date.now() - this.lineStartTime;
            const elapsedTimeMinutes = elapsedTimeMs / 60000; // Convert to minutes
            
            // Calculate WPM (10 words per line)
            this.currentWPM = Math.round(10 / elapsedTimeMinutes);

            // Send WPM data to the backend and get average in response
            await this.updateWPM();

            
            // Update WPM display
            if (this.wpmText && this.wpmText.scene) {
                this.wpmText.setText(`WPM: ${this.currentWPM} | Avg WPM: ${this.averageWPM}`);
            }
            
            // Reset timer for next line
            this.lineStartTime = 0;
        }

        // Increment current line the user is on
        this.currentLineIndex++;
        // Reset current word index of the user
        this.currentWordIndex = 0;
        // Clear input words
        this.wordsInput = '';
        
        // Add a level complete effect
        this.cameras.main.flash(200, 0, 255, 255, true);
        
        await this.updateGameStatus();

        // Fetch the next line of words from the backend
        this.wordLine = await this.fetchWordLine(this.currentLineIndex);
        
        // Render the new word objects
        if (this.scene.isActive()) {
            this.renderWordObjects();
        }

        // If player is leading, update leader
        if (this.isLeader) {
            console.log(`I AM THE LEADER - generating new words at line ${this.currentLineIndex}`);
            await this.updateLeaderStatus();
        }
    }

    // Updates WPM
    async updateWPM() {
        try {
            const response = await axios.post("http://localhost:3000/updatewpm", {
                gameId: this._gameId,
                user: this._userId,
                currentWPM: this.currentWPM
            }, {
                withCredentials: true
            });
            
            if (!response.data.success) {
                console.error("Failed to update WPM:", response.data.message);
            } else {
                // Set averageWPM value
                this.averageWPM = response.data.averageWPM;
            }
        } catch (error) {
            console.error("Error updating WPM:", error);
        }
    }

    // Update game status in Redis database after each completed word
    async updateGameStatus() {
        try {
            const response = await axios.post("http://localhost:3000/updategame", {
                gameId: this._gameId,
                hp: this.userHp,
                currentLineIndex: this.currentLineIndex,
                user: this._userId
            }, {
                withCredentials: true
            });
            // Also update userHp value for this client to display up-to-date HP
            this.userHp = response.data.playerHp;
        }
        catch (error) {
            console.log(error);
        }
    }

    // Update leader status and zone position (only called by leader)
    async updateLeaderStatus() {
        try {
            const response = await axios.post("http://localhost:3000/updateleader", {
                gameId: this._gameId,
                currentLineIndex: this.currentLineIndex,
                leader: this._userId
            }, {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Update Leader status on display
                this.leaderText.setText('LEADER');
                this.leaderText.setColor('#ffff00');
                
                // Add a crown effect or animation for the leader
                this.tweens.add({
                    targets: this.leaderText,
                    scale: 1.2,
                    duration: 300,
                    yoyo: true,
                    repeat: 1
                });

                // Only the leader calls this function
                this.getLeaderKills();
            }
        } catch (error) {
            console.log("Error updating leader status:", error);
        }
    }

    // Get leader kills
    async getLeaderKills() {
        try {
            const response = await axios.post("http://localhost:3000/getleaderkills", {
                gameId: this._gameId,
                leader: this._userId
            }, {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Update kill count and kill display
                this.kills = response.data.kills;
                this.killsText.setText(`Kills: ${this.kills}`);
                
                // Add visual effect for new kill
                if (this.kills > 0) {
                    this.tweens.add({
                        targets: this.killsText,
                        scale: 1.2,
                        duration: 200,
                        yoyo: true,
                        repeat: 1
                    });
                }
            }
        } catch (error) {
            console.log("Error getting kills:", error);
        }
    }

    // Handles player dying
    playerDied() {
        this.gameOver = true;
        
        // Create game over text with better styling
        const gameOverText = this.add.text(512, 500, 'ELIMINATED BY ZONE!', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '32px', 
            color: '#ff0000',
            stroke: '#000000', 
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        // Add dramatic game over effects
        this.cameras.main.flash(1000, 255, 0, 0);
        this.cameras.main.shake(500, 0.02);
        
        // Fade out decorative blocks
        this.decorativeBlocks.forEach(block => {
            this.tweens.add({
                targets: block,
                alpha: 0,
                duration: 1000,
                ease: 'Power2'
            });
        });
        
        // Pulse the game over text
        this.tweens.add({
            targets: gameOverText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    // Handles player winning
    playerWin() {
        const victoryText = this.add.text(512, 384, 'VICTORY ROYALE!', {
            fontFamily: '"Press Start 2P"', 
            fontSize: '32px', 
            color: '#ffff00',
            stroke: '#000000', 
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        // Add effects, animation, etc.
        this.cameras.main.flash(1000, 255, 255, 0);
        
        this.tweens.add({
            targets: victoryText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    // Handles player leaving the game
    public leaveGame() {
        console.log("Player leaving game - terminating game loop");
        
        // Set gameOver to true to break out of the fetchGameStatusWhile loop
        this.gameOver = true;

        // Reset the static game ID variable
        Game.currentGameId = null;
        this._gameId = null;        // Also reset instance variable
        this.kills = 0;

        // Clean up word text objects
        this.wordTextObjects.forEach(textObj => {
            if (textObj && textObj.scene) {
                textObj.destroy();
            }
        });
        this.wordTextObjects = [];
        
        // Remove all event listeners to prevent callbacks after scene is stopped
        this.events.removeAllListeners();
        if (this.input && this.input.keyboard) {
            this.input.keyboard.removeAllListeners();
        }
        
        // Cancel all tweens and timers
        this.tweens.killAll();
        this.time.removeAllEvents();
        
        // Nullify references that might try to update after scene is stopped
        this.playerHps = null;
        this.playerWordLines = null;
        
        // Make sure to set a short delay before stopping the scene
        // This gives async operations a chance to clean up
        this.time.delayedCall(100, () => {
            // Clear any ongoing game activities
            if (this.scene) {
                this.scene.stop();
            }
        });
    }


}