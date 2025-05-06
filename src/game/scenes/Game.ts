import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import axios from 'axios';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;

    // Keep track of this game client's player
    userId: string | null = null;
    userHp: number = 5;
    // userWordCount: number | null = null;

    // Keep track of this game's ID
    gameId: string | null = null;

    // Keep track of if game started (wait for last readied player to create game)
    gameStarted: boolean = false;
    // Keep track of game end (ends when only 1 player alive)
    gameOver: boolean = false;
    died: boolean = false;

    // Contains text to be displayed on screen
    wordsText: Phaser.GameObjects.Text;
    inputText: Phaser.GameObjects.Text;
    healthText: Phaser.GameObjects.Text;
    zoneText: Phaser.GameObjects.Text;
    killsText: Phaser.GameObjects.Text;
    leaderText: Phaser.GameObjects.Text;

    // Top 10 list of players
    topTenText: Phaser.GameObjects.Text;
    firstPlayer: Phaser.GameObjects.Text;
    secondPlayer: Phaser.GameObjects.Text;
    thirdPlayer: Phaser.GameObjects.Text;
    fourthPlayer: Phaser.GameObjects.Text;
    fifthPlayer: Phaser.GameObjects.Text;
    sixthPlayer: Phaser.GameObjects.Text;
    seventhPlayer: Phaser.GameObjects.Text;
    eighthPlayer: Phaser.GameObjects.Text;
    ninthPlayer: Phaser.GameObjects.Text;
    tenthPlayer: Phaser.GameObjects.Text;


    // Word Bank
    wordBank = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry', 'strawberry', 'tangerine', 'watermelon', 'apricot', 'blueberry', 'cantaloupe', 'dragonfruit', 'eggplant', 'fennel', 'guava', 'hibiscus', 'iceberg', 'jalapeno', 'kumquat', 'lime', 'mulberry', 'nectarine', 'olive', 'persimmon', 'pineapple', 'plum', 'pomegranate', 'rhubarb', 'starfruit', 'tomato', 'unique', 'yam', 'zucchini', 'acorn', 'bagel', 'cat', 'dog', 'elephant', 'frog', 'giraffe', 'horse', 'iguana', 'jellyfish', 'kangaroo', 'lion', 'monkey', 'narwhal', 'octopus', 'parrot', 'quail', 'rabbit', 'snake', 'tiger', 'umbrella', 'vulture', 'walrus', 'xylophone', 'yak', 'zebra', 'antelope', 'bear', 'cow', 'dolphin', 'eagle', 'fox', 'gorilla', 'hippopotamus', 'iguana', 'jaguar', 'koala', 'lemur', 'moose', 'newt', 'opossum', 'penguin', 'quokka', 'raccoon', 'sloth', 'toucan', 'unicorn', 'viper', 'whale', 'xerus', 'yellowjacket', 'zebra', 'albatross', 'baboon', 'cactus', 'dingo', 'elk', 'fern', 'gecko', 'hawk', 'owl', 'penguin', 'quail', 'rooster', 'sparrow', 'toucan', 'vulture', 'warbler', 'xenops', 'yodeler', 'zebra', 'artichoke', 'blueberry', 'cabbage', 'daffodil', 'eucalyptus', 'fern', 'ginseng', 'hibiscus', 'ivy', 'juniper', 'kelp', 'lavender', 'marigold', 'nasturtium', 'oregano', 'petunia', 'quinoa', 'rosemary', 'sage', 'thyme', 'violet', 'wisteria', 'xenia', 'yucca', 'zinnia', 'acorn', 'ball', 'clock', 'door', 'elephant', 'flag', 'grape', 'hat', 'ink', 'jug', 'kite', 'lemon', 'mask', 'nut', 'octagon', 'park', 'queen', 'radio', 'ship', 'train', 'umbrella', 'vest', 'wagon', 'xylophone', 'yellow', 'zebra', 'axis', 'break', 'crane', 'drum', 'end', 'flare', 'gap', 'hunt', 'icon', 'joke', 'key', 'love', 'mark', 'neck', 'oval', 'park', 'quiz', 'rest', 'snap', 'tale', 'unit', 'void', 'wall', 'yoke', 'zest', 'arm', 'bend', 'cash', 'die', 'ear', 'fit', 'gun', 'ham', 'ink', 'joy', 'kit', 'lad', 'man', 'net', 'oil', 'pen', 'rat', 'sun', 'toy', 'urn', 'vat', 'win', 'yak', 'zip', 'aim', 'ball', 'coat', 'dust', 'egg', 'fan', 'grid', 'horn', 'ink', 'jam', 'log', 'mix', 'nap', 'odd', 'pit', 'rug', 'saw', 'tin', 'undo', 'vet', 'wig', 'you', 'zip', 'amber', 'bench', 'coat', 'deck', 'epic', 'fame', 'gear', 'hand', 'ice', 'jam', 'king', 'log', 'map', 'net', 'oak', 'pet', 'quiz', 'rug', 'sap', 'top', 'urn', 'van', 'web', 'yam', 'zoo', 'angle', 'bar', 'cast', 'deal', 'eel', 'flat', 'gash', 'heat', 'icon', 'jolt', 'king', 'lace', 'mile', 'net', 'oak', 'pit', 'queen', 'rag', 'sat', 'tin', 'urn', 'vet', 'win', 'yet', 'zone', 'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu'];

    // Accumulated word list
    wordList: string[] = [];
    // Current 10 words for user to type
    wordLine: string[] = [];
    // Current word the user is on in the line
    currentWordIndex = 0;
    // Current line the user is on
    currentLineIndex = 0;
    // User input
    wordsInput = '';
    
    // Zone properties
    inZone: boolean = false;
    playerHealth: number = 100; // Initial health value
    kills: number = 0;
    isLeader: boolean = false;
    
    // To store status of other players during game
    playerHps: Record<string, number> | null = null;
    playerWordLines: Record<string, number> | null = null;



    constructor ()
    {
        super('Game');
    }

    // First thing to run when Game scene is created
    preload () {
        // Start game from backend
        this.load.on('complete', async () => {
            await this.startGameFromBackend();
        })

    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);
        this.background.setDepth(0);

        EventBus.emit('current-scene-ready', this);

        // Create wordsText to display current words to type
        this.wordsText = this.add.text(512, 200, this.wordList.join(' '), {
            fontFamily: 'Consolas', fontSize: '20px', color: '#ffffff', // Consolas is monospaced
            stroke: '#000000', strokeThickness: 4,
            align: 'center',
            wordWrap: {width: 800, useAdvancedWrap: true }
        }).setOrigin(0.5).setDepth(100);

        // Create inputText to display this player's current input
        this.inputText = this.add.text(512, 400, '', {
            fontFamily: 'Consolas', fontSize: '20px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center',
            wordWrap: {width: 800, useAdvancedWrap: true }
        }).setOrigin(0.5).setDepth(100);

        // Create health display
        this.healthText = this.add.text(100, 50, 'Health: 5', {
            fontFamily: 'Consolas', fontSize: '20px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setDepth(100);
        
        // Create zone status display
        this.zoneText = this.add.text(100, 80, 'Zone: Safe', {
            fontFamily: 'Consolas', fontSize: '20px', color: '#00ff00',
            stroke: '#000000', strokeThickness: 4
        }).setDepth(100);

        // Create top 10 players display
        this.topTenText = this.add.text(100, 60, 'Current Top 10', {
            fontFamily: 'Consolas', fontSize: '20px', color: '#00ff00',
            stroke: '#000000', strokeThickness: 4
        }).setDepth(100);
        
        // Create kills display
        this.killsText = this.add.text(900, 50, 'Kills: 0', {
            fontFamily: 'Consolas', fontSize: '20px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setDepth(100);
        
        // Create leader status
        this.leaderText = this.add.text(900, 80, '', {
            fontFamily: 'Consolas', fontSize: '20px', color: '#ffff00',
            stroke: '#000000', strokeThickness: 4
        }).setDepth(100);
        
        // Update game status every second
        // this.time.addEvent({
        //     delay: 1000,
        //     callback: this.checkZoneStatus,
        //     callbackScope: this,
        //     loop: true
        // });

        // Access keyboard input
        const keyboard = this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;

        keyboard.on('keydown', (event: KeyboardEvent) => {
            // Call function to handle key press
            this.handleKeyPress(event.key);
        });

    }


    // Upon game start, fetch game info from backend
    async startGameFromBackend() {
        // Game is not started yet
        // The last readied user will start it
        if (!this.gameStarted) {
            try {
                // Last readied user will generate first 10 words randomly using this.wordBank
                this.wordList = this.wordBank.sort(() => 0.5 - Math.random()).slice(0, 10);

                // Start game
                const response = await axios.post("http://localhost:3000/startgame", {
                    wordList: this.wordList
                }, {
                    withCredentials:true
                });

                // Check if starting game was successful (means last readied player started game)
                if (response.data.success) {
                    this.gameStarted = true;
                    // Enter fetchGameStatus loop
                    await this.fetchGameStatusWhile();
                }
                else {
                    // Wait for game data to appear in database
                     await this.waitGameStartWhile();
                }






                // Retrieve last readied user
                // const response = await axios.get("http://localhost:3000/lastready", {
                //     withCredentials: true
                // });
    
                // // Set this.gameId
                // this.gameId = response.data.gameId;
    
                // // Retrieve this current user
                // const userResponse = await axios.get("http://localhost:3000/user", {
                //     withCredentials: true
                // });
    
                // Check if this current user == last readied user
                // if (userResponse.data.userId == response.data.lastReady) {
    
                //     // Last readied user will generate first 10 words randomly using this.wordBank
                //     this.wordList = this.wordBank.sort(() => 0.5 - Math.random()).slice(0, 10);

    
                //     // Call startgame endpoint with created wordList
                //     const gameResponse = await axios.post("http://localhost:3000/startgame", {
                //         gameId: this.gameId,
                //         wordList: this.wordList
                //     }, {
                //         withCredentials: true
                //     });
    
                //     if (gameResponse.data.success) {
                //         // Last readied user's game starts
                //         this.gameStarted = true;
                //         // Enter fetchGameStatus loop
                //         await this.fetchGameStatusWhile();
                //     }
    
    
    
                // }
                // // Not readied user
                // else {
                //     // Wait for game data to appear in database
                //     await this.waitGameStartWhile();
    
    
                // }
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

            // Check for game ready every 1 second
            // await new Promise(resolve => setTimeout(resolve, 1000));
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
                gameId: this.gameId
            }, {
                withCredentials: true
            });


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
        while (!this.gameOver) {
            await this.fetchGameStatus();

            // Update game status every 1 second
            // await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // IF GAME IS OVER LOGIC HERE!
        // ...


    }

    // Called per loop of fetchGameStatusWhile()
    async fetchGameStatus() {
        try {
            const response = await axios.post("http://localhost:3000/fetchgame", {
                gameId: this.gameId,
            }, {
                withCredentials: true
            });
    
            // Update fields
            this.playerHps = response.data.playerHps;
            this.playerWordLines = response.data.playerWordLines;
            this.wordList = response.data.wordList;
            // Update wordLine using currentLineIndex
            this.wordLine = this.wordList.slice(this.currentLineIndex*10, this.currentLineIndex*10+10);
            this.playerHealth = response.data.hp;

            this.inZone = response.data.inZone;
            this.died = response.data.died;

            // Check zone status
            // this.checkZoneStatus();
            
            // Update display
            this.wordsText.setText(this.wordLine.join(' '));

            this.healthText.setText(`Health: ${this.playerHealth}`);

            if (this.inZone) {
                this.zoneText.setText('Zone: DANGER!');
                this.zoneText.setColor('#ff0000');
            } else {
                this.zoneText.setText('Zone: Safe');
                this.zoneText.setColor('#00ff00');
            }

            if (this.died) {
                this.playerDied();
            }










            // Update display after everything is fetched
            // await this.updatePersonalDisplay();
            
        }
        catch (error) {
            console.log(error);
        }
    }

    // Update personal view of words
    // async updatePersonalDisplay() {
    //     this.wordsText.setText(this.wordList.join(' '));
    //     // MORE TO ADD (e.g. playerHps, playerScores, etc...)
    //     // ...
    // }


    async handleKeyPress(key: string) {
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
                    this.wordsInput += key;
                    this.currentWordIndex++;
                    

                    // Check if user is done
                    if (this.currentWordIndex === this.wordLine.length) {
                        await this.goToNextLine();
                    }
                    // User is not done
                    else {
                        await this.updateGameStatus();
                        await this.fetchGameStatus();
                    }
                }
                // Word is not correct
                else {

                    await this.updateGameStatus();
                    await this.fetchGameStatus();

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
        // Increment current line the user is on
        this.currentLineIndex++;
        // Reset current word index of the user
        this.currentWordIndex = 0;
        // Clear input words
        this.wordsInput = '';

        // If player is leading, then add new words and increment zone index
        if (await this.isPlayerLeading()) {
            await this.updateLeaderStatus();

        }
 
        await this.fetchGameStatus();
    


    }


    // Update game status in Redis database after each completed word
    async updateGameStatus() {
        try {
            const response = await axios.post("http://localhost:3000/updategame", {
                gameId: this.gameId,
                hp: this.userHp,
                currentLineIndex: this.currentLineIndex,
    
            }, {
                withCredentials: true
            });

        }
        catch (error) {
            console.log(error);
        }
        

    }


    // completed() {
    //     this.add.text(512, 700, 'You have finished typing all the words!', {
    //         fontFamily: 'Consolas', fontSize: '20px', color: '#ffffff',
    //         stroke: '#000000', strokeThickness: 4,
    //         align: 'center',
    //         wordWrap: {width: 800, useAdvancedWrap: true }
    //     }).setOrigin(0.5).setDepth(100);
    // }

    // Check if player is in zone
    // async checkZoneStatus() {
    //     if (this.gameStarted && !this.gameOver) {
    //         // If player is leader, update leader status and zone
    //         if (this.currentWordIndex > 0 && await this.isPlayerLeading()) {
    //             await this.updateLeaderStatus();
    //         }
            
    //         // Check if current word is in zone
    //         await this.checkIfInZone();
            
    //         // Update display
    //         await this.updateZoneDisplay();
    //     }
    // }

    // Check if player is in zone
    // async checkIfInZone() {
    //     if (this.currentWordIndex >= this.wordList.length) return;
        
    //     try {
    //         const response = await axios.post("http://localhost:3000/checkzone", {
    //             gameId: this.gameId,
    //             currentWord: this.wordList[this.currentWordIndex]
    //         }, {
    //             withCredentials: true
    //         });
            
    //         if (response.data.success) {
    //             this.inZone = response.data.inZone;
                
    //             // Update health if in zone
    //             if (this.inZone && response.data.newHp !== undefined) {
    //                 this.playerHealth = response.data.newHp;
    //                 this.healthText.setText(`Health: ${this.playerHealth}`);
                    
    //                 // Check if player died
    //                 if (this.playerHealth <= 0) {
    //                     this.playerDied();
    //                 }
    //             }
    //         }
    //     } catch (error) {
    //         console.log("Error checking zone:", error);
    //     }
    // }

    // Update the zone display
    // async updateZoneDisplay() {
    //     try {
    //         // Fetch latest zone list
    //         const response = await axios.post("http://localhost:3000/getzonelist", {
    //             gameId: this.gameId
    //         }, {
    //             withCredentials: true
    //         });
            
    //         if (response.data.success) {
    //             this.zoneList = response.data.zoneList;
                
    //             // Update zone status text
    //             if (this.inZone) {
    //                 this.zoneText.setText('Zone: DANGER!');
    //                 this.zoneText.setColor('#ff0000');
    //             } else {
    //                 this.zoneText.setText('Zone: Safe');
    //                 this.zoneText.setColor('#00ff00');
    //             }
                
    //             // Highlight words in zone
    //             this.highlightZoneWords();
    //         }
    //     } catch (error) {
    //         console.log("Error updating zone display:", error);
    //     }
    // }

    // highlightZoneWords() {
    //     if (!this.wordList.length || !this.zoneList.length) return;
        
    //     // Get the slice of wordList that the player can see (next 10 words)
    //     const visibleWordCount = Math.min(10, this.wordList.length - this.currentWordIndex);
    //     const visibleWords = this.wordList.slice(this.currentWordIndex, this.currentWordIndex + visibleWordCount);
        
    //     // Find out which words are in zone
    //     const inZoneWords = visibleWords.filter(word => this.zoneList.includes(word));
        
    //     // If no words in zone, just display words normally
    //     if (inZoneWords.length === 0) {
    //         this.wordsText.setText(visibleWords.join(' '));
    //         this.wordsText.setColor('#ffffff');
    //         return;
    //     }
        
    //     // Check if we have the last word in zone list in our visible words
    //     const lastZoneWord = this.zoneList[this.zoneList.length - 1];
    //     const lastZoneWordIndex = visibleWords.indexOf(lastZoneWord);
        
    //     // The zone highlighting logic follows your requirements:
    //     // 1. Check if last word in zone list exists in current display list
    //     // 2. If not, check if last word in display list is in zone list
        
    //     // If last zone word is visible, highlight from start to that index
    //     if (lastZoneWordIndex !== -1) {
    //         // Remove any existing colored word objects
    //         if (this.zoneTextObjects && this.zoneTextObjects.length > 0) {
    //             this.zoneTextObjects.forEach(obj => obj.destroy());
    //         }
    //         this.zoneTextObjects = [];
            
    //         // Create two text objects - one for zone words, one for safe words
            
    //         // 1. Create red zone words text (from start to lastZoneWordIndex)
    //         const zoneWordsSlice = visibleWords.slice(0, lastZoneWordIndex + 1);
    //         const zoneText = this.add.text(
    //             512, 
    //             200, 
    //             zoneWordsSlice.join(' '), 
    //             {
    //                 fontFamily: 'Consolas',
    //                 fontSize: '20px',
    //                 color: '#ff0000',
    //                 stroke: '#000000',
    //                 strokeThickness: 4,
    //                 align: 'right'
    //             }
    //         ).setOrigin(1, 0.5).setDepth(100);
            
    //         this.zoneTextObjects.push(zoneText);
            
    //         // 2. Create white safe words text (after lastZoneWordIndex)
    //         if (lastZoneWordIndex < visibleWords.length - 1) {
    //             const safeWordsSlice = visibleWords.slice(lastZoneWordIndex + 1);
    //             const safeText = this.add.text(
    //                 512, 
    //                 200, 
    //                 ' ' + safeWordsSlice.join(' '), 
    //                 {
    //                     fontFamily: 'Consolas',
    //                     fontSize: '20px',
    //                     color: '#ffffff',
    //                     stroke: '#000000',
    //                     strokeThickness: 4,
    //                     align: 'left'
    //                 }
    //             ).setOrigin(0, 0.5).setDepth(100);
                
    //             this.zoneTextObjects.push(safeText);
    //         }
            
    //         // Hide the original text
    //         this.wordsText.setVisible(false);
    //     }
    //     // Check if the last word in display list is in zone list
    //     else if (this.zoneList.includes(visibleWords[visibleWords.length - 1])) {
    //         // All visible words are in zone
    //         this.wordsText.setVisible(true);
    //         this.wordsText.setText(visibleWords.join(' '));
    //         this.wordsText.setColor('#ff0000');
            
    //         // Clear any text objects
    //         if (this.zoneTextObjects && this.zoneTextObjects.length > 0) {
    //             this.zoneTextObjects.forEach(obj => obj.destroy());
    //             this.zoneTextObjects = [];
    //         }
    //     }
    //     // If none of the above, player's display list is not in zone
    //     else {
    //         this.wordsText.setVisible(true);
    //         this.wordsText.setText(visibleWords.join(' '));
    //         this.wordsText.setColor('#ffffff');
            
    //         // Clear any text objects
    //         if (this.zoneTextObjects && this.zoneTextObjects.length > 0) {
    //             this.zoneTextObjects.forEach(obj => obj.destroy());
    //             this.zoneTextObjects = [];
    //         }
    //     }
    // }

    // Check if player is leading
    async isPlayerLeading() {
        if (!this.playerWordLines) return false;

        // Fetch current user
        try {
            const response = await axios.get("http://localhost:3000/user", {
                withCredentials: true
            })
            const currentUser = response.data.user;
            let maxScore = 0;
            let leadPlayer = null;
            
            // Find player with highest score
            for (const [player, score] of Object.entries(this.playerWordLines)) {
                if (score > maxScore) {
                    maxScore = score;
                    leadPlayer = player;
                }
            }
            
            return currentUser === leadPlayer;
        }
        catch (error)
        {
            console.log(error);
        }
        
        
    }

    // Update leader status and zone position (only called by leader)
    async updateLeaderStatus() {
        try {
            // Generate 10 new words randomly
            const newWords = this.wordBank.sort(() => 0.5 - Math.random()).slice(0, 10);


            const response = await axios.post("http://localhost:3000/updateleader", {
                gameId: this.gameId,
                currentLineIndex: this.currentLineIndex,
                newWords: newWords
            }, {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Only the leader calls this function
                this.leaderText.setText('LEADER');
                this.leaderText.setColor('#ffff00');

                this.getLeaderKills();




                // this.isLeader = response.data.isLeader;
                
                // // Update leader text
                // if (this.isLeader) {
                //     this.leaderText.setText('LEADER');
                //     this.leaderText.setColor('#ffff00');
                    
                //     // Get kill count
                //     this.getLeaderKills();
                // } else {
                //     this.leaderText.setText('');
                // }
            }
        } catch (error) {
            console.log("Error updating leader status:", error);
        }
    }

    // Get leader kills
    async getLeaderKills() {
        try {
            const response = await axios.post("http://localhost:3000/getleaderkills", {
                gameId: this.gameId
            }, {
                withCredentials: true
            });
            
            if (response.data.success) {
                this.kills = response.data.kills;
                this.killsText.setText(`Kills: ${this.kills}`);
            }
        } catch (error) {
            console.log("Error getting kills:", error);
        }
    }

    // Handles player dying
    playerDied() {
        this.gameOver = true;
        
        this.add.text(512, 500, 'ELIMINATED BY ZONE!', {
            fontFamily: 'Consolas', fontSize: '32px', color: '#ff0000',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
    }


    changeScene ()
    {
        // this.scene.start('GameOver');
    }
}
