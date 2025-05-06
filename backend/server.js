// Backend

// Imports
const redis = require('redis');
const cors = require('cors');
const express = require('express');
const session = require('express-session');

// Initialize express
const app = express();

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
        // local host for now, maybe VM IP later
        host: '34.173.23.63',
        port: 6379
    },
    password: '5Xr9!fH2s@Dp7t$kQb8yP0zLwE#Vg3zR'
});

// Connect to Redis
client.connect()
    .then(() => {
        console.log('Connected to Redis');

        // Ping to verify
        return client.ping();
    })
    .then(res => {
        console.log('Redis response:', res);
    })
    .catch(err => {
        console.error('Redis connection error:', err);
});


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
    
    if (!displayName) {
        return res.json({ success: false, message: "Display name cannot be empty" });
    }
    
    try {
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
        
        // Set new email
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
    
    if (!currentPassword || !newPassword) {
        return res.json({ success: false, message: "Current and new password are required" });
    }
    
    try {
        // Verify current password
        const storedPassword = await client.get(`user:${username}`);
        if (storedPassword !== currentPassword) {
            return res.json({ success: false, message: "Current password is incorrect" });
        }
        
        // Update password
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
                // Check if new email is already registered to another user
                const existingEmail = await client.get(`email:${email}`);
                if (existingEmail && existingEmail !== username) {
                    return res.json({ success: false, message: "Email already registered to another account" });
                }
                
                // Remove old email mapping
                if (oldEmail) {
                    await client.del(`email:${oldEmail}`);
                }
                
                // Set new email
                await client.set(`user:${username}:email`, email);
                await client.set(`email:${email}`, username);
            }
        }
        
        // Update password if both current and new are provided
        if (currentPassword && newPassword) {
            // Verify current password
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
        res.clearCookie('connect.sid');
        console.log('Log out successful');
        return res.json({ success: true, message: "Log out successful"});
    })
});


// GAME ENDPOINTS

