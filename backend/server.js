// Backend

// Imports
const redis = require('redis');
const ioredis = require('ioredis');
const cors = require('cors');
const express = require('express');
const session = require('express-session');

// Initialize express
const app = express();

// Allow frontend on port 8080 to interact with backend on port 3000
app.use(cors({
    origin: 'http://localhost:8080',
    methods: 'GET, POST',
    credentials: true
}));

// To parse JSON
app.use(express.json());

// Initialize session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Redis client
const client = redis.createClient({
    socket: {
        // IP of VM on Google Cloud Platform
        host: '34.173.23.63',
        port: 6379
    },
    // Redis database requires password for security
    password: '5Xr9!fH2s@Dp7t$kQb8yP0zLwE#Vg3zR'
});

// Other Redis client for commands not supported by the other Redis library
const r = new ioredis({
    // IP of VM on Google Cloud Platform
    host: '34.173.23.63',
    port: 6379,
    // Redis database requires password for security
    password: '5Xr9!fH2s@Dp7t$kQb8yP0zLwE#Vg3zR'
});

// Set of words to be generated for each Type99 game
const wordBank = [
    'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry', 'strawberry', 'tangerine', 'watermelon', 'apricot', 'blueberry', 'cantaloupe', 'dragonfruit', 'eggplant', 'fennel', 'guava', 'hibiscus', 'iceberg', 'jalapeno', 'kumquat', 'lime', 'mulberry', 'nectarine', 'olive', 'persimmon', 'pineapple', 'plum', 'pomegranate', 'rhubarb', 'starfruit', 'tomato', 'unique', 'yam', 'zucchini', 'acorn', 'bagel', 'cat', 'dog', 'elephant', 'frog', 'giraffe', 'horse', 'iguana', 'jellyfish', 'kangaroo', 'lion', 'monkey', 'narwhal', 'octopus', 'parrot', 'quail', 'rabbit', 'snake', 'tiger', 'umbrella', 'vulture', 'walrus', 'xylophone', 'yak', 'zebra', 'antelope', 'bear', 'cow', 'dolphin', 'eagle', 'fox', 'gorilla', 'hippopotamus', 'iguana', 'jaguar', 'koala', 'lemur', 'moose', 'newt', 'opossum', 'penguin', 'quokka', 'raccoon', 'sloth', 'toucan', 'unicorn', 'viper', 'whale', 'xerus', 'yellowjacket', 'zebra', 'albatross', 'baboon', 'cactus', 'dingo', 'elk', 'fern', 'gecko', 'hawk', 'owl', 'penguin', 'quail', 'rooster', 'sparrow', 'toucan', 'vulture', 'warbler', 'xenops', 'yodeler', 'zebra', 'artichoke', 'blueberry', 'cabbage', 'daffodil', 'eucalyptus', 'fern', 'ginseng', 'hibiscus', 'ivy', 'juniper', 'kelp', 'lavender', 'marigold', 'nasturtium', 'oregano', 'petunia', 'quinoa', 'rosemary', 'sage', 'thyme', 'violet', 'wisteria', 'xenia', 'yucca', 'zinnia', 'acorn', 'ball', 'clock', 'door', 'elephant', 'flag', 'grape', 'hat', 'ink', 'jug', 'kite', 'lemon', 'mask', 'nut', 'octagon', 'park', 'queen', 'radio', 'ship', 'train', 'umbrella', 'vest', 'wagon', 'xylophone', 'yellow', 'zebra', 'axis', 'break', 'crane', 'drum', 'end', 'flare', 'gap', 'hunt', 'icon', 'joke', 'key', 'love', 'mark', 'neck', 'oval', 'park', 'quiz', 'rest', 'snap', 'tale', 'unit', 'void', 'wall', 'yoke', 'zest', 'arm', 'bend', 'cash', 'die', 'ear', 'fit', 'gun', 'ham', 'ink', 'joy', 'kit', 'lad', 'man', 'net', 'oil', 'pen', 'rat', 'sun', 'toy', 'urn', 'vat', 'win', 'yak', 'zip', 'aim', 'ball', 'coat', 'dust', 'egg', 'fan', 'grid', 'horn', 'ink', 'jam', 'log', 'mix', 'nap', 'odd', 'pit', 'rug', 'saw', 'tin', 'undo', 'vet', 'wig', 'you', 'zip', 'amber', 'bench', 'coat', 'deck', 'epic', 'fame', 'gear', 'hand', 'ice', 'jam', 'king', 'log', 'map', 'net', 'oak', 'pet', 'quiz', 'rug', 'sap', 'top', 'urn', 'van', 'web', 'yam', 'zoo', 'angle', 'bar', 'cast', 'deal', 'eel', 'flat', 'gash', 'heat', 'icon', 'jolt', 'king', 'lace', 'mile', 'net', 'oak', 'pit', 'queen', 'rag', 'sat', 'tin', 'urn', 'vet', 'win', 'yet', 'zone', 'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu',
  ];


// When backend starts, initialize word bank
async function initializeWordBank() {
const exists = await client.exists('wordBank');
if (!exists) {
    console.log('Initializing word bank in Redis...');
    // Add all words to a Redis set
    await client.sAdd('wordBank', wordBank);
    console.log(`Word bank initialized with ${wordBank.length} words`);
}
}

// Helper function to update overall average WPM
async function updateOverallAverageWpm(username) {
    try {
        // Retrieve average WPM history list from Redis database
        const avgWpmHistory = await client.lRange(`user:${username}:avg_wpm_history`, 0, -1);
        
        // If it has any elements, calculate the overall average
        if (avgWpmHistory.length > 0) {
            let totalWpm = 0;
            for (const wpm of avgWpmHistory) {
                totalWpm += parseInt(wpm);
            }
            
            const overallAvgWpm = Math.round(totalWpm / avgWpmHistory.length);
            // Update user's overall_avg_wpm in Redis database
            await client.set(`user:${username}:overall_avg_wpm`, overallAvgWpm.toString());
            console.log(`Updated overall average WPM for ${username} to ${overallAvgWpm}`);
        }
    } catch (error) {
        console.error(`Error updating overall average WPM for ${username}:`, error);
    }
}

// Connect to Redis
client.connect()
    .then(async () => {
        console.log('Connected to Redis');
        await initializeWordBank();
        return client.ping();
    })
    .then(res => {
        console.log('Redis response:', res);
    })
    .catch(err => {
        console.error('Redis connection error:', err);
});

// Make sure user doesn't have access to certain pages when they are not logged in
function requireLogin(req, res, next) {
    if (req.session.user) {
        next();
    }
    else {
        res.json({ success: false, message: "You are not logged in."});
    }
};


// ENDPOINTS BELOW

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Check for any blank fields
    if (!username) {
        console.log("Missing username");
        return res.json({ success: false, message: "Missing username"});
    }
    else if (!password) {
        console.log("Missing password");
        return res.json({ success: false, message: "Missing password"});
    }

    // Check if username exists in Redis database
    const existingPass = await client.get(`user:${username}`);
    if (!existingPass) {
        console.log(`Username ${username} does not exist in Redis database`)
        return res.json({ success: false, message: "Username does not exist"});
    }
    // Username does exist, so check if password matches
    else if (password === existingPass){
        // Store user in session
        req.session.user = username;

        console.log(`User ${username} successfully logged in`);
        return res.json({ success: true, message: "Log in successful"});
    }
    // Password does not match
    else {
        console.log(`Incorrect passworrd for user ${username}`);
        return res.json({ success: false, message: "Incorrect password"});

    }

});



// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password, displayName, email } = req.body;

    // Check for any blank fields
    if (!username) {
        console.log("Missing username");
        return res.json({ success: false, message: "Missing username"});
    }
    else if (!password) {
        console.log("Missing password");
        return res.json({ success: false, message: "Missing password"});
    }
    else if (!displayName) {
        console.log("Missing display name");
        return res.json({ success: false, message: "Missing display name"});
    }
    else if (!email) {
        console.log("Missing email");
        return res.json({ success: false, message: "Missing email"});
    }

    // Check if username already exists in Redis database
    const existingUser = await client.get(`user:${username}`);
    if (existingUser) {
        console.log(`Username ${username} already exists in Redis database`);
        return res.json({ success: false, message: "Username already exists"});
    }

    // Check if email already exists in Redis database
    const existingEmail = await client.get(`email:${email}`);
    if (existingEmail) {
        console.log(`Email ${email} already registered in Redis database`);
        return res.json({ success: false, message: "Email already registered"});
    }

    // Create new account in Redis database
    await client.set(`user:${username}`, password);
    await client.set(`user:${username}:displayName`, displayName);
    await client.set(`user:${username}:email`, email);
    await client.set(`email:${email}`, username); // For email uniqueness check
    
    console.log(`New user created with username=${username}, displayName=${displayName}, email=${email} in Redis database`)
    res.json({ success: true, message: "Registration successful. Redirecting to login..."})
});


// Profile endpoint
app.get('/profile', requireLogin, (req, res) => {
    console.log('Session: ', req.session);
    // Send welcome message when user logs in
    res.json({ success: true, message: `Welcome, ${req.session.user}`});

});

// Get user profile endpoint
app.get('/userprofile', requireLogin, async (req, res) => {
    const username = req.session.user;
    
    try {
        // Get user information from Redis
        const displayName = await client.get(`user:${username}:displayName`) || username;
        const email = await client.get(`user:${username}:email`) || '';
        
        return res.json({ 
            success: true, 
            username: username,
            displayName: displayName,
            email: email
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.json({ success: false, message: "Error fetching user profile" });
    }
});

// Update display name endpoint
app.post('/updatedisplayname', requireLogin, async (req, res) => {
    const username = req.session.user;
    const { displayName } = req.body;
    
    // Handle display name field being empty
    if (!displayName) {
        return res.json({ success: false, message: "Display name cannot be empty" });
    }
    
    try {
        // Update user's display name in Redis database
        await client.set(`user:${username}:displayName`, displayName);
        console.log(`Updated display name for ${username} to ${displayName}`);
        return res.json({ success: true, message: "Display name updated successfully" });
    } catch (error) {
        console.error('Error updating display name:', error);
        return res.json({ success: false, message: "Error updating display name" });
    }
});

// Update email endpoint
app.post('/updateemail', requireLogin, async (req, res) => {
    const username = req.session.user;
    const { email } = req.body;
    
    // Handle email field being empty
    if (!email) {
        return res.json({ success: false, message: "Email cannot be empty" });
    }
    
    try {
        // Check if new email is already registered to another user
        const existingEmail = await client.get(`email:${email}`);
        if (existingEmail && existingEmail !== username) {
            return res.json({ success: false, message: "Email already registered to another account" });
        }
        
        // Get old email to remove from Redis
        const oldEmail = await client.get(`user:${username}:email`);
        if (oldEmail) {
            await client.del(`email:${oldEmail}`);
        }
        
        // Set new email in Redis database
        await client.set(`user:${username}:email`, email);
        await client.set(`email:${email}`, username);
        
        console.log(`Updated email for ${username} to ${email}`);
        return res.json({ success: true, message: "Email updated successfully" });
    } catch (error) {
        console.error('Error updating email:', error);
        return res.json({ success: false, message: "Error updating email" });
    }
});

// Update password endpoint
app.post('/updatepassword', requireLogin, async (req, res) => {
    const username = req.session.user;
    const { currentPassword, newPassword } = req.body;
    
    // If fields for current password or new password are empty
    if (!currentPassword || !newPassword) {
        return res.json({ success: false, message: "Current and new password are required" });
    }
    
    try {
        // Verify current password in Redis database
        const storedPassword = await client.get(`user:${username}`);
        if (storedPassword !== currentPassword) {
            return res.json({ success: false, message: "Current password is incorrect" });
        }
        
        // Update password in Redis database
        await client.set(`user:${username}`, newPassword);
        console.log(`Updated password for ${username}`);
        return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.json({ success: false, message: "Error updating password" });
    }
});

// Update all profile fields endpoint
app.post('/updateprofile', requireLogin, async (req, res) => {
    const username = req.session.user;
    const { displayName, email, currentPassword, newPassword } = req.body;
    
    try {
        // Update display name if provided
        if (displayName) {
            await client.set(`user:${username}:displayName`, displayName);
        }
        
        // Update email if provided
        if (email) {
            const oldEmail = await client.get(`user:${username}:email`);
            
            // Check if new email is different from current one
            if (oldEmail !== email) {
                // Check if new email is already registered to another user in Redis database
                const existingEmail = await client.get(`email:${email}`);
                if (existingEmail && existingEmail !== username) {
                    return res.json({ success: false, message: "Email already registered to another account" });
                }
                
                // Remove old email mapping
                if (oldEmail) {
                    await client.del(`email:${oldEmail}`);
                }
                
                // Set new email in Redis database
                await client.set(`user:${username}:email`, email);
                await client.set(`email:${email}`, username);
            }
        }
        
        // Update password if both current and new are provided
        if (currentPassword && newPassword) {
            // Verify current password with Redis database
            const storedPassword = await client.get(`user:${username}`);
            if (storedPassword !== currentPassword) {
                return res.json({ success: false, message: "Current password is incorrect" });
            }
            
            // Update password
            await client.set(`user:${username}`, newPassword);
        }
        
        console.log(`Updated profile for ${username}`);
        return res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.json({ success: false, message: "Error updating profile" });
    }
});


// Log out endpoint
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        // If error
        if (err) {
            console.log('Log out failed');
            return res.json({ status: false, message: "Log out failed"});
        }
        // Clear cookies
        res.clearCookie('connect.sid');
        console.log('Log out successful');
        return res.json({ success: true, message: "Log out successful"});
    })
});