// Enter queue endpoint
app.post('/enterqueue', async (req, res) => {
    // Retrieve current global lobby ID counter from Redis
    let queueId = await client.get('queue:counter');

    // Global queue ID doesn't exist
    if (!queueId) {
        // Setting new queue:counter to 1000
        console.log("Setting new queue:counter to 1000 in Redis");
        await client.set('queue:counter', 1000);
        queueId = await client.get('queue:counter');
    }

    // Key for queue
    const queue = `queue:${queueId}`

    // Enter queue
    const user = req.session.user;
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
    const { queueId } = req.body;

    // Keys for user and queue in Redis database
    const user = req.session.user;
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


// Last ready endpoint (to check which player starts the game)
// app.get('/lastready', async (req, res) => {
//     // Get current queueId
//     const queueId = await client.get("queue:counter");

//     // Get lastReady from that queueId
//     const userLastReady = await client.get(`queue:${queueId}:lastready`);

//     // Game ID is set to current Queue ID
//     return res.json({ success: true, lastReady: userLastReady, gameId: queueId});
// })


// User endpoint (get user)
app.get('/user', (req, res) => {
    const user = req.session.user;
    return res.json({ success:true, user: user});
})


// Start game endpoint (only for last readied player)
app.post('/startgame', async (req, res) => {
    // Get gameId and wordList from last readied player
    const { wordList } = req.body;

    const userLastReady = await client.get(`queue:${queueId}:lastready`);
    if (userLastReady == req.session.user) {
        // Get all players from queue
        const players = await client.zRange(`queue:${gameId}`, 0, -1);
        // Add each player to a new game in Redis database
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            // Push player to list of players
            await client.lPush(`game:${gameId}`, player);
            // Push player to sorted set for player HPs (starting HP is 5)
            await client.zAdd(`game:${gameId}:hps`, [{score: 5, value: player}]);
            // Create sorted set for player word count (starting wordCount is 0)
            await client.zAdd(`game:${gameId}:wordLines`, [{score: 0, value: player}]);
            
        }
        // Create word list
        console.log(wordList);
        for (let i = 0; i < wordList.length; i++ ) {
            await client.rPush(`game:${gameId}:wordList`, wordList[i]);
        }

        // Set zoneIndex to 0
        await client.set(`game:${gameId}:zoneIndex`, -2);
        

        // Set game:<gameId>:ready to 1 after creating game, for other users to join game
        await client.set(`game:${gameId}:ready`, 1);
        return res.json({success: true});
    }
    else {
        return res.json({ success: false});
    }
    

})

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

app.post('/updategame', async (req, res) => {
    const { gameId, hp, currentLineIndex } = req.body;
    const user = req.session.user;

    // Set new currentLineIndex for this player, in case it's updated
    await client.zAdd(`game:${gameId}:wordLines`, [{score: currentLineIndex, value: user}]);

    // Check if player is in zone
    const lineIndex = await client.zScore(`game:${gameId}:wordLines`, user);
    const zoneIndex = await client.get(`game:${gameId}:zoneIndex`);
    if (lineIndex <= zoneIndex) {
        // Subtract from user HP
        const newHp = hp - 1;
        await client.zAdd(`game:${gameId}:hps`, [{score: newHp, value: user}]);

        // If player died (HP is 0)
        if (newHp == 0) {
            // Add a kill to leader
            const leader = await client.get(`game:${gameId}:leader`);
            const kills = await client.get(`game:${gameId}:${leader}:kills`);
            if (kills == null) {
                await client.set(`game:${gameId}:${leader}:kills`, 1);
            }
            else {
                await client.incr(`game:${gameId}:${leader}:kills`);
            }
        }
    }



})

    


// Update game endpoint (each user uses this to update their status in game)
// app.post('/updategame', async (req, res) => {
//     // Only leading player will add zone words and new words
//     const { hp, wordCount, newWords, newZoneWords } = req.body;
//     const { gameId } = req.body;
//     const user = req.session.user;

//     // Update HP in Redis database
//     await client.zAdd(`game:${gameId}:hps`, [{score: hp, value: user}])
//     // Update wordcount in Redis database
//     await client.zAdd(`game:${gameId}:wordCounts`, [{score: wordCount, value: user}])
//     // Update wordList in Redis database
//     for (let i = 0; i < newWords.length; i++ ) {
//         await client.rPush(`game:${gameId}:wordList`, newWords[i]);
//     }
//     // Update zoneList in Redis database
//     for (let i = 0; i < newZoneWords.length; i++ ) {
//         await client.rPush(`game:${gameId}:zoneList`, newZoneWords[i]);
//     }
//     // If player's HP is 0, add them to the list of eliminated players
//     if (hp == 0) {
//         await client.rPush(`game:${gameId}:eliminated`, user);
//     }


// })

// Fetch game endpoint (each user uses this to update their display of other users' status)
app.post('/fetchgame', async (req, res) => {
    const { gameId } = req.body;
    const user = req.session.user;

    // Get player HPs with scores (ascending order)
    const playerHps = await client.zRange(`game:${gameId}:hps`, 0, -1, {WITHSCORES: true});
    // Get player word lines with scores (ascending order)
    const playerWordLines = await client.zRange(`game:${gameId}:wordLines`, 0, -1, {WITHSCORES: true});
    // Get word list
    const wordList = await client.lRange(`game:${gameId}:wordList`, 0, -1);
    // Check if user is in zone
    const lineIndex = await client.zScore(`game:${gameId}:wordLines`, user);
    const zoneIndex = await client.get(`game:${gameId}:zoneIndex`);
    let inZone = false;
    if (lineIndex <= zoneIndex) {
        inZone = true;
    }
    // Check if user died (HP = 0)
    let died = false;
    const hp = await client.zScore(`game:${gameId}:hps`, user);
    if (hp == '0') {
        died = true;
    }

    //console.log("word list:" + wordList)
    return res.json({ success: true, playerHps: playerHps, playerWordLines: playerWordLines, 
        wordList: wordList, hp:hp, inZone: inZone, died: died });

})


// Gets zone list from database
// app.post('/getzonelist', async (req, res) => {
//     const { gameId } = req.body;
    
//     // Get zone list
//     const zoneList = await client.lRange(`game:${gameId}:zoneList`, 0, -1);
    
//     return res.json({ success: true, zoneList: zoneList });
// });

// Checks zone list from database
// app.post('/checkzone', async (req, res) => {
//     const { gameId, currentWord } = req.body;
//     const user = req.session.user;
    
//     // Get zone list
//     const zoneList = await client.lRange(`game:${gameId}:zoneList`, 0, -1);
    
//     // Check if current word is in zone
//     const inZone = zoneList.includes(currentWord);
    
//     if (inZone) {
//         // Get current HP
//         const playerHp = await client.zScore(`game:${gameId}:hps`, user);
        
//         // Decrement HP if in zone
//         if (playerHp > 0) {
//             await client.zAdd(`game:${gameId}:hps`, [{score: playerHp - 1, value: user}]);
            
//             // If HP is now 0, add to eliminated list
//             if (playerHp - 1 <= 0) {
//                 await client.rPush(`game:${gameId}:eliminated`, user);
                
//                 // Add kill to leader's score
//                 // Get player with highest word count
//                 const leader = await client.zRange(`game:${gameId}:wordLines`, 0, 0, {REV: true});
//                 // If such player exists
//                 if (leader.length > 0) {
//                     const leaderKills = await client.get(`game:${gameId}:${leader[0]}:kills`) || 0;
//                     await client.set(`game:${gameId}:${leader[0]}:kills`, parseInt(leaderKills) + 1);
//                 }
//             }
            
//             return res.json({ 
//                 success: true, 
//                 inZone: true, 
//                 newHp: playerHp - 1 
//             });
//         }
//     }
    
//     return res.json({ success: true, inZone: inZone });
// });

// Updates current leader in game
app.post('/updateleader', async (req, res) => {
    const { gameId, currentLineIndex, newWords } = req.body;
    const user = req.session.user;

    // Set new leader
    await client.set(`game:${gameId}:leader`, user);
    // Set new zone index
    const zoneIndex = currentLineIndex - 2;
    await client.set(`game:${gameId}:zoneIndex`, zoneIndex);

    // Update wordList with new words
    for (let i = 0; i < newWords.length; i++) {
        await client.rPush(`game:${gameId}:wordList`, newWords[i]);
    }

});


// app.post('/updateleader', async (req, res) => {
//     const { gameId, wordCount } = req.body;
//     const user = req.session.user;
    
//     // Update this player's word count
//     await client.zAdd(`game:${gameId}:wordCounts`, [{score: wordCount, value: user}]);
    
//     // Check if this player is the leader
//     const playerWordCounts = await client.zRange(`game:${gameId}:wordCounts`, 0, -1, {
//         REV: true, 
//         WITHSCORES: true
//     });
    
//     let isLeader = false;
//     let leaderScore = 0;
    
//     // Check if this player has the highest score
//     if (playerWordCounts.length >= 2 && playerWordCounts[0] === user) {
//         isLeader = true;
//         leaderScore = parseInt(playerWordCounts[1]);
//     }
    
//     // If player is leader, update zone
//     if (isLeader) {
//         // Calculate zone size based on milestones
//         let zoneGap = 9; // Start with 9 words behind (at milestone 10)
        
//         // Reduce zone gap by 1 every 10 words after the first 10
//         if (wordCount > 10) {
//             const milestonesPassed = Math.floor((wordCount - 10) / 10);
//             zoneGap = Math.max(1, 9 - milestonesPassed);
//         }
        
//         // Calculate the zone position (leader position - gap)
//         const zonePosition = Math.max(0, wordCount - zoneGap);
        
//         // Get all words up to zonePosition
//         const wordList = await client.lRange(`game:${gameId}:wordList`, 0, zonePosition - 1);
        
//         // Clear the existing zone list
//         await client.del(`game:${gameId}:zoneList`);
        
//         // Add all words up to zonePosition to zone list
//         if (wordList.length > 0) {
//             await client.rPush(`game:${gameId}:zoneList`, ...wordList);
//         }
        
//         return res.json({ 
//             success: true, 
//             isLeader: true, 
//             zonePosition: zonePosition, 
//             zoneGap: zoneGap
//         });
//     }
    
//     return res.json({ success: true, isLeader: false });
// });

// Gets leader kills
app.post('/getleaderkills', async (req, res) => {
    const { gameId } = req.body;
    const user = req.session.user;
    
    const kills = await client.get(`game:${gameId}:${user}:kills`) || 0;
    
    return res.json({ success: true, kills: parseInt(kills) });
});


// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Running on PORT 3000');
});