// GAME ENDPOINTS

// Enter queue endpoint
app.post('/enterqueue', async (req, res) => {
    const { user } = req.body;

    // Retrieve current global lobby ID counter from Redis
    let queueId = await client.get('queue:counter');

    // Global queue ID doesn't exist
    if (!queueId) {
        // Setting new queue:counter to 1000
        console.log("Setting new queue:counter to 1000 in Redis");
        await client.set('queue:counter', 1000);
        queueId = await client.get('queue:counter');
    }

    // Key for queue in Redis database
    const queue = `queue:${queueId}`

    // Score 0 means user is not ready
    await client.zAdd(queue, [{score: 0, value: user}]);

    // Get new queue size
    const queueSize = await client.zCard(queue);
    // Get number of players ready (number of players whose score == 1)
    const readySize = await client.zCount(queue, 1, 1);

    // Return queueId, queueSize, readySize
    return res.json({ success: true, queueId: queueId, queueSize: queueSize, readySize: readySize});


});

// Ready up endpoint
app.post('/readyup', async (req, res) => {
    // Get queueId from request
    const { queueId, user } = req.body;

    // Keys for user and queue in Redis database
    const queue = `queue:${queueId}`;

    // Set existing score to 1 in queue (means user is ready)
    await client.zAdd(queue, [{score: 1, value: user}]);
    
    // Get number of ready players and size of queue
    const readySize = await client.zCount(queue, 1, 1);
    const queueSize = await client.zCard(queue);

    // If this player is the last player to ready up
    if (readySize == queueSize) {
        // Set this player as last ready
        await client.set(`queue:${queueId}:lastReady`, user);

        // LOCK THE QUEUE ID to prevent race conditions
        await client.set(`queue:${queueId}:locked`, 1);

        return res.json({ success: true, queueSize: queueSize, readySize: readySize, lastReady: true});
    }
    else {
        return res.json({ success: true, queueSize: queueSize, readySize: readySize, lastReady: false});
    }

    

})


// Queue status endpoint
app.post('/queuestatus', async (req, res) => {
    // Get queueId from request
    const { queueId } = req.body;

    // Key for queue in Redis
    const queue = `queue:${queueId}`;

    // Query queue size and ready size from 
    const queueSize = await client.zCard(queue);
    const readySize = await client.zCount(queue, 1, 1);

    console.log("Updating queue status...");
    return res.json({ success: true, queueSize: queueSize, readySize: readySize});

})

// User endpoint (get user)
app.get('/user', (req, res) => {
    const user = req.session.user;
    return res.json({ success:true, user: user});
})



// Last ready endpoint (to check which player starts the game)
app.get('/lastready', async (req, res) => {
    // Get current queueId
    const queueId = await client.get("queue:counter");

    // Get lastReady from that queueId
    const userLastReady = await client.get(`queue:${queueId}:lastReady`);

    console.log(userLastReady)

    // Game ID is set to current Queue ID
    return res.json({ success: true, lastReady: userLastReady, gameId: queueId});
})


// Start game endpoint (only for last readied player)
app.post('/startgame', async (req, res) => {
    // Get gameId and wordList from last readied player
    const { gameId, user } = req.body;

    // IMPORTANT: Check if this user is actually the last one who readied up
    const lastReadyUser = await client.get(`queue:${gameId}:lastReady`);
    if (user !== lastReadyUser) {
        console.log(`User ${user} is not the last ready user (${lastReadyUser}), rejecting game creation`);
        return res.json({ success: false, message: "Unauthorized - you are not the last ready user" });
    }

    // CHECK IF GAME ALREADY EXISTS to prevent duplicate creation
    const gameExists = await client.exists(`game:${gameId}:wordList`);
    if (gameExists) {
        console.log(`Game ${gameId} already exists, skipping creation.`);
        return res.json({ success: true });
    }

    console.log(`Authorized user ${user} creating game ${gameId}`);

    // Get all players from queue
    const players = await client.zRange(`queue:${gameId}`, 0, -1);

    // Add each player to this new game in Redis database
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        // Push player to list of players
        await client.lPush(`game:${gameId}`, player);
        // Push player to sorted set for player HPs (starting HP is 5)
        await client.zAdd(`game:${gameId}:hps`, [{score: 5, value: player}]);
        // Create sorted set for player word lines (starting word line is 0)
        await client.zAdd(`game:${gameId}:wordLines`, [{score: 0, value: player}]);

        // Add WPM tracking for this player (initialize at 0)
        await client.zAdd(`game:${gameId}:wpm`, [{score: 0, value: player}]);
        await client.zAdd(`game:${gameId}:avgWpm`, [{score: 0, value: player}]);
        
    }
    // Create word list
    // Generate initial 10 words from the word bank
    const initialWords = await client.sRandMember('wordBank', 10);
    
    // Add words to the game's word list
    await client.rPush(`game:${gameId}:wordList`, ...initialWords);

    console.log(`Creating game ${gameId} with ${players.length} players`);
    console.log(`Adding ${initialWords.length} words to game ${gameId}`);

    // Set zoneIndex to -2 (2 lines before line 0)
    await client.set(`game:${gameId}:zoneIndex`, -2);

    // Set game:<gameId>:ready to 1 after creating game, for other users to join game
    await client.set(`game:${gameId}:ready`, 1);

    // Increment queue:counter, so new players entering queue are not entering this game
    await client.incr("queue:counter");

    console.log(`Game ${gameId} created successfully, queue counter incremented`);
    
    return res.json({success: true});

})

// Gets words for specific line
app.post('/getWordLine', async (req, res) => {
    const { gameId, lineIndex } = req.body;
    
    if (!gameId || lineIndex === undefined) {
      return res.json({ success: false, message: "Missing gameId or lineIndex" });
    }
    
    try {
      // Calculate start and end indices (10 words per line)
      const startIndex = lineIndex * 10;
      const endIndex = startIndex + 9;

      // Use a Lua script to quickly and atomically check words and add if needed
      const luaScript = `
        local gameKey = KEYS[1]
        local startIndex = tonumber(ARGV[1])
        local endIndex = tonumber(ARGV[2])
        
        -- Get existing words for this line
        local words = redis.call('LRANGE', gameKey, startIndex, endIndex)
        
        -- If we have 10 words already, just return them
        if #words == 10 then
        return words
        end
        
        -- Calculate how many words we need
        local wordsMissing = 10 - #words
        
        -- Only generate words if we need more and aren't at the end yet
        if wordsMissing > 0 then
        -- Generate new words using SRANDMEMBER
        local newWords = redis.call('SRANDMEMBER', 'wordBank', wordsMissing)
        
        -- Add new words to the game's word list
        for i, word in ipairs(newWords) do
            redis.call('RPUSH', gameKey, word)
        end
        
        -- Append new words to our result
        for i, word in ipairs(newWords) do
            table.insert(words, word)
        end
        end
        
        return words
      `
      
      // Execute the Lua script with Redis
      const words = await r.eval(
            luaScript,
            1,                         // Number of keys
            `game:${gameId}:wordList`, // Key #1
            startIndex,                // ARGV[1]
            endIndex                   // ARGV[2]
        );
      
      return res.json({ success: true, words: words });
    } catch (error) {
      console.error('Error getting word line:', error);
      return res.json({ success: false, message: "Error getting words" });
    }
  });

// Check game ready (for all players other than last readied player)
app.post('/checkgameready', async (req, res) => {
    const { gameId } = req.body;

    // Check if this gameId is ready
    const gameReady = await client.get(`game:${gameId}:ready`);
    // 1 for ready, 0 for not ready
    if (gameReady === '1') {
        return res.json({ success: true, gameReady: true});
    }
    else {
        return res.json({ success: true, gameReady: false});
    }
})

// Update game information endpoint
app.post('/updategame', async (req, res) => {
    const { gameId, hp, currentLineIndex, user } = req.body;

    let playerHp = hp;

    const lineIndexNumber = parseInt(currentLineIndex) || 0;

    // Set new currentLineIndex for this player, in case it's updated
    await client.zAdd(`game:${gameId}:wordLines`, [{score: lineIndexNumber, value: user}]);

    // Check if player is in zone
    const lineIndex = await client.zScore(`game:${gameId}:wordLines`, user);
    const zoneIndex = await client.get(`game:${gameId}:zoneIndex`);
    if (lineIndex <= zoneIndex) {
        // Subtract from user HP
        const newHp = hp - 1;
        await client.zAdd(`game:${gameId}:hps`, [{score: newHp, value: user}]);
        playerHp = await client.zScore(`game:${gameId}:hps`, user);
        console.log(playerHp)

        // If player died (HP is 0)
        if (newHp == 0) {
            // Add a kill to leader
            const leader = await client.get(`game:${gameId}:leader`);
            
            // Only proceed if leader exists and is not the player who died
            if (leader && leader !== user) {
                try {
                    // Get current kill count or start at 0
                    const killsExist = await client.exists(`game:${gameId}:${leader}:kills`);
                    
                    if (!killsExist) {
                        // First kill for this leader
                        await client.set(`game:${gameId}:${leader}:kills`, '1');
                        console.log(`First kill recorded for ${leader} in game ${gameId}`);
                    } else {
                        // Increment existing kills counter
                        await client.incr(`game:${gameId}:${leader}:kills`);
                        const newKills = await client.get(`game:${gameId}:${leader}:kills`);
                        console.log(`Leader ${leader} now has ${newKills} kills in game ${gameId}`);
                    }
                } catch (killError) {
                    console.error(`Error updating kills for leader ${leader}:`, killError);
                }
            }
        }
    }

    return res.json({ success: true, playerHp: playerHp });

})

// Fetch game endpoint (each user uses this to update their display of other users' status)
app.post('/fetchgame', async (req, res) => {
    const { gameId, user } = req.body;
    
    // Get all player line indices
    const allPlayers = await r.zrange(`game:${gameId}:wordLines`, 0, -1, 'WITHSCORES');
    const playerWordLines = {};

    // Convert the flattened array into a proper object
    for (let i = 0; i < allPlayers.length; i += 2) {
        const player = allPlayers[i];
        const score = parseInt(allPlayers[i + 1]) || 0;
        playerWordLines[player] = score;
    }

    
    // Get all player HP values
    const allPlayerHps = await r.zrange(`game:${gameId}:hps`, 0, -1, 'WITHSCORES');
    const playerHps = {};

    // Convert the flattened array into a proper object
    for (let i = 0; i < allPlayerHps.length; i += 2) {
        const player = allPlayerHps[i];
        const health = parseInt(allPlayerHps[i + 1]) || 0;
        playerHps[player] = health;
    }

    // Get all player wpms
    const allPlayerWpm = await r.zrange(`game:${gameId}:wpm`, 0, -1, 'WITHSCORES');
    const playerWpm = {};
    
    // Convert the flattened array into a proper object
    for (let i = 0; i < allPlayerWpm.length; i += 2) {
        const player = allPlayerWpm[i];
        const wpm = parseInt(allPlayerWpm[i + 1]) || 0;
        playerWpm[player] = wpm;
    }
    
    // Get leader
    const leader = await r.zrevrange(`game:${gameId}:wordLines`, 0, 0);
    const isLeader = leader[0] === user;

    // Get word list
    const wordList = await client.lRange(`game:${gameId}:wordList`, 0, -1);
    // Check if user is in zone
    const lineIndex = await client.zScore(`game:${gameId}:wordLines`, user);
    const zoneIndex = await client.get(`game:${gameId}:zoneIndex`);
    
    // Check if user is in zone
    let inZone = false;

    // Check if user died (HP = 0)
    let died = false;

    if (lineIndex <= zoneIndex) {
        inZone = true;
        // Check if user is 1 line deep into zone (instakill)
        if ((zoneIndex - lineIndex) == 1) {
            // If this is a new instakill (player wasn't dead before), add a kill to the leader
            if (!died) {
                const leader = await client.get(`game:${gameId}:leader`);
                
                // Only proceed if leader exists and is not the player who died
                if (leader && leader !== user) {
                    try {
                        console.log(`Player ${user} died by instakill zone - adding kill to leader ${leader}`);
                        
                        // Check if leader kills key exists
                        const killsExist = await client.exists(`game:${gameId}:${leader}:kills`);
                        
                        if (!killsExist) {
                            // First kill for this leader
                            await client.set(`game:${gameId}:${leader}:kills`, '1');
                            console.log(`First kill recorded for ${leader} in game ${gameId} from instakill`);
                        } else {
                            // Increment existing kills counter
                            await client.incr(`game:${gameId}:${leader}:kills`);
                            const newKills = await client.get(`game:${gameId}:${leader}:kills`);
                            console.log(`Leader ${leader} now has ${newKills} kills in game ${gameId} after instakill`);
                        }
                    } catch (killError) {
                        console.error(`Error updating kills for leader ${leader} after instakill:`, killError);
                    }
                }
            }
            await client.zAdd(`game:${gameId}:hps`, [{score:0, value:user}])
        }
    }

    const hp = await client.zScore(`game:${gameId}:hps`, user);
    if (hp == '0') {
        died = true;
    }

    // Check if game should end (only one player alive)
    const alivePlayers = await client.zCount(`game:${gameId}:hps`, 1, '+inf');
    const gameActuallyEnded = alivePlayers <= 1;
    const playerIsDead = died;
    const allGamePlayers = await client.lRange(`game:${gameId}`, 0, -1);

    // Track stats for dead players without ending the game for everyone
    if (playerIsDead && !gameActuallyEnded) {
        // Check if this player's stats have been recorded already
        const playerStatsTracked = await client.get(`game:${gameId}:player:${user}:stats_tracked`);
        
        if (!playerStatsTracked) {
            // Mark this player's stats as tracked
            await client.set(`game:${gameId}:player:${user}:stats_tracked`, '1');
            
            // Record this player's game played count
            // Initialize if needed
            if (!(await client.exists(`user:${user}:games_played`))) {
                await client.set(`user:${user}:games_played`, '0');
            }
            // Increment counter
            await client.incr(`user:${user}:games_played`);
            console.log(`Incremented games_played for dead player ${user}`);
            
            // Save metrics for this player outside of game context
            try {
                // 1. Save highest WPM from this game to user's overall history
                const wpmHistoryKey = `game:${gameId}:${user}:wpm_history`;
                const wpmEntries = await r.zrevrange(wpmHistoryKey, 0, 0, 'WITHSCORES');
                let highestWpm = 0;
                if (wpmEntries.length >= 2) {
                    highestWpm = parseFloat(wpmEntries[1]); // Score is at index 1
                }
                
                // Only add to history if they actually typed (WPM > 0)
                if (highestWpm > 0) {
                    // Add highest WPM to user's overall WPM history
                    await client.zAdd(`user:${user}:wpm_history`, [{score: highestWpm, value: gameId}]);
                    console.log(`Added highest WPM (${highestWpm}) from game ${gameId} to ${user}'s overall history`);
                }
                
                // 2. Save average WPM from this game to user's average WPM history
                const avgWpm = await client.zScore(`game:${gameId}:avgWpm`, user);
                if (avgWpm && avgWpm > 0) {
                    await client.rPush(`user:${user}:avg_wpm_history`, avgWpm.toString());
                    console.log(`Added average WPM (${avgWpm}) from game ${gameId} to ${user}'s average WPM history`);
                    
                    // Update overall average WPM
                    await updateOverallAverageWpm(user);
                }
            } catch (error) {
                console.error(`Error saving game metrics for ${user}:`, error);
            }
        }
    }

    // Only 1 alive player or they died
    if (gameActuallyEnded) {
        // Get the winner (last player standing)
        const winner = await r.zrangebyscore(`game:${gameId}:hps`, 1, '+inf', 'LIMIT', 0, 1);
        const winnerUsername = winner[0];
        const isWinner = winnerUsername === user;

        // Track game completion stats - only do this once per game
        const gameStatsTracked = await client.get(`game:${gameId}:stats_tracked`);
        if (!gameStatsTracked) {
            try {
                // Mark this game as having its stats tracked to prevent duplicates
                await client.set(`game:${gameId}:stats_tracked`, '1');
                
                // Update stats for all players in the game
                for (const player of allGamePlayers) {
                    // Initialize games_played counter if it doesn't exist
                    if (!(await client.exists(`user:${player}:games_played`))) {
                        await client.set(`user:${player}:games_played`, '0');
                    }

                    // This retrieves kills directly using a single atomic operation
                    let playerKills = 0;
                    try {
                        // Using exists first to prevent trying to convert null to number
                        const killsExist = await client.exists(`game:${gameId}:${player}:kills`);
                        if (killsExist) {
                            const killsStr = await client.get(`game:${gameId}:${player}:kills`);
                            playerKills = parseInt(killsStr, 10);
                            
                            // Validate that we got a proper number
                            if (isNaN(playerKills)) {
                                console.error(`Invalid kill count for player ${player}: ${killsStr}`);
                                playerKills = 0;
                            }
                        }
                    } catch (killError) {
                        console.error(`Error retrieving kills for ${player}:`, killError);
                        // Continue with zero kills if there was an error
                    }
                    
                    // Debug logging to trace kill counts
                    console.log(`Player ${player} had ${playerKills} kills in game ${gameId}`);
                    
                    // Update total kills (initialize if doesn't exist)
                    if (!(await client.exists(`user:${player}:total_kills`))) {
                        await client.set(`user:${player}:total_kills`, '0');
                    }
                    
                    // Add this game's kills to the total
                    if (playerKills > 0) {
                        await client.incrBy(`user:${player}:total_kills`, playerKills);
                        console.log(`Added ${playerKills} kills to ${player}'s total kills`);
                        
                        // Track highest kill game
                        const highestKills = parseInt(await client.get(`user:${player}:highest_kills`) || '0');
                        if (playerKills > highestKills) {
                            await client.set(`user:${player}:highest_kills`, playerKills.toString());
                            console.log(`Updated highest kills for ${player} to ${playerKills}`);
                        }
                    }
                    
                    // Increment games played counter
                    await client.incr(`user:${player}:games_played`);
                    console.log(`Incremented games_played for ${player}`);
                }
                
                // Update winner's win count
                if (winnerUsername) {
                    // Initialize wins counter if it doesn't exist
                    if (!(await client.exists(`user:${winnerUsername}:wins`))) {
                        await client.set(`user:${winnerUsername}:wins`, '0');
                    }
                    
                    // Increment wins counter
                    await client.incr(`user:${winnerUsername}:wins`);
                    console.log(`Incremented wins for ${winnerUsername}`);
                }
            } catch (error) {
                console.error(`Error tracking game stats for game ${gameId}:`, error);
            }
        }

        // Save WPM metrics for this player if not already saved when they died
        const playerStatsTracked = await client.get(`game:${gameId}:player:${user}:stats_tracked`);
        if (!playerStatsTracked) {
            // Save metrics for this player
            await client.set(`game:${gameId}:player:${user}:stats_tracked`, '1');

            // Save metrics for this player outside of game context ***
            try {
                // 1. Save highest WPM from this game to user's overall history
                const wpmHistoryKey = `game:${gameId}:${user}:wpm_history`;
                const wpmEntries = await r.zrevrange(wpmHistoryKey, 0, 0, 'WITHSCORES');
                let highestWpm = 0;
                if (wpmEntries.length >= 2) {
                    highestWpm = parseFloat(wpmEntries[1]); // Score is at index 1
                }
                
                // Only add to history if they actually typed (WPM > 0)
                if (highestWpm > 0) {
                    // Add highest WPM to user's overall WPM history
                    await client.zAdd(`user:${user}:wpm_history`, [{score: highestWpm, value: gameId}]);
                    console.log(`Added highest WPM (${highestWpm}) from game ${gameId} to ${user}'s overall history`);
                }
                
                // 2. Save average WPM from this game to user's average WPM history
                const avgWpm = await client.zScore(`game:${gameId}:avgWpm`, user);
                if (avgWpm && avgWpm > 0) {
                    await client.rPush(`user:${user}:avg_wpm_history`, avgWpm.toString());
                    console.log(`Added average WPM (${avgWpm}) from game ${gameId} to ${user}'s average WPM history`);
                    
                    // Update overall average WPM
                    await updateOverallAverageWpm(user);
                }
            } catch (error) {
                console.error(`Error saving game metrics for ${user}:`, error);
            }
        }
        
        return res.json({ 
            gameOver: true,
            winner: winner[0],
            isWinner: isWinner,
            success: true, playerHps: playerHps, playerWordLines: playerWordLines, playerWpm: playerWpm,
            wordList: wordList, hp: hp, inZone: inZone, died: died, leader: leader[0], isLeader: isLeader
        });
    } 
    return res.json({ success: true, playerHps: playerHps, playerWordLines: playerWordLines, playerWpm: playerWpm, wordList: wordList, hp: hp, inZone: inZone, died: died, leader: leader[0], isLeader: isLeader });
})

// Updates current leader in game
app.post('/updateleader', async (req, res) => {
    const { gameId, currentLineIndex, leader } = req.body;

    // Add the new words to the game
    try {
        // Use a transaction to make updates atomic
        await r.multi()
        .set(`game:${gameId}:leader`, leader)
        .set(`game:${gameId}:zoneIndex`, currentLineIndex - 2)
        .exec();

        // Generate 10 new random words quickly and atomically using Lua script
        const luaScript = `
          local gameKey = KEYS[1]
        
          -- Generate 10 new random words
          local newWords = redis.call('SRANDMEMBER', 'wordBank', 10)
        
          -- Add words to the game's word list
          for i, word in ipairs(newWords) do
          redis.call('RPUSH', gameKey, word)
          end
        
          return #newWords
        `

        // Execute the Lua script with Redis
        const wordCount = await r.eval(
            luaScript,
            1,                         // Number of keys
            `game:${gameId}:wordList`  // Key #1
          );
          
        console.log(`Successfully added ${wordCount} words to game ${gameId}`);
        return res.json({ success: true });
    } catch (error) {
        console.error(`Error adding words to Redis: ${error}`);
        return res.json({ success: false, message: "Error adding words" });
    }
});

// Gets leader kills
app.post('/getleaderkills', async (req, res) => {
    const { gameId, leader } = req.body;
    
    try {
        // First check if the key exists to avoid parsing null
        const killsExist = await client.exists(`game:${gameId}:${leader}:kills`);
        
        let kills = 0;
        if (killsExist) {
            const killsStr = await client.get(`game:${gameId}:${leader}:kills`);
            kills = parseInt(killsStr, 10);
            
            // Validate that we got a proper number
            if (isNaN(kills)) {
                console.error(`Invalid kill count for leader ${leader}: ${killsStr}`);
                kills = 0;
            }
        }
        
        return res.json({ success: true, kills: kills });
    } catch (error) {
        console.error(`Error getting kills for ${leader}:`, error);
        return res.json({ success: true, kills: 0 });  // Return 0 on error as a fallback
    }
});

// Updates wpm of player
app.post('/updatewpm', async (req, res) => {
    const { gameId, user, currentWPM } = req.body;
    
    if (!gameId || !user) {
        return res.json({ success: false, message: "Missing gameId or user" });
    }
    
    try {
        // Update the player's WPM values in Redis
        await client.zAdd(`game:${gameId}:wpm`, [{score: currentWPM, value: user}]);
        const timestamp = Date.now();
        const wpmHistoryKey = `game:${gameId}:${user}:wpm_history`;
        await client.zAdd(wpmHistoryKey, [{score: currentWPM, value: `${currentWPM}_${timestamp}`}]);

        // Get all WPM values from history to calculate average
        const wpmHistory = await r.zrange(wpmHistoryKey, 0, -1, 'WITHSCORES');

        // Calculate average WPM
        let totalWpm = 0;
        let count = 0;
        
        // Process the flat array - every other element is a score
        for (let i = 1; i < wpmHistory.length; i += 2) {
            totalWpm += parseFloat(wpmHistory[i]);
            count++;
        }

        const averageWpm = count > 0 ? Math.round(totalWpm / count) : 0;
        await client.zAdd(`game:${gameId}:avgWpm`, [{score: averageWpm, value: user}]);
        
        return res.json({ success: true, averageWPM: averageWpm });
    } catch (error) {
        console.error('Error updating WPM:', error);
        return res.json({ success: false, message: "Error updating WPM" });
    }
});

// When user leaves game by clicking button or closing tab
app.post('/leavegame', async (req, res) => {
    const { gameId, user } = req.body;
    console.log("Leaving game - gameId:", gameId, "user:", user);

    // Save user's metrics before doing any removal from Redis database
    try {
        //Get all players before removing the leaving player
        const allPlayers = await client.lRange(`game:${gameId}`, 0, -1);

        // Check if the leaving player's stats have already been tracked
        const playerStatsTracked = await client.get(`game:${gameId}:player:${user}:stats_tracked`);
        
        // If stats haven't been tracked yet, track them now for the leaving player
        if (!playerStatsTracked) {
            // Mark this player's stats as tracked
            await client.set(`game:${gameId}:player:${user}:stats_tracked`, '1');
            
            // Record this player's game played count (counts as a forfeit/loss)
            // Initialize if needed
            if (!(await client.exists(`user:${user}:games_played`))) {
                await client.set(`user:${user}:games_played`, '0');
            }
            // Increment games played counter
            await client.incr(`user:${user}:games_played`);
            console.log(`Incremented games_played for ${user} who left the game (forfeit)`);
            
            // Save WPM metrics for this player
            try {
                // 1. Save highest WPM from this game to user's overall history
                const wpmHistoryKey = `game:${gameId}:${user}:wpm_history`;
                const wpmEntries = await r.zrevrange(wpmHistoryKey, 0, 0, 'WITHSCORES');
                let highestWpm = 0;
                if (wpmEntries.length >= 2) {
                    highestWpm = parseFloat(wpmEntries[1]); // Score is at index 1
                }
                
                // Only add to history if they actually typed (WPM > 0)
                if (highestWpm > 0) {
                    // Add highest WPM to user's overall WPM history
                    await client.zAdd(`user:${user}:wpm_history`, [{score: highestWpm, value: gameId}]);
                    console.log(`Added highest WPM (${highestWpm}) from game ${gameId} to ${user}'s overall history`);
                }
                
                // 2. Save average WPM from this game to user's average WPM history
                const avgWpm = await client.zScore(`game:${gameId}:avgWpm`, user);
                if (avgWpm && avgWpm > 0) {
                    await client.rPush(`user:${user}:avg_wpm_history`, avgWpm.toString());
                    console.log(`Added average WPM (${avgWpm}) from game ${gameId} to ${user}'s average WPM history`);
                    
                    // Update overall average WPM
                    await updateOverallAverageWpm(user);
                }
            } catch (error) {
                console.error(`Error saving game metrics for ${user} who left the game:`, error);
            }
        }

        // 1. Remove user from the main players list
        await client.lRem(`game:${gameId}`, 0, user);
        
        // 2. Remove user from HP tracking sorted set
        await client.zRem(`game:${gameId}:hps`, user);
        
        // 3. Remove user from word lines (progress) tracking sorted set
        await client.zRem(`game:${gameId}:wordLines`, user);

        // Also remove WPM data
        await client.zRem(`game:${gameId}:wpm`, user);
        await r.del(`game:${gameId}:${user}:wpm_history`);
        
        // 4. Add a kill to leader (only if there is a leader)
        const leader = await client.get(`game:${gameId}:leader`);
        if (leader && leader !== user) {  // Make sure leader exists and is not the same as the leaving player
            try {
                // Check if leader kills key exists
                const killsExist = await client.exists(`game:${gameId}:${leader}:kills`);
                
                if (!killsExist) {
                    // First kill for this leader
                    await client.set(`game:${gameId}:${leader}:kills`, '1');
                    console.log(`First kill recorded for ${leader} in game ${gameId} when ${user} left`);
                } else {
                    // Increment existing kills counter
                    await client.incr(`game:${gameId}:${leader}:kills`);
                    const newKills = await client.get(`game:${gameId}:${leader}:kills`);
                    console.log(`Leader ${leader} now has ${newKills} kills in game ${gameId} after ${user} left`);
                }
            } catch (killError) {
                console.error(`Error updating kills for leader ${leader}:`, killError);
                // Continue execution even if this fails
            }
        }

        // If there's no leader yet (early game), award a kill to ALL remaining players
        else if (!leader) {
            console.log(`No leader established yet. Awarding kill to all remaining players for ${user} leaving`);
            
            // Loop through all players and award a kill to each (except the leaving player)
            for (const player of allPlayers) {
                // Skip the player who's leaving
                if (player === user) continue;
                
                try {
                    // Check if player's kills key exists
                    const killsExist = await client.exists(`game:${gameId}:${player}:kills`);
                    
                    if (!killsExist) {
                        // First kill for this player
                        await client.set(`game:${gameId}:${player}:kills`, '1');
                        console.log(`First kill recorded for ${player} in game ${gameId} when ${user} left (early game)`);
                    } else {
                        // Increment existing kills counter
                        await client.incr(`game:${gameId}:${player}:kills`);
                        const newKills = await client.get(`game:${gameId}:${player}:kills`);
                        console.log(`Player ${player} now has ${newKills} kills in game ${gameId} after ${user} left (early game)`);
                    }
                } catch (killError) {
                    console.error(`Error updating kills for player ${player}:`, killError);
                }
            }
        }
        
        // 5. Check if this was the leader who left
        if (user === leader) {
            // Find new leader (player with highest word line score)
            const players = await r.zrevrange(`game:${gameId}:wordLines`, 0, 0);
            if (players.length > 0) {
                const newLeader = players[0];
                await client.set(`game:${gameId}:leader`, newLeader);
                console.log(`New leader set to ${newLeader} after ${user} left`);
            }
        }
        
        return res.json({ success: true, message: "Successfully left the game" });
    } catch (error) {
        console.error("Error while leaving game:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("Stack trace:", error.stack);
        return res.json({ success: false, message: "Error leaving game" });
    }
});

// When user leaves queue by clicking button or closing tab
app.post('/leavequeue', async (req, res) => {
    const { queueId, user } = req.body;
    
    // Handle missing queue ID or username
    if (!queueId || !user) {
        return res.json({ success: false, message: "Missing queueId or user" });
    }
    
    try {
        // Key for queue in Redis
        const queue = `queue:${queueId}`;
        
        // Remove user from the queue
        const removed = await client.zRem(queue, user);
        
        if (removed) {
            // Get updated queue size and ready size
            const queueSize = await client.zCard(queue);
            const readySize = await client.zCount(queue, 1, 1);
            
            console.log(`User ${user} removed from queue ${queueId}. Remaining: ${queueSize} players, ${readySize} ready`);
            
            // If queue is now empty, clean up queue resources
            if (queueSize === 0) {
                await client.del(queue);
                await client.del(`queue:${queueId}:lastReady`);
                await client.del(`queue:${queueId}:locked`);
                console.log(`Queue ${queueId} deleted as it's now empty`);
            }
            
            return res.json({ 
                success: true, 
                message: "Successfully left queue",
                queueSize: queueSize,
                readySize: readySize
            });
        } else {
            console.log(`User ${user} not found in queue ${queueId}`);
            return res.json({ success: false, message: "User not found in queue" });
        }
    } catch (error) {
        console.error('Error leaving queue:', error);
        return res.json({ success: false, message: "Error leaving queue" });
    }
});

// Get all player stats in one call
app.get('/userstats', requireLogin, async (req, res) => {
    const username = req.session.user;
    
    try {
        // Get WPM history
        const wpmEntries = await r.zrevrange(`user:${username}:wpm_history`, 0, 0, 'WITHSCORES');
        let highestWpm = 0;
        if (wpmEntries.length >= 2) {
            highestWpm = parseFloat(wpmEntries[1]); // Score is at index 1
        }
        
        // Get overall average WPM
        const overallAvgWpm = await client.get(`user:${username}:overall_avg_wpm`) || "0";
        
        // Get games played and wins
        const gamesPlayed = await client.get(`user:${username}:games_played`) || "0";
        const wins = await client.get(`user:${username}:wins`) || "0";
        
        // Calculate losses and win percentage
        const gamesPlayedNum = parseInt(gamesPlayed);
        const winsNum = parseInt(wins);
        const losses = gamesPlayedNum - winsNum;
        const winPercentage = gamesPlayedNum > 0 ? Math.round((winsNum / gamesPlayedNum) * 100) : 0;

        // Get kills statistics
        const totalKills = await client.get(`user:${username}:total_kills`) || "0";
        const highestKills = await client.get(`user:${username}:highest_kills`) || "0";
        
        return res.json({
            success: true,
            highestWpm: highestWpm,
            averageWpm: parseInt(overallAvgWpm),
            totalGamesPlayed: gamesPlayedNum,
            wins: winsNum,
            losses: losses,
            winPercentage: winPercentage,
            totalKills: parseInt(totalKills),
            highestKills: parseInt(highestKills)
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return res.json({ success: false, message: "Error fetching user stats" });
    }
});


// Start server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Running on PORT 3000');
});